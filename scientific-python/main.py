"""
MoSAI Scientific Physics & FSSAI Regulatory Microservice
FastAPI Application serving deterministic food science calculations, RAG audits, and certificate generation.
"""

import os
import io
import csv
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from physics.gab_isotherm import calculate_wvtr_required
from physics.respiration_kinetics import calculate_otr_required
from physics.fssai_rules import evaluate_fssai_hard_filters
from physics.mcda_engine import compute_mcda_rankings
from rag.rag_engine import generate_fssai_audit_report, ask_fssai_rag_assistant
from rag.fssai_kb import retrieve_relevant_fssai_clauses, FSSAI_CLAUSES
from rag.tds_parser import extract_text_from_pdf_stream, parse_tds_document, resolve_conservative_conflicts
from reporting.pdf_generator import generate_compliance_certificate_pdf

app = FastAPI(
    title="MoSAI Scientific Microservice",
    description="Physics-driven food packaging calculations & FSSAI regulatory compliance verifier",
    version="1.0.0",
)

# Enable CORS for local Next.js frontend and Node.js gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default data path
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def load_benchmark_materials() -> List[Dict[str, Any]]:
    """Load default benchmark materials dataset."""
    filepath = os.path.join(DATA_DIR, "materials.csv")
    if not os.path.exists(filepath):
        return []
    materials = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            materials.append({
                "id": idx,
                "material": row.get("material", "Unknown"),
                "thickness_um": float(row.get("thickness_um", 50)),
                "wvtr": float(row.get("wvtr", 1.0)),
                "otr": float(row.get("otr", 100.0)),
                "acid_resistant": row.get("acid_resistant", "True").lower() == "true",
                "fat_safe": row.get("fat_safe", "True").lower() == "true",
                "breathable": row.get("breathable", "False").lower() == "true",
                "biodegradable": row.get("biodegradable", "False").lower() == "true",
                "cost_inr_per_kg": float(row.get("cost_inr_per_kg", 150.0)),
            })
    return materials


def load_benchmark_commodities() -> Dict[str, Dict[str, Any]]:
    """Load default commodities preset database."""
    filepath = os.path.join(DATA_DIR, "commodities.csv")
    if not os.path.exists(filepath):
        return {}
    commodities = {}
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("commodity_name", "")
            if name:
                commodities[name] = {
                    "commodity_name": name,
                    "moisture_limit": float(row.get("moisture_limit", 10.0)),
                    "fat_content": float(row.get("fat_content", 5.0)),
                    "ph": float(row.get("ph", 6.0)),
                    "ro2": float(row.get("ro2", 0.0)),
                    "shelf_days": int(row.get("shelf_days", 90)),
                }
    return commodities


# Pydantic Schemas
class FoodParametersInput(BaseModel):
    commodity_name: Optional[str] = "Custom Commodity"
    pack_mass: float = Field(500.0, description="Mass of packaged food in grams", ge=10.0, le=10000.0)
    moisture_crit: float = Field(10.0, description="Critical upper moisture limit in %", ge=0.1, le=99.0)
    initial_moisture: Optional[float] = Field(None, description="Initial food moisture in %")
    fat_content: float = Field(5.0, description="Lipid / fat content in %", ge=0.0, le=100.0)
    ph: float = Field(6.0, description="Product pH level", ge=1.0, le=14.0)
    pouch_area: float = Field(0.08, description="Pouch surface area in m²", ge=0.005, le=5.0)
    shelf_days: int = Field(90, description="Target shelf life in days", ge=1, le=1000)
    ro2: float = Field(0.0, description="Produce respiration rate in mL O2/(kg·hr)", ge=0.0)
    ambient_rh: float = Field(85.0, description="Ambient relative humidity in %", ge=10.0, le=100.0)
    ambient_temp: float = Field(38.0, description="Ambient temperature in °C", ge=0.0, le=60.0)


