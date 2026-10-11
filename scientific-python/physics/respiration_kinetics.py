"""
MoSAI Scientific Physics Engine: Michaelis-Menten Produce Respiration & Headspace Balance
Deterministic calculations for OTR (Oxygen Transmission Rate) for living horticultural commodities and processed foods.
"""

import math
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class RespirationParameters:
    v_max_ref: float    # mL O2 / (kg · hr) at reference temperature (typically 10-20°C)
    k_m: float          # Michaelis-Menten constant (% O2)
    k_ic: float         # Competitive CO2 inhibition constant (% CO2)
    q10: float          # Temperature quotient (typical produce Q10 ~ 1.8 - 2.5)
    t_ref: float        # Reference temperature in °C

# Respiration kinetics database for common Indian fresh produce
# Sources: Kader (2002) "Postharvest Technology of Horticultural Crops", Fonseca et al. (2002)
COMMODITY_RESPIRATION_DEFAULTS: Dict[str, RespirationParameters] = {
    "Fresh Mangoes (Alphonso)": RespirationParameters(v_max_ref=28.0, k_m=1.8, k_ic=12.0, q10=2.2, t_ref=20.0),
    "Fresh Tomatoes": RespirationParameters(v_max_ref=18.0, k_m=1.5, k_ic=10.0, q10=2.0, t_ref=20.0),
    "Button Mushrooms": RespirationParameters(v_max_ref=160.0, k_m=2.4, k_ic=8.0, q10=2.4, t_ref=20.0),
    "Fresh Spinach (Palak)": RespirationParameters(v_max_ref=75.0, k_m=2.0, k_ic=9.0, q10=2.3, t_ref=20.0),
    "Fresh Apples (Kinnaur)": RespirationParameters(v_max_ref=10.0, k_m=1.2, k_ic=15.0, q10=1.9, t_ref=20.0),
    "Fresh Green Chillies": RespirationParameters(v_max_ref=35.0, k_m=1.6, k_ic=11.0, q10=2.1, t_ref=20.0),
}

DEFAULT_PRODUCE_RESPIRATION = RespirationParameters(
    v_max_ref=25.0, k_m=1.8, k_ic=10.0, q10=2.1, t_ref=20.0
)


def compute_temperature_adjusted_vmax(
    respiration_params: RespirationParameters,
    temp_celsius: float
) -> float:
    """
    Adjust V_max using Q10 temperature relationship:
    V_max(T) = V_max(T_ref) * Q10^((T - T_ref) / 10)
    """
    delta_t = temp_celsius - respiration_params.t_ref
    exponent = delta_t / 10.0
    return respiration_params.v_max_ref * (respiration_params.q10 ** exponent)


def michaelis_menten_ro2(
    o2_pct: float,
    co2_pct: float,
    temp_celsius: float,
    params: RespirationParameters
) -> float:
    """
    Calculate oxygen consumption rate R_O2 in mL O2 / (kg · hr)
    R_O2 = (V_max * [O2]) / (K_m + [O2] * (1 + [CO2] / K_ic))
    """
    v_max_t = compute_temperature_adjusted_vmax(params, temp_celsius)
    o2_safe = max(0.1, o2_pct)
    co2_safe = max(0.0, co2_pct)
    
    inhibition_term = 1.0 + (co2_safe / params.k_ic)
    denominator = params.k_m + (o2_safe * inhibition_term)
    
    if denominator <= 1e-6:
        return 0.0
    
    return (v_max_t * o2_safe) / denominator


