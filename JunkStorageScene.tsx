// tslint:disable
/* eslint-disable */
/**
 * @fileoverview "Kho Phế Liệu" (Junk Storage) mini-game.
 *
 * Claw-machine / hook-and-pull scene seen from the side through a small window.
 * The player slides a long bamboo pole with a hook left/right, drops it, and
 * pulls up whatever the hook touches. Off-center catches may slip off.
 * Quest items obtained here feed the existing escape inventory
 * (flashlight / torn_map / wire_cutters).
 */
import {ArrowLeft, ArrowRight, ArrowDown, Clock, LogOut, Package} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {gameAudio} from './utils/helper';

export type QuestItemId = 'wire_cutters' | 'flashlight' | 'torn_map';

type JunkKind = 'can' | 'slipper' | 'radio' | 'bottle' | 'tire';

interface PileItem {
  uid: number;
  kind: JunkKind | 'quest';
  questId?: QuestItemId;
  name: string;
  x: number; // center x
  y: number; // center y
  w: number;
  h: number;
  rot: number;
}

export const QUEST_ITEM_INFO: Record<QuestItemId, {name: string; iconKey: string}> = {
  flashlight: {name: 'Đèn Pin', iconKey: 'item_flashlight'},
  torn_map: {name: 'Bản Đồ Rách', iconKey: 'item_torn_map'},
  wire_cutters: {name: 'Kìm Cắt Dây Thép', iconKey: 'item_wire_cutters'},
};

const JUNK_INFO: Record<JunkKind, {name: string; w: number; h: number}> = {
  can: {name: 'Lon Gỉ', w: 34, h: 44},
  slipper: {name: 'Dép Cũ', w: 62, h: 24},
  radio: {name: 'Đài Hỏng', w: 70, h: 46},
  bottle: {name: 'Chai Nhựa Bẹp', w: 26, h: 54},
  tire: {name: 'Lốp Xe Mòn', w: 74, h: 34},
};

/** Generated sprite for each junk kind (see design/asset_manifest.json). */
const JUNK_ART: Record<JunkKind, string> = {
  can: 'junk_can',
  slipper: 'junk_slipper',
  radio: 'junk_radio',
  bottle: 'junk_bottle',
  tire: 'junk_tire',
};
/** Transparent window opening inside kho_wall_frame.png (960x540 image space). */
const FRAME_HOLE = {x: 226, y: 123, w: 500, h: 288};
/** Rusty blank plate above the window in kho_wall_frame.png, used for the sign. */
const FRAME_PLATE = {x: 360, y: 12, w: 226, h: 60};
/** kho_pole_hook.png anchor points: pole centre x, lowest point of the hook curve, pole slice for tiling. */
const POLE_ART = {centerX: 24, hookBottomY: 881, sliceTop: 120, sliceBottom: 700, scale: 0.36};

// Logical canvas size
const W = 960;
const H = 540;
// Window opening (the player looks through it)
const WIN = {x: 110, y: 70, w: 740, h: 400};
const HOOK_TOP_Y = WIN.y + 34; // resting hook tip height
const POLE_MIN_X = WIN.x + 40;
const POLE_MAX_X = WIN.x + WIN.w - 40;
const MOVE_SPEED = 260; // px/s
const LOWER_SPEED = 230;
const RAISE_SPEED = 170;
const TIME_LIMIT = 60;
const SWEEP_DURATION = 1.8;

/** Height of the junk pile surface at a given x (y coordinate). */
function pileSurfaceY(x: number): number {
  const t = (x - WIN.x) / WIN.w;
  return (
    WIN.y + WIN.h - 95 -
    Math.sin(t * Math.PI) * 70 -
    Math.sin(t * Math.PI * 3 + 0.7) * 14
  );
}

let uidCounter = 1;

