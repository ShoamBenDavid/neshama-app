import * as Speech from 'expo-speech';
import { VoiceQuality, type Voice } from 'expo-speech';
import { getCurrentLanguage } from '../i18n';
import type { Language } from '../i18n';

// ---------------------------------------------------------------------------
// Language configuration
// ---------------------------------------------------------------------------

interface LanguageTTSConfig {
  locale: string;
  rate: number;
  pitch: number;
  voiceId?: string;
}

/** Slower rate and slightly lower pitch for a calmer delivery. */
const LANGUAGE_CONFIG: Record<Language, LanguageTTSConfig> = {
  en: { locale: 'en-US', rate: 0.78, pitch: 0.95 },
  he: { locale: 'he-IL', rate: 0.72, pitch: 0.95 },
};

const FALLBACK_LANGUAGE: Language = 'en';

const HEBREW_CHAR_REGEX = /[\u0590-\u05FF]/;

/** Prefer these voice names when multiple locales match (iOS Enhanced / Android neural). */
const PREFERRED_VOICE_NAMES: Record<Language, string[]> = {
  en: ['samantha', 'karen', 'moira', 'allison', 'tessa', 'susan', 'victoria'],
  he: ['carmit', 'hebrew'],
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let isSpeaking = false;
let speakGeneration = 0;
let voiceSelectionReady = false;
const selectedVoiceByLang: Partial<Record<Language, string>> = {};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function detectTextLanguage(text: string): Language | null {
  const sample = text.slice(0, 200);
  if (HEBREW_CHAR_REGEX.test(sample)) return 'he';
  return null;
}

function resolveLanguage(text: string, explicitLanguage?: string): Language {
  if (explicitLanguage) {
    if (explicitLanguage === 'he' || explicitLanguage === 'he-IL') return 'he';
    if (explicitLanguage === 'en' || explicitLanguage === 'en-US') return 'en';
  }

  const detected = detectTextLanguage(text);
  if (detected) return detected;

  return getCurrentLanguage();
}

function normalizeLangCode(code: string): string {
  return code.toLowerCase().replace('_', '-');
}

function matchesLanguage(voice: Voice, locale: string): boolean {
  const voiceLang = normalizeLangCode(voice.language);
  const target = normalizeLangCode(locale);
  const prefix = target.split('-')[0];
  return voiceLang === target || voiceLang.startsWith(`${prefix}-`) || voiceLang === prefix;
}

function scoreVoice(voice: Voice, lang: Language, locale: string): number {
  let score = 0;
  const voiceLang = normalizeLangCode(voice.language);
  const target = normalizeLangCode(locale);

  if (voice.quality === VoiceQuality.Enhanced) score += 100;

  if (voiceLang === target) score += 20;
  else if (voiceLang.startsWith(target.split('-')[0])) score += 10;

  const nameLower = voice.name.toLowerCase();
  for (let i = 0; i < PREFERRED_VOICE_NAMES[lang].length; i++) {
    if (nameLower.includes(PREFERRED_VOICE_NAMES[lang][i])) {
      score += 15 - i;
      break;
    }
  }

  if (nameLower.includes('neural') || nameLower.includes('network')) score += 8;
  if (voice.identifier.toLowerCase().includes('enhanced')) score += 5;

  return score;
}

function pickBestVoice(voices: Voice[], lang: Language, locale: string): string | undefined {
  const candidates = voices.filter((voice) => matchesLanguage(voice, locale));
  if (candidates.length === 0) return undefined;

  return [...candidates]
    .sort((a, b) => scoreVoice(b, lang, locale) - scoreVoice(a, lang, locale))[0]
    ?.identifier;
}

async function ensureVoiceSelection(): Promise<void> {
  if (voiceSelectionReady) return;
  voiceSelectionReady = true;

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    (['en', 'he'] as Language[]).forEach((lang) => {
      const locale = LANGUAGE_CONFIG[lang].locale;
      const voiceId = pickBestVoice(voices, lang, locale);
      if (voiceId) selectedVoiceByLang[lang] = voiceId;
    });
  } catch {
    // Fall back to system default voice for each locale.
  }
}

async function getValidatedConfig(lang: Language): Promise<LanguageTTSConfig> {
  await ensureVoiceSelection();

  const config = LANGUAGE_CONFIG[lang];
  const voiceId = selectedVoiceByLang[lang];

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const locales = new Set(voices.map((v) => v.language));

    if (locales.size === 0) {
      return voiceId ? { ...config, voiceId } : config;
    }

    if (locales.has(config.locale)) {
      return voiceId ? { ...config, voiceId } : config;
    }

    const prefix = config.locale.split('-')[0];
    for (const loc of locales) {
      if (loc.startsWith(prefix)) {
        return {
          ...config,
          locale: loc,
          voiceId: pickBestVoice(voices, lang, loc) ?? voiceId,
        };
      }
    }
  } catch {
    // Use configured locale and any cached voice.
  }

  if (voiceId) return { ...config, voiceId };
  return LANGUAGE_CONFIG[FALLBACK_LANGUAGE];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  language?: string;
  onDone?: () => void;
  onStart?: () => void;
  onPause?: () => void;
}

export function speakText(text: string, options?: SpeakOptions): void {
  Speech.stop();
  speakGeneration += 1;
  const token = speakGeneration;
  isSpeaking = true;

  const lang = resolveLanguage(text, options?.language);

  getValidatedConfig(lang).then((config) => {
    if (token !== speakGeneration) return;

    Speech.speak(text, {
      language: config.locale,
      ...(config.voiceId ? { voice: config.voiceId } : {}),
      rate: options?.rate ?? config.rate,
      pitch: options?.pitch ?? config.pitch,
      onStart: () => {
        if (token !== speakGeneration) return;
        isSpeaking = true;
        options?.onStart?.();
      },
      onDone: () => {
        if (token !== speakGeneration) return;
        isSpeaking = false;
        options?.onDone?.();
      },
      onStopped: () => {
        if (token !== speakGeneration) return;
        isSpeaking = false;
      },
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
  speakGeneration += 1;
  isSpeaking = false;
}

export function pauseSpeaking(): void {
  Speech.pause();
}

export function resumeSpeaking(): void {
  Speech.resume();
}

export function getIsSpeaking(): boolean {
  return isSpeaking;
}

export async function checkTTSAvailability(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch {
    return false;
  }
}

/**
 * Splits a script into paragraph-level segments for paced TTS delivery.
 * Works with both English and Hebrew punctuation.
 */
export function splitScriptIntoSegments(script: string): string[] {
  return script
    .split(/\n\n+/)
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => segment.trim());
}

export default {
  speakText,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  getIsSpeaking,
  checkTTSAvailability,
  splitScriptIntoSegments,
};
