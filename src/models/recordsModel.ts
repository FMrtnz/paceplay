import { paceMinKm } from './paceModel';
import type { RunResult } from './progressModel';
import { startOfWeek } from './statsModel';

export interface Best { value: number; date: number }
export interface Records {
  fastestKmMinKm: Best | null; // pace, lower is better
  fastestSpeedUpMinKm: Best | null;
  longestRunM: Best | null;
  mostSpeedUps: Best | null;
  bestWeekM: Best | null; // date = Monday of that week
}

/** Keeps the best candidate: smallest when `lowest`, otherwise largest. */
function best(candidates: Best[], lowest: boolean): Best | null {
  let top: Best | null = null;
  for (const c of candidates) if (!top || (lowest ? c.value < top.value : c.value > top.value)) top = c;
  return top;
}

/** Personal records computed from the whole history. Matches without detail only count for totals. */
export function computeRecords(history: RunResult[]): Records {
  const kms: Best[] = [], speedUps: Best[] = [];
  for (const r of history) {
    r.detail?.splits.forEach((s) => kms.push({ value: s / 60, date: r.date }));
    r.detail?.phases.filter((p) => p.kind === 'accel').forEach((p) => {
      const pace = paceMinKm(p.seconds, p.distM);
      if (pace !== null) speedUps.push({ value: pace, date: r.date });
    });
  }
  const perWeek = new Map<number, number>();
  for (const r of history) perWeek.set(startOfWeek(r.date), (perWeek.get(startOfWeek(r.date)) ?? 0) + r.distM);

  return {
    fastestKmMinKm: best(kms, true),
    fastestSpeedUpMinKm: best(speedUps, true),
    longestRunM: best(history.filter((r) => r.distM > 0).map((r) => ({ value: r.distM, date: r.date })), false),
    mostSpeedUps: best(history.filter((r) => r.challenges > 0).map((r) => ({ value: r.challenges, date: r.date })), false),
    bestWeekM: best([...perWeek].filter(([, m]) => m > 0).map(([week, m]) => ({ value: m, date: week })), false),
  };
}
