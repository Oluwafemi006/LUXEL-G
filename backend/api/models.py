from django.db import models
from django.contrib.auth.models import User

class Client(models.Model):
    nom = models.CharField(max_length=100)
    prenoms = models.CharField(max_length=200)
    contact = models.CharField(max_length=20)
    contact_conducteur = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    adresse = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} {self.prenoms}"

class Vehicule(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='vehicules')
    immatriculation = models.CharField(max_length=20, unique=True)
    marque = models.CharField(max_length=50)
    modele = models.CharField(max_length=100)
    annee = models.IntegerField(blank=True, null=True)
    couleur = models.CharField(max_length=50, blank=True, null=True)
    vin = models.CharField(max_length=50, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.immatriculation} ({self.marque} {self.modele})"

class Reparation(models.Model):
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('EN_COURS', 'En cours'),
        ('TERMINE', 'Terminé'),
        ('ANNULE', 'Annulé'),
    ]
    PRIORITY_CHOICES = [
        ('BASSE', 'Basse'),
        ('NORMALE', 'Normale'),
        ('URGENTE', 'Urgente'),
    ]
    vehicule = models.ForeignKey(Vehicule, on_delete=models.CASCADE, related_name='reparations')
    categorie = models.CharField(max_length=100)
    description = models.TextField()
    priorite = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMALE')
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    progression = models.IntegerField(default=0)
    technicien = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Nouveaux champs pour la réception
    kilometrage = models.IntegerField(default=0)
    niveau_carburant = models.CharField(max_length=50, blank=True, null=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_fin_estimee = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"OR-{self.id} | {self.vehicule.immatriculation}"

class LigneTravail(models.Model):
    reparation = models.ForeignKey(Reparation, on_delete=models.CASCADE, related_name='travaux')
    description = models.CharField(max_length=255)
    montant = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.description} - {self.montant} FCFA"

class LignePiece(models.Model):
    reparation = models.ForeignKey(Reparation, on_delete=models.CASCADE, related_name='pieces')
    reference = models.CharField(max_length=100, blank=True, null=True)
    description = models.CharField(max_length=255)
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.description} ({self.quantite})"

class Facture(models.Model):
    TYPE_CHOICES = [
        ('PROFORMA', 'Proforma'),
        ('DEFINITIVE', 'Définitive'),
    ]
    STATUT_PAIEMENT_CHOICES = [
        ('NON_PAYE', 'Non payé'),
        ('PARTIEL', 'Partiel'),
        ('SOLDE', 'Soldé'),
    ]
    MODE_PAIEMENT_CHOICES = [
        ('ESPECE', 'Espèce'),
        ('MOMOPAY', 'MomoPay'),
        ('VIREMENT', 'Virement Bancaire'),
        ('CHEQUE', 'Chèque'),
        ('AUTRE', 'Autre'),
    ]
    reparation = models.OneToOneField(Reparation, on_delete=models.CASCADE, related_name='facture')
    numero_facture = models.CharField(max_length=20, unique=True, blank=True, null=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PROFORMA')
    total_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_ttc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Nouveaux champs pour le suivi financier
    montant_paye = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAIEMENT_CHOICES, default='NON_PAYE')
    mode_paiement = models.CharField(max_length=20, choices=MODE_PAIEMENT_CHOICES, blank=True, null=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.type} - {self.numero_facture or 'Sans N°'}"

class MouvementCaisse(models.Model):
    TYPE_MOUVEMENT_CHOICES = [
        ('RECETTE', 'Recette'),
        ('DEPENSE', 'Dépense'),
    ]
    CATEGORIE_CHOICES = [
        ('ACHAT_PIECES', 'Achats pièces'),
        ('SALAIRES', 'Salaires'),
        ('LOYER', 'Loyer / Charges'),
        ('CARBURATION', 'Carburation'),
        ('RECETTE_CLIENT', 'Règlement Client'),
        ('AUTRE_RECETTE', 'Autre Recette'),
        ('AUTRE_DEPENSE', 'Autre Dépense'),
    ]
    date_mouvement = models.DateField(default=models.functions.Now())
    type_mouvement = models.CharField(max_length=10, choices=TYPE_MOUVEMENT_CHOICES)
    categorie = models.CharField(max_length=30, choices=CATEGORIE_CHOICES)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    facture = models.ForeignKey(Facture, on_delete=models.SET_NULL, null=True, blank=True, related_name='mouvements')
    utilisateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type_mouvement} - {self.categorie} : {self.montant}"


class Stock(models.Model):
    nom = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    categorie = models.CharField(max_length=100)
    quantite = models.IntegerField(default=0)
    seuil_alerte = models.IntegerField(default=10)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    emplacement = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.nom

class VisiteTechnique(models.Model):
    vehicule = models.ForeignKey(Vehicule, on_delete=models.CASCADE, related_name='visites')
    date_visite = models.DateField()
    date_expiration = models.DateField()
    type_inspection = models.CharField(max_length=100)
    centre = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Visite {self.vehicule.immatriculation} - Exp: {self.date_expiration}"
