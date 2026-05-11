from django.contrib import admin
from .models import (
    Client, Vehicule, Reparation, LigneTravail, LignePiece, 
    Facture, Devis, Stock, MouvementCaisse, 
    MaintenancePredictive, Appointment, NotificationClient
)

class LigneTravailInline(admin.TabularInline):
    model = LigneTravail
    extra = 1

class LignePieceInline(admin.TabularInline):
    model = LignePiece
    extra = 1

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenoms', 'contact', 'date_creation')
    search_fields = ('nom', 'prenoms', 'contact')

@admin.register(Vehicule)
class VehiculeAdmin(admin.ModelAdmin):
    list_display = ('immatriculation', 'marque', 'modele', 'client')
    search_fields = ('immatriculation', 'vin', 'client__nom')
    list_filter = ('marque',)

@admin.register(Reparation)
class ReparationAdmin(admin.ModelAdmin):
    list_display = ('id', 'vehicule', 'categorie', 'statut', 'progression', 'date_creation')
    list_filter = ('statut', 'priorite', 'categorie')
    search_fields = ('vehicule__immatriculation', 'description')
    inlines = [LigneTravailInline, LignePieceInline]

@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ('numero_facture', 'reparation', 'type', 'total_ttc', 'statut_paiement', 'date_creation')
    list_filter = ('type', 'statut_paiement')
    search_fields = ('numero_facture', 'reparation__vehicule__immatriculation')

@admin.register(Devis)
class DevisAdmin(admin.ModelAdmin):
    list_display = ('numero_devis', 'reparation', 'statut', 'total_ttc', 'date_creation')
    list_filter = ('statut',)

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('nom', 'sku', 'categorie', 'quantite', 'seuil_alerte', 'prix_unitaire')
    list_filter = ('categorie',)
    search_fields = ('nom', 'sku')

@admin.register(MouvementCaisse)
class MouvementCaisseAdmin(admin.ModelAdmin):
    list_display = ('date_mouvement', 'type_mouvement', 'categorie', 'montant', 'utilisateur')
    list_filter = ('type_mouvement', 'categorie')

@admin.register(MaintenancePredictive)
class MaintenancePredictiveAdmin(admin.ModelAdmin):
    list_display = ('vehicule', 'type_maintenance', 'date_prochaine_prevue', 'actif')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('client', 'date_rdv', 'service_demande', 'statut')
    list_filter = ('statut',)

@admin.register(NotificationClient)
class NotificationClientAdmin(admin.ModelAdmin):
    list_display = ('client', 'type', 'lu', 'date_envoi')
    list_filter = ('type', 'lu')
