import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Activity,
  AlertCircle,
  Stethoscope,
  Send,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SpeechService } from '../services/speech';
import { MedicalDisclaimer } from './MedicalDisclaimer';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
}

interface Message {
  sender: 'user' | 'doctor';
  text: string;
  time: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  patientName = 'Patient',
}) => {
  const { lang, t } = useLanguage();
  const { activeProfile } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [history, setHistory] = useState<Message[]>([]);

  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const transcriptBufferRef = useRef<string>('');
  const silenceTimeoutRef = useRef<any>(null);
  const watchdogTimeoutRef = useRef<any>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isProcessing, currentTranscript]);

  // Initial Doctor Greeting upon opening
  useEffect(() => {
    if (isOpen) {
      const initialGreeting =
        lang === 'te'
          ? `నమస్కారం ${patientName} గారు! నేను మీ వ్యక్తిగత వైద్యుడిని. ఈ రోజు మీ ఆరోగ్యం ఎలా ఉంది? మీకు ఏదైనా నొప్పి, లక్షణాలు లేదా రిపోర్టుల గురించి ఏమైనా అడగాలనుకుంటున్నారా? నాతో నిరభ్యంతరంగా చెప్పండి.`
          : lang === 'hi'
          ? `नमस्ते ${patientName} जी! मैं आपका पारिवारिक चिकित्सक हूँ। आज आपकी तबीयत कैसी है? कोई भी लक्षण या रिपोर्ट के बारे में मुझसे पूछें।`
          : `Hello ${patientName}! I am right here with you as your personal consulting doctor. How are you feeling today? Tell me what is on your mind—any symptoms, everyday routine, or reports you want to discuss?`;

      setHistory([
        {
          sender: 'doctor',
          text: initialGreeting,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      speakDoctor(initialGreeting);
    } else {
      stopAllAudio();
    }
  }, [isOpen, lang]);

  const stopAllAudio = () => {
    SpeechService.stop();
    setIsSpeaking(false);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (watchdogTimeoutRef.current) {
      clearTimeout(watchdogTimeoutRef.current);
      watchdogTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const speakDoctor = (text: string) => {
    setIsSpeaking(true);
    SpeechService.speak(
      text,
      lang,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const startListening = () => {
    if (isSpeaking) {
      SpeechService.stop();
      setIsSpeaking(false);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        lang === 'te'
          ? 'మీ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ అందుబాటులో లేదు. దయచేసి క్రింద టైప్ చేయండి.'
          : 'Speech Recognition is not supported in this browser. Please use the text input below.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setCurrentTranscript('');
        transcriptBufferRef.current = '';

        // Safety watchdog: If no speech input detected after 6.5 seconds, gracefully reset
        if (watchdogTimeoutRef.current) clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = setTimeout(() => {
          if (!transcriptBufferRef.current.trim() && !isProcessing) {
            try { recognition.stop(); } catch {}
            setIsListening(false);
          }
        }, 6500);
      };

      recognition.onresult = (event: any) => {
        if (watchdogTimeoutRef.current) {
          clearTimeout(watchdogTimeoutRef.current);
          watchdogTimeoutRef.current = null;
        }

        let combinedText = '';
        let isFinalResult = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          combinedText += chunk;
          if (event.results[i].isFinal) {
            isFinalResult = true;
          }
        }

        const text = combinedText.trim();
        if (text) {
          transcriptBufferRef.current = text;
          setCurrentTranscript(text);

          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

          if (isFinalResult) {
            handleUserUtterance(text);
          } else {
            // Auto dispatch after 1.1s of quiet pause
            silenceTimeoutRef.current = setTimeout(() => {
              if (transcriptBufferRef.current.trim()) {
                handleUserUtterance(transcriptBufferRef.current);
              }
            }, 1100);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (watchdogTimeoutRef.current) clearTimeout(watchdogTimeoutRef.current);
        setIsListening(false);
        if (transcriptBufferRef.current.trim() && !isProcessing) {
          handleUserUtterance(transcriptBufferRef.current);
        }
      };

      recognition.onend = () => {
        if (watchdogTimeoutRef.current) clearTimeout(watchdogTimeoutRef.current);
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        if (transcriptBufferRef.current.trim() && !isProcessing) {
          handleUserUtterance(transcriptBufferRef.current);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (watchdogTimeoutRef.current) clearTimeout(watchdogTimeoutRef.current);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (transcriptBufferRef.current.trim() && !isProcessing) {
      handleUserUtterance(transcriptBufferRef.current);
    }
  };

  const handleUserUtterance = async (speechText: string) => {
    const textToSend = speechText.trim();
    if (!textToSend || isProcessing) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (watchdogTimeoutRef.current) clearTimeout(watchdogTimeoutRef.current);
    setIsListening(false);
    setCurrentTranscript('');
    transcriptBufferRef.current = '';

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const profileId = activeProfile?.id || `prof_${patientName}`;
      const conversationHistory = history.map((h) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text,
      }));

      const res = await api.sendChatMessage(profileId, textToSend, conversationHistory);

      const doctorReply =
        lang === 'te' && res.teluguReply
          ? res.teluguReply
          : lang === 'hi' && res.hindiReply
          ? res.hindiReply
          : res.reply;

      const docMsg: Message = {
        sender: 'doctor',
        text: doctorReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [...prev, docMsg]);
      speakDoctor(doctorReply);
    } catch (err) {
      console.error('Doctor consultation error:', err);
      const fallbackMsg: Message = {
        sender: 'doctor',
        text:
          lang === 'te'
            ? 'దయచేసి క్షమించండి, నెట్‌వర్క్ సమస్య కారణంగా వినలేకపోయాను. దయచేసి మళ్ళీ అడగండి.'
            : 'Please excuse me, I had trouble connecting. Please feel free to ask again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory((prev) => [...prev, fallbackMsg]);
      speakDoctor(fallbackMsg.text);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const text = manualInput;
    setManualInput('');
    handleUserUtterance(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-violet-100/90 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/25">
              <Stethoscope className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  {t('voiceModalTitle')}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                  {t('doctorBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {t('voiceModalSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Voice Animated Visualizer Wave */}
        <div className="py-4 flex flex-col items-center justify-center shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Multi-layered Pulsing Audio Wave Rings */}
            {(isListening || isSpeaking || isProcessing) && (
              <>
                <div
                  className={`absolute w-32 h-32 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-rose-400/25 scale-125 animate-ping'
                      : isSpeaking
                      ? 'bg-violet-400/25 scale-125 animate-ping'
                      : 'bg-indigo-300/20 animate-pulse'
                  }`}
                />
                <div
                  className={`absolute w-24 h-24 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-rose-300/40 animate-pulse'
                      : isSpeaking
                      ? 'bg-violet-300/40 animate-pulse'
                      : 'bg-indigo-200/30'
                  }`}
                />
              </>
            )}

            {/* Core Interactive Doctor Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer z-10 ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-500 to-rose-600 text-white shadow-rose-500/40 scale-105'
                  : isSpeaking
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-violet-600/40 scale-105'
                  : isProcessing
                  ? 'bg-indigo-600 text-white animate-pulse'
                  : 'bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-indigo-600/30 hover:scale-105'
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : isSpeaking ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : isProcessing ? (
                <Sparkles className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Status Capsule Indicator */}
          <div className="text-center mt-3 space-y-1">
            <span
              className={`inline-block text-xs font-black px-3 py-1 rounded-full shadow-2xs ${
                isListening
                  ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                  : isSpeaking
                  ? 'bg-violet-100 text-violet-800 border border-violet-200'
                  : isProcessing
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {isListening
                ? t('doctorListening')
                : isSpeaking
                ? t('doctorSpeaking')
                : isProcessing
                ? t('doctorThinking')
                : t('tapToSpeak')}
            </span>

            {currentTranscript && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold text-rose-700 max-w-sm mx-auto italic truncate">
                  "{currentTranscript}..."
                </p>
                <button
                  type="button"
                  onClick={() => handleUserUtterance(currentTranscript)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold shadow-sm transition-all cursor-pointer animate-pulse"
                >
                  <Send className="w-3 h-3" />
                  <span>{lang === 'te' ? 'సమాధానం చెప్పండి ✓' : 'Get Answer ✓'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Conversation Stream Box */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50/70 rounded-2xl border border-slate-200/70 min-h-[160px] max-h-[260px]">
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-violet-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-slate-200/40 text-[10px] opacity-75">
                  <span className="font-bold">
                    {msg.sender === 'user' ? patientName : t('doctorBadge')}
                  </span>
                  <span>{msg.time}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatScrollRef} />
        </div>

        {/* Quick Voice Consultation Starter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-400 shrink-0">
            {lang === 'te' ? 'త్వరిత ప్రశ్నలు:' : 'Quick questions:'}
          </span>
          {(lang === 'te'
            ? [
                'నాకు తలనొప్పిగా ఉంది, ఏమి చేయాలి?',
                'నా రక్తంలో షుగర్ స్థాయి ఎలా ఉంది?',
                'ఆహారంలో ఎలాంటి జాగ్రత్తలు తీసుకోవాలి?',
              ]
            : [
                'Doctor, I have had a headache today',
                'How are my recent blood sugar readings?',
                'What food should I eat to stay healthy?',
              ]
          ).map((topic, i) => (
            <button
              key={i}
              type="button"
              disabled={isProcessing}
              onClick={() => handleUserUtterance(topic)}
              className="text-[10px] font-medium bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-indigo-100/80 cursor-pointer disabled:opacity-50"
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Bottom Input & Quick Voice Actions */}
        <div className="pt-2 border-t border-slate-100 shrink-0 space-y-2.5">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={t('askDoctorPlaceholder')}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-violet-500 bg-white shadow-2xs"
            />

            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600'
                  : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
              }`}
              title="Microphone input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!manualInput.trim() || isProcessing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('send')}</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('disclaimerText')}</span>
            {isSpeaking && (
              <button
                onClick={stopAllAudio}
                className="text-violet-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Mute Doctor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
