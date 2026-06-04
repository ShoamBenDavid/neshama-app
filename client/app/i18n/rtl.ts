import { Language } from './types';

export const RTL_LANGUAGES: Language[] = ['he'];

export function isRTLLanguage(lang: Language): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function getBackIconName(isRTL: boolean): 'arrow-back' | 'arrow-forward' {
  return isRTL ? 'arrow-forward' : 'arrow-back';
}

export function getChevronBackName(isRTL: boolean): 'chevron-back' | 'chevron-forward' {
  return isRTL ? 'chevron-forward' : 'chevron-back';
}

export function getChevronForwardName(isRTL: boolean): 'chevron-forward' | 'chevron-back' {
  return isRTL ? 'chevron-back' : 'chevron-forward';
}
