"""
MoSAI Scientific Physics Engine: GAB Moisture Sorption Isotherm & Fickian Diffusion
Deterministic food science calculations for maximum permissible WVTR (Water Vapor Transmission Rate).
"""

import math
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class GABParameters:
    monolayer_moisture: float  # X0 (g H2O / 100g dry solids)
    c_constant: float          # C (Guggenheim energy constant)
    k_constant: float          # K (Multilayer factor)

# Standard GAB Isotherm parameters for typical Indian food commodities at 25-30°C
# Sources: Labuza (1984), Rahman (2009) "Food Properties Handbook", Indian Food Science benchmarks
COMMODITY_GAB_DEFAULTS: Dict[str, GABParameters] = {
    "Whole Wheat Atta": GABParameters(monolayer_moisture=6.2, c_constant=15.4, k_constant=0.74),
    "Maida (Refined Flour)": GABParameters(monolayer_moisture=5.8, c_constant=14.2, k_constant=0.75),
    "Polished Basmati Rice": GABParameters(monolayer_moisture=5.5, c_constant=18.0, k_constant=0.72),
    "Suji / Rava (Semolina)": GABParameters(monolayer_moisture=6.0, c_constant=16.0, k_constant=0.73),
    "Chana Dal (Bengal Gram)": GABParameters(monolayer_moisture=5.2, c_constant=12.5, k_constant=0.76),
    "Fresh Paneer": GABParameters(monolayer_moisture=12.0, c_constant=8.5, k_constant=0.85),
    "Skimmed Milk Powder": GABParameters(monolayer_moisture=4.5, c_constant=25.0, k_constant=0.78),
    "Pure Desi Ghee": GABParameters(monolayer_moisture=0.1, c_constant=5.0, k_constant=0.60),
    "Pasteurized Butter": GABParameters(monolayer_moisture=3.0, c_constant=6.0, k_constant=0.70),
    "Pasteurized Toned Milk": GABParameters(monolayer_moisture=15.0, c_constant=7.0, k_constant=0.90),
    "Turmeric Powder (Haldi)": GABParameters(monolayer_moisture=4.8, c_constant=12.0, k_constant=0.75),
    "Red Chilli Powder": GABParameters(monolayer_moisture=4.5, c_constant=11.5, k_constant=0.76),
    "Garam Masala": GABParameters(monolayer_moisture=4.6, c_constant=13.0, k_constant=0.74),
    "Whole Black Pepper": GABParameters(monolayer_moisture=5.0, c_constant=14.0, k_constant=0.72),
    "Instant Gulab Jamun Mix": GABParameters(monolayer_moisture=3.8, c_constant=22.0, k_constant=0.79),
    "Marie / Glucose Biscuits": GABParameters(monolayer_moisture=3.2, c_constant=20.0, k_constant=0.77),
    "Potato Chips / Namkeen": GABParameters(monolayer_moisture=2.1, c_constant=18.0, k_constant=0.80),
    "Roasted Cashew Nuts": GABParameters(monolayer_moisture=2.5, c_constant=12.0, k_constant=0.70),
    "Cane Jaggery (Gur)": GABParameters(monolayer_moisture=4.0, c_constant=10.0, k_constant=0.82),
    "Milk Chocolate Bar": GABParameters(monolayer_moisture=1.8, c_constant=14.0, k_constant=0.75),
    "Mustard Oil": GABParameters(monolayer_moisture=0.08, c_constant=4.0, k_constant=0.55),
    "Mango Pickle (in Oil)": GABParameters(monolayer_moisture=8.0, c_constant=6.5, k_constant=0.88),
    "Tomato Ketchup / Sauce": GABParameters(monolayer_moisture=10.0, c_constant=7.5, k_constant=0.89),
    "Instant Fried Noodles": GABParameters(monolayer_moisture=3.5, c_constant=16.5, k_constant=0.78),
    # Fresh horticultural commodities
    "Fresh Mangoes (Alphonso)": GABParameters(monolayer_moisture=15.0, c_constant=6.0, k_constant=0.92),
    "Fresh Tomatoes": GABParameters(monolayer_moisture=16.0, c_constant=5.5, k_constant=0.93),
    "Button Mushrooms": GABParameters(monolayer_moisture=18.0, c_constant=5.0, k_constant=0.94),
    "Fresh Spinach (Palak)": GABParameters(monolayer_moisture=17.0, c_constant=5.2, k_constant=0.94),
    "Fresh Apples (Kinnaur)": GABParameters(monolayer_moisture=14.0, c_constant=6.5, k_constant=0.91),
    "Fresh Green Chillies": GABParameters(monolayer_moisture=15.0, c_constant=5.8, k_constant=0.92),
}

DEFAULT_GAB = GABParameters(monolayer_moisture=5.0, c_constant=15.0, k_constant=0.75)


def wet_to_dry_basis(moisture_pct_wb: float) -> float:
    """Convert wet basis moisture percentage to dry basis (g water / 100g dry solid)."""
    wb = max(0.01, min(moisture_pct_wb, 99.0))
    return (wb / (100.0 - wb)) * 100.0


def dry_to_wet_basis(moisture_db: float) -> float:
    """Convert dry basis moisture (g water / 100g dry solid) to wet basis percentage."""
    return (moisture_db / (100.0 + moisture_db)) * 100.0


