import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { I18nManager, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from './translations';
import { Language, LanguageContextType } from './types';
import { isRTLLanguage } from './rtl';

const LANGUAGE_STORAGE_KEY = '@neshama_language';
const DEFAULT_LANGUAGE: Language = 'he';
/** Used when a key is missing in the active locale (Hebrew is the primary UI default). */
const TRANSLATION_FALLBACK_LANGUAGE: Language = 'en';

let _currentLanguage: Language = DEFAULT_LANGUAGE;

/** Readable outside of React (e.g. from plain service modules like TTS). */
export function getCurrentLanguage(): Language {
  return _currentLanguage;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: string) => key,
  isRTL: true,
});

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key] != null ? String(params[key]) : `{{${key}}}`;
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
      const lang: Language =
        stored === 'en' || stored === 'he' ? stored : DEFAULT_LANGUAGE;
      setLanguageState(lang);
      _currentLanguage = lang;
      I18nManager.allowRTL(isRTLLanguage(lang));
      I18nManager.forceRTL(false);
      setIsReady(true);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    _currentLanguage = lang;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    I18nManager.allowRTL(isRTLLanguage(lang));
    I18nManager.forceRTL(false);
  }, []);

  const isRTL = isRTLLanguage(language);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[language] as Record<string, any>;
      const fallback = translations[TRANSLATION_FALLBACK_LANGUAGE] as Record<string, any>;

      const value = getNestedValue(dict, key) ?? getNestedValue(fallback, key) ?? key;
      return interpolate(value, params);
    },
    [language],
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({ language, setLanguage, t, isRTL }),
    [language, setLanguage, t, isRTL],
  );

  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={contextValue}>
      {/* Keep layout direction explicit in components via `isRTL`.
          A global `direction: 'rtl'` double-flips rows that already use
          `flexDirection: isRTL ? 'row-reverse' : 'row'`. */}
      <View style={{ flex: 1 }}>{children}</View>
    </LanguageContext.Provider>
  );
}
