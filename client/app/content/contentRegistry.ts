import { Ionicons } from '@expo/vector-icons';
import {
  getBreathingExercises,
  getMeditationSessions,
  getAudioTracks,
  getYogaSessions,
  getWellnessArticles,
} from './localizedContent';
import { getCurrentLanguage, type Language } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';
import type {
  MeditationSession,
  BreathingExercise,
  AudioTrack,
  YogaSession,
  WellnessArticle,
} from './types';

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export type ContentType = 'meditation' | 'breathing' | 'yoga' | 'article' | 'audio';

export interface RegistryItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  category: ContentCategory;
  durationLabel: string;
  durationMinutes: number;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
  tags?: string[];
  navigationTarget: {
    screen: keyof RootStackParamList;
    params?: Record<string, unknown>;
  };
}

export type ContentCategory =
  | 'meditation'
  | 'breathing'
  | 'yoga'
  | 'articles'
  | 'audio';

export interface CategoryMeta {
  id: ContentCategory;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
}

// ---------------------------------------------------------------------------
// Category definitions (order determines display order)
// ---------------------------------------------------------------------------

export const CATEGORIES: CategoryMeta[] = [
  { id: 'meditation', labelKey: 'content.typeMeditation', icon: 'flower-outline',         gradientColors: ['#667EEA', '#764BA2'] },
  { id: 'breathing',  labelKey: 'content.typeBreathing',  icon: 'leaf-outline',            gradientColors: ['#43E97B', '#38F9D7'] },
  { id: 'yoga',       labelKey: 'content.typeYoga',       icon: 'body-outline',            gradientColors: ['#FA709A', '#FEE140'] },
  { id: 'articles',   labelKey: 'content.typeArticles',   icon: 'document-text-outline',   gradientColors: ['#A18CD1', '#FBC2EB'] },
  { id: 'audio',      labelKey: 'content.typeAudio',      icon: 'headset-outline',         gradientColors: ['#74B9FF', '#0984E3'] },
];

// ---------------------------------------------------------------------------
// Adapters — convert each domain model into a unified RegistryItem
// ---------------------------------------------------------------------------

function adaptMeditations(data: MeditationSession[]): RegistryItem[] {
  return data.map((s) => ({
    id: `meditation-${s.id}`,
    title: s.title,
    description: s.description,
    type: 'meditation' as const,
    category: 'meditation' as const,
    durationLabel: `${s.duration} min`,
    durationMinutes: s.duration,
    icon: (s.icon || 'flower-outline') as keyof typeof Ionicons.glyphMap,
    gradientColors: s.gradientColors,
    tags: [s.category],
    navigationTarget: { screen: 'MeditationSession' as const, params: { sessionId: s.id } },
  }));
}

function adaptBreathing(data: BreathingExercise[]): RegistryItem[] {
  return data.map((e) => ({
    id: `breathing-${e.id}`,
    title: e.name,
    description: e.description,
    type: 'breathing' as const,
    category: 'breathing' as const,
    durationLabel: `${Math.round(e.duration / 60)} min`,
    durationMinutes: Math.round(e.duration / 60),
    icon: (e.icon || 'leaf-outline') as keyof typeof Ionicons.glyphMap,
    gradientColors: e.gradientColors,
    tags: [e.difficulty, ...e.benefits.slice(0, 2)],
    navigationTarget: { screen: 'BreathingSession' as const, params: { exerciseId: e.id } },
  }));
}

function adaptYoga(data: YogaSession[]): RegistryItem[] {
  return data.map((s) => ({
    id: `yoga-${s.id}`,
    title: s.title,
    description: s.description,
    type: 'yoga' as const,
    category: 'yoga' as const,
    durationLabel: `${s.duration} min`,
    durationMinutes: s.duration,
    icon: (s.icon || 'body-outline') as keyof typeof Ionicons.glyphMap,
    gradientColors: s.gradientColors,
    tags: [s.difficulty],
    navigationTarget: { screen: 'YogaDetail' as const, params: { sessionId: s.id } },
  }));
}

function adaptArticles(data: WellnessArticle[]): RegistryItem[] {
  return data.map((a) => ({
    id: `article-${a.id}`,
    title: a.title,
    description: a.summary,
    type: 'article' as const,
    category: 'articles' as const,
    durationLabel: `${a.readTime} min read`,
    durationMinutes: a.readTime,
    icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
    gradientColors: a.gradientColors,
    tags: a.tags,
    navigationTarget: { screen: 'ArticleDetail' as const, params: { articleId: a.id } },
  }));
}

function adaptAudio(data: AudioTrack[]): RegistryItem[] {
  return data.map((t) => ({
    id: `audio-${t.id}`,
    title: t.title,
    description: t.description,
    type: 'audio' as const,
    category: 'audio' as const,
    durationLabel: `${Math.round(t.duration / 60)} min`,
    durationMinutes: Math.round(t.duration / 60),
    icon: (t.icon || 'headset-outline') as keyof typeof Ionicons.glyphMap,
    gradientColors: t.gradientColors,
    tags: [t.category],
    navigationTarget: {
      screen: 'AudioRelaxation' as const,
      params: { trackId: t.id },
    },
  }));
}

// ---------------------------------------------------------------------------
// Public API — language-aware with per-language cache
// ---------------------------------------------------------------------------

const _cache = new Map<Language, RegistryItem[]>();

function buildForLanguage(lang: Language): RegistryItem[] {
  return [
    ...adaptMeditations(getMeditationSessions(lang)),
    ...adaptBreathing(getBreathingExercises(lang)),
    ...adaptYoga(getYogaSessions(lang)),
    ...adaptArticles(getWellnessArticles(lang)),
    ...adaptAudio(getAudioTracks(lang)),
  ];
}

export function getAllContent(lang?: Language): RegistryItem[] {
  const resolved = lang ?? getCurrentLanguage();
  if (_cache.has(resolved)) return _cache.get(resolved)!;
  const items = buildForLanguage(resolved);
  _cache.set(resolved, items);
  return items;
}

export function getContentByCategory(category: ContentCategory, lang?: Language): RegistryItem[] {
  return getAllContent(lang).filter((item) => item.category === category);
}

export interface GroupedContent {
  category: CategoryMeta;
  items: RegistryItem[];
}

export function getGroupedContent(lang?: Language): GroupedContent[] {
  const all = getAllContent(lang);
  return CATEGORIES
    .map((cat) => ({
      category: cat,
      items: all.filter((item) => item.category === cat.id),
    }))
    .filter((group) => group.items.length > 0);
}
