import firebase_admin
from firebase_admin import credentials
import os
from django.conf import settings

def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.path.join(settings.BASE_DIR, 'firebase-service-account.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("[Firebase] Authentification Admin initialisée avec succès.")
        else:
            print(f"[Firebase] ATTENTION : Fichier de clé introuvable à {cred_path}")
