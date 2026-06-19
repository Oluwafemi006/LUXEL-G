import os
import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# --- SERVICES SMS ---
def send_sms(phone_number, message):
    """
    Service d'envoi de SMS via Twilio.
    """
    logger.debug("[SMS] Tentative d'envoi à %s : %s", phone_number, message)

    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', os.getenv('TWILIO_ACCOUNT_SID'))
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', os.getenv('TWILIO_AUTH_TOKEN'))
    twilio_number = getattr(settings, 'TWILIO_PHONE_NUMBER', os.getenv('TWILIO_PHONE_NUMBER'))
    
    if not account_sid or not auth_token or not twilio_number:
        logger.info("[SMS] Config Twilio manquante. SMS non envoyé (Simulation).")
        return False

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        
        clean_phone = phone_number.replace(' ', '').replace('+', '')
        if not clean_phone.startswith('229'):
            clean_phone = '+229' + clean_phone
        elif clean_phone.startswith('229'):
            clean_phone = '+' + clean_phone

        client.messages.create(
            body=message,
            from_=twilio_number,
            to=clean_phone
        )
        logger.info("[SMS] SMS envoyé via Twilio à %s", clean_phone)
        return True
    except ImportError:
        logger.error("[SMS] La librairie twilio n'est pas installée. SMS simulé.")
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
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
        logger.error("[e-MECeF] API Injoignable : %s", str(e))
        # En mode Sandbox, on simule si l'API de la DGI est en panne ou injoignable
        if getattr(settings, 'KKIAPAY_SANDBOX', True):
            logger.info("[e-MECeF] Repli sur simulation (API injoignable en Sandbox).")
            result = {
                "uid": f"SIM-ERR-{facture.id}",
                "codeMECeF": "SIM-CODE-ERR-MEC-EF-9999",
                "qrCode": "https://e-mecef.impots.bj/verify/SIM-ERR",
                "counters": "0/0",
                "status": "SUCCESS"
            }
            LogNormalisationEmecef.objects.create(
                facture=facture,
                statut='SIMULATION',
                payload_envoye=payload,
                reponse_recue=result,
                code_http=None,
                uid_emecef=result['uid'],
                message_erreur=f"Repli auto suite à erreur : {str(e)}"
            )
            return result

        LogNormalisationEmecef.objects.create(
            facture=facture,
            statut='ECHEC',
            payload_envoye=payload,
            reponse_recue=None,
            code_http=None,
            message_erreur=f"API injoignable : {str(e)}"
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
        facture.save()

    # Normalisation e-MECeF asynchrone pour ne pas bloquer le paiement
    if facture.demande_normalisation and not facture.is_normalised:
        client = facture.reparation.vehicule.client
        if not client.ifu:
            logger.info("[e-MECeF] Normalisation ignorée silencieusement car IFU manquant pour la facture %s.", facture.id)
            facture.demande_normalisation = False
            facture.save(update_fields=['demande_normalisation'])
        else:
            import threading
            def run_normalization():
                try:
                    # On recharge la facture pour être sûr d'avoir l'état post-commit
                    from api.models import Facture
                    f_async = Facture.objects.get(pk=facture.id)
                    res_emecef = generate_emecef_invoice(f_async)
                    if res_emecef:
                        f_async.emecef_uid = res_emecef.get('uid')
                        f_async.emecef_code = res_emecef.get('codeMECeF')
                        f_async.emecef_qr_code = res_emecef.get('qrCode')
                        f_async.emecef_counters = res_emecef.get('counters')
                        f_async.emecef_status = res_emecef.get('status')
                        f_async.is_normalised = True
                        f_async.save(update_fields=[
                            'emecef_uid', 'emecef_code', 'emecef_qr_code', 
                            'emecef_counters', 'emecef_status', 'is_normalised'
                        ])
                        logger.info("[e-MECeF] Facture %s normalisée avec succès (asynchrone).", f_async.id)
                except Exception as e:
                    logger.error("[e-MECeF] Erreur lors de la normalisation asynchrone : %s", e)
            
            db_transaction.on_commit(lambda: threading.Thread(target=run_normalization).start())

    return facture
