import { api } from './api';
import { IndianLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

export class SpeechService {
  private static instance = new SpeechService();
  private currentAudio: HTMLAudioElement | null = null;
  private isBrowserSpeaking: boolean = false;

  static async speak(
    text: string,
    lang: IndianLanguage = 'en',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return SpeechService.instance.speak(text, lang, onStart, onEnd);
  }

  static stop(): void {
    SpeechService.instance.stop();
  }

  // Clean clinical terminology for clear, dignified Indian physician pronunciation
  private sanitizeForIndianSpeech(text: string): string {
    return text
      .replace(/[*#_`~>\[\]\(\)]/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      // Medical expansions for natural pronunciation
      .replace(/\bmg\/dL\b/gi, 'milligrams per deciliter')
      .replace(/\bmmHg\b/gi, 'millimeters of mercury')
      .replace(/\bmIU\/L\b/gi, 'milli International Units per liter')
      .replace(/\bng\/mL\b/gi, 'nanograms per milliliter')
      .replace(/\bHbA1c\b/gi, 'H-B-A-one-C')
      .replace(/\bBP\b/gi, 'Blood Pressure')
      .replace(/\bTSH\b/gi, 'T-S-H')
      .replace(/\bFBS\b/gi, 'Fasting Blood Sugar')
      .replace(/\bPPBS\b/gi, 'Post-meal Blood Sugar')
      .replace(/\bRx\b/gi, 'Prescription')
      .replace(/\bTab\b/gi, 'Tablet')
      .replace(/\bCap\b/gi, 'Capsule')
      .replace(/\bOD\b/gi, 'once daily')
      .replace(/\bBD\b/gi, 'twice daily')
      .replace(/\bTDS\b/gi, 'three times daily')
      .replace(/\bSOS\b/gi, 'as needed')
      .replace(/\bDr\.\b/gi, 'Doctor')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Speak text with Indian doctor bedside cadence
  async speak(
    text: string,
    lang: IndianLanguage = 'en',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.stop();

    if (!text || text.trim() === '') return;

    onStart?.();

    const cleanText = this.sanitizeForIndianSpeech(text);

    // If text is short, try server TTS; otherwise or on fallback use optimized Web Speech
    try {
      const audioBase64 = await api.generateTTS(cleanText.slice(0, 350));
      if (audioBase64) {
        const audioSrc = `data:audio/wav;base64,${audioBase64}`;
        this.currentAudio = new Audio(audioSrc);
        this.currentAudio.onended = () => {
          this.currentAudio = null;
          onEnd?.();
        };
        this.currentAudio.onerror = () => {
          this.speakBrowser(cleanText, lang, onEnd);
        };
        await this.currentAudio.play();
        return;
      }
    } catch {
      // Fallback seamlessly to browser Web Speech API
    }

    this.speakBrowser(cleanText, lang, onEnd);
  }

  private speakBrowser(text: string, lang: IndianLanguage, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
    utterance.lang = langInfo.speechTag;

    // Senior Indian Consulting Doctor Cadence: gentle, calm, warm bedside presence, natural Indian accent pacing
    utterance.rate = 0.85;
    utterance.pitch = 0.95;

    // Search for best matching authentic Indian English / Hindi voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Priority 1: Exact matching Indian language tag (en-IN, hi-IN, te-IN, mr-IN, ta-IN, etc.)
      let matchedVoice = voices.find((v) => {
        const vl = v.lang.toLowerCase().replace('_', '-');
        return vl.includes(langInfo.speechTag.toLowerCase()) || vl.includes('en-in') || vl.includes('hi-in');
      });

      // Priority 2: Named Indian voices across browser voice engines (e.g., Ravi, Heera, Veena, Neerja, Kavya, Rishi, Google Indian)
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => {
          const n = v.name.toLowerCase();
          return (
            n.includes('india') ||
            n.includes('indian') ||
            n.includes('ravi') ||
            n.includes('heera') ||
            n.includes('veena') ||
            n.includes('neerja') ||
            n.includes('kavya') ||
            n.includes('rishi') ||
            n.includes('prabhat') ||
            n.includes('hindi')
          );
        });
      }

      // Priority 3: Fallback to warm English voice (en-GB, en-AU, or en-US)
      if (!matchedVoice && (lang === 'en' || !matchedVoice)) {
        matchedVoice = voices.find((v) => v.lang.toLowerCase().includes('en-gb') || v.lang.toLowerCase().includes('en'));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    this.isBrowserSpeaking = true;
    utterance.onend = () => {
      this.isBrowserSpeaking = false;
      onEnd?.();
    };
    utterance.onerror = () => {
      this.isBrowserSpeaking = false;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isBrowserSpeaking = false;
    }
  }

  isSpeaking(): boolean {
    return !!this.currentAudio || this.isBrowserSpeaking;
  }

  // Speech-to-Text Recognition with Indian language tags
  createRecognition(
    lang: IndianLanguage,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): { start: () => void; stop: () => void; isSupported: boolean } {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return {
        start: () => {},
        stop: () => {},
        isSupported: false,
      };
    }

    const recognition = new SpeechRecognition();
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
    recognition.lang = langInfo.speechTag;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onResult(final || interim, !!final);
    };

    recognition.onerror = (e: any) => {
      onError(e);
    };

    recognition.onend = () => {
      onEnd();
    };

    return {
      start: () => {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Recognition start error:', e);
        }
      },
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {
          console.warn('Recognition stop error:', e);
        }
      },
      isSupported: true,
    };
  }
}

export const speech = new SpeechService();
