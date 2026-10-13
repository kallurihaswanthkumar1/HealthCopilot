import React, { useState } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  FileText,
  Volume2,
  TrendingUp,
  Bot,
  Users,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  Stethoscope,
  Globe,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

export const LandingView: React.FC = () => {
  const { loginWithGoogle, loginWithFirebaseAuth, loading } = useAuth();
  const { lang, setLang, currentLanguageInfo, t } = useLanguage();
  const [langModalOpen, setLangModalOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithFirebaseAuth();
    } catch {
      await loginWithGoogle();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF0FD] via-[#F6F4FF] via-[#FAF8FF] to-[#EAE8FD] text-slate-900 flex flex-col justify-between relative overflow-hidden">
      {/* Ambient luminous background glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-300/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-indigo-100/70 bg-white/75 backdrop-blur-2xl sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <HeartPulse className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-900 bg-clip-text text-transparent">
                  HealthCopilot
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  AI VAULT
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLangModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-indigo-100 text-slate-700 hover:text-indigo-950 text-xs font-semibold shadow-xs backdrop-blur-md transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-violet-600" />
              <span>{currentLanguageInfo.nativeName}</span>
            </button>

            {/* Standard Continue with Google Top Action */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-indigo-100 text-indigo-900 text-xs font-semibold shadow-xs backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Personal Medical Intelligence • 14 Indian Languages • ABHA Ready</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {t('landingHeroTitle1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-700 via-indigo-600 to-purple-600">
                {t('landingHeroTitle2')}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              {t('landingHeroSubtitle')}
            </p>

            {/* Zero Leakage & ABDM Ready Banner */}
            <div className="p-4 rounded-2xl bg-white/85 border border-indigo-100 shadow-[0_12px_36px_-10px_rgba(99,102,241,0.08)] backdrop-blur-xl flex items-start gap-3.5 max-w-xl">
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-900">
                  {t('landingIsolationTitle')}
                </p>
                <p className="text-slate-500 leading-relaxed">
                  {t('landingIsolationDesc')}
                </p>
              </div>
            </div>

            {/* Core Capability Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                {
                  title: t('handwrittenRxOcr'),
                  desc: t('handwrittenRxOcrDesc'),
                },
                {
                  title: t('strictDocAlerts'),
                  desc: t('strictDocAlertsDesc'),
                },
                {
                  title: t('drSharmaVoiceDoctor'),
                  desc: t('drSharmaVoiceDoctorDesc'),
                },
                {
                  title: t('familyHealthProfiles'),
                  desc: t('familyHealthProfilesDesc'),
                },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/80 border border-indigo-100/80 backdrop-blur-md text-xs shadow-xs hover:border-violet-300 hover:shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{feat.title}</span>
                    <span className="text-slate-500 text-[11px]">{feat.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Google Sign-In Card with Depth & Glassmorphism */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl p-6 sm:p-8 bg-white/90 backdrop-blur-2xl border border-white/90 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.14)] space-y-6">
              {/* Highlight top border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 rounded-t-3xl" />

              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Continue with Google
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sign in with your Google account to access your private encrypted health vault, documents, and medical timeline.
                </p>
              </div>

              {/* Primary Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3.5 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-sm border border-slate-200/90 shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {loading ? 'Authenticating with Google...' : 'Continue with Google'}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  Protected by Google Sign-In & Firebase Authentication
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-100/70 bg-white/70 backdrop-blur-md py-4 text-center text-xs text-slate-500">
        <p>HealthCopilot • Private Health Vault • Educational guidance only. Consult your treating doctor for medical emergencies.</p>
      </footer>

      {/* Language Modal */}
      {langModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-indigo-100 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Select Indian Language</h3>
              <button
                onClick={() => setLangModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setLangModalOpen(false);
                  }}
                  className={`p-3 rounded-2xl text-left border cursor-pointer transition-all ${
                    lang === l.code
                      ? 'bg-violet-50 border-violet-300 text-violet-950 font-bold shadow-xs'
                      : 'bg-white/90 border-slate-200/80 hover:bg-violet-50/60 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm block">{l.nativeName}</span>
                  <span className="text-[11px] text-slate-500">{l.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