def calculate_otr_required(
    pack_mass_g: float,
    pouch_area_sqm: float,
    shelf_life_days: int,
    is_living_produce: bool = False,
    ro2_manual_rate: Optional[float] = None,
    commodity_name: Optional[str] = None,
    fat_content_pct: float = 0.0,
    ambient_temp_celsius: float = 25.0,
    target_internal_o2_pct: float = 4.0,  # Optimal equilibrium O2 for MAP produce (3-5%)
    target_internal_co2_pct: float = 5.0, # Optimal equilibrium CO2 for MAP produce
) -> Dict[str, Any]:
    """
    Calculate required Oxygen Transmission Rate (OTR_req) in cm³/(m²·day) [or mL/(m²·day)].
    
    For living produce (MAP):
      Steady-state balance: Permeation Rate = Respiration Rate
      OTR_req = (R_O2 * M_food_kg * 24 hr/day) / (A * (y_O2_ext - y_O2_target))
      
    For processed non-living foods:
      OTR threshold based on lipid oxidation and total head-space barrier lifetime:
      OTR_req = Permissible O2 uptake / (A * shelf_days * Δy_O2)
    """
    pack_mass_kg = max(0.005, pack_mass_g / 1000.0)
    pouch_area_sqm = max(0.005, pouch_area_sqm)
    shelf_life_days = max(1, shelf_life_days)
    
    y_o2_ext = 0.21  # 21% atmospheric oxygen (fraction 0.21)

    if is_living_produce or (ro2_manual_rate is not None and ro2_manual_rate > 0):
        # 1. Horticultural produce under MAP
        params = COMMODITY_RESPIRATION_DEFAULTS.get(commodity_name or "", DEFAULT_PRODUCE_RESPIRATION)
        
        if ro2_manual_rate is not None and ro2_manual_rate > 0:
            # Manual respiration rate provided in mL/(kg·hr)
            r_o2_hourly = ro2_manual_rate
        else:
            # Deterministic Michaelis-Menten kinetics
            r_o2_hourly = michaelis_menten_ro2(
                o2_pct=target_internal_o2_pct,
                co2_pct=target_internal_co2_pct,
                temp_celsius=ambient_temp_celsius,
                params=params,
            )
        
        # Daily respiration: mL O2 / day for the total pack
        daily_respiration_pack = r_o2_hourly * pack_mass_kg * 24.0  # cm³ / day
        
        # Driving force fraction: (y_ext - y_target)
        delta_y_o2 = max(0.02, y_o2_ext - (target_internal_o2_pct / 100.0))
        
        # Required OTR in cm³/(m²·day) at 1 atm gradient
        otr_req = daily_respiration_pack / (pouch_area_sqm * delta_y_o2)
        otr_req = max(10.0, round(otr_req, 2))
        
        classification = "Living Horticultural Commodity (MAP Equilibrium)"
        details = {
            "hourly_r_o2_ml_kg_hr": round(r_o2_hourly, 2),
            "daily_pack_o2_consumption_cm3": round(daily_respiration_pack, 2),
            "target_internal_o2_pct": target_internal_o2_pct,
            "target_internal_co2_pct": target_internal_co2_pct,
            "temperature_celsius": ambient_temp_celsius,
        }
    else:
        # 2. Processed / shelf-stable / non-living commodity
        # High fat content accelerates lipid oxidation (peroxide value limits)
        # Permissible dissolved/headspace O2 absorption before rancidity:
        if fat_content_pct > 20.0:
            # Extremely sensitive to oxidative rancidity (nuts, butter, ghee, chips)
            max_o2_tolerance_cm3 = 15.0 * pack_mass_kg  # cm³ O2 / kg product
        elif fat_content_pct > 5.0:
            # Moderately sensitive (flours, biscuits, noodles)
            max_o2_tolerance_cm3 = 45.0 * pack_mass_kg
        else:
            # Low fat shelf-stable (rice, pulses, spices)
            max_o2_tolerance_cm3 = 100.0 * pack_mass_kg

        delta_y_o2 = y_o2_ext  # ambient air outside vs near-zero inside
        otr_req = max_o2_tolerance_cm3 / (pouch_area_sqm * shelf_life_days * delta_y_o2)
        otr_req = max(0.01, round(otr_req, 3))
        
        classification = "Processed / Shelf-Stable Commodity (Lipid Preservation)"
        details = {
            "max_o2_tolerance_cm3": round(max_o2_tolerance_cm3, 2),
            "fat_content_pct": fat_content_pct,
            "shelf_life_days": shelf_life_days,
        }

    return {
        "pack_mass_g": pack_mass_g,
        "pouch_area_sqm": pouch_area_sqm,
        "shelf_life_days": shelf_life_days,
        "is_living_produce": is_living_produce or (ro2_manual_rate is not None and ro2_manual_rate > 0),
        "otr_required": otr_req,  # cm³/(m²·day)
        "biological_classification": classification,
        "kinetics_details": details,
    }
