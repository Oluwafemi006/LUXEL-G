"""Utilisateurs, Stats Dashboard."""
from ._imports import *
from api.services import predict_payment_risk


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        from api.models import UserProfile
        return User.objects.filter(
            models.Q(profile__isnull=False) | models.Q(is_superuser=True)
        ).distinct().order_by('-id')

    def get_permissions(self):
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [IsDirecteur()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        from api.serializers import UserSerializer
        return Response(UserSerializer(request.user).data)


class StatsViewSet(viewsets.ViewSet):
    permission_classes = [IsDirecteur]

    def list(self, request):
        six_months_ago = timezone.now() - timezone.timedelta(days=180)
        evolution_ca = MouvementCaisse.objects.filter(
            type_mouvement='RECETTE', date_mouvement__gte=six_months_ago
        ).annotate(month=TruncMonth('date_mouvement')).values('month').annotate(
            total=models.Sum('montant')
        ).order_by('month')

        top_pannes = Reparation.objects.values('categorie').annotate(
            count=models.Count('id')
        ).order_by('-count')[:5]

        flux = MouvementCaisse.objects.values('type_mouvement').annotate(total=models.Sum('montant'))

        counts = {
            'clients': Client.objects.count(),
            'vehicles': Vehicule.objects.count(),
            'repairs_active': Reparation.objects.filter(statut='EN_COURS').count(),
            'stock_low': Stock.objects.filter(quantite__lt=models.F('seuil_alerte')).count(),
        }

        return Response({
            'evolution_ca': list(evolution_ca),
            'top_pannes': list(top_pannes),
            'flux_global': list(flux),
            'counts': counts,
        })

    @action(detail=False, methods=['get'])
    def risque_impayes(self, request):
        """Prédiction du risque d'impayé par client."""
        from api.models import Facture
        from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Count
        from django.utils import timezone

        clients_data = []
        factures_qs = Facture.objects.filter(type='DEFINITIVE').select_related('reparation__vehicule__client')

        client_stats = {}
        for f in factures_qs:
            client = f.reparation.vehicule.client
            cid = client.id
            if cid not in client_stats:
                client_stats[cid] = {
                    'id': cid,
                    'nom': f"{client.nom} {client.prenoms}",
                    'factures_total': 0,
                    'factures_partielles': 0,
                    'solde_impaye': 0.0,
                    'derniere_visite_jours': 0,
                }
            client_stats[cid]['factures_total'] += 1
            if f.statut_paiement == 'PARTIEL':
                client_stats[cid]['factures_partielles'] += 1
            client_stats[cid]['solde_impaye'] += float(f.total_ttc - f.montant_paye)

        # Calcul des jours depuis la dernière visite
        from api.models import Reparation as Rep
        for cid in client_stats:
            last = Rep.objects.filter(vehicule__client_id=cid).order_by('-date_creation').first()
            if last:
                delta = (timezone.now() - last.date_creation).days
                client_stats[cid]['derniere_visite_jours'] = delta

        for cid, data in client_stats.items():
            risk = predict_payment_risk(data)
            clients_data.append({**data, 'risque': risk})

        # Trier par score décroissant
        clients_data.sort(key=lambda x: x['risque']['score'], reverse=True)
        return Response(clients_data[:20])  # Top 20 clients à risque
