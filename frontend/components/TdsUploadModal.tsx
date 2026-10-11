'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react';

interface TdsUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMaterialAdded: (material: any) => void;
}

export default function TdsUploadModal({ isOpen, onClose, onMaterialAdded }: TdsUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setResult(null);
      setError(null);
    }
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError('Please select at least one vendor TDS file.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      const res = await fetch('/api/tds/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process datasheet.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error uploading files.');
    } finally {
      setLoading(false);
    }
  }

  function handleAdoptHarmonized() {
    if (result && result.conservative_harmonized) {
      onMaterialAdded(result.conservative_harmonized);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Vendor TDS Ingestion & Conflict Resolution</h2>
            <p className="text-xs text-slate-400">
              Upload unstandardized vendor datasheets (PDF/Text). Conflicting barrier values default to conservative worst-case limits.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Dropzone */}
        {!result && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-8 text-center cursor-pointer hover:border-sky-500/50 hover:bg-slate-950/80 transition-all">
              <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
              <span className="text-sm font-semibold text-slate-200">
                {files.length > 0 ? `${files.length} file(s) selected` : 'Click to select or drag TDS PDFs'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports multiple vendor PDFs for automated conflict resolution
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1.5">
                <span className="text-xs font-semibold text-slate-400">Selected Files:</span>
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <FileText className="h-3.5 w-3.5 text-sky-400" />
                    <span>{f.name}</span>
                    <span className="text-slate-500 text-[10px]">({(f.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || files.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Parse & Resolve Datasheets'}
            </button>
          </div>
        )}

        {/* Resolution Results */}
        {result && (
          <div className="space-y-5">
            {result.conservative_harmonized?.conflict_resolved && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
                  <ShieldAlert className="h-4 w-4" />
                  Conservative Conflict Resolution Activated
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.conservative_harmonized.conflict_resolution_notes}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-bold text-white">
                  {result.conservative_harmonized?.material || 'Parsed Substrate'}
                </span>
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs font-mono text-sky-400 border border-sky-500/20">
                  {result.conservative_harmonized?.grade}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-slate-900 p-2.5">
                  <span className="text-slate-400 block text-[10px]">WVTR (Worst)</span>
                  <span className="font-bold text-white text-sm">{result.conservative_harmonized?.wvtr}</span>
                  <span className="text-slate-500 text-[10px] ml-1">g/m²/d</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2.5">
                  <span className="text-slate-400 block text-[10px]">OTR (Worst)</span>
                  <span className="font-bold text-white text-sm">{result.conservative_harmonized?.otr}</span>
                  <span className="text-slate-500 text-[10px] ml-1">cc/m²/d</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2.5">
                  <span className="text-slate-400 block text-[10px]">Thickness</span>
                  <span className="font-bold text-white text-sm">{result.conservative_harmonized?.thickness_um}</span>
                  <span className="text-slate-500 text-[10px] ml-1">µm</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2.5">
                  <span className="text-slate-400 block text-[10px]">Cost</span>
                  <span className="font-bold text-white text-sm">₹{result.conservative_harmonized?.cost_inr_per_kg}</span>
                  <span className="text-slate-500 text-[10px] ml-1">/kg</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResult(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Upload Different TDS
              </button>
              <button
                onClick={handleAdoptHarmonized}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                Add to Candidate Optimizer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
