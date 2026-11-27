import { PII_CATEGORIES } from './constants.js';
import {
  validateAadhaar,
  validateEmail,
  validateIPv4,
  validateLuhn,
  validatePAN,
  validatePhone,
} from './validator.js';

const PATTERN_DEFS = [
  {
    category: 'email',
    regex: /[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/g,
    validate: validateEmail,
  },
  {
    category: 'credit_card',
    regex:
      /(?<![\dA-Za-z])(?:\d{4}[ -]?\d{6}[ -]?\d{5}|\d{4}(?:[ -]?\d{4}){2,3}(?:[ -]?\d{1,4})?|\d{13,19})(?![\dA-Za-z])/g,
    validate: validateLuhn,
  },
  {
    category: 'aadhaar',
    regex: /(?<![\dA-Za-z])[2-9]\d{3}(?:[ -]\d{4}[ -]\d{4}|\d{8})(?![\dA-Za-z])/g,
    validate: validateAadhaar,
  },
  {
    category: 'pan',
    regex: /(?<![A-Za-z0-9])[A-Z]{5}[0-9]{4}[A-Z](?![A-Za-z0-9])/g,
    validate: validatePAN,
  },
  {
    category: 'ipv4',
    regex: /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g,
    validate: validateIPv4,
  },
  {
    category: 'phone',
    regex:
      /(?<![\dA-Za-z+])(?:\+91[ -]?|0(?=[1-9]\d{1,4}[ -]?\d)|\+(?!91)[1-9]\d{0,2}[ -]?)(?:\(\d{1,4}\)[ -]?)?\d(?:[ -]?\d){7,13}(?![\dA-Za-z])|(?<![\dA-Za-z+])[6-9]\d{4}[ -]?\d{5}(?![\dA-Za-z])|(?<![\dA-Za-z+])[6-9]\d{2}[ -]?\d{3}[ -]?\d{4}(?![\dA-Za-z])|(?<![\dA-Za-z+])(?:\(\d{3}\)[ -]?|\d{3}-)\d{3}-\d{4}(?![\dA-Za-z])/g,
    validate: validatePhone,
  },
];

/**
 * Resolves overlapping and duplicate candidate matches deterministically.
 * Higher category priority wins; ties break by longer span, then earlier start.
 */
export function resolveOverlaps(candidates) {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  const sorted = [...candidates].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.end - b.start - (a.end - a.start);
  });

  const accepted = [];

  for (const candidate of sorted) {
    if (accepted.length === 0) {
      accepted.push(candidate);
      continue;
    }

    const last = accepted[accepted.length - 1];

    // No overlap with previously accepted detection
    if (candidate.start >= last.end) {
      accepted.push(candidate);
      continue;
    }

    // Exact duplicate span — keep whichever already won sorting (higher priority)
    if (candidate.start === last.start && candidate.end === last.end) {
      continue;
    }

    // Partial or nested overlap: replace previous only if candidate strictly outranks it
    const candidateBeatsLast =
      candidate.priority > last.priority ||
      (candidate.priority === last.priority &&
        candidate.end - candidate.start > last.end - last.start);

    if (candidateBeatsLast) {
      accepted.pop();
      // Check against earlier items if popping revealed another overlap
      while (accepted.length > 0 && candidate.start < accepted[accepted.length - 1].end) {
        const prev = accepted[accepted.length - 1];
        if (candidate.priority > prev.priority) {
          accepted.pop();
        } else {
          break;
        }
      }
      if (accepted.length === 0 || candidate.start >= accepted[accepted.length - 1].end) {
        accepted.push(candidate);
      }
    }
  }

  return accepted.map((item, idx) => ({
    ...item,
    id: `det-${idx}`,
    index: idx,
  }));
}

/**
 * Scans plain text and returns sorted, validated, non-overlapping PII detections
 * with exact character offsets [start, end).
 */
export function detectPII(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const candidates = [];

  for (const def of PATTERN_DEFS) {
    const meta = PII_CATEGORIES[def.category];
    def.regex.lastIndex = 0;

    let match;
    while ((match = def.regex.exec(text)) !== null) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;

      const result = def.validate(value);
      if (result.valid) {
        candidates.push({
          category: def.category,
          label: meta.label,
          value,
          normalizedValue: result.normalized,
          start,
          end,
          priority: meta.priority,
        });
      }

      if (match[0].length === 0) {
        def.regex.lastIndex += 1;
      }
    }
  }

  return resolveOverlaps(candidates);
}
