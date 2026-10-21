// tslint:disable
/* eslint-disable */
import {
  AlertTriangle,
  Award,
  BookOpen,
  DollarSign,
  Heart,
  HelpCircle,
  Menu,
  Moon,
  Phone,
  PhoneCall,
  Play,
  RotateCcw,
  RotateCw,
  Shield,
  Smile,
  Sun,
  Utensils,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {getConfig, THEME} from './constants';
import {
  FOOD_MENU,
  FoodItem,
  GuardAI,
  InventoryItem,
  OverworldInteractable,
  SceneMode,
} from './gameTypes';
import RoommatesScene, {RoommateState, SHARE_FOOD_PRICE} from './RoommatesScene';
import {DailyEventView, JOB_SCAM_SIGNS, ROOMMATES, RoommateId} from './storyData';
import TelesalesScene, {CallResult} from './TelesalesScene';
import JunkStorageScene, {QUEST_ITEM_INFO, QuestItemId} from './JunkStorageScene';
import {SpriteActionConfig, SpriteAnimationState, SpriteRenderer} from './SpriteRenderer';
import BackgroundMusic from './utils/BackgroundMusic';
import {warningCatchChance} from './gameRules';
import {enterFullscreenLandscape, FullscreenButton, RotateOverlay, TouchControls, useIsPortrait, useIsTouch} from './TouchControls';
import {
  createFixedStepper,
  drawAsset,
  drawBackground,
  Entity,
  formatTime,
  gameAudio,
  GameState,
  MenuOverlay,
  Overlay,
  prepareCanvas,
  useAssets,
  useAutoFocus,
  useInput,
} from './utils/helper';
import {usePlayground, usePlaygroundGameLifecycle, useRpc} from './utils/usePlayground';

const ASSETS_MANIFEST: Record<string, string> = {
  bg_compound_map: 'assets/images/bg_compound_map.png',
  bg_awareness_board: 'assets/images/bg_awareness_board.png',
  ui_icon_stamina: 'assets/images/ui_icon_stamina.png',
  telesales_target_vendor: 'assets/images/telesales_target_vendor.png',
  guard_patrol_idle: 'assets/images/guard_patrol_idle.png',
  guard_patrol_walk: 'assets/images/guard_patrol_walk.png',
  guard_patrol_attack: 'assets/images/guard_patrol_attack.png',
  telesales_target_student: 'assets/images/telesales_target_student.png',
  item_torn_map: 'assets/images/item_torn_map.png',
  bg_callroom_desk: 'assets/images/bg_callroom_desk.png',
  player_worker_idle: 'assets/images/player_worker_idle.png',
  player_worker_walk: 'assets/images/player_worker_walk.png',
  manager_hung_idle: 'assets/images/manager_hung_idle.png',
  manager_hung_walk: 'assets/images/manager_hung_walk.png',
  food_rice_plate: 'assets/images/food_rice_plate.png',
  telesales_target_uncle: 'assets/images/telesales_target_uncle.png',
  ui_icon_money: 'assets/images/ui_icon_money.png',
  ui_icon_morale: 'assets/images/ui_icon_morale.png',
  food_instant_noodles: 'assets/images/food_instant_noodles.png',
  ui_icon_trust: 'assets/images/ui_icon_trust.png',
  item_flashlight: 'assets/images/item_flashlight.png',
  bg_compound_dorm: 'assets/images/bg_compound_dorm.png',
  item_wire_cutters: 'assets/images/item_wire_cutters.png',
  // Added scenes (generated to match the Playground art style)
  telesales_target_teacher: 'assets/images/telesales_target_teacher.png',
  telesales_target_shipper: 'assets/images/telesales_target_shipper.png',
  roommate_tuan: 'assets/images/roommate_tuan.png',
  roommate_hoa: 'assets/images/roommate_hoa.png',
  roommate_bao: 'assets/images/roommate_bao.png',
  roommate_tuan_sit: 'assets/images/roommate_tuan_sit.png',
  roommate_hoa_sit: 'assets/images/roommate_hoa_sit.png',
  roommate_bao_sit: 'assets/images/roommate_bao_sit.png',
  prop_wall_calendar: 'assets/images/prop_wall_calendar.png',
  kho_wall_frame: 'assets/images/kho_wall_frame.png',
  kho_interior: 'assets/images/kho_interior.png',
  kho_scrap_tile: 'assets/images/kho_scrap_tile.png',
  kho_pole_hook: 'assets/images/kho_pole_hook.png',
  junk_can: 'assets/images/junk_can.png',
  junk_slipper: 'assets/images/junk_slipper.png',
  junk_radio: 'assets/images/junk_radio.png',
  junk_bottle: 'assets/images/junk_bottle.png',
  junk_tire: 'assets/images/junk_tire.png',
  event_inspection: 'assets/images/event_inspection.png',
  event_outage: 'assets/images/event_outage.png',
  event_new_arrivals: 'assets/images/event_new_arrivals.png',
  event_roommate_sold: 'assets/images/event_roommate_sold.png',
  event_betrayal: 'assets/images/event_betrayal.png',
  event_quiet: 'assets/images/event_quiet.png',
};

// Character Sprite Configs with exact dimensions from read_assets_metadata (frameWidth: 512, frameHeight: 512)
const PLAYER_SPRITE_CONFIGS: Record<string, SpriteActionConfig> = {
  IDLE: {
    imageUrl: 'player_worker_idle',
    totalFrames: 4,
    frameWidth: 512,
    frameHeight: 512,
    fps: 6,
    loop: true,
  },
  WALK: {
    imageUrl: 'player_worker_walk',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 12,
    loop: true,
  },
};

const GUARD_SPRITE_CONFIGS: Record<string, SpriteActionConfig> = {
  IDLE: {
    imageUrl: 'guard_patrol_idle',
    totalFrames: 4,
    frameWidth: 512,
    frameHeight: 512,
    fps: 6,
    loop: true,
  },
  WALK: {
    imageUrl: 'guard_patrol_walk',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 12,
    loop: true,
  },
  ATTACK: {
    imageUrl: 'guard_patrol_attack',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 14,
    loop: false,
  },
};

const MANAGER_SPRITE_CONFIGS: Record<string, SpriteActionConfig> = {
  IDLE: {
    imageUrl: 'manager_hung_idle',
    totalFrames: 4,
    frameWidth: 512,
    frameHeight: 512,
    fps: 5,
    loop: true,
  },
  WALK: {
    imageUrl: 'manager_hung_walk',
    totalFrames: 16,
    frameWidth: 512,
    frameHeight: 512,
    fps: 10,
    loop: true,
  },
};

// ============================================================================
// REALISTIC COMPOUND ARCHITECTURE & MAP RENDERING HELPERS
// ============================================================================

/**
 * Draws a realistic galvanized steel chain-link security fence with top razor-wire coils.
 */
function drawRealisticChainFence(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  postInterval = 34,
) {
  ctx.save();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len <= 0) {
    ctx.restore();
    return;
  }
  const angle = Math.atan2(dy, dx);

  ctx.translate(x1, y1);
  ctx.rotate(angle);

  // Concrete footing shadow underneath fence
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 5, len, 4);

  // Top and bottom galvanized steel tension pipes
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(len, -6);
  ctx.moveTo(0, 5);
  ctx.lineTo(len, 5);
  ctx.stroke();

  // Steel top rail highlight
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(len, -7);
  ctx.stroke();

  // Diamond chain-link mesh lattice pattern
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const meshStep = 9;
  for (let i = 0; i < len; i += meshStep) {
    ctx.moveTo(i, -6);
    ctx.lineTo(i + 6, 5);
    ctx.moveTo(i + 6, -6);
    ctx.lineTo(i, 5);
  }
  ctx.stroke();

  // Vertical steel posts with tension brackets & caps
  const postCount = Math.floor(len / postInterval);
  for (let i = 0; i <= postCount; i++) {
    const px = Math.min(len, i * postInterval);
    // Post shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(px - 1, -14, 4, 20);
    // Post body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 2.5, -12, 5, 17);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(px - 1.5, -11, 3, 15);
    // Post cap
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(px, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Concertina Razor Barbed Wire coiled along the top
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const coilStep = 13;
  for (let i = 0; i < len; i += coilStep) {
    ctx.arc(i + 6, -11, Math.max(0, 5.5), 0, Math.PI * 2);
  }
  ctx.stroke();

  // Razor barbs (cross razor blades)
  ctx.fillStyle = '#e2e8f0';
  for (let i = 5; i < len; i += 16) {
    ctx.fillRect(i - 1, -18, 2, 4);
    ctx.fillRect(i - 3, -16, 6, 1.5);
  }

  ctx.restore();
}

/**
 * Draws an industrial corrugated sheet metal roof with alternating highlight/shadow ribs and weathering.
 */
function drawCorrugatedRoof(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  baseColor = '#1f2e29',
) {
  ctx.save();
  // Base metal slab
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, w, h);

  // Corrugated rib texture
  const ribStep = 8;
  for (let rx = x; rx < x + w; rx += ribStep) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(rx, y, ribStep / 2, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.fillRect(rx + ribStep / 2, y, ribStep / 2, h);
  }

  // Rust patches and weathered grime
  ctx.fillStyle = 'rgba(146, 64, 14, 0.18)';
  ctx.fillRect(x + 4, y + 2, w * 0.35, 6);
  ctx.fillRect(x + w * 0.6, y + h - 8, w * 0.3, 6);

  // Structural perimeter steel frame
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
  ctx.restore();
}

/**
 * Draws a dormitory metal bunk bed with mattresses, pillows, blankets, and steel ladder.
 */
function drawBunkBed(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x - 2, y + 36, 44, 8);

  // Bed frame base (dark steel)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, 40, 36);

  // Lower/Upper mattress (drab green institutional foam)
  ctx.fillStyle = '#234e40';
  ctx.fillRect(x + 2, y + 2, 36, 32);

  // Wool blanket folded at foot
  ctx.fillStyle = '#134e4a';
  ctx.fillRect(x + 2, y + 16, 36, 18);
  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 17, 34, 16);

  // Pillow
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x + 4, y + 4, 32, 8);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 4, y + 4, 32, 8);

  // Steel tubular bed posts at 4 corners
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x - 2, y - 2, 4, 4);
  ctx.fillRect(x + 38, y - 2, 4, 4);
  ctx.fillRect(x - 2, y + 34, 4, 4);
  ctx.fillRect(x + 38, y + 34, 4, 4);

  // Bed ladder rungs
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 1, y + 6);
  ctx.lineTo(x - 1, y + 30);
  ctx.moveTo(x - 3, y + 12);
  ctx.lineTo(x + 1, y + 12);
  ctx.moveTo(x - 3, y + 20);
  ctx.lineTo(x + 1, y + 20);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a telesales workstation with CRT monitor, green monitor glow cone, keyboard and headset cables.
 */
function drawCallDeskStation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isInteractiveTarget = false,
) {
  ctx.save();
  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x - 2, y + 28, 48, 6);

  // Office partition divider
  ctx.fillStyle = '#223832';
  ctx.fillRect(x - 3, y - 5, 50, 4);
  ctx.fillStyle = '#11221e';
  ctx.fillRect(x - 3, y - 1, 4, 32);

  // Wooden laminate desk top
  ctx.fillStyle = '#2b3f37';
  ctx.fillRect(x, y, 44, 28);
  ctx.strokeStyle = '#1b2924';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, 44, 28);

  // Computer CRT monitor housing
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 12, y + 2, 20, 14);

  // CRT Screen with vivid emerald green glow!
  ctx.fillStyle = '#059669';
  ctx.fillRect(x + 14, y + 4, 16, 10);
  ctx.fillStyle = '#34d399';
  ctx.fillRect(x + 15, y + 5, 14, 4);

  // Monitor glow projected onto desk
  const crtGlow = ctx.createRadialGradient(
    x + 22,
    y + 10,
    1,
    x + 22,
    y + 20,
    Math.max(1, 26),
  );
  crtGlow.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  crtGlow.addColorStop(0.7, 'rgba(16, 185, 129, 0.12)');
  crtGlow.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
  ctx.fillStyle = crtGlow;
  ctx.beginPath();
  ctx.arc(x + 22, y + 20, Math.max(0, 26), 0, Math.PI * 2);
  ctx.fill();

  // Keyboard
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 12, y + 18, 20, 6);
  ctx.fillStyle = '#334155';
  for (let kx = x + 13; kx < x + 31; kx += 3) {
    ctx.fillRect(kx, y + 19, 2, 2);
    ctx.fillRect(kx, y + 22, 2, 1.5);
  }

  // Telephone headset cradle & coiled cable
  ctx.fillStyle = '#090d0c';
  ctx.fillRect(x + 3, y + 12, 6, 10);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 22);
  ctx.lineTo(x + 10, y + 22);
  ctx.stroke();

  // If interactive KPI desk, draw green pulsing LED
  if (isInteractiveTarget) {
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + 30, y + 5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws a canteen food serving counter with stainless steel warming trays and steam wisps.
 */
function drawCanteenServingCounter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) {
  ctx.save();
  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x - 2, y + 32, 64, 6);

  // Stainless steel counter body
  ctx.fillStyle = '#334155';
  ctx.fillRect(x, y, 60, 32);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 60, 32);

  // Metallic front highlight
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 2, y + 2, 56, 4);

  // Food warming trays (Rice, Curry/Meat, Vegetable soup)
  // Tray 1: Steaming white rice
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 4, y + 8, 16, 18);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x + 5, y + 9, 14, 16);

  // Tray 2: Meat/Curry sauce
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 22, y + 8, 16, 18);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + 23, y + 9, 14, 16);

  // Tray 3: Soup broth cauldron
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 40, y + 8, 16, 18);
  ctx.fillStyle = '#065f46';
  ctx.fillRect(x + 41, y + 9, 14, 16);

  // Steam animation rising from trays
  const steamOffset = (time * 25) % 18;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 7 - steamOffset);
  ctx.bezierCurveTo(x + 10, y + 2 - steamOffset, x + 15, y - 3 - steamOffset, x + 12, y - 7 - steamOffset);
  ctx.moveTo(x + 30, y + 7 - ((steamOffset + 8) % 18));
  ctx.bezierCurveTo(x + 28, y + 2 - ((steamOffset + 8) % 18), x + 33, y - 3 - ((steamOffset + 8) % 18), x + 30, y - 7 - ((steamOffset + 8) % 18));
  ctx.stroke();

  // Menu chalkboard placard
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 6, y - 14, 48, 11);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y - 14, 48, 11);
  ctx.fillStyle = '#fef08a';
  ctx.font = '8px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CƠM $10|MÌ $5', x + 30, y - 6);

  ctx.restore();
}

/**
 * Draws industrial scrap yard bin with discarded steel, wire spools, and warning hazard barrels.
 */
