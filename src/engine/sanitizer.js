import { PII_CATEGORIES, REDACTION_MODES } from './constants.js';
import { detectPII } from './detectors.js';

/**
 * Creates a fresh in-memory pseudonym registry for a single sanitization run.
 * Mappings are never persisted to disk, localStorage, or sessionStorage.
 */
export function createPseudonymRegistry() {
  const categoryMaps = new Map();

  return {
    getOrCreate(category, normalizedValue) {
      const meta = PII_CATEGORIES[category];
      const prefix = meta ? meta.pseudonymPrefix : 'ENTITY';

      if (!categoryMaps.has(category)) {
        categoryMaps.set(category, new Map());
      }

      const map = categoryMaps.get(category);
      const key = normalizedValue || '';
      if (map.has(key)) {
        return map.get(key);
      }

      const seq = String(map.size + 1).padStart(2, '0');
      const token = `${prefix}_${seq}`;
      map.set(key, token);
      return token;
    },
    getUniqueEntityCount() {
      let total = 0;
      for (const map of categoryMaps.values()) {
        total += map.size;
      }
      return total;
    },
  };
}

export function formatPartialMask(category, rawValue) {
  switch (category) {
    case 'email': {
      const atIdx = rawValue.indexOf('@');
      if (atIdx <= 0) return '[REDACTED]';
      const local = rawValue.slice(0, atIdx);
      const domain = rawValue.slice(atIdx + 1);
      return `${local[0]}***@${domain}`;
    }
    case 'phone': {
      const digits = rawValue.replace(/\D/g, '');
      if (digits.length <= 4) return 'X'.repeat(digits.length);
      const maskLen = Math.max(6, Math.min(digits.length - 4, 8));
      return `${'X'.repeat(maskLen)}${digits.slice(-4)}`;
    }
    case 'credit_card': {
      const digits = rawValue.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      return `XXXX-XXXX-XXXX-${last4}`;
    }
    case 'aadhaar': {
      const digits = rawValue.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      return `XXXX-XXXX-${last4}`;
    }
    case 'pan': {
      return `XXXXX${rawValue.slice(5)}`;
    }
    case 'ipv4': {
      const parts = rawValue.split('.');
      if (parts.length !== 4) return '[REDACTED]';
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    default:
      return '[REDACTED]';
  }
}

export function getReplacement(detection, mode, registry) {
  switch (mode) {
    case REDACTION_MODES.FULL:
      return '[REDACTED]';
    case REDACTION_MODES.PARTIAL:
      return formatPartialMask(detection.category, detection.value);
    case REDACTION_MODES.PSEUDONYMIZE:
      return registry.getOrCreate(
        detection.category,
        detection.normalizedValue || detection.value
      );
    default:
      return '[REDACTED]';
  }
}

/**
 * Applies the selected redaction mode to text using pre-detected spans.
 */
export function sanitizeText(
  text,
  detections = null,
  mode = REDACTION_MODES.FULL,
  registry = createPseudonymRegistry()
) {
  if (!text) {
    return {
      sanitizedText: '',
      detections: [],
      remainingCount: 0,
    };
  }

  const activeDetections = detections ?? detectPII(text);
  if (activeDetections.length === 0) {
    return {
      sanitizedText: text,
      detections: [],
      remainingCount: 0,
    };
  }

  const parts = [];
  const enrichedDetections = [];
  let cursor = 0;

  for (const det of activeDetections) {
    if (det.start > cursor) {
      parts.push(text.slice(cursor, det.start));
    }
    const replacement = getReplacement(det, mode, registry);
    parts.push(replacement);
    enrichedDetections.push({
      ...det,
      replacement,
    });
    cursor = det.end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  const sanitizedText = parts.join('');
  const remainingDetections = detectPII(sanitizedText);

  return {
    sanitizedText,
    detections: enrichedDetections,
    remainingCount: remainingDetections.length,
  };
}
