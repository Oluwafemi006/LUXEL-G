import io
import os
import qrcode
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, Image
from reportlab.lib.units import cm


def get_logo_image(width=4*cm):
    """Utility to get the logo image object if it exists."""
    logo_path = os.path.join(settings.BASE_DIR.parent, 'logo.png')
    if os.path.exists(logo_path):
        # Image maintains aspect ratio if only width or height is provided
        img = Image(logo_path)
        aspect = img.imageHeight / img.imageWidth
        img.drawHeight = width * aspect
        img.drawWidth = width
        return img
    return None


def generate_fiche_reception_pdf(reparation):
    """
    M5 — Génère le PDF de la fiche de réception d'un véhicule,
    fidèle au document papier existant du garage LUXEL-G.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=1.5*cm, leftMargin=1.5*cm,
        topMargin=1.5*cm, bottomMargin=1.5*cm
    )
    elements = []
    styles = getSampleStyleSheet()

    # Styles personnalisés
    bold = ParagraphStyle('Bold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9)
    normal = ParagraphStyle('Norm', parent=styles['Normal'], fontSize=9)
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16,
                                  textColor=colors.HexColor('#0056b3'), alignment=1)
    small = ParagraphStyle('Small', parent=styles['Normal'], fontSize=8)

    # ── EN-TÊTE ────────────────────────────────────────────────
    logo = get_logo_image(width=2.5*cm)
    company_info = Paragraph('<b>LUXURY ÉLÉGANCE GARAGE</b><br/>Quartier Okedama, von hôpital Ahmadiyya<br/>Parakou, Bénin<br/>Tél : +229 01 92 62 98 60<br/>IFU : 3202487942483 | RCCM : RB/PKO/24B 1195', small)
    
    header_data = [[
        [logo, company_info] if logo else company_info,
        Paragraph('FICHE DE RÉCEPTION VÉHICULE', title_style),
        Paragraph(f'<b>N° OR :</b> {reparation.numero_or or f"OR-{reparation.id}"}<br/>'
                  f'<b>Date :</b> {reparation.date_creation.strftime("%d/%m/%Y %H:%M")}<br/>'
                  f'<b>Statut :</b> {reparation.get_statut_display()}', normal),
    ]]
    header_table = Table(header_data, colWidths=[6.5*cm, 7.5*cm, 5*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#0056b3')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f4f8')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (0, 0), 10),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.4*cm))

    # ── INFOS CLIENT & VÉHICULE ────────────────────────────────
    client = reparation.vehicule.client
    vehicule = reparation.vehicule
    cv_data = [
        [Paragraph('<b>INFORMATIONS CLIENT</b>', bold), Paragraph('<b>INFORMATIONS VÉHICULE</b>', bold)],
        [Paragraph(f'<b>Nom :</b> {client.nom} {client.prenoms}', normal),
         Paragraph(f'<b>Marque / Modèle :</b> {vehicule.marque} {vehicule.modele}', normal)],
        [Paragraph(f'<b>Contact :</b> {client.contact}', normal),
         Paragraph(f'<b>Immatriculation :</b> {vehicule.immatriculation}', normal)],
        [Paragraph(f'<b>Conducteur :</b> {client.contact_conducteur or "—"}', normal),
         Paragraph(f'<b>Couleur :</b> {vehicule.couleur or "—"}', normal)],
        [Paragraph(f'<b>Adresse :</b> {client.adresse or "—"}', normal),
         Paragraph(f'<b>VIN :</b> {vehicule.vin or "—"}', normal)],
    ]
    cv_table = Table(cv_data, colWidths=[9.25*cm, 9.25*cm])
    cv_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0056b3')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('SPAN', (0, 0), (0, 0)),
    ]))
    elements.append(cv_table)
    elements.append(Spacer(1, 0.3*cm))

    # ── ÉTAT VÉHICULE À LA RÉCEPTION ──────────────────────────
    niv_carburant = reparation.niveau_carburant or '—'
    date_sortie = reparation.date_fin_estimee.strftime('%d/%m/%Y') if reparation.date_fin_estimee else '—'
    etat_data = [
        [Paragraph('<b>ÉTAT À LA RÉCEPTION</b>', bold), '', '', ''],
        [Paragraph(f'<b>Kilométrage :</b> {reparation.kilometrage:,} km', normal),
         Paragraph(f'<b>Niveau carburant :</b> {niv_carburant}', normal),
         Paragraph(f'<b>Date sortie prévue :</b> {date_sortie}', normal),
         Paragraph(f'<b>Priorité :</b> {reparation.get_priorite_display()}', normal)],
    ]
    etat_table = Table(etat_data, colWidths=[4.6*cm, 4.6*cm, 4.6*cm, 4.6*cm])
    etat_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (-1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0056b3')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(etat_table)
    elements.append(Spacer(1, 0.3*cm))

    # ── PIÈCES À BORD ─────────────────────────────────────────
    PIECES_BORD = ['Livret', 'Cric', 'Extincteur', 'Tapis', 'Double clé',
                   'Assurance', 'TVM', 'Visite technique', 'Clé de roue', 'Pneu secours', 'Batterie']

    def case(label):
        return Paragraph(f'☐ {label}', small)

    pieces_rows = [[Paragraph('<b>PIÈCES À BORD</b>', bold)] + [''] * (len(PIECES_BORD) - 1)]
    row = [case(p) for p in PIECES_BORD]
    pieces_rows.append(row)
    col_w = 18.5 / len(PIECES_BORD)
    pieces_table = Table(pieces_rows, colWidths=[col_w*cm] * len(PIECES_BORD))
    pieces_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (-1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0056b3')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(pieces_table)
    elements.append(Spacer(1, 0.3*cm))

    # ── SYMPTÔMES & TRAVAUX DEMANDÉS ──────────────────────────
    symptomes_data = [
        [Paragraph('<b>SYMPTÔMES / DÉFAUTS SIGNALÉS</b>', bold),
         Paragraph('<b>TRAVAUX DEMANDÉS</b>', bold)],
        [Paragraph(reparation.description or '—', normal),
         Paragraph(reparation.categorie or '—', normal)],
    ]
    symptomes_table = Table(symptomes_data, colWidths=[9.25*cm, 9.25*cm])
    symptomes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0056b3')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 30),  # Espace pour écriture manuelle
    ]))
    elements.append(symptomes_table)
    elements.append(Spacer(1, 0.5*cm))

    # ── SIGNATURES ────────────────────────────────────────────
    sig_data = [[
        Paragraph('<b>Signature du client</b><br/><br/><br/><br/>________________________', normal),
        Paragraph('<b>Signature du réceptionniste</b><br/><br/><br/><br/>________________________', normal),
        Paragraph('<b>Cachet du garage</b><br/><br/><br/><br/>________________________', normal),
    ]]
    sig_table = Table(sig_data, colWidths=[6.2*cm, 6.2*cm, 6.1*cm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 0.3, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(sig_table)

    # ── PIED DE PAGE ──────────────────────────────────────────
    elements.append(Spacer(1, 0.3*cm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#0056b3')))
    elements.append(Paragraph(
        '<i>« Notre professionnalisme fait la différence » — Luxury Élégance Garage, Parakou, Bénin</i>',
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, alignment=1, textColor=colors.grey)
    ))

    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_document_pdf(obj, doc_type="FACTURE"):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    style_title = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor("#0056b3"), alignment=1, spaceAfter=20)
    style_label = ParagraphStyle('LabelStyle', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold')
    style_value = ParagraphStyle('ValueStyle', parent=styles['Normal'], fontSize=10)
    style_emecef = ParagraphStyle('EmecefStyle', parent=styles['Normal'], fontSize=8, leading=10)

    # 1. Header (Logo & Company Info)
    logo = get_logo_image(width=4.5*cm)
    company_details = Paragraph(
        '<b>LUXURY ÉLÉGANCE GARAGE</b><br/>'
        'Expertise Automobile & Entretien<br/>'
        'Quartier Okedama, Parakou, Bénin<br/>'
        'Tél : +229 01 92 62 98 60<br/>'
        'IFU : 3202487942483',
        ParagraphStyle('CompanyInfo', parent=styles['Normal'], fontSize=10, leading=14, alignment=2)
    )
    
    header_data = [[logo if logo else "", company_details]]
    header_table = Table(header_data, colWidths=[8.5*cm, 8.5*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.5*cm))

    # 2. Document Info
    doc_number = obj.numero_facture if doc_type == "FACTURE" else obj.numero_devis
    
    # Label professionnel
    display_type = doc_type
    if doc_type == "DEVIS":
        display_type = "PROFORMA"
        if not doc_number:
            doc_number = f"ESTIM-OR-{obj.reparation.id}"

    doc_title = f"{display_type} N° {doc_number or f'OR-{obj.reparation.id:04d}'}"
    elements.append(Paragraph(doc_title, styles['Heading2']))
    elements.append(Paragraph(f"Date: {obj.date_creation.strftime('%d/%m/%Y')}", styles['Normal']))
    elements.append(Spacer(1, 1*cm))

    # 3. Client & Vehicle Info Table
    client = obj.reparation.vehicule.client
    vehicule = obj.reparation.vehicule
    
    info_data = [
        [Paragraph("<b>CLIENT:</b>", style_label), Paragraph(f"{client.nom} {client.prenoms}", style_value), 
         Paragraph("<b>VÉHICULE:</b>", style_label), Paragraph(f"{vehicule.marque} {vehicule.modele}", style_value)],
        [Paragraph("<b>CONTACT:</b>", style_label), Paragraph(client.contact, style_value), 
         Paragraph("<b>IMMATRICULATION:</b>", style_label), Paragraph(vehicule.immatriculation, style_value)],
    ]
    
    info_table = Table(info_data, colWidths=[3*cm, 6*cm, 4*cm, 4*cm])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 1*cm))

    # 4. Items Table (Parts & Labor)
    items_data = [["DESCRIPTION", "QTÉ", "P.U (FCFA)", "TOTAL (FCFA)"]]
    
    # Labor - Filtrage des lignes vides
    for t in obj.reparation.travaux.all():
        if t.description.strip() and t.montant >= 0:
            items_data.append([t.description, "1", f"{t.montant:,.0f}".replace(',', ' '), f"{t.montant:,.0f}".replace(',', ' ')])
    
    # Parts - Filtrage des lignes vides
    for p in obj.reparation.pieces.all():
        if p.description.strip() and p.prix_unitaire >= 0:
            total_p = p.quantite * p.prix_unitaire
            items_data.append([p.description, str(p.quantite), f"{p.prix_unitaire:,.0f}".replace(',', ' '), f"{total_p:,.0f}".replace(',', ' ')])

    items_table = Table(items_data, colWidths=[9*cm, 2*cm, 3*cm, 3*cm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f0f4f8")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0056b3")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('ALIGN', (2,0), (3,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.5*cm))

    # 5. Totals
    tva_val = getattr(obj, 'tva', 0) or 0
    tva_pct = "18%" if tva_val > 0 else "0%"
    total_data = [
        ["", "", "TOTAL HT:", f"{obj.total_ht:,.0f}".replace(',', ' ') + " F"],
        ["", "", f"TVA ({tva_pct}):", f"{tva_val:,.0f}".replace(',', ' ') + " F"],
        ["", "", "TOTAL TTC:", f"{obj.total_ttc:,.0f}".replace(',', ' ') + " F"],
    ]
    
    if doc_type == "FACTURE":
        total_data.append(["", "", "MONTANT PAYÉ:", f"{obj.montant_paye:,.0f}".replace(',', ' ') + " F"])
        reste = obj.total_ttc - obj.montant_paye
        total_data.append(["", "", "RESTE À PAYER:", f"{reste:,.0f}".replace(',', ' ') + " F"])

    total_table = Table(total_data, colWidths=[9*cm, 2*cm, 3*cm, 3*cm])
    total_table.setStyle(TableStyle([
        ('ALIGN', (-2,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (-2,-1), (-1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (-2,-1), (-1,-1), colors.HexColor("#0056b3")),
    ]))
    elements.append(total_table)

    # 5b. e-MECeF Security Info (Only for Facture and if Normalised)
    if doc_type == "FACTURE" and getattr(obj, 'is_normalised', False):
        elements.append(Spacer(1, 0.5*cm))
        
        # Generate QR Code
        qr_data = obj.emecef_qr_code or obj.emecef_code
        qr = qrcode.QRCode(version=1, box_size=10, border=1)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img_qr = qr.make_image(fill_color="black", back_color="white")
        
        qr_buffer = io.BytesIO()
        img_qr.save(qr_buffer)
        qr_buffer.seek(0)
        
        qr_img_rl = Image(qr_buffer, width=3*cm, height=3*cm)
        
        emecef_info = [
            [qr_img_rl, Paragraph(
                f"<b>CODE MECeF/DGI :</b> {obj.emecef_code}<br/>"
                f"<b>COMPTEURS :</b> {obj.emecef_counters}<br/>"
                f"<b>DATE NORMALISATION :</b> {obj.date_validation.strftime('%d/%m/%Y %H:%M') if obj.date_validation else ''}<br/>"
                f"<br/><i>Cette facture est certifiée par la DGI Bénin.</i>",
                style_emecef
            )]
        ]
        emecef_table = Table(emecef_info, colWidths=[3.5*cm, 13.5*cm])
        emecef_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f9f9f9")),
        ]))
        elements.append(emecef_table)
    
    # 6. Footer
    elements.append(Spacer(1, 2*cm))
    elements.append(Paragraph("Merci de votre confiance !", styles['Italic']))
    
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
