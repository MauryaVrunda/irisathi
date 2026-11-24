import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, SupportedLanguage } from '../types';
import { LOGO_ASSET_PATH } from '../services/sampleData';
import { UserCheck, Stethoscope, Eye, Globe, Lock, Mail, Phone, Building, MapPin, ArrowRight } from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { login, register } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator');

  // Login form state
  const [identifier, setIdentifier] = useState('operator@irisaathi.in');
  const [password, setPassword] = useState('operator123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regDistrict, setRegDistrict] = useState('Navsari');
  const [regState, setRegState] = useState('Gujarat');
  const [regMessage, setRegMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'operator') {
      setIdentifier('operator@irisaathi.in');
      setPassword('operator123');
    } else {
      setIdentifier('clinician@irisaathi.in');
      setPassword('doctor123');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!identifier || !password) {
      setLoginError(t.loginValidationEmpty);
      return;
    }
    setLoginLoading(true);
    try {
      const res = await login(identifier, password, selectedRole, rememberMe);
      if (!res.success) {
        setLoginError(res.message || t.loginValidationEmpty);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage(null);
    if (regPassword !== regConfirmPassword) {
      setRegMessage({ type: 'error', text: t.regPassMismatch });
      return;
    }
    try {
      const res = await register(
        {
          name: regFullName,
          email: regEmail,
          mobile: regMobile,
          role: selectedRole,
          organization: regOrg || 'Navsari Health Sub-Centre',
          district: regDistrict,
          state: regState
        },
        regPassword
      );

      if (res.success) {
        setRegMessage({ type: 'success', text: t.regSuccess });
        setTimeout(() => {
          setMode('login');
          setIdentifier(regEmail);
          setPassword(regPassword);
        }, 1200);
      } else {
        setRegMessage({ type: 'error', text: res.message || 'Registration failed' });
      }
    } catch (err: any) {
      setRegMessage({ type: 'error', text: err.message || 'Registration failed' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Top Language Bar for immediate multilingual access */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Tele-Ophthalmology Workstation</span>
        </div>

        <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          {(['en', 'gu', 'hi'] as SupportedLanguage[]).map((lang) => {
            const labels = { en: 'English', gu: 'ગુજરાતી', hi: 'हिन्दी' };
            const isSelected = language === lang;
            return (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {labels[lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Portal Card */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-700/40">
        {/* Left Side: Brand Identity & Clinical Visuals (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3.5">
              {LOGO_ASSET_PATH ? (
                <img
                  src={LOGO_ASSET_PATH}
                  alt="IRISaathi Logo"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-contain bg-slate-900 p-1 border border-slate-700 shadow-md"
                />
              ) : null}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                  {t.brandName}
                </h1>
                <p className="text-xs text-cyan-400 font-medium tracking-wide">
                  {t.brandFullName}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-block px-3 py-1 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold">
                {t.explainableSubtitle}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                "{t.brandTagline}"
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                Clinical Workflow Pipeline
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                <div>• Patient Demographics</div>
                <div>• Optical Quality Gate</div>
                <div>• Grad-CAM++ Saliency</div>
                <div>• ICDR Classification</div>
                <div>• Clinician Sign-off</div>
                <div>• Multilingual Reports</div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Rural Health Mission</span>
            <span>SIH Edition 2026</span>
          </div>
        </div>

        {/* Right Side: Role Selector & Login / Registration Forms (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 bg-white flex flex-col justify-center">
          {mode === 'login' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {t.loginTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t.loginSubtitle}
                </p>
              </div>

              {/* ONLY TWO ROLES: Operator & Clinician (NO ADMIN) */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {t.loginRolePrompt}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Operator Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('operator')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedRole === 'operator'
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <UserCheck
                        className={`w-4 h-4 ${
                          selectedRole === 'operator' ? 'text-blue-600' : 'text-slate-500'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-900 font-sans">
                        {t.roleOperator}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {t.roleOperatorDesc}
                    </p>
                  </button>

                  {/* Clinician Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('clinician')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedRole === 'clinician'
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Stethoscope
                        className={`w-4 h-4 ${
                          selectedRole === 'clinician' ? 'text-blue-600' : 'text-slate-500'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-900 font-sans">
                        {t.roleClinician}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {t.roleClinicianDesc}
                    </p>
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {loginError}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email / Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t.loginEmailPlaceholder}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.loginPasswordPlaceholder}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{t.loginRememberMe}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setResetNotice('A password reset verification code has been dispatched to your registered SMS and email.')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t.loginForgotPassword}
                  </button>
                </div>

                {resetNotice && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between animate-in fade-in">
                    <span>{resetNotice}</span>
                    <button
                      type="button"
                      onClick={() => setResetNotice(null)}
                      className="ml-2 text-blue-500 hover:text-blue-800 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loginLoading ? 'Authenticating...' : t.loginBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
                <span>{t.loginNoAccount} </span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-600 hover:text-blue-800 font-bold ml-1"
                >
                  {t.loginCreateAccount}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {t.regTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.regSubtitle}
                </p>
              </div>

              {regMessage && (
                <div
                  className={`mb-4 p-3 rounded-lg text-xs font-medium border ${
                    regMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {regMessage.text}
                </div>
              )}

              {/* Registration Role Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole('operator')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                    selectedRole === 'operator'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Operator
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('clinician')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                    selectedRole === 'clinician'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Clinician
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {t.regFullName}
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Shah"
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {t.regMobile}
                    </label>
                    <input
                      type="tel"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t.regEmail}
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="official.name@phc.in"
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {t.regPassword}
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {t.regConfirmPassword}
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t.regOrg}
                  </label>
                  <input
                    type="text"
                    required
                    value={regOrg}
                    onChange={(e) => setRegOrg(e.target.value)}
                    placeholder="e.g. Chikhli Primary Health Centre (PHC)"
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {t.regDistrict}
                    </label>
                    <input
                      type="text"
                      required
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {t.regState}
                    </label>
                    <input
                      type="text"
                      required
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors mt-2"
                >
                  {t.regSubmitBtn}
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                <span>{t.regAlreadyAccount} </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:text-blue-800 font-bold ml-1"
                >
                  {t.regLoginHere}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
