import json
import logging
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.models import Facture, MouvementCaisse
from api.services import verify_kkiapay_transaction, finalize_paid_facture

logger = logging.getLogger(__name__)


def _extract_kkiapay_metadata(source):
    if not source:
        return {}

    raw_value = source.get('state') or source.get('data')
    if not raw_value:
        return {}

    if isinstance(raw_value, dict):
        return raw_value

    if isinstance(raw_value, str):
        try:
            parsed = json.loads(raw_value)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return {}

    return {}


def _extract_invoice_id(source):
    return _extract_kkiapay_metadata(source).get('invoice_id')

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
    kkiapay_tx = verify_kkiapay_transaction(transaction_id) or {}

    status_value = str(
        kkiapay_tx.get('status')
        or kkiapay_tx.get('transactionStatus')
        or kkiapay_tx.get('paymentStatus')
        or ''
    ).strip().upper()

    if not kkiapay_tx or status_value not in ('SUCCESSFULL', 'SUCCESS', 'SUCCESSFUL', 'SUCCEEDED', 'PAID', 'APPROVED'):
        logger.warning(f"[WEBHOOK KKIAPAY] Transaction non valide ou introuvable : {transaction_id}")
        return Response({
            'error': 'Transaction invalide',
            'detail': f"Statut Kkiapay: {status_value or 'INCONNU'}",
        }, status=status.HTTP_400_BAD_REQUEST)

    montant = Decimal(str(
        kkiapay_tx.get('amount')
        or kkiapay_tx.get('montant')
        or kkiapay_tx.get('totalAmount')
        or kkiapay_tx.get('paidAmount')
        or 0
    ))
    if montant <= 0:
        return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)

    # Récupérer les métadonnées depuis les données custom de Kkiapay (state ou data).
    # Le frontend envoie data: JSON.stringify({ invoice_id, demande_normalisation }).
    kkiapay_metadata = _extract_kkiapay_metadata(kkiapay_tx)
    payload_metadata = _extract_kkiapay_metadata(payload)
    invoice_id = (
        kkiapay_metadata.get('invoice_id')
        or payload_metadata.get('invoice_id')
        or payload.get('invoice_id')
    )

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

    facture = finalize_paid_facture(
        facture,
        montant_enregistre,
        transaction_id,
        client=facture.reparation.vehicule.client,
        demande_normalisation=bool(
            kkiapay_metadata.get('demande_normalisation')
            or payload_metadata.get('demande_normalisation')
            or payload.get('demande_normalisation', False)
        ),
        request_user=None,
    )

    logger.info(f"[WEBHOOK KKIAPAY] Paiement de la facture {invoice_id} validé avec succès.")
    return Response({'status': 'SUCCESS'}, status=status.HTTP_200_OK)
