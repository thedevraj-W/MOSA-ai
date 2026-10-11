"""
MoSAI RAG & Regulatory Compliance Engine
Interrogates FSSAI Packaging Regulations (2018) and generates grounded audit reports via Gemini 1.5 Flash.
"""

import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()
from .fssai_kb import retrieve_relevant_fssai_clauses

# Check if google-generativeai is available
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


def get_gemini_model():
    """Configure and return Gemini generative model instance with fallback candidates."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key or not GENAI_AVAILABLE:
        return None
    try:
        genai.configure(api_key=api_key)
        for model_name in ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"]:
            try:
                m = genai.GenerativeModel(model_name)
                return m
            except Exception:
                continue
        return None
    except Exception as e:
        print(f"[MoSAI RAG Warning] Could not initialize Gemini model: {e}")
        return None


def generate_fssai_audit_report(
    food_commodity: str,
    food_params: Dict[str, Any],
    selected_material: Dict[str, Any],
    calculated_wvtr: float,
    calculated_otr: float,
    user_notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Performs RAG retrieval against FSSAI Regulations (2018) knowledge base
    and invokes Gemini 1.5 Flash (or deterministic fallback) with strict grounding.
    """
    ph = food_params.get("ph", 6.0)
    fat_pct = food_params.get("fat_content", 0.0)
    shelf_days = food_params.get("shelf_days", 90)
    ro2 = food_params.get("ro2", 0.0)
    is_living = ro2 > 0 or food_params.get("is_living", False)
    
    mat_name = selected_material.get("material", selected_material.get("name", "Unknown Material"))
    mat_wvtr = selected_material.get("wvtr", 1.0)
    mat_otr = selected_material.get("otr", 100.0)
    is_compliant = selected_material.get("is_compliant", True)
    rejection_reasons = selected_material.get("rejection_reasons", [])

    # 1. Retrieve top-k relevant FSSAI clauses based on food & material profile
    query_context = f"{food_commodity} pH {ph} fat {fat_pct} {mat_name} overall migration barrier shelf life"
    filter_keys = []
    if ph < 4.0:
        filter_keys.append("acid")
    if fat_pct > 10.0:
        filter_keys.append("fat")
    if is_living:
        filter_keys.append("respiration")

    retrieved_clauses = retrieve_relevant_fssai_clauses(query_context, top_k=4, filter_keys=filter_keys)

    # 2. Recommended official testing simulants per IS 9845
    simulants = ["Distilled Water (Aqueous matrix, 40°C / 10 days)"]
    if ph <= 4.5:
        simulants.append("3% (w/v) Acetic Acid (Acidic food contact simulant B, IS 9845)")
    if fat_pct > 10.0:
        simulants.append("Refined Olive Oil / Iso-octane (Fatty food contact simulant D, IS 9845)")
    if is_living:
        simulants.append("Gas Chromatography headspace analysis (O2 / CO2 equilibrium test)")

    # 3. Formulate RAG context
    kb_context_text = "\n\n".join([
        f"[{c['clause_id']}] {c['title']} ({c['source']}):\n{c['summary']}"
        for c in retrieved_clauses
    ])

    system_instruction = (
        "You are MoSAI's Chief Food Safety Regulatory Auditor specializing in Indian FSSAI Packaging Regulations (2018) "
        "and Bureau of Indian Standards (BIS). You analyze packaging compatibility with scientific rigor and provide "
        "actionable audit summaries with exact clause citations (e.g. FSSAI Reg 4(2), IS 9845, IS 10146). "
        "Keep the verdict definitive: 'COMPLIANT' or 'NON-COMPLIANT'."
    )

    prompt = f"""
{system_instruction}

PRODUCT PARAMETERS:
- Commodity: {food_commodity}
- Mass: {food_params.get('pack_mass', 500)} g
- Product pH: {ph}
- Lipid / Fat Content: {fat_pct}%
- Target Shelf Life: {shelf_days} days
- Biological Respiration (R_O2): {ro2} mL/(kg·hr) ({'Living / MAP' if is_living else 'Shelf-stable / Processed'})

DETERMINISTIC PHYSICS THRESHOLDS:
- Required Max WVTR: {calculated_wvtr:.3f} g/m²/day
- Required OTR: {calculated_otr:.2f} cm³/m²/day

EVALUATED PACKAGING MATERIAL:
- Material Name: {mat_name}
- Thickness: {selected_material.get('thickness_um', 50)} µm
- Material WVTR: {mat_wvtr} g/m²/day
- Material OTR: {mat_otr} cm³/m²/day
- Hard Filter Compliance Status: {'PASS' if is_compliant else 'FAIL'}
- Known Violations: {rejection_reasons if rejection_reasons else 'None'}

RETRIEVED FSSAI REGULATORY CLAUSES:
{kb_context_text}

INSTRUCTIONS:
1. Provide a concise Executive Regulatory Summary (2-3 sentences).
2. State the exact Compliance Verdict (COMPLIANT or NON-COMPLIANT).
3. List 2 to 3 Specific Regulatory Clause Citations applicable here.
4. Highlight required lab migration testing protocol and simulants.
5. Provide a 1-sentence Risk Mitigation recommendation for commercial shelf life.
"""

    gemini_powered = False
    audit_report_text = ""

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if api_key and GENAI_AVAILABLE:
        try:
            genai.configure(api_key=api_key)
            model_candidates = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"]
            for m_name in model_candidates:
                try:
                    m = genai.GenerativeModel(m_name)
                    response = m.generate_content(prompt)
                    if response and response.text:
                        audit_report_text = response.text.strip()
                        gemini_powered = True
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"[MoSAI Gemini RAG Error] Falling back to deterministic grounded generator: {e}")

    if not audit_report_text:
        # Deterministic grounded report generator
        verdict = "COMPLIANT" if is_compliant else "NON-COMPLIANT"
        cited_standards = ", ".join(list(set([std for c in retrieved_clauses for std in c["standards"]]))[:3])
        
        reasons_text = ""
        if rejection_reasons:
            reasons_text = f" However, the candidate structure failed deterministic hard filters due to: {'; '.join(rejection_reasons)}."
        else:
            reasons_text = f" The candidate structure satisfies permissible moisture flux (WVTR {mat_wvtr} <= {calculated_wvtr:.2f} g/m²/d) and chemical inertness."

        audit_report_text = (
            f"### Executive Regulatory Audit Verdict: {verdict}\n\n"
            f"**Evaluation Summary:** Evaluated '{mat_name}' for packaging '{food_commodity}' under FSSAI Packaging Regulations (2018).{reasons_text}\n\n"
            f"**Governing BIS Standards & Clauses:**\n" +
            "\n".join([f"- **{c['clause_id']}** ({c['source']}): {c['title']} - {c['summary'][:130]}..." for c in retrieved_clauses[:3]]) +
            f"\n\n**Mandated Lab Verification Simulants (IS 9845):**\n" +
            "\n".join([f"- {s}" for s in simulants]) +
            f"\n\n**Actionable Risk Mitigation:** Maintain strict Overall Migration Limits (< 60 mg/kg) and verify batch seal integrity under Zone IVb tropical test conditions (38°C, 90% RH)."
        )

    return {
        "status": "COMPLIANT" if is_compliant else "NON_COMPLIANT",
        "verdict_badge": "✅ FSSAI Certified Compliant" if is_compliant else "❌ FSSAI Non-Compliant",
        "gemini_powered": gemini_powered,
        "audit_report_markdown": audit_report_text,
        "retrieved_clauses": retrieved_clauses,
        "mandated_simulants": simulants,
        "calculated_thresholds": {
            "wvtr_req": calculated_wvtr,
            "otr_req": calculated_otr,
            "material_wvtr": mat_wvtr,
            "material_otr": mat_otr,
        }
    }


