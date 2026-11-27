import React, { useEffect, useMemo, useState } from 'react';
import { Search, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { CATEGORY_ORDER, PII_CATEGORIES } from '../engine/constants.js';

export default function DetectionInspector({
  detections,
  activeCategoryFilter,
  onCategoryFilterChange,
  selectedDetectionId,
  onSelectDetection,
  resetKey,
}) {
  const [concealOriginals, setConcealOriginals] = useState(true);

  // P4: reset concealment back to default when workspace is cleared
  useEffect(() => {
    setConcealOriginals(true);
  }, [resetKey]);

  const filtered = useMemo(() => {
    if (activeCategoryFilter === 'all') return detections;
    return detections.filter((d) => d.category === activeCategoryFilter);
  }, [detections, activeCategoryFilter]);

  return (
    <section
      aria-label="Detection Inspector"
      className="rounded-2xl border border-slate-800/90 bg-navy-900/90 p-5 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            3. Detection Inspector
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Inspect category classification, exact character offsets, and replacements. Click any row to locate it above.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConcealOriginals((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500"
          >
            {concealOriginals ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                Show Matched Text
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                Mask Matched Text
              </>
            )}
          </button>

          <select
            aria-label="Filter detections by category"
            value={activeCategoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-navy-950 px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Categories ({detections.length})</option>
            {CATEGORY_ORDER.map((cat) => {
              const meta = PII_CATEGORIES[cat];
              const count = detections.filter((d) => d.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {meta.label} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 bg-navy-950/60 py-8 text-xs text-slate-500">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>
            {detections.length === 0
              ? 'No sensitive entities detected in the current input.'
              : 'No entities match the selected category filter.'}
          </span>
        </div>
      ) : (
        <div className="pf-scroll mt-4 max-h-80 overflow-auto rounded-xl border border-slate-800 bg-navy-950">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-navy-900 text-[11px] uppercase tracking-wider text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Position</th>
                <th className="px-3 py-2.5">Detected Value</th>
                <th className="px-3 py-2.5">Sanitized Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.map((det) => {
                const meta = PII_CATEGORIES[det.category];
                const isSelected = selectedDetectionId === det.id;

                return (
                  <tr
                    key={det.id}
                    onClick={() => onSelectDetection(det.id)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-emerald-500/10' : 'hover:bg-navy-900/70'
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-slate-500">
                      {det.index + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                      <span>
                        {det.start}..{det.end}
                      </span>
                      {det.rowIndex !== undefined && (
                        <span className="ml-2 rounded bg-navy-800 px-1.5 py-0.5 text-[10px] text-teal-300">
                          R{det.rowIndex + 1}:C{det.colIndex + 1}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 font-mono text-slate-200">
                      {concealOriginals ? '••••••••••' : det.value}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-emerald-300">
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-slate-600" aria-hidden="true" />
                        <span>{det.replacement}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
