export const audioAssets = {
  'tide-of-stillness': require('./Tide of Stillness.mp3'),
  'drift-into-dusk': require('./Drift Into Dusk.mp3'),
  'pink-rainfall': require('./Pink Rainfall.mp3'),
  'pine-lullaby': require('./Pine Lullaby.mp3'),
  'lullaby-static': require('./Lullaby Static.mp3'),
} as const;

export type AudioAssetId = keyof typeof audioAssets;

export default audioAssets;
