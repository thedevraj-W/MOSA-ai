'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, Calendar, Package, Layers, Hash, FileCheck } from 'lucide-react';

export default function VerificationPage() {
  const params = useParams();
  const hash = params?.hash as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) return;

    fetch(`/api/optimize/verify/${hash}`)
      .then((res) => {
        if (!res.ok) throw new Error('Audit record not found or invalid QR hash.');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [hash]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <span className="text-sm font-medium">Verifying immutable audit certificate on MoSAI ledger...</span>
        </div>
      </div>
    );
  }

  const isVerified = data && data.verified;
  const isCompliant = data?.compliance_status === 'Compliant';

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to MoSAI Decision Engine
          </Link>
        </div>

        {error || !isVerified ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center shadow-xl">
            <AlertTriangle className="mx-auto h-12 w-12 text-rose-500 mb-3" />
            <h1 className="text-xl font-bold text-white mb-2">Certificate Verification Failed</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Hash <code className="text-rose-400 font-mono">{hash}</code> was not found in the immutable audit log table.
              This certificate may be uncertified or corrupted.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
            {/* Top Seal */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/10">
                  <FileCheck className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">Digital Compliance Certificate</h1>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Cryptographically Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Immutable Audit Record ID: <span className="font-mono text-slate-200">#{data.audit_id}</span>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-slate-400">
                  <Hash className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-mono text-sky-300 font-bold">{data.qr_hash}</span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5 text-[11px] text-slate-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(data.created_at).toUTCString()}</span>
                </div>
              </div>
            </div>

            {/* Status Highlight */}
            <div className={`rounded-xl border p-4 ${
              isCompliant
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-500/30 bg-rose-950/20 text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-bold text-sm">FSSAI Status: {data.compliance_status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Grounded verification conducted under Food Safety and Standards (Packaging) Regulations 2018 & IS 9845.
              </p>
            </div>

            {/* Food Parameters Breakdown */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-sky-400" />
                Food Parameter Specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">Commodity</span>
                  <span className="font-bold text-slate-200">{data.food_params?.commodity_name || 'Custom'}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">Mass</span>
                  <span className="font-bold text-slate-200">{data.food_params?.pack_mass} g</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">Product pH</span>
                  <span className="font-bold text-slate-200">{data.food_params?.ph}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-slate-500 block text-[10px]">Shelf Life</span>
                  <span className="font-bold text-slate-200">{data.food_params?.shelf_days} days</span>
                </div>
              </div>
            </div>

            {/* Recommended Materials in Log */}
            {data.full_payload?.ranked_materials && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  Evaluated Candidate Substrates
                </h2>
                <div className="space-y-2">
                  {data.full_payload.ranked_materials.slice(0, 3).map((mat: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">{mat.material_name}</span>
                        <span className="text-slate-500 text-[11px] block">{mat.audit_trail}</span>
                      </div>
                      <div className="text-right">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          mat.is_compliant
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {mat.compliance_status}
                        </span>
                        <span className="text-slate-400 text-[10px] block font-mono mt-0.5">
                          MCDA: {mat.mcda_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Legal Seal */}
            <div className="border-t border-slate-800 pt-6 text-center text-[11px] text-slate-500">
              MoSAI Physics Verification Ledger • Timestamp: {data.created_at} • Authorized by MoSAI Automated Science Engine
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
