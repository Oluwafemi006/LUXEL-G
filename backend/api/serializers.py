from rest_framework import serializers
from .models import (
    Client, Vehicule, Reparation, Stock, 
    LigneTravail, LignePiece, Facture, MouvementCaisse, Devis, 
    MaintenancePredictive, Appointment, NotificationClient, Avis, UserProfile,
    NotificationStaff
)
from django.contrib.auth.models import User

class LigneTravailSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneTravail
        fields = '__all__'

class LignePieceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LignePiece
        fields = '__all__'

class FactureSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='reparation.vehicule.client.nom')
    vehicule_plate = serializers.ReadOnlyField(source='reparation.vehicule.immatriculation')
    reste_a_payer = serializers.SerializerMethodField()
    
    class Meta:
        model = Facture
        fields = '__all__'

    def get_reste_a_payer(self, obj):
        return obj.total_ttc - obj.montant_paye

class DevisSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='reparation.vehicule.client.nom')
    vehicule_plate = serializers.ReadOnlyField(source='reparation.vehicule.immatriculation')
    
    class Meta:
        model = Devis
        fields = '__all__'

class MouvementCaisseSerializer(serializers.ModelSerializer):
    utilisateur_name = serializers.ReadOnlyField(source='utilisateur.username')
    
    class Meta:
        model = MouvementCaisse
        fields = '__all__'

class ReparationSerializer(serializers.ModelSerializer):
    vehicule_plate = serializers.ReadOnlyField(source='vehicule.immatriculation')
    technicien_name = serializers.ReadOnlyField(source='technicien.username')
    travaux = LigneTravailSerializer(many=True, read_only=True)
    pieces = LignePieceSerializer(many=True, read_only=True)
    facture = FactureSerializer(read_only=True)
    devis = DevisSerializer(many=True, read_only=True)
    client_name = serializers.ReadOnlyField(source='vehicule.client.nom')
    client_contact = serializers.ReadOnlyField(source='vehicule.client.contact')
    email = serializers.ReadOnlyField(source='vehicule.client.email')

    class Meta:
        model = Reparation
        fields = '__all__'

class MiniVehiculeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicule
        fields = ['id', 'immatriculation', 'marque', 'modele']

class VehiculeSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.nom')
    reparations_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicule
        fields = '__all__'

    def get_reparations_count(self, obj):
        return obj.reparations.count()

class ClientSerializer(serializers.ModelSerializer):
    vehicule_count = serializers.SerializerMethodField()
    vehicules_list = MiniVehiculeSerializer(source='vehicules', many=True, read_only=True)
    photo = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Client
        fields = '__all__'

    def get_vehicule_count(self, obj):
        return obj.vehicules.count()

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'

class MaintenancePredictiveSerializer(serializers.ModelSerializer):
    vehicule_plate = serializers.ReadOnlyField(source='vehicule.immatriculation')
    class Meta:
        model = MaintenancePredictive
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.nom')
    vehicule_plate = serializers.ReadOnlyField(source='vehicule.immatriculation')
    class Meta:
        model = Appointment
        fields = ['id', 'client', 'vehicule', 'nom_client_public', 'telephone_client_public', 'date_rdv', 'service_demande', 'notes', 'statut', 'date_creation', 'client_name', 'vehicule_plate']

class NotificationClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationClient
        fields = '__all__'

class NotificationStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationStaff
        fields = '__all__'

class AvisSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.nom')
    class Meta:
        model = Avis
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {'role': 'SECRETAIRE'})
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        UserProfile.objects.get_or_create(user=user, defaults=profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        instance.save()
        
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            profile.role = profile_data.get('role', profile.role)
            profile.save()
            
        return instance
