import type { Kind } from '../models/constants';

/** Sounds (Web Audio), vibration and voice. Vibration does not exist on Safari iOS: silently ignored.
 *  Audio must be unlocked by a user gesture (Start / Resume button).
 *  `enabled` comes from the user's preference, read by the controller.
 *
 *  Audio session: we stay in 'ambient' (mixes with the user's music, never interrupts it) and
 *  switch to 'transient' only while a sound/voice plays, so other audio is ducked, then restored.
 *
 *  The coach voice is NOT speechSynthesis (iOS cuts the user's music for it): it is a short audio clip per
 *  phase (public/voice/<kind>.m4a, made by scripts/make-voice.sh) played through one <audio> element. */
let ctx: AudioContext | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | undefined;

// ---- Coach voice clips ----
const KINDS: Kind[] = ['warmup', 'accel', 'recover', 'steady', 'cooldown'];
const SILENCE = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='; // 0.1 s of silence, played once inside the Start tap to unlock the element
let voiceEl: HTMLAudioElement | null = null;
const voiceReady: Partial<Record<Kind, Promise<string | null>>> = {}; // blob URL of each clip, null if missing

/** Clips are fetched into blob URLs (works offline through the service worker, and avoids the Range requests
 *  Safari sends for media, which a cache-first service worker cannot answer). */
function loadVoice() {
  for (const k of KINDS) {
    voiceReady[k] ??= fetch(`${import.meta.env.BASE_URL}voice/${k}.m4a`)
      .then(async (r) => (r.ok ? URL.createObjectURL(await r.blob()) : null))
      .catch(() => null);
  }
}

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

/** iOS may hold voice prompts that came due while the app was hidden and speak them all the moment the app
 *  comes back to the front, which stops the user's music. On return: drop that backlog and make sure the
 *  session is back to 'ambient' (a 'transient' left over from a timer that never fired would also cut the music). */
let watchingVisibility = false;
function settleAudioOnReturn() {
  if (watchingVisibility) return;
  watchingVisibility = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    try { speechSynthesis.cancel(); } catch {}
    clearTimeout(releaseTimer);
    setSession('ambient');
  });
}

export function unlockAudio() {
  try {
    settleAudioOnReturn();
    setSession('ambient'); // must be set BEFORE creating/resuming the AudioContext
    loadVoice();
    if (!voiceEl) {
      voiceEl = new Audio();
      voiceEl.src = SILENCE;
      voiceEl.play().catch(() => {}); // unlocks this element for later cues, even with the screen locked
    }
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

/** Voice prompt for a new phase (an audio clip). `previousResult` is no longer spoken: it needed live speech synthesis.
 *  Not gated by the sound preference (as before). A missing clip is simply silent. */
export function announcePhase(kind: Kind, _previousResult: string | null = null) {
  try {
    const el = voiceEl;
    if (!el) return;
    (voiceReady[kind] ?? Promise.resolve(null)).then((url) => {
      if (!url) return;
      clearTimeout(releaseTimer);
      setSession('transient');
      const restore = () => setSession('ambient');
      el.onended = restore;
      el.onerror = restore;
      el.src = url;
      el.play().catch(restore);
    });
  } catch {}
}
