export interface BreathingPhase {
  type: 'inhale' | 'hold' | 'exhale' | 'rest';
  duration: number;
  instruction: string;
}

export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  phases: BreathingPhase[];
  rounds: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  benefits: string[];
  gradientColors: [string, string];
  icon: string;
}

export interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: 'stress' | 'sleep' | 'focus' | 'gratitude' | 'anxiety' | 'self-compassion';
  script: string;
  gradientColors: [string, string];
  icon: string;
}

export interface YogaPose {
  name: string;
  duration: number;
  instruction: string;
  benefits: string;
}

export interface YogaSession {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  poses: YogaPose[];
  youtubeId?: string;
  gradientColors: [string, string];
  icon: string;
}

export interface WellnessArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  readTime: number;
  author: string;
  tags: string[];
  gradientColors: [string, string];
}

export interface AudioTrack {
  id: string;
  title: string;
  category: string;
  description: string;
  sourceType: 'tts' | 'url' | 'generated';
  sourceUrl?: string;
  ttsScript?: string;
  duration: number;
  icon: string;
  gradientColors: [string, string];
}

export interface AIPromptTemplate {
  id: string;
  type: 'meditation' | 'article' | 'breathing' | 'yoga';
  name: string;
  prompt: string;
}

export type ContentCategory =
  | 'breathing'
  | 'meditation'
  | 'yoga'
  | 'articles'
  | 'audio'
  | 'all';
