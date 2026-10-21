export type DayPhase = 'DAY' | 'NIGHT';
export type SceneMode =
  | 'OVERWORLD'
  | 'TELESALES'
  | 'CANTEEN'
  | 'JUNK_STORAGE'
  | 'ROOMMATES'
  | 'ESCAPE_MAZE'
  | 'ENDING'
  | 'AWARENESS';

export interface TelesalesChoice {
  text: string;
  suspicionDelta: number; // effect on victim suspicion
  trustDelta: number; // effect on manager trust
  conscienceDelta: number; // effect on player conscience
  isWarning?: boolean;
}

export interface TelesalesDialogue {
  prompt: string;
  /** Exactly 3 scripted replies (shuffled on screen). */
  choices: TelesalesChoice[];
  /** Hidden "Cảnh báo nạn nhân" line, only shown sometimes. */
  warning: string;
}

export interface TelesalesVictim {
  id: string;
  name: string;
  role: string;
  /** Image asset key (ASSETS_MANIFEST) for the caller portrait. */
  avatarKey: string;
  initialSuspicion: number;
  dialogues: TelesalesDialogue[];
}

export interface InventoryItem {
  id: 'wire_cutters' | 'flashlight' | 'torn_map';
  name: string;
  desc: string;
  iconKey: string;
}

export interface GuardAI {
  id: string;
  x: number;
  y: number;
  patrolPoints: {x: number; y: number}[];
  currentPointIndex: number;
  angle: number; // in radians
  state: 'UNAWARE' | 'SUSPICIOUS' | 'SEARCHING' | 'ALERT';
  suspicionTimer: number;
  visionRange: number;
  visionAngle: number; // cone fov in radians
  speed: number;
}

export interface OverworldInteractable {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  action: 'DESK' | 'CANTEEN' | 'BED' | 'LOCKER' | 'JUNK_STORAGE' | 'ROOMMATES' | 'FENCE' | 'AWARENESS';
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  staminaRestore: number;
  moraleRestore: number;
  iconKey: string;
}

export const FOOD_MENU: FoodItem[] = [
  {
    id: 'white_rice',
    name: 'Cơm Trắng Đơn Sơ',
    price: 30,
    staminaRestore: 10,
    moraleRestore: 0,
    iconKey: 'food_rice_plate',
  },
  {
    id: 'instant_noodles',
    name: 'Mì Ăn Liền',
    price: 60,
    staminaRestore: 20,
    moraleRestore: 5,
    iconKey: 'food_instant_noodles',
  },
  {
    id: 'rice_plate',
    name: 'Dĩa Cơm Thịt',
    price: 150,
    staminaRestore: 35,
    moraleRestore: 10,
    iconKey: 'food_rice_plate',
  },
];

// Telesales victims, roommates and random events now live in ./storyData.ts