def ask_fssai_rag_assistant(question: str) -> Dict[str, Any]:
    """
    Direct RAG query to Gemini 1.5/3.8 Flash grounded in FSSAI Packaging Regulations 2018 knowledge base.
    """
    retrieved_clauses = retrieve_relevant_fssai_clauses(question, top_k=5)
    kb_context = "\n\n".join([
        f"[{c['clause_id']}] {c['title']} ({c['source']}):\n{c['summary']}"
        for c in retrieved_clauses
    ])

    system_prompt = (
        "You are MoSAI's Chief Legal and Food Safety Regulatory Consultant specializing in Indian "
        "FSSAI (Packaging) Regulations 2018, Bureau of Indian Standards (BIS: IS 9845, IS 10146, IS 10141, "
        "IS 12252, IS 15495), and the Plastic Waste Management Rules. Answer user queries with precision, citing "
        "specific clause numbers, migration limits, simulant matrices, and compliance testing procedures. "
        "Structure your response clearly with headings or bullet points."
    )

    full_prompt = f"""{system_prompt}

RELEVANT FSSAI & BIS CLAUSES RETRIEVED FROM KNOWLEDGE BASE:
{kb_context}

USER QUESTION:
{question}

Please provide an authoritative, regulatory-grounded answer based on the retrieved clauses and Indian food packaging standards:"""

    gemini_powered = False
    answer_text = ""

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if api_key and GENAI_AVAILABLE:
        try:
            genai.configure(api_key=api_key)
            model_candidates = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"]
            for m_name in model_candidates:
                try:
                    m = genai.GenerativeModel(m_name)
                    res = m.generate_content(full_prompt)
                    if res and res.text:
                        answer_text = res.text.strip()
                        gemini_powered = True
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"[MoSAI RAG Assistant Error]: {e}")

    if not answer_text:
        # Grounded fallback using retrieved clauses
        clauses_summary = "\n\n".join([f"• **{c['clause_id']} ({c['title']}):** {c['summary']}" for c in retrieved_clauses[:3]])
        answer_text = (
            f"Based on the Indian Food Safety and Standards (Packaging) Regulations 2018 and Bureau of Indian Standards:\n\n"
            f"{clauses_summary}\n\n"
            f"**Key Compliance Note:** Packaging materials in contact with food must satisfy an Overall Migration Limit (OML) of <= 60 mg/kg "
            f"tested in accordance with IS 9845:2020."
        )

    return {
        "question": question,
        "answer": answer_text,
        "gemini_powered": gemini_powered,
        "retrieved_clauses": retrieved_clauses,
    }

