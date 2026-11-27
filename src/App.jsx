import React, { useCallback, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import ModeSelector from './components/ModeSelector.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import InputPanel from './components/InputPanel.jsx';
import OutputPanel from './components/OutputPanel.jsx';
import DetectionInspector from './components/DetectionInspector.jsx';
import PrivacyInfoSection from './components/PrivacyInfoSection.jsx';
import Footer from './components/Footer.jsx';
import { REDACTION_MODES } from './engine/constants.js';
import { buildPrivacySafeAuditReport, processDocument } from './engine/processor.js';
import { loadLocalFile } from './utils/fileHandler.js';
import { exportAuditSummary, exportSanitizedDocument } from './utils/exportHandler.js';
import './App.css';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('txt');
  const [mode, setMode] = useState(REDACTION_MODES.PSEUDONYMIZE);
  const [fileError, setFileError] = useState('');
  const [fileWarnings, setFileWarnings] = useState([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [selectedDetectionId, setSelectedDetectionId] = useState(null);

  const processed = useMemo(
    () =>
      processDocument({
        text: inputText,
        fileType,
        mode,
      }),
    [inputText, fileType, mode]
  );

  const combinedWarnings = useMemo(() => {
    const all = [...fileWarnings, ...processed.warnings];
    return Array.from(new Set(all));
  }, [fileWarnings, processed.warnings]);

  const handleTextChange = useCallback((nextText) => {
    setFileError('');
    setInputText(nextText);
    setSelectedDetectionId(null);
  }, []);

  const handleFileSelected = useCallback(async (file) => {
    setFileError('');
    setFileWarnings([]);
    try {
      const loaded = await loadLocalFile(file);
      setInputText(loaded.text);
      setFileName(loaded.fileName);
      setFileType(loaded.fileType);
      setFileWarnings(loaded.warnings);
      setActiveCategoryFilter('all');
      setSelectedDetectionId(null);
    } catch (err) {
      setFileError(err?.message || 'Unable to load the selected file.');
    }
  }, []);

  const handleLoadSample = useCallback((sample) => {
    setFileError('');
    setFileWarnings([]);
    setInputText(sample.content);
    setFileName(sample.fileName);
    setFileType(sample.fileType);
    setActiveCategoryFilter('all');
    setSelectedDetectionId(null);
  }, []);

  const handleReset = useCallback(() => {
    setInputText('');
    setFileName('');
    setFileType('txt');
    setFileError('');
    setFileWarnings([]);
    setActiveCategoryFilter('all');
    setSelectedDetectionId(null);
  }, []);

  const handleDownloadSanitized = useCallback(() => {
    if (!processed.sanitizedText && !processed.originalText) return;
    exportSanitizedDocument(processed.sanitizedText, fileName, fileType);
  }, [processed.sanitizedText, processed.originalText, fileName, fileType]);

  const handleDownloadAudit = useCallback(() => {
    if (!processed.originalText) return;
    const report = buildPrivacySafeAuditReport({
      stats: processed.stats,
      detections: processed.detections,
      fileName,
    });
    exportAuditSummary(report, fileName);
  }, [processed, fileName]);

  return (
    <div className="cyber-grid-bg flex min-h-screen flex-col bg-navy-950 text-slate-100">
      <Header onReset={handleReset} hasContent={Boolean(inputText)} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Hero onLoadSample={handleLoadSample} />

        <ModeSelector
          mode={mode}
          onModeChange={setMode}
          fileType={fileType}
          onFileTypeChange={setFileType}
        />

        <StatsPanel
          stats={processed.stats}
          activeCategoryFilter={activeCategoryFilter}
          onToggleCategoryFilter={setActiveCategoryFilter}
        />

        <InputPanel
          inputText={inputText}
          fileName={fileName}
          fileType={fileType}
          stats={processed.stats}
          error={fileError}
          warnings={combinedWarnings}
          onTextChange={handleTextChange}
          onFileSelected={handleFileSelected}
          onClear={handleReset}
        />

        <OutputPanel
          originalText={processed.originalText}
          sanitizedText={processed.sanitizedText}
          detections={processed.detections}
          fileType={fileType}
          csvData={processed.csvData}
          selectedDetectionId={selectedDetectionId}
          onSelectDetection={setSelectedDetectionId}
          onDownloadSanitized={handleDownloadSanitized}
          onDownloadAudit={handleDownloadAudit}
        />

        <DetectionInspector
          detections={processed.detections}
          activeCategoryFilter={activeCategoryFilter}
          onCategoryFilterChange={setActiveCategoryFilter}
          selectedDetectionId={selectedDetectionId}
          onSelectDetection={setSelectedDetectionId}
        />

        <PrivacyInfoSection />
      </main>

      <Footer />
    </div>
  );
}