class MCDAPriorityWeights(BaseModel):
    weight_barrier: float = Field(0.50, description="Weight for barrier protection precision (0 to 1)")
    weight_cost: float = Field(0.35, description="Weight for cost efficiency (0 to 1)")
    weight_eco: float = Field(0.15, description="Weight for sustainability / eco-friendliness (0 to 1)")


class OptimizeRequest(BaseModel):
    food_params: FoodParametersInput
    weights: Optional[MCDAPriorityWeights] = None
    custom_materials: Optional[List[Dict[str, Any]]] = None


class RAGAuditRequest(BaseModel):
    food_commodity: str
    food_params: Dict[str, Any]
    selected_material: Dict[str, Any]
    calculated_wvtr: float
    calculated_otr: float
    user_notes: Optional[str] = None


class PDFReportRequest(BaseModel):
    commodity_name: str
    food_params: Dict[str, Any]
    calculated_thresholds: Dict[str, Any]
    ranked_materials: List[Dict[str, Any]]
    audit_report_markdown: Optional[str] = None
    qr_hash: Optional[str] = None
    verification_url: Optional[str] = None


# Endpoints
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MoSAI Scientific Microservice",
        "physics_engine": "GAB Isotherm + Michaelis-Menten Kinetics",
        "rag_engine": "Gemini 1.5 Flash + FSSAI 2018 Regulations",
        "gemini_api_configured": bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")),
    }


@app.get("/api/v1/commodities")
def get_commodities():
    """Return benchmark commodities database."""
    return load_benchmark_commodities()


@app.get("/api/v1/materials")
def get_materials():
    """Return benchmark packaging materials database."""
    return load_benchmark_materials()


@app.post("/api/v1/physics/calculate")
def calculate_physics_thresholds(params: FoodParametersInput):
    """
    Sub-10ms deterministic physics calculation for WVTR_req and OTR_req.
    """
    wvtr_res = calculate_wvtr_required(
        pack_mass_g=params.pack_mass,
        moisture_crit_pct=params.moisture_crit,
        initial_moisture_pct=params.initial_moisture,
        pouch_area_sqm=params.pouch_area,
        shelf_life_days=params.shelf_days,
        ambient_rh_pct=params.ambient_rh,
        ambient_temp_celsius=params.ambient_temp,
        commodity_name=params.commodity_name,
    )

    is_living = params.ro2 > 0 or ("Fresh" in (params.commodity_name or "") or "Mushroom" in (params.commodity_name or ""))
    otr_res = calculate_otr_required(
        pack_mass_g=params.pack_mass,
        pouch_area_sqm=params.pouch_area,
        shelf_life_days=params.shelf_days,
        is_living_produce=is_living,
        ro2_manual_rate=params.ro2,
        commodity_name=params.commodity_name,
        fat_content_pct=params.fat_content,
        ambient_temp_celsius=params.ambient_temp,
    )

    return {
        "wvtr": wvtr_res,
        "otr": otr_res,
        "is_living": is_living,
        "summary": {
            "wvtr_required": wvtr_res["wvtr_required"],
            "otr_required": otr_res["otr_required"],
            "delta_m_max_grams": wvtr_res["delta_m_max_grams"],
            "classification": otr_res["biological_classification"],
        }
    }


