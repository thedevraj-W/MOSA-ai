"""
MoSAI Scientific Physics Engine: Multi-Criteria Decision Analysis (MCDA) Ranking
Implements a Weighted Sum Model (WSM) with min-max normalization across barrier, cost, and eco metrics.
"""

from typing import List, Dict, Any, Optional

def compute_mcda_rankings(
    evaluated_materials: List[Dict[str, Any]],
    weight_barrier: float = 0.50,
    weight_cost: float = 0.35,
    weight_eco: float = 0.15,
    wvtr_req: float = 5.0,
    otr_req: float = 50.0,
    is_living: bool = False,
) -> List[Dict[str, Any]]:
    """
    Ranks candidates using Weighted Sum Model (WSM):
    Score = (w_barrier * S_barrier) + (w_cost * S_cost) + (w_eco * S_eco)
    Normalized so weights sum to 1.0.
    """
    if not evaluated_materials:
        return []

    # 1. Normalize weights
    total_w = weight_barrier + weight_cost + weight_eco
    if total_w <= 0:
        w_b, w_c, w_e = 0.50, 0.35, 0.15
    else:
        w_b = weight_barrier / total_w
        w_c = weight_cost / total_w
        w_e = weight_eco / total_w

    # 2. Extract cost extrema across all materials
    costs = [float(m.get("cost_inr_per_kg", m.get("cost_per_sqm", 150.0))) for m in evaluated_materials]
    min_cost = min(costs) if costs else 100.0
    max_cost = max(costs) if costs else 300.0
    cost_spread = max(max_cost - min_cost, 0.001)

    ranked_results: List[Dict[str, Any]] = []

    for mat in evaluated_materials:
        is_compliant = mat.get("is_compliant", False)
        rejection_reasons = mat.get("rejection_reasons", [])
        
        mat_wvtr = float(mat.get("wvtr", 1.0))
        mat_otr = float(mat.get("otr", 100.0))
        mat_cost = float(mat.get("cost_inr_per_kg", mat.get("cost_per_sqm", 150.0)))

        # -------------------------------------------------------------
        # Barrier Score (S_barrier, 0-100)
        # -------------------------------------------------------------
        if is_living:
            # For living produce: evaluate how close OTR is to target equilibrium OTR
            # Closeness within factor of 2 gets higher score
            ratio = mat_otr / max(otr_req, 1.0)
            if ratio >= 1.0:
                s_barrier = max(20.0, 100.0 - min(80.0, (ratio - 1.0) * 15.0))
            else:
                s_barrier = max(0.0, ratio * 100.0)
        else:
            # For processed food: lower WVTR relative to wvtr_req gives higher barrier safety margin
            barrier_margin = 1.0 - (mat_wvtr / max(wvtr_req, 0.001))
            s_barrier = max(0.0, min(100.0, barrier_margin * 100.0))

        # -------------------------------------------------------------
        # Cost Score (S_cost, 0-100, lower cost is better)
        # -------------------------------------------------------------
        s_cost = 100.0 * (1.0 - ((mat_cost - min_cost) / cost_spread))
        s_cost = max(0.0, min(100.0, s_cost))

        # -------------------------------------------------------------
        # Sustainability Score (S_eco, 0-100)
        # -------------------------------------------------------------
        if "eco_score" in mat and mat["eco_score"] is not None:
            s_eco = float(mat["eco_score"])
        elif mat.get("biodegradable", False):
            s_eco = 95.0
        elif mat.get("recyclable", False) or "PE" in mat.get("material", mat.get("name", "")):
            # Mono-material Polyethylene or Polypropylene is recyclable (IS 14534)
            s_eco = 70.0
        elif "ALU" in mat.get("material", mat.get("name", "")) or "Metalized" in mat.get("material", mat.get("name", "")):
            # Multilayer non-separable metal laminate has poor recyclability
            s_eco = 30.0
        else:
            s_eco = 50.0

        s_eco = max(0.0, min(100.0, s_eco))

        # -------------------------------------------------------------
        # Composite Weighted Score
        # -------------------------------------------------------------
        if is_compliant:
            composite_score = round(
                (w_b * s_barrier) + (w_c * s_cost) + (w_e * s_eco),
                1
            )
            compliance_status = "Compliant"
            decision_text = "Passes all FSSAI barrier, migration, and safety thresholds"
        else:
            composite_score = 0.0
            compliance_status = "Rejected"
            decision_text = "; ".join(rejection_reasons)

        ranked_results.append({
            "id": mat.get("id"),
            "material_name": mat.get("material", mat.get("name", "Unknown")),
            "grade": mat.get("grade", "Standard Packaging Grade"),
            "thickness_um": mat.get("thickness_um", mat.get("thickness", 50)),
            "wvtr": mat_wvtr,
            "otr": mat_otr,
            "cost_inr_per_kg": mat_cost,
            "compliance_status": compliance_status,
            "is_compliant": is_compliant,
            "mcda_score": composite_score,
            "barrier_score": round(s_barrier, 1),
            "cost_score": round(s_cost, 1),
            "eco_score": round(s_eco, 1),
            "rejection_reasons": rejection_reasons,
            "cited_clauses": mat.get("cited_clauses", []),
            "audit_trail": decision_text,
            "biodegradable": mat.get("biodegradable", False),
            "acid_resistant": mat.get("acid_resistant", True),
            "fat_safe": mat.get("fat_safe", True),
            "breathable": mat.get("breathable", False),
            "weights_used": {
                "w_barrier": round(w_b, 2),
                "w_cost": round(w_c, 2),
                "w_eco": round(w_e, 2),
            }
        })

    # Sort candidates: Compliant first by score descending, followed by rejected
    ranked_results.sort(key=lambda x: (1 if x["is_compliant"] else 0, x["mcda_score"]), reverse=True)
    return ranked_results
