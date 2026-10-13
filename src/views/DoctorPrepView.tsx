import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Printer,
  Sparkles,
  HelpCircle,
  Volume2,
  CheckCircle2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { DoctorPrepQuestion } from '../types/health';
import { AudioPlayerButton } from '../components/AudioPlayerButton';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const DoctorPrepView: React.FC = () => {
  const { activeProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [visitSummary, setVisitSummary] = useState('');
  const [questions, setQuestions] = useState<DoctorPrepQuestion[]>([]);

  const loadPrepQuestions = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const res = await api.getDoctorPrep(activeProfile.id);
      setVisitSummary(res.visitSummary || '');
      setQuestions(res.questions || []);
    } catch (err) {
      console.error('Error generating doctor questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrepQuestions();
  }, [activeProfile?.id]);

  const allQuestionsSpeechText = `Doctor Visit Preparation for ${activeProfile?.name}. Executive Summary: ${visitSummary}. Questions to ask: ` +
    questions.map((q, i) => `Question ${i + 1}: ${q.question}. Context: ${q.context}`).join('. ');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>{lang === 'te' ? 'వైద్య సంప్రదింపు సన్నాహక ఇంజిన్' : 'AI Consultation Prep Engine'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-violet-600" />
            <span>{t('doctorPrepTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500">
            {t('doctorPrepSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AudioPlayerButton
            text={allQuestionsSpeechText}
            variant="secondary"
            label={t('listenAll')}
          />

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printSheet')}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Card with Glassmorphism */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-violet-100/90 shadow-[0_10px_35px_-10px_rgba(139,92,246,0.06)] space-y-6 print:border-none print:shadow-none">
        {/* Patient Header Block */}
        <div className="border-b border-violet-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('customizedFor', { name: activeProfile?.name || '' })}</h2>
            <p className="text-xs text-slate-500">
              {t('ageGender')}: {activeProfile?.age}y • {activeProfile?.gender} | {t('bloodGroup')}: {activeProfile?.bloodGroup}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <span>{t('date')}: {new Date().toLocaleDateString()}</span>
            <span className="block font-semibold text-violet-700">HealthCopilot Clinical Brief</span>
          </div>
        </div>

        {/* Visit Executive Summary */}
        {visitSummary && (
          <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-100 text-xs text-slate-800 space-y-1">
            <span className="font-bold text-violet-900 uppercase text-[10px] tracking-wider block">
              {t('executiveSummary')}:
            </span>
            <p className="leading-relaxed">{visitSummary}</p>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-violet-600" />
            <span>{t('questionsToAsk')}</span>
          </h3>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-violet-600" />
              <span>{lang === 'te' ? 'తాజా రిపోర్టులను విశ్లేషిస్తోంది...' : 'Analyzing latest reports & synthesizing clinical questions...'}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-violet-100 text-xs space-y-2 hover:border-violet-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 shadow-2xs">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-800 bg-violet-100 px-2 py-0.2 rounded-md">
                          {q.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {q.question}
                        </h4>
                      </div>
                    </div>

                    <AudioPlayerButton
                      text={q.question}
                      size="sm"
                      variant="ghost"
                      label=""
                    />
                  </div>

                  <p className="text-slate-600 pl-7 text-[11px] leading-relaxed">
                    <span className="font-semibold text-slate-700">{t('rationale')} </span>
                    {q.context}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctor's Notes Blank Space for Printable View */}
        <div className="pt-4 border-t border-violet-100 space-y-2 print:block">
          <p className="text-xs font-bold text-slate-700">{lang === 'te' ? 'డాక్టర్ సూచనలు / మందుల మార్పులు:' : "Doctor's Notes / Prescription Changes:"}</p>
          <div className="h-24 border border-dashed border-violet-200 rounded-xl bg-violet-50/20" />
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
