import os
import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# --- SERVICES SMS ---
def send_sms(phone_number, message):
    """
    Service d'envoi de SMS via Brevo (Sendinblue).
    """
    logger.debug("[SMS] Tentative d'envoi à %s : %s", phone_number, message)

    api_key = getattr(settings, 'BREVO_API_KEY', os.getenv('BREVO_API_KEY'))
    
    if not api_key:
        logger.info("[SMS] Config Brevo manquante. SMS non envoyé (Simulation).")
        return False

    import sib_api_v3_sdk
    from sib_api_v3_sdk.rest import ApiException

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key

    api_instance = sib_api_v3_sdk.TransactionalSMSApi(sib_api_v3_sdk.ApiClient(configuration))
    
    clean_phone = phone_number.replace(' ', '').replace('+', '')
    if not clean_phone.startswith('229'):
        clean_phone = '229' + clean_phone

    send_transac_sms = sib_api_v3_sdk.SendTransacSms(
        sender="LUXEL-G",
        recipient=clean_phone,
        content=message,
        type="transactional"
    )

    try:
        api_instance.send_transac_sms(send_transac_sms)
        logger.info("[SMS] SMS envoyé via Brevo à %s", clean_phone)
        return True
    except ApiException as e:
        logger.error("[SMS] Erreur Brevo SMS: %s", e)
        return False
    except Exception as e:
        logger.error("[SMS] Erreur critique SMS: %s", e)
        return False

def send_otp_sms(phone_number, code):
    """Compatibilité pour les codes OTP."""
    return send_sms(phone_number, f"LUXEL-G : Votre code de connexion est {code}. Valide 10 min.")

# --- SERVICES IA (REMOVED) ---
# Les helpers d'IA (Google Gemini, chatbot, suggestions, analyse de sentiment)
# ont été retirés du projet sur demande. Pour garder la compatibilité,
# conservez uniquement les fonctions non-AI ci-dessous (ex: predict_payment_risk).

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


# --- KKIAPAY INTEGRATION ---

def verify_kkiapay_transaction(transaction_id):
    """
    Vérifie une transaction Kkiapay via le SDK Python.
    """
    from kkiapay import Kkiapay
    
    public_key = getattr(settings, 'KKIAPAY_PUBLIC_KEY', os.getenv('KKIAPAY_PUBLIC_KEY'))
    private_key = getattr(settings, 'KKIAPAY_PRIVATE_KEY', os.getenv('KKIAPAY_PRIVATE_KEY'))
    secret = getattr(settings, 'KKIAPAY_SECRET', os.getenv('KKIAPAY_SECRET'))
    sandbox = getattr(settings, 'KKIAPAY_SANDBOX', True)

    if not all([public_key, private_key, secret]):
        logger.warning("[KKIAPAY] Configuration manquante.")
        return None

    k = Kkiapay(public_key, private_key, secret, sandbox=sandbox)
    try:
        # Le SDK retourne directement le dictionnaire JSON de la réponse
        res = k.verify_transaction(transaction_id)
        
        # res est un dict (ex: {"status": "SUCCESS", "amount": ...})
        if isinstance(res, dict) and res.get('status') in ['SUCCESS', 'SUCCESSFULL']:
            return res
        return None
    except Exception as e:
        logger.error("[KKIAPAY] Erreur de vérification : %s", repr(e))
        return None


# --- e-MECeF INTEGRATION (DGI BENIN) ---

