// tslint:disable
/* eslint-disable */
/**
 * @fileoverview Night-time dorm scene: talk to / share food with roommates
 * (Tuấn, Chị Hoa, Bảo). Relationship meters unlock mini-storylines:
 *  - Chị Hoa (>=60) reveals the guard schedule.
 *  - Bảo (>=60) fixes an old phone -> message family (Giải Cứu ending).
 *  - Tuấn (<30) may betray you for food; (>=60) warns you of inspections.
 * All game-state changes happen in App via the callbacks.
 */
import {MessageCircle, Moon, Smartphone, Utensils, X} from 'lucide-react';
import React from 'react';
import {ROOMMATES, RoommateId} from './storyData';
import {gameAudio} from './utils/helper';

export interface RoommateState {
  relationship: number;
  present: boolean;
  lastLine: string;
}

export interface RoommatesSceneProps {
  roommates: Record<RoommateId, RoommateState>;
  actionsLeft: number;
  mealTickets: number;
  money: number;
  dayNumber: number;
  maxDays: number;
  hoaSchedule: boolean;
  phoneFixed: boolean;
  messageSent: boolean;
  rescueDay: number | null;
  log: string[];
  onTalk: (id: RoommateId) => void;
  onShare: (id: RoommateId) => void;
  onFixPhone: () => void;
  onSendMessage: () => void;
  onExit: () => void;
  assets: Record<string, HTMLImageElement | null | undefined>;
}

export const SHARE_FOOD_PRICE = 30; // = giá Cơm Trắng

