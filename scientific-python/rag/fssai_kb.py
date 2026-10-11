"""
MoSAI RAG Knowledge Base: FSSAI Packaging Regulations (2018) & BIS Standards Repository
Comprehensive regulatory clauses, migration thresholds, and testing protocols.
"""

from typing import List, Dict, Any

FSSAI_CLAUSES: List[Dict[str, Any]] = [
    {
        "clause_id": "FSSAI-2018-REG-3-1",
        "title": "General Requirements for Food Contact Packaging",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 3(1)",
        "summary": "Every packaging material used for food products must be of food grade quality, hygienic, and must not transfer any constituent to the food in quantities that could endanger human health, bring about unacceptable changes in food composition, or cause deterioration in organoleptic properties.",
        "keywords": ["food grade", "hygienic", "transfer", "organoleptic", "safety", "general requirements"],
        "standards": ["FSSAI Reg 3(1)", "Codex Alimentarius"]
    },
    {
        "clause_id": "FSSAI-2018-REG-4-1",
        "title": "Primary Plastic Food Contact Material Approval",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 4(1)",
        "summary": "Plastic materials used for packaging or wrapping foodstuffs shall conform to the applicable Indian Standards (BIS) specified in Schedule-I. Recycled plastics are strictly prohibited for food contact unless explicitly notified.",
        "keywords": ["plastic", "schedule-I", "recycled plastics banned", "virgin polymer", "BIS compliance"],
        "standards": ["IS 10146 (PE)", "IS 10141 (PP)", "IS 12252 (PET)", "IS 10910 (PP impact)"]
    },
    {
        "clause_id": "FSSAI-2018-REG-4-2",
        "title": "Overall Migration Limit (OML) Ceiling",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 4(2) / IS 9845",
        "summary": "Plastic packaging materials shall not release substances into food simulants in quantities exceeding 60 mg/kg or 10 mg/dm² of surface area of food contact article when tested as per IS 9845:2020.",
        "keywords": ["overall migration limit", "OML", "60 mg/kg", "10 mg/dm2", "IS 9845", "simulant migration"],
        "standards": ["IS 9845:2020", "FSSAI Reg 4(2)"]
    },
    {
        "clause_id": "FSSAI-2018-REG-4-3",
        "title": "Simulant Matrix & Testing Conditions",
        "source": "IS 9845:2020 / FSSAI Packaging Regulations, Schedule-II",
        "summary": "Migration testing must be conducted with certified simulants: Distilled water (aqueous foods pH > 4.5), 3% Acetic Acid (acidic foods pH <= 4.5), 10% / 50% Ethanol (alcoholic or emulsion foods), and Refined Olive Oil / Iso-octane (fatty foods). Testing time and temperature must mirror expected real-world shelf conditions.",
        "keywords": ["simulants", "acetic acid", "isooctane", "ethanol", "testing conditions", "fatty food test"],
        "standards": ["IS 9845:2020 Table 1"]
    },
    {
        "clause_id": "FSSAI-2018-REG-4-4",
        "title": "Specific Acid Contact Safety for Acidic Foodstuffs (pH < 4.0)",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 4(4)",
        "summary": "Metal containers or metallic laminates (e.g., aluminum foil) intended for packaging acidic foods (such as pickles, tomato puree, citrus juices with pH < 4.0) must be properly lacquered, enameled, or extrusion-coated with an inert food-grade barrier to prevent heavy metal leaching and pitting corrosion.",
        "keywords": ["acidic food", "pH", "corrosion", "aluminum", "lacquer", "heavy metals", "tinplate"],
        "standards": ["IS 5837", "FSSAI Reg 4(4)"]
    },
    {
        "clause_id": "FSSAI-2018-REG-4-5",
        "title": "Fat & Grease Barrier Integrity for Lipid-Rich Commodities",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 4(5) / IS 10146 Clause 5.2",
        "summary": "Packages holding products with high lipid or edible oil content must provide an impenetrable barrier against mineral oil saturation, swelling, pinholing, and oxidative seepage. Laminates must not delaminate under contact with lipid fractions at up to 40°C.",
        "keywords": ["fat", "grease", "lipid", "oil weeping", "delamination", "isooctane resistance"],
        "standards": ["IS 10146 Clause 5.2", "ASTM F119"]
    },
    {
        "clause_id": "FSSAI-2018-REG-4-6",
        "title": "Modified Atmosphere Packaging (MAP) & Fresh Horticultural Produce",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 4(6) & NHB Guidelines",
        "summary": "Living respiring produce (fresh fruits, vegetables, mushrooms) requires gas-permeable or micro-perforated packaging calibrated to prevent headspace oxygen depletion below 2% or excessive CO2 buildup above 10%, avoiding anaerobic respiration and toxin formation.",
        "keywords": ["fresh produce", "respiration", "MAP", "modified atmosphere", "anaerobic", "permeable film"],
        "standards": ["FSSAI Reg 4(6)", "NHB Protocol 2021"]
    },
    {
        "clause_id": "FSSAI-2018-REG-5-1",
        "title": "Specific Migration Limits (SML) for Heavy Metals & Plasticizers",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 5(1)",
        "summary": "Packaging articles shall not release toxic heavy metals exceeding limits: Lead (Pb) <= 0.1 mg/kg, Cadmium (Cd) <= 0.01 mg/kg, Chromium (Cr) <= 0.05 mg/kg, Mercury (Hg) <= 0.005 mg/kg. Phthalates plasticizers shall not exceed 0.05 mg/kg. Bisphenol-A (BPA) must be non-detectable.",
        "keywords": ["specific migration limit", "SML", "lead", "cadmium", "bpa free", "phthalates", "heavy metals"],
        "standards": ["FSSAI Reg 5(1)", "IS 9845 Clause 6"]
    },
    {
        "clause_id": "FSSAI-2018-REG-6-1",
        "title": "Printing Inks and Outer Surface Compliance",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 6(1) / IS 15495",
        "summary": "Printing inks used on food packaging must conform strictly to IS 15495:2020. Inks containing toluene, lead, cadmium, or other restricted carcinogenic pigments are strictly prohibited. Inks must not transfer to the food-contact surface (set-off migration).",
        "keywords": ["printing ink", "IS 15495", "toluene-free", "set-off", "non-toxic ink", "pigment"],
        "standards": ["IS 15495:2020", "FSSAI Reg 6(1)"]
    },
    {
        "clause_id": "FSSAI-2018-REG-7-1",
        "title": "Prohibition of Newspaper and Recycled Plastic Bags",
        "source": "Food Safety and Standards (Packaging) Regulations, 2018 - Regulation 7",
        "summary": "Newspaper, printed wrapping sheets, or post-consumer unapproved recycled carry bags shall never be used for storing, packing, or serving hot or cold foodstuffs due to hazardous mineral oil and polycyclic aromatic hydrocarbon (PAH) contamination.",
        "keywords": ["newspaper ban", "recycled carry bags banned", "PAH", "mineral oil", "direct contact prohibited"],
        "standards": ["FSSAI Reg 7"]
    }
]


def retrieve_relevant_fssai_clauses(
    query_text: str,
    top_k: int = 4,
    filter_keys: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Keyword and semantic relevance scoring over FSSAI packaging clauses.
    """
    query_tokens = set(query_text.lower().replace("-", " ").replace(",", " ").split())
    
    scored_clauses = []
    for clause in FSSAI_CLAUSES:
        score = 0
        clause_corpus = (
            clause["title"] + " " +
            clause["summary"] + " " +
            " ".join(clause["keywords"]) + " " +
            " ".join(clause["standards"])
        ).lower()
        
        # Word match score
        for token in query_tokens:
            if len(token) > 2 and token in clause_corpus:
                score += 2
            if token in [k.lower() for k in clause["keywords"]]:
                score += 3
        
        # Exact keyword boosts
        if filter_keys:
            for k in filter_keys:
                if k.lower() in clause_corpus:
                    score += 5

        scored_clauses.append((score, clause))

    # Sort descending by score
    scored_clauses.sort(key=lambda x: x[0], reverse=True)
    return [c[1] for c in scored_clauses[:top_k]]
