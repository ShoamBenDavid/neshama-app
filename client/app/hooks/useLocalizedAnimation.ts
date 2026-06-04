import { useCallback, useMemo } from 'react';
import { useTranslation } from '../i18n';
import { speakText, stopSpeaking, getIsSpeaking } from '../services/tts';
import type { SpeakOptions } from '../services/tts';
import type { Language } from '../i18n';

export interface LocalizedAnimationContext {
  language: Language;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Speak text — language auto-detected from content + global setting. */
  speak: (text: string, options?: SpeakOptions) => void;
  /** Stop any active speech. */
  stop: () => void;
  /** Whether TTS is currently playing. */
  isSpeaking: () => boolean;
  /**
   * Horizontal direction multiplier for slide/motion animations.
   * LTR = 1 (normal), RTL = -1 (reversed).
   */
  directionMultiplier: 1 | -1;
  /** Logical 'start' alignment that works in both directions. */
  alignStart: 'flex-start' | 'flex-end';
  /** Logical 'end' alignment that works in both directions. */
  alignEnd: 'flex-start' | 'flex-end';
}

export function useLocalizedAnimation(): LocalizedAnimationContext {
  const { language, isRTL, t } = useTranslation();

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => speakText(text, options),
    [],
  );

  const stop = useCallback(() => stopSpeaking(), []);

  return useMemo(
    () => ({
      language,
      isRTL,
      t,
      speak,
      stop,
      isSpeaking: getIsSpeaking,
      directionMultiplier: isRTL ? -1 : 1,
      alignStart: isRTL ? 'flex-end' : 'flex-start',
      alignEnd: isRTL ? 'flex-start' : 'flex-end',
    }),
    [language, isRTL, t, speak, stop],
  );
}
