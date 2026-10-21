// tslint:disable
/* eslint-disable */
/**
 * @fileoverview Tiny procedural pixel-art portraits (24x24 grid) in the game's
 * muted Papers, Please palette. Used for roommates and telesales targets that
 * have no image asset.
 */
import React, {useEffect, useRef} from 'react';

type Look = {
  skin: string;
  hair: string;
  shirt: string;
  hairStyle: 'short' | 'bun' | 'messy' | 'helmet' | 'greybun';
  glasses?: 'plain' | 'cracked';
  age?: 'young' | 'old';
};

const LOOKS: Record<number, Look> = {
  1: {skin: '#c9a27e', hair: '#1b1b1b', shirt: '#56604f', hairStyle: 'short', age: 'young'}, // Tuấn
  2: {skin: '#b98d68', hair: '#2a211b', shirt: '#6b4f3a', hairStyle: 'bun'}, // Chị Hoa
  3: {skin: '#c4a07c', hair: '#151515', shirt: '#3d4a52', hairStyle: 'messy', glasses: 'cracked'}, // Bảo
  4: {skin: '#c9a585', hair: '#a8a8a0', shirt: '#5d4e66', hairStyle: 'greybun', glasses: 'plain', age: 'old'}, // Cô Tư
  7: {skin: '#b48a62', hair: '#222', shirt: '#2f5e3b', hairStyle: 'helmet'}, // Anh Tèo
};

export type Expression = 'normal' | 'sad' | 'happy' | 'scared';

export default function PixelPortrait({
  seed,
  size = 96,
  expression = 'normal',
  dim = false,
}: {
  seed: number;
  size?: number;
  expression?: Expression;
  dim?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const look = LOOKS[seed] || LOOKS[1];
    const px = (x: number, y: number, w: number, h: number, col: string) => {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
    };
    ctx.clearRect(0, 0, 24, 24);
    // background (grimy wall)
    px(0, 0, 24, 24, '#2b3530');
    px(0, 18, 24, 6, '#222a26');
    // shoulders / shirt
    px(4, 19, 16, 5, look.shirt);
    px(10, 19, 4, 2, look.skin);
    // neck
    px(10, 16, 4, 3, look.skin);
    // head
    px(7, 6, 10, 11, look.skin);
    px(6, 9, 1, 4, look.skin);
    px(17, 9, 1, 4, look.skin);
    // shading
    px(15, 7, 2, 9, 'rgba(0,0,0,0.12)');
    // hair
    if (look.hairStyle === 'short') {
      px(7, 4, 10, 3, look.hair);
      px(6, 5, 1, 4, look.hair);
      px(17, 5, 1, 4, look.hair);
    } else if (look.hairStyle === 'bun' || look.hairStyle === 'greybun') {
      px(7, 4, 10, 3, look.hair);
      px(6, 5, 1, 6, look.hair);
      px(17, 5, 1, 6, look.hair);
      px(10, 1, 4, 3, look.hair);
    } else if (look.hairStyle === 'messy') {
      px(6, 3, 12, 4, look.hair);
      px(5, 4, 1, 3, look.hair);
      px(18, 4, 1, 3, look.hair);
      px(8, 2, 2, 1, look.hair);
      px(13, 2, 3, 1, look.hair);
    } else if (look.hairStyle === 'helmet') {
      px(6, 2, 12, 5, '#3f7d4f');
      px(5, 6, 14, 1, '#2c5a38');
      px(9, 3, 4, 1, '#6aa77a');
    }
    // eyes
    const eyeY = 10;
    const eyeCol = '#1a1a1a';
    if (expression === 'happy') {
      px(9, eyeY, 2, 1, eyeCol);
      px(13, eyeY, 2, 1, eyeCol);
    } else if (expression === 'scared') {
      px(9, eyeY - 1, 2, 2, '#e5e5e5');
      px(13, eyeY - 1, 2, 2, '#e5e5e5');
      px(9, eyeY, 1, 1, eyeCol);
      px(14, eyeY, 1, 1, eyeCol);
    } else {
      px(9, eyeY, 2, 2, eyeCol);
      px(13, eyeY, 2, 2, eyeCol);
    }
    // brows
    if (expression === 'sad' || expression === 'scared') {
      px(9, eyeY - 2, 1, 1, look.hair);
      px(10, eyeY - 3, 1, 1, look.hair);
      px(14, eyeY - 2, 1, 1, look.hair);
      px(13, eyeY - 3, 1, 1, look.hair);
    }
    // eye bags (tired)
    px(9, eyeY + 2, 2, 1, 'rgba(60,40,60,0.35)');
    px(13, eyeY + 2, 2, 1, 'rgba(60,40,60,0.35)');
    if (look.age === 'old') {
      px(8, 13, 1, 1, 'rgba(0,0,0,0.2)');
      px(15, 13, 1, 1, 'rgba(0,0,0,0.2)');
    }
    // glasses
    if (look.glasses) {
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(8.3, eyeY - 0.7, 3.4, 3.2);
      ctx.strokeRect(12.3, eyeY - 0.7, 3.4, 3.2);
      px(11.7, eyeY, 0.6, 0.6, '#9ca3af');
      if (look.glasses === 'cracked') {
        ctx.beginPath();
        ctx.moveTo(12.5, eyeY - 0.5);
        ctx.lineTo(14, eyeY + 1);
        ctx.lineTo(15.5, eyeY + 0.5);
        ctx.stroke();
      }
    }
    // nose
    px(11, 12, 2, 1, 'rgba(0,0,0,0.18)');
    // mouth
    if (expression === 'happy') {
      px(10, 14, 4, 1, '#5a2e2e');
      px(9, 13, 1, 1, '#5a2e2e');
      px(14, 13, 1, 1, '#5a2e2e');
    } else if (expression === 'sad' || expression === 'scared') {
      px(10, 14, 4, 1, '#5a2e2e');
      px(9, 15, 1, 1, '#5a2e2e');
      px(14, 15, 1, 1, '#5a2e2e');
    } else {
      px(10, 14, 4, 1, '#5a2e2e');
    }
    // fluorescent grade
    px(0, 0, 24, 24, 'rgba(90, 120, 90, 0.10)');
  }, [seed, expression]);

  return (
    <canvas
      ref={ref}
      width={24}
      height={24}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        filter: dim ? 'grayscale(1) brightness(0.5)' : undefined,
      }}
      className="rounded border-2 border-[#3b544b] bg-slate-900"
    />
  );
}
