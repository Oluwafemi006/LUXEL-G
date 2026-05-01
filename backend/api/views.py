from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from .models import Client, Vehicule, Reparation, Stock, VisiteTechnique, Facture, LigneTravail, LignePiece, MouvementCaisse
from .serializers import (
    ClientSerializer, VehiculeSerializer, ReparationSerializer, 
    StockSerializer, VisiteTechniqueSerializer, UserSerializer,
    FactureSerializer, LigneTravailSerializer, LignePieceSerializer,
    MouvementCaisseSerializer
)
from django.contrib.auth.models import User

from decimal import Decimal

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by('-date_creation')
    serializer_class = ClientSerializer

class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all().order_by('-date_creation')
    serializer_class = VehiculeSerializer

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        vehicule = self.get_object()
        reparations = vehicule.reparations.all().order_by('-date_creation')
        serializer = ReparationSerializer(reparations, many=True)
        return Response(serializer.data)

from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill

class ReparationViewSet(viewsets.ModelViewSet):
    queryset = Reparation.objects.all().order_by('-date_creation')
    serializer_class = ReparationSerializer

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        wb = Workbook()
        ws = wb.active
        wb.active.title = "Registre des Entrées"

        # En-tête
        headers = ['Date Entrée', 'OR #', 'Immatriculation', 'Marque', 'Modèle', 'Client', 'Description', 'Kms Entrée', 'Statut']
        ws.append(headers)

        # Style en-tête
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.alignment = Alignment(horizontal="center")
            cell.fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")

        # Données
        reparations = self.get_queryset()
        for r in reparations:
            ws.append([
                r.date_creation.strftime('%d/%m/%Y'),
                f"OR-{r.id:04d}",
                r.vehicule.immatriculation,
                r.vehicule.marque,
                r.vehicule.modele,
                r.vehicule.client.nom,
                r.description,
                r.kilometrage,
                r.get_statut_display()
            ])

        # Ajuster largeur colonnes
        for col in ws.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except: pass
            ws.column_dimensions[column].width = max_length + 2

        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="registre_entrees_luxel_g.xlsx"'
        wb.save(response)
        return response

class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.all().order_by('-date_creation')
    serializer_class = FactureSerializer

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        facture = self.get_object()
        if facture.type == 'DEFINITIVE':
            return Response({'error': 'Facture déjà validée'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Génération du numéro de facture (ex: FAC-2026-0001)
        count = Facture.objects.filter(type='DEFINITIVE').count() + 1
        year = timezone.now().year
        facture.numero_facture = f"FAC-{year}-{count:04d}"
        facture.type = 'DEFINITIVE'
        facture.date_validation = timezone.now()
        facture.save()
        
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['post'])
    def enregistrer_paiement(self, request, pk=None):
        facture = self.get_object()
        montant_data = request.data.get('montant')
        mode = request.data.get('mode_paiement')
        
        if not montant_data or float(montant_data) <= 0:
            return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        montant = Decimal(str(montant_data))
        
        # 1. Vérifier si la facture est déjà soldée
        if facture.statut_paiement == 'SOLDE':
            return Response({'error': 'Cette facture est déjà entièrement réglée.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Vérifier si le montant dépasse le reste à payer
        reste_a_payer = facture.total_ttc - facture.montant_paye
        if montant > reste_a_payer:
            return Response({
                'error': f'Le montant versé ({montant:,.0f} F) dépasse le reste à payer ({reste_a_payer:,.0f} F).'
            }, status=status.HTTP_400_BAD_REQUEST)

        facture.montant_paye += montant
        facture.mode_paiement = mode
        
        if facture.montant_paye >= facture.total_ttc:
            facture.statut_paiement = 'SOLDE'
        else:
            facture.statut_paiement = 'PARTIEL'
        
        facture.save()
        
        # Création automatique du mouvement de caisse
        MouvementCaisse.objects.create(
            type_mouvement='RECETTE',
            categorie='RECETTE_CLIENT',
            montant=montant,
            description=f"Paiement facture {facture.numero_facture} - {facture.reparation.vehicule.immatriculation}",
            facture=facture,
            utilisateur=request.user if request.user.is_authenticated else None
        )
        
        return Response(FactureSerializer(facture).data)

class MouvementCaisseViewSet(viewsets.ModelViewSet):
    queryset = MouvementCaisse.objects.all().order_by('-date_creation')
    serializer_class = MouvementCaisseSerializer

    @action(detail=False, methods=['get'])
    def synthese(self, request):
        recettes = MouvementCaisse.objects.filter(type_mouvement='RECETTE').aggregate(total=models.Sum('montant'))['total'] or 0
        depenses = MouvementCaisse.objects.filter(type_mouvement='DEPENSE').aggregate(total=models.Sum('montant'))['total'] or 0
        return Response({
            'total_recettes': recettes,
            'total_depenses': depenses,
            'solde': recettes - depenses
        })

class LigneTravailViewSet(viewsets.ModelViewSet):
    queryset = LigneTravail.objects.all()
    serializer_class = LigneTravailSerializer

class LignePieceViewSet(viewsets.ModelViewSet):
    queryset = LignePiece.objects.all()
    serializer_class = LignePieceSerializer

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all().order_by('nom')
    serializer_class = StockSerializer

class VisiteTechniqueViewSet(viewsets.ModelViewSet):
    queryset = VisiteTechnique.objects.all().order_by('-date_expiration')
    serializer_class = VisiteTechniqueSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
