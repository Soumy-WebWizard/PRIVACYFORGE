import React from 'react';
import { Shield, FileSpreadsheet, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../utils/sampleData.js';

export default function Hero({ onLoadSample }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-850 p-6 shadow-xl sm:p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Client-Side PII Detection &amp; Data Sanitization</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Sanitize logs, support tickets, and CSV datasets{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              before they ever leave your device
            </span>
          </h1>

          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
            Paste plain text or upload <code className="rounded bg-navy-950 px-1.5 py-0.5 font-mono text-xs text-emerald-300">.txt</code> and{' '}
            <code className="rounded bg-navy-950 px-1.5 py-0.5 font-mono text-xs text-emerald-300">.csv</code> files to
            detect emails, Indian &amp; international phone numbers, IPv4 addresses, PAN, Aadhaar, and
            Luhn-validated payment cards entirely inside browser memory.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              Zero document uploads
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              No localStorage / sessionStorage
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              RFC 4180 CSV structure preservation
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 rounded-xl border border-slate-800 bg-navy-950/70 p-4 lg:w-72">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>Try Synthetic Samples</span>
          </div>
          <p className="text-xs text-slate-400">
            Load non-real test payloads to inspect detection &amp; redaction modes instantly.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onLoadSample(sample)}
                className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-navy-850 px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <span className="flex items-center gap-2">
                  {sample.fileType === 'csv' ? (
                    <FileSpreadsheet className="h-4 w-4 text-teal-400" aria-hidden="true" />
                  ) : (
                    <FileText className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  )}
                  {sample.label}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Load</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
