import React, { useState } from 'react';
import { useScreening } from '../context/ScreeningContext';
import { useLanguage } from '../context/LanguageContext';
import { ComprehensiveReport } from '../components/ComprehensiveReport';
import { ScreeningCase } from '../types';
import { Search, Filter, History, Eye, ArrowRight, ShieldCheck, X } from 'lucide-react';

export const ScreeningHistory: React.FC = () => {
  const { cases } = useScreening();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [referralFilter, setReferralFilter] = useState<string>('all');
  const [eyeFilter, setEyeFilter] = useState<string>('all');

  const [viewingCase, setViewingCase] = useState<ScreeningCase | null>(null);

  const filteredCases = cases.filter((c) => {
    // Search
    const matchesSearch =
      c.patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patient.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patient.mobile.includes(searchTerm);

    // Severity filter
    const matchesSeverity =
      severityFilter === 'all' || c.aiResult?.predictedGrade.toString() === severityFilter;

    // Referral filter
    const matchesReferral =
      referralFilter === 'all' ||
      (referralFilter === 'referable'
        ? c.aiResult?.predictedGrade >= 2
        : c.aiResult?.predictedGrade < 2);

    // Eye filter
    const matchesEye = eyeFilter === 'all' || c.eye.toLowerCase() === eyeFilter.toLowerCase();

    return matchesSearch && matchesSeverity && matchesReferral && matchesEye;
  });

  if (viewingCase) {
    return (
      <div className="space-y-4">
        <ComprehensiveReport
          screeningCase={viewingCase}
          onBack={() => setViewingCase(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Archive Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">{t.histTitle}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{t.histSubtitle}</p>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Total Records: <strong className="text-slate-900">{filteredCases.length}</strong>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.histSearchPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="all">Severity: {t.histAll}</option>
              <option value="0">Grade 0 — No DR</option>
              <option value="1">Grade 1 — Mild NPDR</option>
              <option value="2">Grade 2 — Moderate NPDR</option>
              <option value="3">Grade 3 — Severe NPDR</option>
              <option value="4">Grade 4 — Proliferative DR</option>
            </select>
          </div>

          {/* Referral Filter */}
          <div>
            <select
              value={referralFilter}
              onChange={(e) => setReferralFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="all">Referral: {t.histAll}</option>
              <option value="referable">Referable Cases (Grade 2+)</option>
              <option value="non_referable">Non-Referable (Grade 0-1)</option>
            </select>
          </div>

          {/* Eye Filter */}
          <div>
            <select
              value={eyeFilter}
              onChange={(e) => setEyeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="all">Eye: {t.histAll}</option>
              <option value="OD">Right Eye (OD)</option>
              <option value="OS">Left Eye (OS)</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-mono">{t.histColId}</th>
                <th className="py-3 px-4">{t.histColDate}</th>
                <th className="py-3 px-4 font-mono">{t.histColEye}</th>
                <th className="py-3 px-4">{t.histColQuality}</th>
                <th className="py-3 px-4">{t.histColGrade}</th>
                <th className="py-3 px-4 font-mono">{t.histColConfidence}</th>
                <th className="py-3 px-4">{t.histColReferral}</th>
                <th className="py-3 px-4">{t.histColClinician}</th>
                <th className="py-3 px-4 text-right">{t.histColAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    {t.histEmpty}
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isReferable = c.aiResult?.predictedGrade >= 2;
                  const isSigned = c.clinicianReview?.isSigned;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {c.patient.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {c.studyDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {c.eye}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-emerald-700 font-semibold">
                          {c.quality.overallScore}% PASS
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        Grade {c.aiResult?.predictedGrade}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {c.aiResult?.confidence.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            isReferable
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {c.aiResult?.referralStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-mono ${
                            isSigned ? 'text-emerald-700 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {isSigned ? '✓ Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingCase(c)}
                          className="px-3 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          {t.histViewBtn}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
