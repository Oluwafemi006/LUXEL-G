"""Clients, Véhicules et Recherche globale."""
from ._imports import *


class GlobalSearchView(APIView):
    """GET /api/search/?q=<terme> — Recherche multi-entités."""
    permission_classes = [IsStaffMember]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'clients': [], 'vehicules': [], 'reparations': []})

        clients = Client.objects.filter(
            models.Q(nom__icontains=q) | models.Q(prenoms__icontains=q) | models.Q(contact__icontains=q)
        )[:5]
        vehicules = Vehicule.objects.filter(
            models.Q(immatriculation__icontains=q) | models.Q(marque__icontains=q) | models.Q(modele__icontains=q)
        ).select_related('client')[:5]
        reparations = Reparation.objects.filter(
            models.Q(vehicule__immatriculation__icontains=q) | models.Q(description__icontains=q) | models.Q(categorie__icontains=q)
        ).select_related('vehicule__client')[:5]

        return Response({
            'clients': [{'id': c.id, 'nom': c.nom, 'prenoms': c.prenoms, 'contact': c.contact} for c in clients],
            'vehicules': [{'id': v.id, 'immatriculation': v.immatriculation, 'marque': v.marque,
                           'modele': v.modele, 'client_nom': f"{v.client.nom} {v.client.prenoms}"} for v in vehicules],
            'reparations': [{'id': r.id, 'description': r.description[:60], 'statut': r.statut,
                             'immatriculation': r.vehicule.immatriculation,
                             'client_nom': f"{r.vehicule.client.nom} {r.vehicule.client.prenoms}"} for r in reparations],
        })


class ClientViewSet(viewsets.ModelViewSet):
    """CRUD Clients — réservé au personnel du garage."""
    queryset = Client.objects.all().order_by('-date_creation')
    serializer_class = ClientSerializer
    permission_classes = [IsStaffMember]


class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all().order_by('-date_creation')
    serializer_class = VehiculeSerializer
    permission_classes = [IsStaffMember]

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        vehicule = self.get_object()
        reparations = vehicule.reparations.all().order_by('-date_creation')
        serializer = ReparationSerializer(reparations, many=True)
        return Response(serializer.data)