/** Wall calendar with crossed-off days, drawn over the paper calendar asset. */
export function WallCalendar({day, maxDays, paper}: {day: number; maxDays: number; paper?: string}) {
  return (
    <div className="relative w-[150px] h-[157px] rotate-[-2deg] drop-shadow-lg select-none">
      {paper && <img src={paper} alt="" className="absolute inset-0 w-full h-full" style={{imageRendering: 'pixelated'}} />}
      <div className="absolute left-0 right-0 top-[12%] text-center text-[8px] font-bold tracking-wider text-[#f3e9d2]">
        NGÀY {day}/{maxDays}
      </div>
      <div className="absolute left-[9%] right-[9%] top-[27%] bottom-[8%] grid grid-cols-5 grid-rows-4 gap-[2px] text-[#3b3426]">
        {Array.from({length: maxDays}, (_, i) => i + 1).map((d) => (
          <div
            key={d}
            className={`relative text-[9px] flex items-center justify-center font-bold ${
              d === day ? 'outline outline-2 outline-[#9a3412] rounded-sm text-[#7c2d12]' : ''
            }`}>
            {d}
            {d < day && <span className="absolute inset-0 flex items-center justify-center text-[#7f1d1d] font-black text-[15px] leading-none opacity-85">✕</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function band(rel: number) {
  return rel >= 60 ? 'Thân thiết' : rel >= 30 ? 'Quen biết' : 'Xa cách';
}


export default function RoommatesScene(p: RoommatesSceneProps) {
  const noActions = p.actionsLeft <= 0;
  const canPayFood = p.mealTickets > 0 || p.money >= SHARE_FOOD_PRICE;
  return (
    <div className="vnlc-scene vnlc-scroll absolute inset-0 z-30 bg-[#0b1110] flex flex-col items-center p-3 gap-3 overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 font-bold">
            <Moon size={16} /> Ký Túc Xá - Bạn Cùng Phòng (Ban Đêm)
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Hành động còn lại đêm nay: <strong className="text-yellow-300">{p.actionsLeft}/3</strong> · Phiếu cơm:{' '}
            <strong className="text-yellow-300">{p.mealTickets}</strong> · Tiền: <strong className="text-emerald-300">${p.money}</strong>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 max-w-md">
            Trò chuyện (+quan hệ, +Tinh Thần) hoặc chia đồ ăn (1 phiếu cơm hoặc ${SHARE_FOOD_PRICE}; +quan hệ nhiều, +Lương Tâm).
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
            {p.hoaSchedule && <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-200">Đã biết lịch gác (Chị Hoa): -20% tầm nhìn lính gác</span>}
            {p.phoneFixed && !p.messageSent && <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-700 text-sky-200">Có điện thoại cũ (Bảo sửa)</span>}
            {p.messageSent && p.rescueDay && (
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-200 animate-pulse">
                Đã cầu cứu! Cứu hộ dự kiến sáng ngày {p.rescueDay}
              </span>
            )}
          </div>
        </div>
        <WallCalendar day={p.dayNumber} maxDays={p.maxDays} paper={p.assets['prop_wall_calendar']?.src} />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-3">
        {ROOMMATES.map((def) => {
          const st = p.roommates[def.id];
          const rel = st.relationship;
          return (
            <div
              key={def.id}
              data-roommate={def.id}
              className={`bg-[#141f1c] border-2 rounded-lg p-3 flex flex-col gap-2 ${
                st.present ? 'border-[#2c423b]' : 'border-red-900/60 opacity-60'
              }`}>
              <div className="flex gap-3 items-center">
                <div className="w-[72px] h-[72px] shrink-0 rounded-md border-2 border-[#3b544b] bg-[#0f1715] overflow-hidden flex items-end justify-center">
                  {p.assets[def.portraitKey] && (
                    <img
                      src={p.assets[def.portraitKey]!.src}
                      alt={def.name}
                      className={`w-full h-full object-contain object-bottom ${st.present ? '' : 'grayscale opacity-50'}`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-yellow-300 text-sm">{def.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{def.role}</div>
                  {st.present ? (
                    <>
                      <div className="flex justify-between text-[10px] mt-1">
                        <span className="text-slate-400">Quan hệ: {band(rel)}</span>
                        <span className="text-pink-300 font-bold">{rel}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${rel >= 60 ? 'bg-pink-400' : rel >= 30 ? 'bg-amber-400' : 'bg-slate-500'}`}
                          style={{width: `${rel}%`}}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-red-300 mt-1 font-bold">Đã bị "bán" sang trại khác...</div>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-300 bg-[#0d1513] border border-[#22332e] rounded p-2 min-h-[56px] italic">
                {st.lastLine}
              </div>
              {st.present && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <button
                      disabled={noActions}
                      onClick={() => {
                        gameAudio.playCrispClick();
                        p.onTalk(def.id);
                      }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[11px] font-bold flex items-center justify-center gap-1 disabled:opacity-40">
                      <MessageCircle size={12} /> Trò chuyện
                    </button>
                    <button
                      disabled={noActions || !canPayFood}
                      onClick={() => p.onShare(def.id)}
                      className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 rounded text-[11px] font-bold flex items-center justify-center gap-1 disabled:opacity-40">
                      <Utensils size={12} /> Chia đồ ăn
                    </button>
                  </div>
                  {def.id === 'bao' && rel >= 60 && !p.phoneFixed && !p.messageSent && (
                    <button
                      disabled={noActions}
                      onClick={p.onFixPhone}
                      className="py-2 bg-sky-900 hover:bg-sky-800 border border-sky-600 rounded text-[11px] font-bold flex items-center justify-center gap-1 disabled:opacity-40">
                      <Smartphone size={12} /> Nhờ Bảo sửa điện thoại cũ
                    </button>
                  )}
                  {def.id === 'bao' && p.phoneFixed && !p.messageSent && (
                    <button
                      disabled={noActions}
                      onClick={p.onSendMessage}
                      className="py-2 bg-rose-900 hover:bg-rose-800 border border-rose-600 rounded text-[11px] font-bold flex items-center justify-center gap-1 disabled:opacity-40">
                      <Smartphone size={12} /> Lén nhắn tin cầu cứu gia đình (rủi ro!)
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {p.log.length > 0 && (
        <div className="w-full max-w-4xl bg-[#0d1513] border border-[#22332e] rounded p-2 text-[11px] text-emerald-200 space-y-0.5">
          {p.log.map((l, i) => (
            <div key={i} className={i === 0 ? '' : 'text-slate-500'}>
              {l}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          gameAudio.playCrispClick();
          p.onExit();
        }}
        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded font-bold text-xs text-slate-200 flex items-center gap-2">
        <X size={14} /> Quay lại khu trại
      </button>
    </div>
  );
}
