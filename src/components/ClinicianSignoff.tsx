import React, { useState } from 'react';
import { ICDRGrade, ClinicianReview } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FileCheck2, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ClinicianSignoffProps {
  predictedGrade: ICDRGrade;
  currentReview?: ClinicianReview;
  onSignoff: (review: ClinicianReview) => void;
}

export const ClinicianSignoff: React.FC<ClinicianSignoffProps> = ({
  predictedGrade,
  currentReview,
  onSignoff
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [confirmedGrade, setConfirmedGrade] = useState<ICDRGrade>(
    currentReview ? currentReview.confirmedGrade : predictedGrade
  );
  const [isOverridden, setIsOverridden] = useState<boolean>(
    currentReview ? currentReview.confirmedGrade !== predictedGrade : false
  );
  const [actionPathway, setActionPathway] = useState<ClinicianReview['actionPathway']>(
    currentReview
      ? currentReview.actionPathway
      : predictedGrade >= 4
      ? 'urgent_retina_referral'
      : predictedGrade >= 2
      ? 'ophthalmologist_referral'
      : predictedGrade === 1
      ? 'primary_care'
      : 'routine_rescreen'
  );
  const [remarks, setRemarks] = useState<string>(
    currentReview ? currentReview.clinicalRemarks : ''
  );
  const [isSigned, setIsSigned] = useState<boolean>(currentReview ? currentReview.isSigned : false);

  const handleConfirmAi = () => {
    setIsOverridden(false);
    setConfirmedGrade(predictedGrade);
  };

  const handleOverrideToggle = () => {
    setIsOverridden(true);
  };

  const handleCompleteSignoff = () => {
    const clinicianName =
      user?.name || (user?.role === 'clinician' ? 'Dr. Ananya Desai, MS (Ophth)' : 'Reviewing Clinician');
    const clinicianId = user?.id || 'USR-CLINICIAN';

    const review: ClinicianReview = {
      clinicianId,
      clinicianName,
      timestamp: new Date().toLocaleString(),
      confirmedGrade,
      actionPathway,
      clinicalRemarks:
        remarks.trim() ||
        (confirmedGrade === predictedGrade
          ? 'AI findings concurred. Clinical management protocol confirmed according to standard tele-ophthalmology guidelines.'
          : 'Grade modified after detailed clinical fundus examination by tele-ophthalmologist.'),
      isSigned: true
    };

    setIsSigned(true);
    onSignoff(review);
  };

  const gradeNames: Record<ICDRGrade, string> = {
    0: t.grade0Name,
    1: t.grade1Name,
    2: t.grade2Name,
    3: t.grade3Name,
    4: t.grade4Name
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-blue-700" />
          <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-sans">
            {t.signoffTitle}
          </h3>
        </div>

        {isSigned && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {t.signoffCompletedBadge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Grade confirmation / override */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Diagnostic Grade Verification
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmAi}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  !isOverridden
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.signoffConfirmBtn} ({gradeNames[predictedGrade]?.split('—')[0]})
              </button>
              <button
                type="button"
                onClick={handleOverrideToggle}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  isOverridden
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.signoffOverrideBtn}
              </button>
            </div>
          </div>

          {/* If override enabled, show grade selector */}
          {isOverridden && (
            <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 space-y-1.5">
              <span className="text-xs font-bold text-amber-900 block">Select Clinician Verified Grade:</span>
              <select
                value={confirmedGrade}
                onChange={(e) => setConfirmedGrade(Number(e.target.value) as ICDRGrade)}
                className="w-full text-xs font-medium bg-white border border-amber-300 rounded-md p-2 text-slate-800 focus:outline-hidden"
              >
                <option value={0}>{t.grade0Name}</option>
                <option value={1}>{t.grade1Name}</option>
                <option value={2}>{t.grade2Name}</option>
                <option value={3}>{t.grade3Name}</option>
                <option value={4}>{t.grade4Name}</option>
              </select>
            </div>
          )}

          {/* Clinical Action Pathway dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.signoffPathwayLabel}
            </label>
            <select
              value={actionPathway}
              onChange={(e) => setActionPathway(e.target.value as ClinicianReview['actionPathway'])}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="routine_rescreen">{t.pathwayRoutine}</option>
              <option value="primary_care">{t.pathwayPrimaryCare}</option>
              <option value="ophthalmologist_referral">{t.pathwayOphthReferral}</option>
              <option value="urgent_retina_referral">{t.pathwayUrgent}</option>
            </select>
          </div>
        </div>

        {/* Right Column: Clinical remarks & Signature submission */}
        <div className="space-y-4 flex flex-col justify-between">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.signoffRemarksLabel}
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t.signoffRemarksPlaceholder}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleCompleteSignoff}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.signoffCompleteBtn}</span>
            </button>

            {currentReview?.timestamp && (
              <div className="text-[11px] text-slate-500 font-mono text-center mt-2">
                Last signed on {currentReview.timestamp} by {currentReview.clinicianName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
