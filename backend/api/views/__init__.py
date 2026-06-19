"""
Q2 — Package views/ de l'API LUXEL-G.
Chaque module regroupe les ViewSets par domaine métier.
"""
from .permissions import IsDirecteur, IsStaffMember, RDVAnonThrottle, RDVUserThrottle
from .clients import ClientViewSet, VehiculeViewSet, GlobalSearchView
from .reparations import ReparationViewSet, LigneTravailViewSet, LignePieceViewSet, EtapeReparationViewSet
from .facturation import FactureViewSet, DevisViewSet
from .stock import StockViewSet, MouvementCaisseViewSet, MaintenancePredictiveViewSet
from .appointments import AppointmentViewSet, NotificationClientViewSet, NotificationStaffViewSet, AvisViewSet
from .client_space import ClientSpaceViewSet
from .dashboard import UserViewSet, StatsViewSet
from .webhooks import kkiapay_webhook

__all__ = [
    'IsDirecteur', 'IsStaffMember',
    'GlobalSearchView',
    'ClientViewSet', 'VehiculeViewSet',
    'ReparationViewSet', 'LigneTravailViewSet', 'LignePieceViewSet',
    'FactureViewSet', 'DevisViewSet',
    'StockViewSet', 'MouvementCaisseViewSet', 'MaintenancePredictiveViewSet',
    'AppointmentViewSet', 'NotificationClientViewSet', 'NotificationStaffViewSet', 'AvisViewSet',
    'ClientSpaceViewSet',
    'UserViewSet', 'StatsViewSet',
]
