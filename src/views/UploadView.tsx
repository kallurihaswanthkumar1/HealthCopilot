import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Eye,
  Volume2,
  Pill,
  Activity,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { DocumentType, MedicalDocument } from '../types/health';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { AudioPlayerButton } from '../components/AudioPlayerButton';

interface UploadViewProps {
  onDocumentAdded: (doc: MedicalDocument) => void;
  onOpenDocument: (doc: MedicalDocument) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onDocumentAdded, onOpenDocument }) => {
  const { activeProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [docType, setDocType] = useState<DocumentType>('Prescription');
  const [docTitle, setDocTitle] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    base64: string;
    previewUrl?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDoc, setSuccessDoc] = useState<MedicalDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError(
        lang === 'te'
          ? 'ఫైల్ పరిమాణం 20MB కంటే తక్కువగా ఉండాలి.'
          : lang === 'hi'
          ? 'फ़ाइल का आकार 20MB से कम होना चाहिए।'
          : 'File size must be under 20MB.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSelectedFile({
        name: file.name,
        type: file.type || 'application/pdf',
        base64: base64Data,
        previewUrl: file.type.startsWith('image/') ? result : undefined,
      });

      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setError(null);
    };
    reader.onerror = () => {
      setError(
        lang === 'te'
          ? 'ఫైల్ చదవడం విఫలమైంది.'
          : 'Failed to read file.'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    if (!selectedFile) {
      setError(
        lang === 'te'
          ? 'దయచేసి అప్‌లోడ్ చేయడానికి ఫైల్‌ను ఎంచుకోండి.'
          : lang === 'hi'
          ? 'कृपया अपलोड करने के लिए फ़ाइल चुनें।'
          : 'Please select a file to upload.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessDoc(null);

    try {
      const doc = await api.uploadDocument({
        profileId: activeProfile.id,
        title: docTitle || `${docType} - ${docDate}`,
        type: docType,
        date: docDate,
        base64Data: selectedFile.base64,
        mimeType: selectedFile.type,
      });

      setSuccessDoc(doc);
      onDocumentAdded(doc);
      setSelectedFile(null);
      setDocTitle('');
    } catch (err: any) {
      setError(err.message || 'Failed to upload and analyze document.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (sampleType: 'rx' | 'lab' | 'cardio') => {
    if (!activeProfile) return;
    setLoading(true);
    setError(null);
    setSuccessDoc(null);

    try {
      const res = await api.seedSampleDocument(activeProfile.id, sampleType);
      setSuccessDoc(res.document);
      onDocumentAdded(res.document);
    } catch (err: any) {
      setError(err.message || 'Failed to seed sample record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Upload className="w-6 h-6 text-violet-600" />
          <span>{t('uploadMedicalRecord')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('uploadSubtitle', { name: activeProfile?.name || '' })}
        </p>
      </div>

      {/* Quick Test Sample Loaders */}
      <div className="bg-violet-50/50 border border-violet-100 rounded-3xl p-5 space-y-2 backdrop-blur-md">
        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span>{t('quickDemo')}</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleLoadSample('rx')}
            disabled={loading}
            className="p-3.5 bg-white/90 hover:bg-violet-50/60 border border-violet-100 rounded-2xl text-left transition-all cursor-pointer shadow-2xs group"
          >
            <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              Handwritten Rx
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-violet-700">
              Dr. Suresh Joshi (Augmentin & Cough)
            </p>
            <p className="text-[11px] text-slate-500">Antibiotic & antihistamine extraction</p>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample('lab')}
            disabled={loading}
            className="p-3.5 bg-white/90 hover:bg-violet-50/60 border border-violet-100 rounded-2xl text-left transition-all cursor-pointer shadow-2xs group"
          >
            <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Lab Report
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-violet-700">
              Thyrocare Thyroid & Vitamin D Panel
            </p>
            <p className="text-[11px] text-slate-500">Elevated TSH & severe Vitamin D alert</p>
          </button>

          <button
            type="button"
            onClick={() => handleLoadSample('cardio')}
            disabled={loading}
            className="p-3.5 bg-white/90 hover:bg-violet-50/60 border border-violet-100 rounded-2xl text-left transition-all cursor-pointer shadow-2xs group"
          >
            <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Diagnostic Report
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-violet-700">
              Care Heart Hospital 2D Echo
            </p>
            <p className="text-[11px] text-slate-500">LVEF 62% & Left ventricular changes</p>
          </button>
        </div>
      </div>

      {/* Main Upload Form with Glassmorphic Depth */}
      <form onSubmit={handleUploadSubmit} className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-violet-100/90 shadow-[0_10px_35px_-10px_rgba(139,92,246,0.06)] space-y-6">
        {/* Document Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {t('docCategory')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Prescription', 'Lab Report', 'Discharge Summary', 'Diagnostic Report'] as DocumentType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDocType(type)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                  docType === type
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-xs'
                    : 'bg-violet-50/30 hover:bg-violet-50 text-slate-700 border-violet-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Drag & Drop Upload Area */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {t('uploadFileLabel')}
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-violet-500 bg-violet-50/40'
                : 'border-violet-200 hover:border-violet-500 bg-violet-50/20 hover:bg-violet-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    Ready for OCR processing • Click to replace
                  </p>
                </div>
                {selectedFile.previewUrl && (
                  <img
                    src={selectedFile.previewUrl}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded-lg shadow-xs border border-violet-100"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mx-auto shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    {t('dragDropOrBrowse')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('supportFormats')}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('handwrittenRxOcr')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title and Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('documentTitle')}
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Apollo Diabetes Consultation"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('dateOfRecord')}
            </label>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedFile}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
            loading || !selectedFile
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-indigo-600/20 hover:shadow-md'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {t('analyzingDocument')}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {t('analyzeWithGemini')}
              </span>
            </>
          )}
        </button>
      </form>

      {/* Success Live Extraction Card */}
      {successDoc && (
        <section className="bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-md space-y-6 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {lang === 'te' ? 'విజయవంతంగా సేకరించబడింది' : 'Successfully Extracted'}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{successDoc.title}</h3>
                <p className="text-xs text-slate-500">
                  {successDoc.doctorName} • {successDoc.clinicHospital} • {successDoc.date}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AudioPlayerButton
                text={
                  lang === 'te' && (successDoc as any).summaryTelugu
                    ? (successDoc as any).summaryTelugu
                    : successDoc.summaryEnglish
                }
                hindiText={successDoc.summaryHindi}
                variant="primary"
                label={lang === 'te' ? 'సారాంశం వినండి' : lang === 'hi' ? 'सारांश सुनें' : 'Listen Summary'}
              />
              <button
                type="button"
                onClick={() => onOpenDocument(successDoc)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                {lang === 'te' ? 'పూర్తి రికార్డు చూడండి' : lang === 'hi' ? 'पूरा रिकॉर्ड देखें' : 'View Full Record'}
              </button>
            </div>
          </div>

          {/* AI Simple Language Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>
                {lang === 'te'
                  ? 'సరళమైన భాషలో ఆరోగ్య సారాంశం'
                  : lang === 'hi'
                  ? 'सरल भाषा में स्वास्थ्य सारांश'
                  : 'Simple Language AI Health Summary'}
              </span>
            </h4>
            <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 text-slate-800 text-xs leading-relaxed space-y-2">
              <p>
                {lang === 'te' && (successDoc as any).summaryTelugu
                  ? (successDoc as any).summaryTelugu
                  : successDoc.summaryEnglish}
              </p>
              {lang !== 'te' && successDoc.summaryHindi && (
                <div className="pt-2 border-t border-violet-200/50 text-violet-950 font-medium">
                  <span className="text-[11px] text-violet-700 font-bold block mb-0.5">सरल हिंदी सारांश:</span>
                  <p>{successDoc.summaryHindi}</p>
                </div>
              )}
            </div>
          </div>

          {/* Abnormal Highlights */}
          {successDoc.abnormalHighlights && successDoc.abnormalHighlights.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1.5">
              <p className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>
                  {lang === 'te'
                    ? 'అసాధారణ ఫలితాల ముఖ్యాంశాలు (Red-Flag Values)'
                    : lang === 'hi'
                    ? 'असामान्य जांच बिंदु (Red-Flag Values)'
                    : 'Abnormal Findings Highlighted'}
                </span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-rose-800">
                {successDoc.abnormalHighlights.map((hl, i) => (
                  <li key={i}>{hl}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted Medications */}
          {successDoc.medications && successDoc.medications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-violet-600" />
                <span>
                  {lang === 'te'
                    ? 'సేకరించిన మందుల వివరాలు'
                    : lang === 'hi'
                    ? 'पर्चे से निकाली गई दवाएं'
                    : 'Extracted Medications'}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {successDoc.medications.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-violet-50/40 border border-violet-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-[10px] bg-violet-100 text-violet-800 font-bold px-1.5 py-0.2 rounded">
                        {m.dosage}
                      </span>
                    </div>
                    <p className="text-slate-600">{m.frequency} • {m.timing}</p>
                    {m.instructions && <p className="text-[11px] text-slate-500 italic">{m.instructions}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Lab Values */}
          {successDoc.labValues && successDoc.labValues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-violet-600" />
                <span>
                  {lang === 'te'
                    ? 'ల్యాబ్ పరీక్షల విలువలు'
                    : lang === 'hi'
                    ? 'प्रयोगशाला जांच मान'
                    : 'Extracted Lab Parameters'}
                </span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-violet-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-violet-50/60 text-slate-600 font-semibold border-b border-violet-100">
                    <tr>
                      <th className="p-2.5">{lang === 'te' ? 'పరీక్ష పేరు' : 'Test Name'}</th>
                      <th className="p-2.5">{lang === 'te' ? 'ఫలితం' : 'Result'}</th>
                      <th className="p-2.5">{lang === 'te' ? 'సాధారణ పరిధి' : 'Ref Range'}</th>
                      <th className="p-2.5">{lang === 'te' ? 'స్థితి' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50">
                    {successDoc.labValues.map((lab, i) => (
                      <tr key={i} className="hover:bg-violet-50/30">
                        <td className="p-2.5 font-medium text-slate-900">{lab.testName}</td>
                        <td className="p-2.5 font-bold">{lab.value} {lab.unit}</td>
                        <td className="p-2.5 text-slate-500">{lab.referenceRange}</td>
                        <td className="p-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            lab.status === 'High' ? 'bg-rose-100 text-rose-800' :
                            lab.status === 'Low' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {lab.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <MedicalDisclaimer />
        </section>
      )}
    </div>
  );
};
