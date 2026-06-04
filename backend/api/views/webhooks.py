import json
import logging
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.models import Facture, MouvementCaisse, NotificationStaff
from api.services import verify_kkiapay_transaction, generate_emecef_invoice

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def kkiapay_webhook(request):
    """
    Webhook appelé par Kkiapay après chaque transaction.
    Garantit que la facture est soldée même si le client quitte la page.
    """
    payload = request.data
    logger.info(f"[WEBHOOK KKIAPAY] Réception payload: {payload}")

    transaction_id = payload.get('transactionId')
    
    if not transaction_id:
        return Response({'error': 'transactionId manquant'}, status=status.HTTP_400_BAD_REQUEST)

    # Toujours interroger Kkiapay pour éviter l'usurpation (Spoofing)
    kkiapay_tx = verify_kkiapay_transaction(transaction_id)
    
    if not kkiapay_tx or kkiapay_tx.get('status') not in ('SUCCESSFULL', 'SUCCESS'):
        logger.warning(f"[WEBHOOK KKIAPAY] Transaction non valide ou introuvable : {transaction_id}")
        return Response({'error': 'Transaction invalide'}, status=status.HTTP_400_BAD_REQUEST)

    montant = Decimal(str(kkiapay_tx.get('amount', 0)))
    if montant <= 0:
        return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)

    # Récupérer l'ID de la facture depuis les données custom de Kkiapay (state ou data)
    # Le frontend envoie: data: JSON.stringify({ invoice_id: invoice.id })
    invoice_id = None
    state_str = kkiapay_tx.get('state') or payload.get('state')
    
    if state_str:
        try:
            state_data = json.loads(state_str)
            invoice_id = state_data.get('invoice_id')
        except json.JSONDecodeError:
            pass

    if not invoice_id:
        logger.error(f"[WEBHOOK KKIAPAY] Impossible d'identifier la facture pour la TX: {transaction_id}")
        return Response({'error': 'invoice_id introuvable dans state'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        facture = Facture.objects.get(id=invoice_id)
    except Facture.DoesNotExist:
        logger.error(f"[WEBHOOK KKIAPAY] Facture {invoice_id} introuvable.")
        return Response({'error': 'Facture introuvable'}, status=status.HTTP_404_NOT_FOUND)

    # Éviter de traiter deux fois la même transaction si le frontend est passé avant
    if MouvementCaisse.objects.filter(description__contains=transaction_id).exists():
        logger.info(f"[WEBHOOK KKIAPAY] Transaction {transaction_id} déjà traitée.")
        return Response({'status': 'ALREADY_PROCESSED'}, status=status.HTTP_200_OK)

    if facture.statut_paiement == 'SOLDE':
        return Response({'status': 'ALREADY_PAID'}, status=status.HTTP_200_OK)

    # Sécurité : empêcher le montant payé de dépasser le total
    reste_a_payer = facture.total_ttc - facture.montant_paye
    if montant > reste_a_payer:
        logger.warning(f"[WEBHOOK KKIAPAY] Surplus ignoré: payé {montant}, reste {reste_a_payer}")
        montant_enregistre = reste_a_payer
    else:
        montant_enregistre = montant

    # Valider le paiement
    with transaction.atomic():
        facture.montant_paye += montant_enregistre
        facture.mode_paiement = 'KKIAPAY'
        facture.statut_paiement = 'SOLDE' if facture.montant_paye >= facture.total_ttc else 'PARTIEL'
        facture.save()

        MouvementCaisse.objects.create(
            type_mouvement='RECETTE',
            categorie='RECETTE_CLIENT',
            montant=montant_enregistre,
            description=f"Paiement Kkiapay — Facture {facture.numero_facture or facture.id} (TX: {transaction_id})",
            facture=facture,
            date_mouvement=timezone.now().date(),
            utilisateur=None  # Automatique
        )

        NotificationStaff.objects.create(
            type='PAIEMENT_RECU',
            message=f"Paiement Kkiapay (Webhook) de {montant_enregistre:,.0f} F reçu pour la facture {facture.numero_facture or facture.id}."
        )

        from api.services import valider_et_normaliser_facture
        if facture.statut_paiement == 'SOLDE':
            facture = valider_et_normaliser_facture(facture)

    logger.info(f"[WEBHOOK KKIAPAY] Paiement de la facture {invoice_id} validé avec succès.")
    return Response({'status': 'SUCCESS'}, status=status.HTTP_200_OK)
