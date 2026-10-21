/**
 * @fileoverview Phone support: touch detection, fullscreen + landscape lock,
 * the "rotate your phone" overlay and the on-screen joystick / action button.
 * Everything here only renders on touch devices (pointer: coarse), so the
 * desktop experience is unchanged.
 */
import {Hand, Maximize, Minimize, RotateCw, Smartphone} from 'lucide-react';
import React, {MutableRefObject, useEffect, useRef, useState} from 'react';

export interface DirInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  interact: boolean;
}

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = (q: string) => window.matchMedia?.(q).matches ?? false;
  return mq('(pointer: coarse)') || (navigator.maxTouchPoints > 0 && mq('(hover: none)'));
}

/** True on phones/tablets (coarse pointer). Re-evaluated on resize. */
export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(detectTouch);
  useEffect(() => {
    const on = () => setTouch(detectTouch());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return touch;
}

/** True while the viewport is taller than wide. */
export function useIsPortrait(): boolean {
  const get = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
  const [portrait, setPortrait] = useState(get);
  useEffect(() => {
    const on = () => setPortrait(get());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    window.visualViewport?.addEventListener('resize', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
      window.visualViewport?.removeEventListener('resize', on);
    };
  }, []);
  return portrait;
}

export function useIsFullscreen(): boolean {
  const [fs, setFs] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  return fs;
}

/** Enter fullscreen and lock landscape where supported. Never throws. */
export function enterFullscreenLandscape(): void {
  try {
    const el = document.documentElement as HTMLElement & {webkitRequestFullscreen?: () => void};
    const lock = () => {
      try {
        const o = screen.orientation as ScreenOrientation & {lock?: (o: string) => Promise<void>};
        void o?.lock?.('landscape')?.catch(() => {});
      } catch {}
    };
    if (document.fullscreenElement) {
      lock();
      return;
    }
    if (el.requestFullscreen) {
      void el
        .requestFullscreen({navigationUI: 'hide'})
        .then(lock)
        .catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  } catch {}
}

export function exitFullscreen(): void {
  try {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  } catch {}
}

/** Small header button: toggle fullscreen (touch devices only). */
export function FullscreenButton({className = ''}: {className?: string}) {
  const fs = useIsFullscreen();
  return (
    <button
      data-testid="fullscreen-btn"
      aria-label="Toàn màn hình"
      onClick={() => (fs ? exitFullscreen() : enterFullscreenLandscape())}
      className={`flex items-center justify-center gap-1 rounded border border-slate-600 bg-slate-800 text-slate-200 active:bg-slate-600 ${className}`}>
      {fs ? <Minimize size={15} /> : <Maximize size={15} />}
    </button>
  );
}

/** Full-screen blocker shown on phones held upright. */
export function RotateOverlay() {
  return (
    <div
      data-testid="rotate-overlay"
      className="fixed inset-0 z-[200] bg-[#0b1110] flex flex-col items-center justify-center gap-5 p-6 text-center text-white select-none">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <Smartphone size={64} className="text-emerald-400 vnlc-rotate-hint" />
        <RotateCw size={28} className="absolute -right-2 -top-1 text-yellow-300" />
      </div>
      <div className="text-xl font-black text-yellow-300">Xoay ngang điện thoại để chơi</div>
      <div className="text-xs text-slate-400 max-w-xs">
        Trò chơi được thiết kế cho màn hình ngang. Bật xoay màn hình tự động rồi xoay ngang máy.
      </div>
      <button
        onClick={enterFullscreenLandscape}
        className="min-h-[44px] px-5 rounded-lg bg-emerald-700 active:bg-emerald-500 border-2 border-emerald-400 font-bold text-sm flex items-center gap-2">
        <Maximize size={16} /> Toàn màn hình + xoay ngang
      </button>
    </div>
  );
}

/**
 * Virtual joystick (bottom-left) + action button (bottom-right), overlaid on
 * the stage. Writes into the same mobile input ref the game loop reads, so it
 * behaves exactly like the arrow keys / Space. Multitouch-safe: each control
 * tracks its own pointerId.
 */
export function TouchControls({
  inputRef,
  onAction,
  actionLabel = 'Tương tác',
  showAction = true,
}: {
  inputRef: MutableRefObject<DirInput>;
  onAction: () => void;
  actionLabel?: string;
  showAction?: boolean;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const padPointer = useRef<number | null>(null);
  const actPointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({x: 0, y: 0});
  const [actDown, setActDown] = useState(false);
  const R = 46; // knob travel radius (px)

  const setDirs = (dx: number, dy: number) => {
    const len = Math.hypot(dx, dy);
    const m = inputRef.current;
    if (len < 12) {
      m.left = m.right = m.up = m.down = false;
    } else {
      const nx = dx / len;
      const ny = dy / len;
      m.left = nx < -0.38;
      m.right = nx > 0.38;
      m.up = ny < -0.38;
      m.down = ny > 0.38;
    }
    const k = len > R ? R / len : 1;
    setKnob({x: dx * k, y: dy * k});
  };

  const fromEvent = (e: React.PointerEvent) => {
    const r = padRef.current!.getBoundingClientRect();
    setDirs(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  };

  const release = () => {
    padPointer.current = null;
    setDirs(0, 0);
  };

  // Never leave the player walking when the controls unmount
  useEffect(
    () => () => {
      const m = inputRef.current;
      m.left = m.right = m.up = m.down = m.interact = false;
    },
    [inputRef],
  );

  return (
    <>
      <div
        ref={padRef}
        data-testid="touch-joystick"
        className="absolute z-20 left-2 bottom-2 w-[132px] h-[132px] rounded-full bg-white/10 border-2 border-white/25 touch-none select-none"
        style={{left: 'max(8px, env(safe-area-inset-left))'}}
        onPointerDown={(e) => {
          if (padPointer.current !== null) return;
          padPointer.current = e.pointerId;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          fromEvent(e);
        }}
        onPointerMove={(e) => {
          if (e.pointerId === padPointer.current) fromEvent(e);
        }}
        onPointerUp={(e) => {
          if (e.pointerId === padPointer.current) release();
        }}
        onPointerCancel={(e) => {
          if (e.pointerId === padPointer.current) release();
        }}
        onLostPointerCapture={(e) => {
          if (e.pointerId === padPointer.current) release();
        }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/30 text-[10px]">
          <span className="absolute top-1">▲</span>
          <span className="absolute bottom-1">▼</span>
          <span className="absolute left-1.5">◀</span>
          <span className="absolute right-1.5">▶</span>
        </div>
        <div
          className="absolute left-1/2 top-1/2 w-14 h-14 -ml-7 -mt-7 rounded-full bg-emerald-500/45 border-2 border-emerald-300/70 shadow-lg pointer-events-none"
          style={{transform: `translate(${knob.x}px, ${knob.y}px)`}}
        />
      </div>

      {showAction && (
      <button
        data-testid="touch-action"
        className={`absolute z-20 bottom-3 w-[84px] h-[84px] rounded-full border-2 font-bold text-[11px] text-white flex flex-col items-center justify-center touch-none select-none shadow-lg ${
          actDown ? 'bg-emerald-500/80 border-emerald-200' : 'bg-emerald-700/55 border-emerald-400/80'
        }`}
        style={{right: 'max(12px, env(safe-area-inset-right))'}}
        onPointerDown={(e) => {
          if (actPointer.current !== null) return;
          actPointer.current = e.pointerId;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setActDown(true);
          inputRef.current.interact = true;
          onAction();
        }}
        onPointerUp={(e) => {
          if (e.pointerId !== actPointer.current) return;
          actPointer.current = null;
          setActDown(false);
          inputRef.current.interact = false;
        }}
        onPointerCancel={() => {
          actPointer.current = null;
          setActDown(false);
          inputRef.current.interact = false;
        }}
        onContextMenu={(e) => e.preventDefault()}>
        <Hand size={22} />
        <span>{actionLabel}</span>
      </button>
      )}
    </>
  );
}
