"""Stock et Caisse."""
from ._imports import *


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all().order_by('nom')
    serializer_class = StockSerializer
    permission_classes = [IsStaffMember]

    @action(detail=True, methods=['post'])
    def approvisionner(self, request, pk=None):
        item = self.get_object()
        qty = int(request.data.get('quantite', 0))
        item.quantite += qty
        item.save()
        MouvementStock.objects.create(
            article=item, type_mouvement='ENTREE', quantite=qty,
            description=request.data.get('description', 'Approvisionnement manuel'),
            utilisateur=request.user if request.user.is_authenticated else None
        )
        MouvementCaisse.objects.create(
            type_mouvement='DEPENSE', categorie='ACHAT_PIECES',
            montant=Decimal(str(request.data.get('prix_achat_total', 0))),
            description=f"Achat {qty} x {item.nom}",
            date_mouvement=timezone.now().date(),
            utilisateur=request.user if request.user.is_authenticated else None
        )
        return Response(StockSerializer(item).data)

    @action(detail=True, methods=['post'])
    def ajuster_inventaire(self, request, pk=None):
        item = self.get_object()
        nouveau_physique = int(request.data.get('quantite_physique', item.quantite))
        ecart = nouveau_physique - item.stock_theorique
        item.quantite = nouveau_physique
        item.save()
        MouvementStock.objects.create(
            article=item, type_mouvement='AJUSTEMENT', quantite=ecart,
            description=f"Ajustement Inventaire (Physique: {nouveau_physique}, Écart: {ecart})",
            utilisateur=request.user if request.user.is_authenticated else None
        )
        return Response(StockSerializer(item).data)

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        wb = Workbook()
        ws = wb.active
        ws.title = "Gestion Stock"
        headers = ['Date', 'Réf', 'Désignation', 'Stock Initial', 'Entrées', 'Sorties', 'Stock Théorique', 'Stock Physique', 'Écart']
        ws.append(headers)
        header_fill = PatternFill(start_color="10b981", end_color="10b981", fill_type="solid")
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = Font(color="FFFFFF", bold=True)
            cell.alignment = Alignment(horizontal="center")
        for item in self.get_queryset():
            ws.append([timezone.now().strftime('%d/%m/%Y'), item.sku, item.nom,
                       item.stock_initial, item.entrees_total, item.sorties_total,
                       item.stock_theorique, item.quantite, item.ecart])
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="inventaire_luxury_g.xlsx"'
        wb.save(response)
        return response


class MouvementCaisseViewSet(viewsets.ModelViewSet):
    queryset = MouvementCaisse.objects.all().order_by('-date_creation')
    serializer_class = MouvementCaisseSerializer
    permission_classes = [IsStaffMember]

    @action(detail=False, methods=['get'])
    def synthese(self, request):
        qs = self.get_queryset()
        today = timezone.now().date()
        recettes = qs.filter(type_mouvement='RECETTE').aggregate(s=models.Sum('montant'))['s'] or 0
        depenses = qs.filter(type_mouvement='DEPENSE').aggregate(s=models.Sum('montant'))['s'] or 0
        r_j = qs.filter(type_mouvement='RECETTE', date_mouvement=today).aggregate(s=models.Sum('montant'))['s'] or 0
        d_j = qs.filter(type_mouvement='DEPENSE', date_mouvement=today).aggregate(s=models.Sum('montant'))['s'] or 0
        impayes = Facture.objects.filter(type='DEFINITIVE').aggregate(
            s=models.Sum(models.F('total_ttc') - models.F('montant_paye'))
        )['s'] or 0
        return Response({'total_recettes': recettes, 'total_depenses': depenses,
                         'solde': recettes - depenses, 'recettes_jour': r_j,
                         'depenses_jour': d_j, 'total_impayes': impayes})


class MaintenancePredictiveViewSet(viewsets.ModelViewSet):
    queryset = MaintenancePredictive.objects.all().order_by('date_prochaine_prevue')
    serializer_class = MaintenancePredictiveSerializer
    permission_classes = [IsStaffMember]

    @action(detail=False, methods=['get'])
    def alertes(self, request):
        alertes = self.queryset.filter(
            date_prochaine_prevue__lte=timezone.now() + timezone.timedelta(days=15), actif=True
        )
        return Response(MaintenancePredictiveSerializer(alertes, many=True).data)
