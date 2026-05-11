from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from decimal import Decimal
from django.contrib.auth.models import User
from django.core.mail import EmailMessage

from .utils import generate_document_pdf
from .models import Client, Vehicule, Reparation, Stock, Facture, LigneTravail, LignePiece, MouvementCaisse, Devis, MaintenancePredictive, Appointment, NotificationClient, Avis
from .serializers import (
    ClientSerializer, VehiculeSerializer, ReparationSerializer, 
    StockSerializer, UserSerializer, MiniVehiculeSerializer,
    FactureSerializer, LigneTravailSerializer, LignePieceSerializer,
    MouvementCaisseSerializer, DevisSerializer, MaintenancePredictiveSerializer,
    AppointmentSerializer, NotificationClientSerializer, AvisSerializer
)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by('-date_creation')
    serializer_class = ClientSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-date_rdv')
    serializer_class = AppointmentSerializer

    def perform_create(self, serializer):
        appointment = serializer.save()
        # Créer une notification pour le client (si lié) ou logguer la demande
        if appointment.client:
            NotificationClient.objects.create(
                client=appointment.client,
                type='RDV_CONFIRME',
                message=f"Votre demande de rendez-vous pour le {appointment.date_rdv.strftime('%d/%m/%Y à %H:%M')} a été enregistrée. Nous vous contacterons pour confirmation."
            )

class NotificationClientViewSet(viewsets.ModelViewSet):
    queryset = NotificationClient.objects.all().order_by('-date_envoi')
    serializer_class = NotificationClientSerializer

class AvisViewSet(viewsets.ModelViewSet):
    queryset = Avis.objects.all().order_by('-date_creation')
    serializer_class = AvisSerializer

    @action(detail=False, methods=['get'])
    def public_list(self, request):
        avis = Avis.objects.filter(affiche_public=True).order_by('-date_creation')[:6]
        serializer = self.get_serializer(avis, many=True)
        return Response(serializer.data)

class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all().order_by('-date_creation')
    serializer_class = VehiculeSerializer

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        vehicule = self.get_object()
        reparations = vehicule.reparations.all().order_by('-date_creation')
        serializer = ReparationSerializer(reparations, many=True)
        return Response(serializer.data)

