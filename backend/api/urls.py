from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet, VehiculeViewSet, ReparationViewSet, 
    StockViewSet, UserViewSet,
    FactureViewSet, LigneTravailViewSet, LignePieceViewSet,
    MouvementCaisseViewSet, DevisViewSet, MaintenancePredictiveViewSet, StatsViewSet,
    AppointmentViewSet, NotificationClientViewSet, ClientSpaceViewSet, AvisViewSet
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'client-space', ClientSpaceViewSet, basename='client-space')
router.register(r'vehicules', VehiculeViewSet)
router.register(r'reparations', ReparationViewSet)
router.register(r'factures', FactureViewSet)
router.register(r'devis', DevisViewSet)
router.register(r'caisse', MouvementCaisseViewSet)
router.register(r'maintenance-predictive', MaintenancePredictiveViewSet)
router.register(r'stats', StatsViewSet, basename='stats')
router.register(r'travaux', LigneTravailViewSet)
router.register(r'pieces-reparation', LignePieceViewSet)
router.register(r'stock', StockViewSet)
router.register(r'users', UserViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'notifications-clients', NotificationClientViewSet)
router.register(r'avis', AvisViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
