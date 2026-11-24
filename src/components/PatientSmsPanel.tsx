import React, { useState } from 'react';
import { ScreeningCase, FollowUpItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useScreening } from '../context/ScreeningContext';
import { MessageSquare, Send, CheckCircle2, Clock, Smartphone, Plus, Info } from 'lucide-react';

interface PatientSmsPanelProps {
  screeningCase: ScreeningCase;
}

export const PatientSmsPanel: React.FC<PatientSmsPanelProps> = ({ screeningCase }) => {
  const { t, language } = useLanguage();
  const { sendSms } = useScreening();

  const [customMessage, setCustomMessage] = useState<string>(() => {
    // Generate default localized message based on referral status
    if (screeningCase.aiResult.predictedGrade >= 2) {
      return t.fuSmsTemplateReferral;
    }
    return t.fuSmsTemplateRescreen;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize customMessage when language or case changes
  React.useEffect(() => {
    if (screeningCase.aiResult.predictedGrade >= 2) {
      setCustomMessage(t.fuSmsTemplateReferral);
    } else {
      setCustomMessage(t.fuSmsTemplateRescreen);
    }
  }, [language, screeningCase.aiResult.predictedGrade, t]);

  const handleSendReminderSms = (reminder: FollowUpItem) => {
    let textToSend = customMessage;
    if (reminder.smsTemplateKey === 'fuSmsTemplateRescreen') textToSend = t.fuSmsTemplateRescreen;
    else if (reminder.smsTemplateKey === 'fuSmsTemplateGlucose') textToSend = t.fuSmsTemplateGlucose;
    else if (reminder.smsTemplateKey === 'fuSmsTemplateHba1c') textToSend = t.fuSmsTemplateHba1c;
    else if (reminder.smsTemplateKey === 'fuSmsTemplateReferral') textToSend = t.fuSmsTemplateReferral;

    sendSms(screeningCase.id, reminder.id, textToSend, language);
    showToast(t.fuSmsSentToast);
  };

  const handleSendCustomSms = () => {
    if (!customMessage.trim()) return;
    sendSms(screeningCase.id, null, customMessage, language);
    showToast(t.fuSmsSentToast);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage} (+91 {screeningCase.patient.mobile})</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">{t.fuTitle}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t.fuSubtitle}</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono">
          <Smartphone className="w-4 h-4 text-slate-600" />
          <span className="text-slate-500">Patient Mobile:</span>
          <strong className="text-slate-900">+91 {screeningCase.patient.mobile}</strong>
        </div>
      </div>

      {/* Active Clinical Reminders Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t.fuActiveReminders}
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            Language: <strong className="text-blue-700 uppercase">{language}</strong>
          </span>
        </div>

        <div className="space-y-2.5">
          {screeningCase.followUps.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
              No active follow-ups scheduled for this patient.
            </div>
          ) : (
            screeningCase.followUps.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {t.fuIntervalLabel}: {item.interval}
                    </span>
                    <span>·</span>
                    <span>
                      {t.fuDueDateLabel}: <strong>{item.dueDate}</strong>
                    </span>
                    {item.lastSentAt && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-700">Last transmitted: {item.lastSentAt}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      item.status === 'sent'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>

                  <button
                    onClick={() => handleSendReminderSms(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>{t.fuSendSmsBtn}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Custom SMS in Local Language */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t.fuCustomSmsTitle}
          </h4>
          <span className="text-[11px] font-medium text-slate-500">
            Strict Regional Dialect: {language === 'gu' ? 'ગુજરાતી' : language === 'hi' ? 'हिन्दी' : 'English'}
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            {t.fuSmsTextLabel}
          </label>
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-sans"
          />
        </div>

        {/* Quick Template Fill Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 font-medium self-center mr-1">Templates:</span>
          <button
            type="button"
            onClick={() => setCustomMessage(t.fuSmsTemplateRescreen)}
            className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors"
          >
            Annual Rescreen
          </button>
          <button
            type="button"
            onClick={() => setCustomMessage(t.fuSmsTemplateGlucose)}
            className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors"
          >
            Glucose Check
          </button>
          <button
            type="button"
            onClick={() => setCustomMessage(t.fuSmsTemplateHba1c)}
            className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors"
          >
            Quarterly HbA1c
          </button>
          <button
            type="button"
            onClick={() => setCustomMessage(t.fuSmsTemplateReferral)}
            className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors"
          >
            Urgent Specialist Referral
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500 font-mono">
            {customMessage.length} characters · 1 SMS credit
          </span>

          <button
            type="button"
            onClick={handleSendCustomSms}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.fuSendCustomBtn}</span>
          </button>
        </div>
      </div>

      {/* Simulated Gateway Disclaimer */}
      <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.2" />
        <span>{t.fuSimulatedNotice}</span>
      </div>
    </div>
  );
};
