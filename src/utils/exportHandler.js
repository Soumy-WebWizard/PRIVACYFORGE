export function buildSanitizedFilename(originalName = '', fileType = 'txt') {
  const ext = fileType === 'csv' ? 'csv' : 'txt';
  if (!originalName || typeof originalName !== 'string') {
    return `privacyforge_sanitized.${ext}`;
  }

  const trimmed = originalName.trim();
  const dotIdx = trimmed.lastIndexOf('.');
  if (dotIdx > 0) {
    const base = trimmed.slice(0, dotIdx);
    return `${base}_sanitized.${ext}`;
  }

  return `${trimmed}_sanitized.${ext}`;
}

export function buildAuditFilename(originalName = '') {
  if (!originalName || typeof originalName !== 'string') {
    return 'privacyforge_audit_summary.json';
  }
  const trimmed = originalName.trim();
  const dotIdx = trimmed.lastIndexOf('.');
  const base = dotIdx > 0 ? trimmed.slice(0, dotIdx) : trimmed;
  return `${base}_audit_summary.json`;
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
