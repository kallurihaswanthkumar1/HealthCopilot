import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { speech } from '../services/speech';
import { useLanguage } from '../context/LanguageContext';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  language?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  size = 'md',
}) => {
  const { lang } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        // Release mic stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        // Call Gemini 3.5 Transcribe
        if (audioBlob.size > 0) {
          setIsTranscribing(true);
          try {
            const transcript = await api.transcribeAudio(audioBlob);
            if (transcript) {
              onTranscript(transcript);
            }
          } catch (err) {
            console.warn('Gemini 3.5 Transcribe error, falling back:', err);
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('MediaRecorder access failed, trying speech recognition fallback:', err);
      // Fallback to Web Speech API
      const recog = speech.createRecognition(
        lang,
        (transcript, isFinal) => {
          if (transcript) onTranscript(transcript);
          if (isFinal) setIsRecording(false);
        },
        () => setIsRecording(false),
        () => setIsRecording(false)
      );
      if (recog.isSupported) {
        setIsRecording(true);
        recog.start();
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTranscribing}
      title={
        isTranscribing
          ? 'Transcribing with gemini-3.5-transcribe...'
          : isRecording
          ? 'Stop recording and transcribe'
          : 'Speak with microphone (gemini-3.5-transcribe)'
      }
      className={`relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${sizeClasses} ${
        isTranscribing
          ? 'bg-amber-500 text-white shadow-md'
          : isRecording
          ? 'bg-rose-500 text-white shadow-md ring-4 ring-rose-200 animate-pulse'
          : 'bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 border border-teal-200'
      } ${className}`}
    >
      {isTranscribing ? (
        <Loader2 className="w-4 h-4 animate-spin text-white" />
      ) : isRecording ? (
        <span className="relative flex items-center justify-center">
          <Mic className="w-5 h-5 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-300 rounded-full animate-ping" />
        </span>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};
