import { MAX_HARD_SIZE_BYTES, MAX_RECOMMENDED_SIZE_BYTES } from '../engine/constants.js';

const SUPPORTED_EXTENSIONS = new Set(['txt', 'csv']);
const ALLOWED_MIME_TYPES = new Set([
  '',
  'text/plain',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/comma-separated-values',
]);

export function getFileExtension(fileName = '') {
  const idx = fileName.lastIndexOf('.');
  if (idx === -1 || idx === fileName.length - 1) return '';
  return fileName.slice(idx + 1).toLowerCase();
}

export function readFileContent(file) {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read the selected file locally.'));
    reader.readAsText(file);
  });
}

/**
 * Validates and reads a local .txt or .csv file via the Browser File API.
 */
export async function loadLocalFile(file) {
  if (!file) {
    throw new Error('No file was provided.');
  }

  const ext = getFileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported file type "${ext ? `.${ext}` : 'unknown'}". Only .txt and .csv files are supported.`
    );
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported MIME type "${file.type}". Please upload a valid plain-text (.txt) or CSV (.csv) file.`
    );
  }

  if (file.size > MAX_HARD_SIZE_BYTES) {
    throw new Error(
      `File exceeds the 10 MB browser safety limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please split the file before processing.`
    );
  }

  const warnings = [];
  if (file.size > MAX_RECOMMENDED_SIZE_BYTES) {
    warnings.push(
      `Large file (${(file.size / (1024 * 1024)).toFixed(2)} MB): live detection may take slightly longer in browser memory.`
    );
  }

  const text = await readFileContent(file);

  if (text.includes('\u0000')) {
    throw new Error(
      'Malformed file: binary null bytes detected. Please upload a UTF-8 plain text or CSV file.'
    );
  }

  return {
    text,
    fileName: file.name,
    fileType: ext,
    fileSize: file.size,
    warnings,
  };
}
