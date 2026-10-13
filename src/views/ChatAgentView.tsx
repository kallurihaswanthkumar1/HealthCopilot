import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Volume2,
  Trash2,
  AlertCircle,
  FileText,
  Clock,
  RotateCcw,
  Stethoscope,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { ChatMessage } from '../types/health';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { AudioPlayerButton } from '../components/AudioPlayerButton';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const ChatAgentView: React.FC = () => {
  const { activeProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getInitialDoctorGreeting = (): ChatMessage => {
    const pName = activeProfile?.name || 'Patient';
    return {
      id: 'welcome_1',
      role: 'assistant',
      content: `Hello ${pName}! A very warm greeting to you. I am here as your personal consulting doctor.
      
Think of me as your family physician who knows your health history. How are you feeling today? 

Please feel free to ask me anything about your symptoms, everyday diet, medications, blood sugar, or test values. You can type or tap the microphone to speak with me directly!`,
      teluguContent: `నమస్కారం ${pName} గారు! నేను మీ వ్యక్తిగత వైద్యుడిని. ఈ రోజు మీ ఆరోగ్యం ఎలా ఉంది? మీకు ఏదైనా నొప్పి, లక్షణాలు లేదా రిపోర్టుల గురించి ఏమైనా అడగాలనుకుంటున్నారా? నాతో నిరభ్యంతరంగా చెప్పండి.`,
      hindiContent: `नमस्ते ${pName} जी! मैं आपका व्यक्तिगत चिकित्सक हूँ। आज आपका स्वास्थ्य कैसा है? आप अपने किसी भी लक्षण, दवाइयों या रिपोर्ट के बारे में मुझसे खुलकर पूछ सकते हैं।`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>([getInitialDoctorGreeting()]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || !activeProfile || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const history = messages.slice(-6);
      const res = await api.sendChatMessage(activeProfile.id, textToSend, history);

      const assistantMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        teluguContent: res.teluguReply,
        hindiContent: res.hindiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content:
          lang === 'te'
            ? 'దయచేసి క్షమించండి, నెట్‌వర్క్ సమస్య కారణంగా సమాచారం పొందలేకపోయాను. దయచేసి మళ్ళీ ప్రయత్నించండి.'
            : 'Please forgive me, I could not review your records at this instant. Kindly check your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([getInitialDoctorGreeting()]);
  };

  const sampleQuestions =
    lang === 'te'
      ? [
          'ఈ రోజు నాకు తలనొప్పిగా ఉంది, ఏమి చేయాలి?',
          'నా రక్తంలో షుగర్ స్థాయిలు ఎలా ఉన్నాయి?',
          'నేను ఆహారంలో ఎలాంటి జాగ్రత్తలు తీసుకోవాలి?',
          'రక్తపోటు (బీపీ) తగ్గడానికి సలహా ఇవ్వండి',
        ]
      : [
          'Doctor, I have had a headache since morning',
          'How are my recent blood sugar readings?',
          'What foods should I eat to improve cholesterol?',
          'Are there any side effects with my current medications?',
        ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto space-y-3">
      {/* Consultation Header */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-white/85 backdrop-blur-2xl border border-violet-100/90 shadow-[0_10px_35px_-10px_rgba(139,92,246,0.08)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-700 via-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/25">
              <Stethoscope className="w-6 h-6 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-slate-900">
                {t('chatWithDoctorTitle')}
              </h1>
              <span className="text-[10px] bg-violet-100 text-violet-900 font-extrabold px-2 py-0.5 rounded-full border border-violet-200">
                {t('doctorBadge')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {t('chatWithDoctorSubtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-violet-50 text-xs flex items-center gap-1 cursor-pointer transition-colors"
          title="Reset consultation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('clearChat')}</span>
        </button>
      </div>

      {/* Chat Messages Scrollable Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-3xl bg-violet-50/30 backdrop-blur-md border border-violet-100/60 shadow-inner">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const displayContent =
            lang === 'te' && msg.teluguContent
              ? msg.teluguContent
              : lang === 'hi' && msg.hindiContent
              ? msg.hindiContent
              : msg.content;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <Stethoscope className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-2xs space-y-2 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/20'
                    : 'bg-white/95 backdrop-blur-md text-slate-800 border border-violet-100/80 rounded-tl-xs shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{displayContent}</p>

                {/* Sources chip */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="font-bold text-slate-700 block mb-0.5">
                      {t('source')}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((s, idx) => (
                        <span
                          key={idx}
                          className="bg-violet-50 text-violet-800 px-2 py-0.5 rounded-full font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`flex items-center justify-between text-[10px] pt-1 ${
                    isUser ? 'text-violet-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <AudioPlayerButton
                      text={displayContent}
                      size="sm"
                      variant="ghost"
                      label={t('listenDr')}
                    />
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-2xl p-4 border border-violet-100 shadow-xs flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
              <span>{t('doctorThinking')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar shrink-0">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">
          {t('quickSuggestions')}
        </span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-white/80 hover:bg-violet-50 border border-violet-100/80 hover:border-violet-300 text-slate-700 transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box with Voice & Send */}
      <div className="bg-white/95 backdrop-blur-xl p-2.5 rounded-3xl border border-violet-100/90 shadow-md flex items-center gap-2 shrink-0">
        <VoiceInputButton
          onTranscript={(text) => handleSend(text)}
          language={lang}
          className="shrink-0"
        />

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('askDoctorPlaceholder')}
          className="flex-1 text-xs sm:text-sm bg-transparent px-2 text-slate-900 placeholder-slate-400 focus:outline-hidden"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputMessage.trim() || loading}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Safety Disclaimer Footer */}
      <div className="text-center text-[10px] text-slate-400 pb-1">
        {t('disclaimerText')}
      </div>
    </div>
  );
};
