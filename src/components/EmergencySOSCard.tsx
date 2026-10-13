import React, { useState, useEffect } from 'react';
import { PhoneCall, AlertTriangle, ShieldAlert, Edit2, Check, User, Heart, Hospital, Droplet, Save, Share2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const EmergencySOSCard: React.FC = () => {
  const { activeProfile, updateProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [hospital, setHospital] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSOS, setCopiedSOS] = useState(false);

  const getEmergencyMessage = () => {
    if (!activeProfile) return '';
    return `🚨 *EMERGENCY MEDICAL SOS ALERT - HealthCopilot* 🚨\n\n` +
      `*Patient:* ${activeProfile.name} (${activeProfile.age}y, ${activeProfile.gender})\n` +
      `*Blood Group:* ${bloodGroup || activeProfile.bloodGroup || 'Not specified'}\n` +
      `*Known Allergies:* ${(activeProfile.allergies || []).join(', ') || 'None recorded'}\n` +
      `*Chronic Conditions:* ${(activeProfile.chronicConditions || []).join(', ') || 'None recorded'}\n` +
      `*Emergency Contact:* ${contactName} (${contactRelation}) - ${contactPhone}\n` +
      `*Doctor / Hospital:* ${hospital} (Dr: ${doctorPhone})\n\n` +
      `_Immediate medical support requested._`;
  };

  const handleWhatsAppSOS = () => {
    const text = encodeURIComponent(getEmergencyMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopySOS = () => {
    navigator.clipboard.writeText(getEmergencyMessage());
    setCopiedSOS(true);
    setTimeout(() => setCopiedSOS(false), 2500);
  };

  // Sync with active profile changes
  useEffect(() => {
    if (activeProfile) {
      setContactName(activeProfile.emergencyContactName || '');
      setContactRelation(activeProfile.emergencyContactRelation || '');
      setContactPhone(activeProfile.emergencyContactPhone || activeProfile.phone || '');
      setDoctorPhone(activeProfile.primaryDoctorPhone || '');
      setHospital(activeProfile.hospitalPreference || '');
      setBloodGroup(activeProfile.bloodGroup || 'B+');
      setIsEditing(false);
    }
  }, [activeProfile?.id]);

  if (!activeProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(activeProfile.id, {
        emergencyContactName: contactName,
        emergencyContactRelation: contactRelation,
        emergencyContactPhone: contactPhone,
        primaryDoctorPhone: doctorPhone,
        hospitalPreference: hospital,
        bloodGroup: bloodGroup,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save emergency info:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl border border-rose-200/80 p-5 sm:p-6 shadow-[0_15px_35px_-8px_rgba(244,63,94,0.08)] space-y-4">
      {/* Glossy top illumination line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-violet-500 to-rose-500 opacity-80" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                {t('emergencySosCardTitle')}
              </h3>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {t('customizedFor', { name: activeProfile.name })}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {t('emergencyIceDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> {t('savedSuccess')}
            </span>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? t('cancel') : t('editContacts')}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form for this specific profile */
        <form onSubmit={handleSave} className="space-y-3 pt-1 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('emergencyContactName')}
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Amina Khan"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('relationshipToPatient', { name: activeProfile.name })}
              </label>
              <input
                type="text"
                value={contactRelation}
                onChange={(e) => setContactRelation(e.target.value)}
                placeholder="e.g. Spouse / Son / Daughter"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('emergencyPhone')}
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98..."
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('doctorHospitalPhone')}
              </label>
              <input
                type="text"
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                placeholder="+91 98..."
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('hospitalPreference')}
              </label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="e.g. Apollo / Fortis Hospital"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {t('bloodGroup')}
              </label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="e.g. B+, O+, AB+"
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? t('saving') : t('saveEmergencyDetails')}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Display Grid with Glassmorphic Depth */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Emergency Contact */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1.5 hover:border-rose-300 transition-all">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              {t('primaryEmergencyContact')}
            </span>
            <p className="text-sm font-black text-slate-900 truncate">
              {contactName || 'Not Set'} {contactRelation && `(${contactRelation})`}
            </p>
            {contactPhone ? (
              <a
                href={`tel:${contactPhone}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 pt-1"
              >
                <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                <span>{t('callNumber', { phone: contactPhone })}</span>
              </a>
            ) : (
              <span className="text-xs text-slate-400">{t('noPhoneAdded')}</span>
            )}
          </div>

          {/* Attending Doctor / Hospital */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1.5 hover:border-indigo-300 transition-all">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
              {t('doctorHospitalPreference')}
            </span>
            <p className="text-sm font-black text-slate-900 truncate">{hospital || t('hospitalPreference')}</p>
            {doctorPhone ? (
              <a
                href={`tel:${doctorPhone}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{t('callNumber', { phone: doctorPhone })}</span>
              </a>
            ) : (
              <span className="text-xs text-slate-400">{t('noHelplineAdded')}</span>
            )}
          </div>

          {/* Blood SOS & Ambulance */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 flex flex-col justify-between hover:border-amber-300 transition-all">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              {t('criticalBloodVitals')}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 text-xs font-black flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>{bloodGroup || activeProfile.bloodGroup}</span>
              </span>
              <span className="text-[11px] text-slate-600 truncate font-medium" title={(activeProfile.allergies || []).join(', ')}>
                {activeProfile.allergies && activeProfile.allergies.length > 0
                  ? t('allergiesLabel', { list: activeProfile.allergies.join(', ') })
                  : t('noKnownAllergies')}
              </span>
            </div>
            <a
              href="tel:108"
              className="text-[11px] font-extrabold text-amber-800 hover:text-amber-900 flex items-center gap-1 pt-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('nationalAmbulance')}</span>
            </a>
          </div>
        </div>
      )}

      {/* Quick 1-Tap SOS Dispatch & Broadcast Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>{t('activeForPatient', { name: activeProfile.name })}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySOS}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Copy patient emergency snapshot to clipboard"
          >
            {copiedSOS ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedSOS ? t('copiedSnapshot') : t('copySosInfo')}</span>
          </button>

          <button
            onClick={handleWhatsAppSOS}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            title="Send pre-formatted emergency medical snapshot via WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('broadcastWhatsAppSos')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
