import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  FileText,
  Calendar,
  Pill,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { MedicalDocument, DocumentType } from '../types/health';
import { AudioPlayerButton } from '../components/AudioPlayerButton';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface TimelineViewProps {
  onOpenDocument: (doc: MedicalDocument) => void;
  onNavigateUpload: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ onOpenDocument, onNavigateUpload }) => {
  const { activeProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [expandedDocIds, setExpandedDocIds] = useState<Set<string>>(new Set());

  const loadDocuments = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const docs = await api.getDocuments(activeProfile.id);
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeProfile?.id]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeProfile) return;
    if (confirm(lang === 'hi' ? 'क्या आप इस दस्तावेज़ को हटाना चाहते हैं?' : 'Are you sure you want to delete this document?')) {
      try {
        await api.deleteDocument(docId, activeProfile.id);
        setDocuments(documents.filter((d) => d.id !== docId));
      } catch (err) {
        alert('Failed to delete document.');
      }
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesType = selectedType === 'All' || doc.type === selectedType;
    const matchesQuery =
      searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.doctorName && doc.doctorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.clinicHospital && doc.clinicHospital.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.summaryEnglish && doc.summaryEnglish.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.medications && doc.medications.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (doc.labValues && doc.labValues.some((l) => l.testName.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesType && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-violet-600" />
            <span>{t('timelineTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('timelineSubtitle')}
          </p>
        </div>

        <button
          onClick={onNavigateUpload}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>+ {t('uploadRecordLauncher')}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white/85 backdrop-blur-2xl p-4 rounded-3xl border border-violet-100 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by medicine, test name, doctor, or keyword..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50/50"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'All', label: t('filterAll') },
              { id: 'Prescription', label: t('filterPrescription') },
              { id: 'Lab Report', label: t('filterLab') },
              { id: 'Diagnostic Report', label: t('filterDiagnostic') },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === type.id
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-violet-600" />
          <p>{t('loadingRecords')}</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-16 text-center bg-white/90 backdrop-blur-xl rounded-3xl border border-violet-100 p-8 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800 text-sm">
            {t('noRecordsMatch')}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t('noRecordsDesc')}
          </p>
          <button
            onClick={onNavigateUpload}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            {t('uploadFirstRecord')}
          </button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-violet-200/80">
          {filteredDocs.map((doc, idx) => {
            const isExpanded = expandedDocIds.has(doc.id);
            const hasAbnormal = doc.abnormalHighlights && doc.abnormalHighlights.length > 0;

            return (
              <div key={doc.id} className="relative group">
                {/* Timeline Node Point */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-4 border-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                    hasAbnormal ? 'bg-rose-500 text-white' : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Timeline Card */}
                <div
                  onClick={() => onOpenDocument(doc)}
                  className={`bg-white/90 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md ${
                    hasAbnormal ? 'border-rose-200/90 hover:border-rose-300' : 'border-violet-100 hover:border-violet-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            doc.type === 'Prescription'
                              ? 'bg-violet-100 text-violet-800'
                              : doc.type === 'Lab Report'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {doc.type}
                        </span>

                        {doc.isHandwritten && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            ✍️ Handwritten
                          </span>
                        )}

                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{doc.date}</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 group-hover:text-violet-700 transition-colors">
                        {doc.title}
                      </h3>

                      <p className="text-xs text-slate-500">
                        {doc.doctorName} • {doc.clinicHospital}
                      </p>
                    </div>

                    {/* Actions on Card */}
                    <div className="flex items-center gap-2 shrink-0">
                      <AudioPlayerButton
                        text={doc.summaryEnglish}
                        hindiText={doc.summaryHindi}
                        size="sm"
                        variant="ghost"
                        label={lang === 'hi' ? 'सुनें' : 'Listen'}
                      />

                      <button
                        type="button"
                        onClick={(e) => toggleExpand(doc.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(doc.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Snippet */}
                  <div className="pt-3 text-xs text-slate-700 leading-relaxed space-y-2">
                    <p>{lang === 'hi' && doc.summaryHindi ? doc.summaryHindi : doc.summaryEnglish}</p>

                    {/* Abnormal Alert Callout if present */}
                    {hasAbnormal && (
                      <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl text-rose-900 text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1 text-[11px] text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{lang === 'hi' ? 'असामान्य मान:' : 'Abnormal Test Highlights:'}</span>
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-rose-800 text-[11px]">
                          {doc.abnormalHighlights.map((hl, i) => (
                            <li key={i}>{hl}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Quick Tags Pills */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500">
                      {doc.medications && doc.medications.length > 0 && (
                        <span className="flex items-center gap-1 text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md">
                          <Pill className="w-3 h-3" />
                          <span>{doc.medications.length} Medications Prescribed</span>
                        </span>
                      )}

                      {doc.labValues && doc.labValues.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                          <Activity className="w-3 h-3" />
                          <span>{doc.labValues.length} Lab Parameters Tested</span>
                        </span>
                      )}

                      {doc.fileName && (
                        <span className="text-slate-400 text-[10px] truncate max-w-[200px]">
                          📎 {doc.fileName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                      {/* Medications list */}
                      {doc.medications && doc.medications.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-800">Medications:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {doc.medications.map((m, i) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <span className="font-bold text-slate-900">{m.name}</span> ({m.dosage})
                                <p className="text-slate-500 text-[11px]">{m.frequency} • {m.timing}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab values table */}
                      {doc.labValues && doc.labValues.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-800">Lab Results:</p>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                  <th className="p-2">Test</th>
                                  <th className="p-2">Value</th>
                                  <th className="p-2">Ref Range</th>
                                  <th className="p-2">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {doc.labValues.map((l, i) => (
                                  <tr key={i}>
                                    <td className="p-2 font-medium">{l.testName}</td>
                                    <td className="p-2 font-bold">{l.value} {l.unit}</td>
                                    <td className="p-2 text-slate-500">{l.referenceRange}</td>
                                    <td className="p-2">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        l.status === 'High' ? 'bg-rose-100 text-rose-800' :
                                        l.status === 'Low' ? 'bg-amber-100 text-amber-800' :
                                        'bg-emerald-100 text-emerald-800'
                                      }`}>
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
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
};
