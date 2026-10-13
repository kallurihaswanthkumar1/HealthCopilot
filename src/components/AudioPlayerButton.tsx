import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { speech } from '../services/speech';
import { useLanguage, IndianLanguage } from '../context/LanguageContext';

interface AudioPlayerButtonProps {
  text: string;
  hindiText?: string;
  langOverride?: IndianLanguage;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'pill';
  size?: 'sm' | 'md';
}

export const AudioPlayerButton: React.FC<AudioPlayerButtonProps> = ({
  text,
  hindiText,
  langOverride,
  label,
  className = '',
  variant = 'secondary',
  size = 'md',
}) => {
  const { lang, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const effectiveLang = langOverride || lang;
  const contentToSpeak = (effectiveLang === 'hi' && hindiText) ? hindiText : text;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      speech.stop();
      setIsPlaying(false);
      return;
    }

    if (!contentToSpeak || contentToSpeak.trim() === '') return;

    setIsLoading(true);
    try {
      await speech.speak(
        contentToSpeak,
        effectiveLang,
        () => {
          setIsLoading(false);
          setIsPlaying(true);
        },
        () => {
          setIsPlaying(false);
          setIsLoading(false);
        }
      );
    } catch {
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (isPlaying) {
        speech.stop();
      }
    };
  }, [isPlaying]);

  const baseStyle =
    'inline-flex items-center gap-2 font-medium transition-all duration-150 cursor-pointer select-none rounded-lg focus:outline-none';

  const sizeStyle = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';

  let variantStyle = '';
  if (variant === 'primary') {
    variantStyle = isPlaying
      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm';
  } else if (variant === 'pill') {
    variantStyle = isPlaying
      ? 'bg-rose-100 text-rose-700 border border-rose-200 rounded-full'
      : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-full';
  } else if (variant === 'ghost') {
    variantStyle = isPlaying
      ? 'text-rose-600 hover:bg-rose-50'
      : 'text-slate-600 hover:text-teal-600 hover:bg-slate-100';
  } else {
    // secondary
    variantStyle = isPlaying
      ? 'bg-rose-50 text-rose-700 border border-rose-200'
      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs';
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      title={isPlaying ? 'Stop voice playback' : 'Read aloud with AI voice'}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="w-3.5 h-3.5 text-rose-600" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-teal-600" />
      )}

      {/* Animated wave bars when playing */}
      {isPlaying ? (
        <span className="flex items-center gap-0.5 h-3 px-0.5">
          <span className="w-0.5 h-2 bg-rose-500 animate-pulse rounded-full" />
          <span className="w-0.5 h-3.5 bg-rose-600 animate-bounce rounded-full delay-75" />
          <span className="w-0.5 h-1.5 bg-rose-500 animate-pulse rounded-full delay-150" />
        </span>
      ) : null}

      <span>
        {label || (isPlaying ? (effectiveLang === 'hi' ? 'रोकें' : 'Stop') : effectiveLang === 'hi' ? 'सुनें' : 'Speak')}
      </span>
    </button>
  );
};
