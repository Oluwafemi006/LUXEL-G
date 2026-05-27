"""IA, Utilisateurs, Stats Dashboard."""
from ._imports import *
from api.services import (
    generate_repair_summary, suggest_parts_ai,
    chatbot_garage_response, analyze_avis_sentiments, predict_payment_risk
)


class AIViewSet(viewsets.ViewSet):
    """ViewSet pour les fonctionnalités d'Intelligence Artificielle (Gemini)."""
    permission_classes = [IsStaffMember]

    def get_permissions(self):
        # F1 — Le chatbot est accessible publiquement (portail public)
        if self.action == 'chatbot':
            return [permissions.AllowAny()]
        return [IsStaffMember()]

    @action(detail=False, methods=['post'])
    def chatbot(self, request):
        """F1 — Chatbot IA public du garage LUXEL-G."""
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'error': 'Message requis'}, status=status.HTTP_400_BAD_REQUEST)
        history = request.data.get('history', [])
        response_text = chatbot_garage_response(user_message, history)
        return Response({'response': response_text})

    @action(detail=False, methods=['post'])
    def analyze_avis(self, request):
        """F2 — Analyse du sentiment des avis clients (Dashboard directeur)."""
        avis_qs = Avis.objects.all().values('id', 'note', 'commentaire')
        avis_list = list(avis_qs)
        result = analyze_avis_sentiments(avis_list)
        return Response(result)

    @action(detail=False, methods=['get'])
    def risque_impayes(self, request):
        """F3 — Prédiction du risque d'impayé par client."""
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

    @action(detail=False, methods=['post'])
    def repair_summary(self, request):
        vehicule_id = request.data.get('vehicule_id')
        if not vehicule_id:
            return Response({'error': 'ID véhicule requis'}, status=status.HTTP_400_BAD_REQUEST)
        reparations = Reparation.objects.filter(vehicule_id=vehicule_id).order_by('-date_creation')[:5]
        history_data = ReparationSerializer(reparations, many=True).data
        summary = generate_repair_summary(history_data)
        if summary:
            return Response({'summary': summary})
        return Response({'error': 'Échec de la génération du résumé'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def suggest_parts(self, request):
        """F4 — Aide à la saisie de pièces (Stock local + IA Gemini)."""
        query = request.data.get('query')
        context = request.data.get('context', '')
        
        if not query:
            return Response({'error': 'Terme de recherche requis'}, status=status.HTTP_400_BAD_REQUEST)
            
        # --- NIVEAU 1 : Recherche locale (Stock existant) ---
        from api.models import Stock
        local_results = Stock.objects.filter(
            models.Q(nom__icontains=query) | models.Q(sku__icontains=query)
        )[:3]
        
        suggestions_locales = []
        for item in local_results:
            suggestions_locales.append({
                'nom': item.nom,
                'role': f"Article déjà en stock (Catégorie: {item.categorie})",
                'categorie': item.categorie,
                'reference_standard': item.sku,
                'prix_indicatif': float(item.prix_unitaire),
                'source': 'STOCK_LOCAL'
            })
            
        # --- NIVEAU 2 : Assistant IA (Gemini) ---
        ai_suggestions = suggest_parts_ai(query, context)
        
        final_suggestions = suggestions_locales
        if ai_suggestions and 'suggestions' in ai_suggestions:
            # On ajoute les suggestions IA qui ne sont pas déjà dans le stock local (par nom)
            local_names = [s['nom'].lower() for s in suggestions_locales]
            for ai_s in ai_suggestions['suggestions']:
                if ai_s['nom'].lower() not in local_names:
                    ai_s['source'] = 'IA_ASSISTANT'
                    final_suggestions.append(ai_s)
                    
        return Response({'suggestions': final_suggestions[:5]})


class UserViewSet(viewsets.ModelViewSet):
    from api.serializers import UserSerializer as _US
    serializer_class = _US

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
