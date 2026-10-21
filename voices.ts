/**
 * @fileoverview Pre-generated Telesales voice clips (edge-tts, baked phone-line
 * effect). Files live in assets/voice/<speaker>_<hash>.mp3 where hash is
 * FNV-1a(32) of "voice|pitch|rate|fx|text" — the exact same function is used by
 * scripts/gen_voices.py, so editing a line or a voice profile simply produces a
 * new file name (run `npm run voices` to regenerate).
 */
import {TELESALES_VICTIMS} from './storyData';

export interface VoiceProfile {
  /** edge-tts voice */
  voice: 'vi-VN-HoaiMyNeural' | 'vi-VN-NamMinhNeural';
  /** edge-tts --pitch, e.g. "-12Hz" */
  pitch: string;
  /** edge-tts --rate, e.g. "+10%" */
  rate: string;
  /** baked ffmpeg effect: 'phone2' = caller on a phone line (v2: narrower band, 8 kHz codec, saturation), 'headset' = the player's own mic */
  fx: 'phone2' | 'headset';
  label: string;
}

/** Victims (keyed by TELESALES_VICTIMS id) + the player. Gender matched to the character. */
export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  uncle_sau: {voice: 'vi-VN-NamMinhNeural', pitch: '-16Hz', rate: '-12%', fx: 'phone2', label: 'Bác Sáu: nam, trầm, chậm'},
  student_nam: {voice: 'vi-VN-NamMinhNeural', pitch: '+12Hz', rate: '+12%', fx: 'phone2', label: 'Cậu Nam: nam, cao, nhanh'},
  vendor_chi_ba: {voice: 'vi-VN-HoaiMyNeural', pitch: '+4Hz', rate: '+14%', fx: 'phone2', label: 'Chị Ba: nữ, nhanh nhảu'},
  co_tu: {voice: 'vi-VN-HoaiMyNeural', pitch: '-14Hz', rate: '-10%', fx: 'phone2', label: 'Cô Tư: nữ, trầm, chậm rãi'},
  anh_teo: {voice: 'vi-VN-NamMinhNeural', pitch: '+4Hz', rate: '+20%', fx: 'phone2', label: 'Anh Tèo: nam, vội vã'},
  player: {voice: 'vi-VN-NamMinhNeural', pitch: '-6Hz', rate: '+0%', fx: 'headset', label: 'Người chơi: nam, giọng tai nghe (không qua lọc điện thoại)'},
};

/** FNV-1a 32-bit over UTF-8 bytes (NFC), as 8 hex chars. Mirrors scripts/gen_voices.py. */
export function voiceHash(s: string): string {
  const bytes = new TextEncoder().encode(s.normalize('NFC'));
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function voiceKey(p: VoiceProfile, text: string): string {
  return `${p.voice}|${p.pitch}|${p.rate}|${p.fx}|${text}`;
}

/** Relative URL (works under base './', e.g. GitHub Pages sub-path). */
export function voiceUrl(speaker: string, text: string): string | null {
  const p = VOICE_PROFILES[speaker];
  if (!p || !text) return null;
  return `assets/voice/${speaker}_${voiceHash(voiceKey(p, text))}.mp3`;
}

/** Every clip the game can request: [speaker, text]. Used by the generator. */
export function allVoiceLines(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const v of TELESALES_VICTIMS) {
    for (const d of v.dialogues) {
      out.push([v.id, d.prompt]);
      for (const c of d.choices) out.push(['player', c.text]);
      if (d.warning) out.push(['player', d.warning]);
    }
  }
  return out;
}
