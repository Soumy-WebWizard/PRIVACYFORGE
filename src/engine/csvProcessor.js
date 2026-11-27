import { REDACTION_MODES } from './constants.js';
import { detectPII } from './detectors.js';
import { createPseudonymRegistry, sanitizeText } from './sanitizer.js';

const SUPPORTED_DELIMITERS = [',', ';', '\t', '|'];

/**
 * Auto-detects delimiter from the first logical CSV row outside quotes.
 */
export function detectDelimiter(text) {
  if (!text) return ',';
  const counts = new Map(SUPPORTED_DELIMITERS.map((d) => [d, 0]));
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      break;
    }

    if (!inQuotes && counts.has(ch)) {
      counts.set(ch, counts.get(ch) + 1);
    }
  }

  let best = ',';
  let bestCount = 0;
  for (const [delim, count] of counts.entries()) {
    if (count > bestCount) {
      best = delim;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Parses RFC 4180 CSV while preserving character offset mappings from each
 * unescaped cell back to the original CSV source string.
 */
export function parseCSV(text) {
  if (!text || typeof text !== 'string') {
    return {
      rows: [],
      delimiter: ',',
      lineEnding: '\n',
      hasTrailingNewline: false,
      warnings: [],
    };
  }

  const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
  const delimiter = detectDelimiter(text);
  const warnings = [];

  const rows = [];
  let currentRow = [];
  let cellChars = [];
  let offsetMap = [];
  let wasQuoted = false;
  let inQuotes = false;
  let atCellStart = true;

  const pushCell = () => {
    currentRow.push({
      raw: cellChars.join(''),
      wasQuoted,
      offsetMap,
      rowIndex: rows.length,
      colIndex: currentRow.length,
    });
    cellChars = [];
    offsetMap = [];
    wasQuoted = false;
    atCellStart = true;
  };

  const pushRow = () => {
    pushCell();
    rows.push(currentRow);
    currentRow = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cellChars.push('"');
          offsetMap.push(i);
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cellChars.push(ch);
        offsetMap.push(i);
      }
      continue;
    }

    if (atCellStart && ch === '"') {
      inQuotes = true;
      wasQuoted = true;
      atCellStart = false;
      continue;
    }

    if (ch === delimiter) {
      pushCell();
      continue;
    }

    if (ch === '\r') {
      if (text[i + 1] === '\n') {
        i += 1;
      }
      pushRow();
      continue;
    }

    if (ch === '\n') {
      pushRow();
      continue;
    }

    atCellStart = false;
    cellChars.push(ch);
    offsetMap.push(i);
  }

  if (inQuotes) {
    warnings.push('Malformed CSV detected: an unclosed quote was auto-closed at end of file.');
  }

  const hasTrailingNewline = text.endsWith('\n') || text.endsWith('\r');

  if (!atCellStart || currentRow.length > 0) {
    pushRow();
  }

  // Check column consistency
  if (rows.length > 1) {
    const expectedCols = rows[0].length;
    const inconsistent = rows.some((r) => r.length !== expectedCols);
    if (inconsistent) {
      warnings.push('Inconsistent column count detected across rows; original row cells were preserved.');
    }
  }

  return {
    rows,
    delimiter,
    lineEnding,
    hasTrailingNewline,
    warnings,
  };
}

export function serializeCSVCell(value, delimiter, forceQuote = false) {
  const str = value ?? '';
  const needsQuote =
    forceQuote ||
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (!needsQuote) {
    return str;
  }

  return `"${str.replace(/"/g, '""')}"`;
}

export function serializeCSV(rows, delimiter = ',', lineEnding = '\n', hasTrailingNewline = false) {
  if (!rows || rows.length === 0) {
    return '';
  }

  const lines = rows.map((row) =>
    row.map((cell) => serializeCSVCell(cell.value, delimiter, cell.wasQuoted)).join(delimiter)
  );

  const joined = lines.join(lineEnding);
  return hasTrailingNewline ? `${joined}${lineEnding}` : joined;
}

/**
 * Processes an entire CSV document cell-by-cell so structure (rows, columns,
 * delimiters, quotes, embedded newlines) stays intact while sharing one
 * in-memory pseudonymization registry across the whole document.
 */
export function processCSVDocument(text, mode = REDACTION_MODES.FULL) {
  const parsed = parseCSV(text);
  const registry = createPseudonymRegistry();

  const sanitizedRows = [];
  const allDetections = [];
  let remainingCount = 0;

  for (const row of parsed.rows) {
    const sanitizedRow = [];
    for (const cell of row) {
      const cellDetections = detectPII(cell.raw);
      const cellResult = sanitizeText(cell.raw, cellDetections, mode, registry);
      remainingCount += cellResult.remainingCount;

      for (const det of cellResult.detections) {
        const docStart = cell.offsetMap[det.start] ?? 0;
        const lastCharOffset = cell.offsetMap[det.end - 1];
        const docEnd =
          lastCharOffset !== undefined
            ? lastCharOffset + (cell.raw[det.end - 1] === '"' ? 2 : 1)
            : docStart + det.value.length;

        allDetections.push({
          ...det,
          id: `det-${allDetections.length}`,
          index: allDetections.length,
          start: docStart,
          end: docEnd,
          cellStart: det.start,
          cellEnd: det.end,
          rowIndex: cell.rowIndex,
          colIndex: cell.colIndex,
        });
      }

      sanitizedRow.push({
        value: cellResult.sanitizedText,
        wasQuoted: cell.wasQuoted,
      });
    }
    sanitizedRows.push(sanitizedRow);
  }

  const sanitizedText = serializeCSV(
    sanitizedRows,
    parsed.delimiter,
    parsed.lineEnding,
    parsed.hasTrailingNewline
  );

  return {
    sanitizedText,
    detections: allDetections,
    remainingCount,
    rows: parsed.rows,
    sanitizedRows,
    delimiter: parsed.delimiter,
    rowCount: parsed.rows.length,
    columnCount: parsed.rows[0]?.length ?? 0,
    warnings: parsed.warnings,
  };
}
