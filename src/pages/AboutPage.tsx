import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types';
import { LOGO_ASSET_PATH } from '../services/sampleData';
import {
  Globe,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Eye,
  FileCheck2,
  Share2,
  Layers,
  HeartPulse,
  Workflow,
  CheckCircle2
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Brand Hero Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl p-8 sm:p-12 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {LOGO_ASSET_PATH ? (
            <img
              src={LOGO_ASSET_PATH}
              alt="IRISaathi Logo"
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-contain bg-slate-900 p-1.5 border border-slate-700 shadow-xl"
            />
          ) : null}
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
              {t.brandName}
            </h1>
            <p className="text-sm font-semibold text-cyan-400">
              {t.brandFullName}
            </p>
            <p className="text-xs text-slate-300 italic max-w-xl">
              "{t.brandTagline}"
            </p>
          </div>
        </div>
      </div>

      {/* CORE USP SHOWCASE: Healthcare Without Language Barriers */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-8 border border-blue-700/60 shadow-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-700/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs uppercase tracking-wider font-bold">
              <Globe className="w-4 h-4" />
              <span>Core Technological USP</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {t.aboutUspTitle}
            </h2>
            <p className="text-xs text-slate-300">{t.aboutUspSubtitle}</p>
          </div>

          {/* Interactive Language Switcher Demo */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
            {(['en', 'gu', 'hi'] as SupportedLanguage[]).map((lang) => {
              const labels = { en: 'English', gu: 'ગુજરાતી', hi: 'हिन्दी' };
              const isSelected = language === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {labels[lang]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              language === 'en'
                ? 'bg-blue-950/90 border-cyan-400 shadow-md'
                : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="text-sm font-bold text-cyan-300 mb-1">English Workstation</div>
            <p className="text-slate-300 leading-relaxed">{t.aboutUspEng}</p>
          </div>

          <div
            onClick={() => setLanguage('gu')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              language === 'gu'
                ? 'bg-blue-950/90 border-cyan-400 shadow-md'
                : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="text-sm font-bold text-cyan-300 mb-1">ગુજરાતી (Regional Gujarati)</div>
            <p className="text-slate-300 leading-relaxed">{t.aboutUspGu}</p>
          </div>

          <div
            onClick={() => setLanguage('hi')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              language === 'hi'
                ? 'bg-blue-950/90 border-cyan-400 shadow-md'
                : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="text-sm font-bold text-cyan-300 mb-1">हिन्दी (National Hindi)</div>
            <p className="text-slate-300 leading-relaxed">{t.aboutUspHi}</p>
          </div>
        </div>

        <p className="text-xs text-cyan-200/90 bg-blue-950/60 p-3 rounded-lg border border-blue-800/40">
          "IRISaathi is designed to make AI-assisted retinal screening accessible across language barriers. Every element — from clinical findings and Grad-CAM++ explanations to PDF reports and follow-up SMS alerts — operates in complete linguistic harmony without mixed-language artifacts."
        </p>
      </div>

      {/* Problem & Solution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs uppercase tracking-wider">
            <HeartPulse className="w-4 h-4" />
            <span>The Clinical Challenge</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">{t.aboutProblemTitle}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{t.aboutProblemText}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>The IRISaathi Solution</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">{t.aboutSolutionTitle}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{t.aboutSolutionText}</p>
        </div>
      </div>

      {/* Core Architectural Features */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase font-sans border-b border-slate-100 pb-3">
          {t.aboutFeaturesTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">1. Optical Quality Gate</div>
            <p className="text-slate-600 text-[11px]">
              5-point automated validation (Laplacian sharpness, circular FOV, illumination) prevents diagnostic errors on low-grade images.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">2. Explainable Grad-CAM++</div>
            <p className="text-slate-600 text-[11px]">
              Multi-scale neural saliency maps pinpoint exact microvascular lesions used for classification, eliminating black-box opacity.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">3. Red-Free Optical Filter</div>
            <p className="text-slate-600 text-[11px]">
              Green-wavelength isolation maximizes vessel and hemorrhage contrast, replicating clinical slit-lamp ophthalmoscopy.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">4. ICDR Ordinal Probabilities</div>
            <p className="text-slate-600 text-[11px]">
              Rigorous 5-grade ordinal probability distribution (Grades 0 to 4) conforming to international clinical DR guidelines.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">5. Clinician PACS & Sign-off</div>
            <p className="text-slate-600 text-[11px]">
              Certified ophthalmologists review, verify, or override AI grades with encrypted digital sign-offs and triage pathways.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">6. Multilingual Follow-up SMS</div>
            <p className="text-slate-600 text-[11px]">
              Automated reminders transmitted to rural patients in Gujarati, Hindi, or English to ensure adherence to specialist care.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
