import { afterEach, describe, expect, it, vi } from 'vitest';
import { REDACTION_MODES } from '../engine/constants.js';
import { parseCSV, processCSVDocument } from '../engine/csvProcessor.js';
import { buildPrivacySafeAuditReport, processDocument } from '../engine/processor.js';
import {
  buildSanitizedFilename,
  exportSanitizedDocument,
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

  it('exports TXT and CSV files with proper _sanitized filenames via Blob API', () => {
    expect(buildSanitizedFilename('tickets.txt', 'txt')).toBe('tickets_sanitized.txt');
    expect(buildSanitizedFilename('customers.csv', 'csv')).toBe('customers_sanitized.csv');

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

  it('never exposes original PII values in downloadable audit summary reports', () => {
    const processed = processDocument({
      text: 'Secret: john@example.com PAN ABCDE1234F Card 4532-1234-5678-9014',
      fileType: 'txt',
      mode: REDACTION_MODES.PSEUDONYMIZE,
    });

    const audit = buildPrivacySafeAuditReport({
      stats: processed.stats,
      detections: processed.detections,
      fileName: 'incident.txt',
    });

    const serialized = JSON.stringify(audit);
    expect(serialized).not.toContain('john@example.com');
    expect(serialized).not.toContain('ABCDE1234F');
    expect(serialized).not.toContain('4532-1234-5678-9014');
    expect(serialized).not.toContain('USER_01');
    expect(audit.summary.totalEntitiesDetected).toBe(3);
    expect(audit.categoryCounts.email).toBe(1);
    expect(audit.categoryCounts.pan).toBe(1);
    expect(audit.categoryCounts.credit_card).toBe(1);
  });
});
