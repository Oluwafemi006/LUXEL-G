from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('DIRECTEUR', 'Directeur'),
        ('SECRETAIRE', 'Secrétaire'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='SECRETAIRE')

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Client(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='client_profile')
    nom = models.CharField(max_length=100)
    prenoms = models.CharField(max_length=200)
    contact = models.CharField(max_length=20, unique=True)
    contact_conducteur = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    adresse = models.TextField()
    photo = models.ImageField(upload_to='clients_photos/', blank=True, null=True)
    # Fiscal — renseigné par le staff uniquement
    ifu = models.CharField(max_length=13, blank=True, null=True, verbose_name="Numéro IFU")
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} {self.prenoms}"

class Vehicule(models.Model):
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='vehicules')
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
    # M1 — Numéro OR séquentiel unique (format OR-0001), généré automatiquement à la création
    numero_or = models.CharField(max_length=10, unique=True, blank=True, null=True, verbose_name="N° Ordre de Réparation")
    vehicule = models.ForeignKey(Vehicule, on_delete=models.PROTECT, related_name='reparations')
    categorie = models.CharField(max_length=100)
    description = models.TextField()
    priorite = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMALE')
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    progression = models.IntegerField(default=0)
    technicien = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Champs pour la réception
    kilometrage = models.IntegerField(default=0)
    niveau_carburant = models.CharField(max_length=50, blank=True, null=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_fin_estimee = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        """M1 — Génère automatiquement un numéro OR unique à la première sauvegarde."""
        if not self.numero_or:
            if self.pk:
                self.numero_or = f"OR-{self.pk:04d}"
            else:
                super().save(*args, **kwargs)
                self.numero_or = f"OR-{self.pk:04d}"
                return super().save(update_fields=['numero_or'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.numero_or or f'OR-{self.id}'} | {self.vehicule.immatriculation}"

class LigneTravail(models.Model):
    reparation = models.ForeignKey(Reparation, on_delete=models.PROTECT, related_name='travaux')
    description = models.CharField(max_length=255)
    montant = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.description} - {self.montant} FCFA"

class LignePiece(models.Model):
    reparation = models.ForeignKey(Reparation, on_delete=models.PROTECT, related_name='pieces')
    article_stock = models.ForeignKey('Stock', on_delete=models.SET_NULL, null=True, blank=True)
    reference = models.CharField(max_length=100, blank=True, null=True)
    description = models.CharField(max_length=255)
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    prix_achat = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Stocké au moment de la vente

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
        ('KKIAPAY', 'Kkiapay'),
        ('AUTRE', 'Autre'),
    ]
    reparation = models.OneToOneField(Reparation, on_delete=models.PROTECT, related_name='facture')
    numero_facture = models.CharField(max_length=20, unique=True, blank=True, null=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PROFORMA')
    total_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_ttc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Suivi financier
    montant_paye = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAIEMENT_CHOICES, default='NON_PAYE')
    mode_paiement = models.CharField(max_length=20, choices=MODE_PAIEMENT_CHOICES, blank=True, null=True)
    # Normalisation e-MECeF — demandée par le client au moment du paiement
    demande_normalisation = models.BooleanField(default=False, verbose_name="Facture normalisée demandée")

    # M2 — Champs de traçabilité paiement (requis par le CDC)
    numero_cheque = models.CharField(max_length=50, blank=True, null=True, verbose_name="N° de chèque")
    reference_virement = models.CharField(max_length=100, blank=True, null=True, verbose_name="Référence virement")

    # e-MECeF fields
    emecef_uid = models.CharField(max_length=100, blank=True, null=True)
    emecef_code = models.CharField(max_length=50, blank=True, null=True)
    emecef_qr_code = models.TextField(blank=True, null=True)
    emecef_counters = models.CharField(max_length=100, blank=True, null=True)
    emecef_status = models.CharField(max_length=50, blank=True, null=True)
    is_normalised = models.BooleanField(default=False)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # M4 — Ne pas forcer SOLDE automatiquement sur total = 0.
        # Le statut est géré explicitement par enregistrer_paiement().
        # Seule exception : les factures de référence créées avec total_ttc = 0
        # ET montant_paye = 0 (cas de services offerts grâce à une création manuelle admin).
        if self.total_ttc <= 0 and self.montant_paye <= 0 and self.pk is None:
            self.statut_paiement = 'SOLDE'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.type} - {self.numero_facture or 'Sans N°'}"

