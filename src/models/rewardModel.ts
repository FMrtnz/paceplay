import {
  BADGE_CHALLENGES_TARGET, BADGE_DISTANCE_TARGET_M, XP_ALL_RECOVER_BONUS, XP_COMPLETED,
  XP_MAX_CHALLENGES, XP_PER_CHALLENGE, XP_WEEK3_BONUS,
} from './constants';
import type { RunResult } from './progressModel';

/** Never subtracts points. An interrupted run still earns a share of the base XP. */
export function computeXp(o: { completed: boolean; progress: number; challenges: number; allRecover: boolean; week3: boolean }): number {
  const base = o.completed ? XP_COMPLETED : Math.floor(XP_COMPLETED * o.progress);
  return base
    + XP_PER_CHALLENGE * Math.min(o.challenges, XP_MAX_CHALLENGES)
    + (o.completed && o.allRecover ? XP_ALL_RECOVER_BONUS : 0)
    + (o.week3 ? XP_WEEK3_BONUS : 0);
}

/** Badge ids earned so far, from the full history. */
export function earnedBadges(history: RunResult[], week3Ever: boolean): string[] {
  const b: string[] = [];
  if (history.some((r) => r.completed)) b.push('first');
  if (week3Ever) b.push('w3');
  if (history.reduce((a, r) => a + r.challenges, 0) >= BADGE_CHALLENGES_TARGET) b.push('d10');
  if (history.reduce((a, r) => a + r.distM, 0) >= BADGE_DISTANCE_TARGET_M) b.push('k5');
  return b;
}