function drawScrapYardDumpster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
) {
  ctx.save();
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x - 2, y + 28, 54, 8);

  // Dumpster body (weathered industrial rust orange)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y, 50, 28);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 50, 28);

  // Yellow & black caution stripes on rim
  for (let sx = x; sx < x + 50; sx += 8) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(sx, y, 4, 4);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(sx + 4, y, 4, 4);
  }

  // Scrap metal rebar sticking out
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 10);
  ctx.lineTo(x - 4, y - 8);
  ctx.moveTo(x + 18, y + 10);
  ctx.lineTo(x + 12, y - 12);
  ctx.moveTo(x + 34, y + 12);
  ctx.lineTo(x + 44, y - 6);
  ctx.stroke();

  // Spool of barbed wire inside
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x + 25, y + 6, Math.max(0, 7), 0, Math.PI * 2);
  ctx.stroke();

  // Industrial barrel next to dumpster
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(x + 40, y + 6, 14, 20);
  ctx.strokeStyle = '#172554';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 40, y + 6, 14, 20);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(x + 47, y + 16, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a perimeter watchtower with steel truss scaffolding, sniper cabin, and a dynamic sweeping searchlight cone!
 */
function drawWatchtowerStructure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  sweepBaseAngle: number,
  sweepRange: number,
  isAlert = false,
) {
  ctx.save();
  // Dynamic sweeping volumetric searchlight beam
  const sweepAngle =
    sweepBaseAngle + Math.sin(time * 0.75 + x * 0.01) * (sweepRange / 2);
  const beamDist = 240;
  const coneSpread = Math.PI / 6.5;

  ctx.save();
  const grad = ctx.createRadialGradient(x, y, 6, x, y, beamDist);
  if (isAlert) {
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.18)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
  } else {
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.36)');
    grad.addColorStop(0.5, 'rgba(254, 240, 138, 0.14)');
    grad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
  }

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(
    x,
    y,
    Math.max(0, beamDist),
    sweepAngle - coneSpread / 2,
    sweepAngle + coneSpread / 2,
  );
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Steel lattice legs
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x - 22, y + 26);
  ctx.lineTo(x - 8, y - 6);
  ctx.moveTo(x + 22, y + 26);
  ctx.lineTo(x + 8, y - 6);
  // Cross braces
  ctx.moveTo(x - 18, y + 20);
  ctx.lineTo(x + 12, y + 8);
  ctx.moveTo(x + 18, y + 20);
  ctx.lineTo(x - 12, y + 8);
  ctx.stroke();

  // Cabin platform
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 18, y - 22, 36, 18);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 18, y - 22, 36, 18);

  // Tinted sniper slit
  ctx.fillStyle = '#020617';
  ctx.fillRect(x - 14, y - 18, 28, 6);

  // Searchlight fixture housing
  ctx.fillStyle = isAlert ? '#ef4444' : '#fef08a';
  ctx.beginPath();
  ctx.arc(x, y - 6, Math.max(0, 5), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws asphalt cracks, ground caution markings, puddles, and perimeter stencils.
 */
function drawGroundDecalsAndPuddles(
  ctx: CanvasRenderingContext2D,
  time: number,
) {
  ctx.save();
  // Oil stains and grease spots on courtyard
  const oilStains = [
    {x: 520, y: 490, r: 18},
    {x: 740, y: 530, r: 24},
    {x: 990, y: 560, r: 16},
  ];
  oilStains.forEach((spot) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y, spot.r, spot.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sheen
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(spot.x - 2, spot.y - 1, spot.r * 0.7, spot.r * 0.35, 0, 0, Math.PI);
    ctx.stroke();
  });

  // Rain water puddles with subtle ripples
  const puddles = [
    {x: 630, y: 460, w: 45, h: 18},
    {x: 880, y: 510, w: 55, h: 22},
  ];
  puddles.forEach((pud) => {
    ctx.fillStyle = 'rgba(30, 58, 70, 0.4)';
    ctx.beginPath();
    ctx.ellipse(pud.x, pud.y, pud.w * 0.5, pud.h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Ripple shimmer
    const shimmer = Math.sin(time * 2 + pud.x) * 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(pud.x + shimmer, pud.y, Math.max(0, pud.h * 0.25), 0, Math.PI);
    ctx.stroke();
  });

  // Caution stencil warning signs on concrete ground
  ctx.save();
  ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.font = 'bold 12px Courier New, monospace';
  ctx.letterSpacing = '1px';
  ctx.fillText('▲ KHU VỰC CẤM - CẢNH BÁO NỔ SÚNG ▲', 450, 645);
  ctx.fillStyle = 'rgba(234, 179, 8, 0.8)';
  ctx.font = '11px Courier New, monospace';
  ctx.fillText('>> HƯỚNG RA HÀNG RÀO PHÍA ĐÔNG >>', 820, 645);
  ctx.restore();

  ctx.restore();
}

/**
 * Draws tactical holographic markers for interactive spots with high visibility.
 */
function drawTacticalHotspot(
  ctx: CanvasRenderingContext2D,
  obj: OverworldInteractable,
  isNearby: boolean,
  time: number,
  inventory: Record<string, boolean>,
  callsLeftToday: number,
) {
  ctx.save();
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;

  // Ground holographic ring
  const pulse = Math.sin(time * 4) * 3;
  const radius = Math.max(0, 24 + (isNearby ? pulse : 0));

  ctx.save();
  ctx.strokeStyle = isNearby ? '#10b981' : 'rgba(16, 185, 129, 0.35)';
  ctx.lineWidth = isNearby ? 2.5 : 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (isNearby) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
    ctx.fill();
  }
  ctx.restore();

  // Floating pill banner with high-contrast backdrop
  const bannerY = obj.y - 12;
  ctx.save();
  ctx.font = 'bold 11px Courier New, monospace';
  const labelWidth = ctx.measureText(obj.label).width;
  const bgW = Math.max(80, labelWidth + 20);
  const bgH = 22;

  // Backdrop box
  ctx.fillStyle = isNearby ? 'rgba(9, 24, 18, 0.92)' : 'rgba(15, 23, 20, 0.82)';
  ctx.fillRect(cx - bgW / 2, bannerY - bgH / 2, bgW, bgH);
  ctx.strokeStyle = isNearby ? '#10b981' : '#2d453c';
  ctx.lineWidth = isNearby ? 1.8 : 1;
  ctx.strokeRect(cx - bgW / 2, bannerY - bgH / 2, bgW, bgH);

  // Key Prompt Pill on top if nearby
  if (isNearby) {
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE / NÚT A: TƯƠNG TÁC]', cx, bannerY - 14);
  }

  // Label text
  ctx.fillStyle = isNearby ? '#6ee7b7' : '#cbd5e1';
  ctx.font = 'bold 11px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(obj.label, cx, bannerY);

  ctx.restore();
  ctx.restore();
}

// ============================================================================
// DESIGN CONSTANTS (balance)
// ============================================================================
const DAILY_QUOTA = 5; // calls per day
const MAX_DAYS = 20; // game lasts up to 20 days
const ESCAPE_FAIL_DEBT = 2000; // +debt per failed escape
const RESCUE_DELAY_DAYS = 3; // survive N days after messaging family
const WHISTLEBLOWER_TARGET = 10; // warnings not caught
/** Illustration shown on each morning event card. */
const DAILY_EVENT_ART: Record<DailyEventView['id'], string> = {
  INSPECTION: 'event_inspection',
  OUTAGE: 'event_outage',
  NEW_ARRIVALS: 'event_new_arrivals',
  ROOMMATE_SOLD: 'event_roommate_sold',
  TUAN_BETRAYAL: 'event_betrayal',
  QUIET: 'event_quiet',
};
const NIGHT_ACTIONS = 3; // roommate actions per night
const PASS_MONEY = 220; // hoa hồng mỗi cuộc đạt (vào Tiền; tự nộp Quỹ Chuộc Thân ở căn tin)
const LIVING_FEE = 100; // phí ăn ở trừ mỗi sáng
const STARTING_MONEY = 50;
const CALL_STAMINA_COST = 10;
const SAVE_KEY = 'vnlc_save_v1';

type EndingType = 'ESCAPE' | 'RANSOM' | 'OVERSEER' | 'COLLAPSE' | 'RESCUE' | 'WHISTLEBLOWER' | 'SOLD';
type EscapeItemId = 'wire_cutters' | 'flashlight' | 'torn_map';
const ESCAPE_ITEM_NAMES: Record<EscapeItemId, string> = {
  flashlight: 'Đèn Pin',
  torn_map: 'Bản Đồ Rách',
  wire_cutters: 'Kìm Cắt Dây Thép',
};

/** Escape maze fence walls (axis-aligned rects) - matches the drawn fences. */
const MAZE_WALLS = [
  {x: 244, y: 64, w: 12, h: 422},
  {x: 494, y: 234, w: 12, h: 422},
  {x: 754, y: 64, w: 12, h: 402},
  {x: 994, y: 194, w: 12, h: 462},
];

function rectHitsWalls(x: number, y: number, w: number, h: number) {
  return MAZE_WALLS.some((r) => x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y);
}

/** Sampled line-of-sight test through maze walls. */
function hasLineOfSight(x1: number, y1: number, x2: number, y2: number) {
  const steps = 16;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (rectHitsWalls(x1 + (x2 - x1) * t - 1, y1 + (y2 - y1) * t - 1, 2, 2)) return false;
  }
  return true;
}

function makeRoommates(): Record<RoommateId, RoommateState> {
  const out = {} as Record<RoommateId, RoommateState>;
  ROOMMATES.forEach((r) => {
    out[r.id] = {relationship: r.startRelationship, present: true, lastLine: r.talk[1][0]};
  });
  out.tuan.lastLine = 'Tuấn ngồi co ro ở góc giường, mắt đỏ hoe.';
  out.hoa.lastLine = 'Chị Hoa đang khâu lại chiếc áo rách, gật đầu chào bạn.';
  out.bao.lastLine = 'Bảo nằm nhìn trần nhà, đẩy gọng kính nứt.';
  return out;
}

/** Build escape-maze guards. Harder after each failed attempt. */
function buildMazeGuards(failures: number, baseSpeed: number, knowsSchedule: boolean): GuardAI[] {
  const routes = [
    [{x: 630, y: 130}, {x: 630, y: 600}],
    [{x: 880, y: 600}, {x: 880, y: 130}],
    [{x: 375, y: 130}, {x: 375, y: 600}],
    [{x: 1080, y: 150}, {x: 1210, y: 150}, {x: 1210, y: 580}, {x: 1080, y: 580}],
  ];
  const count = Math.min(routes.length, 2 + failures);
  const speedMul = (0.8 + 0.12 * failures) * (knowsSchedule ? 0.85 : 1);
  return routes.slice(0, count).map((pts, i) => ({
    id: `maze_guard_${i}`,
    x: pts[0].x,
    y: pts[0].y,
    patrolPoints: pts,
    currentPointIndex: 1,
    angle: Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x),
    state: 'UNAWARE' as const,
    suspicionTimer: 0,
    visionRange: (150 + 12 * failures) * (knowsSchedule ? HOA_VISION_MUL : 1),
    visionAngle: Math.PI / 3.2,
    speed: baseSpeed * speedMul,
  }));
}

// Chị Hoa's guard schedule: guard vision range -20% (overworld night + escape maze)
const HOA_VISION_MUL = 0.8;

interface SaveData {
  v: 1;
  dayNumber: number;
  isNight: boolean;
  stamina: number;
  morale: number;
  money: number;
  ransomFund: number;
  managerTrust: number;
  conscience: number;
  callsLeftToday: number;
  inventory: Record<string, boolean>;
  junkAttemptsLeft: number;
  failStreak: number;
  passesToday: number;
  mealTickets: number;
  extraDebt: number;
  warningsUncaught: number;
  escapeFailures: number;
  roommates: Record<RoommateId, RoommateState>;
  nightActionsLeft: number;
  hoaSchedule: boolean;
  phoneFixed: boolean;
  messageSent: boolean;
  rescueDay: number | null;
  outageTonight: boolean;
  todayQuota?: number;
  unpaidFeeStreak?: number;
  score: number;
}