@app.post("/api/v1/optimize")
def optimize_packaging(req: OptimizeRequest):
    """
    Complete pipeline:
    1. Physics solver -> WVTR_req and OTR_req
    2. Deterministic FSSAI hard filters (OML, acid pH, fat safe, breathability)
    3. Multi-Criteria Decision Analysis (MCDA) Weighted Sum Model ranking
    """
    params_dict = req.food_params.model_dump()
    weights_dict = (req.weights or MCDAPriorityWeights()).model_dump()

    # 1. Physics
    physics_calc = calculate_physics_thresholds(req.food_params)
    wvtr_req = physics_calc["summary"]["wvtr_required"]
    otr_req = physics_calc["summary"]["otr_required"]
    is_living = physics_calc["is_living"]

    # 2. Material Pool
    materials_pool = req.custom_materials or load_benchmark_materials()

    # 3. Apply FSSAI Hard Filters
    evaluated_materials = []
    for mat in materials_pool:
        is_comp, rejections, clauses = evaluate_fssai_hard_filters(
            material=mat,
            food_params=params_dict,
            wvtr_req=wvtr_req,
            otr_req=otr_req,
        )
        evaluated_m = dict(mat)
        evaluated_m["is_compliant"] = is_comp
        evaluated_m["rejection_reasons"] = rejections
        evaluated_m["cited_clauses"] = clauses
        evaluated_materials.append(evaluated_m)

    # 4. MCDA Ranking
    ranked = compute_mcda_rankings(
        evaluated_materials=evaluated_materials,
        weight_barrier=weights_dict["weight_barrier"],
        weight_cost=weights_dict["weight_cost"],
        weight_eco=weights_dict["weight_eco"],
        wvtr_req=wvtr_req,
        otr_req=otr_req,
        is_living=is_living,
    )

    return {
        "food_params": params_dict,
        "weights": weights_dict,
        "physics": physics_calc,
        "ranked_materials": ranked,
        "compliant_count": sum(1 for r in ranked if r["is_compliant"]),
        "total_evaluated": len(ranked),
    }


@app.post("/api/v1/rag/fssai-audit")
def fssai_audit(req: RAGAuditRequest):
    """
    Retrieves top-k FSSAI clauses and invokes Gemini 1.5 Flash grounded compliance audit.
    """
    return generate_fssai_audit_report(
        food_commodity=req.food_commodity,
        food_params=req.food_params,
        selected_material=req.selected_material,
        calculated_wvtr=req.calculated_wvtr,
        calculated_otr=req.calculated_otr,
        user_notes=req.user_notes,
    )


@app.get("/api/v1/rag/clauses")
def get_fssai_clauses():
    """Return all indexed FSSAI Packaging Regulations (2018) clauses and BIS standards."""
    return FSSAI_CLAUSES


class RAGAskRequest(BaseModel):
    question: str


@app.post("/api/v1/rag/ask")
def ask_regulatory_ai(req: RAGAskRequest):
    """
    Direct interactive RAG query to Gemini 1.5/3.8 Flash grounded in FSSAI regulations.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    return ask_fssai_rag_assistant(req.question.strip())


@app.post("/api/v1/tds/upload")
async def upload_tds(
    files: List[UploadFile] = File(...),
):
    """
    Upload one or multiple vendor Technical Datasheet (TDS) PDFs.
    Parses properties and applies Conservative Conflict Resolution policy.
    """
    parsed_sheets = []
    for file in files:
        contents = await file.read()
        filename = file.filename or "vendor_tds.pdf"
        
        if filename.lower().endswith(".pdf"):
            raw_text = extract_text_from_pdf_stream(contents)
        else:
            raw_text = contents.decode("utf-8", errors="ignore")

        parsed = parse_tds_document(raw_text, filename=filename)
        parsed_sheets.append(parsed)

    # Apply Conservative Conflict Resolution
    resolved = resolve_conservative_conflicts(parsed_sheets)

    return {
        "datasheets_parsed": parsed_sheets,
        "conservative_harmonized": resolved,
    }


@app.post("/api/v1/report/generate-pdf")
def generate_pdf_report(req: PDFReportRequest):
    """
    Generate tamper-verifiable FSSAI audit certificate PDF with embedded QR code.
    """
    try:
        verify_base = req.verification_url or "http://localhost:3000/verify"
        pdf_bytes = generate_compliance_certificate_pdf(
            audit_data=req.model_dump(),
            verification_base_url=verify_base,
        )
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="MoSAI_FSSAI_Certificate_{req.qr_hash or "AUDIT"}.pdf"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
