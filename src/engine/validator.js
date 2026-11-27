/**
 * Pure validation and normalization helpers for all supported PII types.
 * Note: Format validation checks structural conformance only and does not
 * confirm whether an identifier belongs to a real individual.
 */

const EMAIL_LOCAL_RE = /^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+$/;
const EMAIL_LABEL_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
const EMAIL_TLD_RE = /^[a-zA-Z]{2,24}$/;

export function validateEmail(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: '' };
  }

  const trimmed = raw.trim();
  if (trimmed.length > 254) {
    return { valid: false, normalized: '' };
  }

  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) {
    return { valid: false, normalized: '' };
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { valid: false, normalized: '' };
  }

  if (!EMAIL_LOCAL_RE.test(local)) {
    return { valid: false, normalized: '' };
  }

  if (domain.length < 3 || domain.length > 253 || !domain.includes('.')) {
    return { valid: false, normalized: '' };
  }

  const labels = domain.split('.');
  if (labels.some((label) => !EMAIL_LABEL_RE.test(label))) {
    return { valid: false, normalized: '' };
  }

  const tld = labels[labels.length - 1];
  if (!EMAIL_TLD_RE.test(tld)) {
    return { valid: false, normalized: '' };
  }

  return {
    valid: true,
    normalized: `${local.toLowerCase()}@${domain.toLowerCase()}`,
  };
}

export function validateIPv4(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: '' };
  }

  const parts = raw.trim().split('.');
  if (parts.length !== 4) {
    return { valid: false, normalized: '' };
  }

  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return { valid: false, normalized: '' };
    }
    if (part.length > 1 && part.startsWith('0')) {
      return { valid: false, normalized: '' };
    }
    const num = Number(part);
    if (!Number.isInteger(num) || num < 0 || num > 255) {
      return { valid: false, normalized: '' };
    }
  }

  return {
    valid: true,
    normalized: parts.join('.'),
  };
}

export function validatePAN(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: '' };
  }

  const trimmed = raw.trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(trimmed)) {
    return { valid: false, normalized: '' };
  }

  // Ignore partial-mask output pattern (e.g., XXXXX1234F) when re-scanning sanitized output.
  if (trimmed.startsWith('XXXXX')) {
    return { valid: false, normalized: '' };
  }

  return {
    valid: true,
    normalized: trimmed,
  };
}

export function validateAadhaar(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: '' };
  }

  const digits = raw.replace(/[\s-]/g, '');
  if (!/^[2-9]\d{11}$/.test(digits)) {
    return { valid: false, normalized: '' };
  }

  // Reject all-identical digits (e.g., 222222222222)
  if (/^(\d)\1{11}$/.test(digits)) {
    return { valid: false, normalized: '' };
  }

  return {
    valid: true,
    normalized: digits,
  };
}

export function validateLuhn(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: '' };
  }

  const digits = raw.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) {
    return { valid: false, normalized: '' };
  }

  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, normalized: '' };
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const valid = sum % 10 === 0;
  return {
    valid,
    normalized: valid ? digits : '',
  };
}

const DATE_LIKE_RE = /^(?:\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/;

export function validatePhone(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: '' };
  }

  const trimmed = raw.trim();
  if (DATE_LIKE_RE.test(trimmed)) {
    return { valid: false, normalized: '' };
  }

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, normalized: '' };
  }

  // Indian mobile with +91 or 91 prefix (12 digits total, subscriber starts with 6-9)
  if ((hasPlus || digits.length === 12) && digits.startsWith('91') && digits.length === 12) {
    const subscriber = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(subscriber)) {
      return { valid: true, normalized: `IN:${subscriber}` };
    }
    // Indian STD landline with +91 (total 12 digits, e.g., +91-11-23456789)
    if (/^[1-8]\d{9}$/.test(subscriber) && /[\s-]/.test(trimmed)) {
      return { valid: true, normalized: `IN_LL:${subscriber}` };
    }
    return { valid: false, normalized: '' };
  }

  // Indian leading-zero format (11 digits: 0 + 10-digit mobile or STD landline)
  if (!hasPlus && digits.startsWith('0') && digits.length === 11) {
    const subscriber = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(subscriber)) {
      return { valid: true, normalized: `IN:${subscriber}` };
    }
    if (/^[1-8]\d{9}$/.test(subscriber) && /[\s-]/.test(trimmed)) {
      return { valid: true, normalized: `IN_LL:${subscriber}` };
    }
    return { valid: false, normalized: '' };
  }

  // Bare or separated 10-digit Indian mobile starting with 6-9
  if (!hasPlus && digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { valid: true, normalized: `IN:${digits}` };
  }

  // Formatted 10-digit North American / generic phone e.g. (555) 123-4567 or 555-123-4567
  if (!hasPlus && digits.length === 10 && /(?:\(\d{3}\)|\d{3}-)/.test(trimmed)) {
    return { valid: true, normalized: `INTL:${digits}` };
  }

  // International format with explicit leading + (10 to 15 digits)
  if (hasPlus && digits.length >= 10 && digits.length <= 15 && !digits.startsWith('0')) {
    return { valid: true, normalized: `INTL:${digits}` };
  }

  return { valid: false, normalized: '' };
}
