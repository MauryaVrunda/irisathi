import React from 'react';
import { QualityAssessment } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

interface QualityGateCardProps {
  assessment: QualityAssessment;
  onProceed: () => void;
  onRetake: () => void;
  isProcessing?: boolean;
}

export const QualityGateCard: React.FC<QualityGateCardProps> = ({
  assessment,
  onProceed,
  onRetake,
  isProcessing
}) => {
  const { t } = useLanguage();

  const getStatusBadge = () => {
    switch (assessment.status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {t.qgPassedStatus}
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {t.qgReviewStatus}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider font-mono">
            <XCircle className="w-4 h-4 text-rose-600" />
            {t.qgFailedStatus}
          </span>
        );
    }
  };

  const metricList = [
    assessment.metrics?.fundusDetected,
    assessment.metrics?.focusSharpness,
    assessment.metrics?.illumination,
    assessment.metrics?.fieldOfView,
    assessment.metrics?.resolution
  ].filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">{t.qgValidatedTitle}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t.qgSubtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">{t.qgScoreLabel}</span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {assessment.overallScore}%
            </span>
          </div>
          <div>{getStatusBadge()}</div>
        </div>
      </div>

      {/* 5-Metric Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {metricList.map((m) => {
          const isOk = m.passed === true || m.passed === 'review';
          return (
            <div
              key={m.id}
              className={`p-3.5 rounded-lg border transition-colors ${
                isOk
                  ? 'bg-slate-50/80 border-slate-200'
                  : 'bg-rose-50/60 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-semibold text-slate-800 truncate" title={m.name}>
                  {m.name}
                </span>
                {m.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-slate-500 leading-snug line-clamp-2" title={m.description}>
                {m.description}
              </div>
              <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Score</span>
                <span className="text-xs font-bold font-mono text-slate-700">{m.score}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calibration note */}
      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200/60 mb-6 leading-relaxed">
        {t.qgSharpNotice}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          onClick={onRetake}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t.qgRetakeBtn}
        </button>

        <button
          onClick={onProceed}
          disabled={isProcessing}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow disabled:opacity-50"
        >
          <span>{isProcessing ? 'Analyzing Retinal Image...' : t.qgRunAnalysisBtn}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
