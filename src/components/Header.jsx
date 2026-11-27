import React from 'react';
import { ShieldCheck, Lock, Cpu, RotateCcw } from 'lucide-react';

export default function Header({ onReset, hasContent }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-navy-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-950/50">
            <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-wider text-white">
                PRIVACY<span className="text-emerald-400">FORGE</span>
              </span>
              <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 sm:inline-block">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Your data. Your browser. Zero exposure.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
            title="All document scanning and redaction runs strictly inside your browser's JavaScript memory."
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Local Browser Processing</span>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-slate-700/80 bg-navy-900/90 px-3 py-1.5 text-xs text-slate-300 md:flex">
            <Cpu className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            <span>In-Memory Only · No Persistence</span>
          </div>

          {hasContent && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Clear Workspace
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
