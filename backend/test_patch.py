import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Reparation
from api.serializers import ReparationSerializer

rep = Reparation.objects.last()
print("Avant:", rep.statut, rep.progression)

serializer = ReparationSerializer(rep, data={'statut': 'TERMINE', 'progression': 100}, partial=True)
if serializer.is_valid():
    try:
        serializer.save()
        print("Après:", rep.statut, rep.progression)
    except Exception as e:
        print("Erreur save:", e)
else:
    print("Invalide:", serializer.errors)
