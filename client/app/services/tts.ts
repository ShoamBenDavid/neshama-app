import * as Speech from 'expo-speech';
import { getCurrentLanguage } from '../i18n';
import type { Language } from '../i18n';

// ---------------------------------------------------------------------------
// Language configuration
// ---------------------------------------------------------------------------

interface LanguageTTSConfig {
  locale: string;
  rate: number;
  pitch: number;
}

const LANGUAGE_CONFIG: Record<Language, LanguageTTSConfig> = {
  en: { locale: 'en-US', rate: 0.85, pitch: 1.0 },
  he: { locale: 'he-IL', rate: 0.75, pitch: 1.0 },
};

const FALLBACK_LANGUAGE: Language = 'en';

const HEBREW_CHAR_REGEX = /[\u0590-\u05FF]/;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let isSpeaking = false;
let availableLocales: Set<string> | null = null;

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

async function ensureVoiceCache(): Promise<Set<string>> {
  if (availableLocales) return availableLocales;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    availableLocales = new Set(voices.map((v) => v.language));
  } catch {
    availableLocales = new Set();
  }
  return availableLocales;
}

async function getValidatedConfig(
  lang: Language,
): Promise<LanguageTTSConfig> {
  const config = LANGUAGE_CONFIG[lang];
  const locales = await ensureVoiceCache();

  if (locales.size === 0) return config;

  if (locales.has(config.locale)) return config;

  const prefix = config.locale.split('-')[0];
  for (const loc of locales) {
    if (loc.startsWith(prefix)) return { ...config, locale: loc };
  }

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
  isSpeaking = true;

  const lang = resolveLanguage(text, options?.language);

  getValidatedConfig(lang).then((config) => {
    Speech.speak(text, {
      language: config.locale,
      rate: options?.rate ?? config.rate,
      pitch: options?.pitch ?? config.pitch,
      onStart: () => {
        isSpeaking = true;
        options?.onStart?.();
      },
      onDone: () => {
        isSpeaking = false;
        options?.onDone?.();
      },
      onStopped: () => {
        isSpeaking = false;
      },
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
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
  const locales = await ensureVoiceCache();
  return locales.size > 0;
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
