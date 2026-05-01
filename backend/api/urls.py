from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet, VehiculeViewSet, ReparationViewSet, 
    StockViewSet, VisiteTechniqueViewSet, UserViewSet,
    FactureViewSet, LigneTravailViewSet, LignePieceViewSet,
    MouvementCaisseViewSet
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'vehicules', VehiculeViewSet)
router.register(r'reparations', ReparationViewSet)
router.register(r'factures', FactureViewSet)
router.register(r'caisse', MouvementCaisseViewSet)
router.register(r'travaux', LigneTravailViewSet)
router.register(r'pieces-reparation', LignePieceViewSet)
router.register(r'stock', StockViewSet)
router.register(r'visites', VisiteTechniqueViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
