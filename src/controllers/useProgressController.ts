import { useMemo, useState } from 'react';
import { computeRecords } from '../models/recordsModel';
import { applyRun, recentSignatures, removeRun } from '../models/progressModel';
import type { Progress } from '../models/progressModel';
import { calendarGrid, groupByMonth, weekStreak, weeklyTotals } from '../models/statsModel';
import type { Plan } from '../models/planModel';
import type { RunConfig, RunOutcome } from '../models/sessionModel';
import { loadProgress, saveProgress } from '../models/storage';

/** Owns the player's progress (XP, history, trophies), its persistence and the figures built from it. */
export function useProgressController() {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  // Recomputed only when the history changes
  const stats = useMemo(() => {
    const now = Date.now();
    const h = progress.history;
    return {
      monthGroups: groupByMonth(h), records: computeRecords(h),
      weekly: weeklyTotals(h, now), calendar: calendarGrid(h, now), streak: weekStreak(h, now),
    };
  }, [progress.history]);

  /** Applies a finished run, saves it, and returns what the result page needs. */
  function recordRun(outcome: RunOutcome, config: RunConfig, plan: Plan) {
    const { next, result, newBadges } = applyRun(progress, outcome, config, plan, Date.now());
    saveProgress(next);
    setProgress(next);
    return { result, newBadges };
  }

  /** Deletes one match from the history and saves. */
  function deleteRun(date: number) {
    const next = removeRun(progress, date);
    saveProgress(next);
    setProgress(next);
  }

  return {
    summary: { xp: progress.xp, matchCount: progress.history.length, trophyCount: progress.badges.length, streak: stats.streak },
    earnedTrophyIds: progress.badges,
    ...stats,
    findMatch: (date: number | null) => (date === null ? null : progress.history.find((r) => r.date === date) ?? null),
    recentSigs: recentSignatures(progress.history),
    nextSeed: progress.seed,
    lastLevel: progress.level,
    recordRun,
    deleteRun,
  };
}
