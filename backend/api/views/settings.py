"""Paramètres globaux du garage (Directeur uniquement)."""
from ._imports import *


class GarageSettingsViewSet(viewsets.ViewSet):
    """
    Endpoint Singleton pour les paramètres du garage.
    GET  /api/garage-settings/  → Lire les paramètres.
    PATCH /api/garage-settings/  → Modifier les paramètres.
    """
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action == 'list':
            return [IsStaffMember()]
        return [IsDirecteur()]

    def list(self, request):
        settings_obj = GarageSettings.load()
        serializer = GarageSettingsSerializer(settings_obj)
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'put'], url_path='update')
    def update_settings(self, request):
        settings_obj = GarageSettings.load()
        
        # Sécurité : vérifier le mot de passe si on modifie le solde
        if 'solde_ouverture_caisse' in request.data:
            password = request.data.get('password')
            if not password or not request.user.check_password(password):
                return Response(
                    {'detail': 'Mot de passe incorrect ou manquant pour modifier le solde de la caisse.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = GarageSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
