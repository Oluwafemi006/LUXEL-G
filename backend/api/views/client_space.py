"""Espace Client — OTP, profil, véhicules, factures, RDV, avis."""
import logging
import secrets
from django.db.models import Sum, F, ExpressionWrapper, DecimalField as DjangoDecimalField
from django.db.models.functions import Coalesce
from ._imports import *
from api.throttling import ClientOTPThrottle

logger = logging.getLogger(__name__)


def _clean_phone(phone: str) -> str:
    """Normalise un numéro de téléphone béninois."""
    p = phone.replace(' ', '').replace('+', '')
    if p.startswith('229'):
        p = p[3:]
    return p


def _find_client_by_identifier(identifier: str):
    identifier = (identifier or '').strip()
    if '@' in identifier:
        return Client.objects.filter(email__iexact=identifier).first()
    return Client.objects.filter(contact=_clean_phone(identifier)).first()


class ClientSpaceViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['request_otp', 'verify_otp', 'register']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], throttle_classes=[ClientOTPThrottle])
    def request_otp(self, request):
        identifier = (request.data.get('identifier') or request.data.get('phone') or '').strip()
        if not identifier:
            return Response({'error': 'Email ou numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)

        client = _find_client_by_identifier(identifier)
        if not client:
            return Response({'error': 'Client non trouvé. Veuillez contacter le garage.'}, status=status.HTTP_404_NOT_FOUND)

        # S4 — Invalider les OTP précédents
        ClientOTP.objects.filter(client=client, is_used=False).update(is_used=True)
        code = f"{secrets.randbelow(1000000):06d}"
        logger.debug("[OTP] Code pour %s %s (%s) : %s", client.prenoms, client.nom, identifier, code)
        ClientOTP.objects.create(client=client, code=code)

        is_email = '@' in identifier
        sent_method = ""

        try:
            if is_email:
                if not client.email:
                    return Response({'error': 'Aucune adresse email associée.'}, status=status.HTTP_400_BAD_REQUEST)
                EmailMessage(
                    f"Votre code de connexion Luxury Elegance Garage : {code}",
                    f"Bonjour {client.nom} {client.prenoms},\n\nCode : {code}\n\nValide 10 minutes.\n\nLuxury Elegance Garage",
                    to=[client.email]
                ).send()
                sent_method = "email"
            else:
                if not client.contact:
                    return Response({'error': 'Aucun numéro de téléphone associé.'}, status=status.HTTP_400_BAD_REQUEST)
                from api.services import send_whatsapp_otp, send_otp_sms
                # Essai WhatsApp en priorité, fallback sur SMS
                wa_sent = send_whatsapp_otp(client.contact, code)
                if wa_sent:
                    sent_method = "WhatsApp"
                else:
                    send_otp_sms(client.contact, code)
                    sent_method = "SMS"

            response_data = {'message': f'Code de connexion envoyé par {sent_method}.'}
            if getattr(settings, 'DEV_EXPOSE_OTP', False):
                response_data['dev_otp_code'] = code
                
            return Response(response_data)
        except Exception as e:
            logger.error("[OTP] Échec envoi %s : %s", sent_method, e)
            return Response({
                'error': f"Échec de l'envoi du code par {sent_method}. Veuillez réessayer."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        identifier = request.data.get('identifier') or request.data.get('phone')
        code = request.data.get('code')
        if not identifier or not code:
            return Response({'error': 'Email/numéro et code requis'}, status=status.HTTP_400_BAD_REQUEST)

        client = _find_client_by_identifier(identifier)
        if not client:
            return Response({'error': 'Client non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        otp = ClientOTP.objects.filter(client=client, code=code, is_used=False).order_by('-created_at').first()
        if not otp or not otp.is_valid():
            return Response({'error': 'Code invalide ou expiré'}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save()

        if not client.user:
            clean_phone = _clean_phone(client.contact)
            user, _ = User.objects.get_or_create(
                username=f"client_{clean_phone}", defaults={'email': client.email}
            )
            client.user = user
            client.save()

        refresh = RefreshToken.for_user(client.user)
        return Response({'refresh': str(refresh), 'access': str(refresh.access_token), 'client_id': client.id})

    @action(detail=False, methods=['get'])
    def data(self, request):
        try:
            client = request.user.client_profile
        except AttributeError:
            return Response({'error': 'Profil client non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        vehicules = Vehicule.objects.filter(client=client)
        reparations = (
            Reparation.objects.filter(vehicule__client=client)
            .select_related('vehicule', 'vehicule__client', 'technicien')
            .prefetch_related('travaux', 'pieces', 'devis')
            .order_by('-date_creation')
        )
        factures = (
            Facture.objects.filter(reparation__vehicule__client=client)
            .select_related('reparation__vehicule__client')
            .order_by('-date_creation')
        )
        solde_result = factures.filter(type='DEFINITIVE').aggregate(
            solde=Coalesce(
                Sum(ExpressionWrapper(F('total_ttc') - F('montant_paye'), output_field=DjangoDecimalField())),
                Decimal('0')
            )
        )
        final_solde = max(solde_result['solde'], Decimal('0'))

        # Exclure les devis liés à des factures soldées
        reparations_soldees = factures.filter(statut_paiement='SOLDE').values_list('reparation_id', flat=True)
        devis = Devis.objects.filter(reparation__vehicule__client=client)\
                             .exclude(reparation_id__in=reparations_soldees)\
                             .order_by('-date_creation')

        return Response({
            'client': ClientSerializer(client).data,
            'vehicules': MiniVehiculeSerializer(vehicules, many=True).data,
            'reparations': ReparationSerializer(reparations, many=True).data,
            'factures': FactureSerializer(factures, many=True).data,
            'devis': DevisSerializer(devis, many=True).data,
            'rdvs': AppointmentSerializer(Appointment.objects.filter(client=client).order_by('-date_rdv'), many=True).data,
            'solde_impaye': final_solde,
            'notifications': NotificationClientSerializer(NotificationClient.objects.filter(client=client).order_by('-date_envoi'), many=True).data,
            'alertes': MaintenancePredictiveSerializer(MaintenancePredictive.objects.filter(vehicule__client=client, actif=True), many=True).data,
            'avis': AvisSerializer(Avis.objects.filter(client=client).order_by('-date_creation'), many=True).data,
        })

    @action(detail=False, methods=['post'])
    def submit_avis(self, request):
        try:
            client = request.user.client_profile
        except AttributeError:
            return Response({'error': 'Profil client non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        data = {'client': client.id, 'note': request.data.get('note'),
                'commentaire': request.data.get('commentaire'), 'reparation': request.data.get('reparation')}
        serializer = AvisSerializer(data=data)
        if serializer.is_valid():
            avis = serializer.save()
            NotificationStaff.objects.create(
                type='NOUVEL_AVIS',
                message=f"Nouvel avis de {client.nom} ({avis.note}/5) : \"{avis.commentaire[:50]}...\""
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def register(self, request):
        data = request.data.copy()
        data['contact'] = _clean_phone(data.get('contact', ''))
        serializer = ClientSerializer(data=data)
        if serializer.is_valid():
            client = serializer.save()
            return Response(ClientSerializer(client).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='book-appointment')
    def book_appointment(self, request):
        try:
            client = request.user.client_profile
        except AttributeError:
            return Response({'error': 'Profil client non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['client'] = client.id
        serializer = AppointmentSerializer(data=data)
        if serializer.is_valid():
            appointment = serializer.save()
            NotificationStaff.objects.create(
                type='NOUVEAU_RDV',
                message=f"Nouveau RDV : {client.nom} {client.prenoms} — {appointment.date_rdv.strftime('%d/%m/%Y %H:%M')}."
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='download-invoice')
    def download_invoice_pdf(self, request):
        try:
            client = request.user.client_profile
        except AttributeError:
            return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        invoice_id = request.query_params.get('invoice_id')
        if not invoice_id:
            return Response({'error': 'ID facture requis'}, status=status.HTTP_400_BAD_REQUEST)
        facture = Facture.objects.filter(id=invoice_id, reparation__vehicule__client=client).first()
        if not facture:
            return Response({'error': 'Facture non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        pdf = generate_document_pdf(facture, doc_type="FACTURE")
        response = HttpResponse(pdf, content_type='application/pdf')
        if facture.type == 'DEFINITIVE' and facture.numero_facture:
            filename = f"Facture_{facture.numero_facture}.pdf"
        else:
            filename = f"Proforma_OR-{facture.reparation.id:04d}.pdf"
            
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'], url_path='download-devis')
    def download_devis_pdf(self, request):
        try:
            client = request.user.client_profile
        except AttributeError:
            return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        devis_id = request.query_params.get('devis_id')
        if not devis_id:
            return Response({'error': 'ID devis requis'}, status=status.HTTP_400_BAD_REQUEST)
        devis = Devis.objects.filter(id=devis_id, reparation__vehicule__client=client).first()
        if not devis:
            return Response({'error': 'Devis non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        pdf = generate_document_pdf(devis, doc_type="DEVIS")
        response = HttpResponse(pdf, content_type='application/pdf')
        filename = f"Devis_{devis.numero_devis or 'Brouillon'}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['post'], url_path='update')
    def update_profile(self, request):
        try:
            client = request.user.client_profile
        except AttributeError:
            return Response({'error': 'Profil client non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClientSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ClientSerializer(client).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='request-invoice-modification')
    def request_invoice_modification(self, request):
        """
        Permet au client de demander une modification de sa facture/proforma
        avant de procéder au paiement (ex: retirer un travail du devis).
        """
        try:
            client = request.user.client_profile
        except AttributeError:
            return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)

        invoice_id = request.data.get('invoice_id')
        message = (request.data.get('message') or '').strip()

        if not invoice_id or not message:
            return Response(
                {'error': 'ID facture et message de modification requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que la facture appartient bien à ce client
        facture = Facture.objects.filter(
            id=invoice_id,
            reparation__vehicule__client=client
        ).first()

        if not facture:
            return Response(
                {'error': 'Facture introuvable ou accès non autorisé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if facture.statut_paiement == 'SOLDE':
            return Response(
                {'error': 'Cette facture est déjà soldée et ne peut plus être modifiée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer une notification pour le staff
        NotificationStaff.objects.create(
            type='DEMANDE_MODIFICATION_PROFORMA',
            message=(
                f"📝 Demande de modification — {client.nom} {client.prenoms} "
                f"souhaite modifier la facture {facture.numero_facture or f'#{facture.id}'} "
                f"({float(facture.total_ttc):,.0f} F) :\n\n\"{message}\""
            )
        )

        # Confirmation au client
        NotificationClient.objects.create(
            client=client,
            type='MODIFICATION_ACCEPTEE',
            message=(
                f"📩 Votre demande de modification pour la facture "
                f"{facture.numero_facture or f'#{facture.id}'} a bien été transmise au garage. "
                f"Nous en tiendrons compte."
            )
        )

        logger.info(
            "[CLIENT-MODIF] Client %s demande modification facture %s : %s",
            client.nom, facture.id, message[:100]
        )

        return Response({
            'message': 'Votre demande de modification a été envoyée au garage. '
                       'Vous serez contacté sous peu.'
        })

    @action(detail=False, methods=['post'], url_path='pay-kkiapay')
    def pay_kkiapay(self, request):
        """
        Paiement Kkiapay initié depuis l'espace client.
        Sécurité : la facture doit appartenir au client connecté.
        """
        try:
            client = request.user.client_profile
        except AttributeError:
            return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)

        invoice_id = request.data.get('invoice_id')
        transaction_id = request.data.get('transaction_id')
        demande_normalisation = bool(request.data.get('demande_normalisation', False))

        if not invoice_id or not transaction_id:
            return Response(
                {'error': 'ID facture et ID transaction requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que la facture appartient bien à ce client
        facture = Facture.objects.filter(
            id=invoice_id,
            reparation__vehicule__client=client
        ).first()

        if not facture:
            return Response(
                {'error': 'Facture introuvable ou accès non autorisé'},
                status=status.HTTP_404_NOT_FOUND
            )

        if facture.statut_paiement == 'SOLDE':
            return Response({'message': 'Cette facture est déjà soldée.'}, status=status.HTTP_200_OK)

        # Vérifier que la transaction n'a pas déjà été traitée
        if MouvementCaisse.objects.filter(description__contains=transaction_id).exists():
            return Response({'message': 'Cette transaction a déjà été traitée.'}, status=status.HTTP_200_OK)

        # Vérification de la transaction Kkiapay
        from api.services import verify_kkiapay_transaction, valider_et_normaliser_facture
        kkiapay_tx = verify_kkiapay_transaction(transaction_id)

        if not kkiapay_tx or kkiapay_tx.get('status') not in ('SUCCESSFULL', 'SUCCESS'):
            logger.warning("[KKIAPAY-CLIENT] Transaction non valide pour facture %s : %s", invoice_id, kkiapay_tx)
            return Response(
                {'error': "Transaction Kkiapay invalide ou non aboutie."},
                status=status.HTTP_400_BAD_REQUEST
            )

        montant = Decimal(str(kkiapay_tx.get('amount', 0)))
        if montant <= 0:
            return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)

        # Sécurité : empêcher le montant payé de dépasser le total
        reste_a_payer = facture.total_ttc - facture.montant_paye
        if montant > reste_a_payer:
            # On accepte le paiement mais on plafonne l'enregistrement (le surplus devra être géré via Kkiapay)
            logger.warning(f"Surplus de paiement ignoré: payé {montant}, reste {reste_a_payer}")
            montant_enregistre = reste_a_payer
        else:
            montant_enregistre = montant

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
                utilisateur=request.user
            )

            NotificationStaff.objects.create(
                type='PAIEMENT_RECU',
                message=f"Paiement Kkiapay de {montant_enregistre:,.0f} F reçu de {client.nom} {client.prenoms} — Facture {facture.numero_facture or facture.id}."
            )

            if facture.statut_paiement == 'SOLDE':
                facture.demande_normalisation = demande_normalisation
                facture.save(update_fields=['demande_normalisation'])
                facture = valider_et_normaliser_facture(facture, request_user=request.user)

        # Notification de confirmation au client
        NotificationClient.objects.create(
            client=client,
            type='PAIEMENT_CONFIRME',
            message=(
                f"✅ Votre paiement de {montant_enregistre:,.0f} FCFA pour la facture "
                f"{facture.numero_facture or f'#{facture.id}'} a bien été enregistré. Merci !"
            )
        )

        # Envoi de l'email de reçu avec la facture
        if client.email:
            try:
                from django.core.mail import EmailMessage
                from django.conf import settings
                from api.utils import generate_document_pdf
                
                pdf_content = generate_document_pdf(facture, doc_type="FACTURE")
                
                email_subject = f"Reçu de paiement - Facture {facture.numero_facture or facture.id}"
                email_body = f"""Bonjour {client.nom} {client.prenoms},

Nous avons bien reçu votre paiement de {montant:,.0f} FCFA pour la facture {facture.numero_facture or facture.id}.
Nous vous remercions pour votre confiance.

Veuillez trouver ci-joint la facture mise à jour.

L'équipe Luxury Elegance Garage"""

                email = EmailMessage(
                    email_subject,
                    email_body,
                    settings.DEFAULT_FROM_EMAIL,
                    [client.email]
                )
                email.attach(f'Facture_{facture.numero_facture or facture.id}.pdf', pdf_content, 'application/pdf')
                email.send(fail_silently=True)
                logger.info(f"Email de reçu envoyé à {client.email}")
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de l'email de reçu : {str(e)}")

        logger.info("[KKIAPAY-CLIENT] Facture %s — %s FCFA — Client %s", facture.id, montant, client.nom)
        return Response({
            'message': f'Paiement de {montant:,.0f} FCFA validé avec succès !',
            'statut_paiement': facture.statut_paiement,
            'montant_paye': str(facture.montant_paye),
            'reste': str(max(Decimal('0'), facture.total_ttc - facture.montant_paye))
        })
