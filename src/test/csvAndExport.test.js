import { afterEach, describe, expect, it, vi } from 'vitest';
import { REDACTION_MODES } from '../engine/constants.js';
import { parseCSV, processCSVDocument } from '../engine/csvProcessor.js';
import { buildPrivacySafeAuditReport, processDocument } from '../engine/processor.js';
import {
  buildAuditFilename,
  buildSanitizedFilename,
  exportAuditSummary,
  exportSanitizedDocument,
  getSafeFilenameStem,
} from '../utils/exportHandler.js';
import { loadLocalFile } from '../utils/fileHandler.js';

describe('CSV Processing & Structure Preservation', () => {
  it('preserves quoted commas and sanitizes PII inside quoted cells', () => {
    const csv = [
      'id,name,email,notes',
      '1,"Mehta, Aarav",aarav@example.com,"Contact +91 98765 43210, urgent"',
      '2,"Nair, Priya",priya@example.com,"No phone, ref 999"',
    ].join('\n');

    const result = processCSVDocument(csv, REDACTION_MODES.PSEUDONYMIZE);
    expect(result.rowCount).toBe(3);
    expect(result.columnCount).toBe(4);
    expect(result.remainingCount).toBe(0);

    const parsedOut = parseCSV(result.sanitizedText);
    expect(parsedOut.rows).toHaveLength(3);
    expect(parsedOut.rows[1][1].raw).toBe('Mehta, Aarav');
    expect(parsedOut.rows[1][2].raw).toBe('USER_01');
    expect(parsedOut.rows[1][3].raw).toBe('Contact PHONE_01, urgent');
    expect(parsedOut.rows[2][2].raw).toBe('USER_02');
  });

  it('preserves embedded newlines inside quoted CSV cells', () => {
    const csv = `id,customer,details\n1,"Sharma, Dev","Email: dev@example.com\nPAN: ABCDE1234F\nAadhaar: 2345 6789 0123"\n2,"Test, User","Repeat: dev@example.com"`;

    const result = processCSVDocument(csv, REDACTION_MODES.PSEUDONYMIZE);
    expect(result.rowCount).toBe(3);
    expect(result.remainingCount).toBe(0);

    const parsedOut = parseCSV(result.sanitizedText);
    expect(parsedOut.rows).toHaveLength(3);
    expect(parsedOut.rows[1][2].raw).toBe('Email: USER_01\nPAN: PAN_01\nAadhaar: AADHAAR_01');
    expect(parsedOut.rows[2][2].raw).toBe('Repeat: USER_01');
  });
});

describe('File Handling, Export & Privacy-Safe Audit Summary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unsupported file types and accepts valid TXT/CSV files', async () => {
    const badFile = new File(['%PDF-1.4'], 'report.pdf', { type: 'application/pdf' });
    await expect(loadLocalFile(badFile)).rejects.toThrow(/Unsupported file type/i);

    const goodCsv = new File(['email\njohn@example.com'], 'users.csv', { type: 'text/csv' });
    const loaded = await loadLocalFile(goodCsv);
    expect(loaded.fileType).toBe('csv');
    expect(loaded.fileName).toBe('users.csv');
    expect(loaded.text).toContain('john@example.com');
  });

  it('exports benign TXT and CSV files with _sanitized filenames via Blob API', () => {
    // Benign filenames that use only allow-listed words keep their stems
    expect(buildSanitizedFilename('tickets.txt', 'txt')).toBe('tickets_sanitized.txt');
    expect(buildSanitizedFilename('customers.csv', 'csv')).toBe('customers_sanitized.csv');
    expect(buildSanitizedFilename('support_logs.txt', 'txt')).toBe('support_logs_sanitized.txt');

    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const txtExport = exportSanitizedDocument('Hello [REDACTED]', 'logs.txt', 'txt');
    expect(txtExport.filename).toBe('logs_sanitized.txt');
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const csvExport = exportSanitizedDocument('id,email\n1,USER_01', 'users.csv', 'csv');
    expect(csvExport.filename).toBe('users_sanitized.csv');
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('never exposes original PII values or raw filenames in audit summary reports', () => {
    const processed = processDocument({
      text: 'Secret: john@example.com PAN ABCDE1234F Card 4532-1234-5678-9014',
      fileType: 'txt',
      mode: REDACTION_MODES.PSEUDONYMIZE,
    });

    const audit = buildPrivacySafeAuditReport({
      stats: processed.stats,
      detections: processed.detections,
      hasSourceFile: true,
    });

    const serialized = JSON.stringify(audit);
    // No raw PII values or replacements
    expect(serialized).not.toContain('john@example.com');
    expect(serialized).not.toContain('ABCDE1234F');
    expect(serialized).not.toContain('4532-1234-5678-9014');
    expect(serialized).not.toContain('USER_01');
    // No raw filename field at all
    expect(audit.source).not.toHaveProperty('fileName');
    // Uses anonymous source label
    expect(audit.source.sourceLabel).toBe('uploaded-txt-file');
    expect(audit.source.inputOrigin).toBe('local-file-upload');
    expect(audit.summary.totalEntitiesDetected).toBe(3);
    expect(audit.categoryCounts.email).toBe(1);
    expect(audit.categoryCounts.pan).toBe(1);
    expect(audit.categoryCounts.credit_card).toBe(1);
  });

  it('audit report uses direct-text-input label when no file was uploaded', () => {
    const processed = processDocument({
      text: 'Some safe text with no PII',
      fileType: 'txt',
      mode: REDACTION_MODES.FULL,
    });

    const audit = buildPrivacySafeAuditReport({
      stats: processed.stats,
      detections: processed.detections,
      hasSourceFile: false,
    });

    expect(audit.source.sourceLabel).toBe('direct-text-input');
    expect(audit.source.inputOrigin).toBe('direct-text-input');
    expect(audit.source).not.toHaveProperty('fileName');
  });
});