class Devis(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYE', 'Envoyé'),
        ('ACCEPTE', 'Accepté'),
        ('REFUSE', 'Refusé'),
        ('FACTURE', 'Facturé'),
    ]
    reparation = models.ForeignKey(Reparation, on_delete=models.PROTECT, related_name='devis')
    numero_devis = models.CharField(max_length=20, unique=True, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_validite = models.DateField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='BROUILLON')
    
    total_ht = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_ttc = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Devis {self.numero_devis or 'Brouillon'} - {self.reparation.vehicule.immatriculation}"

class MouvementCaisse(models.Model):
    TYPE_MOUVEMENT_CHOICES = [
        ('RECETTE', 'Recette'),
        ('DEPENSE', 'Dépense'),
    ]
    date_mouvement = models.DateField(default=timezone.now)
    type_mouvement = models.CharField(max_length=10, choices=TYPE_MOUVEMENT_CHOICES)
    categorie = models.CharField(max_length=100) # Changé en CharField libre
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
    quantite = models.IntegerField(default=0, validators=[MinValueValidator(0)]) # Stock Physique Actuel
    stock_initial = models.IntegerField(default=0, validators=[MinValueValidator(0)]) # Au début de la période/mois
    seuil_alerte = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    prix_achat = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    emplacement = models.CharField(max_length=50, blank=True, null=True)

    @property
    def entrees_total(self):
        return self.mouvements.filter(type_mouvement='ENTREE').aggregate(models.Sum('quantite'))['quantite__sum'] or 0

    @property
    def sorties_total(self):
        return self.mouvements.filter(type_mouvement='SORTIE').aggregate(models.Sum('quantite'))['quantite__sum'] or 0

    @property
    def stock_theorique(self):
        return self.stock_initial + self.entrees_total - self.sorties_total

    @property
    def ecart(self):
        return self.quantite - self.stock_theorique

    def __str__(self):
        return self.nom

class MouvementStock(models.Model):
    TYPE_MOUVEMENT = [
        ('ENTREE', 'Entrée (Achat/Retour)'),
        ('SORTIE', 'Sortie (Réparation/Vente)'),
        ('AJUSTEMENT', 'Ajustement Inventaire'),
    ]
    article = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='mouvements')
    type_mouvement = models.CharField(max_length=20, choices=TYPE_MOUVEMENT)
    quantite = models.IntegerField()
    description = models.CharField(max_length=255, blank=True, null=True)
    date_mouvement = models.DateTimeField(auto_now_add=True)
    utilisateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.type_mouvement} - {self.article.nom} ({self.quantite})"

