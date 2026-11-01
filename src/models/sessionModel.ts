import type { Level } from './constants';
import type { Plan } from './planModel';

export interface Clock { startedAt: number; pausedMs: number; pausedAt: number | null }
export interface RunConfig { mode: 'time' | 'dist'; val: number; level: Level; sim: boolean }
/** Session saved on every tick so it can resume after a page reload. */
export interface ActiveSession { plan: Plan; cfg: RunConfig; clock: Clock; dist: number }

/** Raw outcome of a run, before XP and badges are applied. */
export interface RunOutcome {
  completed: boolean;
  elapsed: number;
  distM: number;
  challenges: number;
  progress: number; // 0..1
  source: string;
}

/** Elapsed time in seconds, computed from timestamps only. */
export const elapsedS = (c: Clock, now: number) => Math.max(0, ((c.pausedAt ?? now) - c.startedAt - c.pausedMs) / 1000);

/** Phase index and seconds left in it, for an elapsed time `e`. */
export function locate(plan: Plan, e: number) {
  let acc = 0;
  for (let i = 0; i < plan.phases.length; i++) {
    const d = plan.phases[i].dur;
    if (e < acc + d) return { i, left: acc + d - e };
    acc += d;
  }
  return { i: plan.phases.length, left: 0 };
}

export const pause = (c: Clock, now: number): Clock => (c.pausedAt ? c : { ...c, pausedAt: now });
export const resume = (c: Clock, now: number): Clock =>
  c.pausedAt ? { ...c, pausedMs: c.pausedMs + now - c.pausedAt, pausedAt: null } : c;

export const createClock = (now: number): Clock => ({ startedAt: now, pausedMs: 0, pausedAt: null });

/** Target distance in meters, or 0 when the goal is a duration. */
export const goalDistanceM = (cfg: RunConfig) => (cfg.mode === 'dist' ? cfg.val * 1000 : 0);

/** Share of the goal reached (0..1): the furthest of time progress and distance progress. */
export const computeProgress = (elapsed: number, totalS: number, distM: number, targetM: number) =>
  Math.min(1, Math.max(elapsed / totalS, targetM ? distM / targetM : 0));

/** A distance goal ends on distance; otherwise the session ends when the plan's time is over. */
export const isGoalReached = (plan: Plan, elapsed: number, distM: number, targetM: number) =>
  targetM ? distM >= targetM : elapsed >= plan.total;

/** Challenges = accelerations fully completed within `elapsed` seconds. */
export function countCompletedAccelerations(plan: Plan, elapsed: number): number {
  let cumul = 0;
  let challenges = 0;
  for (const p of plan.phases) {
    cumul += p.dur;
    if (p.kind === 'accel' && cumul <= elapsed) challenges++;
  }
  return challenges;
}
