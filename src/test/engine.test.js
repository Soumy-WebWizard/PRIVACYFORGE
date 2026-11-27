import { describe, expect, it } from 'vitest';
import { REDACTION_MODES } from '../engine/constants.js';
import { detectPII } from '../engine/detectors.js';
import { processDocument } from '../engine/processor.js';
import { sanitizeText } from '../engine/sanitizer.js';
import {
  validateAadhaar,
  validateEmail,
  validateIPv4,
  validateLuhn,
  validatePAN,
  validatePhone,
} from '../engine/validator.js';

describe('PII Validators & Detectors', () => {
  it('detects valid email addresses and rejects invalid email patterns', () => {
    const valid = [
      'john@example.com',
      'alice.smith+billing@sub.company.co.in',
      'sec_ops99@privacy-forge.io',
    ];
    for (const email of valid) {
      expect(validateEmail(email).valid).toBe(true);
    }

    const invalid = [
      'user@.com',
      '@example.com',
      'user@example',
      'user..name@example.com',
      'user@-example.com',
      'user@example..com',
      'j***@example.com',
    ];
    for (const bad of invalid) {
      expect(validateEmail(bad).valid).toBe(false);
    }

    const sample = 'Contact john@example.com or invalid user@.com and @domain.org';
    const detections = detectPII(sample);
    expect(detections).toHaveLength(1);
    expect(detections[0].category).toBe('email');
    expect(detections[0].value).toBe('john@example.com');
  });

  it('detects Indian and international phone formats while ignoring dates', () => {
    expect(validatePhone('+91 98765 43210').valid).toBe(true);
    expect(validatePhone('+91-9876543210').valid).toBe(true);
    expect(validatePhone('09876543210').valid).toBe(true);
    expect(validatePhone('9876543210').valid).toBe(true);
    expect(validatePhone('+91-22-26543210').valid).toBe(true);
    expect(validatePhone('(555) 123-4567').valid).toBe(true);
    expect(validatePhone('+1 415 555 2671').valid).toBe(true);
    expect(validatePhone('2026-11-27').valid).toBe(false);

    const text = 'Primary: +91 98765 43210, Backup: 9876543210, Date: 2026-11-27';
    const detections = detectPII(text).filter((d) => d.category === 'phone');
    expect(detections).toHaveLength(2);
    expect(detections[0].value).toBe('+91 98765 43210');
    expect(detections[1].value).toBe('9876543210');
  });

  it('validates IPv4 addresses and strictly rejects octets outside 0-255', () => {
    expect(validateIPv4('192.168.1.1').valid).toBe(true);
    expect(validateIPv4('0.0.0.0').valid).toBe(true);
    expect(validateIPv4('255.255.255.255').valid).toBe(true);

    expect(validateIPv4('192.168.1.256').valid).toBe(false);
    expect(validateIPv4('999.10.10.10').valid).toBe(false);
    expect(validateIPv4('192.168.01.1').valid).toBe(false);
    expect(validateIPv4('192.168.1').valid).toBe(false);

    const text = 'Allowed 10.0.0.42; invalid 192.168.1.999 and 1.2.3.4.5';
    const detections = detectPII(text).filter((d) => d.category === 'ipv4');
    expect(detections).toHaveLength(1);
    expect(detections[0].value).toBe('10.0.0.42');
  });

  it('validates Indian PAN format and ignores partial-masked PAN output', () => {
    expect(validatePAN('ABCDE1234F').valid).toBe(true);
    expect(validatePAN('abcde1234f').valid).toBe(false);
    expect(validatePAN('ABCD1234F').valid).toBe(false);
    expect(validatePAN('XXXXX1234F').valid).toBe(false);

    const detections = detectPII('PAN: ABCDE1234F, invalid: ABCD1234F');
    expect(detections.filter((d) => d.category === 'pan')).toHaveLength(1);
  });

  it('validates Indian Aadhaar number formats', () => {
    expect(validateAadhaar('2345 6789 0123').valid).toBe(true);
    expect(validateAadhaar('2345-6789-0123').valid).toBe(true);
    expect(validateAadhaar('234567890123').valid).toBe(true);

    expect(validateAadhaar('0123 4567 8901').valid).toBe(false);
    expect(validateAadhaar('1234 5678 9012').valid).toBe(false);
    expect(validateAadhaar('2222 2222 2222').valid).toBe(false);
    expect(validateAadhaar('2345 6789 012').valid).toBe(false);
  });

  it('enforces Luhn checksum for credit/debit cards and rejects random 16-digit numbers', () => {
    // Valid Luhn numbers (synthetic)
    expect(validateLuhn('4532-1234-5678-9014').valid).toBe(true);
    expect(validateLuhn('4242424242424242').valid).toBe(true);
    expect(validateLuhn('4111-1111-1111-1111').valid).toBe(true);
    expect(validateLuhn('3782 822463 10005').valid).toBe(true);

    // Random 16-digit numbers failing Luhn
    expect(validateLuhn('4532-1234-5678-9010').valid).toBe(false);
    expect(validateLuhn('1234567890123456').valid).toBe(false);
    expect(validateLuhn('4111-1111-1111-1112').valid).toBe(false);
    expect(validateLuhn('9999-8888-7777-6666').valid).toBe(false);

    const text = 'Card: 4532-1234-5678-9014 | OrderRef: 4532-1234-5678-9010 | Bad: 1234567890123456';
    const cards = detectPII(text).filter((d) => d.category === 'credit_card');
    expect(cards).toHaveLength(1);
    expect(cards[0].value).toBe('4532-1234-5678-9014');
  });

  it('resolves overlapping detection candidates deterministically and keeps accurate offsets', () => {
    const text = 'Email john.9876543210@example.com and 9876543210@example.com';
    const detections = detectPII(text);
    expect(detections).toHaveLength(2);
    expect(detections.every((d) => d.category === 'email')).toBe(true);
    expect(text.slice(detections[0].start, detections[0].end)).toBe('john.9876543210@example.com');
    expect(text.slice(detections[1].start, detections[1].end)).toBe('9876543210@example.com');
  });
});

