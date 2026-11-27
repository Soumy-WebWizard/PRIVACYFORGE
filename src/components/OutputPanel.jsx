import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileJson,
  Columns,
  Table2,
  Code2,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { PII_CATEGORIES } from '../engine/constants.js';

/**
 * Splits plain text into safe React text fragments and highlighted <mark> segments
 * using exact [start, end) offsets. Never constructs raw HTML strings.
 */
function buildHighlightedSegments(text, detections) {
  if (!text) return [];
  if (!detections || detections.length === 0) {
    return [{ type: 'text', key: 'plain-0', content: text }];
  }

  const ordered = [...detections].sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;

  for (const det of ordered) {
    if (det.start < cursor || det.end > text.length || det.start >= det.end) {
      continue;
    }

    if (det.start > cursor) {
      segments.push({
        type: 'text',
        key: `t-${cursor}`,
        content: text.slice(cursor, det.start),
      });
    }

    segments.push({
      type: 'match',
      key: det.id,
      content: text.slice(det.start, det.end),
      detection: det,
    });

    cursor = det.end;
  }

  if (cursor < text.length) {
    segments.push({
      type: 'text',
      key: `t-${cursor}`,
      content: text.slice(cursor),
    });
  }

  return segments;
}

export default function OutputPanel({
  originalText,
  sanitizedText,
  detections,
  fileType,
  csvData,
  selectedDetectionId,
  onSelectDetection,
  onDownloadSanitized,
  onDownloadAudit,
  resetKey,
}) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('diff'); // 'diff' | 'csv-table'
  const [concealOriginal, setConcealOriginal] = useState(true);

  // P4: reset transient UI states when workspace is cleared
  useEffect(() => {
    setCopied(false);
    setViewMode('diff');
    setConcealOriginal(true);
  }, [resetKey]);

  const segments = useMemo(
    () => buildHighlightedSegments(originalText, detections),
    [originalText, detections]
  );

  const hasContent = Boolean(originalText);
  const canShowCsvTable = fileType === 'csv' && csvData && csvData.rows.length > 0;

  const handleCopy = async () => {
    if (!sanitizedText || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(sanitizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable in restricted contexts; fail silently without logging PII
    }
  };

  return (
    <section
      aria-label="Side-by-Side Document Preview and Export"
      className="rounded-2xl border border-slate-800/90 bg-navy-900/90 p-5 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            2. Live Side-by-Side Comparison &amp; Export
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Detected entities are highlighted in the original view using safe React text nodes (XSS-free).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canShowCsvTable && (
            <div className="flex items-center rounded-lg border border-slate-700 bg-navy-950 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('diff')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewMode === 'diff'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                Raw Text
              </button>
              <button
                type="button"
                onClick={() => setViewMode('csv-table')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewMode === 'csv-table'
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                CSV Grid
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={!hasContent}
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-950 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy Output
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!hasContent}
            onClick={onDownloadAudit}
            title="Downloads counts and match offsets only — never original PII values."
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-950 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-teal-500/50 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileJson className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            Audit Summary (.json)
          </button>

          <button
            type="button"
            disabled={!hasContent}
            onClick={onDownloadSanitized}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-navy-950 shadow-md shadow-emerald-950/50 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download Sanitized {fileType === 'csv' ? 'CSV' : 'TXT'}
          </button>
        </div>
      </div>

      {/* P3: Manual-review advisory banner */}
      {hasContent && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span>
            <strong>Manual review recommended:</strong> PrivacyForge detects 6 structured PII categories only (emails, phones, IPs, PAN, Aadhaar, cards). Unstructured PII such as person names, physical addresses, or contextual details is not detected automatically.
          </span>
        </div>
      )}

      {!hasContent ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-navy-950/60 py-14 text-center">
          <Columns className="h-8 w-8 text-slate-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-300">
            No document loaded yet
          </p>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Paste text, upload a .txt or .csv file, or click one of the synthetic sample buttons above to preview live redaction.
          </p>
        </div>
      ) : canShowCsvTable && viewMode === 'csv-table' ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Original CSV Table */}
          <div className="rounded-xl border border-slate-800 bg-navy-950">
            <div className="border-b border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300">
              Original CSV Structure ({csvData.rowCount} rows)
            </div>
            <div className="pf-scroll max-h-96 overflow-auto">
              <table className="w-full border-collapse text-left font-mono text-xs">
                <tbody>
                  {csvData.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`border-b border-slate-800/70 ${
                        rIdx === 0 ? 'bg-navy-900/90 font-semibold text-slate-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="border-r border-slate-800/70 px-2.5 py-2 text-[10px] text-slate-500">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="max-w-[240px] whitespace-pre-wrap break-words border-r border-slate-800/50 px-3 py-2 align-top"
                        >
                          {cell.raw}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sanitized CSV Table */}
          <div className="rounded-xl border border-emerald-500/30 bg-navy-950">
            <div className="border-b border-slate-800 px-3.5 py-2 text-xs font-semibold text-emerald-300">
              Sanitized CSV Structure (Preserved Rows &amp; Delimiter)
            </div>
            <div className="pf-scroll max-h-96 overflow-auto">
              <table className="w-full border-collapse text-left font-mono text-xs">
                <tbody>
                  {csvData.sanitizedRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`border-b border-slate-800/70 ${
                        rIdx === 0 ? 'bg-navy-900/90 font-semibold text-slate-200' : 'text-emerald-200/90'
                      }`}
                    >
                      <td className="border-r border-slate-800/70 px-2.5 py-2 text-[10px] text-slate-500">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="max-w-[240px] whitespace-pre-wrap break-words border-r border-slate-800/50 px-3 py-2 align-top"
                        >
                          {cell.value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Original with Inline Highlighting */}
          <div className="flex flex-col rounded-xl border border-slate-800 bg-navy-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2.5">
              <span className="text-xs font-semibold text-slate-300">
                Original Document (Inline Highlighting)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConcealOriginal((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-navy-900 px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:border-slate-500"
                  title={concealOriginal ? 'Reveal detected PII in original view' : 'Conceal detected PII in original view'}
                >
                  {concealOriginal ? (
                    <><Eye className="h-3 w-3 text-emerald-400" aria-hidden="true" /> Reveal PII</>
                  ) : (
                    <><EyeOff className="h-3 w-3 text-slate-400" aria-hidden="true" /> Conceal PII</>
                  )}
                </button>
                <span className="text-[11px] text-slate-400">
                  {detections.length} highlighted {detections.length === 1 ? 'entity' : 'entities'}
                </span>
              </div>
            </div>
            <pre
              data-testid="original-preview"
              className="pf-scroll max-h-96 min-h-[220px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-slate-300"
            >
              {segments.map((seg) => {
                if (seg.type === 'text') {
                  return <React.Fragment key={seg.key}>{seg.content}</React.Fragment>;
                }

                const meta = PII_CATEGORIES[seg.detection.category];
                const isSelected = selectedDetectionId === seg.detection.id;

                return (
                  <mark
                    key={seg.key}
                    onClick={() => onSelectDetection(seg.detection.id)}
                    title={concealOriginal
                      ? `${meta.label} (${seg.detection.start}..${seg.detection.end})`
                      : `${meta.label} (${seg.detection.start}..${seg.detection.end}) → ${seg.detection.replacement}`}
                    className={`cursor-pointer rounded px-1 py-0.5 transition ${meta.highlightClass} ${
                      isSelected ? 'ring-2 ring-white/80' : ''
                    }`}
                  >
                    {concealOriginal ? `[${meta.shortLabel}]` : seg.content}
                  </mark>
                );
              })}
            </pre>
          </div>

          {/* Sanitized Output */}
          <div className="flex flex-col rounded-xl border border-emerald-500/30 bg-navy-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2.5">
              <span className="text-xs font-semibold text-emerald-300">
                Sanitized Document Output
              </span>
              <span className="text-[11px] text-emerald-400/80">Ready for export</span>
            </div>
            <pre
              data-testid="sanitized-preview"
              className="pf-scroll max-h-96 min-h-[220px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-emerald-100/90"
            >
              {sanitizedText}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
