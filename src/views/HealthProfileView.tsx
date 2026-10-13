import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  ShieldCheck,
  Activity,
  Pill,
  HeartPulse,
  AlertTriangle,
  QrCode,
  Link,
  CheckCircle2,
  Edit3,
  Scale,
  Ruler,
  Droplet,
  Save,
  Phone,
  User,
  Calendar,
  Hospital,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { LabValue, Medication } from '../types/health';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { EmergencySOSCard } from '../components/EmergencySOSCard';

export const HealthProfileView: React.FC = () => {
  const { user, activeProfile, updateProfile, linkAbha } = useAuth();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<{
    activeMedications: Medication[];
    latestLabs: LabValue[];
    diagnoses: string[];
    abnormalAlerts: any[];
  }>({
    activeMedications: [],
    latestLabs: [],
    diagnoses: [],
    abnormalAlerts: [],
  });

  // Settings form states
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [allergiesInput, setAllergiesInput] = useState('');
  const [conditionsInput, setConditionsInput] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [hospital, setHospital] = useState('');
  const [abhaId, setAbhaId] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLinkingAbha, setIsLinkingAbha] = useState(false);

  // Sync state with activeProfile
  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name || user?.name || '');
      setAge(activeProfile.age || 30);
      setPhone(activeProfile.phone || '');
      setGender(activeProfile.gender || 'Male');
      setBloodGroup(activeProfile.bloodGroup || 'B+');
      setHeightCm(activeProfile.heightCm || 170);
      setWeightKg(activeProfile.weightKg || 70);
      setAllergiesInput((activeProfile.allergies || []).join(', '));
      setConditionsInput((activeProfile.chronicConditions || []).join(', '));
      setEmergencyName(activeProfile.emergencyContactName || '');
      setEmergencyRelation(activeProfile.emergencyContactRelation || '');
      setEmergencyPhone(activeProfile.emergencyContactPhone || '');
      setDoctorPhone(activeProfile.primaryDoctorPhone || '');
      setHospital(activeProfile.hospitalPreference || '');
      setAbhaId(activeProfile.abhaId || '');
    }
  }, [activeProfile?.id, user]);

  const loadData = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const summary = await api.getHealthSummary(activeProfile.id);
      setSummaryData(summary);
    } catch (err) {
      console.error('Error loading health profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProfile?.id]);

  if (!activeProfile) return null;

  // Real-time BMI calculation
  const heightM = heightCm > 0 ? heightCm / 100 : 1.7;
  const bmi = weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : '22.0';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedAllergies = allergiesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedConditions = conditionsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateProfile(activeProfile.id, {
        name,
        age: Number(age) || 30,
        phone,
        gender,
        bloodGroup,
        heightCm: Number(heightCm) || 170,
        weightKg: Number(weightKg) || 70,
        allergies: parsedAllergies,
        chronicConditions: parsedConditions,
        emergencyContactName: emergencyName,
        emergencyContactRelation: emergencyRelation,
        emergencyContactPhone: emergencyPhone,
        primaryDoctorPhone: doctorPhone,
        hospitalPreference: hospital,
        abhaId,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkAbhaClick = async () => {
    setIsLinkingAbha(true);
    try {
      await linkAbha(abhaId || undefined);
    } catch (err) {
      console.error('Failed to link ABHA ID:', err);
    } finally {
      setIsLinkingAbha(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/85 backdrop-blur-2xl border border-violet-100/80 shadow-[0_12px_36px_-10px_rgba(139,92,246,0.08)]">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <UserCheck className="w-6 h-6 text-violet-600" />
          <span>{t('unifiedProfileTitle')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {t('unifiedProfileSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account Summary & Emergency Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Identity & Account Card */}
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 border border-violet-100/90 shadow-[0_10px_35px_-10px_rgba(139,92,246,0.06)] space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-indigo-600/25 shrink-0">
                {name.charAt(0) || activeProfile.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
                    {activeProfile.relationship}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {user?.email || 'Authenticated User'}
                </p>
                {phone && (
                  <p className="text-xs font-semibold text-violet-700 mt-0.5">
                    {phone}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Vitals Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-center text-xs">
              <div className="p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  {t('ageGender')}
                </span>
                <span className="text-sm font-black text-slate-900">
                  {age}y • {gender.charAt(0)}
                </span>
              </div>

              <div className="p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  {t('bloodGroup')}
                </span>
                <span className="text-sm font-black text-rose-600">
                  {bloodGroup}
                </span>
              </div>

              <div className="p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  {t('weight')}
                </span>
                <span className="text-sm font-black text-slate-900">
                  {weightKg} kg
                </span>
              </div>

              <div className="p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  {t('bmi')}
                </span>
                <span className="text-sm font-black text-violet-700">
                  {bmi}
                </span>
              </div>
            </div>
          </div>

          {/* Ayushman Bharat (ABHA) Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-violet-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-48 h-48 bg-violet-500/15 rounded-full blur-2xl" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-violet-300" />
                <span className="text-xs uppercase tracking-widest font-black text-violet-300">
                  {t('abhaCardHeading')}
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeProfile.abhaLinked ? t('linkedBadge') : t('notLinked')}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-indigo-300 uppercase block font-semibold">
                {t('abhaId')}
              </span>
              <p className="text-lg font-mono tracking-wider font-extrabold text-white mt-0.5">
                {activeProfile.abhaId || '91-XXXX-XXXX-XXXX'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-indigo-200 border-t border-indigo-800/60">
              <span>{name}</span>
              <button
                type="button"
                onClick={handleLinkAbhaClick}
                disabled={isLinkingAbha}
                className="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] transition-all cursor-pointer"
              >
                {isLinkingAbha ? 'Linking...' : t('linkAbhaBtn')}
              </button>
            </div>
          </div>

          {/* Emergency SOS Card */}
          <EmergencySOSCard />
        </div>

        {/* Right Column: Full Demographic & Settings Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-violet-100/90 shadow-[0_12px_36px_-10px_rgba(139,92,246,0.08)] space-y-6"
          >
            <div className="flex items-center justify-between border-b border-violet-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {t('personalInfo')}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in or update demographic parameters for this account
                </p>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('settingsSaved')}</span>
                </div>
              )}
            </div>

            {/* Core Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-600" />
                  <span>{t('fullName')}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 font-semibold shadow-2xs"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-violet-600" />
                  <span>{t('phone')}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 font-semibold shadow-2xs"
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-violet-600" />
                  <span>{t('age')}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 font-semibold shadow-2xs"
                  required
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">
                  {t('gender')}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 font-semibold shadow-2xs cursor-pointer"
                >
                  <option value="Male">{t('male')}</option>
                  <option value="Female">{t('female')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>

              {/* Blood Group */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t('bloodGroup')}</span>
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 font-bold shadow-2xs cursor-pointer"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              {/* ABHA ID */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">
                  {t('abhaId')}
                </label>
                <input
                  type="text"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  placeholder={t('enterAbhaPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 font-mono shadow-2xs"
                />
              </div>

              {/* Height */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-violet-600" />
                  <span>{t('height')}</span>
                </label>
                <input
                  type="number"
                  min="50"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 font-semibold shadow-2xs"
                />
              </div>

              {/* Weight */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-violet-600" />
                  <span>{t('weight')}</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 font-semibold shadow-2xs"
                />
              </div>
            </div>

            {/* Medical Specifics */}
            <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">
                  {t('allergies')}
                </label>
                <input
                  type="text"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, Dust mites"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">
                  {t('chronicConditions')}
                </label>
                <input
                  type="text"
                  value={conditionsInput}
                  onChange={(e) => setConditionsInput(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Hypothyroidism"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 shadow-2xs"
                />
              </div>
            </div>

            {/* Emergency & Doctor Contacts Section */}
            <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Hospital className="w-4 h-4 text-violet-600" />
                <span>Emergency Contacts & Doctor Helpline</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    {t('emergencyContactName')}
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Contact Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    {t('relationshipToPatient', { name })}
                  </label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="Spouse / Parent / Sibling"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    {t('emergencyPhone')}
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    {t('doctorHospitalPhone')}
                  </label>
                  <input
                    type="tel"
                    value={doctorPhone}
                    onChange={(e) => setDoctorPhone(e.target.value)}
                    placeholder="Doctor Phone Number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    {t('hospitalPreference')}
                  </label>
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. Apollo Hospital / Care Hospital"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-violet-500 text-slate-900 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? t('saving') : t('saveSettings')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
