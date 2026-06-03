"""Réparations, Lignes Travaux et Pièces."""
from ._imports import *


class ReparationViewSet(viewsets.ModelViewSet):
    queryset = Reparation.objects.all().order_by('-date_creation')
    serializer_class = ReparationSerializer
    permission_classes = [IsStaffMember]

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def perform_update(self, serializer):
        reparation = serializer.save()
        if reparation.statut == 'TERMINE':
            client = reparation.vehicule.client
            immat = reparation.vehicule.immatriculation
            try:
                from api.services import send_otp_sms
                if client.contact:
                    send_otp_sms(
                        client.contact,
                        f"Votre véhicule {immat} est prêt ! Vous pouvez passer le récupérer à Luxury Elegance Garage à Parakou."
                    )
                
                if client.email:
                    from django.core.mail import EmailMessage
                    subject = f"✅ Votre véhicule {immat} est prêt — Luxury Elegance Garage"
                    body = (f"Bonjour {client.nom} {client.prenoms},\n\n"
                            f"Nous avons le plaisir de vous informer que les travaux sur votre véhicule "
                            f"{immat} sont terminés.\n\n"
                            f"📍 Adresse : Luxury Elegance Garage, Okedama, Parakou, Bénin\n"
                            f"📞 Contact : +229 01 92 62 98 60\n\n"
                            f"Merci de votre confiance.\n\nL'équipe Luxury Elegance Garage")
                    EmailMessage(subject, body, to=[client.email]).send()
            except Exception as e:
                logging.getLogger(__name__).warning("Échec envoi notification : %s", e)

    def perform_create(self, serializer):
        reparation = serializer.save()
        if reparation.categorie == 'Maintenance Routine':
            MaintenancePredictive.objects.create(
                vehicule=reparation.vehicule, type_maintenance='VIDANGE',
                km_derniere_prestation=reparation.kilometrage,
                km_prochain_prevu=reparation.kilometrage + 10000,
                date_prochaine_prevue=timezone.now() + timezone.timedelta(days=180)
            )

    @action(detail=True, methods=['get'])
    def download_fiche_pdf(self, request, pk=None):
        """M5 — Télécharge la fiche de réception en PDF."""
        reparation = self.get_object()
        pdf = generate_fiche_reception_pdf(reparation)
        numero = reparation.numero_or or f"OR-{reparation.id}"
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Fiche_Reception_{numero}.pdf"'
        return response

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        wb = Workbook()
        ws = wb.active
        ws.append(['Date Entrée', 'OR #', 'Immatriculation', 'Marque', 'Modèle', 'Client', 'Description', 'Kms Entrée', 'Statut'])
        for r in self.get_queryset():
            ws.append([r.date_creation.strftime('%d/%m/%Y'), r.numero_or or f"OR-{r.id:04d}",
                       r.vehicule.immatriculation, r.vehicule.marque, r.vehicule.modele,
                       r.vehicule.client.nom, r.description, r.kilometrage, r.get_statut_display()])
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="registre_entrees_luxel_g.xlsx"'
        wb.save(response)
        return response


class LigneTravailViewSet(viewsets.ModelViewSet):
    queryset = LigneTravail.objects.all()
    serializer_class = LigneTravailSerializer
    permission_classes = [IsStaffMember]


class LignePieceViewSet(viewsets.ModelViewSet):
    queryset = LignePiece.objects.all()
    serializer_class = LignePieceSerializer
    permission_classes = [IsStaffMember]
