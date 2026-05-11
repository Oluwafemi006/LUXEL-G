import os
import django
import random
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Client, Vehicule, Reparation, LigneTravail, LignePiece, Stock, Facture, MouvementCaisse, User

def seed_data():
    print("Début de la génération des données...")
    
    # Nettoyage optionnel (à décommenter si vous voulez repartir de zéro)
    # Client.objects.all().delete()
    # Stock.objects.all().delete()
    
    users = list(User.objects.all())
    if not users:
        print("Erreur: Aucun utilisateur trouvé pour être technicien.")
        return

    # 1. Création du Stock
    categories_pieces = ["Filtration", "Freinage", "Suspension", "Éclairage", "Moteur", "Pneumatique"]
    noms_pieces = [
        ("Filtre à huile", 5000, 7500),
        ("Plaquettes de frein avant", 15000, 25000),
        ("Disque de frein", 25000, 45000),
        ("Amortisseur avant", 35000, 55000),
        ("Ampoule H7", 1500, 3000),
        ("Courroie de distribution", 45000, 75000),
        ("Batterie 75Ah", 40000, 65000),
        ("Huile moteur 5W30 (1L)", 4500, 7000),
        ("Pneu 205/55 R16", 35000, 50000),
    ]

    stock_objs = []
    for nom, p_achat, p_vente in noms_pieces:
        sku = f"SKU-{nom[:3].upper()}-{random.randint(100, 999)}"
        stock, _ = Stock.objects.get_or_create(
            sku=sku,
            defaults={
                'nom': nom,
                'categorie': random.choice(categories_pieces),
                'quantite': random.randint(20, 100),
                'seuil_alerte': 5,
                'prix_achat': Decimal(p_achat),
                'prix_unitaire': Decimal(p_vente),
                'emplacement': f"Rayon {random.choice(['A', 'B', 'C'])}{random.randint(1, 10)}"
            }
        )
        stock_objs.append(stock)

    # 2. Création des Clients
    noms = ["ZINSOU", "SOGLO", "BIO", "TOSSOU", "GOMEZ", "ADAM", "HOUNKPONOU", "KODJO", "MENSAH", "DIALLO", "TRAORE", "BONI", "SOUNON", "EZIN", "CHABI", "SALAMI", "LAWSON", "AGOSSOU", "DOSSOU", "KOFFI"]
    prenoms = ["Jean", "Marc", "Sophie", "Alice", "Robert", "Chantal", "Koffi", "Moussa", "Fatou", "Amadou", "Pascaline", "Lucien", "Gilles", "Bertrand", "Cécile", "Didier", "Éric", "Franck", "Gisèle", "Hervé"]
    
    marques = ["Toyota", "Lexus", "Mercedes-Benz", "BMW", "Range Rover", "Hyundai", "Kia", "Ford"]
    modeles = {
        "Toyota": ["Camry", "Corolla", "RAV4", "Prado", "Land Cruiser"],
        "Lexus": ["RX350", "GX460", "ES350", "LX570"],
        "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLE", "ML350"],
        "BMW": ["X5", "X6", "3 Series", "5 Series"],
        "Range Rover": ["Sport", "Vogue", "Evoque"],
        "Hyundai": ["Santa Fe", "Tucson", "Elantra"],
        "Kia": ["Sportage", "Sorento", "Rio"],
        "Ford": ["Explorer", "Edge", "F-150"]
    }

    travaux_possibles = [
        "Vidange moteur complète",
        "Remplacement plaquettes de frein",
        "Révision générale",
        "Diagnostic électronique",
        "Remplacement amortisseurs",
        "Réparation climatisation",
        "Parallélisme et équilibrage",
        "Nettoyage injecteurs",
        "Remplacement kit distribution",
        "Changement de batterie"
    ]

    for i in range(20):
        client = Client.objects.create(
            nom=noms[i],
            prenoms=prenoms[i],
            contact=f"+229 97{random.randint(100000, 999999)}",
            adresse=f"Lot {random.randint(100, 999)}, Quartier {random.choice(['Akpakpa', 'Cadjehoun', 'Fidjrosse', 'Calavi'])}",
            email=f"{prenoms[i].lower()}.{noms[i].lower()}@example.com"
        )
        
        # 1-2 véhicules par client
        num_vehicules = random.randint(1, 2)
        for _ in range(num_vehicules):
            marque = random.choice(marques)
            modele = random.choice(modeles[marque])
            vehicule = Vehicule.objects.create(
                client=client,
                immatriculation=f"BC {random.randint(1000, 9999)} RB",
                marque=marque,
                modele=modele,
                annee=random.randint(2010, 2023),
                couleur=random.choice(["Noir", "Blanc", "Gris", "Bleu Marine", "Rouge"]),
                vin=f"VIN{random.randint(1000000, 9999999)}LUX"
            )
            
            # 60% des clients ont au moins 6 réparations (on prend les 12 premiers)
            num_repairs = random.randint(6, 9) if i < 12 else random.randint(1, 3)
            
            for r_idx in range(num_repairs):
                date_rep = timezone.now() - timedelta(days=random.randint(1, 180))
                statut = random.choices(['TERMINE', 'EN_COURS', 'EN_ATTENTE'], weights=[70, 20, 10])[0]
                
                reparation = Reparation.objects.create(
                    vehicule=vehicule,
                    categorie=random.choice(["Mécanique", "Électricité", "Climatisation", "Entretien"]),
                    description=random.choice(travaux_possibles),
                    priorite=random.choice(['BASSE', 'NORMALE', 'URGENTE']),
                    statut=statut,
                    progression=100 if statut == 'TERMINE' else random.randint(0, 80),
                    technicien=random.choice(users),
                    kilometrage=random.randint(50000, 250000),
                    niveau_carburant=random.choice(["1/4", "1/2", "3/4", "Plein"]),
                    date_creation=date_rep
                )
                # Forcer la date de création car auto_now_add=True
                Reparation.objects.filter(id=reparation.id).update(date_creation=date_rep)

                # Travaux
                total_travaux = Decimal(0)
                for _ in range(random.randint(1, 2)):
                    montant = Decimal(random.randint(5000, 50000))
                    LigneTravail.objects.create(
                        reparation=reparation,
                        description=f"Main d'œuvre : {random.choice(travaux_possibles)}",
                        montant=montant
                    )
                    total_travaux += montant
                
                # Pièces
                total_pieces = Decimal(0)
                for _ in range(random.randint(1, 3)):
                    piece_stock = random.choice(stock_objs)
                    qty = random.randint(1, 4)
                    montant_p = piece_stock.prix_unitaire * qty
                    LignePiece.objects.create(
                        reparation=reparation,
                        article_stock=piece_stock,
                        description=piece_stock.nom,
                        reference=piece_stock.sku,
                        quantite=qty,
                        prix_unitaire=piece_stock.prix_unitaire,
                        prix_achat=piece_stock.prix_achat
                    )
                    total_pieces += montant_p
                
                # Facturation pour les terminés
                if statut == 'TERMINE':
                    total_ht = total_travaux + total_pieces
                    tva = total_ht * Decimal('0.18')
                    total_ttc = total_ht + tva
                    
                    facture = Facture.objects.create(
                        reparation=reparation,
                        numero_facture=f"FAC-{date_rep.year}-{reparation.id:04d}",
                        type='DEFINITIVE',
                        total_ht=total_ht,
                        tva=tva,
                        total_ttc=total_ttc,
                        montant_paye=total_ttc,
                        statut_paiement='SOLDE',
                        mode_paiement=random.choice(['ESPECE', 'MOMOPAY', 'VIREMENT']),
                        date_validation=date_rep
                    )
                    # Forcer la date
                    Facture.objects.filter(id=facture.id).update(date_creation=date_rep)
                    
                    # Mouvement de caisse
                    MouvementCaisse.objects.create(
                        date_mouvement=date_rep.date(),
                        type_mouvement='RECETTE',
                        categorie='RECETTE_CLIENT',
                        montant=total_ttc,
                        description=f"Paiement intégral OR-{reparation.id:04d}",
                        facture=facture,
                        utilisateur=reparation.technicien,
                        date_creation=date_rep
                    )

    print(f"Simulation terminée : 20 clients créés, avec de nombreuses réparations.")

if __name__ == "__main__":
    seed_data()
