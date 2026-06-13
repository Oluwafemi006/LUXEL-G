from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import MaintenancePredictive
from api.services import send_otp_sms

class Command(BaseCommand):
    help = 'Envoie des alertes de maintenance aux clients dont la date prévue approche'

    def handle(self, *args, **options):
        # Alertes prévues dans les 7 prochains jours
        prochains_jours = timezone.now().date() + timezone.timedelta(days=7)
        alertes = MaintenancePredictive.objects.filter(
            date_prochaine_prevue__lte=prochains_jours,
            date_prochaine_prevue__gte=timezone.now().date(),
            actif=True
        )

        self.stdout.write(f"Vérification des alertes : {alertes.count()} trouvées.")

        for alerte in alertes:
            client = alerte.vehicule.client
            if client.contact:
                message = (f"RAPPEL LUXEL-G : Une maintenance ({alerte.type_maintenance}) est prévue "
                           f"pour votre véhicule {alerte.vehicule.immatriculation} vers le "
                           f"{alerte.date_prochaine_prevue.strftime('%d/%m/%Y')}. "
                           f"Prenez RDV sur notre portail !")
                
                success = send_otp_sms(client.contact, message)
                if success:
                    self.stdout.write(self.style.SUCCESS(f"Alerte envoyée à {client.nom} ({client.contact})"))
                    alerte.actif = False # On ne renvoie pas l'alerte
                    alerte.save()
                else:
                    self.stdout.write(self.style.ERROR(f"Échec envoi à {client.contact}"))
