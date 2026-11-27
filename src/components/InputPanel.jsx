import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  XCircle,
  Trash2,
} from 'lucide-react';

export default function InputPanel({
  inputText,
  fileName,
  fileType,
  stats,
  error,
  warnings,
  onTextChange,
  onFileSelected,
  onClear,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <section
      aria-label="Document Input and File Upload"
      className="rounded-2xl border border-slate-800/90 bg-navy-900/90 p-5 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            1. Source Document Input
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Paste text directly or upload a local <code className="text-emerald-300">.txt</code> or{' '}
            <code className="text-teal-300">.csv</code> file. Processing happens instantly in RAM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {fileName && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-950 px-2.5 py-1 text-xs text-slate-300">
              {fileType === 'csv' ? (
                <FileSpreadsheet className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              )}
              <span className="max-w-[180px] truncate">{fileName}</span>
            </span>
          )}

          {inputText && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-950 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-rose-500/50 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* File Upload Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 text-center transition ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-slate-700/80 bg-navy-950/60 hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,text/plain,text/csv"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          aria-label="Upload TXT or CSV file"
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <UploadCloud className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          <span className="text-xs text-slate-300">
            Drag &amp; drop a <strong className="text-white">.txt</strong> or{' '}
            <strong className="text-white">.csv</strong> file here, or
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            Choose Local File
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Read via Browser File API · Recommended &le; 2 MB (max 10 MB) · Zero server upload
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div
          role="status"
          className="mt-3 space-y-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200"
        >
          {warnings.map((warn, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Text Editor */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <label htmlFor="privacyforge-editor" className="font-medium text-slate-300">
            Raw Text / CSV Content
          </label>
          <div className="flex items-center gap-3 font-mono">
            <span>{stats.characterCount.toLocaleString()} chars</span>
            <span>{stats.lineCount.toLocaleString()} lines</span>
            {stats.fileType === 'csv' && stats.rowCount > 0 && (
              <span className="text-teal-300">
                {stats.rowCount} rows &times; {stats.columnCount} cols
              </span>
            )}
          </div>
        </div>
        <textarea
          id="privacyforge-editor"
          value={inputText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste logs, support tickets, resumes, or CSV rows here — or upload a .txt / .csv file above..."
          rows={8}
          spellCheck={false}
          className="pf-scroll w-full rounded-xl border border-slate-800 bg-navy-950 p-3.5 font-mono text-xs leading-relaxed text-slate-200 placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>
    </section>
  );
}
