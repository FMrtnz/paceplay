import { PHASE_LABEL, PHASE_TIP } from '../models/constants';
import type { Kind } from '../models/constants';

/** Sounds (Web Audio), vibration and voice. Vibration does not exist on Safari iOS: silently ignored.
 *  Audio must be unlocked by a user gesture (Start / Resume button).
 *  `enabled` comes from the user's preference, read by the controller. */
let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
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
  if (kind === 'up') { tone(660, 0, 0.12); tone(880, 0.14, 0.16); }
  else if (kind === 'down') { tone(660, 0, 0.12); tone(440, 0.14, 0.16); }
  else [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.3, 0.3));
}

export function vibrate(pattern: number | number[], enabled: boolean) {
  try { if (enabled) navigator.vibrate?.(pattern); } catch {}
}

/** Spoken prompt for a new phase. Not gated by the sound preference (as before). */
export function announcePhase(kind: Kind) {
  try {
    const say = new SpeechSynthesisUtterance(`${PHASE_LABEL[kind]}. ${PHASE_TIP[kind]}`);
    say.lang = 'en-US';
    speechSynthesis.speak(say);
  } catch {}
}
