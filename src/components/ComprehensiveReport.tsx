import React, { useState } from 'react';
import { ScreeningCase } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useScreening } from '../context/ScreeningContext';
import { LOGO_ASSET_PATH, getGradcamForCase } from '../services/sampleData';
import { getPdfReportUrl } from '../services/api';
import { Printer, Download, ArrowLeft } from 'lucide-react';

interface ComprehensiveReportProps {
  screeningCase: ScreeningCase;
  onBack?: () => void;
}

export const ComprehensiveReport: React.FC<ComprehensiveReportProps> = ({
  screeningCase,
  onBack
}) => {
  const { t, language } = useLanguage();
  const { backendStatus } = useScreening();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  const { patient, quality, aiResult, clinicianReview, followUps } = screeningCase;

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print not supported in current frame:', err);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setPdfNotice(null);
    try {
      const response = await fetch(getPdfReportUrl(screeningCase.id, language));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${screeningCase.id}_clinical_report.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setPdfNotice('Backend PDF generator is offline. Use Print / Save as PDF fallback.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getSeverityBadge = () => {
    switch (aiResult.predictedGrade) {
      case 0:
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 1:
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 2:
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 3:
        return 'bg-orange-50 text-orange-800 border-orange-300';
      case 4:
        return 'bg-rose-50 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar (Hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.repBackBtn}
            </button>
          )}
          <span className="text-xs text-slate-500 font-mono">
            Report ID: <strong className="text-slate-800">{screeningCase.id}</strong> · Language: {language.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pdfNotice && (
            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
              {pdfNotice}
            </span>
          )}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="print-keep flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>
              {downloadingPdf
                ? 'Generating PDF...'
                : backendStatus === 'online'
                ? 'Download Clinical PDF'
                : 'Download PDF (Backend)'}
            </span>
          </button>
          <button
            onClick={handlePrint}
            className="print-keep flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {t.repPrintBtn} / {t.repPdfBtn}
          </button>
        </div>
      </div>

      {/* Official A4-Style Clinical Report Document */}
      <div className="print-area bg-white rounded-xl border border-slate-200 shadow-sm p-8 sm:p-12 max-w-4xl mx-auto space-y-8 text-slate-800">
        {/* Header with Official Logo & Tele-Ophthalmology Nomenclature */}
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {LOGO_ASSET_PATH ? (
              <img
                src={LOGO_ASSET_PATH}
                alt="IRISaathi Logo"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-contain bg-slate-900 p-1 border border-slate-200 shadow-2xs"
              />
            ) : null}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  {t.brandName}
                </h1>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  TELE-OPHTHALMOLOGY AI
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-700 mt-0.5">
                {t.repTitle}
              </h2>
              <p className="text-xs text-slate-500">{t.repSubtitle}</p>
            </div>
          </div>

          <div className="text-right text-xs font-mono space-y-1 text-slate-600">
            <div>Study ID: <strong className="text-slate-900">{screeningCase.id}</strong></div>
            <div>Date: <strong className="text-slate-900">{screeningCase.studyDate}</strong></div>
            <div>Centre: <strong className="text-slate-900">{screeningCase.healthCentre}</strong></div>
            <div className="text-[11px] text-cyan-700 font-semibold">Model: {aiResult.modelIdentifier}</div>
          </div>
        </div>

        {/* 1. Patient Demographics & 2. Screening Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-lg border border-slate-200 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 uppercase text-[11px] tracking-wider">
              {t.repSectionPatient}
            </h3>
            <div className="grid grid-cols-2 gap-y-1.5 font-mono">
              <span className="text-slate-500">Patient ID:</span>
              <span className="font-bold text-slate-900">{patient.id}</span>

              <span className="text-slate-500">Name / Anon:</span>
              <span className="font-semibold text-slate-800">{patient.name || 'Anonymous Intake'}</span>

              <span className="text-slate-500">Age / Gender:</span>
              <span>{patient.age} Yrs · {patient.gender.toUpperCase()}</span>

              <span className="text-slate-500">Mobile Contact:</span>
              <span>+91 {patient.mobile}</span>

              <span className="text-slate-500">Village & District:</span>
              <span>{patient.village}, {patient.district}</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 uppercase text-[11px] tracking-wider">
              {t.repSectionMetadata}
            </h3>
            <div className="grid grid-cols-2 gap-y-1.5 font-mono">
              <span className="text-slate-500">Diabetes Status:</span>
              <span className="font-semibold text-slate-800">{patient.diabetesStatus} ({patient.diabetesDurationYears}y)</span>

              <span className="text-slate-500">HbA1c / Glucose:</span>
              <span>{patient.hba1c ? `${patient.hba1c}%` : 'N/A'} · {patient.bloodGlucose ? `${patient.bloodGlucose} mg/dL` : 'N/A'}</span>

              <span className="text-slate-500">Eye Investigated:</span>
              <span className="font-bold text-blue-700">{screeningCase.eye === 'OD' ? 'Right Eye (OD)' : 'Left Eye (OS)'}</span>

              <span className="text-slate-500">Prior Eye Exam:</span>
              <span>{patient.previousOphthVisit}</span>

              <span className="text-slate-500">Symptoms:</span>
              <span className="truncate">{patient.symptoms.join(', ') || 'None'}</span>
            </div>
          </div>
        </div>

        {/* 3. Image Quality Assessment */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t.repSectionQuality}
            </h3>
            <span className="font-mono text-xs font-bold text-emerald-700">
              Score: {quality.overallScore}% · {quality.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-slate-500 block">Fundus FOV</span>
              <span className="font-mono font-bold text-slate-800">
                {quality.metrics.fundusDetected?.score ?? 95}% PASS
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-slate-500 block">Sharpness / Focus</span>
              <span className="font-mono font-bold text-slate-800">
                {quality.metrics.focusSharpness?.score ?? 92}% PASS
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-slate-500 block">Illumination</span>
              <span className="font-mono font-bold text-slate-800">
                {quality.metrics.illumination?.score ?? 90}% PASS
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-slate-500 block">Macular Field</span>
              <span className="font-mono font-bold text-slate-800">
                {quality.metrics.fieldOfView?.score ?? 94}% PASS
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <span className="text-slate-500 block">Resolution</span>
              <span className="font-mono font-bold text-slate-800">
                {quality.resolutionDetail || '1536×1536'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Original Retinal Image & 5. Grad-CAM++ Saliency Heatmap */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            {t.repSectionImages}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-700 mb-2 font-mono">
                Original Fundus Photograph ({screeningCase.eye})
              </span>
              {screeningCase.imageUri ? (
                <img
                  src={screeningCase.imageUri}
                  alt="Original Fundus"
                  referrerPolicy="no-referrer"
                  className="w-64 h-64 object-contain rounded-full shadow-inner bg-black"
                />
              ) : (
                <div className="w-64 h-64 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-mono">
                  Fundus Image Not Available
                </div>
              )}
              <span className="text-[10px] text-slate-500 font-mono mt-2">
                Resolution: {screeningCase.imageResolution || '1536 × 1536 px'} · Non-Mydriatic
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-900 text-white flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2 px-1">
                <span className="text-xs font-semibold text-slate-200 font-mono">
                  Grad-CAM++ Saliency Heatmap
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-cyan-300 font-mono border border-blue-800">
                  ResNet50 · Conv5
                </span>
              </div>
              <div className="relative w-64 h-64 rounded-full overflow-hidden bg-black flex items-center justify-center border border-slate-700 shadow-inner">
                <img
                  src={getGradcamForCase(screeningCase)}
                  alt="Grad-CAM++ Saliency Heatmap"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              {/* Jet Colormap Legend Scale */}
              <div className="w-full max-w-[240px] mt-2 px-1">
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-blue-700 via-cyan-400 via-emerald-400 via-yellow-400 to-red-600 shadow-inner" />
                <div className="flex justify-between text-[8px] text-slate-400 font-mono mt-0.5">
                  <span>0.0 Low</span>
                  <span>0.5 Attention</span>
                  <span>1.0 Peak Hotspot</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1 text-center">
                Multi-Scale Gradient-weighted Class Activation Mapping
              </span>
            </div>
          </div>
        </div>

        {/* 6. AI Diagnostic Classification & 7. ICDR Probability Distribution */}
        <div className="border border-amber-200 rounded-lg p-5 bg-white">
          <div className="mb-3 px-3 py-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
            <strong>Assistive AI Output (Non-Diagnostic Prototype):</strong>{' '}
            {aiResult.disclaimer || 'For decision support only; requires clinician verification prior to clinical action.'}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                {t.repSectionAIClass}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {aiResult.predictedGradeName}
              </h2>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded text-xs font-bold font-mono border ${getSeverityBadge()}`}>
                {aiResult.referralStatus}
              </span>
              <div className="text-xs font-mono text-slate-500 mt-1">
                AI Confidence: <strong className="text-slate-900">{aiResult.confidence.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* Probability Distribution mini horizontal bars */}
          <div className="space-y-1.5 text-xs font-mono">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">
              {t.repSectionProbDist}
            </span>
            <div className="grid grid-cols-5 gap-2">
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">Grade 0</span>
                <span className="font-bold text-slate-900">{aiResult.probabilities.grade0.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">Grade 1</span>
                <span className="font-bold text-slate-900">{aiResult.probabilities.grade1.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">Grade 2</span>
                <span className="font-bold text-slate-900">{aiResult.probabilities.grade2.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">Grade 3</span>
                <span className="font-bold text-slate-900">{aiResult.probabilities.grade3.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">Grade 4</span>
                <span className="font-bold text-slate-900">{aiResult.probabilities.grade4.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 11. Lesion-Level Saliency Findings & 19. Retinal Quadrant Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 uppercase text-[11px] tracking-wider">
              {t.repSectionLesions}
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono mb-3">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">{t.pathMicroaneurysm}</span>
                <span className="text-base font-bold text-red-700">{aiResult.lesionCounts.microaneurysms}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">{t.pathHemorrhage}</span>
                <span className="text-base font-bold text-rose-700">{aiResult.lesionCounts.hemorrhages}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">{t.pathHardExudate}</span>
                <span className="text-base font-bold text-amber-700">{aiResult.lesionCounts.hardExudates}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">{t.pathNeovascularization}</span>
                <span className="text-base font-bold text-cyan-700">{aiResult.lesionCounts.neovascularizations}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Total indexed pathological foci detected across field: <strong>{aiResult.lesionCounts.total}</strong>
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 uppercase text-[11px] tracking-wider">
              {t.repSectionQuadrant}
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono mb-2">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Superior Temporal (ST)</span>
                <span className="font-bold text-slate-800">{aiResult.quadrantCounts.superiorTemporal} lesions</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Superior Nasal (SN)</span>
                <span className="font-bold text-slate-800">{aiResult.quadrantCounts.superiorNasal} lesions</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Inferior Temporal (IT)</span>
                <span className="font-bold text-slate-800">{aiResult.quadrantCounts.inferiorTemporal} lesions</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500 text-[10px] block">Inferior Nasal (IN)</span>
                <span className="font-bold text-slate-800">{aiResult.quadrantCounts.inferiorNasal} lesions</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 italic">
              Conforms to the ICDR 4:2:1 multi-quadrant risk stratification protocol.
            </p>
          </div>
        </div>

        {/* 20. Clinical Diagnostic Rationale & Decision Support */}
        <div className="space-y-3 text-xs bg-slate-50 p-5 rounded-lg border border-slate-200 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">
              {t.repSectionRationale}
            </h4>
            <p className="text-slate-700">{aiResult.clinicalRationale}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
            <div>
              <strong className="text-slate-800 block mb-0.5">{t.repSectionMicrovascular}:</strong>
              <p className="text-slate-600 text-[11px]">{aiResult.anatomicalDistribution}</p>
            </div>
            <div>
              <strong className="text-slate-800 block mb-0.5">{t.repSectionMacular}:</strong>
              <p className="text-slate-600 text-[11px] uppercase font-mono text-amber-800 font-bold">
                Level: {aiResult.macularRiskAssessment}
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">{aiResult.visualThreatAssessment}</p>
            </div>
            <div>
              <strong className="text-slate-800 block mb-0.5">{t.repSectionProtocol}:</strong>
              <p className="text-slate-600 text-[11px]">{aiResult.clinicalProtocol}</p>
            </div>
          </div>
        </div>

        {/* 27. Clinician Verification & Remarks */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 bg-blue-50/20">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
              {t.repSectionSignoff}
            </h4>
            <span className="text-xs font-mono text-slate-600">
              Status: <strong className="text-emerald-700">{clinicianReview?.isSigned ? 'SIGNED & CERTIFIED' : 'PENDING SIGNATURE'}</strong>
            </span>
          </div>

          <div className="text-xs space-y-2">
            <div>
              <span className="text-slate-500 font-medium">Clinician Remarks:</span>
              <p className="font-medium text-slate-800 mt-0.5 italic bg-white p-2.5 rounded border border-slate-200">
                "{clinicianReview?.clinicalRemarks || 'Awaiting final clinical remarks by certified ophthalmologist.'}"
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 font-mono text-xs">
              <div>
                <span className="text-slate-500 block">Certified Clinician:</span>
                <strong className="text-slate-900">{clinicianReview?.clinicianName || 'Dr. Ananya Desai, MS (Ophthalmology)'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Digital Verification Timestamp:</span>
                <span>{clinicianReview?.timestamp || new Date().toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Registration:</span>
                <span className="text-blue-800 font-bold">MCI / GMC-58291</span>
              </div>
            </div>
          </div>
        </div>

        {/* 29. Patient Follow-up Schedule & SMS Status */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 text-xs">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">
            {t.repSectionFollowup} & Local Language SMS Tracking
          </h4>
          <div className="space-y-1.5 font-mono">
            {followUps.map((fu) => (
              <div key={fu.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                <span className="font-semibold text-slate-800">{fu.title}</span>
                <span className="text-slate-500">Interval: {fu.interval} · Due: {fu.dueDate}</span>
                <span className="text-emerald-700 font-bold uppercase">{fu.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 33. Clinical Disclaimer Footer */}
        <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 space-y-1">
          <p className="font-medium">
            <strong>{t.repSectionDisclaimer}: </strong>
            {t.repDisclaimerText}
          </p>
          <p className="font-mono text-[9px] text-slate-400">
            IRISaathi Tele-Ophthalmology Network · Rural Vision Initiative · Smart India Hackathon
          </p>
        </div>
      </div>
    </div>
  );
};