describe('Three Redaction Modes & Multi-Category Processing', () => {
  const multiDoc = [
    'User1: john@example.com',
    'User2: jane@example.com',
    'Repeat1: john@example.com',
    'Phone: 9876543210',
    'IP: 192.168.1.44',
    'PAN: ABCDE1234F',
    'Aadhaar: 2345 6789 0123',
    'Card: 4532-1234-5678-1112',
  ].join('\n');

  // Verify 4532123456781112 Luhn or use 4242-4242-4242-4242
  const validMultiDoc = multiDoc.replace('4532-1234-5678-1112', '4532-1234-5678-9014');

  it('applies Full Mask mode cleanly with zero residual PII', () => {
    const result = processDocument({
      text: validMultiDoc,
      fileType: 'txt',
      mode: REDACTION_MODES.FULL,
    });
    expect(result.stats.totalDetections).toBe(8);
    expect(result.stats.uniqueCategories).toBe(6);
    expect(result.stats.remainingEntities).toBe(0);
    expect(result.sanitizedText).toContain('[REDACTED]');
    expect(result.sanitizedText).not.toContain('john@example.com');
    expect(result.sanitizedText).not.toContain('ABCDE1234F');
  });

  it('applies Partial Mask mode preserving expected verification context', () => {
    const result = processDocument({
      text: validMultiDoc,
      fileType: 'txt',
      mode: REDACTION_MODES.PARTIAL,
    });
    expect(result.sanitizedText).toContain('j***@example.com');
    expect(result.sanitizedText).toContain('XXXXXX3210');
    expect(result.sanitizedText).toContain('192.168.1.xxx');
    expect(result.sanitizedText).toContain('XXXXX1234F');
    expect(result.sanitizedText).toContain('XXXX-XXXX-0123');
    expect(result.sanitizedText).toContain('XXXX-XXXX-XXXX-9014');
    expect(result.stats.remainingEntities).toBe(0);
  });

  it('applies Consistent Pseudonymization across repeated entities and separate namespaces', () => {
    const result = processDocument({
      text: validMultiDoc,
      fileType: 'txt',
      mode: REDACTION_MODES.PSEUDONYMIZE,
    });
    expect(result.sanitizedText).toContain('User1: USER_01');
    expect(result.sanitizedText).toContain('User2: USER_02');
    expect(result.sanitizedText).toContain('Repeat1: USER_01');
    expect(result.sanitizedText).toContain('Phone: PHONE_01');
    expect(result.sanitizedText).toContain('IP: IP_01');
    expect(result.sanitizedText).toContain('PAN: PAN_01');
    expect(result.sanitizedText).toContain('Aadhaar: AADHAAR_01');
    expect(result.sanitizedText).toContain('Card: CARD_01');
    expect(result.stats.remainingEntities).toBe(0);
  });

  it('handles empty input and large text input reliably', () => {
    const empty = processDocument({ text: '', fileType: 'txt', mode: REDACTION_MODES.FULL });
    expect(empty.stats.totalDetections).toBe(0);
    expect(empty.sanitizedText).toBe('');

    const block = 'Log entry from 10.20.30.40 user@example.com PAN ABCDE1234F\n';
    const largeText = block.repeat(1500);
    const largeResult = sanitizeText(largeText, null, REDACTION_MODES.PSEUDONYMIZE);
    expect(largeResult.detections).toHaveLength(4500);
    expect(largeResult.remainingCount).toBe(0);
  });
});