function buildPile(owned: Record<string, boolean>): PileItem[] {
  const items: PileItem[] = [];
  const quests = (Object.keys(QUEST_ITEM_INFO) as QuestItemId[]).filter(
    (id) => !owned[id],
  );
  // Spread slot positions across the pile and shuffle them
  const slots: number[] = [];
  for (let i = 0; i < 9; i++) slots.push(WIN.x + 85 + i * ((WIN.w - 170) / 8));
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  // Quest items lie a bit deeper in the pile
  quests.forEach((qid) => {
    const x = slots.pop()! + (Math.random() - 0.5) * 20;
    const w = qid === 'torn_map' ? 66 : 60;
    const h = qid === 'torn_map' ? 52 : 50;
    items.push({
      uid: uidCounter++,
      kind: 'quest',
      questId: qid,
      name: QUEST_ITEM_INFO[qid].name,
      x,
      y: pileSurfaceY(x) + 16,
      w,
      h,
      rot: (Math.random() - 0.5) * 0.5,
    });
  });

  // Junk scattered on top (some partially covering quest items)
  const kinds: JunkKind[] = ['can', 'slipper', 'radio', 'bottle', 'tire', 'can', 'slipper', 'radio', 'bottle'];
  const junkCount = 6 + Math.floor(Math.random() * 2);
  for (let i = 0; i < junkCount; i++) {
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const info = JUNK_INFO[kind];
    const base = slots.length ? slots.pop()! : WIN.x + 90 + Math.random() * (WIN.w - 180);
    const x = Math.max(WIN.x + 50, Math.min(WIN.x + WIN.w - 50, base + (Math.random() - 0.5) * 50));
    items.push({
      uid: uidCounter++,
      kind,
      name: info.name,
      x,
      y: pileSurfaceY(x) - info.h * 0.15,
      w: info.w,
      h: info.h,
      rot: (Math.random() - 0.5) * 0.7,
    });
  }
  // Every quest item is buried under a wide piece of junk, leaving only a thin
  // edge exposed: hooking that edge is off-centre (slippery), so with one drop
  // per night it realistically takes several nights to fish out all items.
  items
    .filter((it) => it.kind === 'quest')
    .forEach((q) => {
      const coverKinds: JunkKind[] = ['slipper', 'radio', 'tire'];
      const kind = coverKinds[Math.floor(Math.random() * coverKinds.length)];
      const info = JUNK_INFO[kind];
      items.push({
        uid: uidCounter++,
        kind,
        name: info.name,
        x: q.x + (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 12),
        y: q.y - q.h * 0.45,
        w: info.w,
        h: info.h,
        rot: (Math.random() - 0.5) * 0.4,
      });
    });
  return items;
}

type HookState = 'AIM' | 'LOWER' | 'RAISE' | 'SWEEP' | 'DONE';

interface SceneSim {
  poleX: number;
  tipY: number;
  state: HookState;
  hooked: PileItem | null;
  hookOffset: number; // item.x - poleX when hooked
  willSlip: boolean;
  slipAtY: number;
  falling: {item: PileItem; vy: number; targetY: number}[];
  timeLeft: number;
  sweepT: number;
  time: number;
  flashMsg: {text: string; color: string; t: number} | null;
  shake: number;
}

export interface JunkStorageSceneProps {
  assets: Record<string, HTMLImageElement | null>;
  inventory: Record<string, boolean>;
  attemptsLeft: number;
  paused: boolean;
  /** Called whenever a drop is spent. */
  onAttemptUsed: () => void;
  /** Quest item pulled out successfully. */
  onQuestItem: (id: QuestItemId) => void;
  /** Junk pulled out (no value). */
  onJunk: (name: string) => void;
  /** Patrol flashlight caught the player (time ran out). */
  onCaught: () => void;
  /** Player leaves voluntarily. */
  onExit: () => void;
}

