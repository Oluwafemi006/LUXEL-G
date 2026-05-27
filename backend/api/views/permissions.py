"""
Q2 — Permissions et throttles centralisés.
"""
from rest_framework import permissions
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class IsDirecteur(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return hasattr(request.user, 'profile') and request.user.profile.role == 'DIRECTEUR'


class IsStaffMember(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return hasattr(request.user, 'profile') and request.user.profile.role in ['DIRECTEUR', 'SECRETAIRE']


class RDVAnonThrottle(AnonRateThrottle):
    """Max 10 demandes de RDV par heure par IP anonyme."""
    rate = '10/hour'


class RDVUserThrottle(UserRateThrottle):
    """Max 20 demandes de RDV par heure par utilisateur connecté."""
    rate = '20/hour'
