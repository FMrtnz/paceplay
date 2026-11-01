import { PHASE_LABEL, PHASE_TIP } from '../models/vocabulary';
import type { Kind } from '../models/constants';

/** Sounds (Web Audio), vibration and voice. Vibration does not exist on Safari iOS: silently ignored.
 *  Audio must be unlocked by a user gesture (Start / Resume button).
 *  `enabled` comes from the user's preference, read by the controller.
 *
 *  Audio session: we stay in 'ambient' (mixes with the user's music, never interrupts it) and
 *  switch to 'transient' only while a sound/voice plays, so other audio is ducked, then restored. */
let ctx: AudioContext | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | undefined;

type SessionType = 'ambient' | 'transient';

function setSession(type: SessionType) {
  try {
    const s = (navigator as any).audioSession; // Safari iOS 16.4+ ; absent elsewhere -> ignored
    if (s) s.type = type;
  } catch {}
}

/** Duck other audio for `ms` milliseconds, then go back to ambient (music returns to full volume). */
function duckFor(ms: number) {
  setSession('transient');
  clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => setSession('ambient'), ms + 300);
}

export function unlockAudio() {
  try {
    setSession('ambient'); // must be set BEFORE creating/resuming the AudioContext
    const A = (window as any).AudioContext || (window as any).webkitAudioContext;
    ctx ??= new A();
    ctx!.resume();
  } catch {}
}

function tone(f: number, at: number, d: number, vol = 0.25) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + at;
  o.type = 'sine';
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + d + 0.05);
}

export function beep(kind: 'up' | 'down' | 'capture', enabled: boolean) {
  if (!enabled) return;
  if (kind === 'up') {
    duckFor(320);
    tone(660, 0, 0.12); tone(880, 0.14, 0.16);
  } else if (kind === 'down') {
    duckFor(320);
    tone(660, 0, 0.12); tone(440, 0.14, 0.16);
  } else {
    duckFor(750);
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.3, 0.3));
  }
}

export function vibrate(pattern: number | number[], enabled: boolean) {
  try { if (enabled) navigator.vibrate?.(pattern); } catch {}
}

/** Spoken prompt for a new phase, optionally preceded by the result of the previous one
 *  (e.g. the pace held during a speed-up). Not gated by the sound preference (as before). */
export function announcePhase(kind: Kind, previousResult: string | null = null) {
  try {
    const say = new SpeechSynthesisUtterance(`${previousResult ? previousResult + ' ' : ''}${PHASE_LABEL[kind]}. ${PHASE_TIP[kind]}`);
    say.lang = 'en-US';
    clearTimeout(releaseTimer);
    setSession('transient');
    const restore = () => setSession('ambient');
    say.onend = restore;
    say.onerror = restore;
    speechSynthesis.speak(say);
  } catch {}
}