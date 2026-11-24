import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types';
import { LOGO_ASSET_PATH } from '../services/sampleData';
import {
  Globe,
  UserCheck,
  Stethoscope,
  LogOut,
  ChevronDown,
  Building2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  X,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout, switchRoleForDemo } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { id: 'dashboard', label: t.navDashboard },
    { id: 'new_screening', label: t.navNewScreening },
    { id: 'history', label: t.navHistory },
    { id: 'pacs', label: t.navClinicianPacs },
    { id: 'reports', label: t.navReports },
    { id: 'follow_up', label: t.navFollowUp },
    { id: 'analytics', label: t.navDistrictAnalytics },
    { id: 'about', label: t.navAbout }
  ];

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setIsProfileOpen(false);
    logout();
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.replace(/Dr\.\s*/i, '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Wordmark with official logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
            >
              {LOGO_ASSET_PATH ? (
                <img
                  src={LOGO_ASSET_PATH}
                  alt="IRISaathi Logo"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-contain bg-slate-900 p-0.5 shadow-xs border border-slate-200"
                />
              ) : null}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-slate-900 font-sans group-hover:text-blue-700 transition-colors">
                    {t.brandName}
                  </span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider font-mono">
                    {user?.role === 'clinician' ? 'Clinician' : 'Operator'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[180px] sm:max-w-xs">
                  {t.brandFullName}
                </p>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`px-2.5 xl:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Language, Quick Role, Staff Profile & Logout) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Multilingual Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <span className="pl-1.5 pr-1 text-slate-400">
                <Globe className="w-3.5 h-3.5" />
              </span>
              {(['en', 'gu', 'hi'] as SupportedLanguage[]).map((lang) => {
                const labels = { en: 'EN', gu: 'ગુજરાતી', hi: 'हिन्दी' };
                const isSelected = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={`Switch language to ${labels[lang]}`}
                  >
                    {labels[lang]}
                  </button>
                );
              })}
            </div>

            {/* Quick Role switcher for Hackathon Jury Demo */}
            {user && (
              <button
                onClick={() => switchRoleForDemo(user.role === 'clinician' ? 'operator' : 'clinician')}
                title={`Switch role to ${user.role === 'clinician' ? 'Operator' : 'Clinician'}`}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200/80 cursor-pointer"
              >
                {user.role === 'clinician' ? (
                  <>
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dr. View</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Op. View</span>
                  </>
                )}
              </button>
            )}

            {/* User Profile Dropdown & Logout Trigger */}
            {user && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors focus:outline-hidden cursor-pointer"
                  title="View Staff Profile & Session"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                    user.role === 'clinician' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {getUserInitials(user.name)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-900 leading-tight max-w-[110px] truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {user.role === 'clinician' ? 'Doctor' : 'Operator'}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Popover Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                          user.role === 'clinician' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {getUserInitials(user.name)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {user.name}
                          </h4>
                          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-mono font-medium mt-0.5 ${
                            user.role === 'clinician'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {user.role === 'clinician' ? 'Ophthalmology Clinician' : 'PHC Field Operator'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Staff & Facility Metadata */}
                    <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{user.organization}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.district}, {user.state}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-500 font-mono text-[11px]">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500 font-mono text-[11px]">+91 {user.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Staff ID: {user.id} · Active Session</span>
                      </div>
                    </div>

                    {/* Demo Role Switch inside menu */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          switchRoleForDemo(user.role === 'clinician' ? 'operator' : 'clinician');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          {user.role === 'clinician' ? (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Switch to {user.role === 'clinician' ? 'Operator View' : 'Doctor View'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Demo</span>
                      </button>
                    </div>

                    {/* Logout Button in Popover */}
                    <div className="pt-2.5 mt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t.navLogout}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Direct One-Click Logout Action Button in Navbar */}
            {user && (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title={`${t.navLogout} (${user.name})`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200/80 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.navLogout}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile sub-navigation bar with dedicated Logout pill */}
        <div className="lg:hidden flex items-center justify-between py-2 px-3 border-t border-slate-100 bg-slate-50/90 no-scrollbar gap-2">
          <div className="flex overflow-x-auto gap-1 no-scrollbar flex-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium cursor-pointer ${
                    isActive ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-600 bg-white border border-slate-200'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Mobile direct logout button */}
          {user && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-md cursor-pointer"
              title={t.navLogout}
            >
              <LogOut className="w-3 h-3" />
              <span>{t.navLogout}</span>
            </button>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirm Staff Sign Out
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tele-Ophthalmology Session Termination
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {user && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{user.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase font-sans">
                    {user.role}
                  </span>
                </div>
                <div className="text-slate-600 truncate">{user.organization}</div>
                <div className="text-slate-400 text-[11px]">{user.district}, {user.state} · ID: {user.id}</div>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to end your current session? All saved screening records and offline sync data remain safely preserved in the database.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Stay Signed In
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
