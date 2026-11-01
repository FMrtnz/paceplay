import { useState } from 'react';
import { applyRun, latestHistory, recentSignatures } from '../models/progressModel';
import type { Progress } from '../models/progressModel';
import type { Plan } from '../models/planModel';
import type { RunConfig, RunOutcome } from '../models/sessionModel';
import { loadProgress, saveProgress } from '../models/storage';

/** Owns the player's progress (XP, history, badges) and its persistence. */
export function useProgressController() {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  /** Applies a finished run, saves it, and returns what the result page needs. */
  function recordRun(outcome: RunOutcome, config: RunConfig, plan: Plan) {
    const { next, result, newBadges } = applyRun(progress, outcome, config, plan, Date.now());
    saveProgress(next);
    setProgress(next);
    return { result, newBadges };
  }

  return {
    summary: { xp: progress.xp, sessionCount: progress.history.length, badgeCount: progress.badges.length },
    earnedBadgeIds: progress.badges,
    recentRuns: latestHistory(progress.history),
    recentSigs: recentSignatures(progress.history),
    nextSeed: progress.seed,
    lastLevel: progress.level,
    recordRun,
  };
}
