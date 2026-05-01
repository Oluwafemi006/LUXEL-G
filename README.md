# LUXEL-G | Système de Gestion Garage

## Lancement du Backend (Django DRF)
1. Ouvrez un terminal dans `LUXEL-G/backend`
2. Activez l'environnement virtuel : `source venv/bin/activate`
3. Lancez le serveur : `python manage.py runserver`
   - API accessible sur : `http://localhost:8000/api/`
   - Admin accessible sur : `http://localhost:8000/admin/` (Identifiants: admin / admin)

## Lancement du Frontend (React + Vite)
1. Ouvrez un terminal dans `LUXEL-G/frontend`
2. Installez les dépendances (si ce n'est pas déjà fait) : `npm install`
3. Lancez le serveur de développement : `npm run dev`
   - Interface accessible sur : `http://localhost:5173`

## Structure du Projet
- `frontend/` : Application React avec TypeScript et Tailwind CSS.
- `backend/` : API Django REST Framework avec base de données SQLite.
- `api/models.py` : Définition des modèles (Clients, Véhicules, Réparations, Stock, Visites).
