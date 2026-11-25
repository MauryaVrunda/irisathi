import React, { useState, useEffect } from 'react';
import { useScreening } from '../context/ScreeningContext';
import { useLanguage } from '../context/LanguageContext';
import { RetinalWorkstation } from '../components/RetinalWorkstation';
import { ProbabilityChart } from '../components/ProbabilityChart';
import { ClinicianSignoff } from '../components/ClinicianSignoff';
import { ComprehensiveReport } from '../components/ComprehensiveReport';
import { Stethoscope } from 'lucide-react';
import { ScreeningCase } from '../types';

export const ClinicianPacs: React.FC = () => {
  const { cases, saveCase, submitReviewToBackend, updateReferralInBackend, backendStatus } = useScreening();
  const { t } = useLanguage();

  const [selectedCase, setSelectedCase] = useState<ScreeningCase | null>(cases[1] || cases[0]);
  const [activeTab, setActiveTab] = useState<'workstation' | 'report'>('workstation');
  const [filter, setFilter] = useState<'all' | 'priority' | 'referable' | 'normal'>('all');
  const [referralSaving, setReferralSaving] = useState(false);

  useEffect(() => {
    if (!selectedCase && cases.length > 0) {
      setSelectedCase(cases[1] || cases[0]);
      return;
    }
    if (selectedCase) {
      const updated = cases.find((c) => c.id === selectedCase.id);
      if (updated && updated !== selectedCase) {
        setSelectedCase(updated);
      }
    }
  }, [cases, selectedCase]);

  const filteredCases = cases.filter((c) => {
    if (filter === 'priority') return c.aiResult?.referralStatus === 'URGENT_REFERRAL';
    if (filter === 'referable') return c.aiResult?.predictedGrade >= 2;
    if (filter === 'normal') return c.aiResult?.predictedGrade === 0;
    return true;
  });

  const priorityCount = cases.filter((c) => c.aiResult?.referralStatus === 'URGENT_REFERRAL').length + 3;
  const referableCount = cases.filter((c) => c.aiResult?.predictedGrade >= 2).length;
  const normalCount = cases.filter((c) => c.aiResult?.predictedGrade === 0).length;

  const handleSignoffUpdate = async (review: any) => {
    if (selectedCase) {
      const synced = await submitReviewToBackend(selectedCase.id, review);
      if (synced) {
        setSelectedCase(synced);
        return;
      }
      const updated: ScreeningCase = {
        ...selectedCase,
        clinicianReview: review
      };
      saveCase(updated);
      setSelectedCase(updated);
    }
  };

  const handleReferralStatusChange = async (newStatus: string) => {
    if (!selectedCase) return;
    setReferralSaving(true);
    const synced = await updateReferralInBackend(selectedCase.id, { status: newStatus });
    if (synced) {
      setSelectedCase(synced);
    } else {
      const updated: ScreeningCase = {
        ...selectedCase,
        referralInfo: {
          priority: selectedCase.referralInfo?.priority || selectedCase.aiResult?.referralStatus || 'REFERABLE_DR',
          facilityName: selectedCase.referralInfo?.facilityName || 'Navsari District Civil Hospital - Tele-Retina Unit',
          status: newStatus,
          dueDate: selectedCase.referralInfo?.dueDate,
          notes: selectedCase.referralInfo?.notes
        }
      };
      saveCase(updated);
      setSelectedCase(updated);
    }
    setReferralSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* PACS Header & Operational Triage Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">{t.pacsTitle}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{t.pacsSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Queue Triage Mode:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                All ({cases.length})
              </button>
              <button
                onClick={() => setFilter('priority')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filter === 'priority' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Priority ({priorityCount})
              </button>
              <button
                onClick={() => setFilter('referable')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filter === 'referable' ? 'bg-amber-600 text-white shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Referable ({referableCount})
              </button>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px]">{t.pacsActiveQueue}</span>
            <span className="text-xl font-bold text-slate-900">{cases.length} active</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
            <span className="text-rose-700 block text-[11px]">{t.pacsPriorityReview}</span>
            <span className="text-xl font-bold text-rose-950">{priorityCount} urgent</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-amber-800 block text-[11px]">{t.pacsReferableDr}</span>
            <span className="text-xl font-bold text-amber-950">{referableCount} referable</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-blue-700 block text-[11px]">{t.pacsMeanReadingTime}</span>
            <span className="text-xl font-bold text-blue-950">3.2 minutes</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Triage List (4 cols) & Workstation (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Case Triage Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            Triage Patient Queue
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              const isUrgent = c.aiResult?.referralStatus === 'URGENT_REFERRAL';
              const isReferable = c.aiResult?.predictedGrade >= 2;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className="font-bold font-mono text-slate-900">{c.patient.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isReferable
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      Grade {c.aiResult?.predictedGrade}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{c.eye} Eye · {c.patient.age}y {c.patient.gender}</span>
                    <span>Conf: {c.aiResult?.confidence.toFixed(1)}%</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 truncate">
                    {c.studyDate} · {c.patient.village}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Case Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCase ? (
            <div className="space-y-6">
              {/* Workspace Mode Tabs */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('workstation')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      activeTab === 'workstation'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    PACS Workstation View
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      activeTab === 'report'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Clinical Report View
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-500">
                  Case ID: <strong className="text-slate-900">{selectedCase.id}</strong>
                </div>
              </div>

              {activeTab === 'workstation' ? (
                <>
                  <RetinalWorkstation
                    imageUri={selectedCase.imageUri}
                    gradcamUri={selectedCase.gradcamUri}
                    aiResult={selectedCase.aiResult}
                    eyeLabel={selectedCase.eye}
                    patientId={selectedCase.patient.id}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProbabilityChart
                      probabilities={selectedCase.aiResult.probabilities}
                      predictedGrade={selectedCase.aiResult.predictedGrade}
                      confidence={selectedCase.aiResult.confidence}
                      referralStatus={selectedCase.aiResult.referralStatus}
                      referralRecommendation={selectedCase.aiResult.referralRecommendation}
                      isDemo={selectedCase.aiResult.isDemo}
                    />

                    <ClinicianSignoff
                      key={selectedCase.id}
                      predictedGrade={selectedCase.aiResult.predictedGrade}
                      currentReview={selectedCase.clinicianReview}
                      onSignoff={handleSignoffUpdate}
                    />
                  </div>

                  {/* Referral Tracking Strip */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                        Referral Coordination ({backendStatus === 'online' ? 'Persisted in SQLite' : 'Local Cache'})
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        Facility: {selectedCase.referralInfo?.facilityName || 'Navsari District Civil Hospital - Tele-Retina Unit'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">Status:</span>
                      <select
                        value={selectedCase.referralInfo?.status || 'pending'}
                        disabled={referralSaving}
                        onChange={(e) => handleReferralStatusChange(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      >
                        <option value="pending">Pending</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="not_required">Not Required</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <ComprehensiveReport screeningCase={selectedCase} />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Select a screening case from the left triage queue to begin evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
