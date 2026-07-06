import os
import json
import logging
import time
import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# --- SERVICES WHATSAPP (Meta Cloud API) ---
def _normalize_phone_wa(phone: str) -> str:
    """Normalise un numéro pour WhatsApp (format E.164 sans '+')."""
    clean = phone.replace(' ', '').replace('+', '').replace('-', '')
    if clean.startswith('00229'):
        clean = clean[2:]  # retirer le double préfixe
    if not clean.startswith('229'):
        clean = '229' + clean
    return clean


def send_whatsapp_message(phone_number: str, message: str) -> bool:
    """
    Envoie un message WhatsApp via Meta Cloud API.
    Nécessite META_WA_ACCESS_TOKEN et META_WA_PHONE_ID dans les variables d'environnement.
    """
    access_token = getattr(settings, 'META_WA_ACCESS_TOKEN', os.getenv('META_WA_ACCESS_TOKEN'))
    phone_id = getattr(settings, 'META_WA_PHONE_ID', os.getenv('META_WA_PHONE_ID'))

    if not access_token or not phone_id:
        logger.info("[WhatsApp] Config Meta manquante (META_WA_ACCESS_TOKEN / META_WA_PHONE_ID). Message non envoyé.")
        return False

    to = _normalize_phone_wa(phone_number)
    url = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message}
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code == 200:
            logger.info("[WhatsApp] Message envoyé à %s", to)
            return True
        else:
            logger.warning("[WhatsApp] Erreur API Meta (%s) : %s", resp.status_code, resp.text)
            return False
    except Exception as e:
        logger.error("[WhatsApp] Erreur réseau : %s", e)
        return False


def send_whatsapp_otp(phone_number: str, code: str) -> bool:
    """
    Envoie un code OTP par WhatsApp (Meta Cloud API).
    Retourne True si succès, False sinon.
    """
    message = (
        f"🔐 *Luxury Elegance Garage*\n\n"
        f"Votre code de connexion : *{code}*\n\n"
        f"⏱ Valide pendant 10 minutes.\n"
        f"Ne le partagez jamais."
    )
    return send_whatsapp_message(phone_number, message)


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

    success_statuses = {'SUCCESS', 'SUCCESSFULL', 'SUCCESSFUL', 'SUCCEEDED', 'PAID', 'APPROVED'}
    pending_statuses = {'PENDING', 'PROCESSING', 'IN_PROGRESS'}

    try:
        # Petite tolérance au délai de propagation Kkiapay après un paiement réussi.
        for attempt in range(3):
            res = k.verify_transaction(transaction_id)

            if isinstance(res, dict):
                status_value = str(
                    res.get('status')
                    or res.get('transactionStatus')
                    or res.get('paymentStatus')
                    or ''
                ).strip().upper()

                if status_value in success_statuses:
                    return res

                if status_value in pending_statuses and attempt < 2:
                    time.sleep(1.5)
                    continue

            if attempt < 2:
                time.sleep(1.5)

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
        if t.description.strip() and t.montant >= 0:
            payload["items"].append({
                "name": t.description,
                "price": int(t.montant),
                "quantity": 1,
                "taxGroup": "B"
            })

    for p in facture.reparation.pieces.all():
        if p.description.strip() and p.prix_unitaire >= 0:
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

def send_facture_email(facture, client, montant, transaction_id=None):
    from django.core.mail import EmailMessage
    from api.utils import generate_document_pdf

    facture.refresh_from_db()
    pdf_content = generate_document_pdf(facture, doc_type="FACTURE")

    if facture.type == 'DEFINITIVE' and facture.numero_facture:
        filename = f"Facture_{facture.numero_facture}.pdf"
        subject = f"Reçu de paiement - Facture {facture.numero_facture}"
    else:
        filename = f"Proforma_OR-{facture.reparation.id:04d}.pdf"
        subject = f"Reçu de paiement - Proforma OR-{facture.reparation.id:04d}"

    body = (
        f"Bonjour {client.nom} {client.prenoms},\n\n"
        f"Nous avons bien reçu votre paiement de {montant:,.0f} FCFA "
        f"pour la facture {facture.numero_facture or facture.id}.\n"
        f"Merci pour votre confiance.\n\n"
        f"Veuillez trouver ci-joint votre document mis à jour.\n\n"
        f"L'équipe Luxury Elegance Garage"
    )
    if transaction_id:
        body += f"\n\nRéférence transaction : {transaction_id}"

    email = EmailMessage(subject, body, settings.DEFAULT_FROM_EMAIL, [client.email])
    email.attach(filename, pdf_content, 'application/pdf')
    email.send()


