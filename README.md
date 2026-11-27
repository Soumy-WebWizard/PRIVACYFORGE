# PrivacyForge

> **Your data. Your browser. Zero exposure.**

A privacy-first, client-side PII detection and data sanitization platform built for the **PromptWars** cybersecurity and data privacy innovation competition.

---

## Project Overview

Organizations, engineers, and support teams frequently paste logs, customer support tickets, resumes, and CSV exports into external tools or share them across teams—inadvertently exposing personally identifiable information (PII) and financial identifiers.

**PrivacyForge** solves this by detecting, classifying, inspecting, and sanitizing sensitive entities **entirely inside the user's browser memory** using deterministic JavaScript validators, an RFC 4180 structure-preserving CSV processor, and client-side Blob exports.

---

## Problem Statement

Sharing raw operational text logs, support tickets, or tabular customer exports introduces security, privacy, and compliance risks when emails, phone numbers, IP addresses, national IDs (PAN, Aadhaar), and payment card numbers remain unredacted. Server-side or LLM-based redaction tools require transmitting the sensitive document to a third-party backend—creating an exposure vector before sanitization even happens.

PrivacyForge eliminates server-side document ingestion: the document never leaves the browser tab.

---

## Features

### 1. Six Mandatory PII Categories with Validation
- **Email Addresses**: RFC-aligned local/domain validation (rejects malformed patterns like `user@.com`, `@domain.com`, `user..name@domain.com`).
- **Phone Numbers**: Supports Indian mobile (`+91 98765 43210`, `09876543210`, `9876543210`), Indian STD landlines (`+91-22-26543210`), and international formats (`(555) 123-4567`, `+1 415 555 2671`), while ignoring dates.
- **IPv4 Addresses**: Strict dotted-quad validation rejecting octets outside `0–255` and leading-zero artifacts.
- **Indian PAN Numbers**: Validates structural `[A-Z]{5}[0-9]{4}[A-Z]` format with token boundaries.
- **Indian Aadhaar Formats**: Validates 12-digit UIDAI structural format (`2–9` leading digit, spaced/hyphenated/contiguous) while rejecting repeated-digit placeholders.
- **Credit / Debit Card Numbers**: Enforces **Luhn checksum validation** (13–19 digits); random 16-digit numbers that fail Luhn are not classified as card numbers.

> **Verification Disclaimer**: Format matching for Indian PAN and Aadhaar validates structural conformance only and does **not** establish whether an identifier is genuine or belongs to a real individual.

### 2. Three Selectable Redaction Modes
- **Full Mask**: Replaces each entity with `[REDACTED]`.
- **Partial Mask**: Preserves minimal context for human verification (`j***@example.com`, `XXXXXX3210`, `XXXX-XXXX-XXXX-1111`, `XXXX-XXXX-0123`, `XXXXX1234F`, `192.168.1.xxx`).
- **Consistent Pseudonymization**: Deterministically maps repeated occurrences of the same entity to the same in-memory placeholder within a run (`USER_01`, `USER_02`, `PHONE_01`, `IP_01`, `PAN_01`, `AADHAAR_01`, `CARD_01`).

### 3. Structure-Preserving TXT & CSV Handling
- Reads local `.txt` and `.csv` files via the browser **File API** (recommended `<= 2 MB`, hard cap `10 MB`).
- Parses RFC 4180 CSV cell-by-cell—preserving rows, columns, delimiters (`,`, `;`, `\t`, `|`), quoted commas, escaped quotes (`""`), and **embedded newlines** inside quoted cells.
- Shares a single in-memory pseudonym map across all rows/columns of a CSV document.
- Exports sanitized files (`<name>_sanitized.txt` / `<name>_sanitized.csv`) using the browser **Blob API**.

### 4. Live Side-by-Side Comparison & Privacy-Safe Audit Summary
- Live side-by-side **Original (inline highlighted)** vs **Sanitized** preview (plus a CSV Grid table view).
- Safe React text rendering—never uses `dangerouslySetInnerHTML` or `eval()`.
- Filterable **Detection Inspector** with category badges, exact character offsets, and CSV row/column coordinates.
- Optional **Audit Summary (`.json`)** export containing **only** category counts, match positions, and run metadata—never raw PII values or replacements.

---

## Architecture

