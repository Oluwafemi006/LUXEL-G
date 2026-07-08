"""Facturation : Factures et Devis."""
import logging
from django.core import signing
from ._imports import *
from ..services import verify_kkiapay_transaction, finalize_paid_facture, valider_et_normaliser_facture, send_facture_email

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

        user = request.user if request.user.is_authenticated else None
        facture = valider_et_normaliser_facture(facture, request_user=user)
        
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['post'])
    def enregistrer_paiement(self, request, pk=None):
        facture = self.get_object()
        montant = Decimal(str(request.data.get('montant', 0)))

        MODE_VALIDES = ['ESPECE', 'MOMOPAY', 'VIREMENT', 'CHEQUE', 'KKIAPAY', 'AUTRE']
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

        reparation = facture.reparation
        seuil_demarrage = facture.total_ttc * Decimal('0.75')
        total_apres = facture.montant_paye + montant
        if reparation.statut == 'EN_ATTENTE' and total_apres < seuil_demarrage:
            return Response(
                {
                    'error': (
                        "Un acompte minimum de 75% est requis avant le démarrage des réparations "
                        f"({seuil_demarrage:,.0f} F minimum)."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        demande_normalisation = str(request.data.get('normaliser', 'false')).lower() == 'true'
        source_labels = {
            'ESPECE': 'Espèces',
            'MOMOPAY': 'MomoPay',
            'VIREMENT': 'Virement',
            'CHEQUE': 'Chèque',
            'KKIAPAY': 'Kkiapay',
            'AUTRE': 'Autre',
        }

        facture = finalize_paid_facture(
            facture,
            montant,
            request.data.get('reference_virement') or request.data.get('numero_cheque') or None,
            client=facture.reparation.vehicule.client,
            demande_normalisation=demande_normalisation,
            request_user=request.user,
            source=source_labels.get(mode_paiement, mode_paiement),
            mode_paiement=mode_paiement,
            numero_cheque=request.data.get('numero_cheque'),
            reference_virement=request.data.get('reference_virement'),
        )

        if reparation.statut == 'EN_ATTENTE':
            reparation.statut = 'EN_COURS'
            reparation.save()

        data = FactureSerializer(facture).data
        data['email_envoye'] = getattr(facture, '_email_envoye', None)
        email_error = getattr(facture, '_email_error', None)
        if email_error:
            data['email_error'] = email_error
        return Response(data)

    @action(detail=True, methods=['post'])
    def verify_kkiapay(self, request, pk=None):
        """Action pour vérifier une transaction Kkiapay depuis le frontend."""
        facture = self.get_object()
        transaction_id = request.data.get('transaction_id') or request.data.get('transactionId')
        demande_normalisation = str(request.data.get('normaliser', 'false')).lower() == 'true'

        if not transaction_id:
            return Response({'error': 'ID de transaction manquant'}, status=status.HTTP_400_BAD_REQUEST)

        transaction_data = verify_kkiapay_transaction(transaction_id)
        if not transaction_data:
            return Response({'error': 'Transaction invalide ou échouée'}, status=status.HTTP_400_BAD_REQUEST)

        montant = Decimal(str(
            transaction_data.get('amount')
            or transaction_data.get('montant')
            or transaction_data.get('totalAmount')
            or transaction_data.get('paidAmount')
            or 0
        ))
        reste_a_payer = facture.total_ttc - facture.montant_paye
        if montant <= 0:
            return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)

        montant_enregistre = min(montant, reste_a_payer)
        if montant_enregistre <= 0:
            return Response({'error': 'Facture déjà soldée'}, status=status.HTTP_400_BAD_REQUEST)

        facture = finalize_paid_facture(
            facture,
            montant_enregistre,
            transaction_id,
            client=facture.reparation.vehicule.client,
            demande_normalisation=demande_normalisation,
            request_user=request.user,
            source='Kkiapay',
            mode_paiement='KKIAPAY',
        )
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['post'])
    def normaliser(self, request, pk=None):
        """Action pour normaliser manuellement une facture via e-MECeF."""
        facture = self.get_object()
        if facture.is_normalised:
            return Response({'error': 'Facture déjà normalisée'}, status=status.HTTP_400_BAD_REQUEST)

        client = facture.reparation.vehicule.client
        if not client.ifu:
            return Response({'error': "IFU client requis pour générer une facture normalisée."}, status=status.HTTP_400_BAD_REQUEST)

        facture.demande_normalisation = True
        facture.save(update_fields=['demande_normalisation'])
        facture = valider_et_normaliser_facture(
            facture,
            request_user=request.user,
            sync_normalization=True,
        )

        if facture.is_normalised:
            email_envoye = False
            email_error = None
            if client.email:
                try:
                    send_facture_email(facture, client, email_type='normalisation')
                    email_envoye = True
                    NotificationClient.objects.create(
                        client=client,
                        type='FACTURE_ENVOYEE',
                        message=(
                            f"Votre facture normalisée {facture.numero_facture or f'#{facture.id}'} "
                            "vous a été envoyée par email."
                        )
                    )
                except Exception as e:
                    email_error = str(e)
                    logger.error("Erreur envoi email facture normalisée : %s", e)

            data = FactureSerializer(facture).data
            data['email_envoye'] = email_envoye
            if email_error:
                data['email_error'] = email_error
            return Response(data)
        
        return Response({'error': 'Échec de la normalisation'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        
        # Nom de fichier professionnel
        if facture.type == 'DEFINITIVE' and facture.numero_facture:
            filename = f"Facture_{facture.numero_facture}.pdf"
        else:
            filename = f"Proforma_OR-{facture.reparation.id:04d}.pdf"
            
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
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
        
        if facture.type == 'DEFINITIVE' and facture.numero_facture:
            filename = f"Facture_{facture.numero_facture}.pdf"
        else:
            filename = f"Proforma_OR-{facture.reparation.id:04d}.pdf"
            
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'])
    def envoyer_email(self, request, pk=None):
        facture = self.get_object()
        client = facture.reparation.vehicule.client
        if not client.email:
            return Response({'error': "Le client n'a pas d'adresse email."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            send_facture_email(
                facture,
                client,
                email_type='normalisation' if facture.is_normalised else 'document',
            )
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
        response['Content-Disposition'] = f'attachment; filename="Devis_{devis.numero_devis or f"OR-{devis.reparation.id:04d}"}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def envoyer_email(self, request, pk=None):
        devis = self.get_object()
        client = devis.reparation.vehicule.client
        if not client.email:
            return Response({'error': "Le client n'a pas d'adresse email."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pdf = generate_document_pdf(devis, doc_type="DEVIS")
            subject = f"Devis Luxury Elegance Garage - {devis.numero_devis or f'OR-{devis.reparation.id:04d}'}"
            body = (f"Bonjour {devis.reparation.vehicule.client.nom},\n\n"
                    f"Veuillez trouver ci-joint le devis pour le véhicule {devis.reparation.vehicule.immatriculation}.\n"
                    f"Total Estimé : {devis.total_ttc} FCFA.\n\nCordialement,\nL'équipe Luxury Elegance Garage")
            email = EmailMessage(subject, body, to=[client.email])
            email.attach(f"Devis_{devis.numero_devis or f'OR-{devis.reparation.id:04d}'}.pdf", pdf, 'application/pdf')
            email.send()
            NotificationClient.objects.create(
                client=client, type='DEVIS_ENVOYE',
                message=f"Le devis {devis.numero_devis or f'OR-{devis.reparation.id:04d}'} vous a été envoyé par email."
            )
            return Response({'message': 'Email envoyé avec succès !'})
        except Exception as e:
            logger.error("Erreur envoi email devis : %s", e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
