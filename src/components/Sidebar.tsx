import React from 'react';
import {
  HeartPulse,
  Activity,
  FileText,
  Clock,
  UserCheck,
  TrendingUp,
  Bot,
  Pill,
  Stethoscope,
  Share2,
  ShieldAlert,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenLiveVoice: () => void;
  className?: string;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLiveVoice,
  className = '',
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { t, lang } = useLanguage();

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  const navSections = [
    {
      title: 'CLINICAL VAULT',
      items: [
        { id: 'dashboard', label: t('dashboard'), icon: Activity },
        { id: 'upload', label: t('upload'), icon: FileText, badge: 'OCR' },
        { id: 'timeline', label: t('timeline'), icon: Clock },
        { id: 'profile', label: t('profile'), icon: UserCheck },
        { id: 'trends', label: t('trends'), icon: TrendingUp },
      ],
    },
    {
      title: 'AI DOCTOR & CARE',
      items: [
        { id: 'chat', label: t('chatAgent'), icon: Bot, badge: 'Dr. Sharma' },
        { id: 'reminders', label: t('reminders'), icon: Pill },
        { id: 'doctorPrep', label: t('doctorPrep'), icon: Stethoscope },
        { id: 'export', label: t('exportAbha'), icon: Share2, badge: 'FHIR' },
      ],
    },
  ];

  return (
    <aside
      className={`w-64 bg-[#090d16]/95 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-200 ${className}`}
    >
      {/* Top Header Branding */}
      <div className="p-5 border-b border-slate-800/80">
        <button
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 text-left w-full group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-teal-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-teal-300 transition-colors">
                HealthCopilot
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Clinical Health Intelligence
            </p>
          </div>
        </button>
      </div>

      {/* Live Voice Quick Banner */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => {
            onOpenLiveVoice();
            onCloseMobile?.();
          }}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-teal-900/60 via-cyan-950/60 to-slate-900/80 border border-cyan-500/30 hover:border-cyan-400/60 text-left transition-all group cursor-pointer shadow-lg shadow-cyan-950/40 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 block">
                  Live Doctor Voice
                </span>
                <span className="text-[10px] text-cyan-400">gemini-3.8-live</span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
        </button>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              {sec.title}
            </span>

            <div className="space-y-0.5 pt-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300 border border-teal-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-teal-400/20 text-teal-200'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile Pill (Like AI Studio screenshot bottom-left profile) */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        {user ? (
          <div className="p-2 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 truncate">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">Google Verified</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-slate-400">
            Sign in with Google
          </div>
        )}
      </div>
    </aside>
  );
};
