import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import cm

def generate_document_pdf(obj, doc_type="FACTURE"):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    style_title = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor("#0056b3"), alignment=1, spaceAfter=20)
    style_label = ParagraphStyle('LabelStyle', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold')
    style_value = ParagraphStyle('ValueStyle', parent=styles['Normal'], fontSize=10)

    # 1. Header (Company Info)
    elements.append(Paragraph("LUXEL-G", style_title))
    elements.append(Paragraph("Luxury Elegance Garage", styles['Normal']))
    elements.append(Paragraph("Expertise Automobile & Entretien", styles['Normal']))
    elements.append(Spacer(1, 1*cm))

    # 2. Document Info
    doc_number = obj.numero_facture if doc_type == "FACTURE" else obj.numero_devis
    doc_title = f"{doc_type} N° {doc_number or 'BROUILLON'}"
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
    
    # Labor
    for t in obj.reparation.travaux.all():
        items_data.append([t.description, "1", f"{t.montant:,.0f}", f"{t.montant:,.0f}"])
    
    # Parts
    for p in obj.reparation.pieces.all():
        total_p = p.quantite * p.prix_unitaire
        items_data.append([p.description, str(p.quantite), f"{p.prix_unitaire:,.0f}", f"{total_p:,.0f}"])

    items_table = Table(items_data, colWidths=[9*cm, 2*cm, 3*cm, 3*cm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f0f4f8")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0056b3")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.5*cm))

    # 5. Totals
    total_data = [
        ["", "", "TOTAL HT:", f"{obj.total_ht:,.0f} FCFA"],
        ["", "", "TVA (0%):", "0 FCFA"],
        ["", "", "TOTAL TTC:", f"{obj.total_ttc:,.0f} FCFA"],
    ]
    
    if doc_type == "FACTURE":
        total_data.append(["", "", "MONTANT PAYÉ:", f"{obj.montant_paye:,.0f} FCFA"])
        reste = obj.total_ttc - obj.montant_paye
        total_data.append(["", "", "RESTE À PAYER:", f"{reste:,.0f} FCFA"])

    total_table = Table(total_data, colWidths=[9*cm, 2*cm, 3*cm, 3*cm])
    total_table.setStyle(TableStyle([
        ('ALIGN', (-2,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (-2,-1), (-1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (-2,-1), (-1,-1), colors.HexColor("#0056b3")),
    ]))
    elements.append(total_table)
    
    # 6. Footer
    elements.append(Spacer(1, 2*cm))
    elements.append(Paragraph("Merci de votre confiance !", styles['Italic']))
    
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
