import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart2,
  TrendingUp,
  MapPin,
  Camera,
  Activity,
  UserCheck,
  Wifi,
  Clock,
  ShieldAlert,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const DistrictAnalytics: React.FC = () => {
  const { t } = useLanguage();

  // Weekly Trend Data
  const weeklyTrends = [
    { week: 'W1 Aug', scans: 142, referable: 34, qualityPass: 98 },
    { week: 'W2 Aug', scans: 189, referable: 42, qualityPass: 97 },
    { week: 'W3 Aug', scans: 215, referable: 51, qualityPass: 96 },
    { week: 'W4 Aug', scans: 248, referable: 58, qualityPass: 98 },
    { week: 'W1 Sep', scans: 290, referable: 67, qualityPass: 97 },
    { week: 'W2 Sep', scans: 340, referable: 79, qualityPass: 99 },
    { week: 'W3 Sep', scans: 395, referable: 88, qualityPass: 98 },
    { week: 'W4 Sep', scans: 420, referable: 96, qualityPass: 98 }
  ];

  // Block/Village Coverage
  const villageCoverage = [
    { name: 'Chikhli Block', totalEligible: 2800, screened: 2140, pct: 76 },
    { name: 'Vansda Block', totalEligible: 3100, screened: 2010, pct: 64 },
    { name: 'Bilimora Town', totalEligible: 4200, screened: 3450, pct: 82 },
    { name: 'Jalalpore Block', totalEligible: 2500, screened: 1720, pct: 68 },
    { name: 'Navsari Urban', totalEligible: 5800, screened: 4980, pct: 85 }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Demo Badge */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">{t.distTitle}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{t.distSubtitle}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-mono font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            {t.distDemoMetricsNotice}
          </span>
        </div>

        {/* 5 District Macro Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 text-xs">{t.distTotalScans}</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">2,384</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Across 24 PHCs</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 text-xs">{t.distCoverageRate}</div>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1">76.4%</div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">Target: 80% by Q4</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 text-xs">{t.distReferralRate}</div>
            <div className="text-2xl font-bold font-mono text-amber-800 mt-1">23.8%</div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">568 referable cases</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 text-xs">{t.distPendingReviews}</div>
            <div className="text-2xl font-bold font-mono text-indigo-900 mt-1">14</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Triage backlog: &lt; 2 hrs</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 text-xs">{t.distFollowupCompliance}</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">89.2%</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">SMS reminder response</div>
          </div>
        </div>
      </div>

      {/* Interactive Telemetry Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Trend Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase font-sans">
                {t.distTrendTitle}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" /> Total Scans
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Referable Cases
              </span>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2">
            {weeklyTrends.map((d, idx) => {
              const maxScans = 450;
              const scanHeightPct = Math.round((d.scans / maxScans) * 100);
              const refHeightPct = Math.round((d.referable / maxScans) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-48">
                    {/* Total scans bar */}
                    <div
                      className="w-1/2 bg-blue-600 rounded-t-sm transition-all duration-300 group-hover:bg-blue-500"
                      style={{ height: `${scanHeightPct}%` }}
                      title={`Total: ${d.scans}`}
                    />
                    {/* Referable bar */}
                    <div
                      className="w-1/2 bg-amber-500 rounded-t-sm transition-all duration-300 group-hover:bg-amber-400"
                      style={{ height: `${refHeightPct}%` }}
                      title={`Referable: ${d.referable}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {d.week}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-Centre Coverage List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase font-sans">
                {t.distVillageCoverageTitle}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">5 Blocks</span>
          </div>

          <div className="space-y-3.5">
            {villageCoverage.map((b, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{b.name}</span>
                  <span className="font-mono text-slate-600">
                    {b.screened} / {b.totalEligible} ({b.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Hardware & Bandwidth Parameters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase font-sans border-b border-slate-100 pb-3 mb-4">
          {t.distOperationalTitle}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.distFieldCameras}</span>
            </div>
            <span className="text-xl font-bold text-slate-900">18 Cameras</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Activity className="w-3.5 h-3.5 text-cyan-600" />
              <span>{t.distDailyScansPerCam}</span>
            </div>
            <span className="text-xl font-bold text-slate-900">22.4 Scans/Day</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.distReviewingClinicians}</span>
            </div>
            <span className="text-xl font-bold text-slate-900">4 Ophthalmologists</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Wifi className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.distClinicBandwidth}</span>
            </div>
            <span className="text-xl font-bold text-slate-900">4G LTE / 15 Mbps</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>{t.distAvgReviewTime}</span>
            </div>
            <span className="text-xl font-bold text-slate-900">3.4 Minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
