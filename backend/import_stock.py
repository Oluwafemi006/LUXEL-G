import os
import django
import openpyxl
from decimal import Decimal

# Configuration
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Stock

def import_stock_from_excel(file_path):
    print(f"Début de l'importation depuis {file_path}...")
    
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True) # data_only=True pour avoir les valeurs des formules
        sheet = wb.active
        
        count = 0
        # On saute l'entête (ligne 1)
        for row in sheet.iter_rows(min_row=2, values_only=True):
            date, ref, designation, initial, entrees, sorties, theorique, physique, ecart = row
            
            if not ref or not designation:
                continue
                
            # On prend le stock physique s'il existe, sinon le théorique
            quantite = physique if physique is not None else (theorique if theorique is not None else 0)
            
            # Mise à jour ou création de l'article
            stock, created = Stock.objects.update_or_create(
                sku=ref,
                defaults={
                    'nom': designation.strip(),
                    'quantite': int(quantite),
                    'prix_unitaire': Decimal('0.00'), # À compléter manuellement ou via une autre colonne
                    'prix_achat': Decimal('0.00'),
                    'seuil_alerte': 5,
                    'categorie': 'NON_SPECIFIE'
                }
            )
            
            action = "Créé" if created else "Mis à jour"
            print(f"- {action}: {designation} ({ref}) - Quantité: {quantite}")
            count += 1
            
        print(f"Terminé ! {count} articles importés/mis à jour.")
        
    except Exception as e:
        print(f"Erreur lors de l'importation: {e}")

if __name__ == "__main__":
    EXCEL_PATH = '/home/eddy-boni/Documents/Gestion_Stock_ Luxury.xlsx'
    import_stock_from_excel(EXCEL_PATH)
