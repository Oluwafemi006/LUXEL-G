"""Facturation : Factures et Devis."""
import logging
from django.core import signing
from ._imports import *

logger = logging.getLogger(__name__)
DOCUMENT_SHARE_SALT = 'luxel-g-document-share'


def _make_document_token(doc_type, object_id):
    return signing.dumps({'type': doc_type, 'id': object_id}, salt=DOCUMENT_SHARE_SALT)


def _check_document_token(token, doc_type, object_id):
    try:
        data = signing.loads(token, salt=DOCUMENT_SHARE_SALT, max_age=60 * 60 * 24 * 30)
    except signing.BadSignature:
        return False
    return data.get('type') == doc_type and str(data.get('id')) == str(object_id)


class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.all().order_by('-date_creation')
    serializer_class = FactureSerializer
    permission_classes = [IsStaffMember]

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        facture = self.get_object()
        if facture.type == 'DEFINITIVE':
            return Response({'error': 'Facture déjà validée'}, status=status.HTTP_400_BAD_REQUEST)

        for piece in facture.reparation.pieces.select_related('article_stock').all():
            if piece.article_stock and piece.article_stock.quantite < piece.quantite:
                return Response(
                    {'error': f"Stock insuffisant pour '{piece.article_stock.nom}' : "
                              f"{piece.article_stock.quantite} disponible(s), {piece.quantite} requise(s)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        with transaction.atomic():
            year = timezone.now().year
            last_invoice = (
                Facture.objects.filter(numero_facture__startswith=f"FAC-{year}")
                .select_for_update().order_by('-numero_facture').first()
            )
            if last_invoice and last_invoice.numero_facture:
                try:
                    last_num = int(last_invoice.numero_facture.split('-')[-1])
                    count = last_num + 1
                except (ValueError, IndexError):
                    count = Facture.objects.filter(type='DEFINITIVE').count() + 1
            else:
                count = Facture.objects.filter(type='DEFINITIVE').count() + 1

            facture.numero_facture = f"FAC-{year}-{count:04d}"
            facture.type = 'DEFINITIVE'
            facture.date_validation = timezone.now()
            facture.save()

            for piece in facture.reparation.pieces.select_related('article_stock').all():
                if piece.article_stock:
                    stock_item = piece.article_stock
                    stock_item.quantite = max(0, stock_item.quantite - piece.quantite)
                    stock_item.save()
                    MouvementStock.objects.create(
                        article=stock_item, type_mouvement='SORTIE', quantite=piece.quantite,
                        description=f"Sortie auto — Facture {facture.numero_facture}",
                        utilisateur=request.user if request.user.is_authenticated else None
                    )
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['post'])
    def enregistrer_paiement(self, request, pk=None):
        facture = self.get_object()
        montant = Decimal(str(request.data.get('montant', 0)))

        MODE_VALIDES = ['ESPECE', 'MOMOPAY', 'VIREMENT', 'CHEQUE', 'AUTRE']
        mode_paiement = request.data.get('mode_paiement', '').upper()
        if not mode_paiement or mode_paiement not in MODE_VALIDES:
            return Response(
                {'error': f"Mode de paiement invalide. Valeurs acceptées : {', '.join(MODE_VALIDES)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if mode_paiement == 'CHEQUE' and not request.data.get('numero_cheque'):
            return Response({'error': 'Le numéro de chèque est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)
        if mode_paiement == 'VIREMENT' and not request.data.get('reference_virement'):
            return Response({'error': 'La référence de virement est obligatoire.'}, status=status.HTTP_400_BAD_REQUEST)

        if facture.total_ttc <= 0:
            facture.statut_paiement = 'SOLDE'
            facture.save()
            return Response(FactureSerializer(facture).data)

        if montant <= 0 or montant > (facture.total_ttc - facture.montant_paye):
            return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)

        total_apres = facture.montant_paye + montant
        seuil_75 = facture.total_ttc * Decimal('0.75')
        if total_apres < seuil_75:
            return Response(
                {'error': f'Minimum 75% requis ({seuil_75:,.0f} FCFA).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        facture.montant_paye += montant
        facture.mode_paiement = mode_paiement
        facture.numero_cheque = request.data.get('numero_cheque') or None
        facture.reference_virement = request.data.get('reference_virement') or None
        facture.statut_paiement = 'SOLDE' if facture.montant_paye >= facture.total_ttc else 'PARTIEL'
        facture.save()

        reparation = facture.reparation
        if reparation.statut == 'EN_ATTENTE':
            reparation.statut = 'EN_COURS'
            reparation.save()

        MouvementCaisse.objects.create(
            type_mouvement='RECETTE', categorie='RECETTE_CLIENT', montant=montant,
            description=f"Paiement {facture.numero_facture}", facture=facture,
            date_mouvement=timezone.now().date(),
            utilisateur=request.user if request.user.is_authenticated else None
        )
        NotificationStaff.objects.create(
            type='PAIEMENT_RECU',
            message=f"Paiement de {montant:,.0f} F reçu pour la facture {facture.numero_facture}."
        )
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['post'])
    def relancer_paiement(self, request, pk=None):
        facture = self.get_object()
        client = facture.reparation.vehicule.client
        reste = facture.total_ttc - facture.montant_paye
        NotificationClient.objects.create(
            client=client, type='FACTURE_ENVOYEE',
            message=f"Rappel : Un solde de {reste:,.0f} F est en attente pour la facture {facture.numero_facture or 'en cours'}."
        )
        return Response({'message': f'Relance envoyée à {client.nom}.'})

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        facture = self.get_object()
        pdf = generate_document_pdf(facture, doc_type="FACTURE")
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Facture_{facture.numero_facture}.pdf"'
        return response

    @action(detail=True, methods=['get'])
    def share_link(self, request, pk=None):
        facture = self.get_object()
        token = _make_document_token('FACTURE', facture.id)
        url = request.build_absolute_uri(f'/api/factures/{facture.id}/public_pdf/?token={token}')
        return Response({'url': url})

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def public_pdf(self, request, pk=None):
        facture = self.get_object()
        token = request.query_params.get('token', '')
        if not _check_document_token(token, 'FACTURE', facture.id):
            return Response({'error': 'Lien invalide ou expiré'}, status=status.HTTP_403_FORBIDDEN)
        pdf = generate_document_pdf(facture, doc_type="FACTURE")
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Facture_{facture.numero_facture or "Proforma"}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def envoyer_email(self, request, pk=None):
        facture = self.get_object()
        client = facture.reparation.vehicule.client
        if not client.email:
            return Response({'error': "Le client n'a pas d'adresse email."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pdf = generate_document_pdf(facture, doc_type="FACTURE")
            subject = f"Facture LUXEL-G - {facture.numero_facture or 'Proforma'}"
            body = (f"Bonjour {client.nom} {client.prenoms},\n\n"
                    f"Veuillez trouver ci-joint votre facture pour le véhicule {facture.reparation.vehicule.immatriculation}.\n"
                    f"Montant Total : {facture.total_ttc} FCFA.\n\nCordialement,\nL'équipe LUXEL-G")
            email = EmailMessage(subject, body, to=[client.email])
            email.attach(f"Facture_{facture.numero_facture or 'Proforma'}.pdf", pdf, 'application/pdf')
            email.send()
            NotificationClient.objects.create(
                client=client, type='FACTURE_ENVOYEE',
                message=f"Votre facture {facture.numero_facture or 'Proforma'} vous a été envoyée par email."
            )
            return Response({'message': 'Email envoyé avec succès !'})
        except Exception as e:
            logger.error("Erreur envoi email facture : %s", e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.all().order_by('-date_creation')
    serializer_class = DevisSerializer
    permission_classes = [IsStaffMember]

    @action(detail=True, methods=['post'])
    def transformer_en_facture(self, request, pk=None):
        devis = self.get_object()
        facture, _ = Facture.objects.get_or_create(
            reparation=devis.reparation,
            defaults={'type': 'PROFORMA', 'total_ht': devis.total_ht, 'total_ttc': devis.total_ttc}
        )
        devis.statut = 'FACTURE'
        devis.save()
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        devis = self.get_object()
        pdf = generate_document_pdf(devis, doc_type="DEVIS")
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Devis_{devis.numero_devis}.pdf"'
        return response

    @action(detail=True, methods=['get'])
    def share_link(self, request, pk=None):
        devis = self.get_object()
        token = _make_document_token('DEVIS', devis.id)
        url = request.build_absolute_uri(f'/api/devis/{devis.id}/public_pdf/?token={token}')
        return Response({'url': url})

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def public_pdf(self, request, pk=None):
        devis = self.get_object()
        token = request.query_params.get('token', '')
        if not _check_document_token(token, 'DEVIS', devis.id):
            return Response({'error': 'Lien invalide ou expiré'}, status=status.HTTP_403_FORBIDDEN)
        pdf = generate_document_pdf(devis, doc_type="DEVIS")
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Devis_{devis.numero_devis or "Brouillon"}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def envoyer_email(self, request, pk=None):
        devis = self.get_object()
        client = devis.reparation.vehicule.client
        if not client.email:
            return Response({'error': "Le client n'a pas d'adresse email."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pdf = generate_document_pdf(devis, doc_type="DEVIS")
            subject = f"Devis LUXEL-G - {devis.numero_devis or 'Brouillon'}"
            body = (f"Bonjour {client.nom} {client.prenoms},\n\n"
                    f"Veuillez trouver ci-joint le devis pour le véhicule {devis.reparation.vehicule.immatriculation}.\n"
                    f"Total Estimé : {devis.total_ttc} FCFA.\n\nCordialement,\nL'équipe LUXEL-G")
            email = EmailMessage(subject, body, to=[client.email])
            email.attach(f"Devis_{devis.numero_devis or 'Brouillon'}.pdf", pdf, 'application/pdf')
            email.send()
            NotificationClient.objects.create(
                client=client, type='DEVIS_ENVOYE',
                message=f"Le devis {devis.numero_devis or 'Brouillon'} vous a été envoyé par email."
            )
            return Response({'message': 'Email envoyé avec succès !'})
        except Exception as e:
            logger.error("Erreur envoi email devis : %s", e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
