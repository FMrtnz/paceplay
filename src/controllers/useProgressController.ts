import { useMemo, useState } from 'react';
import { computeRecords } from '../models/recordsModel';
import { applyRun, recentSignatures, removeRun } from '../models/progressModel';
import type { Progress } from '../models/progressModel';
import { calendarGrid, groupByMonth, weekStreak, weeklyTotals } from '../models/statsModel';
import type { Activity } from '../models/constants';
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
    // Records, trends and calendar are kept apart per activity: 5 km on foot and 40 km by bike do not compare
    const forActivity = (a: Activity) => {
      const own = h.filter((r) => r.activity === a);
      return { records: computeRecords(own), weekly: weeklyTotals(own, now), calendar: calendarGrid(own, now, 16, a) };
    };
    return {
      monthGroups: groupByMonth(h), streak: weekStreak(h, now),
      statsByActivity: { run: forActivity('run'), bike: forActivity('bike') },
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
