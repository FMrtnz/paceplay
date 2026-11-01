import { HISTORY_PREVIEW_COUNT, RECENT_SIGNATURES_COUNT, WEEK_MS } from './constants';
import type { Level } from './constants';
import type { Plan } from './planModel';
import { computeXp, earnedBadges } from './rewardModel';
import type { RunConfig, RunOutcome } from './sessionModel';

const LEGACY_LEVELS: Record<string, Level> = { debutant: 'beginner', intermediaire: 'intermediate', avance: 'advanced' };

/** One finished (or interrupted) session. Field names are persisted: never rename them. */
export interface RunResult {
  date: number;
  mode: 'time' | 'dist';
  level: Level;
  completed: boolean;
  elapsed: number;
  distM: number;
  source: string;
  challenges: number;
  xp: number;
  sig: string;
  P: number; // progress reached (0..1)
}

/** Everything the player has accumulated. */
export interface Progress { xp: number; history: RunResult[]; badges: string[]; seed: number; level: Level }

export const emptyProgress = (): Progress => ({ xp: 0, history: [], badges: [], seed: 1, level: 'beginner' });

/**
 * Turns whatever was stored into a valid Progress and migrates data saved by earlier
 * versions (French level names, `defis` → `challenges`). Throws on malformed history:
 * the storage layer then falls back to an empty Progress.
 */
export function normalizeProgress(raw: unknown): Progress {
  const s: Progress = { ...emptyProgress(), ...(raw as object) };
  s.level = LEGACY_LEVELS[s.level as string] ?? s.level;
  s.history = s.history.map((r: any) => ({
    ...r,
    level: LEGACY_LEVELS[r.level] ?? r.level,
    challenges: r.challenges ?? r.defis ?? 0,
  }));
  return s;
}

/** Signatures of the latest plans, used by the anti-repetition rule. */
export const recentSignatures = (history: RunResult[], count = RECENT_SIGNATURES_COUNT): string[] =>
  history.slice(-count).map((r) => r.sig);

/** Most recent sessions first. */
export const latestHistory = (history: RunResult[], count = HISTORY_PREVIEW_COUNT): RunResult[] =>
  [...history].reverse().slice(0, count);

/** Completed sessions during the 7 days before `now`. */
export const completedThisWeek = (history: RunResult[], now: number): number =>
  history.filter((r) => r.completed && now - r.date < WEEK_MS).length;

/**
 * Applies a finished run to the progress: XP, badges, seed for the next plan.
 * Pure: the caller provides `now` and persists `next`.
 */
export function applyRun(progress: Progress, outcome: RunOutcome, config: RunConfig, plan: Plan, now: number) {
  // The 3rd completed session of the week gives a one-time bonus and the 'w3' badge
  const week3 = outcome.completed && completedThisWeek(progress.history, now) + 1 === 3;
  const xp = computeXp({ ...outcome, allRecover: outcome.completed, week3 });

  const result: RunResult = {
    date: now, mode: config.mode, level: config.level, completed: outcome.completed,
    elapsed: outcome.elapsed, distM: outcome.distM, source: outcome.source, challenges: outcome.challenges,
    xp, sig: plan.sig, P: outcome.progress,
  };
  const history = [...progress.history, result];
  const badges = earnedBadges(history, week3 || progress.badges.includes('w3'));
  const next: Progress = { ...progress, xp: progress.xp + xp, history, badges, seed: plan.seed + 1, level: config.level };
  return { next, result, newBadges: badges.filter((b) => !progress.badges.includes(b)) };
}
