import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Upload,
  Bot,
  Pill,
  Stethoscope,
  HeartPulse,
  TrendingUp,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Info,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { AudioPlayerButton } from '../components/AudioPlayerButton';
import { EmergencySOSCard } from '../components/EmergencySOSCard';
import { LabValue, Medication, MedicalDocument } from '../types/health';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenDocument: (doc: MedicalDocument) => void;
  onOpenLiveVoice?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenDocument,
  onOpenLiveVoice,
}) => {
  const { user, activeProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<{
    activeMedications: Medication[];
    latestLabs: LabValue[];
    diagnoses: string[];
    abnormalAlerts: any[];
    totalDocuments: number;
  }>({
    activeMedications: [],
    latestLabs: [],
    diagnoses: [],
    abnormalAlerts: [],
    totalDocuments: 0,
  });

  const [recentDocs, setRecentDocs] = useState<MedicalDocument[]>([]);

  const loadData = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const [summary, docs] = await Promise.all([
        api.getHealthSummary(activeProfile.id),
        api.getDocuments(activeProfile.id),
      ]);
      setSummaryData(summary);
      setRecentDocs(docs.slice(0, 4));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProfile?.id]);

  if (!activeProfile) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Patient Welcome & Vitals Banner with Luminous Lavender / Pearl Frosted Glassmorphism matching image.png */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white/95 via-violet-50/90 to-indigo-50/90 p-6 sm:p-8 text-slate-900 shadow-[0_16px_40px_-10px_rgba(99,102,241,0.1)] border border-white/80 backdrop-blur-2xl">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 -translate-y-12 w-64 h-64 bg-indigo-300/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-indigo-900 text-xs font-semibold border border-indigo-100 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>{t('privateVaultActive')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {t('welcomeUser', { name: activeProfile.name })}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {t('vaultSummaryDesc', {
                relationship: activeProfile.relationship,
                age: activeProfile.age,
                count: summaryData.totalDocuments,
              })}
            </p>
          </div>

          {/* Vitals Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs shrink-0">
            <div className="bg-white/85 backdrop-blur-md border border-indigo-100/80 rounded-2xl p-3 text-center shadow-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                {t('ageGender')}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900">
                {activeProfile.age}y • {activeProfile.gender.charAt(0)}
              </span>
            </div>

            <div className="bg-white/85 backdrop-blur-md border border-indigo-100/80 rounded-2xl p-3 text-center shadow-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                {t('bloodGroup')}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900">
                {activeProfile.bloodGroup || 'B+'}
              </span>
            </div>

            <div className="bg-white/85 backdrop-blur-md border border-indigo-100/80 rounded-2xl p-3 text-center shadow-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                {t('abhaId')}
              </span>
              <span className="text-xs font-bold text-violet-700 truncate block">
                {activeProfile.abhaLinked ? t('linked') : t('notLinked')}
              </span>
            </div>

            <div className="bg-white/85 backdrop-blur-md border border-indigo-100/80 rounded-2xl p-3 text-center shadow-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                {t('activeMeds')}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900">
                {summaryData.activeMedications.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency SOS Medical Card for this Account */}
      <EmergencySOSCard />

      {/* Live Voice Consultation with Dr. Arvind Sharma */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white/95 via-violet-50/90 to-purple-50/90 p-5 sm:p-6 text-slate-900 shadow-[0_12px_36px_-10px_rgba(139,92,246,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-violet-200/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-slate-900">
                {t('liveVoiceConsultTitle')}
              </h3>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                {t('seniorPhysicianIndia')}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {t('liveVoiceConsultDesc')}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLiveVoice}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{t('talkWithDrSharma')}</span>
        </button>
      </div>

      {/* Strict Document-Only Abnormal Value Alerts (No Unrelated Advice) */}
      {summaryData.abnormalAlerts.length > 0 ? (
        <section className="rounded-3xl p-6 bg-white/85 backdrop-blur-2xl border border-rose-200 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-rose-950 flex items-center gap-2">
                  <span>{t('abnormalFindingsTitle')}</span>
                  <span className="px-2 py-0.5 text-xs font-black bg-rose-500 text-white rounded-full">
                    {summaryData.abnormalAlerts.length}
                  </span>
                </h2>
                <p className="text-xs text-rose-800">
                  {t('abnormalFindingsSubtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('trends')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer self-start sm:self-auto"
            >
              <span>{t('viewTrendsRedFlags')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaryData.abnormalAlerts.map((alert: any, idx: number) => {
              const alertSpokenText = `Namaste ${activeProfile.name} ji. For ${alert.testName}, your recorded reading in ${alert.documentTitle || 'your document'} is ${alert.value} ${alert.unit}. Standard reference range is ${alert.referenceRange}. ${alert.explanationSimple || ''}. Guidance: ${alert.adviceSimple || 'Please discuss with your attending doctor during your next visit.'}`;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 hover:border-rose-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 mb-1">
                        {alert.status} • {alert.category || 'Laboratory'}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900">{alert.testName}</h3>
                      <p className="text-xs text-slate-500">
                        {t('source')}: {alert.documentTitle} ({alert.documentDate})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xl font-black text-rose-600 font-mono tabular-nums">
                        {alert.value}
                      </span>
                      <span className="text-xs font-bold text-rose-800 ml-1">
                        {alert.unit}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {t('ref')}: {alert.referenceRange}
                      </span>
                    </div>
                  </div>

                  {alert.explanationSimple && (
                    <div className="text-xs text-slate-700 bg-white/95 p-2.5 rounded-xl border border-rose-100 leading-relaxed">
                      <p className="font-bold text-slate-900 mb-0.5">
                        {t('whatThisMeans')}
                      </p>
                      <p>{alert.explanationSimple}</p>
                    </div>
                  )}

                  {alert.adviceSimple && (
                    <div className="text-xs text-indigo-900 bg-indigo-50/90 p-2.5 rounded-xl border border-indigo-200/60 leading-relaxed">
                      <p className="font-bold text-indigo-950 mb-0.5">
                        {t('physicianGuidance')}
                      </p>
                      <p>{alert.adviceSimple}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-rose-700 font-semibold">
                      {t('strictlyVerified')}
                    </span>
                    <AudioPlayerButton
                      text={alertSpokenText}
                      size="sm"
                      variant="secondary"
                      label={t('listenDrSharma')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* Zero State when no abnormal values exist */
        <div className="rounded-3xl p-6 bg-white/85 backdrop-blur-2xl border border-violet-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {t('noAbnormalFindings')}
              </h3>
              <p className="text-xs text-slate-500">
                {summaryData.totalDocuments > 0
                  ? t('allHealthyRanges')
                  : t('noReportsUploadedYet')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('uploadNewReport')}</span>
          </button>
        </div>
      )}

      {/* Quick Feature Launchers Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            tab: 'upload',
            title: t('uploadRecordLauncher'),
            subtitle: t('uploadRecordLauncherSub'),
            icon: Upload,
            color: 'bg-violet-50 text-violet-900 hover:bg-violet-100/80 border-violet-200',
          },
          {
            tab: 'chat',
            title: t('drSharmaLauncher'),
            subtitle: t('drSharmaLauncherSub'),
            icon: Bot,
            color: 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100/80 border-indigo-200',
          },
          {
            tab: 'trends',
            title: t('trendsLauncher'),
            subtitle: t('trendsLauncherSub'),
            icon: TrendingUp,
            color: 'bg-purple-50 text-purple-900 hover:bg-purple-100/80 border-purple-200',
          },
          {
            tab: 'reminders',
            title: t('remindersLauncher'),
            subtitle: t('remindersLauncherSub'),
            icon: Pill,
            color: 'bg-rose-50 text-rose-900 hover:bg-rose-100/80 border-rose-200',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigate(item.tab)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group backdrop-blur-md shadow-2xs hover:shadow-md ${item.color}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 shrink-0" />
                <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{item.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </section>

      {/* Recent Uploaded Documents List */}
      <section className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 border border-violet-100/80 shadow-[0_10px_35px_-10px_rgba(139,92,246,0.06)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-violet-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {t('recentUploadedDocs')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('extractedWithOcr')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('timeline')}
            className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1 cursor-pointer"
          >
            <span>{t('viewFullTimeline')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onOpenDocument(doc)}
                className="p-4 rounded-2xl bg-white/90 hover:bg-violet-50/60 border border-violet-100 hover:border-violet-300 transition-all cursor-pointer flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-800">
                      {doc.type}
                    </span>
                    <span className="text-[11px] text-slate-400">{doc.date}</span>
                    {doc.isHandwritten && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        {t('handwritten')}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-violet-900 truncate">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {lang === 'hi' ? (doc.summaryHindi || doc.summaryEnglish) : doc.summaryEnglish}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs space-y-2">
            <p>{t('noDocsYet')}</p>
            <button
              onClick={() => onNavigate('upload')}
              className="text-violet-600 font-bold hover:underline cursor-pointer"
            >
              {t('uploadFirstDoc')}
            </button>
          </div>
        )}
      </section>

      {/* Safety Disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
};
