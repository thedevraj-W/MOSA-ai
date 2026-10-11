# MoSAI — Physics-Driven Food Packaging Optimization & FSSAI Compliance Platform

**MoSAI** replaces 3 to 9 months of trial-and-error physical laboratory shelf-life testing with a **sub-10ms deterministic physics calculation engine**, integrated with a **Retrieval-Augmented Generation (RAG) compliance verifier** powered by Google Gemini 1.5 Flash and **Multi-Criteria Decision Analysis (MCDA)** ranking.

---

## 🏛️ System Architecture

MoSAI is structured as a decoupled, microservice-based architecture:

<img width="1672" height="940" alt="MOSAI System Architecture Diagram" src="https://github.com/user-attachments/assets/0e9e3dc0-4943-4ee4-9bce-f682c30903e9" />
---
## 📐 Scientific Physics Engine Specifications

### 1. Permissible Moisture Flux ($WVTR_{req}$)
MoSAI solves Fick's First Law coupled with the **Guggenheim-Anderson-de Boer (GAB)** Moisture Sorption Isotherm:
$$X(a_w) = \frac{X_0 \cdot C \cdot K \cdot a_w}{(1 - K \cdot a_w) \cdot (1 - K \cdot a_w + C \cdot K \cdot a_w)}$$
where:
- $\Delta M_{max} = \frac{|X_{crit} - X_{init}|}{100} \cdot M_{food}$
- Inverts GAB isotherm into quadratic water activity coordinates to obtain internal equilibrium $a_{w, int}$.
- Solves vapor pressure gradient $\Delta p = p_{sat}(T) \cdot |a_{w, amb} - a_{w, int}|$ via Antoine equations.
- Computes allowable transmission rate:
  $$WVTR_{req} = \frac{\Delta M_{max}}{A \cdot t_{shelf} \cdot \Delta a_w} \quad \left[\frac{\text{g}}{\text{m}^2 \cdot \text{day}}\right]$$

### 2. Respiration Kinetics & Modified Atmosphere Packaging ($OTR_{req}$)
For living respiring horticultural commodities (fresh mangoes, tomatoes, mushrooms, spinach):
$$R_{O2}([O_2], [CO_2], T) = \frac{V_{max}(T) \cdot [O_2]}{K_m + [O_2] \cdot \left(1 + \frac{[CO_2]}{K_{ic}}\right)}$$
with temperature scaling via Arrhenius / $Q_{10}$ quotients:
$$V_{max}(T) = V_{max, ref} \cdot Q_{10}^{(T - T_{ref})/10}$$
At steady-state equilibrium:
$$OTR_{req} = \frac{R_{O2} \cdot (M_{food} / 1000) \cdot 24}{A \cdot (y_{O2, ext} - y_{O2, target})} \quad \left[\frac{\text{cm}^3}{\text{m}^2 \cdot \text{day}}\right]$$

### 3. Multi-Criteria Decision Analysis (MCDA)
Candidates are scored using a min-max normalized **Weighted Sum Model (WSM)**:
$$\text{Score} = (w_{barrier} \cdot S_{barrier}) + (w_{cost} \cdot S_{cost}) + (w_{eco} \cdot S_{eco})$$
where $\sum w_i = 1.0$ adjusted via dynamic user priority sliders.

---

## ⚖️ Regulatory Compliance & RAG Architecture

1. **Deterministic Hard Filters:**
   - **Overall Migration Limit (OML):** Enforces ceiling of $\le 60 \text{ mg/kg}$ or $10 \text{ mg/dm}^2$ under IS 9845:2020.
   - **Acid Protection ($\text{pH} < 4.0$):** Mandatory inert lining to prevent heavy metal leaching from metallic foils.
   - **Fat & Grease Barrier:** Mandatory greaseproof resistance for lipid-rich commodities ($>10\%$ fat) under IS 10146.
   - **MAP Breathability:** Rejects hermetic barriers for living produce to avert anaerobic fermentation.
2. **Gemini 1.5 Flash Grounded Audit:**
   - `/api/v1/rag/fssai-audit` retrieves relevant clauses from FSSAI Packaging Regulations (2018) and BIS standards (IS 9845, IS 10146, IS 12252, IS 15495) and outputs human-readable audit reports with exact citations and mandated lab testing simulants.
3. **Conservative Conflict Resolution:**
   - When multiple vendor Technical Datasheet (TDS) PDFs provide conflicting barrier properties for the same grade, MoSAI automatically defaults to the most conservative (worst-case) values (highest WVTR, highest OTR, highest cost) to mathematically guarantee food safety.

---

## 🚀 Running the Services

### 1. Scientific Python Microservice
```powershell
cd scientific-python
# Set your Gemini API key in .env (optional, grounded fallback enabled)
# GEMINI_API_KEY=your_key_here
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### 2. Node.js Orchestration Gateway
```powershell
cd backend-node
npm run dev
```
Gateway running at: `http://localhost:5000`

### 3. Next.js Frontend
```powershell
cd frontend
npm run dev
```
Frontend accessible at: `http://localhost:3000`

---

## 📜 Official Certificate & QR Verification
Every optimization run generates a cryptographically hashed audit entry in the database. 
Exporting the PDF generates a vector-sharp compliance certificate containing:
- Mathematical proof and calculated barrier thresholds ($WVTR_{req}, OTR_{req}$)
- Candidate materials evaluation matrix
- Cited FSSAI clauses and mandated testing simulants (3% acetic acid, isooctane)
- High-contrast verification QR code pointing to `/verify/[hash]` for instant third-party validation.
