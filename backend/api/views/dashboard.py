"""Utilisateurs, Stats Dashboard."""
from ._imports import *
from api.services import predict_payment_risk


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        from api.models import UserProfile
        return User.objects.filter(
            models.Q(profile__isnull=False) | models.Q(is_superuser=True)
        ).distinct().order_by('-id')

    def get_permissions(self):
        if self.action in ['me', 'update_profile', 'change_password']:
            return [IsStaffMember()]
        if self.action == 'update_dashboard_prefs':
            return [IsDirecteur()]
        return [IsDirecteur()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        from api.serializers import UserSerializer
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['post', 'patch'], url_path='update-profile')
    def update_profile(self, request):
        """Permet à tout utilisateur staff de modifier son nom, prénom et photo."""
        user = request.user
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.save(update_fields=['first_name', 'last_name'])

        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'DIRECTEUR' if user.is_superuser else 'SECRETAIRE'}
        )
        if 'photo' in request.FILES:
            profile.photo = request.FILES['photo']
            profile.save(update_fields=['photo'])

        return Response(UserSerializer(user).data)

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """Change le mot de passe (exige l'ancien mot de passe)."""
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Mot de passe modifié avec succès.'})

    @action(detail=False, methods=['post', 'patch'], url_path='dashboard-prefs')
    def update_dashboard_prefs(self, request):
        """Met à jour les widgets affichés sur le dashboard (Directeur uniquement)."""
        widgets = request.data.get('widgets', [])
        profile, created = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={'role': 'DIRECTEUR' if request.user.is_superuser else 'SECRETAIRE'}
        )
        profile.dashboard_preferences = widgets
        profile.save(update_fields=['dashboard_preferences'])
        return Response({'dashboard_preferences': profile.dashboard_preferences})


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
            
            # On ne compte que les restes positifs pour le solde impayé
            reste = float(f.total_ttc - f.montant_paye)
            if reste > 0:
                client_stats[cid]['solde_impaye'] += reste

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
