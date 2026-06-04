from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Q2 — Import depuis le package views/ (découpage par domaine métier)
from .views import (
    ClientViewSet, VehiculeViewSet, GlobalSearchView,
    ReparationViewSet, LigneTravailViewSet, LignePieceViewSet,
    FactureViewSet, DevisViewSet,
    StockViewSet, MouvementCaisseViewSet, MaintenancePredictiveViewSet, StatsViewSet,
    AppointmentViewSet, NotificationClientViewSet, NotificationStaffViewSet, AvisViewSet,
    ClientSpaceViewSet, AIViewSet, UserViewSet, kkiapay_webhook,
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'client-space', ClientSpaceViewSet, basename='client-space')
router.register(r'ai', AIViewSet, basename='ai')
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
router.register(r'users', UserViewSet, basename='users')
router.register(r'appointments', AppointmentViewSet)
router.register(r'notifications-clients', NotificationClientViewSet)
router.register(r'avis', AvisViewSet)
router.register(r'notifications-staff', NotificationStaffViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('webhooks/kkiapay/', kkiapay_webhook, name='kkiapay_webhook'),
]
