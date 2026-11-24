import React from 'react';
import { Lesion, AIAnalysisResult } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ListFilter, ShieldAlert } from 'lucide-react';

interface LesionTableProps {
  lesions: Lesion[];
  counts: AIAnalysisResult['lesionCounts'];
  isDemo?: boolean;
}

export const LesionTable: React.FC<LesionTableProps> = ({
  lesions,
  counts,
  isDemo
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-sans">
            {t.lesionTableTitle}
          </h3>
        </div>
        {isDemo && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
            <ShieldAlert className="w-3 h-3" />
            DEMO FINDINGS
          </span>
        )}
      </div>

      {/* Lesion Biomarker Burden summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
        <div className="bg-red-50 border border-red-200/80 rounded-lg p-2.5">
          <div className="text-red-700 font-semibold">{t.pathMicroaneurysm}</div>
          <div className="text-xl font-bold font-mono text-red-900 mt-1">
            {counts.microaneurysms}
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-200/80 rounded-lg p-2.5">
          <div className="text-rose-700 font-semibold">{t.pathHemorrhage}</div>
          <div className="text-xl font-bold font-mono text-rose-900 mt-1">
            {counts.hemorrhages}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5">
          <div className="text-amber-800 font-semibold">{t.pathHardExudate}</div>
          <div className="text-xl font-bold font-mono text-amber-950 mt-1">
            {counts.hardExudates}
          </div>
        </div>
        <div className="bg-cyan-50 border border-cyan-200/80 rounded-lg p-2.5">
          <div className="text-cyan-800 font-semibold">{t.pathNeovascularization}</div>
          <div className="text-xl font-bold font-mono text-cyan-950 mt-1">
            {counts.neovascularizations}
          </div>
        </div>
      </div>

      {/* Tabular Indexed Pathology Findings */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center font-mono">{t.lesionColNum}</th>
              <th className="py-2.5 px-3">{t.lesionColType}</th>
              <th className="py-2.5 px-3">{t.lesionColLocation}</th>
              <th className="py-2.5 px-3 font-mono">{t.lesionColCoords}</th>
              <th className="py-2.5 px-3 text-right font-mono">{t.lesionColConf}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {lesions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                  No pathological lesions detected in retinal field. Normal physiology.
                </td>
              </tr>
            ) : (
              lesions.map((lesion) => {
                const badgeColor =
                  lesion.pathology === 'microaneurysm'
                    ? 'text-red-700 bg-red-50 border-red-200'
                    : lesion.pathology === 'hemorrhage'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : lesion.pathology === 'hard_exudate'
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-cyan-800 bg-cyan-50 border-cyan-200';

                return (
                  <tr key={lesion.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                      {lesion.id}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColor}`}>
                        {lesion.pathology.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      {lesion.locationQuadrant}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">
                      ({lesion.x.toFixed(1)}%, {lesion.y.toFixed(1)}%)
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                      {lesion.confidence.toFixed(1)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
