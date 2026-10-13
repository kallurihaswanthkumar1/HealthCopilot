import React, { useState } from 'react';
import {
  HeartPulse,
  Users,
  Globe,
  LogOut,
  ChevronDown,
  Plus,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Clock,
  Activity,
  Bot,
  Pill,
  Stethoscope,
  Share2,
  UserCheck,
  Radio,
  Check,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES, IndianLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddFamilyModal: () => void;
  onOpenLiveVoice: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddFamilyModal,
  onOpenLiveVoice,
}) => {
  const { user, profiles, activeProfile, setActiveProfile, logout } = useAuth();
  const { lang, setLang, currentLanguageInfo, t } = useLanguage();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Activity },
    { id: 'upload', label: t('upload'), icon: FileText, badge: 'OCR' },
    { id: 'timeline', label: t('timeline'), icon: Clock },
    { id: 'profile', label: t('profile'), icon: UserCheck },
    { id: 'trends', label: t('trends'), icon: TrendingUp },
    { id: 'chat', label: t('chatAgent'), icon: Bot, badge: t('doctorBadge') },
    { id: 'reminders', label: t('reminders'), icon: Pill },
    { id: 'doctorPrep', label: t('doctorPrep'), icon: Stethoscope },
    { id: 'export', label: t('exportAbha'), icon: Share2, badge: 'FHIR' },
  ];

  // Mobile Bottom Nav items (Instagram-like 5 Primary Quick Tabs)
  const mobileBottomNavItems = [
    { id: 'dashboard', label: t('bottomNavDashboard'), icon: Activity },
    { id: 'upload', label: t('bottomNavUpload'), icon: FileText },
    { id: 'trends', label: t('bottomNavTrends'), icon: TrendingUp },
    { id: 'chat', label: t('bottomNavDoctor'), icon: Stethoscope },
    { id: 'profile', label: t('bottomNavProfile'), icon: UserCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/85 border-b border-indigo-100/60 shadow-[0_4px_25px_-5px_rgba(99,102,241,0.06)] transition-all">
        {/* Top Header Row */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onSelectTab('dashboard')}
                className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-all">
                  <HeartPulse className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-900 bg-clip-text text-transparent group-hover:text-violet-700 transition-colors">
                      {t('appName')}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 hidden xs:inline-block">
                      {t('aiVault')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium hidden md:block">
                    {t('privateVaultSub')}
                  </p>
                </div>
              </button>
            </div>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Live Voice Consultation Action */}
              <button
                onClick={onOpenLiveVoice}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer group"
                title="Start real-time voice consultation with doctor"
              >
                <span className="w-2 h-2 rounded-full bg-violet-200 animate-ping shrink-0" />
                <span className="hidden sm:inline">{t('drVoiceLive')}</span>
                <span className="sm:hidden">{t('drVoice')}</span>
              </button>

              {/* Indian Language Selector Button */}
              <button
                onClick={() => setLangModalOpen(true)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-indigo-100 text-slate-700 hover:text-indigo-900 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Switch Indian Language"
              >
                <Globe className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span className="font-bold text-xs">{currentLanguageInfo.nativeName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {/* Family Profile Switcher */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-950 text-xs font-bold transition-all cursor-pointer"
                  title="Switch Family Profile"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="max-w-[65px] sm:max-w-[100px] truncate">
                    {activeProfile?.name || 'Self'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-indigo-600 shrink-0" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {t('switchFamilyProfile')}
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {t('isolatedDocsNote')}
                      </p>
                    </div>

                    <div className="py-1 max-h-56 overflow-y-auto space-y-1">
                      {profiles.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => {
                            setActiveProfile(profile);
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                            activeProfile?.id === profile.id
                              ? 'bg-indigo-50 text-indigo-950 border border-indigo-200/80 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-900">{profile.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {profile.relationship} • {profile.age}y • Blood {profile.bloodGroup}
                            </p>
                          </div>
                          {activeProfile?.id === profile.id && (
                            <Check className="w-4 h-4 text-violet-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAddFamilyModal();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('addFamilyMember')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Google User Avatar & Account Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                  title="Google Account details"
                >
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.name || 'User'}
                    className="w-8 h-8 rounded-full border border-violet-400/50 object-cover shadow-2xs"
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                      <img
                        src={user?.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full border border-violet-500/30 object-cover"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full mt-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>{t('googleVerified')}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Horizontal Navigation Bar (hidden on mobile, replaces cramped rows) */}
        <div className="border-t border-indigo-100/50 bg-[#F6F8FE]/80 backdrop-blur-md hidden md:block">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar scroll-smooth">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-violet-100 text-violet-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Instagram-Style Mobile Bottom Navigation Bar (< 768px viewports) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-indigo-100/80 shadow-[0_-4px_20px_rgba(99,102,241,0.08)] px-2 py-1.5 flex items-center justify-around transition-all">
        {mobileBottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-violet-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-violet-100 text-violet-700 shadow-2xs scale-105'
                    : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[65px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Indian Languages Selector Modal (14 Indian Languages) */}
      {langModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Choose Language / భాష ఎంచుకోండి
                  </h3>
                  <p className="text-xs text-slate-500">
                    Speech & translations for Indian official languages
                  </p>
                </div>
              </div>

              <button
                onClick={() => setLangModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setLangModalOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    lang === l.code
                      ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 shadow-xs'
                      : 'bg-white hover:bg-indigo-50/40 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-sm block">{l.nativeName}</span>
                    <span className="text-[11px] text-slate-500">{l.name}</span>
                    <span className="block text-[9px] text-slate-400">{l.region}</span>
                  </div>
                  {lang === l.code && <Check className="w-4 h-4 text-violet-600 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
              <span>{t('dataIsolatedNote')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
