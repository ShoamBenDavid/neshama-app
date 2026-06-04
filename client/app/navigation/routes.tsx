export const ROUTES = {
  // Auth
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  REGISTER: 'Register',

  // Main Tabs
  MAIN_TABS: 'MainTabs',
  HOME: 'HomePage',
  DASHBOARD: 'Dashboard',
  JOURNAL: 'Journal',
  FORUM: 'Forum',
  SUPPORT_CENTER: 'SupportCenter',

  // Stack Screens
  CHAT: 'Chat',
  CONTENT_LIBRARY: 'ContentLibrary',
  JOURNAL_ENTRY: 'JournalEntry',
  CREATE_JOURNAL: 'CreateJournal',
  FORUM_POST: 'ForumPost',
  CREATE_FORUM_POST: 'CreateForumPost',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',

  // Settings sub-screens
  NOTIFICATION_OPTIONS: 'NotificationOptions',
  PRIVACY_SECURITY: 'PrivacySecurity',
  HELP_FAQ: 'HelpFAQ',
  ABOUT_NESHAMA: 'AboutNeshama',

  // Wellness Content
  BREATHING_EXERCISES: 'BreathingExercises',
  BREATHING_SESSION: 'BreathingSession',
  MEDITATION_LIBRARY: 'MeditationLibrary',
  MEDITATION_SESSION: 'MeditationSession',
  YOGA_SESSIONS: 'YogaSessions',
  YOGA_DETAIL: 'YogaDetail',
  ARTICLES: 'Articles',
  ARTICLE_DETAIL: 'ArticleDetail',
  AUDIO_RELAXATION: 'AudioRelaxation',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];