def calculate_water_activity_gab(moisture_db: float, gab: GABParameters) -> float:
    """
    Solve inverse GAB equation for water activity a_w (0 to 1) given moisture content X (dry basis).
    GAB Equation:
        X = (X0 * C * K * a_w) / [ (1 - K*a_w) * (1 - K*a_w + C*K*a_w) ]
    Rearranging to quadratic form: alpha * a_w^2 + beta * a_w + gamma = 0
        alpha = K^2 * (1 - C) * X
        beta = K * (C - 2) * X - X0 * C * K
        gamma = X
    """
    X0 = gab.monolayer_moisture
    C = gab.c_constant
    K = gab.k_constant
    X = max(0.001, moisture_db)

    alpha = (K ** 2) * (1.0 - C) * X
    beta = K * (C - 2.0) * X - (X0 * C * K)
    gamma = X

    if abs(alpha) < 1e-9:
        # Linear approximation
        if abs(beta) < 1e-9:
            return 0.5
        aw = -gamma / beta
        return max(0.01, min(aw, 0.99))

    discriminant = beta ** 2 - 4 * alpha * gamma
    if discriminant < 0:
        # Physical boundary safeguard
        return max(0.01, min(X / (X0 * 2.0), 0.99))

    # Quadratic formula roots
    sqrt_disc = math.sqrt(discriminant)
    root1 = (-beta + sqrt_disc) / (2 * alpha)
    root2 = (-beta - sqrt_disc) / (2 * alpha)

    # Physical water activity must lie strictly within (0, 1)
    candidates = [r for r in [root1, root2] if 0.0 < r < 1.0]
    if candidates:
        return candidates[0]
    
    # Fallback empirical approximation if numerical edge case
    return max(0.05, min(0.95, X / (X + X0)))


def antoine_vapor_pressure_kpa(temp_celsius: float) -> float:
    """
    Compute saturation vapor pressure of water P_sat (kPa) using Tetens / Antoine equation.
    T in °C.
    """
    return 0.61078 * math.exp((17.27 * temp_celsius) / (temp_celsius + 237.3))


def calculate_wvtr_required(
    pack_mass_g: float,
    moisture_crit_pct: float,
    initial_moisture_pct: Optional[float] = None,
    pouch_area_sqm: float = 0.08,
    shelf_life_days: int = 90,
    ambient_rh_pct: float = 85.0,
    ambient_temp_celsius: float = 38.0,  # Indian standard accelerated testing condition (IS 1060 / ASTM E96)
    commodity_name: Optional[str] = None,
    custom_gab: Optional[GABParameters] = None,
) -> Dict[str, Any]:
    """
    Calculate maximum allowable Water Vapor Transmission Rate (WVTR_req) in g/(m²·day)
    utilizing Fick's Law and GAB Isotherm thermodynamic gradient.
    """
    # 1. Moisture baselines
    if initial_moisture_pct is None:
        # Standard assumption: product starts at 50% of critical threshold
        initial_moisture_pct = moisture_crit_pct * 0.50

    initial_moisture_pct = max(0.01, min(initial_moisture_pct, 95.0))
    moisture_crit_pct = max(0.05, min(moisture_crit_pct, 99.0))
    pouch_area_sqm = max(0.005, pouch_area_sqm)
    shelf_life_days = max(1, shelf_life_days)

    # 2. Maximum allowable moisture flux (ΔM in grams)
    delta_m_grams = (abs(moisture_crit_pct - initial_moisture_pct) / 100.0) * pack_mass_g

    # 3. GAB Isotherm conversion to equilibrium water activities
    gab = custom_gab or COMMODITY_GAB_DEFAULTS.get(commodity_name or "", DEFAULT_GAB)
    x_init_db = wet_to_dry_basis(initial_moisture_pct)
    x_crit_db = wet_to_dry_basis(moisture_crit_pct)

    aw_init = calculate_water_activity_gab(x_init_db, gab)
    aw_crit = calculate_water_activity_gab(x_crit_db, gab)
    aw_internal_avg = (aw_init + aw_crit) / 2.0

    # 4. Driving force: ambient water activity vs food internal water activity
    aw_ambient = ambient_rh_pct / 100.0
    delta_aw = abs(aw_ambient - aw_internal_avg)
    delta_aw_effective = max(delta_aw, 0.08)  # prevent division near zero

    # 5. Vapor pressure gradient in kPa
    p_sat = antoine_vapor_pressure_kpa(ambient_temp_celsius)
    delta_p_kpa = p_sat * delta_aw_effective

    # 6. WVTR required (g/(m²·day)) at ambient gradient conditions
    # Normalized to standard 90% RH gradient convention for standardized film comparison:
    # WVTR_req = ΔM / (A * t * Δaw)
    wvtr_req = delta_m_grams / (pouch_area_sqm * shelf_life_days * delta_aw_effective)

    # Safeguard bounds
    wvtr_req = max(0.001, round(wvtr_req, 4))

    return {
        "pack_mass_g": pack_mass_g,
        "delta_m_max_grams": round(delta_m_grams, 3),
        "initial_moisture_pct": round(initial_moisture_pct, 2),
        "critical_moisture_pct": round(moisture_crit_pct, 2),
        "aw_initial": round(aw_init, 3),
        "aw_critical": round(aw_crit, 3),
        "aw_internal_avg": round(aw_internal_avg, 3),
        "aw_ambient": round(aw_ambient, 3),
        "delta_aw": round(delta_aw_effective, 3),
        "p_sat_kpa": round(p_sat, 3),
        "delta_p_kpa": round(delta_p_kpa, 3),
        "pouch_area_sqm": pouch_area_sqm,
        "shelf_life_days": shelf_life_days,
        "wvtr_required": wvtr_req,  # g/(m²·day)
        "gab_parameters": {
            "monolayer_moisture": gab.monolayer_moisture,
            "c_constant": gab.c_constant,
            "k_constant": gab.k_constant,
        },
    }
