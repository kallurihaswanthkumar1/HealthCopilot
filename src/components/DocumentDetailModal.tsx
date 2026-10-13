import React from 'react';
import {
  X,
  FileText,
  Calendar,
  User,
  Building,
  Pill,
  Activity,
  AlertTriangle,
  Sparkles,
  Download,
} from 'lucide-react';
import { MedicalDocument } from '../types/health';
import { AudioPlayerButton } from './AudioPlayerButton';
import { MedicalDisclaimer } from './MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';

interface DocumentDetailModalProps {
  document: MedicalDocument | null;
  onClose: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ document: doc, onClose }) => {
  const { lang } = useLanguage();

  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {doc.type}
              </span>
              {doc.isHandwritten && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  ✍️ Handwritten Rx
                </span>
              )}
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{doc.date}</span>
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{doc.title}</h2>
            <p className="text-xs text-slate-500">
              {doc.doctorName} • {doc.clinicHospital}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* AI Simple Language Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>{lang === 'hi' ? 'एआई स्वास्थ्य सारांश' : 'Simple Language AI Health Summary'}</span>
              </span>

              <AudioPlayerButton
                text={doc.summaryEnglish}
                hindiText={doc.summaryHindi}
                size="sm"
                variant="primary"
                label={lang === 'hi' ? 'सारांश सुनें' : 'Listen Summary'}
              />
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-slate-800 text-xs leading-relaxed space-y-2">
              <p>{doc.summaryEnglish}</p>
              {doc.summaryHindi && (
                <div className="pt-2 border-t border-teal-200/50 text-teal-950 font-medium">
                  <span className="text-[10px] text-teal-700 font-bold block mb-0.5">सरल हिंदी सारांश:</span>
                  <p>{doc.summaryHindi}</p>
                </div>
              )}
            </div>
          </div>

          {/* Abnormal Highlights */}
          {doc.abnormalHighlights && doc.abnormalHighlights.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1.5">
              <p className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Abnormal Values & Findings</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-rose-800">
                {doc.abnormalHighlights.map((hl, i) => (
                  <li key={i}>{hl}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted Medications */}
          {doc.medications && doc.medications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                <span>Prescribed Medications ({doc.medications.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {doc.medications.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                        {m.dosage}
                      </span>
                    </div>
                    <p className="text-slate-600">{m.frequency} • {m.timing}</p>
                    {m.instructions && (
                      <p className="text-[11px] text-slate-500 italic">{m.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Lab Parameters */}
          {doc.labValues && doc.labValues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Extracted Lab Values ({doc.labValues.length})</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Test</th>
                      <th className="p-2.5">Result</th>
                      <th className="p-2.5">Ref Range</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doc.labValues.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-900">{l.testName}</td>
                        <td className="p-2.5 font-bold">{l.value} {l.unit}</td>
                        <td className="p-2.5 text-slate-500">{l.referenceRange}</td>
                        <td className="p-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              l.status === 'High'
                                ? 'bg-rose-100 text-rose-800'
                                : l.status === 'Low'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {l.status}
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
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>File: {doc.fileName}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