class MaintenancePredictive(models.Model):
    TYPE_MAINTENANCE = [
        ('VIDANGE', 'Vidange'),
        ('REVISION', 'Révision Générale'),
        ('COURROIE', 'Courroie de Distribution'),
        ('PNEUS', 'Changement Pneus'),
    ]
    vehicule = models.ForeignKey(Vehicule, on_delete=models.CASCADE, related_name='maintenances_futures')
    type_maintenance = models.CharField(max_length=20, choices=TYPE_MAINTENANCE)
    date_derniere_prestation = models.DateField(auto_now_add=True)
    km_derniere_prestation = models.IntegerField()
    
    date_prochaine_prevue = models.DateField(null=True, blank=True)
    km_prochain_prevu = models.IntegerField(null=True, blank=True)
    
    actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.type_maintenance} prévue pour {self.vehicule.immatriculation}"

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('CONFIRME', 'Confirmé'),
        ('ANNULE', 'Annulé'),
        ('TERMINE', 'Terminé'),
    ]
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='appointments', null=True, blank=True)
    vehicule = models.ForeignKey(Vehicule, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Champs pour clients non enregistrés (via portail public)
    nom_client_public = models.CharField(max_length=200, blank=True, null=True)
    telephone_client_public = models.CharField(max_length=20, blank=True, null=True)
    
    date_rdv = models.DateTimeField()
    service_demande = models.CharField(max_length=200)
    notes = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RDV {self.nom_client_public or (self.client.nom if self.client else 'Inconnu')} - {self.date_rdv}"

class NotificationClient(models.Model):
    TYPE_CHOICES = [
        ('REPARATION_TERMINEE', 'Réparation terminée'),
        ('RAPPEL_MAINTENANCE', 'Rappel maintenance'),
        ('RDV_CONFIRME', 'RDV Confirmé'),
        ('FACTURE_ENVOYEE', 'Facture envoyée'),
        ('DEVIS_ENVOYE', 'Devis envoyé'),
        ('PAIEMENT_CONFIRME', 'Paiement confirmé'),
        ('MODIFICATION_ACCEPTEE', 'Modification prise en compte'),
    ]
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    message = models.TextField()
    lu = models.BooleanField(default=False)
    date_envoi = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notif {self.client.nom} - {self.type}"

class NotificationStaff(models.Model):
    TYPE_CHOICES = [
        ('NOUVEAU_RDV', 'Nouveau Rendez-vous'),
        ('NOUVEL_AVIS', 'Nouvel Avis Client'),
        ('STOCK_BAS', 'Alerte Stock Bas'),
        ('PAIEMENT_RECU', 'Paiement Reçu'),
        ('DEMANDE_MODIFICATION_PROFORMA', 'Demande de modification proforma'),
    ]
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    message = models.TextField()
    lu = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Staff Notif - {self.type} - {self.date_creation}"

class Avis(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='avis')
    reparation = models.ForeignKey(Reparation, on_delete=models.SET_NULL, null=True, blank=True, related_name='avis')
    note = models.IntegerField(default=5) # 1 à 5
    commentaire = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    affiche_public = models.BooleanField(default=False)

    def __str__(self):
        return f"Avis {self.client.nom} - {self.note}/5"

class ClientOTP(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        # Valide pendant 10 minutes
        return not self.is_used and (timezone.now() - self.created_at).total_seconds() < 600

    def __str__(self):
        return f"OTP {self.client.nom} - {self.code}"

class LogNormalisationEmecef(models.Model):
    """
    Trace chaque tentative de normalisation e-MECeF (succès ET échec).
    Permet de répondre à toute contestation de la DGI en production.
    """
    STATUT_CHOICES = [
        ('SUCCES', 'Succès'),
        ('ECHEC', 'Échec'),
        ('SIMULATION', 'Simulation (dev)'),
    ]
    facture = models.ForeignKey(Facture, on_delete=models.PROTECT, related_name='logs_emecef')
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES)
    payload_envoye = models.JSONField(null=True, blank=True, verbose_name="Payload envoyé à la DGI")
    reponse_recue = models.JSONField(null=True, blank=True, verbose_name="Réponse reçue de la DGI")
    code_http = models.IntegerField(null=True, blank=True, verbose_name="Code HTTP de la réponse")
    message_erreur = models.TextField(blank=True, null=True, verbose_name="Détail de l'erreur")
    uid_emecef = models.CharField(max_length=100, blank=True, null=True, verbose_name="UID e-MECeF retourné")
    date_tentative = models.DateTimeField(auto_now_add=True, verbose_name="Date de la tentative")

    class Meta:
        verbose_name = "Log Normalisation e-MECeF"
        verbose_name_plural = "Logs Normalisation e-MECeF"
        ordering = ['-date_tentative']

    def __str__(self):
        return f"[{self.statut}] Facture #{self.facture_id} — {self.date_tentative.strftime('%d/%m/%Y %H:%M')}"

# --- SIGNALS POUR L'AUTOMATISATION DU STOCK (REQUIS PAR LE MÉMOIRE) ---

@receiver(post_save, sender=LignePiece)
def update_stock_on_piece_added(sender, instance, created, **kwargs):
    """Décrémente automatiquement le stock physique lorsqu'une pièce est ajoutée à une réparation."""
    if created and instance.article_stock:
        article = instance.article_stock
        if article.quantite >= instance.quantite:
            article.quantite -= instance.quantite
            article.save()
            # Enregistrement du mouvement de stock pour la traçabilité
            MouvementStock.objects.create(
                article=article,
                type_mouvement='SORTIE',
                quantite=instance.quantite,
                description=f"Sortie auto : Réparation {instance.reparation.numero_or or f'OR-{instance.reparation.id}'}"
            )

@receiver(post_delete, sender=LignePiece)
def update_stock_on_piece_deleted(sender, instance, **kwargs):
    """Réincrémente le stock si une pièce est retirée de l'ordre de réparation avant facturation."""
    if instance.article_stock:
        article = instance.article_stock
        article.quantite += instance.quantite
        article.save()
        MouvementStock.objects.create(
            article=article,
            type_mouvement='ENTREE',
            quantite=instance.quantite,
            description=f"Retour auto : Suppression de ligne sur {instance.reparation.numero_or or f'OR-{instance.reparation.id}'}"
        )
