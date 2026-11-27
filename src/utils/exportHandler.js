import { detectPII } from '../engine/detectors.js';

/**
 * Curated allow-list of generic, non-identifying document terms permitted in
 * exported filenames. Any filename containing unknown words (such as personal
 * or company names) or structured PII falls back to an anonymous filename.
 */
const BENIGN_FILENAME_WORDS = new Set([
  'access',
  'anon',
  'anonymous',
  'app',
  'archive',
  'audit',
  'backup',
  'billing',
  'contact',
  'contacts',
  'csv',
  'customer',
  'customers',
  'daily',
  'data',
  'dataset',
  'datasets',
  'demo',
  'dev',
  'doc',
  'docs',
  'document',
  'documents',
  'employee',
  'employees',
  'event',
  'events',
  'export',
  'exports',
  'file',
  'files',
  'incident',
  'incidents',
  'input',
  'internal',
  'kyc',
  'lead',
  'leads',
  'log',
  'logs',
  'monthly',
  'note',
  'notes',
  'order',
  'orders',
  'output',
  'payment',
  'payments',
  'privacyforge',
  'prod',
  'public',
  'record',
  'records',
  'report',
  'reports',
  'sample',
  'samples',
  'sanitized',
  'server',
  'staff',
  'staging',
  'summary',
  'support',
  'synthetic',
  'system',
  'test',
  'tests',
  'text',
  'ticket',
  'tickets',
  'transaction',
  'transactions',
  'txt',
  'user',
  'users',
  'weekly',
]);

const SAFE_SHORT_TOKEN_RE = /^(?:v\d{1,3}|q[1-4]|\d{1,4})$/;

/**
 * Returns a safe filename stem only when every token is strictly benign and
 * no structured PII (including case-insensitive PAN/email/phone) is present.
 * Returns null otherwise so callers fall back to an anonymous filename.
 */
export function getSafeFilenameStem(originalName = '') {
  if (!originalName || typeof originalName !== 'string') {
    return null;
  }

  const baseWithExt = originalName.trim().split(/[/\\]/).pop() || '';
  if (!baseWithExt) {
    return null;
  }

  const dotIdx = baseWithExt.lastIndexOf('.');
  const stem = dotIdx > 0 ? baseWithExt.slice(0, dotIdx) : baseWithExt;
  if (!stem || stem.length > 80) {
    return null;
  }

  // Reject if structured PII is detected in either original case or uppercase (e.g. lowercase PAN)
  if (detectPII(stem).length > 0 || detectPII(stem.toUpperCase()).length > 0) {
    return null;
  }

  // Reject any unexpected punctuation/symbols outside standard separators
  if (!/^[a-zA-Z0-9._\-\s]+$/.test(stem)) {
    return null;
  }

  const tokens = stem.split(/[\s._-]+/).filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (!BENIGN_FILENAME_WORDS.has(lower) && !SAFE_SHORT_TOKEN_RE.test(lower)) {
      return null;
    }
  }

  return tokens.join('_');
}

export function buildSanitizedFilename(originalName = '', fileType = 'txt') {
  const ext = fileType === 'csv' ? 'csv' : 'txt';
  const safeStem = getSafeFilenameStem(originalName);
  return safeStem ? `${safeStem}_sanitized.${ext}` : `privacyforge_sanitized.${ext}`;
}

export function buildAuditFilename(originalName = '') {
  const safeStem = getSafeFilenameStem(originalName);
  return safeStem ? `${safeStem}_audit_summary.json` : 'privacyforge_audit_summary.json';
}

export function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return { filename, size: blob.size };
}

export function exportSanitizedDocument(sanitizedText, originalFileName = '', fileType = 'txt') {
  const filename = buildSanitizedFilename(originalFileName, fileType);
  const mimeType =
    fileType === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
  return downloadBlob(sanitizedText, filename, mimeType);
}

export function exportAuditSummary(auditReport, originalFileName = '') {
  const filename = buildAuditFilename(originalFileName);
  const json = JSON.stringify(auditReport, null, 2);
  return downloadBlob(json, filename, 'application/json;charset=utf-8');
}