def finalize_paid_facture(
    facture,
    montant_enregistre,
    transaction_id,
    client=None,
    demande_normalisation=False,
    request_user=None,
    source='Kkiapay',
    mode_paiement='KKIAPAY',
    numero_cheque=None,
    reference_virement=None,
):
    from django.db import transaction as db_transaction
    from api.models import MouvementCaisse, NotificationClient, NotificationStaff

    client = client or facture.reparation.vehicule.client
    mode_paiement = (mode_paiement or source or 'AUTRE').upper()
    source_label = source or mode_paiement

    with db_transaction.atomic():
        facture.montant_paye += montant_enregistre
        facture.mode_paiement = mode_paiement
        facture.numero_cheque = numero_cheque or None
        facture.reference_virement = reference_virement or None
        facture.statut_paiement = 'SOLDE' if facture.montant_paye >= facture.total_ttc else 'PARTIEL'
        facture.save()

        reference_suffix = f" (REF: {transaction_id})" if transaction_id else ""
        MouvementCaisse.objects.create(
            type_mouvement='RECETTE',
            categorie='RECETTE_CLIENT',
            montant=montant_enregistre,
            description=f"Paiement {source_label} — Facture {facture.numero_facture or facture.id}{reference_suffix}",
            facture=facture,
            date_mouvement=timezone.now().date(),
            utilisateur=request_user if request_user and request_user.is_authenticated else None,
        )

        NotificationStaff.objects.create(
            type='PAIEMENT_RECU',
            message=(
                f"Paiement {source_label} de {montant_enregistre:,.0f} F reçu de "
                f"{client.nom} {client.prenoms} — Facture {facture.numero_facture or facture.id}."
            )
        )

        if facture.statut_paiement == 'SOLDE':
            facture.demande_normalisation = demande_normalisation
            facture.save(update_fields=['demande_normalisation'])
            facture = valider_et_normaliser_facture(
                facture,
                request_user=request_user,
                sync_normalization=bool(demande_normalisation),
            )

    NotificationClient.objects.create(
        client=client,
        type='PAIEMENT_CONFIRME',
        message=(
            f"✅ Votre paiement de {montant_enregistre:,.0f} FCFA pour la facture "
            f"{facture.numero_facture or f'#{facture.id}'} a bien été enregistré. Merci !"
        )
    )

    if client.email:
        try:
            send_facture_email(facture, client, montant_enregistre, transaction_id=transaction_id)
            logger.info("[%s] Email de facture envoyé à %s", source_label.upper(), client.email)
        except Exception as e:
            logger.error("[%s] Erreur lors de l'envoi de l'email : %s", source_label.upper(), str(e))

    return facture


def valider_et_normaliser_facture(facture, request_user=None, sync_normalization=False):
    """
    Transforme une facture PROFORMA en DEFINITIVE, décrémente les stocks,
    et lance la normalisation e-MECeF. Doit être appelé lorsque la facture est soldée
    ou validée manuellement.
    Retourne la facture mise à jour.
    """
    from django.db import transaction as db_transaction
    from django.utils import timezone
    from api.models import Facture, MouvementStock

    if facture.type == 'PROFORMA':
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

    # Normalisation e-MECeF. Par défaut asynchrone pour ne pas bloquer les appels staff.
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
            
            if sync_normalization:
                run_normalization()
            else:
                db_transaction.on_commit(lambda: threading.Thread(target=run_normalization).start())

    return facture
