import React from 'react';
import { EyeOff, Eye, KeyRound, FileText, FileSpreadsheet } from 'lucide-react';
import { REDACTION_MODE_INFO, REDACTION_MODES } from '../engine/constants.js';

const MODE_ICONS = {
  [REDACTION_MODES.FULL]: EyeOff,
  [REDACTION_MODES.PARTIAL]: Eye,
  [REDACTION_MODES.PSEUDONYMIZE]: KeyRound,
};

export default function ModeSelector({ mode, onModeChange, fileType, onFileTypeChange }) {
  return (
    <section
      aria-label="Redaction Mode and Format Selector"
      className="rounded-2xl border border-slate-800/90 bg-navy-900/90 p-5 shadow-lg"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Redaction Strategy
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Switch modes live without modifying your source input. Pseudonym mappings stay strictly in memory.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-navy-950 p-1 lg:self-auto">
          <span className="px-2 text-xs font-medium text-slate-400">Parser:</span>
          <button
            type="button"
            onClick={() => onFileTypeChange('txt')}
            aria-pressed={fileType === 'txt'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              fileType === 'txt'
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            TXT Mode
          </button>
          <button
            type="button"
            onClick={() => onFileTypeChange('csv')}
            aria-pressed={fileType === 'csv'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              fileType === 'csv'
                ? 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            CSV Mode
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {REDACTION_MODE_INFO.map((item) => {
          const Icon = MODE_ICONS[item.id];
          const isSelected = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              aria-pressed={isSelected}
              className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                isSelected
                  ? 'border-emerald-500/60 bg-emerald-500/10 shadow-md shadow-emerald-950/40'
                  : 'border-slate-800 bg-navy-950/60 hover:border-slate-700 hover:bg-navy-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                        isSelected
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-navy-900 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isSelected ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-slate-700'
                    }`}
                  />
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-400">{item.description}</p>
              </div>

              <div className="mt-3 rounded-lg border border-slate-800/80 bg-navy-950 px-2.5 py-1.5 font-mono text-[11px] text-emerald-300">
                {item.example}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
