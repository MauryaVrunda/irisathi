import React from 'react';
import { useScreening } from '../context/ScreeningContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CalendarCheck,
  ArrowRight,
  PlusCircle,
  Eye,
  Activity,
  Sparkles,
  Info
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onSelectCase: (caseId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectCase }) => {
  const { cases } = useScreening();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Metrics calculation
  const totalScreenings = 142; // telemetry aggregated count
  const passedQualityCount = 138;
  const referableCasesCount = cases.filter(
    (c) => c.aiResult && (c.aiResult.predictedGrade >= 2 || c.aiResult.referralStatus !== 'NON_REFERABLE')
  ).length + 34;
  const pendingReviewsCount = cases.filter((c) => !c.clinicianReview?.isSigned).length + 6;
  const followupsDueCount = cases.reduce(
    (acc, curr) => acc + curr.followUps.filter((f) => f.status === 'pending').length,
    0
  ) + 18;

  // Severity Distribution counts
  const severityStats = [
    { grade: 0, label: t.grade0Name, count: 68, pct: 48, color: 'bg-emerald-500' },
    { grade: 1, label: t.grade1Name, count: 24, pct: 17, color: 'bg-teal-500' },
    { grade: 2, label: t.grade2Name, count: 32, pct: 23, color: 'bg-amber-500' },
    { grade: 3, label: t.grade3Name, count: 11, pct: 8, color: 'bg-orange-500' },
    { grade: 4, label: t.grade4Name, count: 7, pct: 5, color: 'bg-rose-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold tracking-wider uppercase">
            <Activity className="w-4 h-4" />
            <span>{t.dashTitle}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Welcome back, {user?.name || 'Healthcare Specialist'}
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t.dashSubtitle} · Primary Care Network (Navsari District)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('new_screening')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.dashActionStartNew}</span>
          </button>

          <button
            onClick={() => onNavigate('pacs')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{t.dashActionOpenWorkstation}</span>
          </button>
        </div>
      </div>

      {/* Demonstration Notice */}
      <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/90 text-amber-900 px-4 py-2.5 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-medium">{t.dashDemoNotice}</span>
        </div>
        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-950 uppercase">
          Sample/Demo Mode Active
        </span>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t.kpiTodayScreenings}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalScreenings}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            +18 vs yesterday
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t.kpiPassedQuality}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            97.2%
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {passedQualityCount} / {totalScreenings} passed
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t.kpiReferableCases}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
            {referableCasesCount}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            24.6% referral rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t.kpiPendingReviews}</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-950 mt-1">
            {pendingReviewsCount}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Avg review: 3.4 min
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t.kpiFollowupsDue}</span>
            <CalendarCheck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-950 mt-1">
            {followupsDueCount}
          </div>
          <div className="text-[11px] text-cyan-700 font-semibold mt-1">
            SMS alerts active
          </div>
        </div>
      </div>

      {/* Main Grid: Triage Queue & ICDR Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Screenings & Triage Queue (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-sans">
                {t.dashRecentScreenings}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {cases.slice(0, 5).map((c) => {
              const isReferable = c.aiResult?.predictedGrade >= 2;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {c.imageUri ? (
                      <img
                        src={c.imageUri}
                        alt="Fundus"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover bg-black shrink-0 border border-slate-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0 border border-slate-300 flex items-center justify-center text-[10px] text-cyan-400 font-mono">
                        {c.eye}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <strong className="text-slate-900">{c.patient.id}</strong>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{c.eye} Eye</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {c.studyDate} · {c.patient.village}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          isReferable
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        Grade {c.aiResult?.predictedGrade}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Conf: {c.aiResult?.confidence.toFixed(1)}%
                      </div>
                    </div>

                    <div className="text-slate-400 hover:text-blue-600">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: ICDR Severity Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-sans">
                  {t.dashSeverityDistribution}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">N=142</span>
            </div>

            <div className="space-y-3.5">
              {severityStats.map((item) => (
                <div key={item.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="font-mono text-slate-600">
                      {item.count} cases ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800 font-semibold">Triage Rule: </strong>
            Grades 2, 3, and 4 are classified as Referable Diabetic Retinopathy requiring specialist ophthalmology review within 2 to 6 weeks.
          </div>
        </div>
      </div>
    </div>
  );
};
