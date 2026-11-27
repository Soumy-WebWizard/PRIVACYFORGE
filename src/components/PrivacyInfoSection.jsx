import React from 'react';
import { ShieldCheck, ServerOff, DatabaseZap, AlertCircle } from 'lucide-react';

export default function PrivacyInfoSection() {
  return (
    <section
      aria-label="Privacy Architecture and Validation Guarantees"
      className="rounded-2xl border border-slate-800/90 bg-navy-900/90 p-6 shadow-lg"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">
            Privacy Architecture &amp; Technical Boundaries
          </h2>
          <p className="text-xs text-slate-400">
            Transparent engineering guarantees — distinguishing static web delivery from local document execution.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <ServerOff className="h-4 w-4" aria-hidden="true" />
            <span>100% Browser Execution</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Static application assets (HTML, JS, CSS) load once from the hosting server when you open the page.
            After loading, all file reads, regex/Luhn checks, redactions, and Blob exports run locally in browser memory — zero document bytes ever cross the network.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
            <DatabaseZap className="h-4 w-4" aria-hidden="true" />
            <span>Zero Persistent Storage</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            PrivacyForge never writes documents or pseudonym lookup tables to{' '}
            <code className="text-slate-300">localStorage</code>,{' '}
            <code className="text-slate-300">sessionStorage</code>, IndexedDB, cookies, or console logs.
            Pseudonymization maps live exclusively inside volatile memory for the active sanitization run.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>Format vs. Real-World Validity</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Credit card candidates must pass the Luhn checksum, and IPv4 octets are strictly bounded to{' '}
            <code className="text-slate-300">0–255</code>. Indian PAN and Aadhaar detectors validate expected structural patterns only and do not establish whether an identifier is genuine or belongs to a real person.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-slate-300">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <span>
          Downloadable JSON audit summaries intentionally exclude raw PII values and replacements, exporting only category counts, character offsets, and run metadata.
        </span>
      </div>
    </section>
  );
}
