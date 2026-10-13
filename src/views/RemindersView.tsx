import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Bell,
  BellRing,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { MedicineReminder, DrugInteractionWarning } from '../types/health';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const RemindersView: React.FC = () => {
  const { activeProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [warnings, setWarnings] = useState<DrugInteractionWarning[]>([]);
  const [loading, setLoading] = useState(true);

  // New Reminder Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newInstructions, setNewInstructions] = useState('Take with food');
  const [notificationStatus, setNotificationStatus] = useState<string>('default');

  const loadData = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const [rems, summary] = await Promise.all([
        api.getReminders(activeProfile.id),
        api.getHealthSummary(activeProfile.id),
      ]);
      setReminders(rems);

      // Check drug interactions among active medications
      if (summary.activeMedications && summary.activeMedications.length > 1) {
        const interactionRes = await api.checkInteractions(summary.activeMedications);
        setWarnings(interactionRes.warnings || []);
      }
    } catch (err) {
      console.error('Error loading reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, [activeProfile?.id]);

  const handleToggleTaken = async (reminderId: string, slotIndex: number) => {
    if (!activeProfile) return;
    try {
      await api.toggleReminder(reminderId, activeProfile.id, slotIndex);
      setReminders((prev) =>
        prev.map((r) => {
          if (r.id === reminderId) {
            const nextTaken = [...r.takenToday];
            nextTaken[slotIndex] = !nextTaken[slotIndex];
            return { ...r, takenToday: nextTaken };
          }
          return r;
        })
      );
    } catch (err) {
      console.error('Error toggling reminder:', err);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !newMedName.trim()) return;

    try {
      const created = await api.addReminder({
        profileId: activeProfile.id,
        medicationName: newMedName.trim(),
        dosage: newDosage.trim() || '1 tablet',
        times: [newTime],
        instructions: newInstructions,
      });

      setReminders((prev) => [...prev, created]);
      setNewMedName('');
      setNewDosage('');
      setShowAddForm(false);
    } catch (err) {
      alert('Failed to add reminder');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationStatus(perm);
      if (perm === 'granted') {
        new Notification('HealthCopilot Reminders Active', {
          body: 'You will receive reminders for scheduled medications on time.',
        });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-violet-600" />
            <span>{t('remindersTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('remindersSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notificationStatus !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'te' ? 'నోటిఫికేషన్ అలర్ట్‌లు ప్రారంభించండి' : 'Enable Browser Alerts'}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addMedication')}</span>
          </button>
        </div>
      </div>

      {/* Drug-Drug Interaction Warning Box (Core Feature 11) */}
      {warnings.length > 0 && (
        <section className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                {t('drugInteractionNotice')}
              </h3>
              <p className="text-xs text-amber-800/80">
                AI pharmacology review for {activeProfile?.name}&apos;s current active medications
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {warnings.map((w, idx) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border border-amber-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {w.drugA} ⚡ {w.drugB}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    w.severity === 'Severe' ? 'bg-rose-100 text-rose-800' :
                    w.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {w.severity} Precaution
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{w.description}</p>
                <div className="p-2.5 bg-violet-50 rounded-xl text-violet-900 font-medium">
                  <span className="font-bold block mb-0.5">Recommendation:</span>
                  <p>{w.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add Reminder Form */}
      {showAddForm && (
        <form onSubmit={handleAddReminder} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4 animate-in fade-in duration-150">
          <h3 className="font-bold text-sm text-slate-900">
            {t('addMedicationReminder')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('medicationName')}</label>
              <input
                type="text"
                required
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="e.g. Metformin, Amlodipine"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('dosage')}</label>
              <input
                type="text"
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
                placeholder="e.g. 500mg, 1 tablet"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('timingFrequency')}</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('specialInstructions')}</label>
              <input
                type="text"
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                placeholder="e.g. After breakfast with water"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
            >
              {t('saveReminder')}
            </button>
          </div>
        </form>
      )}

      {/* Today's Schedule Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-base text-slate-900">
              {t('todaysSchedule')}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {reminders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Pill className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>{t('noRemindersYet')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{rem.medicationName}</span>
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                      {rem.dosage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Times: {rem.times.join(', ')}</span>
                  </p>
                  {rem.instructions && (
                    <p className="text-[11px] text-slate-500 italic">{rem.instructions}</p>
                  )}
                </div>

                {/* Slots Checkboxes */}
                <div className="flex items-center gap-2">
                  {rem.times.map((time, idx) => {
                    const isTaken = rem.takenToday[idx] || false;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleTaken(rem.id, idx)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isTaken
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isTaken ? 'text-white' : 'text-slate-300'}`} />
                        <span>{time} ({isTaken ? t('markTaken') : t('markPending')})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
