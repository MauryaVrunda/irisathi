import React from 'react';
import { QuadrantCounts } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Compass } from 'lucide-react';

interface QuadrantRadarProps {
  quadrantCounts: QuadrantCounts;
  totalLesions: number;
}

export const QuadrantRadar: React.FC<QuadrantRadarProps> = ({
  quadrantCounts,
  totalLesions
}) => {
  const { t } = useLanguage();

  const maxVal = Math.max(
    1,
    quadrantCounts.superiorTemporal,
    quadrantCounts.superiorNasal,
    quadrantCounts.inferiorTemporal,
    quadrantCounts.inferiorNasal
  );

  const stPct = Math.round((quadrantCounts.superiorTemporal / (totalLesions || 1)) * 100);
  const snPct = Math.round((quadrantCounts.superiorNasal / (totalLesions || 1)) * 100);
  const itPct = Math.round((quadrantCounts.inferiorTemporal / (totalLesions || 1)) * 100);
  const inPct = Math.round((quadrantCounts.inferiorNasal / (totalLesions || 1)) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-600" />
          <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-sans">
            {t.quadTitle}
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Total Foci: <strong className="text-slate-900">{totalLesions}</strong>
        </span>
      </div>

      {/* 2x2 Anatomical Retinal Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Superior Temporal */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800">{t.quadST}</span>
            <span className="font-mono text-cyan-700 font-bold">{stPct}%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {quadrantCounts.superiorTemporal}
            </span>
            <span className="text-[11px] text-slate-500">lesions</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(quadrantCounts.superiorTemporal / maxVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Superior Nasal */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800">{t.quadSN}</span>
            <span className="font-mono text-blue-700 font-bold">{snPct}%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {quadrantCounts.superiorNasal}
            </span>
            <span className="text-[11px] text-slate-500">lesions</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(quadrantCounts.superiorNasal / maxVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Inferior Temporal */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800">{t.quadIT}</span>
            <span className="font-mono text-indigo-700 font-bold">{itPct}%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {quadrantCounts.inferiorTemporal}
            </span>
            <span className="text-[11px] text-slate-500">lesions</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(quadrantCounts.inferiorTemporal / maxVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Inferior Nasal */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-800">{t.quadIN}</span>
            <span className="font-mono text-teal-700 font-bold">{inPct}%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {quadrantCounts.inferiorNasal}
            </span>
            <span className="text-[11px] text-slate-500">lesions</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(quadrantCounts.inferiorNasal / maxVal) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 italic bg-blue-50/50 p-2 rounded border border-blue-100">
        {t.quadDensityNote}
      </p>
    </div>
  );
};
