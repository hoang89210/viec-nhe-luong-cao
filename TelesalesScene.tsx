// tslint:disable
/* eslint-disable */
/**
 * @fileoverview Telesales desk mini-game: phone ring, typewriter dialogue with
 * phone-filtered babble voice, 3 shuffled replies + a sometimes-visible hidden
 * "Cảnh báo nạn nhân" option, and a Nghi Ngờ (suspicion) bar.
 * The parent App applies rewards / punishments via onCallEnd.
 */
import {AlertTriangle, Mic, MicOff, Phone, PhoneCall, PhoneOff, Zap} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {TELESALES_VICTIMS} from './storyData';
import {TelesalesChoice} from './gameTypes';
import {gameAudio} from './utils/helper';
import {voiceUrl} from './voices';

export type CallResult = 'PASS' | 'FAIL' | 'WARNED';

export interface TelesalesSceneProps {
  assets: Record<string, HTMLImageElement | null>;
  conscience: number;
  managerTrust: number;
  failStreak: number;
  callsLeft: number;
  quota: number;
  paused: boolean;
  /** Apply per-reply stat effects. */
  onChoice: (trustDelta: number, conscienceDelta: number) => void;
  /** Call finished. Returns the summary text to show on the result card. */
  onCallEnd: (result: CallResult) => string;
  onExit: () => void;
}

const WARN_CHANCE = 0.45;
const FAIL_AT = 95;

