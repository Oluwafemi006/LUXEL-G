"""RDV, Avis, Notifications."""
from ._imports import *


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-date_rdv')
    serializer_class = AppointmentSerializer
    throttle_classes = [RDVAnonThrottle, RDVUserThrottle]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsStaffMember()]

    def get_throttles(self):
        if self.action == 'create':
            return [throttle() for throttle in self.throttle_classes]
        return []

    def perform_create(self, serializer):
        appointment = serializer.save()
        NotificationStaff.objects.create(
            type='NOUVEAU_RDV',
            message=f"Nouveau rendez-vous pris par {appointment.nom_client_public or appointment.client} "
                    f"pour le {appointment.date_rdv.strftime('%d/%m/%Y %H:%M')}."
        )
        if appointment.client:
            NotificationClient.objects.create(
                client=appointment.client,
                type='RDV_CONFIRME',
                message=f"Votre demande de rendez-vous pour le {appointment.date_rdv.strftime('%d/%m/%Y à %H:%M')} "
                        f"a été enregistrée. Nous vous contacterons pour confirmation."
            )
        elif appointment.telephone_client_public:
            # Envoi SMS automatique aux anonymes (Lead Management)
            from api.services import send_sms
            msg = (f"Bonjour {appointment.nom_client_public}, votre demande de RDV à Luxury Elegance Garage "
                   f"pour le {appointment.date_rdv.strftime('%d/%m/%Y à %H:%M')} a bien été reçue. "
                   f"Nous vous rappellerons pour confirmer.")
            send_sms(appointment.telephone_client_public, msg)


class NotificationClientViewSet(viewsets.ModelViewSet):
    queryset = NotificationClient.objects.all().order_by('-date_envoi')
    serializer_class = NotificationClientSerializer
    permission_classes = [IsStaffMember]


class NotificationStaffViewSet(viewsets.ModelViewSet):
    queryset = NotificationStaff.objects.all().order_by('-date_creation')
    serializer_class = NotificationStaffSerializer
    permission_classes = [IsStaffMember]

    def get_queryset(self):
        queryset = super().get_queryset()
        lu = self.request.query_params.get('lu')
        is_read = self.request.query_params.get('is_read')
        value = lu if lu is not None else is_read
        if value is not None:
            normalized = value.strip().lower()
            if normalized in ['true', '1', 'yes']:
                queryset = queryset.filter(lu=True)
            elif normalized in ['false', '0', 'no']:
                queryset = queryset.filter(lu=False)
        return queryset


class AvisViewSet(viewsets.ModelViewSet):
    queryset = Avis.objects.all().order_by('-date_creation')
    serializer_class = AvisSerializer

    def get_permissions(self):
        if self.action in ['public_list']:
            return [permissions.AllowAny()]
        if self.action in ['create', 'submit_avis']:
            return [permissions.IsAuthenticated()]
        return [IsStaffMember()]

    @action(detail=False, methods=['get'])
    def public_list(self, request):
        avis = Avis.objects.filter(affiche_public=True).order_by('-date_creation')[:6]
        return Response(AvisSerializer(avis, many=True).data)
