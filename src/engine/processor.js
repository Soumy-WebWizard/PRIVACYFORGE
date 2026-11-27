import { CATEGORY_ORDER, REDACTION_MODES } from './constants.js';
import { processCSVDocument } from './csvProcessor.js';
import { detectPII } from './detectors.js';
import { sanitizeText } from './sanitizer.js';

export function buildEmptyCategoryCounts() {
  return CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});
}

/**
 * Unified entry point for processing TXT or CSV text entirely in memory.
 */
export function processDocument({
  text = '',
  fileType = 'txt',
  mode = REDACTION_MODES.FULL,
} = {}) {
  const safeText = typeof text === 'string' ? text : '';
  const normalizedType = fileType === 'csv' ? 'csv' : 'txt';
  const categoryCounts = buildEmptyCategoryCounts();

  if (!safeText) {
    return {
      originalText: '',
      sanitizedText: '',
      detections: [],
      stats: {
        totalDetections: 0,
        uniqueCategories: 0,
        categoryCounts,
        remainingEntities: 0,
        mode,
        fileType: normalizedType,
        characterCount: 0,
        lineCount: 0,
        rowCount: 0,
        columnCount: 0,
      },
      csvData: null,
      warnings: [],
    };
  }

  let sanitizedText = '';
  let detections = [];
  let remainingEntities = 0;
  let csvData = null;
  let warnings = [];

  if (normalizedType === 'csv') {
    const result = processCSVDocument(safeText, mode);
    sanitizedText = result.sanitizedText;
    detections = result.detections;
    remainingEntities = result.remainingCount;
    warnings = result.warnings;
    csvData = {
      rows: result.rows,
      sanitizedRows: result.sanitizedRows,
      delimiter: result.delimiter,
      rowCount: result.rowCount,
      columnCount: result.columnCount,
    };
  } else {
    const detected = detectPII(safeText);
    const result = sanitizeText(safeText, detected, mode);
    sanitizedText = result.sanitizedText;
    detections = result.detections;
    remainingEntities = result.remainingCount;
  }

  for (const det of detections) {
    if (Object.prototype.hasOwnProperty.call(categoryCounts, det.category)) {
      categoryCounts[det.category] += 1;
    }
  }

  const uniqueCategories = CATEGORY_ORDER.filter((cat) => categoryCounts[cat] > 0).length;

  return {
    originalText: safeText,
    sanitizedText,
    detections,
    stats: {
      totalDetections: detections.length,
      uniqueCategories,
      categoryCounts,
      remainingEntities,
      mode,
      fileType: normalizedType,
      characterCount: safeText.length,
      lineCount: safeText.split(/\r?\n/).length,
      rowCount: csvData ? csvData.rowCount : 0,
      columnCount: csvData ? csvData.columnCount : 0,
    },
    csvData,
    warnings,
  };
}

/**
 * Generates a privacy-safe JSON audit summary containing only counts, offsets,
 * and processing metadata. Original PII values, replacements, and raw original
 * filenames are never included.
 */
export function buildPrivacySafeAuditReport({
  stats,
  detections,
  fileName = '',
  hasSourceFile,
}) {
  const isFileUpload =
    typeof hasSourceFile === 'boolean' ? hasSourceFile : Boolean(fileName);
  const sourceLabel = isFileUpload
    ? `uploaded-${stats.fileType}-file`
    : 'direct-text-input';

  return {
    application: 'PrivacyForge',
    generatedAt: new Date().toISOString(),
    processingArchitecture: 'Client-side browser memory only (no server upload)',
    source: {
      inputOrigin: isFileUpload ? 'local-file-upload' : 'direct-text-input',
      sourceLabel,
      fileType: stats.fileType,
      characterCount: stats.characterCount,
      lineCount: stats.lineCount,
      ...(stats.fileType === 'csv'
        ? { rowCount: stats.rowCount, columnCount: stats.columnCount }
        : {}),
    },
    redactionMode: stats.mode,
    summary: {
      totalEntitiesDetected: stats.totalDetections,
      uniqueCategoriesDetected: stats.uniqueCategories,
      entitiesRemainingAfterSanitization: stats.remainingEntities,
    },
    categoryCounts: { ...stats.categoryCounts },
    detectionPositions: detections.map((det) => ({
      index: det.index,
      category: det.category,
      start: det.start,
      end: det.end,
      length: det.end - det.start,
      ...(det.rowIndex !== undefined
        ? { rowIndex: det.rowIndex, colIndex: det.colIndex }
        : {}),
    })),
    verificationDisclaimer:
      'Aadhaar and PAN detections validate structural format patterns only and do not establish whether an identifier is genuine or belongs to a real individual. Credit card detection applies Luhn checksum validation. This tool detects 6 structured PII categories only and does not detect unstructured PII such as person names, physical addresses, or free-text context. Manual review of sanitized output is recommended before sharing.',
  };
}
