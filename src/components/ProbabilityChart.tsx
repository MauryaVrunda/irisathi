import React from 'react';
import { ProbabilityDistribution, ICDRGrade } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface ProbabilityChartProps {
  probabilities: ProbabilityDistribution;
  predictedGrade: ICDRGrade;
  confidence: number;
  referralStatus: 'NON_REFERABLE' | 'REFERABLE_DR' | 'URGENT_REFERRAL';
  referralRecommendation: string;
  isDemo?: boolean;
}

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({
  probabilities,
  predictedGrade,
  confidence,
  referralStatus,
  referralRecommendation,
  isDemo
}) => {
  const { t } = useLanguage();

  const grades = [
    { grade: 0 as ICDRGrade, name: t.grade0Name, prob: probabilities.grade0, color: 'bg-emerald-500', barColor: '#10b981' },
    { grade: 1 as ICDRGrade, name: t.grade1Name, prob: probabilities.grade1, color: 'bg-teal-500', barColor: '#14b8a6' },
    { grade: 2 as ICDRGrade, name: t.grade2Name, prob: probabilities.grade2, color: 'bg-amber-500', barColor: '#f59e0b' },
    { grade: 3 as ICDRGrade, name: t.grade3Name, prob: probabilities.grade3, color: 'bg-orange-500', barColor: '#f97316' },
    { grade: 4 as ICDRGrade, name: t.grade4Name, prob: probabilities.grade4, color: 'bg-rose-600', barColor: '#e11d48' }
  ];

  const getReferralBadge = () => {
    switch (referralStatus) {
      case 'NON_REFERABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider font-mono">
            <CheckCircle className="w-3.5 h-3.5" />
            {t.statusNonReferable}
          </span>
        );
      case 'REFERABLE_DR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t.statusReferable}
          </span>
        );
      case 'URGENT_REFERRAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold uppercase tracking-wider font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            {t.statusUrgent}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-sans">
              {t.probTitle}
            </h3>
          </div>
          {isDemo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
              <ShieldAlert className="w-3 h-3" />
              DEMO RESULT
            </span>
          )}
        </div>

        {/* Probability Bars */}
        <div className="space-y-3">
          {grades.map((item) => {
            const isPredicted = item.grade === predictedGrade;
            const pct = Math.min(100, Math.max(0, item.prob));
            return (
              <div key={item.grade} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isPredicted ? 'text-slate-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {item.name}
                    </span>
                    {isPredicted && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                        PREDICTED
                      </span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums text-slate-800 font-bold text-xs">
                    {pct.toFixed(1)}%
                  </span>
                </div>
                {/* Horizontal Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.color} ${
                      isPredicted ? 'ring-1 ring-slate-900/30' : 'opacity-85'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Summary Card */}
      <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 font-medium">{t.probConfidence}:</span>
          <span className="text-sm font-bold font-mono tabular-nums text-blue-700">
            {confidence.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 font-medium">Triage Priority:</span>
          <div>{getReferralBadge()}</div>
        </div>

        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed mt-2">
          <strong className="text-slate-800 font-semibold">{t.probReferralRec}: </strong>
          {referralRecommendation}
        </p>
      </div>
    </div>
  );
};