def generate_emecef_invoice(facture):
    """
    Génère une facture normalisée via l'API e-MECeF.
    Logue chaque tentative (succès ET échec) dans LogNormalisationEmecef.
    """
    from api.models import LogNormalisationEmecef

    api_token = getattr(settings, 'EMECEF_API_TOKEN', os.getenv('EMECEF_API_TOKEN'))
    api_url = getattr(settings, 'EMECEF_API_URL', 'https://test-api.impots.bj/sygmef-emcf')

    client = facture.reparation.vehicule.client

    if not api_token:
        logger.info("[e-MECeF] Token manquant. Simulation de normalisation.")
        result = {
            "uid": f"SIM-{facture.id}",
            "codeMECeF": "SIM-CODE-MEC-EF-12345678",
            "qrCode": "https://e-mecef.impots.bj/verify/SIM-CODE",
            "counters": "1/1000",
            "status": "SUCCESS"
        }
        LogNormalisationEmecef.objects.create(
            facture=facture,
            statut='SIMULATION',
            payload_envoye=None,
            reponse_recue=result,
            code_http=200,
            uid_emecef=result['uid']
        )
        return result

    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }

    payload = {
        "ifubene": getattr(settings, 'GARAGE_IFU', os.getenv('GARAGE_IFU', '')),
        "type": "FV",
        "client": {
            "name": f"{client.nom} {client.prenoms}",
            "ifu": client.ifu or "0000000000000",
            "contact": client.contact,
            "address": client.adresse,
        },
        "items": []
    }

    for t in facture.reparation.travaux.all():
        payload["items"].append({
            "name": t.description,
            "price": int(t.montant),
            "quantity": 1,
            "taxGroup": "B"
        })

    for p in facture.reparation.pieces.all():
        payload["items"].append({
            "name": p.description,
            "price": int(p.prix_unitaire),
            "quantity": p.quantite,
            "taxGroup": "B"
        })

    try:
        response = requests.post(f"{api_url}/api/invoice", headers=headers, json=payload, timeout=15)
        code_http = response.status_code

        if code_http in [200, 201]:
            data = response.json()
            uid = data.get('uid')
            confirm_res = requests.put(f"{api_url}/api/invoice/{uid}/confirm", headers=headers, timeout=15)
            final_data = confirm_res.json() if confirm_res.status_code == 200 else data

            LogNormalisationEmecef.objects.create(
                facture=facture,
                statut='SUCCES',
                payload_envoye=payload,
                reponse_recue=final_data,
                code_http=confirm_res.status_code if confirm_res.status_code == 200 else code_http,
                uid_emecef=uid
            )
            return final_data
        else:
            err_text = response.text
            logger.warning("[e-MECeF] Erreur API (%s): %s", code_http, err_text)
            LogNormalisationEmecef.objects.create(
                facture=facture,
                statut='ECHEC',
                payload_envoye=payload,
                reponse_recue=None,
                code_http=code_http,
                message_erreur=err_text
            )
            return None
    except Exception as e:
        logger.error("[e-MECeF] Erreur critique : %s", str(e))
        LogNormalisationEmecef.objects.create(
            facture=facture,
            statut='ECHEC',
            payload_envoye=payload,
            reponse_recue=None,
            code_http=None,
            message_erreur=str(e)
        )
        return None

def valider_et_normaliser_facture(facture, request_user=None):
    """
    Transforme une facture PROFORMA en DEFINITIVE, décrémente les stocks,
    et lance la normalisation e-MECeF. Doit être appelé lorsque la facture est soldée
    ou validée manuellement.
    Retourne la facture mise à jour.
    """
    if facture.type != 'PROFORMA':
        return facture

    from django.db import transaction as db_transaction
    from django.utils import timezone
    from api.models import Facture, MouvementStock

    with db_transaction.atomic():
        last_invoice = Facture.objects.filter(type='DEFINITIVE').order_by('numero_facture').last()
        year = timezone.now().year
        count = 1
        if last_invoice and last_invoice.numero_facture and f"FAC-{year}" in last_invoice.numero_facture:
            try:
                last_num = int(last_invoice.numero_facture.split('-')[-1])
                count = last_num + 1
            except (ValueError, IndexError):
                count = Facture.objects.filter(type='DEFINITIVE').count() + 1
        else:
            count = Facture.objects.filter(type='DEFINITIVE').count() + 1

        facture.numero_facture = f"FAC-{year}-{count:04d}"
        facture.type = 'DEFINITIVE'
        facture.date_validation = timezone.now()
        
        # NOTE : La décrémentation des stocks est désormais gérée automatiquement 
        # par les signaux post_save sur le modèle LignePiece pour une gestion en temps réel.

        # Normalisation e-MECeF uniquement si le client l'a demandée
        if facture.demande_normalisation and not facture.is_normalised:
            res_emecef = generate_emecef_invoice(facture)
            if res_emecef:
                facture.emecef_uid = res_emecef.get('uid')
                facture.emecef_code = res_emecef.get('codeMECeF')
                facture.emecef_qr_code = res_emecef.get('qrCode')
                facture.emecef_counters = res_emecef.get('counters')
                facture.emecef_status = res_emecef.get('status')
                facture.is_normalised = True

        facture.save()
        return facture
