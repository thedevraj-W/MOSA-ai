"""
MoSAI TDS Parser & Conservative Conflict Resolution Engine
Parses vendor Technical Datasheet (TDS) documents and resolves conflicting barrier specifications.
"""

import re
import os
from typing import Dict, Any, List, Optional
from pypdf import PdfReader


def extract_text_from_pdf_stream(pdf_bytes: bytes) -> str:
    """Extract raw text from in-memory PDF byte buffer."""
    import io
    reader = PdfReader(io.BytesIO(pdf_bytes))
    extracted = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            extracted.append(text)
    return "\n".join(extracted)


def parse_tds_document(raw_text: str, filename: str = "vendor_tds.pdf") -> Dict[str, Any]:
    """
    Regex and heuristic extraction of material properties from vendor datasheets.
    """
    lines = raw_text.splitlines()
    text_lower = raw_text.lower()

    # 1. Material Name / Grade detection
    material_name = "Custom Polymer Film"
    grade = "Grade-STD"
    
    name_patterns = [
        r"(?:material|film\s+type|substrate|structure)\s*[:=\-]\s*([^\n\r]+)",
        r"(?:product\s+name|trade\s+name)\s*[:=\-]\s*([^\n\r]+)",
    ]
    for pat in name_patterns:
        match = re.search(pat, raw_text, re.IGNORECASE)
        if match:
            material_name = match.group(1).strip()
            break
            
    # Heuristic common polymers if regex didn't capture clean name
    if material_name == "Custom Polymer Film":
        if "bopp" in text_lower:
            material_name = "BOPP Film (Biaxially Oriented Polypropylene)"
        elif "metallized" in text_lower or "vm-pet" in text_lower or "vmpet" in text_lower:
            material_name = "PET / VMPET / PE Metalized Barrier"
        elif "aluminum" in text_lower or "alu foil" in text_lower:
            material_name = "PET / ALU / LLDPE High Barrier Laminate"
        elif "hdpe" in text_lower:
            material_name = "HDPE (High Density Polyethylene)"
        elif "ldpe" in text_lower:
            material_name = "LDPE (Low Density Polyethylene)"
        elif "pla" in text_lower or "biodegradable" in text_lower:
            material_name = "Biodegradable Compostable Film (PLA / PBAT)"

    # Grade pattern
    grade_match = re.search(r"(?:grade|series|model)\s*[:=\-]\s*([A-Za-z0-9\-_]+)", raw_text, re.IGNORECASE)
    if grade_match:
        grade = grade_match.group(1).strip()

    # 2. Thickness (microns / um)
    thickness = 50.0
    th_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:µm|um|micron|gauge)", raw_text, re.IGNORECASE)
    if th_match:
        thickness = float(th_match.group(1))

    # 3. WVTR (Water Vapor Transmission Rate: g/m²/day)
    wvtr = 5.0
    wvtr_match = re.search(r"(?:wvtr|water\s+vapou?r\s+trans(?:mission)?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", raw_text, re.IGNORECASE)
    if wvtr_match:
        wvtr = float(wvtr_match.group(1))

    # 4. OTR (Oxygen Transmission Rate: cm³/m²/day or cc/m²/day)
    otr = 100.0
    otr_match = re.search(r"(?:otr|oxygen\s+trans(?:mission)?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", raw_text, re.IGNORECASE)
    if otr_match:
        otr = float(otr_match.group(1))

    # 5. Overall Migration Limit (OML in mg/kg or mg/dm²)
    oml = 25.0
    oml_match = re.search(r"(?:overall\s+migration|oml)\s*[:=\-]?\s*(\d+(?:\.\d+)?)", raw_text, re.IGNORECASE)
    if oml_match:
        oml = float(oml_match.group(1))

    # 6. Cost in INR
    cost = 160.0
    cost_match = re.search(r"(?:cost|price|inr)\s*[:=\-]?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)", raw_text, re.IGNORECASE)
    if cost_match:
        cost = float(cost_match.group(1))

    # 7. Chemical properties
    acid_resistant = not ("non-acid" in text_lower or "corrodes" in text_lower or "unlined alu" in text_lower)
    fat_safe = not ("oil permeable" in text_lower or "weeps fat" in text_lower)
    breathable = "micro-perforated" in text_lower or "breathable" in text_lower or otr > 5000.0
    biodegradable = "biodegradable" in text_lower or "compostable" in text_lower or "pla" in text_lower

    return {
        "source_file": filename,
        "material": material_name,
        "grade": grade,
        "thickness_um": thickness,
        "wvtr": wvtr,
        "otr": otr,
        "oml_mg_kg": oml,
        "cost_inr_per_kg": cost,
        "acid_resistant": acid_resistant,
        "fat_safe": fat_safe,
        "breathable": breathable,
        "biodegradable": biodegradable,
    }


def resolve_conservative_conflicts(datasheets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    MoSAI Conservative Conflict Resolution Policy:
    If multiple vendor TDS PDFs provide conflicting barrier properties for the same material grade,
    automatically default to the most conservative (worst-case) values to mathematically guarantee food safety:
      - WVTR: max(wvtr) -> worst moisture permeation
      - OTR: max(otr) for shelf stability, or worst deviation
      - OML: max(oml) -> worst chemical migration
      - Cost: max(cost) -> conservative financial risk
      - Acid/Fat safety: False if ANY datasheet reports failure
    """
    if not datasheets:
        return {}

    if len(datasheets) == 1:
        return datasheets[0]

    base = dict(datasheets[0])
    sources = [d.get("source_file", "unknown") for d in datasheets]
    
    # 1. Conservative WVTR (highest transmission rate is worst barrier)
    worst_wvtr = max(d.get("wvtr", 1.0) for d in datasheets)
    # 2. Conservative OTR (highest transmission rate)
    worst_otr = max(d.get("otr", 1.0) for d in datasheets)
    # 3. Conservative OML (highest migration risk)
    worst_oml = max(d.get("oml_mg_kg", 20.0) for d in datasheets)
    # 4. Conservative Cost (highest quote)
    worst_cost = max(d.get("cost_inr_per_kg", 150.0) for d in datasheets)
    # 5. Thickness (minimum reported structural integrity)
    min_thickness = min(d.get("thickness_um", 50.0) for d in datasheets)
    # 6. Safety flags: Fail if ANY sheet fails
    safe_acid = all(d.get("acid_resistant", True) for d in datasheets)
    safe_fat = all(d.get("fat_safe", True) for d in datasheets)

    base.update({
        "wvtr": worst_wvtr,
        "otr": worst_otr,
        "oml_mg_kg": worst_oml,
        "cost_inr_per_kg": worst_cost,
        "thickness_um": min_thickness,
        "acid_resistant": safe_acid,
        "fat_safe": safe_fat,
        "conflict_resolved": True,
        "datasheet_count": len(datasheets),
        "source_files": sources,
        "conflict_resolution_notes": (
            f"Harmonized {len(datasheets)} conflicting vendor datasheets under MoSAI Conservative Safety Rule. "
            f"Defaulted to highest WVTR ({worst_wvtr:.2f} g/m²/d), highest OTR ({worst_otr:.2f} cc/m²/d), "
            f"and highest OML ({worst_oml:.1f} mg/kg) to eliminate shelf-life under-specification risks."
        )
    })
    return base
