import { LEVELS, MIN_STEADY_BLOCK_S, SPEEDS, VARIATION_STEP_S } from './constants';
import type { Activity, Format, Kind, Level } from './constants';
import { MESSAGES } from './vocabulary';

export interface Phase { kind: Kind; dur: number }
export interface Plan { phases: Phase[]; total: number; distKm: number; sig: string; seed: number; n: number }
/** `warmupS`: seconds of warm-up, 0 for none, null/undefined for the automatic length. */
export interface PlanOptions { activity?: Activity; format?: Format; warmupS?: number | null }

const round30 = (x: number) => Math.round(x / 30) * 30;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Small seeded random generator (mulberry32): same seed → same plan. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Variation (-1, 0, +1) of acceleration `i` out of `n` for one of the 4 templates. */
function templateStep(tpl: number, i: number, n: number): number {
  if (tpl === 0) return 0;
  if (tpl === 1) return i < n / 3 || i >= (2 * n) / 3 ? -1 : 1;
  if (tpl === 2) return i < n / 3 ? -1 : i < (2 * n) / 3 ? 0 : 1;
  return i % 2 ? 1 : -1;
}

/** Average speed of an intervals session (km/h): also the pace assumed for a steady block. */
function averageSpeed(level: Level, activity: Activity): number {
  const p = LEVELS[level], s = SPEEDS[activity][level], f = p.A / (p.A + p.R);
  return (1 - f) * s.vE + f * s.vA;
}

const toPlan = (phases: Phase[], T: number, seed: number, n: number, kmh: (k: Kind) => number): Plan => {
  const total = phases.reduce((a, x) => a + x.dur, 0);
  if (total !== T) throw new Error(MESSAGES.invariant);
  const distKm = phases.reduce((a, x) => a + x.dur * kmh(x.kind), 0) / 3600;
  return { phases, total, distKm, n, seed, sig: phases.map((x) => x.kind[0] + x.dur).join('-') };
};

export function buildPlan(T: number, level: Level, seed = 0, opts: PlanOptions = {}): Plan {
  const { activity = 'run', format = 'intervals' } = opts;
  if (!Number.isInteger(T) || T < 600) throw new Error(MESSAGES.minDuration);
  const p = LEVELS[level], K = p.A + p.R, sp = SPEEDS[activity][level];
  const W = opts.warmupS ?? clamp(round30(0.15 * T), 180, 300), C = clamp(round30(0.10 * T), 120, 300);
  const M = T - W - C;
  const warmup: Phase[] = W > 0 ? [{ kind: 'warmup', dur: W }] : [];

  if (format === 'steady') {
    if (M < MIN_STEADY_BLOCK_S) throw new Error(MESSAGES.tooShort);
    const kmh = (k: Kind) => (k === 'steady' ? averageSpeed(level, activity) : sp.vE);
    return toPlan([...warmup, { kind: 'steady', dur: M }, { kind: 'cooldown', dur: C }], T, seed, 0, kmh);
  }

  const n = Math.floor(M / K), L = M - n * K;
  if (n < 1) throw new Error(MESSAGES.tooShort);
  const r = rng(seed), tpl = Math.floor(r() * 4), s = r() < 0.5 ? 1 : -1;
  const v = Array.from({ length: n }, (_, i) => s * templateStep(tpl, i, n));
  let sum = v.reduce((a, b) => a + b, 0); // force Σδ = 0 so total acceleration time is constant
  while (sum > 0) { v[v.lastIndexOf(1)] = 0; sum--; }
  while (sum < 0) { v[v.lastIndexOf(-1)] = 0; sum++; }

  const phases: Phase[] = [...warmup];
  for (const d of v) {
    const a = p.A + VARIATION_STEP_S * d;
    phases.push({ kind: 'accel', dur: a }, { kind: 'recover', dur: K - a });
  }
  phases.push({ kind: 'cooldown', dur: C + L });
  return toPlan(phases, T, seed, n, (k) => (k === 'accel' ? sp.vA : sp.vE));
}

export function durationForDistance(km: number, level: Level, activity: Activity = 'run'): number {
  if (km < 1) throw new Error(MESSAGES.minDistance);
  return Math.max(600, Math.ceil(km * 3600 / averageSpeed(level, activity) / 60) * 60);
}

/** Session length in seconds for a goal: minutes for a time goal, estimated from speed for a distance goal. */
export const totalSecondsFor = (mode: 'time' | 'dist', value: number, level: Level, activity: Activity = 'run'): number =>
  mode === 'time' ? value * 60 : durationForDistance(value, level, activity);

/** Tries seed, seed+1… until a signature absent from `recent` is found (max 50 attempts).
 *  A steady session has no variants, so it is never "already seen". */
export function pickPlan(T: number, level: Level, seed: number, recent: string[], opts: PlanOptions = {}): { plan: Plan; repeated: boolean } {
  if (opts.format === 'steady') return { plan: buildPlan(T, level, seed, opts), repeated: false };
  let first: Plan | null = null;
  for (let k = 0; k < 50; k++) {
    const p = buildPlan(T, level, seed + k, opts);
    first ??= p;
    if (!recent.includes(p.sig)) return { plan: p, repeated: false };
  }
  return { plan: first!, repeated: true };
}
