export type Kind = 'warmup' | 'intense' | 'recovery';
export type Phase = { kind: Kind; seconds: number };
export type Params = { warmupMin: number; fartlekMin: number };

const r5 = (x: number) => Math.max(5, Math.round(x / 5) * 5);
const between = (a: number, b: number, rand: () => number) => r5(a + rand() * (b - a));

function nextEffort(prev: number, rand: () => number) {
  const c = rand();
  const [a, b] = c < 0.4 ? [20, 35] : c < 0.8 ? [40, 60] : [65, 90]; // a mix of short, medium and long VMA efforts
  let e = between(a, b, rand);
  if (e === prev) e += 5;
  return e;
}
function nextRecovery(effort: number, prev: number, rand: () => number) {
  let r = Math.min(120, Math.max(30, r5(effort * (0.8 + rand() * 0.8)))); // usually a bit longer than the effort
  if (r === prev) r += 5;
  return r;
}

function attempt(total: number, rand: () => number): [number, number][] | null {
  const blocks: [number, number][] = [];
  let left = total, pe = 0, pr = 0;
  for (;;) {
    if (left <= 120) { // last block: an effort, then a short easy stretch that uses up the time left exactly
      for (let t = 0; t < 30; t++) {
        const e = nextEffort(pe, rand), r = left - e;
        if (r >= 30 && r <= 60 && r !== pr) { blocks.push([e, r]); return blocks; }
      }
      return null;
    }
    let ok = false;
    for (let t = 0; t < 30 && !ok; t++) {
      const e = nextEffort(pe, rand), r = nextRecovery(e, pr, rand);
      if (left - e - r >= 50) { blocks.push([e, r]); left -= e + r; pe = e; pr = r; ok = true; }
    }
    if (!ok) return null;
  }
}

/** Irregular fartlek: [effort, recovery] blocks in seconds that add up to exactly `total` (a multiple of 5).
 *  Random every time: efforts 20-95 s and recoveries 30-125 s, never the same value twice in a row for efforts or
 *  recoveries, ending on an effort followed by a short (30-60 s) easy stretch. */
export function fartlekBlocks(total: number, rand: () => number = Math.random): [number, number][] {
  if (total < 50) return [[total, 0]];
  for (let i = 0; i < 200; i++) { const b = attempt(total, rand); if (b) return b; }
  const e = r5(total * 0.6);
  return [[e, total - e]]; // never reached in practice
}

/** Warm-up, then the irregular fartlek (effort, recovery, effort, ...). */
export function buildPlan(p: Params, rand: () => number = Math.random): Phase[] {
  const plan: Phase[] = [];
  if (p.warmupMin > 0) plan.push({ kind: 'warmup', seconds: Math.round(p.warmupMin * 60) });
  if (p.fartlekMin > 0)
    for (const [e, r] of fartlekBlocks(Math.round(p.fartlekMin * 60), rand))
      { plan.push({ kind: 'intense', seconds: e }); if (r > 0) plan.push({ kind: 'recovery', seconds: r }); }
  return plan;
}

export const totalSeconds = (plan: Phase[]) => plan.reduce((s, ph) => s + ph.seconds, 0);

/** Phase running at time `t` (seconds), the time left in it, and the next phase. null once the session is over. */
export function phaseAt(plan: Phase[], t: number) {
  let start = 0;
  for (let i = 0; i < plan.length; i++) {
    const end = start + plan[i].seconds;
    if (t < end) return { index: i, phase: plan[i], left: end - t, next: plan[i + 1] ?? null };
    start = end;
  }
  return null;
}

// ---- The sound is ONE pre-built audio track (beeps placed at exact times). It is played by an <audio> element, so
// ---- the phone keeps playing it with the screen locked, with no timer or JavaScript needed during the session.
const RATE = 8000;

function tone(buf: Uint8Array, at: number, dur: number, hz: number) {
  const s = Math.round(at * RATE), n = Math.round(dur * RATE);
  for (let i = 0; i < n && s + i < buf.length; i++) {
    const env = Math.min(1, i / 80, (n - i) / 80); // 10 ms fade in/out, no clicks
    buf[s + i] = 128 + Math.round(110 * env * Math.sin((2 * Math.PI * hz * i) / RATE));
  }
}

/** 8-bit mono WAV: 3 high beeps = intense starts, 1 long low beep = rest/warm-up starts, 2 beeps = end,
 *  and a tick in each of the last 3 seconds of a phase. */
export function renderTrack(plan: Phase[]): Uint8Array {
  const total = totalSeconds(plan);
  const n = Math.round((total + 3) * RATE);
  const wav = new Uint8Array(44 + n);
  const pcm = wav.subarray(44).fill(128);
  let t = 0;
  for (const ph of plan) {
    if (ph.kind === 'intense') for (let k = 0; k < 3; k++) tone(pcm, t + k * 0.25, 0.15, 1320);
    else tone(pcm, t, 0.6, 660);
    if (ph.seconds >= 6) for (let k = 3; k >= 1; k--) tone(pcm, t + ph.seconds - k, 0.08, 1000);
    t += ph.seconds;
  }
  tone(pcm, total, 0.5, 880);
  tone(pcm, total + 0.7, 0.5, 880);
  const v = new DataView(wav.buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => (wav[o + i] = c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true); v.setUint32(28, RATE, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, n, true);
  return wav;
}
