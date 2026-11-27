export const REDACTION_MODES = {
  FULL: 'full',
  PARTIAL: 'partial',
  PSEUDONYMIZE: 'pseudonymize',
};

export const REDACTION_MODE_INFO = [
  {
    id: REDACTION_MODES.FULL,
    label: 'Full Mask',
    shortLabel: 'Full',
    description: 'Replaces every detected entity with [REDACTED]. Maximum concealment.',
    example: '[REDACTED]',
  },
  {
    id: REDACTION_MODES.PARTIAL,
    label: 'Partial Mask',
    shortLabel: 'Partial',
    description: 'Preserves minimal trailing or structural context for human verification.',
    example: 'j***@example.com · XXXXXX3210',
  },
  {
    id: REDACTION_MODES.PSEUDONYMIZE,
    label: 'Consistent Pseudonymization',
    shortLabel: 'Pseudonymize',
    description: 'Maps repeated identical entities to deterministic in-memory placeholders.',
    example: 'USER_01 · PHONE_01',
  },
];

export const PII_CATEGORIES = {
  credit_card: {
    id: 'credit_card',
    label: 'Credit / Debit Card',
    shortLabel: 'Card',
    pseudonymPrefix: 'CARD',
    priority: 6,
    verificationNote: 'Validated via Luhn checksum (13–19 digits).',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    highlightClass: 'bg-rose-500/20 text-rose-200 border-b-2 border-rose-400',
    dotClass: 'bg-rose-400',
  },
  email: {
    id: 'email',
    label: 'Email Address',
    shortLabel: 'Email',
    pseudonymPrefix: 'USER',
    priority: 5,
    verificationNote: 'RFC-aligned local/domain structure check.',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    highlightClass: 'bg-emerald-500/20 text-emerald-200 border-b-2 border-emerald-400',
    dotClass: 'bg-emerald-400',
  },
  aadhaar: {
    id: 'aadhaar',
    label: 'Indian Aadhaar',
    shortLabel: 'Aadhaar',
    pseudonymPrefix: 'AADHAAR',
    priority: 4,
    verificationNote: 'Format match only (12 digits starting 2–9). Does not verify UIDAI issuance.',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    highlightClass: 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400',
    dotClass: 'bg-amber-400',
  },
  pan: {
    id: 'pan',
    label: 'Indian PAN',
    shortLabel: 'PAN',
    pseudonymPrefix: 'PAN',
    priority: 3,
    verificationNote: 'Format match only (AAAAA9999A). Does not verify real-world issuance.',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    highlightClass: 'bg-purple-500/20 text-purple-200 border-b-2 border-purple-400',
    dotClass: 'bg-purple-400',
  },
  ipv4: {
    id: 'ipv4',
    label: 'IPv4 Address',
    shortLabel: 'IPv4',
    pseudonymPrefix: 'IP',
    priority: 2,
    verificationNote: 'Strict 0–255 octet validation across 4 dotted segments.',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    highlightClass: 'bg-cyan-500/20 text-cyan-200 border-b-2 border-cyan-400',
    dotClass: 'bg-cyan-400',
  },
  phone: {
    id: 'phone',
    label: 'Phone Number',
    shortLabel: 'Phone',
    pseudonymPrefix: 'PHONE',
    priority: 1,
    verificationNote: 'Indian (+91 / 10-digit mobile / STD) & international formats.',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    highlightClass: 'bg-sky-500/20 text-sky-200 border-b-2 border-sky-400',
    dotClass: 'bg-sky-400',
  },
};

export const CATEGORY_ORDER = [
  'email',
  'phone',
  'ipv4',
  'pan',
  'aadhaar',
  'credit_card',
];

export const MAX_RECOMMENDED_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB warning threshold
export const MAX_HARD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB hard limit to keep browser responsive
