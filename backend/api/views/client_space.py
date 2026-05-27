"""Espace Client — OTP, profil, véhicules, factures, RDV, avis."""
import logging
import secrets
from django.db.models import Sum, F, ExpressionWrapper, DecimalField as DjangoDecimalField
from ._imports import *

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

    @action(detail=False, methods=['post'])
    def request_otp(self, request):
        identifier = request.data.get('identifier') or request.data.get('phone')
        if not identifier:
            return Response({'error': 'Email ou numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)

        client = _find_client_by_identifier(identifier)
        if not client:
            return Response({'error': 'Client non trouvé. Veuillez contacter le garage.'}, status=status.HTTP_404_NOT_FOUND)
        if not client.email:
            return Response(
                {'error': 'Aucune adresse email associée. Veuillez contacter le garage.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # S4 — Invalider les OTP précédents
        ClientOTP.objects.filter(client=client, is_used=False).update(is_used=True)
        code = f"{secrets.randbelow(1000000):06d}"
        logger.debug("[OTP] Code pour %s %s (%s) : %s", client.prenoms, client.nom, identifier, code)
        ClientOTP.objects.create(client=client, code=code)
        dev_otp_suffix = f" Code test : {code}" if settings.DEV_EXPOSE_OTP else ""

        try:
            from django.core.mail import EmailMessage
            EmailMessage(
                f"Votre code de connexion LUXEL-G : {code}",
                f"Bonjour {client.nom} {client.prenoms},\n\nCode : {code}\n\nValide 10 minutes.\n\nLUXEL-G",
                to=[client.email]
            ).send()
            send_otp_sms(client.contact, code)
            return Response({'message': f'Code envoyé par email et SMS.{dev_otp_suffix}'})
        except Exception as e:
            logger.warning("[OTP] Échec envoi email : %s", e)
            return Response({
                'message': f"Code généré ! L'envoi email a échoué.{dev_otp_suffix or ' Récupérez le code dans les logs.'}"
            }, status=status.HTTP_200_OK)

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
            solde=Sum(ExpressionWrapper(F('total_ttc') - F('montant_paye'), output_field=DjangoDecimalField()))
        )
        return Response({
            'client': ClientSerializer(client).data,
            'vehicules': MiniVehiculeSerializer(vehicules, many=True).data,
            'reparations': ReparationSerializer(reparations, many=True).data,
            'factures': FactureSerializer(factures, many=True).data,
            'rdvs': AppointmentSerializer(Appointment.objects.filter(client=client).order_by('-date_rdv'), many=True).data,
            'solde_impaye': solde_result['solde'] or Decimal('0'),
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
        response['Content-Disposition'] = f'attachment; filename="Facture_{facture.numero_facture or "Proforma"}.pdf"'
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
