'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import RAGAuditModal from '../components/RAGAuditModal';
import TdsUploadModal from '../components/TdsUploadModal';
import {
  ShieldCheck,
  Zap,
  Scale,
  FileDown,
  Sparkles,
  UploadCloud,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Activity,
  Atom,
  Sliders,
  Award,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Check,
  History,
  RotateCcw,
  MessageSquare,
  Search,
  Lock,
  Send,
  Loader2,
  FileText,
  Clock,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';

export default function HomePage() {
  // Auth state
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [ragModalOpen, setRagModalOpen] = useState(false);
  const [tdsModalOpen, setTdsModalOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'optimizer' | 'regulations' | 'history' | 'math' | 'materials'>('optimizer');

  // Commodities & Presets
  const [commodities, setCommodities] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('Potato Chips / Namkeen');

  // Input Parameters
  const [packMass, setPackMass] = useState<number>(200);
  const [moistureCrit, setMoistureCrit] = useState<number>(2.0);
  const [fatContent, setFatContent] = useState<number>(32.0);
  const [phLevel, setPhLevel] = useState<number>(6.0);
  const [pouchArea, setPouchArea] = useState<number>(0.05);
  const [shelfDays, setShelfDays] = useState<number>(150);
  const [ro2Rate, setRo2Rate] = useState<number>(0.0);
  const [ambientRh, setAmbientRh] = useState<number>(85.0);
  const [ambientTemp, setAmbientTemp] = useState<number>(38.0);

  // Review status & notes for current run
  const [reviewStatus, setReviewStatus] = useState<string>('In Review');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // MCDA Weights
  const [weightBarrier, setWeightBarrier] = useState<number>(0.50);
  const [weightCost, setWeightCost] = useState<number>(0.35);
  const [weightEco, setWeightEco] = useState<number>(0.15);

  // Computation Results
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [activeAuditReport, setActiveAuditReport] = useState<any>(null);
  const [selectedMaterialForAudit, setSelectedMaterialForAudit] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [expandedMaterialId, setExpandedMaterialId] = useState<number | null>(null);

  // Audit History state
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Regulations & RAG Knowledge Base state
  const [clauses, setClauses] = useState<any[]>([]);
  const [clauseSearch, setClauseSearch] = useState<string>('');
  const [selectedClauseCategory, setSelectedClauseCategory] = useState<string>('all');
  const [ragChatQuestion, setRagChatQuestion] = useState<string>('');
  const [ragChatLoading, setRagChatLoading] = useState<boolean>(false);
  const [ragChatMessages, setRagChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; gemini_powered?: boolean; citations?: any[] }>>([]);

  // Check stored auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('mosai_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) setUser(data.user);
        })
        .catch(() => {});
    }

    // Load commodity presets
    fetch('/api/commodities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCommodities(data);
        }
      })
      .catch((err) => console.error('Failed to load commodities:', err));

    // Load FSSAI regulations clauses
    fetch('/api/rag/clauses')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClauses(data);
      })
      .catch((err) => console.error('Failed to load clauses:', err));
  }, []);

  // Fetch Audit History whenever tab switches to 'history' or user changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadAuditHistory();
    }
  }, [activeTab, user]);

  async function loadAuditHistory() {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('mosai_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/optimize/history', { headers });
      if (res.ok) {
        const data = await res.json();
        setAuditHistory(data);
      }
    } catch (err) {
      console.error('Failed to load audit history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Update Review Status on an existing Audit Log
  async function updateHistoryReview(logId: number, status: string, notes: string) {
    try {
      const token = localStorage.getItem('mosai_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/optimize/history/${logId}/review`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ review_status: status, review_notes: notes }),
      });

      if (res.ok) {
        setAuditHistory((prev) =>
          prev.map((item) =>
            item.id === logId ? { ...item, review_status: status, review_notes: notes } : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to update review status:', err);
    }
  }

  // Restore past audit into Simulator
  function restorePastAuditToSimulator(log: any) {
    const fp = log.food_params;
    if (!fp) return;

    if (fp.commodity_name) setSelectedPreset(fp.commodity_name);
    if (fp.pack_mass !== undefined) setPackMass(fp.pack_mass);
    if (fp.moisture_crit !== undefined) setMoistureCrit(fp.moisture_crit);
    if (fp.fat_content !== undefined) setFatContent(fp.fat_content);
    if (fp.ph !== undefined) setPhLevel(fp.ph);
    if (fp.pouch_area !== undefined) setPouchArea(fp.pouch_area);
    if (fp.shelf_days !== undefined) setShelfDays(fp.shelf_days);
    if (fp.ro2 !== undefined) setRo2Rate(fp.ro2);
    if (fp.ambient_rh !== undefined) setAmbientRh(fp.ambient_rh);
    if (fp.ambient_temp !== undefined) setAmbientTemp(fp.ambient_temp);

    if (log.review_status) setReviewStatus(log.review_status);
    if (log.review_notes) setReviewNotes(log.review_notes);

    setActiveTab('optimizer');
  }

  // Ask RAG Assistant in the Regulations Tab
  async function handleAskRegulatoryAI(e?: React.FormEvent, presetQuery?: string) {
    if (e) e.preventDefault();
    const query = presetQuery || ragChatQuestion;
    if (!query.trim()) return;

    const userMsg = { role: 'user' as const, text: query };
    setRagChatMessages((prev) => [...prev, userMsg]);
    setRagChatQuestion('');
    setRagChatLoading(true);

    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query RAG Assistant.');

      setRagChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          gemini_powered: data.gemini_powered,
          citations: data.retrieved_clauses,
        },
      ]);
    } catch (err: any) {
      setRagChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error connecting to RAG Assistant: ${err.message}`,
        },
      ]);
    } finally {
      setRagChatLoading(false);
    }
  }

  // Update parameters when preset changes
  function handlePresetChange(presetName: string) {
    setSelectedPreset(presetName);
    if (presetName === 'Custom') return;

    const matched = commodities.find((c) => c.commodity_name === presetName);
    if (matched) {
      setMoistureCrit(matched.moisture_limit);
      setFatContent(matched.fat_content);
      setPhLevel(matched.ph);
      setRo2Rate(matched.ro2);
      setShelfDays(matched.shelf_days);

      if (matched.ro2 > 0) {
        setPackMass(1000);
        setPouchArea(0.12);
        setAmbientRh(90);
        setAmbientTemp(20);
      } else if (matched.fat_content > 20) {
        setPackMass(200);
        setPouchArea(0.05);
        setAmbientRh(85);
        setAmbientTemp(38);
      } else {
        setPackMass(500);
        setPouchArea(0.08);
      }
    }
  }

  // Trigger Optimization Run
  async function runOptimization() {
    setLoading(true);
    try {
      const payload = {
        food_params: {
          commodity_name: selectedPreset,
          pack_mass: Number(packMass),
          moisture_crit: Number(moistureCrit),
          fat_content: Number(fatContent),
          ph: Number(phLevel),
          pouch_area: Number(pouchArea),
          shelf_days: Number(shelfDays),
          ro2: Number(ro2Rate),
          ambient_rh: Number(ambientRh),
          ambient_temp: Number(ambientTemp),
        },
        weights: {
          weight_barrier: Number(weightBarrier),
          weight_cost: Number(weightCost),
          weight_eco: Number(weightEco),
        },
        review_status: reviewStatus,
        review_notes: reviewNotes,
      };

      const token = localStorage.getItem('mosai_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Optimization calculation failed.');
      setResults(data);
    } catch (err: any) {
      alert(`Optimization error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runOptimization();
  }, [selectedPreset]);

  // Inspect RAG Audit
  async function inspectMaterialAudit(material: any) {
    setSelectedMaterialForAudit(material);
    setRagModalOpen(true);

    try {
      const res = await fetch('/api/fssai-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_commodity: selectedPreset,
          food_params: {
            pack_mass: packMass,
            ph: phLevel,
            fat_content: fatContent,
            shelf_days: shelfDays,
            ro2: ro2Rate,
            is_living: ro2Rate > 0,
          },
          selected_material: material,
          calculated_wvtr: results?.physics?.summary?.wvtr_required || 1.0,
          calculated_otr: results?.physics?.summary?.otr_required || 50.0,
        }),
      });

      const auditData = await res.json();
      setActiveAuditReport(auditData);
    } catch (err) {
      console.error('Failed to run RAG audit:', err);
    }
  }

  // PDF Certificate Download
  async function downloadPdfCertificate(customData?: any) {
    const dataSource = customData || results;
    if (!dataSource) return;
    setDownloadingPdf(true);

    try {
      const pdfPayload = {
        commodity_name: dataSource.food_params?.commodity_name || selectedPreset,
        food_params: dataSource.food_params || results.food_params,
        calculated_thresholds: dataSource.physics?.summary || results.physics?.summary,
        ranked_materials: dataSource.ranked_materials || results.ranked_materials,
        qr_hash: dataSource.qr_hash,
        verification_url: `${window.location.origin}/verify/${dataSource.qr_hash}`,
      };

      const res = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload),
      });

      if (!res.ok) throw new Error('PDF generation failed.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MoSAI_FSSAI_Certificate_${dataSource.qr_hash || 'AUDIT'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      alert(`Could not download PDF certificate: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  }

  // Filter clauses for the Regulations Tab
  const filteredClauses = clauses.filter((c) => {
    const matchesSearch =
      !clauseSearch ||
      c.title.toLowerCase().includes(clauseSearch.toLowerCase()) ||
      c.summary.toLowerCase().includes(clauseSearch.toLowerCase()) ||
      c.standards.some((s: string) => s.toLowerCase().includes(clauseSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedClauseCategory === 'oml') return c.keywords.includes('OML') || c.keywords.includes('overall migration limit');
    if (selectedClauseCategory === 'acid') return c.keywords.includes('acidic food') || c.title.toLowerCase().includes('acid');
    if (selectedClauseCategory === 'fat') return c.keywords.includes('fat') || c.keywords.includes('grease');
    if (selectedClauseCategory === 'map') return c.keywords.includes('fresh produce') || c.keywords.includes('MAP');
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab: any) => setActiveTab(tab)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => {
          localStorage.removeItem('mosai_token');
          setUser(null);
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 py-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
                  <Atom className="h-3.5 w-3.5 animate-spin-slow" />
                  Deterministic Food Science Solver
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  FSSAI (Packaging) Regulations 2018 Certified
                </span>
                {user ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                    <Award className="h-3.5 w-3.5" />
                    Auditor: {user.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    <Info className="h-3.5 w-3.5" />
                    Guest Mode (Preview)
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
                MoSAI <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">Decision Engine</span>
              </h1>
              <p className="mt-3 text-sm text-slate-400 max-w-2xl leading-relaxed">
                Replaces 3 to 9 months of physical shelf-life trials with sub-10ms thermodynamic physics calculations.
                Solves Fickian diffusion coupled with GAB moisture isotherms, Michaelis-Menten respiration kinetics,
                and Gemini 1.5/3.8 Flash grounded compliance verification.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (!user) {
                    setAuthModalOpen(true);
                  } else {
                    setTdsModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-sky-500/50 hover:bg-slate-800 transition-all shadow-md"
              >
                <UploadCloud className="h-4 w-4 text-sky-400" />
                {user ? 'Upload Vendor TDS' : 'Sign In to Ingest TDS'}
              </button>
              {results && (
                <button
                  onClick={() => downloadPdfCertificate()}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 hover:from-sky-500 hover:to-cyan-500 disabled:opacity-50 transition-all"
                >
                  <FileDown className="h-4 w-4" />
                  {downloadingPdf ? 'Exporting...' : user ? 'Export Signed Certificate (PDF)' : 'Export Sample Certificate (PDF)'}
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex items-center gap-2 border-b border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('optimizer')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'optimizer'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="h-4 w-4" />
              Optimization Engine & Ranking
            </button>
            <button
              onClick={() => setActiveTab('regulations')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'regulations'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              FSSAI Regulations & RAG Knowledge Base
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'history'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="h-4 w-4" />
              Audit History & Review Management
            </button>
            <button
              onClick={() => setActiveTab('math')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'math'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Atom className="h-4 w-4" />
              Mathematical Proofs
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'materials'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              Benchmark Materials DB
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full" id="dashboard">
        {/* ========================================================================= */}
        {/* TAB 1: OPTIMIZATION ENGINE & CANDIDATES GRID                              */}
        {/* ========================================================================= */}
        {activeTab === 'optimizer' && (
          <div className="space-y-6">
            {/* Guest Banner Notice */}
            {!user && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <span className="font-bold">You are in Guest Preview Mode.</span> Calculations are fully accurate, but audit records will not be permanently bound to your organization's compliance ledger.
                  </div>
                </div>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-lg bg-amber-500/20 px-3 py-1.5 font-bold text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 shrink-0"
                >
                  Sign In to Save Audits
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Parameter Inputs & MCDA Controls */}
              <div className="lg:col-span-4 space-y-6">
                {/* Presets & Food Boundary Conditions Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-sky-400" />
                      <h2 className="text-sm font-bold text-white">Food & Environmental Parameters</h2>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Step 1</span>
                  </div>

                  {/* Preset Selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      FSSAI Commodity Preset
                    </label>
                    <select
                      value={selectedPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-xs text-white focus:border-sky-500 focus:outline-none"
                    >
                      <option value="Custom">Custom Commodity...</option>
                      {commodities.map((c) => (
                        <option key={c.commodity_name} value={c.commodity_name}>
                          {c.commodity_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Numeric Parameter Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Pack Mass (g)
                      </label>
                      <input
                        type="number"
                        value={packMass}
                        onChange={(e) => setPackMass(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Critical Moisture (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={moistureCrit}
                        onChange={(e) => setMoistureCrit(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Fat / Lipid (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={fatContent}
                        onChange={(e) => setFatContent(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Product pH
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={phLevel}
                        onChange={(e) => setPhLevel(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Pouch Area (m²)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={pouchArea}
                        onChange={(e) => setPouchArea(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Target Shelf (days)
                      </label>
                      <input
                        type="number"
                        value={shelfDays}
                        onChange={(e) => setShelfDays(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Respiration R_O2
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={ro2Rate}
                        onChange={(e) => setRo2Rate(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Ambient RH (%)
                      </label>
                      <input
                        type="number"
                        value={ambientRh}
                        onChange={(e) => setAmbientRh(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Review Notes field (Active for Logged in user) */}
                  {user && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Auditor Review Status</span>
                        <select
                          value={reviewStatus}
                          onChange={(e) => setReviewStatus(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-950 py-1 px-2 text-[11px] text-white"
                        >
                          <option value="In Review">In Review</option>
                          <option value="Approved for Production">Approved for Production</option>
                          <option value="Lab Testing Pending">Lab Testing Pending</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Audit notes (e.g. Batch #42 shelf testing approved)"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 px-2.5 text-xs text-slate-200 placeholder-slate-500"
                      />
                    </div>
                  )}
                </div>

                {/* MCDA Priority Sliders Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-white">MCDA Optimization Weights</h2>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Sum = 100%</span>
                  </div>

                  {/* Weight Barrier */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Barrier Protection Precision</span>
                      <span className="font-mono text-sky-400 font-bold">{(weightBarrier * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightBarrier}
                      onChange={(e) => setWeightBarrier(parseFloat(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  {/* Weight Cost */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Economic Cost Efficiency</span>
                      <span className="font-mono text-amber-400 font-bold">{(weightCost * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightCost}
                      onChange={(e) => setWeightCost(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Weight Eco */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Sustainability & Recyclability</span>
                      <span className="font-mono text-emerald-400 font-bold">{(weightEco * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weightEco}
                      onChange={(e) => setWeightEco(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={runOptimization}
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:from-sky-500 hover:to-emerald-500 disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Recompute Physics & MCDA Ranks
                  </button>
                </div>
              </div>

              {/* Right Column: Physics Thresholds & Ranked Materials Grid */}
              <div className="lg:col-span-8 space-y-6">
                {/* Physics Summary Metric Cards */}
                {results?.physics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Card 1: Allowable Flux */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                        Allowable Flux (ΔM)
                      </span>
                      <div className="text-xl font-bold text-white font-mono">
                        {results.physics.summary?.delta_m_max_grams?.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-400">g</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">Max permissible gain/loss</span>
                    </div>

                    {/* Card 2: WVTR Required */}
                    <div className="rounded-2xl border border-sky-500/20 bg-sky-950/10 p-4 shadow-lg">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 block mb-1">
                        Max WVTR_req
                      </span>
                      <div className="text-xl font-bold text-sky-300 font-mono">
                        {results.physics.summary?.wvtr_required?.toFixed(3)}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">g / (m² · day) threshold</span>
                    </div>

                    {/* Card 3: Target OTR */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                        Target OTR Limit
                      </span>
                      <div className="text-xl font-bold text-white font-mono">
                        {results.physics.summary?.otr_required?.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">cm³ / (m² · day) equilibrium</span>
                    </div>

                    {/* Card 4: Biological Class */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                        Classification
                      </span>
                      <div className="text-xs font-bold text-emerald-400 mt-1 line-clamp-2">
                        {results.physics.summary?.classification}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {ro2Rate > 0 ? 'MAP Equilibrium Active' : 'Lipid Preservation Mode'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Candidates Grid Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Award className="h-5 w-5 text-sky-400" />
                        Candidate Materials Ranking & FSSAI Hard Filter Evaluation
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Filtered by Overall Migration Limits (IS 9845), Acid/Fat resistance, and ranked via Weighted Sum Model (WSM).
                      </p>
                    </div>
                    {results && (
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                        {results.compliant_count} / {results.total_evaluated} Compliant
                      </span>
                    )}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 uppercase text-[10px] font-semibold text-slate-400 tracking-wider">
                        <tr>
                          <th className="py-3 px-3">Rank / Material</th>
                          <th className="py-3 px-3">Compliance</th>
                          <th className="py-3 px-3">MCDA Score</th>
                          <th className="py-3 px-3">WVTR (g/m²/d)</th>
                          <th className="py-3 px-3">OTR (cc/m²/d)</th>
                          <th className="py-3 px-3">Cost (₹/kg)</th>
                          <th className="py-3 px-3 text-right">Regulatory Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {results?.ranked_materials?.map((mat: any, idx: number) => {
                          const isExpanded = expandedMaterialId === mat.id;
                          return (
                            <React.Fragment key={mat.id || idx}>
                              <tr
                                className={`hover:bg-slate-800/40 transition-colors ${
                                  mat.is_compliant ? 'bg-slate-900/30' : 'bg-rose-950/10'
                                }`}
                              >
                                {/* Name & Rank */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      onClick={() => setExpandedMaterialId(isExpanded ? null : mat.id)}
                                      className="text-slate-500 hover:text-slate-200 transition-colors"
                                    >
                                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                    </button>
                                    <div>
                                      <span className="font-bold text-white block">{mat.material_name}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {mat.thickness_um} µm • {mat.grade}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      mat.is_compliant
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}
                                  >
                                    {mat.is_compliant ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    {mat.compliance_status}
                                  </span>
                                </td>

                                {/* MCDA Score */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-white text-sm">
                                      {mat.mcda_score?.toFixed(1)}
                                    </span>
                                    <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                                      <div
                                        className={`h-full ${
                                          mat.is_compliant ? 'bg-gradient-to-r from-sky-500 to-emerald-400' : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${Math.min(100, mat.mcda_score)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* WVTR */}
                                <td className="py-3 px-3 font-mono">
                                  <span className={mat.wvtr > results?.physics?.summary?.wvtr_required && !mat.breathable ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                                    {mat.wvtr}
                                  </span>
                                </td>

                                {/* OTR */}
                                <td className="py-3 px-3 font-mono text-slate-200">
                                  {mat.otr}
                                </td>

                                {/* Cost */}
                                <td className="py-3 px-3 font-mono text-slate-200">
                                  ₹{mat.cost_inr_per_kg}
                                </td>

                                {/* Actions */}
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => inspectMaterialAudit(mat)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-sky-400 hover:border-sky-500 hover:bg-slate-700 transition-colors"
                                    title="Inspect FSSAI regulatory clauses & simulation audit"
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    <span>RAG Audit</span>
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Audit Details Row */}
                              {isExpanded && (
                                <tr className="bg-slate-950/70">
                                  <td colSpan={7} className="p-4">
                                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <span className="text-xs font-semibold text-slate-300 block mb-1">
                                            Deterministic Decision Audit Trail:
                                          </span>
                                          <p className="text-xs text-slate-400 font-mono">
                                            {mat.audit_trail}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Breakdown Scores */}
                                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                                        <div>
                                          <span className="text-slate-500 block text-[10px]">Barrier Score (S_b)</span>
                                          <span className="font-mono font-bold text-sky-400">{mat.barrier_score} / 100</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 block text-[10px]">Cost Score (S_c)</span>
                                          <span className="font-mono font-bold text-amber-400">{mat.cost_score} / 100</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 block text-[10px]">Sustainability (S_eco)</span>
                                          <span className="font-mono font-bold text-emerald-400">{mat.eco_score} / 100</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FSSAI REGULATIONS & INTERACTIVE RAG KNOWLEDGE BASE                */}
        {/* ========================================================================= */}
        {activeTab === 'regulations' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <BookOpen className="h-4 w-4" />
                FSSAI Packaging Regulations (2018) & BIS Standards Repository
              </div>
              <h2 className="text-2xl font-bold text-white">Regulatory Corpus & Live Gemini RAG Assistant</h2>
              <p className="text-xs text-slate-400 mt-1">
                Interrogate Indian food contact packaging norms, migration test simulants, toxic heavy metal thresholds, and BIS specifications.
              </p>
            </div>

            {/* Interactive Gemini RAG Assistant Chatbox */}
            <div className="rounded-2xl border border-sky-500/30 bg-slate-900/90 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Ask MoSAI Regulatory AI</h3>
                    <p className="text-[10px] text-slate-400">Powered by Gemini 1.5/3.8 Flash • Grounded in FSSAI 2018 & IS 9845</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Live RAG Active
                </span>
              </div>

              {/* Chat Thread */}
              {ragChatMessages.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  {ragChatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-sky-950/40 border border-sky-500/20 text-sky-200 ml-8'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1.5 text-[11px] text-slate-400">
                        {msg.role === 'user' ? 'You' : 'MoSAI Regulatory Advisor'}
                        {msg.gemini_powered && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                            Gemini Flash
                          </span>
                        )}
                      </div>
                      <div className="whitespace-pre-line font-mono text-[11px]">{msg.text}</div>
                    </div>
                  ))}
                  {ragChatLoading && (
                    <div className="flex items-center gap-2 p-3 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                      <span>Retrieving FSSAI clauses and generating grounded legal analysis...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 block mb-2">Try asking standard industry queries:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAskRegulatoryAI(undefined, 'What is the Overall Migration Limit (OML) under IS 9845:2020?')}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] hover:border-sky-500 hover:text-sky-300"
                    >
                      What is the Overall Migration Limit (OML)?
                    </button>
                    <button
                      onClick={() => handleAskRegulatoryAI(undefined, 'What simulant should be used for testing foods with pH < 4.0?')}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] hover:border-sky-500 hover:text-sky-300"
                    >
                      Testing simulants for acidic foods (pH &lt; 4.0)
                    </button>
                    <button
                      onClick={() => handleAskRegulatoryAI(undefined, 'Can printed newspapers or recycled plastic carry bags be used for food?')}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] hover:border-sky-500 hover:text-sky-300"
                    >
                      Are newspapers and recycled carry bags permitted?
                    </button>
                    <button
                      onClick={() => handleAskRegulatoryAI(undefined, 'What are the printing ink restrictions under IS 15495?')}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] hover:border-sky-500 hover:text-sky-300"
                    >
                      Printing ink rules under IS 15495 (Toluene ban)
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={(e) => handleAskRegulatoryAI(e)} className="flex gap-2">
                <input
                  type="text"
                  value={ragChatQuestion}
                  onChange={(e) => setRagChatQuestion(e.target.value)}
                  placeholder="Ask any FSSAI regulatory question (e.g. Specific migration limit for heavy metals)..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={ragChatLoading || !ragChatQuestion.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Search and Category Filter for Regulations Directory */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={clauseSearch}
                    onChange={(e) => setClauseSearch(e.target.value)}
                    placeholder="Search regulatory clauses, standards (IS 9845), or keywords..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    onClick={() => setSelectedClauseCategory('all')}
                    className={`rounded-lg px-2.5 py-1.5 font-medium ${
                      selectedClauseCategory === 'all'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({clauses.length})
                  </button>
                  <button
                    onClick={() => setSelectedClauseCategory('oml')}
                    className={`rounded-lg px-2.5 py-1.5 font-medium ${
                      selectedClauseCategory === 'oml'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    OML & Migration
                  </button>
                  <button
                    onClick={() => setSelectedClauseCategory('acid')}
                    className={`rounded-lg px-2.5 py-1.5 font-medium ${
                      selectedClauseCategory === 'acid'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Acid Contact
                  </button>
                  <button
                    onClick={() => setSelectedClauseCategory('fat')}
                    className={`rounded-lg px-2.5 py-1.5 font-medium ${
                      selectedClauseCategory === 'fat'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Lipid / Grease
                  </button>
                  <button
                    onClick={() => setSelectedClauseCategory('map')}
                    className={`rounded-lg px-2.5 py-1.5 font-medium ${
                      selectedClauseCategory === 'map'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Produce MAP
                  </button>
                </div>
              </div>

              {/* Clauses Directory Cards */}
              <div className="space-y-3">
                {filteredClauses.map((clause, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                      <span className="font-bold text-sm text-white">{clause.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono text-sky-400 border border-sky-500/20">
                          {clause.clause_id}
                        </span>
                        {clause.standards?.map((s: string, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">{clause.source}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{clause.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AUDIT HISTORY & REVIEW MANAGEMENT                                   */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <History className="h-4 w-4" />
                  Cryptographic Audit Log & Production Reviews
                </div>
                <h2 className="text-2xl font-bold text-white">Simulation History & Review Portal</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Immutable records with SHA-256 verification hashes, review statuses, and 1-click restore.
                </p>
              </div>

              {!user && (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                >
                  Sign In to View Private Audits
                </button>
              )}
            </div>

            {/* If user is not logged in, explain differentiation */}
            {!user && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-3">
                <Lock className="h-8 w-8 text-amber-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Organization Audit Trail Locked</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Guest simulations are executed ephemerally. Sign in or register to record your runs with certified QR verification, track production reviews, and restore past commodity setups.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-500"
                >
                  Sign In / Create Account
                </button>
              </div>
            )}

            {/* History Table / Cards */}
            {loadingHistory ? (
              <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                <span>Loading audit records from ledger...</span>
              </div>
            ) : auditHistory.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
                No past audits recorded yet. Run a simulation in the Optimizer tab to create your first verified audit entry.
              </div>
            ) : (
              <div className="space-y-4">
                {auditHistory.map((item) => {
                  const fp = item.food_params || {};
                  const topMat = item.full_payload?.ranked_materials?.find((m: any) => m.is_compliant);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 hover:border-slate-700 transition-all shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-xs">
                            #{item.id}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white block">
                              {fp.commodity_name || 'Custom Commodity'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Generated {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* QR Hash & Status Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`/verify/${item.qr_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-mono text-sky-400 hover:text-sky-300"
                          >
                            <span>{item.qr_hash}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              item.compliance_status === 'Compliant'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {item.compliance_status}
                          </span>

                          {/* Review Status Selector (Interactive for Logged-In User) */}
                          {user ? (
                            <select
                              value={item.review_status || 'In Review'}
                              onChange={(e) => updateHistoryReview(item.id, e.target.value, item.review_notes || '')}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                item.review_status === 'Approved for Production'
                                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                  : item.review_status === 'Lab Testing Pending'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                              }`}
                            >
                              <option value="In Review">In Review</option>
                              <option value="Approved for Production">Approved for Production</option>
                              <option value="Lab Testing Pending">Lab Testing Pending</option>
                            </select>
                          ) : (
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                              {item.review_status || 'In Review'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Parameters Summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-lg bg-slate-950/60 p-2.5">
                          <span className="text-slate-500 text-[10px] block">Pack Mass</span>
                          <span className="font-bold text-slate-200">{fp.pack_mass} g</span>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 p-2.5">
                          <span className="text-slate-500 text-[10px] block">Target Shelf</span>
                          <span className="font-bold text-slate-200">{fp.shelf_days} days</span>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 p-2.5">
                          <span className="text-slate-500 text-[10px] block">Product pH</span>
                          <span className="font-bold text-slate-200">{fp.ph}</span>
                        </div>
                        <div className="rounded-lg bg-slate-950/60 p-2.5">
                          <span className="text-slate-500 text-[10px] block">Top Match</span>
                          <span className="font-bold text-emerald-400 truncate block">
                            {topMat ? topMat.material_name : 'No Compliant Substrate'}
                          </span>
                        </div>
                      </div>

                      {/* Review Notes field */}
                      {user && (
                        <div className="flex items-center gap-2 text-xs pt-1">
                          <span className="text-slate-400 text-[11px] shrink-0">Review Notes:</span>
                          <input
                            type="text"
                            value={item.review_notes || ''}
                            onChange={(e) => updateHistoryReview(item.id, item.review_status || 'In Review', e.target.value)}
                            placeholder="Add notes for this batch audit..."
                            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 py-1 px-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                        <button
                          onClick={() => restorePastAuditToSimulator(item)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:border-sky-500 hover:bg-slate-700 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore to Simulator</span>
                        </button>

                        <button
                          onClick={() => downloadPdfCertificate(item.full_payload)}
                          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors shadow-sm"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          <span>Download Certificate</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MATHEMATICAL FORMULATION PROOFS                                    */}
        {/* ========================================================================= */}
        {activeTab === 'math' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl space-y-8 max-w-4xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">MoSAI Mathematical Physics Framework</h2>
              <p className="text-xs text-slate-400 mt-1">
                Deterministic governing equations eliminating physical laboratory guesswork.
              </p>
            </div>

            {/* Formula 1 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-sky-400">
                1. Permissible Moisture Flux & Fickian Gradient ($WVTR_{'{'}req{'}'}$)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Computes maximum allowable water vapor flux through the barrier substrate:
              </p>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                ΔM_max = (|M_critical - M_initial| / 100) × M_product (grams)
                <br />
                WVTR_req = ΔM_max / (A_pouch × t_shelf × Δa_w)  [g / (m² · day)]
              </div>
              <p className="text-[11px] text-slate-400">
                Where Δa_w is solved via the quadratic inversion of the GAB (Guggenheim-Anderson-de Boer) Moisture Sorption Isotherm.
              </p>
            </div>

            {/* Formula 2 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-400">
                2. Michaelis-Menten Produce Respiration Kinetics ($OTR_{'{'}MAP{'}'}$)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                For living produce, steady-state modified atmosphere packaging (MAP) equilibrium requires:
              </p>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                R_O2 = (V_max × [O2]) / (K_m + [O2] × (1 + [CO2] / K_ic))  [mL O2 / (kg · hr)]
                <br />
                OTR_MAP = (R_O2 × M_product × 24 hr) / (A_pouch × (y_O2_ext - y_O2_target))  [cm³ / (m² · day)]
              </div>
            </div>

            {/* Formula 3 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-400">
                3. Multi-Criteria Decision Analysis (WSM) Ranking
              </h3>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                Score = (w_barrier × S_barrier) + (w_cost × S_cost) + (w_eco × S_eco)
                <br />
                Subject to: w_barrier + w_cost + w_eco = 1.0  AND  HardFilters = PASS
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: BENCHMARK MATERIALS DB                                             */}
        {/* ========================================================================= */}
        {activeTab === 'materials' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Loaded Packaging Materials Database</h2>
              <span className="text-xs text-slate-400">Indian Industrial Packaging Benchmarks</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {results?.ranked_materials?.map((m: any, i: number) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-sm text-white">{m.material_name}</span>
                    <span className="text-[10px] font-mono rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                      {m.thickness_um} µm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] block">WVTR</span>
                      <span className="font-mono text-sky-400">{m.wvtr} g/m²/d</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">OTR</span>
                      <span className="font-mono text-emerald-400">{m.otr} cc/m²/d</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Cost</span>
                      <span className="font-mono text-slate-200">₹{m.cost_inr_per_kg}/kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Eco Score</span>
                      <span className="font-mono text-amber-400">{m.eco_score}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-500" />
            <span className="font-semibold text-slate-400">MoSAI Platform</span>
            <span>— Physics Engine & FSSAI Packaging Compliance</span>
          </div>
          <div>IS 9845:2020 • IS 10146 • IS 12252 • FSSAI Regulations 2018</div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />

      <RAGAuditModal
        isOpen={ragModalOpen}
        onClose={() => setRagModalOpen(false)}
        auditData={activeAuditReport}
        materialName={selectedMaterialForAudit?.material_name || ''}
      />

      <TdsUploadModal
        isOpen={tdsModalOpen}
        onClose={() => setTdsModalOpen(false)}
        onMaterialAdded={(newMaterial) => {
          runOptimization();
        }}
      />
    </div>
  );
}