function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.v === 1 ? (d as SaveData) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const lastCancelRef = useRef(false);
  // Separate edge-detector for the interact key (sharing lastCancelRef made a held
  // Space/A re-trigger interactions every frame, e.g. toggling day/night repeatedly).
  const lastConfirmRef = useRef(false);
  // Phones: touch controls / fullscreen / rotate hint only on coarse-pointer devices
  const isTouch = useIsTouch();
  const isPortrait = useIsPortrait();

  // Playground SDK Integration
  const {sdk} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // --- Primary Game & Simulation State ---
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Scene & Day-Night cycle
  const [sceneMode, setSceneMode] = useState<SceneMode>('OVERWORLD');
  const [dayNumber, setDayNumber] = useState(1);
  const [isNight, setIsNight] = useState(false);

  // Survival Attributes
  const [stamina, setStamina] = useState(100);
  const [morale, setMorale] = useState(100);
  const [money, setMoney] = useState(15);
  const [ransomFund, setRansomFund] = useState(0);
  const [managerTrust, setManagerTrust] = useState(50);
  const [conscience, setConscience] = useState(60);

  // Daily quota
  const [callsLeftToday, setCallsLeftToday] = useState(4);

  // Inventory
  const [inventory, setInventory] = useState<Record<string, boolean>>({
    wire_cutters: false,
    flashlight: false,
    torn_map: false,
  });

  // Kho Phế Liệu (junk storage hook mini-game): 5 drops per night
  const JUNK_ATTEMPTS_PER_NIGHT = 1;
  const [junkAttemptsLeft, setJunkAttemptsLeft] = useState(JUNK_ATTEMPTS_PER_NIGHT);

  // Overlays & UI
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(() => gameAudio.isVoiceEnabled());
  useEffect(() => {
    if (isGameMenuOpen) setIsVoiceOn(gameAudio.isVoiceEnabled());
  }, [isGameMenuOpen]);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [endingType, setEndingType] = useState<EndingType | null>(null);

  // Telesales progress (call UI lives in TelesalesScene.tsx)
  const [failStreak, setFailStreak] = useState(0);
  const [todayQuota, setTodayQuota] = useState(DAILY_QUOTA);
  const [passesToday, setPassesToday] = useState(0);
  const [warnedToday, setWarnedToday] = useState(0);
  const [mealTickets, setMealTickets] = useState(0);

  // Debt / escape / endings progress
  const [extraDebt, setExtraDebt] = useState(0);
  const [warningsUncaught, setWarningsUncaught] = useState(0);
  const [escapeFailures, setEscapeFailures] = useState(0);

  // Roommates & night story
  const [roommates, setRoommates] = useState<Record<RoommateId, RoommateState>>(makeRoommates);
  const [nightActionsLeft, setNightActionsLeft] = useState(NIGHT_ACTIONS);
  const [roommateLog, setRoommateLog] = useState<string[]>([]);
  const [hoaSchedule, setHoaSchedule] = useState(false);
  const [phoneFixed, setPhoneFixed] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [rescueDay, setRescueDay] = useState<number | null>(null);

  // Random daily events
  const [dailyEvent, setDailyEvent] = useState<DailyEventView | null>(null);
  const [outageTonight, setOutageTonight] = useState(false);
  // consecutive mornings the living fee could not be paid in full
  const [unpaidFeeStreak, setUnpaidFeeStreak] = useState(0);

  // DOM-level shock FX (works over every scene)
  const [shockFx, setShockFx] = useState(false);
  const endingFiredRef = useRef(false);
  const caughtCooldownRef = useRef(0);
  const escapeTimeRef = useRef(90);
  const escapeResolvingRef = useRef(false);
  const mazeGuardsRef = useRef<GuardAI[]>([]);
  const [hasSave, setHasSave] = useState(() => readSave() !== null);

  // Escape Maze Countdown (90 seconds)
  const [escapeTimer, setEscapeTimer] = useState(90);

  // Notification Toast & CRT Glitch
  const [notification, setNotification] = useState<string | null>(
    'Chào mừng đến Khu Trại. Hãy đến Phòng Telesales để gọi điện đủ KPI hôm nay!',
  );
  const [screenShake, setScreenShake] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);

  // Player Entity in Overworld
  const playerRef = useRef<Entity>({
    id: 'player',
    type: 'PLAYER',
    x: 200,
    y: 350,
    width: 44,
    height: 60,
    vx: 0,
    vy: 0,
    facingLeft: false,
  });

  const playerAnimRef = useRef<SpriteAnimationState>({
    currentAction: 'IDLE',
    currentFrame: 0,
    timer: 0,
  });

  // Guards AI in Overworld and Escape Scene
  const guardsRef = useRef<GuardAI[]>([
    {
      id: 'guard_1',
      x: 600,
      y: 180,
      patrolPoints: [
        {x: 600, y: 180},
        {x: 880, y: 180},
        {x: 880, y: 360},
        {x: 600, y: 360},
      ],
      currentPointIndex: 0,
      angle: 0,
      state: 'UNAWARE',
      suspicionTimer: 0,
      visionRange: 160,
      visionAngle: Math.PI / 4,
      speed: getConfig('guardSpeed') as number,
    },
    {
      id: 'guard_2',
      x: 950,
      y: 480,
      patrolPoints: [
        {x: 950, y: 480},
        {x: 1180, y: 480},
        {x: 1180, y: 620},
        {x: 950, y: 620},
      ],
      currentPointIndex: 0,
      angle: Math.PI,
      state: 'UNAWARE',
      suspicionTimer: 0,
      visionRange: 180,
      visionAngle: Math.PI / 3.5,
      speed: getConfig('guardSpeed') as number,
    },
    {
      id: 'guard_3',
      x: 350,
      y: 520,
      patrolPoints: [
        {x: 350, y: 520},
        {x: 600, y: 520},
      ],
      currentPointIndex: 0,
      angle: 0,
      state: 'UNAWARE',
      suspicionTimer: 0,
      visionRange: 150,
      visionAngle: Math.PI / 4,
      speed: getConfig('guardSpeed') as number,
    },
  ]);

  const guardAnimRefs = useRef<Record<string, SpriteAnimationState>>({
    guard_1: {currentAction: 'WALK', currentFrame: 0, timer: 0},
    guard_2: {currentAction: 'WALK', currentFrame: 0, timer: 0},
    guard_3: {currentAction: 'WALK', currentFrame: 0, timer: 0},
  });

  // Manager NPC in Call Room
  const managerHungRef = useRef<{x: number; y: number; facingLeft: boolean}>({
    x: 480,
    y: 190,
    facingLeft: true,
  });

  const managerAnimRef = useRef<SpriteAnimationState>({
    currentAction: 'IDLE',
    currentFrame: 0,
    timer: 0,
  });

  // Interactable hotspots in the compound
  const interactablesRef = useRef<OverworldInteractable[]>([
    {
      id: 'desk',
      x: 420,
      y: 200,
      width: 70,
      height: 70,
      label: 'Bàn Telesales (Gọi điện KPI)',
      action: 'DESK',
    },
    {
      id: 'canteen',
      x: 780,
      y: 200,
      width: 80,
      height: 70,
      label: 'Căn Tin (Mua đồ ăn)',
      action: 'CANTEEN',
    },
    {
      id: 'bed',
      x: 160,
      y: 320,
      width: 80,
      height: 70,
      label: 'Giường Ngủ (Nghỉ ngơi / Chuyển Đêm - Ngày)',
      action: 'BED',
    },
    {
      id: 'roommates',
      x: 95,
      y: 500,
      width: 130,
      height: 60,
      label: 'Bạn Cùng Phòng (Ban đêm)',
      action: 'ROOMMATES',
    },
    {
      id: 'locker_dorm',
      x: 90,
      y: 220,
      width: 50,
      height: 60,
      label: 'Tủ Đồ Ký Túc Xá (Lục lọi đồ thoát thân)',
      action: 'LOCKER',
    },
    {
      id: 'locker_yard',
      x: 1050,
      y: 230,
      width: 50,
      height: 60,
      label: 'Kho Phế Liệu (Ban đêm: Khều đồ)',
      action: 'JUNK_STORAGE',
    },
    {
      id: 'fence_breach',
      x: 1220,
      y: 350,
      width: 50,
      height: 80,
      label: 'Hàng Rào Dây Thép Gai Phía Đông (Vượt Ngục)',
      action: 'FENCE',
    },
  ]);

  // Sprite Renderers instantiated in refs
  const playerSpriteRendererRef = useRef<SpriteRenderer>();
  const guardSpriteRendererRef = useRef<SpriteRenderer>();
  const managerSpriteRendererRef = useRef<SpriteRenderer>();

  if (!playerSpriteRendererRef.current) {
    playerSpriteRendererRef.current = new SpriteRenderer(PLAYER_SPRITE_CONFIGS);
  }
  if (!guardSpriteRendererRef.current) {
    guardSpriteRendererRef.current = new SpriteRenderer(GUARD_SPRITE_CONFIGS);
  }
  if (!managerSpriteRendererRef.current) {
    managerSpriteRendererRef.current = new SpriteRenderer(MANAGER_SPRITE_CONFIGS);
  }

  // Virtual Mobile input tracking
  const mobileInputRef = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    interact: boolean;
  }>({
    left: false,
    right: false,
    up: false,
    down: false,
    interact: false,
  });

  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // Lifecycle reporting with Playground SDK
  usePlaygroundGameLifecycle(gameState, sdk);

  // Trigger notification message with timeout
  const showToast = useCallback((msg: string) => {
    setNotification(msg);
  }, []);
  // Phones: the toast overlays the stage, so let it fade away by itself
  useEffect(() => {
    if (!isTouch || !notification) return;
    const t = setTimeout(() => setNotification(null), 7000);
    return () => clearTimeout(t);
  }, [isTouch, notification]);

  // Latest stat values for callbacks that fire after a delay
  const statsRef = useRef({managerTrust, conscience, ransomFund, extraDebt, failStreak, warnedToday, warningsUncaught});
  statsRef.current = {managerTrust, conscience, ransomFund, extraDebt, failStreak, warnedToday, warningsUncaught};

  // Trigger ending (fires exactly once per run)
  const triggerEnding = useCallback((type: EndingType) => {
    if (endingFiredRef.current) return;
    endingFiredRef.current = true;
    setEndingType(type);
    setSceneMode('ENDING');
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    setHasSave(false);

    const good = type === 'ESCAPE' || type === 'RANSOM' || type === 'RESCUE' || type === 'WHISTLEBLOWER';
    const bonus: Record<EndingType, number> = {
      ESCAPE: 5000,
      RANSOM: 3500,
      RESCUE: 4000,
      WHISTLEBLOWER: 4500,
      OVERSEER: 1000,
      COLLAPSE: 0,
      SOLD: 0,
    };
    if (good) gameAudio.playVictoryFanfare();
    else gameAudio.playDefeatMotif();
    setGameState((prev) => ({
      ...prev,
      status: good ? 'VICTORY' : 'GAME_OVER',
      score: prev.score + bonus[type],
    }));
  }, []);

  // Trigger electric shock punishment (loud zap, violent shake, red flash + glitch)
  const triggerElectricShock = useCallback(
    (reason: string, staminaDmg = 30, moraleDmg = 25) => {
      gameAudio.playZap();
      gameAudio.playErrorBuzz();
      setScreenShake(18);
      setIsGlitching(true);
      setShockFx(true);
      setTimeout(() => setIsGlitching(false), 600);
      setTimeout(() => setShockFx(false), 900);

      setStamina((prev) => Math.max(0, prev - staminaDmg));
      setMorale((prev) => Math.max(0, prev - moraleDmg));
      setManagerTrust((prev) => Math.max(0, prev - 10));
      showToast(`ZZZT! HÌNH PHẠT CHÍCH ĐIỆN (-${staminaDmg} Thể Lực, -${moraleDmg} Tinh Thần): ${reason}`);
    },
    [showToast],
  );

  // Gục Ngã: Thể Lực or Tinh Thần reaches 0 (checked after every change)
  useEffect(() => {
    if (gameState.status === 'PLAYING' && (stamina <= 0 || morale <= 0)) {
      triggerEnding('COLLAPSE');
    }
  }, [stamina, morale, gameState.status, triggerEnding]);

  // Initialize or restart full game (or continue from a save)
  const initGame = useCallback(
    (saveArg?: unknown) => {
      const save = saveArg && (saveArg as SaveData).v === 1 ? (saveArg as SaveData) : null;
      endingFiredRef.current = false;
      escapeResolvingRef.current = false;
      setGameState({
        status: 'PLAYING',
        score: save ? save.score : 0,
        level: 1,
      });
      setSceneMode('OVERWORLD');
      setDayNumber(save ? save.dayNumber : 1);
      setIsNight(save ? save.isNight : false);
      setStamina(save ? save.stamina : (getConfig('startingStamina') as number));
      setMorale(save ? save.morale : (getConfig('startingMorale') as number));
      setMoney(save ? save.money : STARTING_MONEY);
      setRansomFund(save ? save.ransomFund : 0);
      setManagerTrust(save ? save.managerTrust : 50);
      setConscience(save ? save.conscience : 60);
      setCallsLeftToday(save ? save.callsLeftToday : DAILY_QUOTA);
      setTodayQuota(save && save.todayQuota ? save.todayQuota : DAILY_QUOTA);
      setInventory(save ? save.inventory : {wire_cutters: false, flashlight: false, torn_map: false});
      setJunkAttemptsLeft(save ? Math.min(save.junkAttemptsLeft, JUNK_ATTEMPTS_PER_NIGHT) : JUNK_ATTEMPTS_PER_NIGHT);
      setFailStreak(save ? save.failStreak : 0);
      setPassesToday(save ? save.passesToday : 0);
      setWarnedToday(0);
      setMealTickets(save ? save.mealTickets : 1);
      setExtraDebt(save ? save.extraDebt : 0);
      setWarningsUncaught(save ? save.warningsUncaught : 0);
      setEscapeFailures(save ? save.escapeFailures : 0);
      setRoommates(save ? save.roommates : makeRoommates());
      setNightActionsLeft(save ? save.nightActionsLeft : NIGHT_ACTIONS);
      setRoommateLog([]);
      setHoaSchedule(save ? save.hoaSchedule : false);
      setPhoneFixed(save ? save.phoneFixed : false);
      setMessageSent(save ? save.messageSent : false);
      setRescueDay(save ? save.rescueDay : null);
      setOutageTonight(save ? save.outageTonight : false);
      setUnpaidFeeStreak(save && save.unpaidFeeStreak ? save.unpaidFeeStreak : 0);
      setDailyEvent(null);
      setEndingType(null);
      setIsGameMenuOpen(false);
      setIsHowToPlayOpen(false);
      setEscapeTimer(getConfig('escapeTimeLimit') as number);

      playerRef.current = {
        id: 'player',
        type: 'PLAYER',
        x: 200,
        y: 350,
        width: 44,
        height: 60,
        vx: 0,
        vy: 0,
        facingLeft: false,
      };

      gameAudio.playConfirmSelect();
      showToast(
        save
          ? `Tiếp tục: Ngày ${save.dayNumber}${save.isNight ? ' (ban đêm)' : ''}. Cố lên, đừng bỏ cuộc!`
          : `Ngày 1: Đến bàn Telesales gọi đủ ${DAILY_QUOTA} cuộc KPI. Chưa xong KPI thì quản lý không cho về phòng ngủ!`,
      );
      if (sdk) {
        sdk.startGame();
      }
    },
    [sdk, showToast],
  );

  // Autosave (localStorage) whenever the player is back in the overworld
  useEffect(() => {
    if (gameState.status !== 'PLAYING' || sceneMode !== 'OVERWORLD' || endingFiredRef.current) return;
    const data: SaveData = {
      v: 1,
      dayNumber,
      isNight,
      stamina,
      morale,
      money,
      ransomFund,
      managerTrust,
      conscience,
      callsLeftToday,
      inventory,
      junkAttemptsLeft,
      failStreak,
      passesToday,
      mealTickets,
      extraDebt,
      warningsUncaught,
      escapeFailures,
      roommates,
      nightActionsLeft,
      hoaSchedule,
      phoneFixed,
      messageSent,
      rescueDay,
      outageTonight,
      todayQuota,
      unpaidFeeStreak,
      score: gameState.score,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      setHasSave(true);
    } catch {}
  }, [
    gameState.status, gameState.score, sceneMode, dayNumber, isNight, stamina, morale, money, ransomFund,
    managerTrust, conscience, callsLeftToday, inventory, junkAttemptsLeft, failStreak, passesToday,
    mealTickets, extraDebt, warningsUncaught, escapeFailures, roommates, nightActionsLeft, hoaSchedule,
    phoneFixed, messageSent, rescueDay, outageTonight, todayQuota, unpaidFeeStreak,
  ]);

  // ---------------------------------------------------------------------------
  // Helpers shared by events / punishments
  // ---------------------------------------------------------------------------
  const ownedEscapeItems = (): EscapeItemId[] =>
    (Object.keys(ESCAPE_ITEM_NAMES) as EscapeItemId[]).filter((k) => inventory[k]);

  /** Remove one random carried escape item. Returns its name, or null. */
  const loseRandomItem = (): string | null => {
    const owned = ownedEscapeItems();
    if (owned.length === 0) return null;
    const id = owned[Math.floor(Math.random() * owned.length)];
    setInventory((prev) => ({...prev, [id]: false}));
    return ESCAPE_ITEM_NAMES[id];
  };

  const ransomTarget = (getConfig('targetRansom') as number) + extraDebt;

  // ---------------------------------------------------------------------------
  // Morning: new day + random daily event
  // ---------------------------------------------------------------------------
  const advanceToMorning = () => {
    const newDay = dayNumber + 1;
    if (rescueDay !== null && newDay >= rescueDay) {
      triggerEnding('RESCUE');
      return;
    }
    if (newDay > MAX_DAYS) {
      triggerEnding('SOLD');
      return;
    }
    const yesterdayPasses = passesToday;
    setIsNight(false);
    setDayNumber(newDay);
    setStamina((prev) => Math.min(100, prev + 20));
    setMorale((prev) => Math.min(100, prev + 15));
    setPassesToday(0);
    // Daily living fee; shortfall goes onto the debt
    let cash = money;
    let feeNote: string;
    let feeAlert: string | undefined;
    let rentShockReason: string | null = null;
    if (cash >= LIVING_FEE) {
      cash -= LIVING_FEE;
      feeNote = `Phí ăn ở: -$${LIVING_FEE}.`;
      setUnpaidFeeStreak(0);
    } else {
      const short = LIVING_FEE - cash;
      const streak = unpaidFeeStreak + 1;
      cash = 0;
      setExtraDebt((d) => d + short);
      setUnpaidFeeStreak(streak);
      feeNote = `Phí ăn ở $${LIVING_FEE}: không đủ tiền, $${short} bị cộng vào nợ!`;
      if (streak >= 2) {
        rentShockReason = `Không nộp đủ tiền nhà ${streak} ngày liên tiếp!`;
        feeAlert = `⚡ ${rentShockReason} Quản lý cho chích điện đầu ca: -30 Thể Lực, -25 Tinh Thần. Nộp đủ $${LIVING_FEE} sáng mai để thoát.`;
      } else {
        feeAlert = `Thiếu tiền nhà! Mai còn thiếu là bị chích điện. (Giữ lại ít nhất $${LIVING_FEE} tiền mặt trước khi ngủ.)`;
      }
    }
    setWarnedToday(0);
    setNightActionsLeft(NIGHT_ACTIONS);
    setRoommateLog([]);
    setOutageTonight(false);
    setRoommates((prev) => {
      const next = {...prev};
      (Object.keys(next) as RoommateId[]).forEach((id) => {
        if (next[id].present) next[id] = {...next[id], relationship: Math.max(0, next[id].relationship - 2)};
      });
      return next;
    });

    let quota = DAILY_QUOTA;
    let ev: DailyEventView = {
      id: 'QUIET',
      title: 'Một buổi sáng như mọi ngày',
      text: 'Tiếng loa rè rè gọi mọi người vào ca. Không có gì đặc biệt... ngoài nỗi nhớ nhà.',
      tone: 'neutral',
    };
    const presentIds = (Object.keys(roommates) as RoommateId[]).filter((id) => roommates[id].present);
    const tuan = roommates.tuan;
    const r = Math.random();

    if (tuan.present && tuan.relationship < 25 && ownedEscapeItems().length > 0 && Math.random() < 0.5) {
      const lost = loseRandomItem();
      setMorale((prev) => Math.max(0, prev - 10));
      setRoommates((prev) => ({...prev, tuan: {...prev.tuan, lastLine: 'Tuấn không dám nhìn bạn. Trên tay cậu là hộp cơm thịt của quản lý...'}}));
      ev = {
        id: 'TUAN_BETRAYAL',
        title: 'Tuấn phản bội!',
        text: `Đói quá, Tuấn mách lính gác chỗ bạn giấu đồ để đổi lấy một hộp cơm thịt. Bạn bị tịch thu [${lost}]. (-10 Tinh Thần)\nGợi ý: chia đồ ăn với Tuấn để cậu ấy không phải lựa chọn như vậy.`,
        tone: 'bad',
      };
    } else if (presentIds.length > 1 && dayNumber >= 3 && (yesterdayPasses <= 1 || managerTrust < 30) && Math.random() < 0.35) {
      const id = presentIds[Math.floor(Math.random() * presentIds.length)];
      const def = ROOMMATES.find((x) => x.id === id)!;
      setRoommates((prev) => ({...prev, [id]: {...prev[id], present: false, lastLine: 'Giường trống trơn. Chỉ còn lại đôi dép cũ.'}}));
      setMorale((prev) => Math.max(0, prev - 15));
      ev = {
        id: 'ROOMMATE_SOLD',
        title: `${def.name} bị "bán" sang trại khác`,
        text: `Doanh số cả phòng quá thấp. Sáng sớm, ${def.name} bị lôi lên xe tải, "bán" sang một khu khác tệ hơn. Bạn không kịp nói lời tạm biệt. (-15 Tinh Thần)${
          id === 'bao' && !phoneFixed && !messageSent ? '\nKhông còn ai sửa được điện thoại cũ nữa...' : ''
        }${id === 'hoa' && !hoaSchedule ? '\nBạn mất đi người duy nhất biết lịch gác.' : ''}`,
        tone: 'bad',
      };
    } else if (r < 0.25) {
      // Surprise phone inspection
      if (tuan.present && tuan.relationship >= 60) {
        ev = {
          id: 'INSPECTION',
          title: 'Khám phòng bất ngờ!',
          text: 'Tuấn ho to ra hiệu từ ngoài hành lang, bạn kịp giấu hết đồ. Lính gác lục tung giường nhưng không tìm thấy gì.',
          tone: 'good',
        };
      } else if (phoneFixed && !messageSent) {
        setPhoneFixed(false);
        setMorale((prev) => Math.max(0, prev - 10));
        ev = {
          id: 'INSPECTION',
          title: 'Khám điện thoại bất ngờ!',
          text: 'Lính gác lục soát phòng và tịch thu chiếc điện thoại cũ Bảo vừa sửa. (-10 Tinh Thần) Phải nhờ Bảo sửa lại.',
          tone: 'bad',
        };
      } else if (ownedEscapeItems().length > 0 && Math.random() < 0.5) {
        const lost = loseRandomItem();
        ev = {
          id: 'INSPECTION',
          title: 'Khám phòng bất ngờ!',
          text: `Lính gác lật tung nệm và tịch thu [${lost}].`,
          tone: 'bad',
        };
      } else {
        const taken = Math.floor(cash / 2);
        cash -= taken;
        ev = {
          id: 'INSPECTION',
          title: 'Khám điện thoại & tư trang!',
          text: `Lính gác kiểm tra điện thoại và túi đồ của từng người, "thu phí giữ hộ" một nửa tiền mặt: -$${taken}. (Tiền đã nộp vào Quỹ Chuộc Thân thì không bị lấy.)`,
          tone: 'bad',
        };
      }
    } else if (r < 0.45) {
      quota = 3;
      setOutageTonight(true);
      ev = {
        id: 'OUTAGE',
        title: 'Mất điện toàn khu!',
        text: 'Máy phát điện hỏng. Hôm nay chỉ phải gọi 3 cuộc. Đêm nay đèn pha tắt, tầm nhìn của lính gác giảm hẳn - cơ hội lén lút!',
        tone: 'good',
      };
    } else if (r < 0.65) {
      setMorale((prev) => Math.max(0, prev - 8));
      setConscience((prev) => Math.min(100, prev + 5));
      ev = {
        id: 'NEW_ARRIVALS',
        title: 'Người mới đến',
        text: 'Một xe tải chở thêm 12 người mới, ai cũng cầm tờ quảng cáo "Tuyển CSKH lương 30 triệu, bao vé máy bay". Nhìn họ, bạn thấy chính mình ngày đầu. (-8 Tinh Thần, +5 Lương Tâm)',
        tone: 'neutral',
      };
    }
    setMoney(cash);
    setCallsLeftToday(quota);
    setTodayQuota(quota);
    setDailyEvent({...ev, fee: feeNote, feeAlert});
    showToast(`Trời sáng: Ngày ${newDay}/${MAX_DAYS}. ${feeNote} KPI hôm nay: ${quota} cuộc.`);
    // 2nd+ consecutive unpaid morning: shocked at start of shift (after the morning recovery;
    // the collapse check still fires if a stat hits 0)
    if (rentShockReason) triggerElectricShock(rentShockReason);
  };

  // ---------------------------------------------------------------------------
  // Telesales call results
  // ---------------------------------------------------------------------------
  const handleCallChoice = (trustDelta: number, conscienceDelta: number) => {
    setManagerTrust((prev) => Math.max(0, Math.min(100, prev + trustDelta)));
    setConscience((prev) => Math.max(0, Math.min(100, prev + conscienceDelta)));
  };

  const handleCallEnd = (result: CallResult): string => {
    const st = statsRef.current;
    setCallsLeftToday((prev) => {
      const left = Math.max(0, prev - 1);
      if (left === 0) showToast('Đã gọi đủ KPI hôm nay! Ghé căn tin rồi về giường ngủ để sang đêm.');
      return left;
    });
    setStamina((prev) => Math.max(0, prev - CALL_STAMINA_COST));

    if (result === 'PASS') {
      setMorale((prev) => Math.max(0, prev - 2));
      setMoney((prev) => prev + PASS_MONEY);
      setMealTickets((prev) => prev + 1);
      setManagerTrust((prev) => Math.min(100, prev + 5));
      setConscience((prev) => Math.max(0, prev - 3));
      setPassesToday((prev) => prev + 1);
      setFailStreak(0);
      setGameState((prev) => ({...prev, score: prev.score + 500}));
      if (st.managerTrust + 5 >= 90 && st.conscience - 3 <= 10) {
        setTimeout(() => triggerEnding('OVERSEER'), 1500);
      }
      return `+$${PASS_MONEY} hoa hồng (vào Tiền, nhớ nộp Quỹ ở căn tin) · +1 Phiếu Cơm · +5 Lòng Tin · -3 Lương Tâm · -${CALL_STAMINA_COST} Thể Lực`;
    }

    if (result === 'FAIL') {
      setMorale((prev) => Math.max(0, prev - 10));
      setManagerTrust((prev) => Math.max(0, prev - 5));
      const streak = st.failStreak + 1;
      if (streak >= 3) {
        setFailStreak(0);
        setTimeout(() => triggerElectricShock('Trượt 3 cuộc gọi liên tiếp, Quản lý Hùng xách dùi cui điện tới!'), 350);
        return 'TRƯỢT 3 CUỘC LIÊN TIẾP! Quản lý Hùng xách dùi cui điện tới bàn bạn...';
      }
      setFailStreak(streak);
      return `Trượt liên tiếp: ${streak}/3. Trượt thêm ${3 - streak} cuộc nữa là bị chích điện! (-10 Tinh Thần, -5 Lòng Tin)`;
    }

    // WARNED
    setMorale((prev) => Math.max(0, prev - 4));
    setWarnedToday((prev) => prev + 1);
    const caughtChance = warningCatchChance({
      managerTrust: st.managerTrust,
      warnedToday: st.warnedToday,
      warningsUncaught: st.warningsUncaught,
      tuanCovers: roommates.tuan.present && roommates.tuan.relationship >= 60,
    });
    if (Math.random() < caughtChance) {
      setTimeout(() => triggerElectricShock('Quản lý Hùng nghe thấy bạn cảnh báo nạn nhân!', 20, 15), 350);
      return 'BỊ PHÁT HIỆN! Quản lý Hùng đứng ngay sau lưng bạn từ lúc nào...';
    }
    const n = st.warningsUncaught + 1;
    setWarningsUncaught(n);
    setGameState((prev) => ({...prev, score: prev.score + 300}));
    if (n >= WHISTLEBLOWER_TARGET) {
      setTimeout(() => triggerEnding('WHISTLEBLOWER'), 1500);
    }
    return `Không ai phát hiện. Số nạn nhân đã được bạn cảnh báo: ${n}/${WHISTLEBLOWER_TARGET}. (+15 Lương Tâm)`;
  };

  // ---------------------------------------------------------------------------
  // Roommates (night)
  // ---------------------------------------------------------------------------
  const pushRoommateLog = (msg: string) => setRoommateLog((prev) => [msg, ...prev].slice(0, 4));

  const consumeNightAction = () => {
    if (nightActionsLeft <= 0) {
      gameAudio.playErrorBuzz();
      return false;
    }
    setNightActionsLeft((n) => n - 1);
    return true;
  };

  const applyRelationship = (id: RoommateId, delta: number) => {
    const def = ROOMMATES.find((x) => x.id === id)!;
    const before = roommates[id].relationship;
    const rel = Math.min(100, before + delta);
    const bandIdx = rel >= 60 ? 2 : rel >= 30 ? 1 : 0;
    const lines = def.talk[bandIdx];
    let line = lines[Math.floor(Math.random() * lines.length)];
    if (id === 'hoa' && rel >= 60 && !hoaSchedule) {
      setHoaSchedule(true);
      line = def.talk[2][0];
      pushRoommateLog('★ Chị Hoa tiết lộ lịch gác: ban đêm lính gác đi chậm hơn, -20% tầm nhìn lính gác và bạn thấy được lộ trình tuần tra (cả ở màn vượt rào).');
    }
    if (id === 'tuan' && before < 60 && rel >= 60) {
      pushRoommateLog('★ Tuấn hứa sẽ ra hiệu khi lính gác khám phòng.');
    }
    if (id === 'bao' && before < 60 && rel >= 60 && !phoneFixed) {
      pushRoommateLog('★ Bảo tin bạn. Anh ấy có thể sửa chiếc điện thoại cũ.');
    }
    setRoommates((prev) => ({...prev, [id]: {...prev[id], relationship: rel, lastLine: line}}));
  };

  const handleTalk = (id: RoommateId) => {
    if (!consumeNightAction()) return;
    applyRelationship(id, 10);
    setMorale((prev) => Math.min(100, prev + 5));
    setConscience((prev) => Math.min(100, prev + 2));
    pushRoommateLog(`Bạn trò chuyện với ${ROOMMATES.find((x) => x.id === id)!.name}. (+10 quan hệ, +5 Tinh Thần)`);
  };

  const handleShare = (id: RoommateId) => {
    if (mealTickets <= 0 && money < SHARE_FOOD_PRICE) {
      gameAudio.playErrorBuzz();
      showToast('Không có phiếu cơm hay tiền để chia đồ ăn.');
      return;
    }
    if (!consumeNightAction()) return;
    if (mealTickets > 0) setMealTickets((n) => n - 1);
    else setMoney((m) => m - SHARE_FOOD_PRICE);
    gameAudio.playCoinPickup();
    applyRelationship(id, id === 'tuan' ? 22 : 18);
    setConscience((prev) => Math.min(100, prev + 5));
    setStamina((prev) => Math.max(1, prev - 5));
    pushRoommateLog(
      `Bạn chia phần ăn cho ${ROOMMATES.find((x) => x.id === id)!.name}. (+quan hệ, +5 Lương Tâm, -5 Thể Lực)`,
    );
  };

  const handleFixPhone = () => {
    if (!consumeNightAction()) return;
    setPhoneFixed(true);
    gameAudio.playLevelUpStinger();
    setRoommates((prev) => ({...prev, bao: {...prev.bao, lastLine: 'Bảo nối mấy sợi dây bằng răng. Màn hình nứt sáng lên: 1 vạch sóng. "Được rồi. Nhắn thật ngắn."'}}));
    pushRoommateLog('★ Bảo đã sửa xong chiếc điện thoại cũ! Bạn có thể lén nhắn tin cầu cứu gia đình.');
  };

  const handleSendMessage = () => {
    if (!consumeNightAction()) return;
    let risk = hoaSchedule ? 0.15 : 0.35;
    if (roommates.tuan.present && roommates.tuan.relationship >= 60) risk -= 0.05;
    if (outageTonight) risk -= 0.1;
    if (Math.random() < risk) {
      setPhoneFixed(false);
      pushRoommateLog('✗ Đèn pin lính gác rọi thẳng vào mặt bạn! Điện thoại bị tịch thu.');
      triggerElectricShock('Bị bắt quả tang dùng điện thoại lén!');
      return;
    }
    const day = dayNumber + RESCUE_DELAY_DAYS;
    setMessageSent(true);
    setRescueDay(day);
    gameAudio.playVictoryFanfare();
    pushRoommateLog(`★ Tin nhắn đã gửi đi! Gia đình đã báo công an & Đại sứ quán. Hãy sống sót tới sáng ngày ${day}.`);
    showToast(`Đã gửi tin cầu cứu! Cố gắng sống sót đến sáng ngày ${day}.`);
  };

  // ---------------------------------------------------------------------------
  // Escape maze start / failure
  // ---------------------------------------------------------------------------
  const startEscape = () => {
    const limit = getConfig('escapeTimeLimit') as number;
    mazeGuardsRef.current = buildMazeGuards(escapeFailures, getConfig('guardSpeed') as number, hoaSchedule);
    mazeGuardsRef.current.forEach((g) => {
      guardAnimRefs.current[g.id] = {currentAction: 'WALK', currentFrame: 0, timer: 0};
    });
    escapeTimeRef.current = limit;
    escapeResolvingRef.current = false;
    setEscapeTimer(limit);
    setSceneMode('ESCAPE_MAZE');
    playerRef.current.x = 80;
    playerRef.current.y = 360;
    showToast(
      `CẮT RÀO THÀNH CÔNG! Chạy tới ĐIỂM THOÁT trong ${limit} giây. Tránh nón đèn của ${mazeGuardsRef.current.length} lính gác${
        escapeFailures > 0 ? ` (canh gác tăng cường sau ${escapeFailures} lần thất bại)` : ''
      }!`,
    );
    gameAudio.playLevelUpStinger();
  };

  const handleEscapeFail = (why: string) => {
    if (escapeResolvingRef.current || endingFiredRef.current) return;
    escapeResolvingRef.current = true;
    setExtraDebt((d) => d + ESCAPE_FAIL_DEBT);
    setEscapeFailures((n) => n + 1);
    setInventory((prev) => ({...prev, wire_cutters: false}));
    setSceneMode('OVERWORLD');
    playerRef.current.x = 200;
    playerRef.current.y = 350;
    triggerElectricShock(
      `${why} Bị đánh, chích điện, lôi về ký túc xá. Kìm bị tịch thu, nợ +$${ESCAPE_FAIL_DEBT}, canh gác tăng cường!`,
    );
  };

  const morningRef = useRef(advanceToMorning);
  morningRef.current = advanceToMorning;
  const startEscapeRef = useRef(startEscape);
  startEscapeRef.current = startEscape;

  // Autoplay handler for preview testing
  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  // Handle interaction button press
  const handleInteraction = useCallback(() => {
    if (gameState.status !== 'PLAYING') return;

    if (sceneMode === 'OVERWORLD') {
      const p = playerRef.current;
      const nearby = interactablesRef.current.find((item) => {
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        const px = p.x + p.width / 2;
        const py = p.y + p.height / 2;
        return Math.hypot(cx - px, cy - py) < 75;
      });

      if (!nearby) return;

      gameAudio.playCrispClick();

      if (nearby.action === 'DESK') {
        if (isNight) {
          showToast('Ca làm việc đã kết thúc. Phòng Telesales khóa cửa ban đêm.');
          return;
        }
        if (callsLeftToday <= 0) {
          showToast('Hôm nay bạn đã hoàn thành đủ chỉ tiêu gọi điện! Hãy ghé căn tin hoặc về giường ngủ.');
          return;
        }
        setSceneMode('TELESALES');
      } else if (nearby.action === 'ROOMMATES') {
        if (!isNight) {
          showToast('Ban ngày cả phòng đều bị lùa lên ca. Tối về hãy nói chuyện với bạn cùng phòng.');
          return;
        }
        setSceneMode('ROOMMATES');
      } else if (nearby.action === 'CANTEEN') {
        setSceneMode('CANTEEN');
      } else if (nearby.action === 'BED') {
        // Toggle Day / Night or Sleep
        if (!isNight) {
          if (callsLeftToday > 0) {
            gameAudio.playErrorBuzz();
            showToast(`Quản lý Hùng chặn cửa: "Chưa đủ KPI mà đòi ngủ à?" Còn ${callsLeftToday} cuộc gọi phải làm.`);
            return;
          }
          setIsNight(true);
          setJunkAttemptsLeft(JUNK_ATTEMPTS_PER_NIGHT);
          setNightActionsLeft(NIGHT_ACTIONS);
          showToast(
            outageTonight
              ? 'Đêm mất điện! Đèn pha tắt, lính gác nhìn kém hẳn. Tranh thủ nói chuyện với bạn cùng phòng hoặc lén tìm đồ!'
              : 'Đêm buông xuống. Lính gác bật đèn pin tuần tra. Nói chuyện với bạn cùng phòng hoặc lén tìm đồ thoát thân!',
          );
        } else {
          // Advance to next day (random morning event)
          morningRef.current();
        }
        gameAudio.playConfirmSelect();
      } else if (nearby.action === 'LOCKER') {
        if (nearby.id === 'locker_dorm') {
          if (!inventory.flashlight) {
            setInventory((prev) => ({...prev, flashlight: true}));
            gameAudio.playCoinPickup();
            showToast('Tìm thấy [Đèn Pin Bỏ Túi] giấu dưới nệm! (Tăng tầm nhìn trong đêm)');
          } else if (!inventory.torn_map || !inventory.wire_cutters) {
            showToast('Tủ đồ chỉ còn quần áo cũ. Nghe đồn [Bản Đồ Rách] và [Kìm Cắt Dây Thép] bị vứt trong Kho Phế Liệu ngoài sân...');
          } else {
            showToast('Tủ đồ này không còn vật dụng gì giá trị.');
          }
        }
      } else if (nearby.action === 'JUNK_STORAGE') {
        if (!isNight) {
          showToast('Ban ngày kho phế liệu có người canh. Hãy quay lại vào BAN ĐÊM để lén khều đồ qua cửa sổ!');
        } else if (inventory.flashlight && inventory.torn_map && inventory.wire_cutters) {
          showToast('Bạn đã có đủ đồ thoát thân. Trong kho chỉ còn rác vô dụng.');
        } else if (junkAttemptsLeft <= 0) {
          showToast('Đêm nay bạn đã thả móc rồi (mỗi đêm chỉ 1 lượt). Lính gác sắp đi tuần tới, quay lại đêm mai!');
        } else {
          setSceneMode('JUNK_STORAGE');
          gameAudio.playConfirmSelect();
          showToast('Kho Phế Liệu: dùng cần tre có móc khều đồ qua cửa sổ. Chỉ 1 lượt thả móc mỗi đêm, 60 giây trước khi lính gác đi tuần tới!');
        }
      } else if (nearby.action === 'FENCE') {
        if (!inventory.wire_cutters || !inventory.torn_map) {
          const missing = [
            !inventory.wire_cutters ? '[Kìm Cắt Dây Thép]' : null,
            !inventory.torn_map ? '[Bản Đồ Rách]' : null,
          ]
            .filter(Boolean)
            .join(' và ');
          showToast(`Hàng rào dây thép gai kiên cố! Bạn cần ${missing} (tìm trong Kho Phế Liệu ban đêm) mới có thể phá rào.`);
        } else if (!isNight) {
          showToast('Ban ngày lính gác đứng kín hàng rào. Chỉ có thể vượt rào vào BAN ĐÊM!');
        } else {
          // Trigger fence escape maze!
          startEscapeRef.current();
        }
      }
    }
  }, [
    gameState.status,
    sceneMode,
    callsLeftToday,
    showToast,
    isNight,
    dayNumber,
    inventory,
    junkAttemptsLeft,
    outageTonight,
  ]);

  // Redeem a phiếu cơm (earned from successful calls) for a free plate of cơm trắng
  const handleUseMealTicket = () => {
    if (mealTickets <= 0) {
      gameAudio.playErrorBuzz();
      showToast('Bạn không có phiếu cơm. Gọi điện đạt KPI để được thưởng phiếu.');
      return;
    }
    const food = FOOD_MENU.find((f) => f.id === 'white_rice')!; // phiếu chỉ đổi được Cơm Trắng
    gameAudio.playCoinPickup();
    setMealTickets((n) => n - 1);
    setStamina((prev) => Math.min(100, prev + food.staminaRestore));
    setMorale((prev) => Math.min(100, prev + food.moraleRestore));
    showToast(`Đổi 1 phiếu cơm lấy ${food.name}: +${food.staminaRestore} Thể Lực, +${food.moraleRestore} Tinh Thần.`);
  };

  // Buy food at Canteen
  const handleBuyFood = (food: FoodItem) => {
    if (money < food.price) {
      gameAudio.playErrorBuzz();
      showToast('Không đủ tiền! Hãy gọi điện kiếm thêm hoa hồng.');
      return;
    }

    gameAudio.playCoinPickup();
    setMoney((prev) => prev - food.price);
    setStamina((prev) => Math.min(100, prev + food.staminaRestore));
    setMorale((prev) => Math.min(100, prev + food.moraleRestore));
    showToast(`Đã dùng bữa: +${food.staminaRestore} Thể Lực, +${food.moraleRestore} Tinh Thần.`);
  };

  // Deposit cash into the ransom fund (Quỹ Chuộc Thân). RANSOM ending once fund >= debt.
  const handleDeposit = (amount: number | 'ALL') => {
    const amt = amount === 'ALL' ? money : Math.min(amount, money);
    if (amt <= 0) {
      gameAudio.playErrorBuzz();
      showToast('Không có tiền mặt để nộp. Gọi điện đạt KPI để nhận hoa hồng.');
      return;
    }
    const newFund = ransomFund + amt;
    const target = (getConfig('targetRansom') as number) + extraDebt;
    gameAudio.playCoinPickup();
    setMoney((prev) => prev - amt);
    setRansomFund(newFund);
    if (newFund >= target) {
      showToast(`Nộp $${amt}. Quỹ Chuộc Thân đã đủ $${newFund}/${target}!`);
      setTimeout(() => triggerEnding('RANSOM'), 1200);
    } else {
      showToast(`Đã nộp $${amt} vào Quỹ Chuộc Thân: $${newFund}/${target} (còn thiếu $${target - newFund}).`);
    }
  };

  // Simulation time accumulator for dynamic searchlights and lighting effects
  const gameTimeRef = useRef(0);

  // --- Main Simulation Update Loop (Physics & AI) ---
  const update = (dt: number) => {
    if (gameState.status !== 'PLAYING' || isGameMenuOpen || isHowToPlayOpen || dailyEvent) return;

    gameTimeRef.current += dt;
    if (caughtCooldownRef.current > 0) caughtCooldownRef.current -= dt;

    // Shake recovery
    if (screenShake > 0) {
      setScreenShake((prev) => Math.max(0, prev - dt * 25));
    }

    const input = inputRef.current;
    const mInput = mobileInputRef.current;

    // Movement axes
    let moveX = 0;
    let moveY = 0;
    if (input.actions.left || mInput.left) moveX -= 1;
    if (input.actions.right || mInput.right) moveX += 1;
    if (input.actions.up || mInput.up) moveY -= 1;
    if (input.actions.down || mInput.down) moveY += 1;

    // Check interaction trigger
    if ((input.actions.confirm || mInput.interact) && !lastConfirmRef.current) {
      handleInteraction();
      lastConfirmRef.current = true;
    } else if (!input.actions.confirm && !mInput.interact) {
      lastConfirmRef.current = false;
    }

    // 1. UPDATE OVERWORLD FREE-ROAMING
    if (sceneMode === 'OVERWORLD') {
      const p = playerRef.current;
      const speed = getConfig('playerSpeed') as number;

      if (moveX !== 0 || moveY !== 0) {
        const length = Math.hypot(moveX, moveY);
        p.vx = (moveX / length) * speed;
        p.vy = (moveY / length) * speed;
        p.x = Math.max(30, Math.min(canvasWidth - 70, p.x + p.vx * dt));
        p.y = Math.max(120, Math.min(canvasHeight - 90, p.y + p.vy * dt));

        if (moveX !== 0) {
          p.facingLeft = moveX < 0;
        }

        if (playerAnimRef.current.currentAction !== 'WALK') {
          playerAnimRef.current = {
            currentAction: 'WALK',
            currentFrame: 0,
            timer: 0,
          };
        }
      } else {
        p.vx = 0;
        p.vy = 0;
        if (playerAnimRef.current.currentAction !== 'IDLE') {
          playerAnimRef.current = {
            currentAction: 'IDLE',
            currentFrame: 0,
            timer: 0,
          };
        }
      }

      if (playerSpriteRendererRef.current) {
        playerAnimRef.current = playerSpriteRendererRef.current.getNextState(
          playerAnimRef.current,
          dt,
        );
      }

      // Update Guards Patrol in Overworld
      guardsRef.current.forEach((guard) => {
        const target = guard.patrolPoints[guard.currentPointIndex];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        const dist = Math.hypot(dx, dy);

        // Chị Hoa's guard schedule: night guards walk slower
        const guardSpeedNow = guard.speed * (isNight && hoaSchedule ? 0.75 : 1);
        if (dist < 8) {
          guard.currentPointIndex =
            (guard.currentPointIndex + 1) % guard.patrolPoints.length;
        } else {
          guard.angle = Math.atan2(dy, dx);
          guard.x += Math.cos(guard.angle) * guardSpeedNow * dt;
          guard.y += Math.sin(guard.angle) * guardSpeedNow * dt;
        }
        if (guard.state === 'ALERT' && caughtCooldownRef.current <= 0) guard.state = 'UNAWARE';

        // Night Vision Detection (the dorm building itself is a safe zone)
        const pcx = p.x + p.width / 2;
        const pcy = p.y + p.height / 2;
        const inDorm = pcx < 295 && pcy > 165 && pcy < 615;
        if (isNight && !inDorm && caughtCooldownRef.current <= 0) {
          const toPlayerX = pcx - guard.x;
          const toPlayerY = pcy - guard.y;
          const pDist = Math.hypot(toPlayerX, toPlayerY);
          const range = guard.visionRange * (outageTonight ? 0.6 : 1) * (hoaSchedule ? HOA_VISION_MUL : 1);

          if (pDist < range) {
            let angleDiff = Math.atan2(toPlayerY, toPlayerX) - guard.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) < guard.visionAngle / 2) {
              // Caught in cone: beaten + zapped, one carried item lost, back to dorm
              guard.state = 'ALERT';
              caughtCooldownRef.current = 2.5;
              const lost = loseRandomItem();
              triggerElectricShock(
                `Bị lính gác bắt khi lén lút ban đêm! Bị đánh và lôi về ký túc xá.${lost ? ` Bị tịch thu [${lost}].` : ''}`,
              );
              p.x = 200;
              p.y = 350;
            }
          }
        }

        const animState = guardAnimRefs.current[guard.id];
        if (animState && guardSpriteRendererRef.current) {
          guardAnimRefs.current[guard.id] =
            guardSpriteRendererRef.current.getNextState(animState, dt);
        }
      });
    }

    // 2. UPDATE ESCAPE MAZE (timer, wall collisions, guards with vision cones)
    if (sceneMode === 'ESCAPE_MAZE') {
      if (escapeResolvingRef.current) return;
      escapeTimeRef.current = Math.max(0, escapeTimeRef.current - dt);
      setEscapeTimer(escapeTimeRef.current);
      if (escapeTimeRef.current <= 0) {
        handleEscapeFail('Hết giờ! Còi báo động réo vang khắp trại.');
        return;
      }

      const p = playerRef.current;
      const speed = (getConfig('playerSpeed') as number) * 1.15;
      // collision box = feet area
      const box = (x: number, y: number) => rectHitsWalls(x + 8, y + 30, 28, 28);

      if (moveX !== 0 || moveY !== 0) {
        const length = Math.hypot(moveX, moveY);
        p.vx = (moveX / length) * speed;
        p.vy = (moveY / length) * speed;
        const nx = Math.max(36, Math.min(canvasWidth - 60, p.x + p.vx * dt));
        if (!box(nx, p.y)) p.x = nx;
        const ny = Math.max(76, Math.min(canvasHeight - 132, p.y + p.vy * dt));
        if (!box(p.x, ny)) p.y = ny;

        if (moveX !== 0) p.facingLeft = moveX < 0;

        if (playerAnimRef.current.currentAction !== 'WALK') {
          playerAnimRef.current = {
            currentAction: 'WALK',
            currentFrame: 0,
            timer: 0,
          };
        }
      } else {
        p.vx = 0;
        p.vy = 0;
        if (playerAnimRef.current.currentAction !== 'IDLE') {
          playerAnimRef.current = {
            currentAction: 'IDLE',
            currentFrame: 0,
            timer: 0,
          };
        }
      }

      if (playerSpriteRendererRef.current) {
        playerAnimRef.current = playerSpriteRendererRef.current.getNextState(
          playerAnimRef.current,
          dt,
        );
      }

      // Reached the extraction zone
      if (p.x >= canvasWidth - 120 && p.y + p.height / 2 >= 260 && p.y + p.height / 2 <= 460) {
        escapeResolvingRef.current = true;
        triggerEnding('ESCAPE');
        return;
      }

      const pcx = p.x + p.width / 2;
      const pcy = p.y + p.height / 2;
      const moveGuard = (g: GuardAI, tx: number, ty: number, spd: number) => {
        const a = Math.atan2(ty - g.y, tx - g.x);
        g.angle = a;
        const nx = g.x + Math.cos(a) * spd * dt;
        const ny = g.y + Math.sin(a) * spd * dt;
        if (!rectHitsWalls(nx - 10, g.y - 10, 20, 20)) g.x = nx;
        if (!rectHitsWalls(g.x - 10, ny - 10, 20, 20)) g.y = ny;
      };

      for (const guard of mazeGuardsRef.current) {
        const toX = pcx - guard.x;
        const toY = pcy - guard.y;
        const dist = Math.hypot(toX, toY);
        let angleDiff = Math.atan2(toY, toX) - guard.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const sees =
          dist < guard.visionRange &&
          Math.abs(angleDiff) < guard.visionAngle / 2 &&
          hasLineOfSight(guard.x, guard.y, pcx, pcy);

        if (sees) {
          if (guard.state !== 'ALERT') gameAudio.playErrorBuzz();
          guard.state = 'ALERT';
          guard.suspicionTimer = 2.2; // keeps chasing this long after losing sight
        } else if (guard.state === 'ALERT') {
          guard.suspicionTimer -= dt;
          if (guard.suspicionTimer <= 0) guard.state = 'UNAWARE';
        }

        if (guard.state === 'ALERT') {
          moveGuard(guard, pcx, pcy, guard.speed * 1.35);
          if (dist < 42) {
            handleEscapeFail('Lính gác tóm được bạn giữa bãi tuần tra!');
            return;
          }
        } else {
          const target = guard.patrolPoints[guard.currentPointIndex];
          if (Math.hypot(target.x - guard.x, target.y - guard.y) < 8) {
            guard.currentPointIndex = (guard.currentPointIndex + 1) % guard.patrolPoints.length;
          } else {
            moveGuard(guard, target.x, target.y, guard.speed);
          }
        }

        if (guardSpriteRendererRef.current && guardAnimRefs.current[guard.id]) {
          guardAnimRefs.current[guard.id] = guardSpriteRendererRef.current.getNextState(
            guardAnimRefs.current[guard.id],
            dt,
          );
        }
      }
    }
  };

  // Offscreen canvas for night / maze darkness masks
  const darkLayerRef = useRef<HTMLCanvasElement | null>(null);
  const getDarkLayer = () => {
    if (!darkLayerRef.current) {
      darkLayerRef.current = document.createElement('canvas');
      darkLayerRef.current.width = canvasWidth;
      darkLayerRef.current.height = canvasHeight;
    }
    return darkLayerRef.current;
  };

  // --- Main Canvas Drawing Loop ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);

    // Apply Screen Shake transform
    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
    }

    const time = gameTimeRef.current;
    const p = playerRef.current;

    // ========================================================================
    // 1. DRAW OVERWORLD SCENE
    // ========================================================================
    if (sceneMode === 'OVERWORLD') {
      // 1A. Background Compound Map Asset
      const mapImg = assets['bg_compound_map'];
      if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
        ctx.drawImage(mapImg, 0, 0, canvasWidth, canvasHeight);
        // Contrast & atmospheric color grade
        ctx.fillStyle = isNight ? 'rgba(5, 12, 18, 0.48)' : 'rgba(10, 16, 14, 0.18)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        // Fallback Realistic Procedural Compound Terrain
        ctx.fillStyle = '#141c19';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Weathered asphalt tarmac grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < canvasWidth; gx += 64) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, canvasHeight);
          ctx.stroke();
        }
        for (let gy = 0; gy < canvasHeight; gy += 64) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(canvasWidth, gy);
          ctx.stroke();
        }

        // Concrete road patrol lanes (yellow dashed lines)
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        ctx.moveTo(40, 110);
        ctx.lineTo(canvasWidth - 40, 110);
        ctx.moveTo(390, 415);
        ctx.lineTo(canvasWidth - 40, 415);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 1B. Building Foundation Slabs & Corrugated Roof Overlays
      // Room 1: Dormitory (Left)
      drawCorrugatedRoof(ctx, 40, 140, 320, 520, '#192823');
      // Room 2: Call Room (Center Top)
      drawCorrugatedRoof(ctx, 390, 140, 320, 260, '#162b25');
      // Room 3: Canteen (Right Top)
      drawCorrugatedRoof(ctx, 740, 140, 280, 260, '#21332b');
      // Courtyard Yard (Bottom / East)
      ctx.fillStyle = isNight ? 'rgba(7, 13, 16, 0.72)' : 'rgba(22, 33, 27, 0.45)';
      ctx.fillRect(390, 430, 840, 230);
      ctx.strokeStyle = '#263a33';
      ctx.lineWidth = 2;
      ctx.strokeRect(390, 430, 840, 230);

      // 1C. Interior Architectural Props & Features
      // --- Dormitory Interior ---
      // Metal Bunk beds
      drawBunkBed(ctx, 80, 320);
      drawBunkBed(ctx, 160, 320); // Interactive bed location
      drawBunkBed(ctx, 240, 320);
      // Dorm lockers
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(80, 210, 50, 40);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(80, 210, 50, 40);
      // Locker vents & copper lock
      for (let lk = 85; lk < 125; lk += 7) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lk, 216, 4, 18);
      }
      ctx.fillStyle = '#b45309';
      ctx.fillRect(102, 236, 6, 6);

      // Overhead fluorescent tube lamp glow in Dorm
      const dormLampGlow = ctx.createRadialGradient(200, 250, 10, 200, 250, 140);
      dormLampGlow.addColorStop(0, 'rgba(167, 243, 208, 0.18)');
      dormLampGlow.addColorStop(1, 'rgba(167, 243, 208, 0)');
      ctx.fillStyle = dormLampGlow;
      ctx.beginPath();
      ctx.arc(200, 250, 140, 0, Math.PI * 2);
      ctx.fill();

      // --- Call Room Interior ---
      // Row of telesales workstations
      drawCallDeskStation(ctx, 420, 200, true); // Interactive KPI desk
      drawCallDeskStation(ctx, 520, 200, false);
      drawCallDeskStation(ctx, 620, 200, false);
      // Manager supervisor desk at (480, 190)
      ctx.fillStyle = '#1c2824';
      ctx.fillRect(470, 260, 50, 24);
      ctx.strokeStyle = '#2d4239';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(470, 260, 50, 24);
      // Taser / megaphone prop on manager desk
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(476, 264, 8, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(486, 264, 12, 5);

      // Cold fluorescent tube glow in Call Room
      const callLampGlow = ctx.createRadialGradient(550, 260, 10, 550, 260, 150);
      callLampGlow.addColorStop(0, 'rgba(52, 211, 153, 0.22)');
      callLampGlow.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = callLampGlow;
      ctx.beginPath();
      ctx.arc(550, 260, 150, 0, Math.PI * 2);
      ctx.fill();

      // --- Canteen Interior ---
      drawCanteenServingCounter(ctx, 780, 200, time); // Interactive counter
      // Dining bench & table
      ctx.fillStyle = '#26342f';
      ctx.fillRect(860, 260, 70, 22);
      ctx.strokeStyle = '#384d45';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(860, 260, 70, 22);

      // Warm sodium light in Canteen
      const canteenLampGlow = ctx.createRadialGradient(880, 240, 10, 880, 240, 130);
      canteenLampGlow.addColorStop(0, 'rgba(253, 224, 71, 0.16)');
      canteenLampGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = canteenLampGlow;
      ctx.beginPath();
      ctx.arc(880, 240, 130, 0, Math.PI * 2);
      ctx.fill();

      // --- Courtyard & Scrap Storage ---
      drawScrapYardDumpster(ctx, 1040, 220); // Interactive scrap yard locker
      drawGroundDecalsAndPuddles(ctx, time);

      // 1D. Room Header Labels & Stencil Plaques
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 12px Courier New, monospace';
      ctx.fillText('■ KÝ TÚC XÁ CÔNG NHÂN (NGHỈ NGƠI)', 55, 160);
      ctx.fillText('■ PHÒNG TELESALES (MÁY TÍNH & KPI)', 405, 160);
      ctx.fillText('■ CĂN TIN TRẠI (PHỤC VỤ CƠM)', 755, 160);
      ctx.fillText(
        isNight
          ? '■ SÂN TUẦN TRA ĐÊM - NGUY HIỂM'
          : '■ SÂN TRẠI - BÃI PHẾ LIỆU & HÀNG RÀO',
        405,
        450,
      );

      // 1D-2. Wall calendar in the dorm (paper asset, days crossed off on top)
      ctx.save();
      {
        const calX = 230;
        const calY = 170;
        const calW = 58;
        const calH = 60;
        const calImg = assets['prop_wall_calendar'];
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(calX + 4, calY + 6, calW - 4, calH - 6);
        if (calImg && calImg.complete && calImg.naturalWidth > 0) {
          ctx.drawImage(calImg, calX, calY, calW, calH);
        } else {
          ctx.fillStyle = '#cfc8ad';
          ctx.fillRect(calX, calY, calW, calH);
        }
        ctx.fillStyle = '#f3e9d2';
        ctx.font = 'bold 7px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`NGÀY ${dayNumber}/${MAX_DAYS}`, calX + calW / 2, calY + calH * 0.17);
        const gx = calX + calW * 0.1;
        const gy = calY + calH * 0.28;
        const cw = (calW * 0.8) / 5;
        const ch = (calH * 0.62) / 4;
        for (let d = 1; d <= MAX_DAYS; d++) {
          const cx = gx + ((d - 1) % 5) * cw;
          const cy = gy + Math.floor((d - 1) / 5) * ch;
          if (d === dayNumber) {
            ctx.strokeStyle = '#9a3412';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);
          } else if (d < dayNumber) {
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(cx + 1.5, cy + 1.5);
            ctx.lineTo(cx + cw - 1.5, cy + ch - 1.5);
            ctx.moveTo(cx + cw - 1.5, cy + 1.5);
            ctx.lineTo(cx + 1.5, cy + ch - 1.5);
            ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(59, 52, 38, 0.35)';
            ctx.fillRect(cx + cw / 2 - 1, cy + ch / 2 - 1, 2, 2);
          }
        }
      }
      ctx.restore();

      // 1D-3. Roommates sitting on the dorm floor (only those still here)
      ctx.save();
      ROOMMATES.forEach((def, i) => {
        const st = roommates[def.id];
        if (!st.present) return;
        const cx = 122 + i * 42; // feet center x
        const by = 548; // feet baseline
        const img = assets[def.sitKey];
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, by - 2, 17, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (img && img.complete && img.naturalWidth > 0) {
          const h = 46;
          const w = (img.naturalWidth / img.naturalHeight) * h;
          ctx.drawImage(img, cx - w / 2, by - h, w, h);
        }
        // relationship marker
        ctx.fillStyle = st.relationship >= 60 ? '#f472b6' : st.relationship >= 30 ? '#fbbf24' : '#64748b';
        ctx.beginPath();
        ctx.arc(cx, by - 52, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // 1E. Perimeter Security Fences
      // Outer perimeter borders with razor wire
      drawRealisticChainFence(ctx, 35, 95, canvasWidth - 35, 95, 38);
      drawRealisticChainFence(ctx, 35, 95, 35, canvasHeight - 35, 38);
      drawRealisticChainFence(ctx, 35, canvasHeight - 35, canvasWidth - 35, canvasHeight - 35, 38);
      // East perimeter fence (gap at breach point 340-440)
      drawRealisticChainFence(ctx, canvasWidth - 35, 95, canvasWidth - 35, 340, 38);
      drawRealisticChainFence(ctx, canvasWidth - 35, 440, canvasWidth - 35, canvasHeight - 35, 38);

      // Breached East fence section (Visual highlight for escape point)
      ctx.save();
      ctx.strokeStyle = inventory.wire_cutters && inventory.torn_map ? '#22c55e' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(canvasWidth - 55, 350, 35, 80);
      ctx.fillStyle = inventory.wire_cutters && inventory.torn_map ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.15)';
      ctx.fillRect(canvasWidth - 55, 350, 35, 80);
      ctx.restore();

      // 1F. Watchtowers with Dynamic Sweeping Searchlights at 4 corners
      drawWatchtowerStructure(ctx, 75, 85, time, Math.PI / 4, Math.PI / 3, false);
      drawWatchtowerStructure(ctx, canvasWidth - 75, 85, time, (3 * Math.PI) / 4, Math.PI / 3, false);
      drawWatchtowerStructure(ctx, 75, canvasHeight - 75, time, -Math.PI / 4, Math.PI / 3, false);
      drawWatchtowerStructure(ctx, canvasWidth - 75, canvasHeight - 75, time, (-3 * Math.PI) / 4, Math.PI / 3, false);

      // 1G. Tactical Interactive Hotspots
      interactablesRef.current.forEach((obj) => {
        const cx = obj.x + obj.width / 2;
        const cy = obj.y + obj.height / 2;
        const px = p.x + p.width / 2;
        const py = p.y + p.height / 2;
        const isNearby = Math.hypot(cx - px, cy - py) < 75;
        drawTacticalHotspot(ctx, obj, isNearby, time, inventory, callsLeftToday);
      });

      // 1H. Manager Hung NPC in Call Room
      if (managerSpriteRendererRef.current && assetsReady) {
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(managerHungRef.current.x + 28, managerHungRef.current.y + 68, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        managerSpriteRendererRef.current.draw(
          ctx,
          managerAnimRef.current,
          managerHungRef.current.x,
          managerHungRef.current.y,
          56,
          72,
          assets,
          managerHungRef.current.facingLeft,
        );

        // Name tag & Status
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 11px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Quản Lý Hùng', managerHungRef.current.x + 28, managerHungRef.current.y - 10);
      }

      // 1I. Patrolling Security Guards & Vision Cones
      guardsRef.current.forEach((guard) => {
        // Ground drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(guard.x, guard.y + 32, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        if (guardSpriteRendererRef.current && assetsReady) {
          const animState = guardAnimRefs.current[guard.id] || {
            currentAction: 'IDLE',
            currentFrame: 0,
            timer: 0,
          };
          guardSpriteRendererRef.current.draw(
            ctx,
            animState,
            guard.x - 28,
            guard.y - 36,
            56,
            72,
            assets,
            guard.angle > Math.PI / 2 || guard.angle < -Math.PI / 2,
          );
        }

        // Dynamic Vision Cone with gradient & particle shimmer
        ctx.save();
        const isAlert = guard.state === 'ALERT';
        const coneRange = guard.visionRange * (isNight && outageTonight ? 0.6 : 1) * (isNight && hoaSchedule ? HOA_VISION_MUL : 1);
        const vGrad = ctx.createRadialGradient(
          guard.x,
          guard.y,
          5,
          guard.x,
          guard.y,
          coneRange,
        );
        if (isAlert) {
          vGrad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
          vGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.25)');
          vGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
        } else if (isNight) {
          vGrad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
          vGrad.addColorStop(0.7, 'rgba(250, 204, 21, 0.18)');
          vGrad.addColorStop(1, 'rgba(250, 204, 21, 0.04)');
        } else {
          vGrad.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
          vGrad.addColorStop(0.7, 'rgba(250, 204, 21, 0.08)');
          vGrad.addColorStop(1, 'rgba(250, 204, 21, 0.02)');
        }

        ctx.beginPath();
        ctx.moveTo(guard.x, guard.y);
        ctx.arc(
          guard.x,
          guard.y,
          coneRange,
          guard.angle - guard.visionAngle / 2,
          guard.angle + guard.visionAngle / 2,
        );
        ctx.closePath();
        ctx.fillStyle = vGrad;
        ctx.fill();

        ctx.strokeStyle = isAlert ? '#ef4444' : 'rgba(250, 204, 21, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Alert exclamation mark
        if (isAlert) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 18px Courier New, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('!', guard.x, guard.y - 45);
        }
        ctx.restore();
      });

      // 1J. Player Entity
      // Ground drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(p.x + p.width / 2, p.y + p.height - 2, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (playerSpriteRendererRef.current && assetsReady) {
        playerSpriteRendererRef.current.draw(
          ctx,
          playerAnimRef.current,
          p.x,
          p.y,
          p.width,
          p.height,
          assets,
          p.facingLeft,
        );
      }

      // 1K. Night Stealth Volumetric Darkness Mask
      if (isNight) {
        // Darkness is painted on an offscreen layer so the light cut-outs reveal
        // the scene (cutting holes directly in the main canvas erased the scene).
        const mainCtx = ctx;
        const darkLayer = getDarkLayer();
        {
        const ctx = darkLayer.getContext('2d')!;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();
        const lightRadius = inventory.flashlight ? 250 : 105; // no Đèn Pin: ~42% radius
        const px = p.x + p.width / 2;
        const py = p.y + p.height / 2;

        ctx.fillStyle = 'rgba(4, 9, 16, 0.88)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.globalCompositeOperation = 'destination-out';
        // Player primary light cutout
        const pGrad = ctx.createRadialGradient(px, py, 15, px, py, lightRadius);
        pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        pGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.85)');
        pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(px, py, lightRadius, 0, Math.PI * 2);
        ctx.fill();

        // Directional flashlight cone if flashlight is owned
        if (inventory.flashlight) {
          const dirAngle = p.facingLeft ? Math.PI : 0;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.arc(px, py, lightRadius * 1.35, dirAngle - Math.PI / 4, dirAngle + Math.PI / 4);
          ctx.closePath();
          ctx.fill();
        }

        // Ambient light cutouts around compound floodlights
        const compoundLights = [
          {x: 200, y: 250, r: 80},
          {x: 550, y: 260, r: 90},
          {x: 880, y: 240, r: 70},
        ];
        compoundLights.forEach((lt) => {
          const ltGrad = ctx.createRadialGradient(lt.x, lt.y, 5, lt.x, lt.y, lt.r);
          ltGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
          ltGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = ltGrad;
          ctx.beginPath();
          ctx.arc(lt.x, lt.y, lt.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
        }
        mainCtx.drawImage(darkLayer, 0, 0);

        // Guard flashlight cones stay visible through the darkness
        ctx.save();
        guardsRef.current.forEach((guard) => {
          const coneRange = guard.visionRange * (outageTonight ? 0.6 : 1) * (hoaSchedule ? HOA_VISION_MUL : 1);
          ctx.beginPath();
          ctx.moveTo(guard.x, guard.y);
          ctx.arc(guard.x, guard.y, coneRange, guard.angle - guard.visionAngle / 2, guard.angle + guard.visionAngle / 2);
          ctx.closePath();
          ctx.fillStyle = guard.state === 'ALERT' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(250, 204, 21, 0.12)';
          ctx.fill();
          ctx.strokeStyle = guard.state === 'ALERT' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(250, 204, 21, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
          ctx.beginPath();
          ctx.arc(guard.x, guard.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        // Chị Hoa's schedule: show patrol routes
        if (hoaSchedule) {
          ctx.setLineDash([3, 6]);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
          ctx.lineWidth = 1.5;
          guardsRef.current.forEach((guard) => {
            ctx.beginPath();
            guard.patrolPoints.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
            if (guard.patrolPoints.length > 2) ctx.closePath();
            ctx.stroke();
          });
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
          ctx.font = 'bold 11px Courier New, monospace';
          ctx.textAlign = 'left';
          ctx.fillText('Lịch gác (Chị Hoa): lính đi chậm, -20% tầm nhìn lính gác, tuần tra hiện nét đứt', 310, 118);
        }
        ctx.restore();
      }
    }

    // ========================================================================
    // 2. DRAW ESCAPE MAZE SCENE (90 SECONDS INTENSE RUSH)
    // ========================================================================
    if (sceneMode === 'ESCAPE_MAZE') {
      // Tactical border patrol terrain (mud trench & gravel)
      ctx.fillStyle = '#0c1310';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Muddy patrol track texture
      ctx.fillStyle = '#141d18';
      ctx.fillRect(30, 70, canvasWidth - 60, canvasHeight - 140);
      ctx.strokeStyle = '#1b2a23';
      ctx.lineWidth = 1;
      for (let my = 80; my < canvasHeight - 80; my += 30) {
        ctx.beginPath();
        ctx.moveTo(30, my);
        ctx.lineTo(canvasWidth - 30, my);
        ctx.stroke();
      }

      // Perimeter razor-wire security fence
      drawRealisticChainFence(ctx, 30, 70, canvasWidth - 30, 70, 36);
      drawRealisticChainFence(ctx, 30, 70, 30, canvasHeight - 70, 36);
      drawRealisticChainFence(ctx, 30, canvasHeight - 70, canvasWidth - 30, canvasHeight - 70, 36);
      drawRealisticChainFence(ctx, canvasWidth - 30, 70, canvasWidth - 30, 260, 36);
      drawRealisticChainFence(ctx, canvasWidth - 30, 460, canvasWidth - 30, canvasHeight - 70, 36);

      // Realistic Maze Security Fences & Concrete Jersey Barriers
      // Barrier Wall 1
      drawRealisticChainFence(ctx, 250, 70, 250, 480, 32);
      // Barrier Wall 2
      drawRealisticChainFence(ctx, 500, 240, 500, 650, 32);
      // Barrier Wall 3
      drawRealisticChainFence(ctx, 760, 70, 760, 460, 32);
      // Barrier Wall 4
      drawRealisticChainFence(ctx, 1000, 200, 1000, 650, 32);

      // Corner Watchtowers with emergency sweeping red spotlights
      drawWatchtowerStructure(ctx, 60, 65, time, Math.PI / 4, Math.PI / 2.5, true);
      drawWatchtowerStructure(ctx, canvasWidth - 60, 65, time, (3 * Math.PI) / 4, Math.PI / 2.5, true);

      // Extraction Gate (Exit Point to Freedom)
      ctx.save();
      const exitPulse = Math.sin(time * 6) * 4;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.fillRect(canvasWidth - 110, 260, 80, 200);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.strokeRect(canvasWidth - 110, 260, 80, 200);

      // Chemical green flare smoke & beacon
      const flareGlow = ctx.createRadialGradient(
        canvasWidth - 70,
        360,
        10,
        canvasWidth - 70,
        360,
        Math.max(10, 90 + exitPulse),
      );
      flareGlow.addColorStop(0, 'rgba(74, 222, 128, 0.6)');
      flareGlow.addColorStop(0.6, 'rgba(34, 197, 94, 0.2)');
      flareGlow.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = flareGlow;
      ctx.beginPath();
      ctx.arc(canvasWidth - 70, 360, Math.max(0, 90 + exitPulse), 0, Math.PI * 2);
      ctx.fill();

      // Severed chainlink wire strands
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      for (let wy = 270; wy < 450; wy += 20) {
        ctx.beginPath();
        ctx.moveTo(canvasWidth - 110, wy);
        ctx.lineTo(canvasWidth - 95, wy + 6);
        ctx.stroke();
      }

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 15px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ĐIỂM THOÁT', canvasWidth - 70, 345);
      ctx.font = 'bold 12px Courier New, monospace';
      ctx.fillText('>> BIÊN PHÒNG >>', canvasWidth - 70, 370);
      ctx.restore();

      // Guards patrolling the maze (drawn under the darkness; cones redrawn on top below)
      mazeGuardsRef.current.forEach((guard) => {

        if (guardSpriteRendererRef.current && assetsReady) {
          const animState = guardAnimRefs.current[guard.id] || {
            currentAction: 'WALK',
            currentFrame: 0,
            timer: 0,
          };
          guardSpriteRendererRef.current.draw(
            ctx,
            animState,
            guard.x - 28,
            guard.y - 36,
            56,
            72,
            assets,
            guard.angle > Math.PI / 2 || guard.angle < -Math.PI / 2,
          );
        }
      });

      // Player in Escape Maze
      if (playerSpriteRendererRef.current && assetsReady) {
        playerSpriteRendererRef.current.draw(
          ctx,
          playerAnimRef.current,
          p.x,
          p.y,
          p.width,
          p.height,
          assets,
          p.facingLeft,
        );
      }

      // Volumetric Darkness Mask with player flashlight (offscreen layer, see overworld)
      const mainCtx = ctx;
      const darkLayer = getDarkLayer();
      {
      const ctx = darkLayer.getContext('2d')!;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.save();
      const lightRadius = inventory.flashlight ? 290 : 122; // no Đèn Pin: ~42% radius
      const px = p.x + p.width / 2;
      const py = p.y + p.height / 2;

      ctx.fillStyle = 'rgba(2, 6, 8, 0.9)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.globalCompositeOperation = 'destination-out';
      const pGrad = ctx.createRadialGradient(px, py, 15, px, py, lightRadius);
      pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      pGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.85)');
      pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, lightRadius, 0, Math.PI * 2);
      ctx.fill();

      // Exit beacon visible through darkness
      const exitHole = ctx.createRadialGradient(canvasWidth - 70, 360, 5, canvasWidth - 70, 360, 160);
      exitHole.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      exitHole.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = exitHole;
      ctx.beginPath();
      ctx.arc(canvasWidth - 70, 360, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      }
      mainCtx.drawImage(darkLayer, 0, 0);

      // Bản Đồ Rách: faint outline of the fence layout over the darkness
      if (inventory.torn_map) {
        ctx.save();
        ctx.strokeStyle = 'rgba(167, 243, 208, 0.22)';
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        MAZE_WALLS.forEach((w) => ctx.strokeRect(w.x, w.y, w.w, w.h));
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Guard flashlight vision cones on top of the darkness
      ctx.save();
      mazeGuardsRef.current.forEach((guard) => {
        const alert = guard.state === 'ALERT';
        const cg = ctx.createRadialGradient(guard.x, guard.y, 5, guard.x, guard.y, guard.visionRange);
        cg.addColorStop(0, alert ? 'rgba(239, 68, 68, 0.55)' : 'rgba(250, 204, 21, 0.5)');
        cg.addColorStop(1, alert ? 'rgba(239, 68, 68, 0.06)' : 'rgba(250, 204, 21, 0.04)');
        ctx.beginPath();
        ctx.moveTo(guard.x, guard.y);
        ctx.arc(guard.x, guard.y, guard.visionRange, guard.angle - guard.visionAngle / 2, guard.angle + guard.visionAngle / 2);
        ctx.closePath();
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.strokeStyle = alert ? '#ef4444' : 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = alert ? '#ef4444' : '#facc15';
        ctx.beginPath();
        ctx.arc(guard.x, guard.y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (alert) {
          ctx.font = 'bold 20px Courier New, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('!', guard.x, guard.y - 44);
        }
      });
      if (hoaSchedule) {
        ctx.setLineDash([3, 6]);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        mazeGuardsRef.current.forEach((guard) => {
          ctx.beginPath();
          guard.patrolPoints.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
          if (guard.patrolPoints.length > 2) ctx.closePath();
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // CRT Glitch lines if shocked
    if (isGlitching) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      for (let i = 0; i < canvasHeight; i += 8) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(0, i, canvasWidth, 3);
      }
    }

    ctx.restore();
  };

  // --- Animation Frame Loop Ref Registration ---
  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      // Escape key pause logic
      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed && !lastCancelRef.current) {
          const currentStatus = gameStateRef.current.status;
          if (currentStatus === 'PLAYING') {
            setIsGameMenuOpen((prev) => !prev);
          } else if (currentStatus === 'START') {
            void exitChat({});
          }
        }
        lastCancelRef.current = cancelPressed;
      }

      stepperRef.current?.(time, (dt) => updateRef.current(dt));

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exitChat, inputRef]);

  // Dynamic Background Music URL based on active mode
  const currentMusicUrl =
    sceneMode === 'ESCAPE_MAZE'
      ? 'assets/audio/bgm_escape_rush.mp3'
      : isNight
      ? 'assets/audio/bgm_compound_night.mp3'
      : 'assets/audio/bgm_compound_day.mp3';

  // Per-track levels (the day track is mastered much louder than the night one):
  // day 0.6 -> 0.27 (~45%), night 0.6 -> 0.65, escape 0.6 -> 0.45 (tension kept).
  const musicTrackVolume =
    sceneMode === 'ESCAPE_MAZE' ? 0.45 : isNight ? 0.65 : 0.27;
  // Background music fades out at the desk / canteen / roommates / junk storage and
  // while a menu, guide or morning card is open; it fades back in the overworld.
  const musicDucked =
    sceneMode === 'TELESALES' ||
    sceneMode === 'CANTEEN' ||
    sceneMode === 'ROOMMATES' ||
    sceneMode === 'JUNK_STORAGE' ||
    isGameMenuOpen ||
    isHowToPlayOpen ||
    !!dailyEvent;
  // Pause the track entirely once the fade-out has finished
  const [musicParked, setMusicParked] = useState(false);
  useEffect(() => {
    if (!musicDucked) {
      setMusicParked(false);
      return;
    }
    const t = setTimeout(() => setMusicParked(true), 1400);
    return () => clearTimeout(t);
  }, [musicDucked]);
  const isMusicPlaying =
    gameState.status === 'PLAYING' &&
    !musicParked &&
    sceneMode !== 'ENDING' &&
    sceneMode !== 'AWARENESS';

  return (
    <div
      className={`fixed inset-0 overflow-hidden touch-none flex flex-col bg-slate-950 text-white font-mono select-none ${
        shockFx ? 'vnlc-shock-shake' : ''
      }`}>
      {/* Electric-shock FX overlay (red flash + glitch scanlines), above every scene */}
      {shockFx && (
        <div className="vnlc-shock-overlay pointer-events-none fixed inset-0 z-[80] flex items-center justify-center" data-testid="shock-fx">
          <div className="vnlc-zap-text text-5xl md:text-7xl font-black text-yellow-200 tracking-widest">ZZZT!</div>
        </div>
      )}
      {/* Preloading Screen */}
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-emerald-400">
          <div className="text-xl font-bold tracking-wider animate-pulse">
            Đang tải dữ liệu Khu Trại...
          </div>
        </div>
      )}

      {/* Global Background Audio */}
      <BackgroundMusic
        url={currentMusicUrl}
        isPlaying={isMusicPlaying}
        isMuted={isMusicMuted}
        volume={musicDucked ? 0 : musicTrackVolume}
        fadeSec={1}
      />

      {/* DEDICATED TOP HUD (Strictly non-overlapping, small text, responsive flex-wrap) */}
      <header className="w-full bg-[#111816] border-b border-[#243430] px-3 py-1.5 z-20 shrink-0 flex flex-wrap items-center justify-between gap-2 shadow-lg short:flex-nowrap short:px-1.5 short:py-0.5 short:gap-1.5 short:overflow-x-auto">
        {/* Left: Day & Phase & Objectives */}
        <div className="flex items-center gap-3 text-xs md:text-sm short:gap-1.5 short:text-[11px] short:shrink-0 whitespace-nowrap">
          <span className="font-bold text-emerald-400 tracking-wide">
            {isNight ? (
              <span className="flex items-center gap-1 text-indigo-400">
                <Moon size={14} /> <span className="short:hidden">Ban Đêm (Lén Lút)</span><span className="hidden short:inline">Đêm</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <Sun size={14} /> <span className="short:hidden">Ban Ngày (Ca Làm Việc)</span><span className="hidden short:inline">Ngày</span>
              </span>
            )}
          </span>
          <span className="text-slate-400">
            <span className="short:hidden">Ngày </span>{dayNumber}/{MAX_DAYS}
          </span>
          <span className={`text-slate-400 ${sceneMode === 'ESCAPE_MAZE' ? 'short:hidden' : ''}`}>|</span>
          <span className={`text-slate-300 ${sceneMode === 'ESCAPE_MAZE' ? 'short:hidden' : ''}`}>
            KPI<span className="short:hidden"> Còn</span>:{' '}
            <strong className="text-yellow-400">{callsLeftToday}</strong> cuộc
          </span>
        </div>

        {/* Center: Survival Meters */}
        <div className="flex items-center gap-4 text-xs short:gap-2 short:shrink-0 whitespace-nowrap">
          {/* Stamina */}
          <div className="flex items-center gap-1.5" title="Thể Lực">
            <Heart size={14} className="text-red-400" />
            <div className="w-16 short:w-7 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{width: `${stamina}%`}}
              />
            </div>
            <span className="text-[11px] text-red-200">{stamina}</span>
          </div>

          {/* Morale */}
          <div className="flex items-center gap-1.5" title="Tinh Thần">
            <Smile size={14} className="text-cyan-400" />
            <div className="w-16 short:w-7 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-cyan-400 h-full transition-all duration-300"
                style={{width: `${morale}%`}}
              />
            </div>
            <span className="text-[11px] text-cyan-200">{morale}</span>
          </div>

          {/* Money & meal tickets */}
          <div className="flex items-center gap-1 text-emerald-400 font-bold" title="Tiền">
            <DollarSign size={13} />
            <span>${money}</span>
          </div>
          <div className="flex items-center gap-1 text-orange-300" title="Phiếu cơm">
            <Utensils size={12} />
            <span>{mealTickets}</span>
          </div>

          {/* Lòng Tin & Lương Tâm */}
          <div className="flex items-center gap-1" title="Lòng Tin (quản lý)">
            <span className="text-[10px] text-amber-300">Tin</span>
            <div className="w-10 short:hidden bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div className="bg-amber-400 h-full transition-all duration-300" style={{width: `${managerTrust}%`}} />
            </div>
            <span className="text-[11px] text-amber-200">{managerTrust}</span>
          </div>
          <div className="flex items-center gap-1" title="Lương Tâm">
            <span className="text-[10px] text-violet-300">Tâm</span>
            <div className="w-10 short:hidden bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-300 ${conscience <= 15 ? 'bg-rose-500' : 'bg-violet-400'}`}
                style={{width: `${conscience}%`}}
              />
            </div>
            <span className="text-[11px] text-violet-200">{conscience}</span>
          </div>

          {/* Quỹ Chuộc Thân progress vs debt */}
          <div
            className="flex items-center gap-1 text-yellow-300"
            title={`Quỹ Chuộc Thân: $${ransomFund} / Nợ $${ransomTarget}`}>
            <Shield size={13} />
            <div className="w-16 short:w-7 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-yellow-400 h-full transition-all duration-300"
                style={{width: `${Math.min(100, (ransomFund / ransomTarget) * 100)}%`}}
              />
            </div>
            <span className="text-[11px]">
              ${ransomFund}/{ransomTarget}
            </span>
          </div>
          {rescueDay !== null && (
            <span className="text-[11px] text-emerald-300 animate-pulse" title="Đang chờ giải cứu">
              Cứu hộ: sáng ngày {rescueDay}
            </span>
          )}
        </div>

        {/* Right: Menu & Audio HUD buttons */}
        <div className="flex items-center gap-2 short:gap-1 short:shrink-0">
          {isTouch && <FullscreenButton className="h-8 w-9 short:h-9 short:w-10" />}
          {sceneMode === 'ESCAPE_MAZE' && (
            <div className="bg-red-950 border border-red-600 text-red-400 px-2 py-0.5 rounded font-bold text-xs animate-pulse whitespace-nowrap short:px-1 short:text-[11px]">
              <span className="short:hidden">ĐÀO THOÁT: </span>⏱ {formatTime(escapeTimer)}
            </div>
          )}

          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsHowToPlayOpen(true);
            }}
            aria-label="Hướng Dẫn"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-slate-300 flex items-center gap-1 short:h-9 short:min-w-[40px] short:justify-center">
            <HelpCircle size={13} /> <span className="short:hidden">Hướng Dẫn</span>
          </button>

          <button
            onClick={() => {
              gameAudio.playCrispClick();
              setIsGameMenuOpen(true);
            }}
            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 rounded text-xs font-bold text-white flex items-center gap-1 short:h-9 short:min-w-[44px] short:justify-center">
            <Menu size={14} /> Menu
          </button>
        </div>
      </header>

      {/* NOTIFICATION TOAST BAR */}
      {notification && (
        <div className="w-full bg-[#182622] border-b border-[#2d423b] px-4 py-1 text-xs text-emerald-200 flex items-center justify-between shrink-0 short:absolute short:top-10 short:left-0 short:right-0 short:z-[35] short:bg-[#182622]/90 short:text-[11px] short:pointer-events-auto">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
            <span className="truncate short:whitespace-normal short:line-clamp-2">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs short:min-w-[32px] short:h-6">
            ✕
          </button>
        </div>
      )}

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="vnlc-stage flex-1 w-full min-h-0 relative flex items-center justify-center bg-[#0a0f0d]">
        {/* Active Scene: Overworld or Escape Maze */}
        {(sceneMode === 'OVERWORLD' || sceneMode === 'ESCAPE_MAZE') && (
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
              width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
            }}
            className="vnlc-stage-canvas h-auto max-w-full max-h-full drop-shadow-2xl"
          />
        )}

        {/* Active Scene: Telesales CRT Desk Minigame */}
        {sceneMode === 'TELESALES' && (
          <TelesalesScene
            assets={assets}
            conscience={conscience}
            managerTrust={managerTrust}
            failStreak={failStreak}
            callsLeft={callsLeftToday}
            quota={todayQuota}
            paused={isGameMenuOpen || isHowToPlayOpen}
            warnCatchChance={warningCatchChance({
              managerTrust,
              warnedToday,
              warningsUncaught,
              tuanCovers: roommates.tuan.present && roommates.tuan.relationship >= 60,
            })}
            onChoice={handleCallChoice}
            onCallEnd={handleCallEnd}
            onExit={() => setSceneMode('OVERWORLD')}
          />
        )}

        {/* Active Scene: Roommates (night) */}
        {sceneMode === 'ROOMMATES' && (
          <RoommatesScene
            roommates={roommates}
            actionsLeft={nightActionsLeft}
            mealTickets={mealTickets}
            money={money}
            dayNumber={dayNumber}
            maxDays={MAX_DAYS}
            hoaSchedule={hoaSchedule}
            phoneFixed={phoneFixed}
            messageSent={messageSent}
            rescueDay={rescueDay}
            log={roommateLog}
            onTalk={handleTalk}
            onShare={handleShare}
            onFixPhone={handleFixPhone}
            onSendMessage={handleSendMessage}
            onExit={() => setSceneMode('OVERWORLD')}
            assets={assets}
          />
        )}

        {/* Active Scene: Canteen Food Purchase */}
        {/* Active Scene: Kho Phế Liệu hook-and-pull mini-game */}
        {sceneMode === 'JUNK_STORAGE' && (
          <JunkStorageScene
            assets={assets}
            inventory={inventory}
            attemptsLeft={junkAttemptsLeft}
            paused={isGameMenuOpen || isHowToPlayOpen || gameState.status !== 'PLAYING'}
            onAttemptUsed={() => setJunkAttemptsLeft((n) => Math.max(0, n - 1))}
            onQuestItem={(id: QuestItemId) => {
              setInventory((prev) => ({...prev, [id]: true}));
              setGameState((prev) => ({...prev, score: prev.score + 200}));
              const hints: Record<QuestItemId, string> = {
                flashlight: 'Tăng tầm nhìn trong đêm.',
                torn_map: 'Đã thấy vị trí rào chắn lỏng lẻo ở phía Đông.',
                wire_cutters: 'Có thể cắt hàng rào thép gai!',
              };
              showToast(`Khều được [${QUEST_ITEM_INFO[id].name}]! ${hints[id]}`);
            }}
            onJunk={(name: string) => showToast(`Khều lên được ${name}... chẳng dùng được gì.`)}
            onCaught={() => {
              gameAudio.playErrorBuzz();
              setMorale((prev) => Math.max(0, prev - 15));
              setScreenShake(10);
              setSceneMode('OVERWORLD');
              playerRef.current.x = 200;
              playerRef.current.y = 350;
              showToast('Hết giờ! Đèn pin lính gác quét qua cửa sổ kho, bạn hoảng hốt chạy về ký túc xá. -15 Tinh Thần.');
            }}
            onExit={() => setSceneMode('OVERWORLD')}
          />
        )}

        {sceneMode === 'CANTEEN' && (
          <div className="vnlc-scene vnlc-scroll absolute inset-0 z-30 bg-[#0d1412] flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-[#15221e] border-2 border-[#2c423b] rounded-xl p-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between border-b border-[#2c423b] pb-3 mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Utensils size={18} /> Căn Tin Khu Trại
                </div>
                <div className="text-xs text-yellow-400 font-bold">
                  Tiền mặt: ${money}
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                Dùng tiền hoa hồng kiếm được để mua thực phẩm hồi phục Thể Lực và Tinh Thần. Mỗi sáng bị trừ ${LIVING_FEE} phí ăn ở (thiếu 2 sáng liên tiếp là bị chích điện).
              </p>

              <div data-testid="deposit-panel" className="mb-4 bg-[#101c18] border border-emerald-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-emerald-300">Nộp Quỹ Chuộc Thân (quầy kế toán)</span>
                  <span className="text-slate-300">
                    Quỹ: <strong className="text-emerald-300">${ransomFund}</strong> / ${ransomTarget}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([100, 500, 'ALL'] as const).map((a) => (
                    <button
                      key={String(a)}
                      onClick={() => handleDeposit(a)}
                      disabled={money <= 0}
                      className="py-2 bg-emerald-900 hover:bg-emerald-800 border border-emerald-600 rounded font-bold text-xs text-emerald-100 disabled:opacity-40">
                      {a === 'ALL' ? `Nộp hết ($${money})` : `Nộp $${a}`}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 mt-2">Tiền đã nộp không bị lính gác "thu phí giữ hộ" khi khám phòng. Đủ ${ransomTarget} là được chuộc thân.</div>
              </div>

              <button
                onClick={handleUseMealTicket}
                disabled={mealTickets <= 0}
                className="w-full mb-3 flex items-center justify-between bg-[#1d1a10] border border-amber-700 p-3 rounded-lg hover:border-amber-500 disabled:opacity-40">
                <span className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Utensils size={16} /> Đổi Phiếu Cơm → Cơm Trắng (miễn phí)
                </span>
                <span className="text-xs text-amber-200">Còn {mealTickets} phiếu</span>
              </button>

              <div className="space-y-3 mb-6">
                {FOOD_MENU.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-[#0e1714] border border-[#23352f] p-3 rounded-lg hover:border-emerald-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 rounded border border-slate-700 flex items-center justify-center overflow-hidden">
                        {assets[item.iconKey] ? (
                          <img
                            src={assets[item.iconKey]?.src}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Utensils size={20} className="text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-yellow-300">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          +{item.staminaRestore} Thể Lực | +{item.moraleRestore} Tinh Thần
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBuyFood(item)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 rounded font-bold text-xs text-white">
                      Mua (${item.price})
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setSceneMode('OVERWORLD');
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded font-bold text-xs text-slate-200">
                Quay Lại Khu Trại
              </button>
            </div>
          </div>
        )}

        {/* Active Scene: Narrative Endings Screen */}
        {sceneMode === 'ENDING' && endingType && (
          <div className="vnlc-scene vnlc-scroll absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-xl bg-[#141f1c] border-2 border-emerald-600 rounded-xl p-6 shadow-2xl text-center">
              {endingType === 'ESCAPE' && (
                <>
                  <Award size={48} className="text-yellow-400 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-emerald-400 mb-2">
                    KẾT CỤC 1: TRỐN THOÁT THÀNH CÔNG!
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Bằng sự mưu trí và can đảm, bạn đã cắt đứt dây thép gai trong đêm tối, luồn lách qua tầm mắt bảo vệ và chạy thoát về phía đồn biên phòng Việt Nam. Bạn đã giành lại được tự do!
                  </p>
                </>
              )}

              {endingType === 'RANSOM' && (
                <>
                  <Shield size={48} className="text-emerald-400 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-yellow-400 mb-2">
                    KẾT CỤC 2: CHUỘC THÂN
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Sau nhiều tháng ròng rã, bạn đã tích lũy đủ $15,000 để chuộc thân. Bạn được thả về nước, nhưng những ký ức kinh hoàng và nỗi cắn rứt lương tâm sẽ mãi là vết sẹo khó phai.
                  </p>
                </>
              )}

              {endingType === 'OVERSEER' && (
                <>
                  <AlertTriangle size={48} className="text-amber-500 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-rose-500 mb-2">
                    KẾT CỤC 3: KẺ TRỞ THÀNH QUỶ
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Bạn bất chấp lương tâm lừa đảo đồng bào, đạt chỉ tiêu vượt bậc và chiếm trọn lòng tin của quản lý Hùng. Bạn được thăng chức làm đội trưởng giám sát, trở thành tay sai đắc lực của đường dây buôn người...
                  </p>
                </>
              )}

              {endingType === 'COLLAPSE' && (
                <>
                  <Zap size={48} className="text-red-500 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-red-500 mb-2">
                    KẾT CỤC 4: GỤC NGÃ
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Thể lực hoặc tinh thần của bạn đã cạn kiệt vì kiệt sức và những hình phạt tàn bạo. Bạn gục ngã tại phòng biệt giam...
                  </p>
                </>
              )}

              {endingType === 'RESCUE' && (
                <>
                  <Phone size={48} className="text-sky-400 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-sky-300 mb-2">KẾT CỤC 5: GIẢI CỨU</h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Tin nhắn ngắn ngủi qua chiếc điện thoại Bảo sửa đã đến được với gia đình. Họ báo công an và Đại sứ quán. Rạng sáng ngày {rescueDay}, lực lượng chức năng ập vào khu trại. Bạn và nhiều người khác được đưa về nước.
                  </p>
                </>
              )}

              {endingType === 'WHISTLEBLOWER' && (
                <>
                  <AlertTriangle size={48} className="text-cyan-400 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-cyan-300 mb-2">KẾT CỤC 6: NGƯỜI BÁO ĐỘNG</h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Bạn đã lén cảnh báo {WHISTLEBLOWER_TARGET} nạn nhân mà không bị phát hiện. Một trong số họ, Cô Tư, đã ghi âm cuộc gọi và trình báo công an. Đường dây bị triệt phá, khu trại bị giải tán. Bạn được giải cứu với lương tâm trong sạch.
                  </p>
                </>
              )}

              {endingType === 'SOLD' && (
                <>
                  <AlertTriangle size={48} className="text-rose-500 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-rose-500 mb-2">KẾT CỤC 7: BỊ BÁN SANG TRẠI KHÁC</h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {MAX_DAYS} ngày trôi qua mà bạn vẫn chưa thoát được. Quản lý Hùng "bán" bạn sang một khu trại khác sâu hơn trong rừng, nơi không ai biết bạn ở đâu...
                  </p>
                </>
              )}

              {/* Info screen shown after EVERY ending */}
              <div className="text-left bg-[#0b1411] border border-amber-700/70 rounded-lg p-3 mb-5" data-testid="ending-info">
                <div className="font-bold text-amber-300 text-sm mb-1">DẤU HIỆU LỪA ĐẢO TUYỂN DỤNG</div>
                <ul className="list-disc list-inside space-y-1 text-[12px] text-slate-200">
                  {JOB_SCAM_SIGNS.map((sign) => (
                    <li key={sign}>{sign}</li>
                  ))}
                </ul>
                <div className="mt-2 text-[12px] text-emerald-300">
                  Nếu bạn hoặc người thân gặp tình huống này: báo ngay cho <strong>Công an (113)</strong> hoặc liên hệ{' '}
                  <strong>Đại sứ quán / Cơ quan đại diện Việt Nam</strong> ở nước sở tại (Bảo hộ công dân: +84 981 84 84 84).
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setSceneMode('AWARENESS');
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-sm text-white">
                  Xem Bảng Cảnh Tỉnh Cộng Đồng
                </button>
                <button
                  onClick={() => initGame()}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-bold text-sm text-slate-200">
                  Chơi Lại Từ Đầu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Scene: Real-World Public Awareness Board */}
        {sceneMode === 'AWARENESS' && (
          <div className="vnlc-scene vnlc-scroll absolute inset-0 z-40 bg-[#0c1210] flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-[#14201c] border-2 border-[#2b4038] rounded-xl p-6 shadow-2xl relative">
              <h2 className="text-xl md:text-2xl font-black text-yellow-400 text-center mb-1">
                BẢNG THÔNG TIN CẢNH TỈNH CỘNG ĐỒNG
              </h2>
              <p className="text-xs text-emerald-400 text-center mb-4">
                Thông điệp phòng chống tội phạm mua bán người & lừa đảo việc làm trực tuyến
              </p>

              {/* Awareness Image background display */}
              <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden border border-[#2b4038] mb-4 relative bg-black">
                {assets['bg_awareness_board'] && (
                  <img
                    src={assets['bg_awareness_board'].src}
                    alt="Bảng cảnh báo"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Crucial Hotlines & Warning signs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-xs text-slate-200">
                <div className="bg-[#0b1411] border border-[#223931] p-3 rounded">
                  <div className="font-bold text-yellow-300 mb-1">
                    DẤU HIỆU CẠM BẪY LỪA ĐẢO:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>"Việc nhẹ lương cao" $1,000 - $3,000 không cần bằng cấp</li>
                    <li>Yêu cầu vượt biên trái phép, hứa hẹn "bao trọn gói xuất cảnh"</li>
                    <li>Bị thu giữ giấy tờ tùy thân, điện thoại ngay khi tới nơi</li>
                  </ul>
                </div>

                <div className="bg-[#0b1411] border border-[#223931] p-3 rounded">
                  <div className="font-bold text-emerald-400 mb-1">
                    ĐƯỜNG DÂY NÓNG KHẨN CẤP:
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    <li>
                      Tổng đài Quốc gia Bảo vệ Trẻ em & Phòng chống mua bán người:{' '}
                      <strong className="text-yellow-400">111</strong>
                    </li>
                    <li>
                      Cục Cảnh sát Hình sự (C02 - Bộ Công an):{' '}
                      <strong className="text-yellow-400">069.2348560</strong>
                    </li>
                    <li>
                      Bảo hộ Công dân Bộ Ngoại giao:{' '}
                      <strong className="text-yellow-400">+84 981 84 84 84</strong>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => initGame()}
                  className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-full font-bold text-sm text-white">
                  Bắt Đầu Lại Hành Trình Thoát Hiểm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Touch controls (phones): joystick bottom-left, action bottom-right, over the stage */}
        {isTouch &&
          gameState.status === 'PLAYING' &&
          !dailyEvent &&
          !isGameMenuOpen &&
          !isHowToPlayOpen &&
          (sceneMode === 'OVERWORLD' || sceneMode === 'ESCAPE_MAZE') && (
            <TouchControls
              inputRef={mobileInputRef}
              showAction={sceneMode === 'OVERWORLD'}
              onAction={() => {
                // mark the edge as consumed so the update loop doesn't fire it a 2nd time
                lastConfirmRef.current = true;
                handleInteraction();
              }}
            />
          )}
      </main>

      {/* Phone held upright: ask to rotate */}
      {isTouch && isPortrait && <RotateOverlay />}

      {/* GAME MENU OVERLAY (Mandatory Architecture) */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-md flex flex-col items-center bg-[#15221e] border-2 border-[#2c443c] rounded-xl p-6 shadow-2xl text-white">
            <h2 className="text-2xl font-black text-yellow-400 mb-6 uppercase tracking-wider">
              Menu Trò Chơi
            </h2>

            <div className="w-full space-y-3 mb-6">
              {/* Resume */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(false);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2">
                <Play size={16} /> Tiếp Tục Chơi
              </button>

              {/* SFX Toggle */}
              <button
                onClick={() => {
                  const newMuted = gameAudio.toggleMute();
                  setIsSfxMuted(newMuted);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                {isSfxMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                Âm Thanh (SFX): {isSfxMuted ? 'Tắt' : 'Bật'}
              </button>

              {/* Voice (Telesales TTS) Toggle */}
              <button
                data-testid="menu-voice-toggle"
                onClick={() => {
                  const on = !isVoiceOn;
                  gameAudio.setVoiceEnabled(on);
                  setIsVoiceOn(on);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                {isVoiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                Giọng Đọc (Telesales): {isVoiceOn ? 'Bật' : 'Tắt'}
              </button>

              {/* Music Toggle */}
              <button
                onClick={() => {
                  setIsMusicMuted(!isMusicMuted);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                {isMusicMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                Nhạc Nền (Music): {isMusicMuted ? 'Tắt' : 'Bật'}
              </button>

              {/* Restart */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  initGame();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                <RotateCcw size={15} /> Chơi Lại Từ Đầu
              </button>

              {/* How to Play */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                <HelpCircle size={15} /> Hướng Dẫn Cách Chơi
              </button>
            </div>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsGameMenuOpen(false);
                setGameState((prev) => ({...prev, status: 'START'}));
              }}
              className="text-xs text-rose-400 hover:underline">
              Về Màn Hình Chính
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY GUIDE MODAL */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-lg bg-[#14201c] border-2 border-emerald-500 rounded-xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-[#253932] pb-3 mb-4">
              <h3 className="font-bold text-lg text-yellow-400 flex items-center gap-2">
                <BookOpen size={18} /> Cẩm Nang Sinh Tồn & Thoát Hiểm
              </h3>
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(false);
                }}
                className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-6 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <strong className="text-emerald-400">1. Mục Tiêu Trò Chơi:</strong>
                <p>
                  Sống sót tối đa {MAX_DAYS} ngày trong trại lừa đảo. Có nhiều lối thoát: vượt rào (Trốn Thoát), góp đủ Quỹ Chuộc Thân bằng khoản nợ (Chuộc Thân), nhờ Bảo sửa điện thoại để nhắn tin cầu cứu rồi sống sót {RESCUE_DELAY_DAYS} ngày (Giải Cứu), hoặc lén cảnh báo {WHISTLEBLOWER_TARGET} nạn nhân mà không bị phát hiện (Người Báo Động). Cẩn thận: Lương Tâm quá thấp mà Lòng Tin quá cao thì bạn sẽ thành "Kẻ Trở Thành Quỷ".
                </p>
              </div>

              <div>
                <strong className="text-emerald-400">2. Ca Làm Việc Telesales (Ban Ngày):</strong>
                <p>
                  Mỗi ngày phải gọi đủ {DAILY_QUOTA} cuộc (phím 1-3 chọn câu trả lời). Mỗi cuộc 4-5 lượt; Nghi Ngờ chạm 95% là nạn nhân cúp máy. Mỗi cuộc tốn 10 Thể Lực. Đạt: +$220 hoa hồng vào Tiền, +1 Phiếu Cơm, +Lòng Tin; trượt: -10 Tinh Thần. Trượt 3 cuộc liên tiếp sẽ bị chích điện (-30 Thể Lực, -25 Tinh Thần). Thỉnh thoảng hiện lựa chọn ẩn "Cảnh báo nạn nhân" (phím 4): +Lương Tâm nhưng có thể bị quản lý phát hiện (bị chích điện -20 Thể Lực/-15 Tinh Thần). Rủi ro hiện ngay trên nút: Lòng Tin của sếp càng thấp càng dễ bị để ý, cảnh báo nhiều lần trong cùng một ngày thì rủi ro tăng vọt, mỗi lần trót lọt sếp lại để ý thêm một chút; Tuấn thân thiết (từ 60 điểm) sẽ che chắn giúp bạn. Chưa xong KPI thì không được về ngủ. Cuộc gọi có giọng đọc thật (nạn nhân qua loa điện thoại, bạn đọc câu mình chọn); bật/tắt "Giọng đọc" ngay tại bàn gọi hoặc trong Menu, tắt Âm Thanh (SFX) cũng tắt giọng.
                </p>
              </div>

              <div>
                <strong className="text-emerald-400">3. Căn Tin & Năng Lượng:</strong>
                <p>
                  Căn tin: Cơm Trắng $30 (+10 Thể Lực), Mì Gói $60 (+20/+5), Cơm Thịt $150 (+35/+10); Phiếu Cơm chỉ đổi được Cơm Trắng. Mỗi sáng bị trừ $100 phí ăn ở (thiếu thì phần thiếu cộng vào nợ; thiếu 2 sáng liên tiếp trở lên thì bị chích điện đầu ca -30 Thể Lực/-25 Tinh Thần mỗi sáng, nộp đủ một sáng là hết bị phạt); ngủ dậy chỉ hồi +20 Thể Lực. Tiền không tự vào Quỹ Chuộc Thân: hãy nộp ở quầy trong căn tin ($100/$500/Nộp hết), quỹ đủ 15.000 + nợ phát sinh là được chuộc thân. Tiền mặt trong túi có thể bị lính gác lấy một nửa khi khám phòng. Nếu Thể Lực hoặc Tinh Thần chạm mốc 0, bạn sẽ gục ngã! Ban đêm, ghé "Bạn Cùng Phòng" trong ký túc xá để trò chuyện / chia đồ ăn (3 lượt mỗi đêm): Chị Hoa thân thiết (từ 60 điểm) sẽ tiết lộ lịch gác (lính đi chậm hơn, -20% tầm nhìn lính gác cả ban đêm lẫn màn vượt rào, hiện lộ trình tuần tra, gửi tin nhắn ít rủi ro hơn), Bảo sửa được điện thoại cũ, còn Tuấn đói quá có thể phản bội bạn. Mỗi sáng có thể xảy ra sự kiện ngẫu nhiên (khám phòng, mất điện, người mới, bạn cùng phòng bị "bán"). Game tự lưu, có thể Tiếp Tục ở màn hình chính.
                </p>
              </div>

              <div>
                <strong className="text-emerald-400">4. Lén Lút & Vượt Ngục (Ban Đêm):</strong>
                <p>
                  Ban đêm lính gác tuần tra với nón ánh sáng đèn pin. Hãy lén lút tìm Đèn Pin trong tủ đồ ký túc xá, rồi ra Kho Phế Liệu ngoài sân dùng cần tre khều [Bản Đồ Rách] và [Kìm Cắt Dây Thép] qua cửa sổ (60 giây, chỉ 1 lượt thả móc mỗi đêm; đồ quý bị rác đè lên, móc lệch tâm dễ tuột nên thường phải mất vài đêm). Không có Đèn Pin thì vùng sáng quanh bạn trong bóng tối (ban đêm và lúc vượt rào) chỉ còn rất nhỏ. Bị nón đèn lính gác bắt được sẽ bị chích điện và mất 1 món đồ (ký túc xá là vùng an toàn). Khi đã có kìm và bản đồ, ban đêm tiếp cận hàng rào phía Đông để vượt rào: 90 giây, né nón đèn lính gác. Thất bại: bị phạt, nợ +$2.000, mất kìm và canh gác tăng cường.
                </p>
              </div>

              <div>
                <strong className="text-emerald-400">5. Điều Khiển:</strong>
                <p>
                  - Di chuyển: Phím Mũi Tên / WASD hoặc D-Pad trên di động.
                  <br />
                  - Tương tác: Phím Space / Phím E / Nút A trên di động.
                  <br />
                  - Menu: Phím Esc hoặc nút Menu góc trên bên phải.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(false);
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-bold text-xs text-white">
              Đã Hiểu, Quay Lại Trò Chơi
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* RANDOM DAILY EVENT MODAL */}
      {dailyEvent && gameState.status === 'PLAYING' && sceneMode === 'OVERWORLD' && (
        <MenuOverlay tone="neutral" zIndex={45}>
          <div
            data-testid="daily-event"
            className={`w-full max-w-md bg-[#14201c] border-2 rounded-xl p-5 shadow-2xl text-white ${
              dailyEvent.tone === 'bad' ? 'border-red-700' : dailyEvent.tone === 'good' ? 'border-emerald-500' : 'border-slate-600'
            }`}>
            {assets[DAILY_EVENT_ART[dailyEvent.id]] && (
              <img
                src={assets[DAILY_EVENT_ART[dailyEvent.id]]!.src}
                alt=""
                data-testid="daily-event-art"
                className="w-full aspect-video object-cover rounded-md border border-black/60 mb-3 short:h-20 short:aspect-auto short:mb-2"
              />
            )}
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Sáng ngày {dayNumber}/{MAX_DAYS} · Sự kiện
            </div>
            <h3
              className={`text-lg font-black mb-2 ${
                dailyEvent.tone === 'bad' ? 'text-red-400' : dailyEvent.tone === 'good' ? 'text-emerald-300' : 'text-yellow-300'
              }`}>
              {dailyEvent.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line mb-3">{dailyEvent.text}</p>
            {dailyEvent.fee && (
              <div data-testid="living-fee" className="text-[11px] mb-4 px-2 py-1.5 rounded bg-black/30 border border-slate-700 text-amber-200">
                {dailyEvent.fee} Tiền còn lại: ${money} · Quỹ: ${ransomFund}/{ransomTarget}
              </div>
            )}
            {dailyEvent.feeAlert && (
              <div data-testid="rent-alert" className="text-[11px] font-bold mb-4 -mt-2 px-2 py-1.5 rounded bg-red-950/70 border border-red-600 text-red-200">
                {dailyEvent.feeAlert}
              </div>
            )}
            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setDailyEvent(null);
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-bold text-xs text-white">
              Vào ca làm việc
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* START TITLE SCREEN */}
      {gameState.status === 'START' && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="w-full max-w-lg bg-[#14201c] border-2 border-emerald-600 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
              TRÒ CHƠI SINH TỒN & CẢNH TỈNH XÃ HỘI
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-yellow-400 mb-2 tracking-tight">
              Việc Nhẹ Lương Cao
            </h1>
            <p className="text-sm text-emerald-200/90 font-medium mb-4">
              "Trốn Thoát Cạm Bẫy Trại Lừa Đảo Biên Giới"
            </p>

            <div className="w-full bg-[#0a110f] border border-[#233830] rounded-xl p-4 text-xs text-slate-300 text-left space-y-2 mb-6 leading-relaxed">
              <p>
                Bạn bị dụ sang khu phức hợp với lời hứa hẹn lương ngàn đô. Đến nơi mới biết bị giam lỏng, ép gọi telesales lừa đảo đồng bào quê hương.
              </p>
              <p>
                Mục tiêu của bạn: Giữ vững lương tâm, tích lũy tiền chuộc thân hoặc lén lút tìm kìm cắt dây thép gai để đào thoát trong đêm!
              </p>
            </div>

            <div className="w-full space-y-3">
              {hasSave && (
                <button
                  onClick={() => {
                    const save = readSave();
                    if (isTouch) enterFullscreenLandscape();
                    if (save) initGame(save);
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm md:text-base rounded-full transition-all shadow-lg flex items-center justify-center gap-2">
                  <RotateCcw size={18} />
                  TIẾP TỤC (NGÀY {readSave()?.dayNumber ?? '?'})
                </button>
              )}
              <button
                onClick={() => {
                  if (isTouch) enterFullscreenLandscape();
                  initGame();
                }}
                autoFocus
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base md:text-lg rounded-full transition-all shadow-lg flex items-center justify-center gap-2">
                <Play size={20} />
                BẮT ĐẦU VÀO TRẠI
              </button>

              <button
                onClick={() => setIsHowToPlayOpen(true)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-full transition-colors flex items-center justify-center gap-2">
                <BookOpen size={16} />
                HƯỚNG DẪN SINH TỒN
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* GAME OVER & VICTORY OVERLAYS (Template Compatibility) */}
      {gameState.status === 'GAME_OVER' && sceneMode !== 'ENDING' && sceneMode !== 'AWARENESS' && (
        <Overlay
          title="BẠN ĐÃ GỤC NGÃ"
          description={`Điểm Số: ${gameState.score}`}
          actionLabel="THỬ LẠI"
          onAction={() => initGame()}
          icon={<RotateCw size={24} />}
          tone="danger"
        />
      )}

      {gameState.status === 'VICTORY' && sceneMode !== 'ENDING' && sceneMode !== 'AWARENESS' && (
        <Overlay
          title="TỰ DO!"
          description={`Điểm Số: ${gameState.score}`}
          actionLabel="CHƠI LẠI"
          onAction={() => initGame()}
          icon={<RotateCw size={24} />}
          tone="victory"
        />
      )}
    </div>
  );
}
