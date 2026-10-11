"""
MoSAI Scientific Physics Engine: FSSAI Regulatory Hard Filters
Enforces deterministic compliance checks based on FSSAI (Packaging) Regulations 2018 and Bureau of Indian Standards (BIS).
"""

from typing import Dict, Any, List, Tuple

# Official BIS Standards for Food Contact Plastics & Packaging:
# IS 9845: Determination of Overall Migration of constituents of plastics materials into food simulants
# IS 10146: Polyethylene (LDPE/LLDPE/HDPE) for safe use in contact with foodstuffs
# IS 10141: Polypropylene (PP) for safe use in contact with foodstuffs
# IS 12252: Polyalkylene terephthalates (PET/PBT) for safe use in contact with foodstuffs
# IS 10910: Polypropylene (PP) / impact polypropylene
# IS 15495: Printing ink for food packaging - Specifications

OML_MAX_LIMIT_MG_KG = 60.0  # Overall Migration Limit: 60 mg/kg or 10 mg/dm²
OML_MAX_LIMIT_MG_DM2 = 10.0


def evaluate_fssai_hard_filters(
    material: Dict[str, Any],
    food_params: Dict[str, Any],
    wvtr_req: float,
    otr_req: float,
) -> Tuple[bool, List[str], List[str]]:
    """
    Evaluate deterministic FSSAI compliance hard filters.
    Returns:
        (is_compliant, rejection_reasons, cited_clauses)
    """
    rejections: List[str] = []
    cited_clauses: List[str] = []

    ph = food_params.get("ph", 6.0)
    fat_pct = food_params.get("fat_content", 0.0)
    ro2 = food_params.get("ro2", 0.0)
    is_living = ro2 > 0 or food_params.get("is_living", False)
    
    mat_wvtr = float(material.get("wvtr", 999.0))
    mat_otr = float(material.get("otr", 99999.0))
    mat_name = material.get("material", material.get("name", "Unknown Material"))

    # -------------------------------------------------------------
    # 1. Overall Migration Limit (OML) Compliance (FSSAI Regulation 4(2))
    # -------------------------------------------------------------
    reported_oml = material.get("oml_mg_kg", 25.0)  # default certified baseline if not provided
    if reported_oml > OML_MAX_LIMIT_MG_KG:
        rejections.append(
            f"Overall Migration ({reported_oml:.1f} mg/kg) exceeds FSSAI ceiling of {OML_MAX_LIMIT_MG_KG} mg/kg"
        )
        cited_clauses.append("FSSAI Packaging Regs 2018, Reg 4(2) / IS 9845:2020 (Overall Migration Limit)")

    # -------------------------------------------------------------
    # 2. Acid Corrosion & Heavy Metal Leaching (pH < 4.0)
    # -------------------------------------------------------------
    # FSSAI Regulation 4(4): Containers in contact with acidic food must be acid-resistant
    # Aluminum foil without inert polymer inner liner (e.g. food-grade PP/LLDPE) corrodes under acid.
    is_acid_resistant = material.get("acid_resistant", True)
    if ph < 4.0 and not is_acid_resistant:
        rejections.append(
            f"Acid corrosion risk (Product pH {ph:.1f} < 4.0): Material lacks verified acid passivation"
        )
        cited_clauses.append("FSSAI Packaging Regs 2018, Reg 4(4) (Chemical Passivation for Acidic Foods)")

    # -------------------------------------------------------------
    # 3. High Lipid / Grease Penetration (Fat > 10%)
    # -------------------------------------------------------------
    # FSSAI Regulation 4(5): Materials for fatty foods must exhibit zero oil weeping and solvent migration
    is_fat_safe = material.get("fat_safe", True)
    if fat_pct > 10.0 and not is_fat_safe:
        rejections.append(
            f"Inadequate grease barrier for high-fat food ({fat_pct:.1f}% fat): Delamination & mineral oil migration hazard"
        )
        cited_clauses.append("FSSAI Packaging Regs 2018, Reg 4(5) / IS 10146 Clause 5.2 (Simulant Iso-octane Resistance)")

    # -------------------------------------------------------------
    # 4. Biological Respiration & MAP Gas Equilibrium
    # -------------------------------------------------------------
    # Living produce produces CO2 and consumes O2. Non-breathable foil causes anaerobic fermentation.
    is_breathable = material.get("breathable", False)
    if is_living:
        if not is_breathable or mat_otr < (otr_req * 0.3):
            rejections.append(
                "Non-breathable/Hermetic barrier causes rapid anaerobic decay, ethanol fermentation, and botulism risk in living produce"
            )
            cited_clauses.append("FSSAI Reg 4(6) & National Horticulture Board MAP Protocol (Minimum O2 Permeability)")
    else:
        # Non-living commodity with strict moisture barrier requirement
        if is_breathable and wvtr_req < 10.0:
            rejections.append(
                "Excessive micro-porosity/breathability for non-respiring moisture-sensitive commodity"
            )
            cited_clauses.append("FSSAI Reg 3(1) (Integrity of Moisture Seal for Processed Goods)")

    # -------------------------------------------------------------
    # 5. Barrier Transmission Thresholds (WVTR Failure)
    # -------------------------------------------------------------
    if not is_living and mat_wvtr > (wvtr_req * 1.05):  # 5% tolerance margin
        rejections.append(
            f"WVTR ({mat_wvtr:.2f} g/m²/day) exceeds required moisture threshold ({wvtr_req:.2f} g/m²/day)"
        )
        cited_clauses.append("IS 1060 (Part 2) / ASTM F1249 (Moisture Barrier Adequacy)")

    # -------------------------------------------------------------
    # 6. Specific Migration Limits (SML) / Additives / BPA Free
    # -------------------------------------------------------------
    is_bpa_free = material.get("bpa_free", True)
    if not is_bpa_free:
        rejections.append("Material contains detectable Bisphenol-A (BPA banned for food contact)")
        cited_clauses.append("FSSAI Prohibition on BPA in Polycarbonate & Coatings (2020 Amendment)")

    is_compliant = len(rejections) == 0
    return is_compliant, rejections, cited_clauses