describe('Filename Privacy: PII-containing and unstructured-name filenames', () => {
  it('anonymizes filenames containing structured PII (email, phone, PAN)', () => {
    // Email in filename
    expect(getSafeFilenameStem('john@example.com.csv')).toBeNull();
    expect(buildSanitizedFilename('john@example.com.csv', 'csv')).toBe(
      'privacyforge_sanitized.csv'
    );
    expect(buildAuditFilename('john@example.com.txt')).toBe('privacyforge_audit_summary.json');

    // Phone number in filename
    expect(getSafeFilenameStem('9876543210_log.txt')).toBeNull();
    expect(buildSanitizedFilename('9876543210_log.txt', 'txt')).toBe(
      'privacyforge_sanitized.txt'
    );

    // PAN in filename (uppercase)
    expect(getSafeFilenameStem('ABCDE1234F_kyc.csv')).toBeNull();
    expect(buildSanitizedFilename('ABCDE1234F_kyc.csv', 'csv')).toBe(
      'privacyforge_sanitized.csv'
    );
  });

  it('anonymizes filenames containing unknown personal or company names', () => {
    // Personal names are not in the allow-list
    expect(getSafeFilenameStem('alice_smith_kyc.csv')).toBeNull();
    expect(buildSanitizedFilename('alice_smith_kyc.csv', 'csv')).toBe(
      'privacyforge_sanitized.csv'
    );

    expect(getSafeFilenameStem('rahul_sharma.txt')).toBeNull();
    expect(buildSanitizedFilename('rahul_sharma.txt', 'txt')).toBe(
      'privacyforge_sanitized.txt'
    );

    expect(getSafeFilenameStem('CompanyXYZ_internal.csv')).toBeNull();
    expect(buildAuditFilename('CompanyXYZ_internal.csv')).toBe('privacyforge_audit_summary.json');
  });

  it('preserves benign, generic filenames that use only allow-listed words', () => {
    expect(getSafeFilenameStem('tickets.txt')).toBe('tickets');
    expect(getSafeFilenameStem('customers.csv')).toBe('customers');
    expect(getSafeFilenameStem('support_logs.txt')).toBe('support_logs');
    expect(getSafeFilenameStem('incident-report.csv')).toBe('incident_report');
    expect(getSafeFilenameStem('export_v2.csv')).toBe('export_v2');
    expect(getSafeFilenameStem('audit_summary.txt')).toBe('audit_summary');

    expect(buildSanitizedFilename('incident-report.csv', 'csv')).toBe(
      'incident_report_sanitized.csv'
    );
    expect(buildAuditFilename('support_logs.txt')).toBe('support_logs_audit_summary.json');
  });

  it('falls back to anonymous filename for edge cases', () => {
    // Empty or missing filename
    expect(buildSanitizedFilename('', 'txt')).toBe('privacyforge_sanitized.txt');
    expect(buildSanitizedFilename(undefined, 'csv')).toBe('privacyforge_sanitized.csv');
    expect(buildAuditFilename('')).toBe('privacyforge_audit_summary.json');

    // Filename with special characters
    expect(getSafeFilenameStem('report (copy).txt')).toBeNull();
    expect(buildSanitizedFilename('report (copy).txt', 'txt')).toBe(
      'privacyforge_sanitized.txt'
    );

    // Filename with @ (email-like but not caught by PII regex)
    expect(getSafeFilenameStem('info@acme.txt')).toBeNull();
  });

  it('preserves correct file extensions regardless of anonymization', () => {
    // PII filename => anonymous but correct extension
    expect(buildSanitizedFilename('alice_smith.txt', 'txt')).toMatch(/\.txt$/);
    expect(buildSanitizedFilename('alice_smith.csv', 'csv')).toMatch(/\.csv$/);
    expect(buildAuditFilename('alice_smith.csv')).toMatch(/\.json$/);

    // Benign filename => preserved stem + correct extension
    expect(buildSanitizedFilename('export.csv', 'csv')).toBe('export_sanitized.csv');
    expect(buildSanitizedFilename('logs.txt', 'txt')).toBe('logs_sanitized.txt');
  });
});