class ReparationViewSet(viewsets.ModelViewSet):
    queryset = Reparation.objects.all().order_by('-date_creation')
    serializer_class = ReparationSerializer

    def perform_update(self, serializer):
        reparation = serializer.save()
        # Si la réparation passe à TERMINE, on notifie le client
        if reparation.statut == 'TERMINE':
            NotificationClient.objects.create(
                client=reparation.vehicule.client,
                type='REPARATION_TERMINEE',
                message=f"Votre véhicule {reparation.vehicule.immatriculation} est prêt ! Vous pouvez passer le récupérer au garage LUXEL-G."
            )

    def perform_create(self, serializer):
        reparation = serializer.save()
        if reparation.categorie == 'Maintenance Routine':
            km_prochain = reparation.kilometrage + 10000
            date_prochaine = timezone.now() + timezone.timedelta(days=180)
            MaintenancePredictive.objects.create(
                vehicule=reparation.vehicule,
                type_maintenance='VIDANGE',
                km_derniere_prestation=reparation.kilometrage,
                km_prochain_prevu=km_prochain,
                date_prochaine_prevue=date_prochaine
            )

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        wb = Workbook()
        ws = wb.active
        ws.append(['Date Entrée', 'OR #', 'Immatriculation', 'Marque', 'Modèle', 'Client', 'Description', 'Kms Entrée', 'Statut'])
        for r in self.get_queryset():
            ws.append([r.date_creation.strftime('%d/%m/%Y'), f"OR-{r.id:04d}", r.vehicule.immatriculation, r.vehicule.marque, r.vehicule.modele, r.vehicule.client.nom, r.description, r.kilometrage, r.get_statut_display()])
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
        
        # Génération robuste du numéro de facture
        year = timezone.now().year
        last_invoice = Facture.objects.filter(numero_facture__startswith=f"FAC-{year}").order_by('-numero_facture').first()
        
        if last_invoice and last_invoice.numero_facture:
            try:
                last_num = int(last_invoice.numero_facture.split('-')[-1])
                count = last_num + 1
            except (ValueError, IndexError):
                count = Facture.objects.filter(type='DEFINITIVE').count() + 1
        else:
            count = Facture.objects.filter(type='DEFINITIVE').count() + 1
            
        facture.numero_facture = f"FAC-{year}-{count:04d}"
        facture.type = 'DEFINITIVE'
        facture.date_validation = timezone.now()
        facture.save()
        
        for piece in facture.reparation.pieces.all():
            if piece.article_stock:
                stock_item = piece.article_stock
                stock_item.quantite = max(0, stock_item.quantite - piece.quantite)
                stock_item.save()
        
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['post'])
    def enregistrer_paiement(self, request, pk=None):
        facture = self.get_object()
        montant = Decimal(str(request.data.get('montant', 0)))
        if montant <= 0 or montant > (facture.total_ttc - facture.montant_paye):
            return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)
        facture.montant_paye += montant
        facture.mode_paiement = request.data.get('mode_paiement')
        facture.statut_paiement = 'SOLDE' if facture.montant_paye >= facture.total_ttc else 'PARTIEL'
        facture.save()
        MouvementCaisse.objects.create(
            type_mouvement='RECETTE', 
            categorie='RECETTE_CLIENT', 
            montant=montant, 
            description=f"Paiement {facture.numero_facture}", 
            facture=facture,
            date_mouvement=timezone.now().date()
        )
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        pdf = generate_document_pdf(self.get_object(), doc_type="FACTURE")
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Facture_{self.get_object().numero_facture}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def envoyer_email(self, request, pk=None):
        facture = self.get_object()
        client = facture.reparation.vehicule.client
        if not client.email:
            return Response({'error': 'Le client n\'a pas d\'adresse email.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pdf = generate_document_pdf(facture, doc_type="FACTURE")
            subject = f"Facture LUXEL-G - {facture.numero_facture or 'Proforma'}"
            body = f"Bonjour {client.nom} {client.prenoms},\n\nVeuillez trouver ci-joint votre facture concernant les travaux sur votre véhicule {facture.reparation.vehicule.immatriculation}.\n\nMontant Total : {facture.total_ttc} FCFA.\n\nCordialement,\nL'équipe LUXEL-G"
            
            email = EmailMessage(subject, body, to=[client.email])
            filename = f"Facture_{facture.numero_facture or 'Proforma'}.pdf"
            email.attach(filename, pdf, 'application/pdf')
            email.send()
            
            # Créer une notification client
            NotificationClient.objects.create(
                client=client,
                type='FACTURE_ENVOYEE', # Note: J'ai besoin d'ajouter ce type au modèle si nécessaire ou d'utiliser un existant
                message=f"Votre facture {facture.numero_facture or 'Proforma'} vous a été envoyée par email."
            )
            
            return Response({'message': 'Email envoyé avec succès !'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.all().order_by('-date_creation')
    serializer_class = DevisSerializer

    @action(detail=True, methods=['post'])
    def transformer_en_facture(self, request, pk=None):
        devis = self.get_object()
        facture, created = Facture.objects.get_or_create(reparation=devis.reparation, defaults={'type': 'PROFORMA', 'total_ht': devis.total_ht, 'total_ttc': devis.total_ttc})
        devis.statut = 'FACTURE'
        devis.save()
        return Response(FactureSerializer(facture).data)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        pdf = generate_document_pdf(self.get_object(), doc_type="DEVIS")
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Devis_{self.get_object().numero_devis}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def envoyer_email(self, request, pk=None):
        devis = self.get_object()
        client = devis.reparation.vehicule.client
        if not client.email:
            return Response({'error': 'Le client n\'a pas d\'adresse email.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pdf = generate_document_pdf(devis, doc_type="DEVIS")
            subject = f"Devis LUXEL-G - {devis.numero_devis or 'Brouillon'}"
            body = f"Bonjour {client.nom} {client.prenoms},\n\nVeuillez trouver ci-joint le devis concernant les travaux sur votre véhicule {devis.reparation.vehicule.immatriculation}.\n\nTotal Estimé : {devis.total_ttc} FCFA.\n\nCordialement,\nL'équipe LUXEL-G"
            
            email = EmailMessage(subject, body, to=[client.email])
            filename = f"Devis_{devis.numero_devis or 'Brouillon'}.pdf"
            email.attach(filename, pdf, 'application/pdf')
            email.send()
            
            # Créer une notification client
            NotificationClient.objects.create(
                client=client,
                type='DEVIS_ENVOYE',
                message=f"Le devis {devis.numero_devis or 'Brouillon'} concernant votre véhicule {devis.reparation.vehicule.immatriculation} vous a été envoyé par email."
            )
            
            return Response({'message': 'Email envoyé avec succès !'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ClientSpaceViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def data(self, request):
        phone = request.query_params.get('phone')
        if not phone:
            return Response({'error': 'Numéro de téléphone requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Nettoyer le numéro pour la recherche
        clean_phone = phone.replace(' ', '').replace('+', '')
        if clean_phone.startswith('229'):
            clean_phone = clean_phone[3:]
        
        # Rechercher le client (on cherche la correspondance partielle ou totale)
        client = Client.objects.filter(contact__icontains=clean_phone).first()
        if not client:
            return Response({'error': 'Client non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        # Récupérer les véhicules
        vehicules = Vehicule.objects.filter(client=client)
        vehicules_data = MiniVehiculeSerializer(vehicules, many=True).data
        
        # Récupérer les réparations
        reparations = Reparation.objects.filter(vehicule__client=client).order_by('-date_creation')
        reparations_data = ReparationSerializer(reparations, many=True).data
        
        # Récupérer les notifications
        notifications = NotificationClient.objects.filter(client=client).order_by('-date_envoi')
        notifications_data = NotificationClientSerializer(notifications, many=True).data
        
        # Alertes de maintenance
        alertes = MaintenancePredictive.objects.filter(vehicule__client=client, actif=True)
        alertes_data = MaintenancePredictiveSerializer(alertes, many=True).data
        
        # Avis déjà donnés
        avis = Avis.objects.filter(client=client).order_by('-date_creation')
        avis_data = AvisSerializer(avis, many=True).data

        return Response({
            'client': ClientSerializer(client).data,
            'vehicules': vehicules_data,
            'reparations': reparations_data,
            'notifications': notifications_data,
            'alertes': alertes_data,
            'avis': avis_data
        })

    @action(detail=False, methods=['post'])
    def submit_avis(self, request):
        phone = request.data.get('phone')
        # Nettoyer le numéro
        clean_phone = phone.replace(' ', '').replace('+', '')
        if clean_phone.startswith('229'): clean_phone = clean_phone[3:]
        
        client = Client.objects.filter(contact__icontains=clean_phone).first()
        if not client:
            return Response({'error': 'Client non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        data = {
            'client': client.id,
            'note': request.data.get('note'),
            'commentaire': request.data.get('commentaire'),
            'reparation': request.data.get('reparation')
        }
        
        serializer = AvisSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = ClientSerializer(data=request.data)
        if serializer.is_valid():
            client = serializer.save()
            return Response(ClientSerializer(client).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all().order_by('nom')
    serializer_class = StockSerializer

    @action(detail=True, methods=['post'])
    def approvisionner(self, request, pk=None):
        item = self.get_object()
        qty = int(request.data.get('quantite', 0))
        item.quantite += qty
        item.save()
        MouvementCaisse.objects.create(
            type_mouvement='DEPENSE', 
            categorie='ACHAT_PIECES', 
            montant=Decimal(str(request.data.get('prix_achat_total', 0))), 
            description=f"Achat {qty} x {item.nom}",
            date_mouvement=timezone.now().date()
        )
        return Response(StockSerializer(item).data)

class MouvementCaisseViewSet(viewsets.ModelViewSet):
    queryset = MouvementCaisse.objects.all().order_by('-date_creation')
    serializer_class = MouvementCaisseSerializer

    @action(detail=False, methods=['get'])
    def synthese(self, request):
        qs = self.get_queryset()
        today = timezone.now().date()
        recettes = qs.filter(type_mouvement='RECETTE').aggregate(s=models.Sum('montant'))['s'] or 0
        depenses = qs.filter(type_mouvement='DEPENSE').aggregate(s=models.Sum('montant'))['s'] or 0
        r_j = qs.filter(type_mouvement='RECETTE', date_mouvement=today).aggregate(s=models.Sum('montant'))['s'] or 0
        d_j = qs.filter(type_mouvement='DEPENSE', date_mouvement=today).aggregate(s=models.Sum('montant'))['s'] or 0
        impayes = Facture.objects.filter(type='DEFINITIVE').aggregate(s=models.Sum(models.F('total_ttc') - models.F('montant_paye')))['s'] or 0
        return Response({'total_recettes': recettes, 'total_depenses': depenses, 'solde': recettes - depenses, 'recettes_jour': r_j, 'depenses_jour': d_j, 'total_impayes': impayes})

class MaintenancePredictiveViewSet(viewsets.ModelViewSet):
    queryset = MaintenancePredictive.objects.all().order_by('date_prochaine_prevue')
    serializer_class = MaintenancePredictiveSerializer

    @action(detail=False, methods=['get'])
    def alertes(self, request):
        alertes = self.queryset.filter(date_prochaine_prevue__lte=timezone.now() + timezone.timedelta(days=15), actif=True)
        return Response(MaintenancePredictiveSerializer(alertes, many=True).data)

class LigneTravailViewSet(viewsets.ModelViewSet):
    queryset = LigneTravail.objects.all()
    serializer_class = LigneTravailSerializer

class LignePieceViewSet(viewsets.ModelViewSet):
    queryset = LignePiece.objects.all()
    serializer_class = LignePieceSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class StatsViewSet(viewsets.ViewSet):
    def list(self, request):
        # 1. Évolution du Revenu (6 derniers mois)
        six_months_ago = timezone.now() - timezone.timedelta(days=180)
        evolution_ca = MouvementCaisse.objects.filter(
            type_mouvement='RECETTE',
            date_mouvement__gte=six_months_ago
        ).annotate(
            month=TruncMonth('date_mouvement')
        ).values('month').annotate(
            total=models.Sum('montant')
        ).order_by('month')

        # 2. Top Catégories de Pannes
        top_pannes = Reparation.objects.values('categorie').annotate(
            count=models.Count('id')
        ).order_by('-count')[:5]

        # 3. Récapitulatif global Recettes/Dépenses
        flux = MouvementCaisse.objects.values('type_mouvement').annotate(
            total=models.Sum('montant')
        )

        # 4. KPIs (Compteurs)
        counts = {
            'clients': Client.objects.count(),
            'vehicles': Vehicule.objects.count(),
            'repairs_active': Reparation.objects.filter(statut='EN_COURS').count(),
            'stock_low': Stock.objects.filter(quantite__lt=models.F('seuil_alerte')).count()
        }

        return Response({
            'evolution_ca': list(evolution_ca),
            'top_pannes': list(top_pannes),
            'flux_global': list(flux),
            'counts': counts
        })
