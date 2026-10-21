/**
 * @fileoverview Small shared game-rule formulas (used by the game logic and by
 * the UI hints, so the number the player sees is the number that is rolled).
 */

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Chance that Quản lý Hùng catches you warning a victim.
 *   base  = clamp(0.55 - trust/250, 0.25, 0.70)
 *   + 0.12 per warning already made today (before this one)
 *   + 0.02 per earlier uncaught warning (the manager builds a file on you), max +0.15
 *   - 0.05 if Tuấn is still here and close (relationship >= 60): he covers for you
 *   final clamp to [0.20, 0.90]
 */
export function warningCatchChance(o: {
  managerTrust: number;
  warnedToday: number;
  warningsUncaught: number;
  tuanCovers: boolean;
}): number {
  const base = clamp(0.55 - o.managerTrust / 250, 0.25, 0.7);
  const today = 0.12 * Math.max(0, o.warnedToday);
  const file = Math.min(0.15, 0.02 * Math.max(0, o.warningsUncaught));
  const cover = o.tuanCovers ? 0.05 : 0;
  return clamp(base + today + file - cover, 0.2, 0.9);
}

/** Player-facing risk band for the hidden "Cảnh báo nạn nhân" option. */
export function warningRiskLabel(chance: number): {label: string; tone: 'low' | 'mid' | 'high' | 'extreme'} {
  if (chance < 0.3) return {label: 'Thấp', tone: 'low'};
  if (chance < 0.45) return {label: 'Vừa', tone: 'mid'};
  if (chance < 0.6) return {label: 'Cao', tone: 'high'};
  return {label: 'Rất cao', tone: 'extreme'};
}
