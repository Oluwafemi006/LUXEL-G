import os
import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# --- SERVICES SMS ---
def send_otp_sms(phone_number, code):
    """
    Service d'envoi de SMS OTP.
    Supporte Twilio par défaut, mais peut être étendu.
    """
    # 1. Toujours logger pour le dev
    logger.debug("[SMS] Envoi du code %s au numéro %s", code, phone_number)

    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', None)

    if not all([account_sid, auth_token, from_number]):
        logger.info("[SMS] Config Twilio manquante. SMS non envoyé (Simulation).")
        return False

    try:
        # Formatage du numéro pour Twilio (doit commencer par +)
        if not phone_number.startswith('+'):
            # On assume +229 si pas d'indicatif (Bénin)
            if phone_number.startswith('229'):
                phone_number = '+' + phone_number
            else:
                phone_number = '+229' + phone_number

        # Utilisation de l'API Twilio via requests (pour éviter d'installer la lib lourde twilio juste pour un test)
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = {
            "To": phone_number,
            "From": from_number,
            "Body": f"LUXEL-G : Votre code de connexion est {code}. Valide 10 min."
        }
        response = requests.post(url, data=data, auth=(account_sid, auth_token))
        
        if response.status_code == 201:
            logger.info("[SMS] SMS envoyé avec succès à %s", phone_number)
            return True
        else:
            logger.warning("[SMS] Erreur Twilio: %s", response.text)
            return False

    except Exception as e:
        logger.error("[SMS] Erreur critique: %s", str(e))
        return False

# --- SERVICES IA (GOOGLE GEMINI) ---

def call_gemini_api(prompt):
    """
    Appelle l'API Google Gemini avec un prompt spécifique.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY'))
    if not api_key:
        logger.warning("[AI] Clé API Gemini manquante.")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1024,
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            return result['candidates'][0]['content']['parts'][0]['text']
        else:
            logger.warning("[AI] Erreur API Gemini (%s): %s", response.status_code, response.text)
            return None
    except Exception as e:
        logger.error("[AI] Erreur critique lors de l'appel Gemini: %s", str(e))
        return None

def generate_repair_summary(repair_data):
    """
    Génère un résumé en langage naturel de l'historique d'un véhicule.
    """
    prompt = f"""
    En tant qu'expert mécanicien du garage LUXEL-G à Parakou, résume l'historique de réparation suivant pour un client. 
    Sois professionnel, rassurant et concis. Mentionne les points clés et les éventuelles alertes de maintenance.
    
    DONNÉES DE L'HISTORIQUE :
    {json.dumps(repair_data, indent=2)}
    
    RÉPONSE (en français, maximum 4-5 phrases) :
    """
    return call_gemini_api(prompt)

def suggest_parts_ai(query, context=""):
    """
    Aide la secrétaire à trouver le nom technique d'une pièce automobile.
    """
    prompt = f"""
    En tant qu'expert en pièces détachées automobiles et mécanique pour le garage LUXEL-G à Parakou, aide la secrétaire à identifier et catégoriser une pièce.
    Elle a saisi : "{query}"
    Contexte (véhicule/réparation) : "{context}"
    
    Propose 3 suggestions de noms techniques exacts. Pour chaque suggestion, fournis :
    1. 'nom': Le nom officiel et technique de la pièce.
    2. 'role': Une explication très courte (10 mots max) de son utilité.
    3. 'categorie': La catégorie (ex: Direction, Suspension, Freinage, Moteur, Électricité, Filtration, Échappement).
    4. 'reference_standard': Une référence type ou un code standard.
    5. 'prix_indicatif': Un prix moyen estimé en FCFA (sans virgule).
    
    Réponds UNIQUEMENT avec un objet JSON valide sous cette forme :
    {{
      "suggestions": [
        {{
          "nom": "...",
          "role": "...",
          "categorie": "...",
          "reference_standard": "...",
          "prix_indicatif": 15000
        }}
      ]
    }}
    """
    response_text = call_gemini_api(prompt)
    if response_text:
        # Nettoyage si l'IA ajoute des balises ```json
        clean_json = response_text.replace('```json', '').replace('```', '').strip()
        try:
            return json.loads(clean_json)
        except:
            return {"error": "Format JSON invalide", "raw": response_text}
    return None


# --- F1 : CHATBOT PUBLIC IA (Gemini) ---

GARAGE_CONTEXT = """
Tu es l'assistant virtuel du garage LUXURY ÉLÉGANCE GARAGE à Parakou, Bénin.
Tu réponds en français, de manière professionnelle, chaleureuse et concise (3-4 phrases maximum).

Informations importantes sur le garage :
- Nom : Luxury Élégance Garage (LUXEL-G)
- Adresse : Quartier Okedama, von Hôpital Ahmadiyya, Parakou, Bénin
- Téléphone : +229 01 92 62 98 60
- Horaires : Lundi–Vendredi 08h00–18h30 | Samedi 09h00–14h00
- Services : Mécanique générale, Électricité auto, Pneumatique, Lavage complet, Entretien général
- IFU : 3202487942483 | RCCM : RB/PKO/24B 1195

