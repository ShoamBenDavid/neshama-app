import { ImageSourcePropType } from 'react-native';
import type { RegistryItem } from '../../content/contentRegistry';

/**
 * Curated wellness imagery catalog used across the redesign. Sources are
 * royalty-free (Unsplash). Each entry uses a remote URI so the app works
 * without shipping bundled binaries; swapping any entry for a
 * `require('./photo.jpg')` later is a one-line change.
 *
 * Licensing notes live in `LICENSES.md` next to this file.
 */
export const wellnessImages = {
  // Home / featured course hero
  homeHeroDahlia: {
    uri: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=70',
  },
  homeHeroCloud: {
    uri: 'https://images.unsplash.com/photo-1505533321630-975218a5f66f?auto=format&fit=crop&w=1200&q=70',
  },
  homeHeroLotus: {
    uri: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=1200&q=70',
  },

  // Meditation sessions
  meditationStress: {
    uri: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=70',
  },
  meditationSleep: {
    uri: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=900&q=70',
  },
  meditationFocus: {
    uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=70',
  },
  meditationGratitude: {
    uri: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=900&q=70',
  },
  meditationAnxiety: {
    uri: 'https://images.unsplash.com/photo-1661156401401-cff49981d38d?auto=format&fit=crop&w=900&q=70',
  },
  meditationSelfCompassion: {
    uri: 'https://images.unsplash.com/photo-1571425046056-cfc17c664e57?auto=format&fit=crop&w=900&q=70',
  },

  // Breathing exercises
  breathingBox: {
    uri: 'https://images.unsplash.com/photo-1734641002431-0b8633eafad2?auto=format&fit=crop&w=900&q=70',
  },
  breathing478: {
    uri: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=900&q=70',
  },
  breathingCalm: {
    uri: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=900&q=70',
  },
  breathingEnergy: {
    uri: 'https://images.unsplash.com/photo-1669555494330-31da17f62360?auto=format&fit=crop&w=900&q=70',
  },
  breathingAnxiety: {
    uri: 'https://images.unsplash.com/photo-1761662826426-a266d369c2e7?auto=format&fit=crop&w=900&q=70',
  },

  // Yoga sessions
  yogaMorning: {
    uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=70',
  },
  yogaAnxiety: {
    uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=70',
  },
  yogaDesk: {
    uri: 'https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  yogaBedtime: {
    uri: 'https://images.unsplash.com/photo-1561049501-e1f96bdd98fd?q=80&w=2778&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  yogaStrength: {
    uri: 'https://images.unsplash.com/photo-1533162507191-d90c625b2640?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },

  // Audio tracks
  audioRain: {
    uri: 'https://images.unsplash.com/photo-1727067109977-b2da06e708cd?auto=format&fit=crop&w=900&q=70',
  },
  audioOcean: {
    uri: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=900&q=70',
  },
  audioForest: {
    uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=70',
  },
  audioBells: {
    uri: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&q=70',
  },
  audioWhiteNoise: {
    uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=70',
  },
  audioBodyScan: {
    uri: 'https://plus.unsplash.com/premium_photo-1661962728716-c44d0dc9d653?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
communitySupport: {
    uri: 'https://plus.unsplash.com/premium_photo-1733342422588-c2fc9e279836?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  // Articles
  articleAnxiety: {
    uri: 'https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=900&q=70',
  },
  articleMindfulness: {
    uri: 'https://images.unsplash.com/photo-1471520201477-47a62a269a87?auto=format&fit=crop&w=900&q=70',
  },
  articleBurnout: {
    uri: 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=900&q=70',
  },
  articleSleep: {
    uri: 'https://images.unsplash.com/photo-1722305063496-d0084178ab9d?auto=format&fit=crop&w=900&q=70',
  },
  articleSelfCompassion: {
    uri: 'https://images.unsplash.com/photo-1444312645910-ffa973656eba?auto=format&fit=crop&w=900&q=70',
  },
  articleEmotional: {
    uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=70',
  },

  // Legacy / shared fallbacks
  meditationCushion: {
    uri: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&q=70',
  },
  meditationCloud: {
    uri: 'https://images.unsplash.com/photo-1505533321630-975218a5f66f?auto=format&fit=crop&w=900&q=70',
  },
  meditationOliveTrees: {
    uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=70',
  },
  meditationWalking: {
    uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=70',
  },

  sleepNightSky: {
    uri: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=70',
  },
  sleepSounds: {
    uri: 'https://images.unsplash.com/photo-1502209524164-acea936639a2?auto=format&fit=crop&w=900&q=70',
  },
  sleepStory: {
    uri: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?auto=format&fit=crop&w=900&q=70',
  },
  anxietyWater: {
    uri: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=70',
  },
  anxietyHands: {
    uri: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=70',
  },
  anxietySunset: {
    uri: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=900&q=70',
  },
  journalDesk: {
    uri: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=70',
  },
  journalCushion: {
    uri: 'https://images.unsplash.com/photo-1538317070-cc31868fcc2d?q=80&w=930&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  supportWarmHands: {
    uri: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=70',
  },
  breathingFlow: {
    uri: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=70',
  },
  yogaSunrise: {
    uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=70',
  },
} as const satisfies Record<string, ImageSourcePropType>;

export type WellnessImageKey = keyof typeof wellnessImages;

/** Stable registry id → curated photo for carousel tiles. */
const contentImageById: Record<string, WellnessImageKey> = {
  // Meditation
  'meditation-stress-relief': 'meditationStress',
  'meditation-sleep-meditation': 'meditationSleep',
  'meditation-focus-meditation': 'meditationFocus',
  'meditation-gratitude-meditation': 'meditationGratitude',
  'meditation-anxiety-calm': 'meditationAnxiety',
  'meditation-self-compassion': 'meditationSelfCompassion',
  // Breathing
  'breathing-box-breathing': 'breathingBox',
  'breathing-4-7-8-breathing': 'breathing478',
  'breathing-calm-breathing': 'breathingCalm',
  'breathing-energizing-breath': 'breathingEnergy',
  'breathing-anxiety-relief': 'breathingAnxiety',
  // Yoga
  'yoga-morning-stretch': 'yogaMorning',
  'yoga-anxiety-relief-yoga': 'yogaAnxiety',
  'yoga-desk-stretches': 'yogaDesk',
  'yoga-bedtime-yoga': 'yogaBedtime',
  'yoga-strength-flow': 'yogaStrength',
  // Audio
  'audio-tide-of-stillness': 'audioOcean',
  'audio-drift-into-dusk': 'meditationSleep',
  'audio-pink-rainfall': 'audioRain',
  'audio-pine-lullaby': 'audioForest',
  'audio-lullaby-static': 'audioWhiteNoise',
  // Articles
  'article-understanding-anxiety': 'articleAnxiety',
  'article-power-of-mindfulness': 'articleMindfulness',
  'article-burnout-recovery': 'articleBurnout',
  'article-sleep-hygiene': 'articleSleep',
  'article-self-compassion-guide': 'articleSelfCompassion',
  'article-emotional-regulation': 'articleEmotional',
};

/**
 * Pick the best photo for a registry item (carousel / library tiles).
 * Prefers a per-item Unsplash image, then tag/category heuristics.
 */
export function pickImageForContent(
  item: Pick<RegistryItem, 'id' | 'tags' | 'category' | 'type'>,
): ImageSourcePropType {
  const byId = contentImageById[item.id];
  if (byId) return wellnessImages[byId];
  return pickImageForCategory(item.tags?.[0] || item.category || item.type);
}

/**
 * Pick the best photo for a content category or tag, with a safe fallback.
 */
export function pickImageForCategory(category?: string): ImageSourcePropType {
  const map: Record<string, WellnessImageKey> = {
    stress: 'meditationStress',
    anxiety: 'meditationAnxiety',
    sleep: 'meditationSleep',
    focus: 'meditationFocus',
    gratitude: 'meditationGratitude',
    'self-compassion': 'meditationSelfCompassion',
    mindfulness: 'articleMindfulness',
    burnout: 'articleBurnout',
    'emotional regulation': 'articleEmotional',
    nature: 'audioForest',
    guided: 'audioBodyScan',
    meditation: 'meditationCushion',
    breathing: 'breathingFlow',
    yoga: 'yogaSunrise',
    article: 'journalDesk',
    articles: 'journalDesk',
    audio: 'sleepSounds',
    beginner: 'meditationCloud',
    intermediate: 'meditationFocus',
    general: 'homeHeroCloud',
  };
  const key = (category && map[category]) || 'homeHeroCloud';
  return wellnessImages[key];
}
