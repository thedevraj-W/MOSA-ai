'use client';

import React from 'react';
import { X, Sparkles, ShieldCheck, AlertTriangle, BookOpen, FlaskConical, CheckCircle, ExternalLink } from 'lucide-react';

interface RAGAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditData: {
    status: string;
    verdict_badge: string;
    gemini_powered: boolean;
    audit_report_markdown: string;
    retrieved_clauses: Array<{
      clause_id: string;
      title: string;
      source: string;
      summary: string;
      standards: string[];
    }>;
    mandated_simulants: string[];
  } | null;
  materialName: string;
}

export default function RAGAuditModal({ isOpen, onClose, auditData, materialName }: RAGAuditModalProps) {
  if (!isOpen || !auditData) return null;

  const isCompliant = auditData.status === 'COMPLIANT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
            isCompliant
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            {isCompliant ? <ShieldCheck className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">FSSAI Grounded Regulatory Audit</h2>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                auditData.gemini_powered
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                  : 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
              }`}>
                <Sparkles className="h-3 w-3" />
                {auditData.gemini_powered ? 'Gemini 1.5 Flash Verified' : 'FSSAI Grounded Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluating substrate: <span className="font-semibold text-slate-200">{materialName}</span> against Food Safety and Standards (Packaging) Regulations 2018.
            </p>
          </div>
        </div>

        {/* Verdict Banner */}
        <div className={`mb-6 rounded-xl border p-4 ${
          isCompliant
            ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
            : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {isCompliant ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-rose-400" />}
            <span className="font-bold text-sm tracking-wide">{auditData.verdict_badge}</span>
          </div>
        </div>

        {/* Audit Body */}
        <div className="space-y-6 text-sm text-slate-300">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <BookOpen className="h-4 w-4 text-sky-400" />
              Audit Findings & Technical Justification
            </h3>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 leading-relaxed font-mono text-xs whitespace-pre-line text-slate-200">
              {auditData.audit_report_markdown}
            </div>
          </div>

          {/* Mandated Simulants Table */}
          {auditData.mandated_simulants && auditData.mandated_simulants.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <FlaskConical className="h-4 w-4 text-emerald-400" />
                Mandated Laboratory Migration Testing Simulants (IS 9845)
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {auditData.mandated_simulants.map((sim, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-sky-400">
                      {i + 1}
                    </span>
                    <span className="text-slate-300">{sim}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retrieved Regulatory Clauses */}
          {auditData.retrieved_clauses && auditData.retrieved_clauses.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Governing Regulatory Clauses Cited
              </h3>
              <div className="space-y-2.5">
                {auditData.retrieved_clauses.map((clause, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sky-400">{clause.title}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        {clause.clause_id}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mb-2">{clause.source}</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{clause.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
