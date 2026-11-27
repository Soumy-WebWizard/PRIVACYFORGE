import React from 'react';
import {
  Activity,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Phone,
  Globe,
  CreditCard,
  FileBadge2,
  Fingerprint,
} from 'lucide-react';
import { CATEGORY_ORDER, PII_CATEGORIES, REDACTION_MODE_INFO } from '../engine/constants.js';

const CATEGORY_ICONS = {
  email: Mail,
  phone: Phone,
  ipv4: Globe,
  pan: FileBadge2,
  aadhaar: Fingerprint,
  credit_card: CreditCard,
};

export default function StatsPanel({ stats, activeCategoryFilter, onToggleCategoryFilter }) {
  const modeMeta = REDACTION_MODE_INFO.find((m) => m.id === stats.mode);
  const isCleanAfterSanitization = stats.remainingEntities === 0;

  return (
    <section aria-label="Detection Statistics and Categories" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800/90 bg-navy-900/90 p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Entities Detected</span>
            <Activity className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white" data-testid="stat-total-detections">
            {stats.totalDetections}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Across {stats.characterCount.toLocaleString()} chars
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-navy-900/90 p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Unique PII Categories</span>
            <Layers className="h-4 w-4 text-teal-400" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white" data-testid="stat-unique-categories">
            {stats.uniqueCategories} <span className="text-sm font-normal text-slate-500">/ 6</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Active sensitive classes</p>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-navy-900/90 p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Selected Redaction Mode</span>
            <ShieldAlert className="h-4 w-4 text-sky-400" aria-hidden="true" />
          </div>
          <p className="mt-2 text-lg font-semibold text-emerald-300" data-testid="stat-mode">
            {modeMeta ? modeMeta.label : stats.mode}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
            Format: {stats.fileType}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-navy-900/90 p-4 shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Remaining After Sanitization
            </span>
            <ShieldCheck
              className={`h-4 w-4 ${
                isCleanAfterSanitization ? 'text-emerald-400' : 'text-amber-400'
              }`}
              aria-hidden="true"
            />
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${
              isCleanAfterSanitization ? 'text-emerald-400' : 'text-amber-300'
            }`}
            data-testid="stat-remaining"
          >
            {stats.remainingEntities}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {isCleanAfterSanitization
              ? 'Post-redaction verification passed'
              : 'Residual patterns detected in output'}
          </p>
        </div>
      </div>

      {/* Six-Category Dashboard */}
      <div className="rounded-2xl border border-slate-800/90 bg-navy-900/90 p-4 shadow-lg">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Six-Category Detection Breakdown
          </h2>
          {activeCategoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onToggleCategoryFilter('all')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Reset filter
            </button>
          )}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
          {CATEGORY_ORDER.map((categoryId) => {
            const meta = PII_CATEGORIES[categoryId];
            const Icon = CATEGORY_ICONS[categoryId];
            const count = stats.categoryCounts[categoryId] ?? 0;
            const isFiltered = activeCategoryFilter === categoryId;

            return (
              <button
                key={categoryId}
                type="button"
                onClick={() =>
                  onToggleCategoryFilter(isFiltered ? 'all' : categoryId)
                }
                title={meta.verificationNote}
                className={`flex flex-col justify-between rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isFiltered
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-slate-800 bg-navy-950/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                    {meta.shortLabel}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-xl font-bold ${
                      count > 0 ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {count === 1 ? 'match' : 'matches'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