```text
src/
├── components/
│   ├── Header.jsx              # Branding, local-processing indicator, workspace reset
│   ├── Hero.jsx                # Overview & synthetic sample loaders
│   ├── ModeSelector.jsx        # Redaction mode & TXT/CSV parser switcher
│   ├── StatsPanel.jsx          # Live metrics & 6-category breakdown dashboard
│   ├── InputPanel.jsx          # File API drag-and-drop upload & editor
│   ├── OutputPanel.jsx         # Safe React highlighting, side-by-side preview & Blob export
│   ├── DetectionInspector.jsx  # Filterable entity table with offsets & reveal toggle
│   ├── PrivacyInfoSection.jsx  # Privacy model & format disclaimer
│   └── Footer.jsx              # Competition & static-app footer
├── engine/
│   ├── constants.js            # Category metadata, priorities, mode definitions
│   ├── validator.js            # Luhn, IPv4 octet, email, phone, PAN, Aadhaar validators
│   ├── detectors.js            # Pattern extraction & deterministic overlap resolution
│   ├── sanitizer.js            # Full, Partial, and in-memory Pseudonymization engine
│   ├── csvProcessor.js         # RFC 4180 parser/serializer with offset mapping
│   └── processor.js            # Unified pipeline & privacy-safe audit summary builder
├── utils/
│   ├── fileHandler.js          # Browser File API validation & reading
│   ├── exportHandler.js        # Browser Blob API downloads
│   └── sampleData.js           # 100% synthetic demonstration payloads
├── test/
│   ├── setup.js                # Testing Library setup
│   ├── engine.test.js          # Validators, detectors, overlap, modes, large-text tests
│   ├── csvAndExport.test.js    # Quoted CSV, embedded newlines, Blob export, audit privacy
│   └── app.test.jsx            # UI integration & XSS resistance tests
├── App.jsx
├── App.css
└── main.jsx
```

---

## Privacy Model

- **Static Asset Delivery vs. Document Processing**: When a user visits the deployed site, the browser downloads static frontend assets (HTML, JavaScript, CSS) from the hosting CDN (e.g., Vercel). Once loaded, **zero document contents, detections, or mappings are transmitted over the network**.
- **Strict Client-Side Execution**: `vercel.json` configures `Content-Security-Policy: ... connect-src 'none'` to enforce at the browser level that the application cannot make outbound `fetch`, `XHR`, or `WebSocket` requests.
- **Volatile Browser Memory Only**: Pseudonymization `Map` instances exist only in memory for the current sanitization run and are discarded on reset/tab close.
- **No Persistent Storage or Logging**: Nothing is written to `localStorage`, `sessionStorage`, IndexedDB, cookies, or `console.log`.

---

## Technology Stack

- **React 18** + **Vite 6** (JavaScript / ESM)
- **Tailwind CSS 3**
- **Lucide React** icons
- **Browser File API** & **Blob API**
- **Vitest** + **React Testing Library** + **jsdom**
- **Vercel** static hosting

---

## Local Installation

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

---

## Usage Instructions

1. Paste raw text into the editor, upload a `.txt` or `.csv` file, or click **Support Ticket (TXT)** / **Customer Export (CSV)** to load synthetic test data.
2. Choose a redaction mode (**Full Mask**, **Partial Mask**, or **Consistent Pseudonymization**).
3. Inspect highlighted matches in the **Original Document** pane alongside the **Sanitized Document Output** (or toggle **CSV Grid** for tabular inspection).
4. Review category counts and match offsets in the **Six-Category Breakdown** and **Detection Inspector**.
5. Click **Download Sanitized TXT/CSV** to export via the Blob API, or **Audit Summary (.json)** for a PII-free compliance report.

---

## Testing Instructions

```bash
# Run full unit + CSV + export + React UI test suite
npm test

# Build production bundle
npm run build
```

---

## Deployment Instructions (Vercel & GitHub)

1. Push this repository to GitHub.
2. In **Vercel**, import the GitHub repository:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: None required.
3. `vercel.json` is preconfigured with security headers (`Content-Security-Policy` with `connect-src 'none'`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`).

---

## Limitations & Future Improvements

- **Pattern-Based Detection**: Deterministic regex + mathematical validation cannot detect unstructured free-form PII such as person names, physical street addresses, or contextual medical notes without an on-device NER model.
- **Format vs. Issuance**: PAN and Aadhaar detectors validate format rules only and cannot verify whether an identifier is real or active.
- **File Size**: Very large files (> 10 MB) are blocked to keep single-thread browser rendering responsive; future versions can offload detection to a **Web Worker** for streaming multi-megabyte datasets.
- **Additional Formats**: Support for `.json`, `.log`, and `.ndjson` structured redaction pipelines can be added in future iterations.