type Phase = 'RINGING' | 'TALK' | 'RESULT';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TelesalesScene(props: TelesalesSceneProps) {
  const {assets, conscience, managerTrust, failStreak, callsLeft, quota, paused} = props;
  const propsRef = useRef(props);
  propsRef.current = props;

  const lastVictimRef = useRef(-1);
  const [victimIndex, setVictimIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [suspicion, setSuspicion] = useState(20);
  const [phase, setPhase] = useState<Phase>('RINGING');
  const [typed, setTyped] = useState(0);
  const [choices, setChoices] = useState<TelesalesChoice[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState<{kind: CallResult; text: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const endedRef = useRef(false);

  const victim = TELESALES_VICTIMS[victimIndex];
  const dialogue = victim?.dialogues[step];
  const prompt = dialogue?.prompt ?? '';
  const voicePitch = 0.8 + (victimIndex % 5) * 0.12;
  // 'Giọng đọc' (pre-generated TTS). When off, the old babble blips are used instead.
  const [voiceOn, setVoiceOn] = useState(() => gameAudio.isVoiceEnabled());

  const prepareStep = useCallback((vIdx: number, sIdx: number) => {
    const d = TELESALES_VICTIMS[vIdx].dialogues[sIdx];
    setChoices(shuffle(d.choices));
    setShowWarning(Math.random() < WARN_CHANCE);
    setTyped(0);
  }, []);

  const startCall = useCallback(() => {
    let idx = Math.floor(Math.random() * TELESALES_VICTIMS.length);
    if (idx === lastVictimRef.current) idx = (idx + 1) % TELESALES_VICTIMS.length;
    lastVictimRef.current = idx;
    endedRef.current = false;
    setVictimIndex(idx);
    setStep(0);
    setSuspicion(TELESALES_VICTIMS[idx].initialSuspicion);
    setFeedback('');
    setResult(null);
    setBusy(false);
    setPhase('RINGING');
    prepareStep(idx, 0);
    gameAudio.stopVoice();
    gameAudio.preloadVoice(voiceUrl(TELESALES_VICTIMS[idx].id, TELESALES_VICTIMS[idx].dialogues[0].prompt));
    gameAudio.playPhoneRing();
  }, [prepareStep]);

  // First call on mount
  useEffect(() => {
    startCall();
  }, [startCall]);

  // Ringing -> talk
  useEffect(() => {
    if (phase !== 'RINGING') return;
    const t = setTimeout(() => setPhase('TALK'), 1500);
    return () => clearTimeout(t);
  }, [phase, victimIndex]);

  // Victim speaks the current line (queued after the player's reply, capped so it never stalls)
  useEffect(() => {
    if (phase !== 'TALK' || paused || !victim || !dialogue) return;
    gameAudio.playVoice(voiceUrl(victim.id, dialogue.prompt), {capMs: 7000});
    dialogue.choices.forEach((ch) => gameAudio.preloadVoice(voiceUrl('player', ch.text)));
    gameAudio.preloadVoice(voiceUrl('player', dialogue.warning));
    const nextD = victim.dialogues[step + 1];
    if (nextD) gameAudio.preloadVoice(voiceUrl(victim.id, nextD.prompt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, victimIndex, step, paused]);

  // Pause menu: silence; afterwards pick up a toggle change made in the menu
  useEffect(() => {
    if (paused) gameAudio.stopVoice();
    else setVoiceOn(gameAudio.isVoiceEnabled());
  }, [paused]);

  // Leaving the desk stops any speech
  useEffect(() => () => gameAudio.stopVoice(), []);

  // Typewriter + babble voice
  useEffect(() => {
    if (phase !== 'TALK' || paused) return;
    if (typed >= prompt.length) return;
    const t = setTimeout(() => {
      const next = Math.min(prompt.length, typed + 1);
      const ch = prompt[typed];
      if (!voiceOn && ch && /[\p{L}\d]/u.test(ch) && typed % 2 === 0) gameAudio.playBabble(voicePitch);
      setTyped(next);
    }, 26);
    return () => clearTimeout(t);
  }, [phase, typed, prompt, paused, voicePitch, voiceOn]);

  const typingDone = typed >= prompt.length;

  const endCall = (kind: CallResult, text: string) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (kind !== 'PASS') gameAudio.playDialTone();
    else gameAudio.playCoinPickup();
    gameAudio.cancelQueuedVoice(); // let the last reply finish, drop anything queued
    const summary = propsRef.current.onCallEnd(kind);
    setResult({kind, text: `${text}\n${summary}`});
    setPhase('RESULT');
  };

  const pick = (choice: TelesalesChoice | 'WARN') => {
    if (busy || phase !== 'TALK') return;
    if (!typingDone) {
      setTyped(prompt.length);
      return;
    }
    gameAudio.playCrispClick();
    // Player says the reply (cuts the caller off if they were still talking)
    gameAudio.playVoice(voiceUrl('player', choice === 'WARN' ? dialogue?.warning ?? '' : choice.text), {
      interrupt: true,
      capMs: 7000,
    });
    if (choice === 'WARN') {
      propsRef.current.onChoice(-20, 15);
      setBusy(true);
      setFeedback('Bạn hạ giọng cảnh báo nạn nhân... Họ im lặng một giây rồi cúp máy.');
      setTimeout(() => endCall('WARNED', 'Bạn đã cảnh báo nạn nhân.'), 1300);
      return;
    }
    const jitter = Math.round((Math.random() - 0.5) * 10);
    const next = Math.max(0, Math.min(100, suspicion + choice.suspicionDelta + jitter));
    setSuspicion(next);
    propsRef.current.onChoice(choice.trustDelta, choice.conscienceDelta);
    if (next >= FAIL_AT) {
      setBusy(true);
      setFeedback('TÚT... TÚT... Nạn nhân sinh nghi và cúp máy!');
      setTimeout(() => endCall('FAIL', 'Cuộc gọi thất bại.'), 1100);
      return;
    }
    if (step < victim.dialogues.length - 1) {
      setStep(step + 1);
      prepareStep(victimIndex, step + 1);
      setFeedback(choice.suspicionDelta < 0 ? 'Nạn nhân có vẻ xuôi tai...' : 'Nạn nhân bắt đầu nghi ngờ...');
    } else {
      setBusy(true);
      setFeedback('Nạn nhân "đồng ý" tham gia. Quản lý Hùng gật gù sau lưng bạn.');
      setTimeout(() => endCall('PASS', 'Cuộc gọi đạt KPI.'), 1100);
    }
  };

  // Number keys 1-4 for replies
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'TALK') return;
      const n = Number(e.key);
      if (n >= 1 && n <= 3 && choices[n - 1]) pick(choices[n - 1]);
      if (n === 4 && showWarning) pick('WARN');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!victim) return null;
  const sColor = suspicion > 70 ? 'text-red-400' : suspicion > 40 ? 'text-yellow-400' : 'text-emerald-400';

  return (
    <div className="vnlc-scene vnlc-scroll absolute inset-0 z-30 bg-[#0d1412] flex flex-col md:flex-row items-center justify-center p-3 gap-4 overflow-y-auto short:flex-row short:items-start short:gap-2">
      {/* Left: caller profile */}
      <div className="w-full md:w-80 bg-[#16211e] border-2 border-[#2b3d37] rounded-lg p-4 shadow-xl flex flex-col items-center short:w-52 short:shrink-0 short:p-2">
        <div className="text-xs uppercase tracking-wider text-emerald-400 mb-2 font-bold short:hidden">Mục Tiêu Telesales</div>
        <div className="w-32 h-32 rounded-lg border-2 border-[#3b544b] overflow-hidden bg-slate-900 mb-3 relative flex items-center justify-center short:w-20 short:h-20 short:mb-1">
          {victim.avatarKey && assets[victim.avatarKey] ? (
            <img src={assets[victim.avatarKey]?.src} alt={victim.name} className="w-full h-full object-contain" />
          ) : (
            <Phone size={48} className="text-emerald-500" />
          )}
          {phase === 'RINGING' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-yellow-300 text-xs font-bold animate-pulse">
              ĐANG ĐỔ CHUÔNG...
            </div>
          )}
        </div>
        <h3 className="font-bold text-sm text-yellow-300 text-center mb-1">{victim.name}</h3>
        <p className="text-[11px] text-slate-400 text-center mb-4 short:mb-1.5 short:text-[10px] short:leading-tight">{victim.role}</p>

        <div className="w-full bg-slate-900 border border-slate-700 rounded p-2 mb-3 short:p-1.5 short:mb-1.5">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Nghi Ngờ:</span>
            <span className={`font-bold ${sColor}`}>{suspicion}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                suspicion > 70 ? 'bg-red-500' : suspicion > 40 ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{width: `${suspicion}%`}}
            />
          </div>
          <div className="text-[9px] text-slate-500 mt-1">Chạm {FAIL_AT}% là nạn nhân cúp máy.</div>
        </div>

        <div className="w-full grid grid-cols-2 gap-2 text-[10px] short:gap-1">
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-center">
            <span className="text-slate-400">Lương Tâm:</span>
            <div className="font-bold text-cyan-300 text-xs">{conscience}/100</div>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-center">
            <span className="text-slate-400">Lòng Tin Sếp:</span>
            <div className="font-bold text-amber-300 text-xs">{managerTrust}/100</div>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-center">
            <span className="text-slate-400">KPI hôm nay:</span>
            <div className="font-bold text-yellow-300 text-xs">
              {quota - callsLeft}/{quota} cuộc
            </div>
          </div>
          <div
            className={`p-2 rounded border text-center ${
              failStreak >= 2 ? 'bg-red-950/70 border-red-700 animate-pulse' : 'bg-slate-900/60 border-slate-800'
            }`}>
            <span className="text-slate-400 flex items-center justify-center gap-1">
              <Zap size={10} /> Trượt liên tiếp:
            </span>
            <div className={`font-bold text-xs ${failStreak >= 2 ? 'text-red-400' : 'text-slate-200'}`}>{failStreak}/3</div>
          </div>
        </div>
      </div>

      {/* Right: CRT conversation */}
      <div className="flex-1 w-full max-w-2xl bg-[#09100d] border-2 border-[#1f382f] rounded-lg p-5 shadow-2xl flex flex-col short:p-2.5 short:min-w-0">
        <div className="flex items-center justify-between border-b border-[#1f382f] pb-2 mb-3 short:pb-1.5 short:mb-2">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            {phase === 'RESULT' ? <PhoneOff size={14} /> : <PhoneCall size={14} className="animate-pulse" />}
            <span>{phase === 'RINGING' ? 'ĐANG GỌI... (098-XXX-XXXX)' : phase === 'RESULT' ? 'CUỘC GỌI ĐÃ KẾT THÚC' : 'ĐANG TRONG CUỘC GỌI'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="voice-toggle"
              onClick={() => {
                const on = !voiceOn;
                gameAudio.setVoiceEnabled(on);
                setVoiceOn(on);
                gameAudio.playCrispClick();
              }}
              title="Bật/tắt giọng đọc"
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold short:h-8 ${
                voiceOn ? 'border-emerald-600 text-emerald-300 bg-emerald-950/60' : 'border-slate-600 text-slate-400 bg-slate-900'
              }`}>
              {voiceOn ? <Mic size={11} /> : <MicOff size={11} />} Giọng đọc: {voiceOn ? 'Bật' : 'Tắt'}
            </button>
            <span className="text-[10px] text-slate-500">
              Lượt {Math.min(step + 1, victim.dialogues.length)}/{victim.dialogues.length}
            </span>
          </div>
        </div>

        {phase !== 'RESULT' && (
          <>
            <div
              className="bg-[#0f1b17] border border-[#234236] p-4 rounded-md mb-4 text-emerald-300 text-sm leading-relaxed shadow-inner min-h-[88px] cursor-pointer short:p-2.5 short:mb-2 short:min-h-[56px] short:text-[13px] short:leading-snug"
              onClick={() => setTyped(prompt.length)}>
              {phase === 'RINGING' ? (
                <span className="text-slate-500 italic">Reng reng... reng reng...</span>
              ) : (
                <>
                  <span className="text-yellow-400 font-bold">Khách hàng: </span>
                  {prompt.slice(0, typed)}
                  {!typingDone && <span className="animate-pulse">▌</span>}
                </>
              )}
            </div>

            {feedback && (
              <div className="p-2 mb-3 rounded bg-emerald-950 border border-emerald-700 text-xs text-emerald-200 short:p-1.5 short:mb-2">{feedback}</div>
            )}

            <div className="space-y-2.5 short:space-y-1.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Chọn câu trả lời kịch bản (phím 1-3):</div>
              {choices.map((choice, idx) => (
                <button
                  key={`${step}-${idx}`}
                  disabled={busy || phase !== 'TALK' || !typingDone}
                  onClick={() => pick(choice)}
                  className="w-full text-left p-3 rounded-lg border text-xs md:text-sm transition-all flex items-start gap-2 short:p-2.5 short:min-h-[42px] short:text-[12.5px] bg-[#15231e] hover:bg-[#1f352e] border-[#29453c] text-emerald-200 hover:border-emerald-500 disabled:opacity-40">
                  <span className="font-bold text-yellow-400 shrink-0">[{idx + 1}]</span>
                  <span>{choice.text}</span>
                </button>
              ))}
              {showWarning && dialogue && (
                <button
                  disabled={busy || phase !== 'TALK' || !typingDone}
                  onClick={() => pick('WARN')}
                  className="w-full text-left p-3 rounded-lg border text-xs md:text-sm transition-all flex items-start gap-2 short:p-2.5 short:min-h-[42px] short:text-[12.5px] bg-rose-950/40 hover:bg-rose-900/60 border-rose-700 text-rose-200 disabled:opacity-40">
                  <span className="font-bold text-rose-400 shrink-0 flex items-center gap-1">
                    <AlertTriangle size={13} />[4] Cảnh báo nạn nhân:
                  </span>
                  <span>{dialogue.warning}</span>
                </button>
              )}
            </div>
          </>
        )}

        {phase === 'RESULT' && result && (
          <div className="flex flex-col gap-3">
            <div
              className={`p-4 rounded border text-sm whitespace-pre-line ${
                result.kind === 'PASS'
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
                  : result.kind === 'WARNED'
                  ? 'bg-cyan-950 border-cyan-700 text-cyan-100'
                  : 'bg-red-950/60 border-red-800 text-red-200'
              }`}>
              {result.text}
            </div>
            <div className="flex gap-2">
              {callsLeft > 0 ? (
                <button
                  onClick={() => startCall()}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 rounded font-bold text-sm text-white">
                  Gọi cuộc tiếp theo (còn {callsLeft})
                </button>
              ) : (
                <div className="flex-1 py-3 text-center text-xs text-yellow-300">Đã gọi đủ {quota} cuộc hôm nay.</div>
              )}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  propsRef.current.onExit();
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded font-bold text-xs text-slate-200">
                Rời bàn
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
