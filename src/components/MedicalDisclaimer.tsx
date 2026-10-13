import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MedicalDisclaimerProps {
  compact?: boolean;
  className?: string;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false, className = '' }) => {
  const { t } = useLanguage();

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50/80 border border-amber-200/60 px-2.5 py-1 rounded-md ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>
          {t('medicalDisclaimerShort')}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3 shadow-xs ${className}`}>
      <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
        <ShieldAlert className="w-4 h-4" />
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold text-amber-900">
          {t('medicalDisclaimerTitle')}
        </p>
        <p className="text-amber-800/90 leading-relaxed">
          {t('medicalDisclaimerFull')}
        </p>
      </div>
    </div>
  );
};
