import { Ionicons } from '@expo/vector-icons';
import type { Language } from '../i18n';

export interface CrisisResource {
  name: string;
  number: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Whether tapping should initiate a phone call */
  callable: boolean;
  /** Opens in the browser when tapped (use with callable: false) */
  url?: string;
}

export interface SupportServicesData {
  crisisResources: CrisisResource[];
  emergencyNumber: string;
}

const servicesEN: SupportServicesData = {
  emergencyNumber: '911',
  crisisResources: [
    {
      name: '988 Suicide & Crisis Lifeline',
      number: '988',
      description: '24/7 free & confidential support',
      icon: 'call-outline',
      callable: true,
    },
    {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Free 24/7 text-based support',
      icon: 'chatbubble-outline',
      callable: false,
    },
    {
      name: 'SAMHSA National Helpline',
      number: '1-800-662-4357',
      description: 'Treatment referrals & information 24/7',
      icon: 'medkit-outline',
      callable: true,
    },
  ],
};

const servicesHE: SupportServicesData = {
  emergencyNumber: '100',
  crisisResources: [
    {
      name: 'ער"ן – עזרה ראשונה נפשית',
      number: '1201',
      description: 'קו סיוע רגשי, 24/7, חינם וחסוי',
      icon: 'call-outline',
      callable: true,
    },
    {
      name: 'נט"ל – מרכז טראומה',
      number: '*6768',
      description: 'תמיכה לנפגעי טראומה ומלחמה',
      icon: 'shield-checkmark-outline',
      callable: true,
    },
    {
      name: 'סה"ר – סיוע והקשבה ברשת',
      number: 'sahar.org.il',
      description: 'צ\'אט אנונימי עם מתנדבים מאומנים',
      icon: 'chatbubble-outline',
      callable: false,
      url: 'https://sahar.org.il',
    },
    {
      name: 'מד"א – מגן דוד אדום',
      number: '101',
      description: 'שירותי חירום רפואיים',
      icon: 'medkit-outline',
      callable: true,
    },
  ],
};

const supportServicesByLanguage: Record<Language, SupportServicesData> = {
  en: servicesEN,
  he: servicesHE,
};

export function getSupportServices(language: Language): SupportServicesData {
  return supportServicesByLanguage[language];
}
