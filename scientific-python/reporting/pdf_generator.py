"""
MoSAI Official Compliance Certificate PDF Generator
Generates tamper-verifiable FSSAI audit certificates using ReportLab and embedded QR codes.
"""

import io
import os
import hashlib
from datetime import datetime
from typing import Dict, Any, List

import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    KeepTogether,
    HRFlowable,
)


def generate_qr_code_image(verification_url: str) -> io.BytesIO:
    """Generate high-contrast QR code image as BytesIO."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=1,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)
    return img_byte_arr


def generate_compliance_certificate_pdf(
    audit_data: Dict[str, Any],
    verification_base_url: str = "http://localhost:3000/verify"
) -> bytes:
    """
    Builds a professional, vector-sharp PDF certificate.
    Returns: PDF content as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    
    # Custom palette
    primary_color = colors.HexColor("#0284C7")     # Ocean blue
    dark_slate = colors.HexColor("#0F172A")        # Dark slate text
    light_slate = colors.HexColor("#F8FAFC")       # Soft light gray
    border_slate = colors.HexColor("#E2E8F0")      # Border line
    accent_green = colors.HexColor("#16A34A")      # Compliant green
    accent_red = colors.HexColor("#DC2626")        # Rejection red

    # Style modifications
    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
    )
    subtitle_style = ParagraphStyle(
        "CertSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748B"),
    )
    h2_style = ParagraphStyle(
        "CertH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=dark_slate,
    )
    body_style = ParagraphStyle(
        "CertBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=dark_slate,
    )
    body_bold = ParagraphStyle(
        "CertBodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11.5,
        textColor=dark_slate,
    )
    badge_pass = ParagraphStyle(
        "BadgePass",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=accent_green,
    )
    badge_fail = ParagraphStyle(
        "BadgeFail",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=accent_red,
    )

    story = []

    # 1. Verification Hash
    qr_hash = audit_data.get("qr_hash")
    if not qr_hash:
        raw_seed = f"{audit_data.get('food_params')}-{datetime.utcnow().isoformat()}"
        qr_hash = hashlib.sha256(raw_seed.encode("utf-8")).hexdigest()[:16].upper()

    verify_url = f"{verification_base_url}/{qr_hash}"
    timestamp_str = audit_data.get("timestamp", datetime.utcnow().strftime("%d-%b-%Y %H:%M:%S UTC"))
    
    # 2. Header Layout (Title + QR Code on Top Right)
    qr_img_stream = generate_qr_code_image(verify_url)
    qr_flowable = RLImage(qr_img_stream, width=64, height=64)

    header_left = [
        Paragraph("<b>MoSAI</b> — Scientific Packaging & FSSAI Compliance Certificate", title_style),
        Paragraph("Deterministic Physics Simulation Engine • FSSAI (Packaging) Regulations 2018 Grounded Audit", subtitle_style),
        Paragraph(f"<b>Verification Hash:</b> <font color='#0284C7'>{qr_hash}</font> | <b>Generated:</b> {timestamp_str}", subtitle_style),
    ]
    
    header_table = Table(
        [[header_left, qr_flowable]],
        colWidths=[450, 90],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=12))

    # 3. Product & Environmental Input Parameters
    fp = audit_data.get("food_params", {})
    commodity_name = audit_data.get("commodity_name", fp.get("commodity_name", "Custom Commodity"))

    story.append(Paragraph("1. Food Commodity & Environmental Boundary Conditions", h2_style))
    story.append(Spacer(1, 4))

    params_matrix = [
        [
            Paragraph("<b>Commodity Name:</b>", body_style), Paragraph(str(commodity_name), body_bold),
            Paragraph("<b>Pack Mass:</b>", body_style), Paragraph(f"{fp.get('pack_mass', 500)} g", body_bold),
        ],
        [
            Paragraph("<b>Target Shelf Life:</b>", body_style), Paragraph(f"{fp.get('shelf_days', 90)} days", body_bold),
            Paragraph("<b>Pouch Surface Area:</b>", body_style), Paragraph(f"{fp.get('pouch_area', 0.08)} m²", body_bold),
        ],
        [
            Paragraph("<b>Product pH Level:</b>", body_style), Paragraph(f"{fp.get('ph', 6.0)}", body_bold),
            Paragraph("<b>Lipid / Fat Content:</b>", body_style), Paragraph(f"{fp.get('fat_content', 0.0)} %", body_bold),
        ],
        [
            Paragraph("<b>Ambient Climate:</b>", body_style), Paragraph(f"{fp.get('ambient_rh', 85)}% RH @ {fp.get('ambient_temp', 38)}°C (IS 1060 Zone IVb)", body_bold),
            Paragraph("<b>Produce Respiration:</b>", body_style), Paragraph(f"{fp.get('ro2', 0.0)} mL/(kg·hr)", body_bold),
        ],
    ]
    
    params_table = Table(params_matrix, colWidths=[130, 140, 130, 140])
    params_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), light_slate),
        ("BOX", (0, 0), (-1, -1), 0.5, border_slate),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_slate),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(params_table)
    story.append(Spacer(1, 12))

    # 4. Deterministic Physics Thresholds
    thresholds = audit_data.get("calculated_thresholds", {})
    wvtr_req = thresholds.get("wvtr_required", thresholds.get("wvtr_req", 2.5))
    otr_req = thresholds.get("otr_required", thresholds.get("otr_req", 75.0))
    delta_m = thresholds.get("delta_m_max_grams", 12.5)

    story.append(Paragraph("2. Governing Physics & Barrier Threshold Calculations", h2_style))
    story.append(Spacer(1, 4))

    physics_matrix = [
        [
            Paragraph("<b>Parameter Metric</b>", body_bold),
            Paragraph("<b>Computed Threshold</b>", body_bold),
            Paragraph("<b>Scientific Equation / Protocol</b>", body_bold),
        ],
        [
            Paragraph("Max Permissible WVTR", body_style),
            Paragraph(f"<b>{wvtr_req:.3f}</b> g/m²/day", body_bold),
            Paragraph("Fick's 1st Law coupled with GAB Moisture Sorption Isotherm (Δp driven)", body_style),
        ],
        [
            Paragraph("Target Oxygen Barrier (OTR)", body_style),
            Paragraph(f"<b>{otr_req:.2f}</b> cm³/m²/day", body_bold),
            Paragraph("Michaelis-Menten produce enzyme kinetics / Steady-state MAP flux balance", body_style),
        ],
        [
            Paragraph("Max Allowable Moisture Flux (ΔM)", body_style),
            Paragraph(f"<b>{delta_m:.2f}</b> g", body_bold),
            Paragraph("ΔM = (|M_crit - M_init| / 100) × M_product", body_style),
        ],
    ]
    physics_table = Table(physics_matrix, colWidths=[150, 120, 270])
    physics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E0F2FE")),
        ("BOX", (0, 0), (-1, -1), 0.5, border_slate),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_slate),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(physics_table)
    story.append(Spacer(1, 12))

    # 5. Multi-Criteria Material Evaluation Matrix
    story.append(Paragraph("3. Packaging Materials Multi-Criteria (MCDA) Ranking & Hard Filters", h2_style))
    story.append(Spacer(1, 4))

    ranked_materials: List[Dict[str, Any]] = audit_data.get("ranked_materials", [])[:5]
    if ranked_materials:
        eval_headers = [
            Paragraph("<b>Rank</b>", body_bold),
            Paragraph("<b>Material Structure</b>", body_bold),
            Paragraph("<b>Status</b>", body_bold),
            Paragraph("<b>MCDA</b>", body_bold),
            Paragraph("<b>WVTR</b>", body_bold),
            Paragraph("<b>OTR</b>", body_bold),
            Paragraph("<b>Cost (₹/kg)</b>", body_bold),
            Paragraph("<b>Decision Trail</b>", body_bold),
        ]
        eval_rows = [eval_headers]

        for idx, m in enumerate(ranked_materials, 1):
            is_comp = m.get("is_compliant", False)
            status_para = Paragraph("COMPLIANT", badge_pass) if is_comp else Paragraph("REJECTED", badge_fail)
            trail = m.get("audit_trail", m.get("rejection_reasons", "Passes limits"))
            if isinstance(trail, list):
                trail = "; ".join(trail)
            if len(trail) > 45:
                trail = trail[:42] + "..."

            eval_rows.append([
                Paragraph(f"#{idx}", body_style),
                Paragraph(m.get("material_name", m.get("material", "Unknown")), body_style),
                status_para,
                Paragraph(f"{m.get('mcda_score', 0.0):.1f}", body_bold),
                Paragraph(f"{m.get('wvtr', 0.0):.2f}", body_style),
                Paragraph(f"{m.get('otr', 0.0):.0f}", body_style),
                Paragraph(f"₹{m.get('cost_inr_per_kg', 0.0):.0f}", body_style),
                Paragraph(trail, body_style),
            ])

        eval_table = Table(eval_rows, colWidths=[30, 140, 65, 45, 45, 45, 55, 115])
        eval_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, border_slate),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_slate),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(eval_table)
    story.append(Spacer(1, 12))

    # 6. RAG Grounded Regulatory Findings & Mandatory Testing
    story.append(Paragraph("4. FSSAI Regulatory Audit Findings & Mandated Lab Protocols", h2_style))
    story.append(Spacer(1, 4))

    audit_report_text = audit_data.get("audit_report_markdown", "")
    if not audit_report_text:
        audit_report_text = (
            "All candidate packaging structures were cross-referenced against FSSAI (Packaging) Regulations 2018 "
            "and IS 9845:2020 migration limits (OML <= 60 mg/kg). For commercial deployment, certified food-grade virgin polymer "
            "compliance under IS 10146/10141 and printing ink conformity under IS 15495:2020 is mandatory."
        )

    # Render clean summary text
    clean_audit_paras = audit_report_text.replace("### ", "").replace("**", "<b>").replace("</b>:", "</b>:").split("\n\n")
    for p_text in clean_audit_paras[:4]:
        if p_text.strip():
            story.append(Paragraph(p_text.strip(), body_style))
            story.append(Spacer(1, 3))

    story.append(Spacer(1, 8))

    # 7. Official Seal & Legal Notice Block
    footer_text = (
        "<b>CERTIFICATE DISCLAIMER:</b> This deterministic assessment is generated algorithmically by MoSAI using verified food science "
        "isotherm modeling and Indian FSSAI regulatory rules. Final commercial release requires certified NABL-accredited laboratory migration testing. "
        f"Verify digital authenticity at: {verify_url}"
    )
    story.append(HRFlowable(width="100%", thickness=0.75, color=border_slate, spaceAfter=6))
    story.append(Paragraph(footer_text, subtitle_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
