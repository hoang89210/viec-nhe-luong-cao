import {SpriteConfig} from './utils/helper';

/**
 * Configuration for "Việc Nhẹ Lương Cao"
 */
export const CONFIG = {
  // Game & System
  title: {
    value: 'Việc Nhẹ Lương Cao',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1280,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 720,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Theme & Visuals
  backgroundColor: {
    value: '#0f1715',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#22c55e',
    type: 'color',
    label: 'Primary Color',
    group: 'THEME',
  },
  fontFamily: {
    value: 'monospace',
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Audio settings
  defaultMusicVolume: {
    value: 0.6,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.7,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Gameplay Rules & Tuning
  playerSpeed: {
    value: 180,
    type: 'number',
    label: 'Player Movement Speed',
    group: 'Rules',
  },
  guardSpeed: {
    value: 110,
    type: 'number',
    label: 'Guard Patrol Speed',
    group: 'Rules',
  },
  startingStamina: {
    value: 100,
    type: 'number',
    label: 'Starting Stamina',
    group: 'Rules',
  },
  startingMorale: {
    value: 100,
    type: 'number',
    label: 'Starting Morale',
    group: 'Rules',
  },
  escapeTimeLimit: {
    value: 90,
    type: 'number',
    label: 'Escape Time Limit (seconds)',
    group: 'Rules',
  },
  targetRansom: {
    value: 15000,
    type: 'number',
    label: 'Target Ransom Fund ($)',
    group: 'Rules',
  },
  screenShakeEnabled: {
    value: true,
    type: 'boolean',
    label: 'Enable Screen Shake',
    group: 'Rules',
  },

  // ASSETS Dimensions & Aspect Ratios
  assetBgAwarenessAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Awareness Board Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgAwarenessWidth: {
    value: 1376,
    type: 'number',
    label: 'Awareness Board Width',
    group: 'ASSETS',
  },
  assetBgAwarenessHeight: {
    value: 768,
    type: 'number',
    label: 'Awareness Board Height',
    group: 'ASSETS',
  },

  assetBgCallroomDeskAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Desk Mini-game Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCallroomDeskWidth: {
    value: 1376,
    type: 'number',
    label: 'Desk Mini-game Width',
    group: 'ASSETS',
  },
  assetBgCallroomDeskHeight: {
    value: 768,
    type: 'number',
    label: 'Desk Mini-game Height',
    group: 'ASSETS',
  },

  assetBgCompoundDormAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Compound Dorm Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCompoundDormWidth: {
    value: 1376,
    type: 'number',
    label: 'Compound Dorm Width',
    group: 'ASSETS',
  },
  assetBgCompoundDormHeight: {
    value: 768,
    type: 'number',
    label: 'Compound Dorm Height',
    group: 'ASSETS',
  },

  assetBgCompoundMapAspectRatio: {
    value: 1376 / 768,
    type: 'number',
    label: 'Compound Map Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCompoundMapWidth: {
    value: 1376,
    type: 'number',
    label: 'Compound Map Width',
    group: 'ASSETS',
  },
  assetBgCompoundMapHeight: {
    value: 768,
    type: 'number',
    label: 'Compound Map Height',
    group: 'ASSETS',
  },

  // Items
  assetWireCuttersAspectRatio: {
    value: 752 / 598,
    type: 'number',
    label: 'Wire Cutters Aspect Ratio',
    group: 'ASSETS',
  },
  assetFlashlightAspectRatio: {
    value: 757 / 635,
    type: 'number',
    label: 'Flashlight Aspect Ratio',
    group: 'ASSETS',
  },
  assetTornMapAspectRatio: {
    value: 935 / 754,
    type: 'number',
    label: 'Torn Map Aspect Ratio',
    group: 'ASSETS',
  },

  // Food
  assetRicePlateAspectRatio: {
    value: 946 / 669,
    type: 'number',
    label: 'Rice Plate Aspect Ratio',
    group: 'ASSETS',
  },
  assetInstantNoodlesAspectRatio: {
    value: 752 / 639,
    type: 'number',
    label: 'Instant Noodles Aspect Ratio',
    group: 'ASSETS',
  },

  // Telesales Targets
  assetTargetUncleAspectRatio: {
    value: 742 / 722,
    type: 'number',
    label: 'Uncle Sau Aspect Ratio',
    group: 'ASSETS',
  },
  assetTargetStudentAspectRatio: {
    value: 599 / 753,
    type: 'number',
    label: 'Student Nam Aspect Ratio',
    group: 'ASSETS',
  },
  assetTargetVendorAspectRatio: {
    value: 722 / 866,
    type: 'number',
    label: 'Chi Ba Vendor Aspect Ratio',
    group: 'ASSETS',
  },

  // UI Icons
  assetIconStaminaAspectRatio: {
    value: 700 / 578,
    type: 'number',
    label: 'Stamina Icon Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconMoraleAspectRatio: {
    value: 700 / 578,
    type: 'number',
    label: 'Morale Icon Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconTrustAspectRatio: {
    value: 578 / 578,
    type: 'number',
    label: 'Trust Icon Aspect Ratio',
    group: 'ASSETS',
  },
  assetIconMoneyAspectRatio: {
    value: 865 / 701,
    type: 'number',
    label: 'Money Icon Aspect Ratio',
    group: 'ASSETS',
  },

  playerSprite: {
    value: undefined as SpriteConfig | undefined,
    type: 'sprite',
    label: 'Player Sprite',
    group: 'Visuals',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/**
 * Type helper for reading values in game code
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}

export const THEME = {
  bgPrimary: '#0d1312',
  bgPanel: '#151e1c',
  borderPanel: '#2a3a36',
  accentGreen: '#10b981',
  accentRed: '#ef4444',
  accentYellow: '#f59e0b',
  textCRT: '#a7f3d0',
  fontFamily: 'Courier New, monospace',
};