Règles :
- Pour prendre RDV, oriente vers le formulaire sur la page ou le numéro de téléphone.
- Pour le suivi de réparation, oriente vers l'espace client (connexion avec numéro de téléphone).
- Pour les prix, dis que les tarifs sont établis après diagnostic et devis, et invite à appeler.
- Ne donne jamais de prix précis non validés.
- Reste dans le contexte du garage. Si la question est hors sujet, redirige poliment.
"""


def chatbot_garage_response(user_message: str, conversation_history: list = None) -> str:
    """
    F1 — Génère une réponse de l'assistant IA du garage LUXEL-G.
    conversation_history : liste de dicts [{role: 'user'|'model', text: '...'}]
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY'))
    if not api_key:
        return "Je suis temporairement indisponible. Appelez-nous au +229 01 92 62 98 60."

    history = conversation_history or []

    # Construction du prompt avec historique
    prompt_parts = [GARAGE_CONTEXT.strip(), "\n\n--- CONVERSATION ---"]
    for msg in history[-6:]:  # max 6 messages d'historique
        role = "Client" if msg.get('role') == 'user' else "Assistant"
        prompt_parts.append(f"{role} : {msg.get('text', '')}")
    prompt_parts.append(f"Client : {user_message}")
    prompt_parts.append("Assistant :")

    full_prompt = "\n".join(prompt_parts)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"temperature": 0.6, "maxOutputTokens": 300}
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code == 200:
            return r.json()['candidates'][0]['content']['parts'][0]['text'].strip()
        logger.warning("[CHATBOT] Erreur Gemini %s", r.status_code)
    except Exception as e:
        logger.error("[CHATBOT] Erreur critique : %s", e)

    return "Désolé, je rencontre un problème technique. Contactez-nous au +229 01 92 62 98 60."


# --- F2 : ANALYSE SENTIMENT DES AVIS ---

def analyze_avis_sentiments(avis_list: list) -> dict:
    """
    F2 — Analyse le sentiment de chaque avis client et retourne un rapport global.
    avis_list : liste de dicts {id, note, commentaire}
    """
    if not avis_list:
        return {"global": "NEUTRE", "positif": 0, "neutre": 0, "negatif": 0, "details": []}

    avis_json = json.dumps(avis_list, ensure_ascii=False, indent=2)
    prompt = f"""
Analyse le sentiment de chaque avis client du garage LUXEL-G.
Pour chaque avis, détermine : POSITIF, NEUTRE, ou NEGATIF.
Retourne UNIQUEMENT un JSON valide avec ce format exact :
{{
  "global": "POSITIF|NEUTRE|NEGATIF",
  "positif": <nombre>,
  "neutre": <nombre>,
  "negatif": <nombre>,
  "details": [
    {{"id": <id>, "sentiment": "POSITIF|NEUTRE|NEGATIF", "resume": "<1 phrase courte>"}}
  ]
}}

AVIS :
{avis_json}
"""
    response = call_gemini_api(prompt)
    if response:
        clean = response.replace('```json', '').replace('```', '').strip()
        try:
            return json.loads(clean)
        except Exception as e:
            logger.warning("[SENTIMENT] Parsing JSON échoué : %s", e)

    # Fallback heuristique basé sur les notes
    positif = sum(1 for a in avis_list if a.get('note', 3) >= 4)
    negatif = sum(1 for a in avis_list if a.get('note', 3) <= 2)
    neutre = len(avis_list) - positif - negatif
    global_sent = "POSITIF" if positif > negatif else ("NEGATIF" if negatif > positif else "NEUTRE")
    return {
        "global": global_sent, "positif": positif, "neutre": neutre, "negatif": negatif,
        "details": [{"id": a.get('id'), "sentiment": ("POSITIF" if a.get('note', 3) >= 4 else "NEGATIF" if a.get('note', 3) <= 2 else "NEUTRE"), "resume": a.get('commentaire', '')[:60]} for a in avis_list]
    }


# --- F3 : PRÉDICTION RISQUE IMPAYÉ (heuristique) ---

def predict_payment_risk(client_data: dict) -> dict:
    """
    F3 — Évalue le risque d'impayé d'un client selon une heuristique simple.
    client_data : {factures_total, factures_partielles, solde_impaye, derniere_visite_jours}
    """
    score = 0
    raisons = []

    total = client_data.get('factures_total', 0)
    partielles = client_data.get('factures_partielles', 0)
    solde = float(client_data.get('solde_impaye', 0))
    jours = client_data.get('derniere_visite_jours', 0)

    if total > 0:
        ratio = partielles / total
        if ratio > 0.5:
            score += 40
            raisons.append(f"{int(ratio*100)}% de factures partiellement réglées")
        elif ratio > 0.2:
            score += 20
            raisons.append("Historique de paiements partiels")

    if solde > 100000:
        score += 30
        raisons.append(f"Solde impayé élevé : {solde:,.0f} F")
    elif solde > 30000:
        score += 15

    if jours > 90:
        score += 20
        raisons.append(f"Dernière visite il y a {jours} jours")
    elif jours > 30:
        score += 5

    score = min(score, 100)

    if score >= 60:
        niveau = "ÉLEVÉ"
        couleur = "rouge"
    elif score >= 30:
        niveau = "MODÉRÉ"
        couleur = "orange"
    else:
        niveau = "FAIBLE"
        couleur = "vert"

    return {
        "score": score,
        "niveau": niveau,
        "couleur": couleur,
        "raisons": raisons,
        "recommandation": "Exiger paiement comptant" if score >= 60 else ("Surveiller les délais" if score >= 30 else "Risque faible")
    }
