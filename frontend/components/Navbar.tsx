'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LogIn, User, LogOut, BookOpen, History, Zap, CheckCircle2, Award } from 'lucide-react';

interface NavbarProps {
  user: { id: number; email: string; name: string } | null;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Navbar({
  user,
  activeTab = 'optimizer',
  onSelectTab,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  function handleTabClick(tab: string) {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">MoSAI</span>
                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                  v1.0 FSSAI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Physics Food Packaging Optimizer</p>
            </div>
          </Link>
        </div>

        {/* Live Engine Status */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Engine:</span>
          <span className="font-mono text-emerald-400 font-medium">Sub-10ms Physics</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">RAG:</span>
          <span className="font-mono text-sky-400 font-medium">Gemini 1.5/3.8 Flash</span>
        </div>

        {/* Navigation & Mode Badges */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => handleTabClick('optimizer')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'optimizer'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Optimizer</span>
            </button>

            <button
              onClick={() => handleTabClick('regulations')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'regulations'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Regulations & RAG</span>
            </button>

            <button
              onClick={() => handleTabClick('history')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>{user ? 'Audit History' : 'History'}</span>
            </button>
          </nav>

          {/* User state */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden xl:inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                <Award className="h-3 w-3" />
                Certified Auditor
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs">
                <User className="h-3.5 w-3.5 text-sky-400" />
                <span className="font-medium text-slate-200">{user.name || user.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                Guest Mode
              </span>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
