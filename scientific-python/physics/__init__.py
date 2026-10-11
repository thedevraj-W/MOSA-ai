"""
MoSAI Physics Package
Deterministic food science equations and MCDA scoring engine.
"""
from .gab_isotherm import calculate_wvtr_required, GABParameters, COMMODITY_GAB_DEFAULTS
from .respiration_kinetics import calculate_otr_required, RespirationParameters, COMMODITY_RESPIRATION_DEFAULTS
from .fssai_rules import evaluate_fssai_hard_filters, OML_MAX_LIMIT_MG_KG
from .mcda_engine import compute_mcda_rankings

__all__ = [
    "calculate_wvtr_required",
    "GABParameters",
    "COMMODITY_GAB_DEFAULTS",
    "calculate_otr_required",
    "RespirationParameters",
    "COMMODITY_RESPIRATION_DEFAULTS",
    "evaluate_fssai_hard_filters",
    "OML_MAX_LIMIT_MG_KG",
    "compute_mcda_rankings",
]