export default function JunkStorageScene({
  assets,
  inventory,
  attemptsLeft,
  paused,
  onAttemptUsed,
  onQuestItem,
  onJunk,
  onCaught,
  onExit,
}: JunkStorageSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pileRef = useRef<PileItem[]>(buildPile(inventory));
  const simRef = useRef<SceneSim>({
    poleX: W / 2,
    tipY: HOOK_TOP_Y,
    state: 'AIM',
    hooked: null,
    hookOffset: 0,
    willSlip: false,
    slipAtY: 0,
    falling: [],
    timeLeft: TIME_LIMIT,
    sweepT: 0,
    time: 0,
    flashMsg: null,
    shake: 0,
  });
  const keysRef = useRef({left: false, right: false});
  const [hud, setHud] = useState({timeLeft: TIME_LIMIT, state: 'AIM' as HookState});
  const [log, setLog] = useState<string[]>([]);

  // Keep latest props/callbacks in refs for the rAF loop
  const propsRef = useRef({attemptsLeft, paused, onAttemptUsed, onQuestItem, onJunk, onCaught});
  propsRef.current = {attemptsLeft, paused, onAttemptUsed, onQuestItem, onJunk, onCaught};

  const pushLog = useCallback((msg: string) => {
    setLog((prev) => [msg, ...prev].slice(0, 4));
  }, []);

  const flash = (text: string, color: string) => {
    simRef.current.flashMsg = {text, color, t: 1.8};
  };

  const dropHook = useCallback(() => {
    const s = simRef.current;
    if (propsRef.current.paused || s.state !== 'AIM') return;
    if (propsRef.current.attemptsLeft <= 0) {
      gameAudio.playErrorBuzz();
      flash('Đêm nay đã thả móc rồi! Quay lại đêm mai.', '#f87171');
      return;
    }
    s.state = 'LOWER';
    propsRef.current.onAttemptUsed();
    gameAudio.playWhoosh();
  }, []);

  // Keyboard controls (own listeners; App's global input ignores this scene)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
        keysRef.current.left = true;
        e.preventDefault();
      } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
        keysRef.current.right = true;
        e.preventDefault();
      } else if (k === ' ' || k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Enter') {
        e.preventDefault();
        if (!e.repeat) dropHook();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keysRef.current.left = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') keysRef.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [dropHook]);

  // --- Simulation -----------------------------------------------------------
  const update = (dt: number) => {
    const s = simRef.current;
    const pile = pileRef.current;
    s.time += dt;
    if (s.flashMsg) {
      s.flashMsg.t -= dt;
      if (s.flashMsg.t <= 0) s.flashMsg = null;
    }
    s.shake = Math.max(0, s.shake - dt * 30);

    // Falling (slipped) items settle back onto the pile
    s.falling = s.falling.filter((f) => {
      f.vy += 900 * dt;
      f.item.y += f.vy * dt;
      f.item.rot += dt * 3;
      if (f.item.y >= f.targetY) {
        f.item.y = f.targetY;
        gameAudio.playClank();
        s.shake = 6;
        return false;
      }
      return true;
    });

    if (s.state === 'DONE') return;

    // Timer
    if (s.state !== 'SWEEP') {
      s.timeLeft = Math.max(0, s.timeLeft - dt);
      if (s.timeLeft <= 0) {
        // Patrol flashlight sweeps the window
        s.state = 'SWEEP';
        s.sweepT = 0;
        if (s.hooked) {
          // whatever is hanging drops back
          const it = s.hooked;
          s.hooked = null;
          s.falling.push({item: it, vy: 0, targetY: pileSurfaceY(it.x) + (it.kind === 'quest' ? 16 : 0)});
          pile.push(it);
        }
        gameAudio.playErrorBuzz();
      }
    }

    if (s.state === 'SWEEP') {
      s.sweepT += dt;
      if (s.sweepT >= SWEEP_DURATION) {
        s.state = 'DONE';
        propsRef.current.onCaught();
      }
      return;
    }

    if (s.state === 'AIM') {
      let dir = 0;
      if (keysRef.current.left) dir -= 1;
      if (keysRef.current.right) dir += 1;
      s.poleX = Math.max(POLE_MIN_X, Math.min(POLE_MAX_X, s.poleX + dir * MOVE_SPEED * dt));
      s.tipY = HOOK_TOP_Y;
    } else if (s.state === 'LOWER') {
      s.tipY += LOWER_SPEED * dt;
      // Hook touches the topmost item under it
      const candidates = pile.filter(
        (it) => Math.abs(it.x - s.poleX) < it.w / 2 + 6 && s.tipY >= it.y - it.h / 2,
      );
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.y - b.y);
        const it = candidates[0];
        s.hooked = it;
        s.hookOffset = it.x - s.poleX;
        pileRef.current = pile.filter((p) => p !== it);
        // Off-center hooks are slippery; heavier junk too
        const off = Math.min(1, Math.abs(s.hookOffset) / (it.w / 2 + 6));
        const weight = it.kind === 'radio' || it.kind === 'tire' ? 0.12 : 0;
        const slipChance = Math.min(0.85, 0.06 + off * off * 0.7 + weight);
        s.willSlip = Math.random() < slipChance;
        s.slipAtY = HOOK_TOP_Y + 40 + Math.random() * (s.tipY - HOOK_TOP_Y - 60);
        s.state = 'RAISE';
        gameAudio.playClank();
      } else if (s.tipY >= pileSurfaceY(s.poleX) + 8) {
        s.state = 'RAISE';
        flash('Hụt! Móc chỉ cào trúng rác vụn.', '#94a3b8');
        gameAudio.playFootstepStone();
      }
    } else if (s.state === 'RAISE') {
      s.tipY -= RAISE_SPEED * dt;
      if (s.hooked) {
        s.hooked.x = s.poleX + s.hookOffset;
        s.hooked.y = s.tipY + s.hooked.h / 2 - 4;
        s.hooked.rot += Math.sin(s.time * 8) * dt * 0.6;
        if (s.willSlip && s.tipY <= s.slipAtY) {
          const it = s.hooked;
          s.hooked = null;
          s.willSlip = false;
          pileRef.current.push(it);
          s.falling.push({
            item: it,
            vy: 0,
            targetY: pileSurfaceY(it.x) + (it.kind === 'quest' ? 16 : -it.h * 0.15),
          });
          gameAudio.playWhoosh();
          flash(`Tuột mất ${it.name}! Móc lệch tâm quá.`, '#fbbf24');
          pushLog(`✗ ${it.name} tuột khỏi móc`);
        }
      }
      if (s.tipY <= HOOK_TOP_Y) {
        s.tipY = HOOK_TOP_Y;
        if (s.hooked) {
          const it = s.hooked;
          s.hooked = null;
          if (it.kind === 'quest' && it.questId) {
            gameAudio.playCoinPickup();
            flash(`LẤY ĐƯỢC [${it.name}]!`, '#4ade80');
            pushLog(`★ ${it.name}`);
            propsRef.current.onQuestItem(it.questId);
          } else {
            gameAudio.playClank();
            flash(`Chỉ là ${it.name}... vứt sang một bên.`, '#94a3b8');
            pushLog(`· ${it.name} (vô dụng)`);
            propsRef.current.onJunk(it.name);
          }
        }
        s.state = 'AIM';
      }
    }
  };

  // --- Rendering ------------------------------------------------------------
  const drawItem = (ctx: CanvasRenderingContext2D, it: PileItem) => {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    const {w, h} = it;
    if (it.kind === 'quest' && it.questId) {
      const img = assets[QUEST_ITEM_INFO[it.questId].iconKey];
      if (img && img.complete && img.naturalWidth > 0) {
        // Desaturated, dusty look to match the pile
        ctx.filter = 'saturate(0.55) brightness(0.85)';
        const ar = img.naturalWidth / img.naturalHeight;
        const dw = Math.min(w, h * ar);
        const dh = dw / ar;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = '#a16207';
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
      // faint glint so sharp-eyed players can spot it
      const g = 0.25 + 0.25 * Math.sin(simRef.current.time * 3 + it.uid);
      ctx.fillStyle = `rgba(254, 240, 138, ${g})`;
      ctx.fillRect(w / 4, -h / 2, 3, 3);
      ctx.fillRect(w / 4 - 3, -h / 2 + 3, 9, 1);
    } else {
      const img = assets[JUNK_ART[it.kind]];
      if (img && img.complete && img.naturalWidth > 0) {
        const ar = img.naturalWidth / img.naturalHeight;
        let dw = w;
        let dh = w / ar;
        if (dh > h * 1.35) {
          dh = h * 1.35;
          dw = dh * ar;
        }
        ctx.filter = 'brightness(0.8)';
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = '#3b4034';
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
    }
    ctx.restore();
  };

  const scrapPatternRef = useRef<CanvasPattern | null>(null);

  /** Draws the bamboo pole sprite with its hook curve bottom at tip+11, tiling the shaft up to y=0. */
  const drawPole = (ctx: CanvasRenderingContext2D, poleX: number, tip: number) => {
    const img = assets['kho_pole_hook'];
    if (!img || !img.complete || img.naturalWidth === 0) {
      ctx.fillStyle = '#7c7346';
      ctx.fillRect(poleX - 5, 0, 10, tip);
      return;
    }
    const k = img.naturalHeight / 900; // asset may be re-exported at another size
    const sc = POLE_ART.scale / k;
    const dx = poleX - POLE_ART.centerX * k * sc;
    const dy = tip + 11 - POLE_ART.hookBottomY * k * sc;
    ctx.drawImage(img, dx, dy, img.naturalWidth * sc, img.naturalHeight * sc);
    // tile a shaft slice upwards until the top of the canvas
    const sliceH = (POLE_ART.sliceBottom - POLE_ART.sliceTop) * k;
    let top = dy + POLE_ART.sliceTop * k * sc;
    while (top > 0) {
      const h = sliceH * sc;
      ctx.drawImage(img, 0, POLE_ART.sliceTop * k, img.naturalWidth, sliceH, dx, top - h, img.naturalWidth * sc, h);
      top -= h;
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const s = simRef.current;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);

    // --- Interior behind the window (dark storage, generated backdrop) ---
    ctx.fillStyle = '#0d1210';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(WIN.x, WIN.y, WIN.w, WIN.h);
    ctx.clip();
    const interior = assets['kho_interior'];
    if (interior && interior.complete && interior.naturalWidth > 0) {
      const ih = (interior.naturalHeight / interior.naturalWidth) * WIN.w;
      ctx.drawImage(interior, WIN.x, WIN.y, WIN.w, ih);
      const fade = ctx.createLinearGradient(0, WIN.y + ih - 60, 0, WIN.y + ih);
      fade.addColorStop(0, 'rgba(13, 18, 16, 0)');
      fade.addColorStop(1, 'rgba(13, 18, 16, 1)');
      ctx.fillStyle = fade;
      ctx.fillRect(WIN.x, WIN.y + ih - 60, WIN.w, 60);
    }

    // Pile body: scrap texture clipped to the pile outline (same shape as the physics surface)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(WIN.x, WIN.y + WIN.h);
    for (let x = WIN.x; x <= WIN.x + WIN.w; x += 8) ctx.lineTo(x, pileSurfaceY(x) + 6);
    ctx.lineTo(WIN.x + WIN.w, WIN.y + WIN.h);
    ctx.closePath();
    const tile = assets['kho_scrap_tile'];
    if (tile && tile.complete && tile.naturalWidth > 0) {
      if (!scrapPatternRef.current) scrapPatternRef.current = ctx.createPattern(tile, 'repeat');
      ctx.fillStyle = scrapPatternRef.current || '#2a2f26';
    } else {
      ctx.fillStyle = '#2a2f26';
    }
    ctx.fill();
    // shade the pile deeper towards the bottom
    const pileShade = ctx.createLinearGradient(0, WIN.y + WIN.h - 200, 0, WIN.y + WIN.h);
    pileShade.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    pileShade.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = pileShade;
    ctx.fill();
    ctx.restore();
    // rim light along the pile surface
    ctx.strokeStyle = 'rgba(160, 175, 150, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = WIN.x; x <= WIN.x + WIN.w; x += 8) {
      if (x === WIN.x) ctx.moveTo(x, pileSurfaceY(x) + 6);
      else ctx.lineTo(x, pileSurfaceY(x) + 6);
    }
    ctx.stroke();

    // Items (quest items first so junk covers them)
    const pile = pileRef.current;
    pile.filter((it) => it.kind === 'quest').forEach((it) => drawItem(ctx, it));
    pile.filter((it) => it.kind !== 'quest').forEach((it) => drawItem(ctx, it));

    // Pole + hook (generated sprite)
    const poleX = s.poleX;
    const tip = s.tipY;
    drawPole(ctx, poleX, tip);

    // Hooked item drawn on top
    if (s.hooked) drawItem(ctx, s.hooked);
    s.falling.forEach((f) => drawItem(ctx, f.item));

    // Aim guide while aiming
    if (s.state === 'AIM') {
      ctx.strokeStyle = 'rgba(167, 243, 208, 0.18)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(poleX, tip + 12);
      ctx.lineTo(poleX, pileSurfaceY(poleX));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Darkness: only a dim moonlight cone from the window
    const dark = ctx.createRadialGradient(poleX, tip + 120, 40, poleX, tip + 120, 420);
    dark.addColorStop(0, 'rgba(8, 14, 20, 0.05)');
    dark.addColorStop(1, 'rgba(6, 10, 14, 0.62)');
    ctx.fillStyle = dark;
    ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    ctx.fillStyle = 'rgba(40, 70, 110, 0.12)';
    ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);

    // Patrol flashlight sweep
    if (s.state === 'SWEEP' || s.state === 'DONE') {
      const t = Math.min(1, s.sweepT / SWEEP_DURATION);
      const lx = WIN.x - 120 + t * (WIN.w + 240);
      const beam = ctx.createRadialGradient(lx, WIN.y + WIN.h / 2, 10, lx, WIN.y + WIN.h / 2, 230);
      beam.addColorStop(0, 'rgba(254, 249, 195, 0.85)');
      beam.addColorStop(0.5, 'rgba(253, 224, 71, 0.35)');
      beam.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = beam;
      ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    }
    ctx.restore(); // end clip

    // --- Grimy concrete wall + broken window frame (generated, hole mapped onto WIN) ---
    const frame = assets['kho_wall_frame'];
    const fsx = WIN.w / FRAME_HOLE.w;
    const fsy = WIN.h / FRAME_HOLE.h;
    if (frame && frame.complete && frame.naturalWidth > 0) {
      ctx.drawImage(frame, WIN.x - FRAME_HOLE.x * fsx, WIN.y - FRAME_HOLE.y * fsy, 960 * fsx, 540 * fsy);
    } else {
      ctx.fillStyle = '#3a4136';
      ctx.fillRect(0, 0, W, WIN.y);
      ctx.fillRect(0, WIN.y + WIN.h, W, H - WIN.y - WIN.h);
      ctx.fillRect(0, WIN.y, WIN.x, WIN.h);
      ctx.fillRect(WIN.x + WIN.w, WIN.y, W - WIN.x - WIN.w, WIN.h);
    }
    // the pole enters from above the window, in front of the wall
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, WIN.y + 2);
    ctx.clip();
    drawPole(ctx, poleX, tip);
    ctx.restore();
    // sign on the rusty plate (the pole passes behind it)
    if (frame && frame.complete && frame.naturalWidth > 0) {
      const kx = frame.naturalWidth / 960;
      const ky = frame.naturalHeight / 540;
      ctx.drawImage(frame, FRAME_PLATE.x * kx, FRAME_PLATE.y * ky, FRAME_PLATE.w * kx, FRAME_PLATE.h * ky, W / 2 - 170, 14, 340, 48);
    } else {
      ctx.fillStyle = '#2a2f27';
      ctx.fillRect(W / 2 - 160, 24, 320, 34);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = 'bold 18px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('KHO PHẾ LIỆU - CẤM VÀO', W / 2 + 1, 45);
    ctx.fillStyle = '#d6c99a';
    ctx.fillText('KHO PHẾ LIỆU - CẤM VÀO', W / 2, 44);

    // Flash message
    if (s.flashMsg) {
      ctx.globalAlpha = Math.min(1, s.flashMsg.t * 2);
      ctx.fillStyle = 'rgba(10, 15, 13, 0.85)';
      ctx.fillRect(W / 2 - 250, WIN.y + WIN.h + 18, 500, 34);
      ctx.fillStyle = s.flashMsg.color;
      ctx.font = 'bold 16px Courier New, monospace';
      ctx.fillText(s.flashMsg.text, W / 2, WIN.y + WIN.h + 41);
      ctx.globalAlpha = 1;
    }

    if (s.state === 'SWEEP' || s.state === 'DONE') {
      ctx.fillStyle = 'rgba(127, 29, 29, 0.25)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fecaca';
      ctx.font = 'bold 22px Courier New, monospace';
      ctx.fillText('ĐÈN PIN LÍNH GÁC QUÉT TỚI! AI ĐÓ?!', W / 2, H / 2);
    }
    ctx.restore();
  };

  // rAF loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudTimer = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!propsRef.current.paused) {
        update(dt);
        hudTimer += dt;
        if (hudTimer > 0.2) {
          hudTimer = 0;
          setHud({timeLeft: simRef.current.timeLeft, state: simRef.current.state});
        }
      }
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) draw(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hold = (dir: 'left' | 'right', v: boolean) => {
    keysRef.current[dir] = v;
  };

  const timeLeft = Math.ceil(hud.timeLeft);
  const busy = hud.state === 'SWEEP' || hud.state === 'DONE';

  return (
    <div className="absolute inset-0 z-30 bg-[#0d1412] flex flex-col items-center justify-center p-2 gap-2 overflow-y-auto">
      {/* Scene header */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 bg-[#15221e] border-2 border-[#2c423b] rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <Package size={16} /> Kho Phế Liệu - Khều Đồ Qua Cửa Sổ
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span
            className={`flex items-center gap-1 font-bold ${
              timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-300'
            }`}>
            <Clock size={13} /> {timeLeft}s
          </span>
          <span className="text-slate-300">
            Lượt khều: <strong className="text-yellow-400">{attemptsLeft}</strong>/1
          </span>
          <span className="hidden sm:flex items-center gap-1 text-slate-400">
            Đồ thoát thân:
            {(Object.keys(QUEST_ITEM_INFO) as QuestItemId[]).map((id) => (
              <span
                key={id}
                className={`px-1.5 py-0.5 rounded border text-[10px] ${
                  inventory[id]
                    ? 'border-emerald-500 text-emerald-300 bg-emerald-950'
                    : 'border-slate-700 text-slate-500'
                }`}>
                {QUEST_ITEM_INFO[id].name}
              </span>
            ))}
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          aspectRatio: `${W} / ${H}`,
          width: `min(100%, 56rem, calc((100vh - 220px) * ${W} / ${H}))`,
          imageRendering: 'pixelated',
        }}
        className="h-auto max-w-full border-2 border-[#2c423b] rounded shadow-2xl"
      />

      {/* Controls (keyboard + on-screen buttons for mobile) */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onPointerDown={() => hold('left', true)}
            onPointerUp={() => hold('left', false)}
            onPointerLeave={() => hold('left', false)}
            disabled={busy}
            className="w-14 h-12 bg-slate-800 active:bg-emerald-600 rounded-lg flex items-center justify-center text-white border border-slate-700 touch-none disabled:opacity-40">
            <ArrowLeft size={20} />
          </button>
          <button
            onPointerDown={() => hold('right', true)}
            onPointerUp={() => hold('right', false)}
            onPointerLeave={() => hold('right', false)}
            disabled={busy}
            className="w-14 h-12 bg-slate-800 active:bg-emerald-600 rounded-lg flex items-center justify-center text-white border border-slate-700 touch-none disabled:opacity-40">
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="hidden md:block flex-1 text-[11px] text-slate-400 text-center">
          ← → / A D: di chuyển cần tre · SPACE / ↓: thả móc · Móc lệch tâm dễ tuột đồ!
          {log.length > 0 && <div className="text-emerald-300 mt-0.5 truncate">{log.join('   ')}</div>}
        </div>

        <div className="flex gap-2">
          <button
            onPointerDown={() => dropHook()}
            disabled={busy || hud.state !== 'AIM' || attemptsLeft <= 0}
            className="px-4 h-12 bg-emerald-700 active:bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold text-xs text-white flex items-center gap-1 border-2 border-emerald-400 touch-none disabled:opacity-40">
            <ArrowDown size={16} /> THẢ MÓC
          </button>
          <button
            onClick={() => {
              gameAudio.playCrispClick();
              onExit();
            }}
            disabled={busy || hud.state === 'LOWER' || hud.state === 'RAISE'}
            className="px-3 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-bold text-xs text-slate-200 flex items-center gap-1 disabled:opacity-40">
            <LogOut size={14} /> Rời Kho
          </button>
        </div>
      </div>
      {attemptsLeft <= 0 && hud.state === 'AIM' && (
        <div className="text-xs text-red-300">
          Đã dùng lượt thả móc duy nhất của đêm nay. Hãy rời kho trước khi lính gác đi tuần tới, đêm mai quay lại!
        </div>
      )}
    </div>
  );
}
