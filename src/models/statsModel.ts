import { averagePaceMinKm } from './paceModel';
import type { RunResult } from './progressModel';

export interface WeekStat { weekStart: number; distM: number; matches: number; paceMinKm: number | null }
export interface DayCell { date: number; distM: number; level: 0 | 1 | 2 | 3 | 4; future: boolean }
export interface MonthGroup { key: string; label: string; distM: number; runs: RunResult[] }

/** Heatmap intensity of a day: 0 = rest day, 4 = 10 km or more. */
const heatLevel = (distM: number): DayCell['level'] =>
  distM <= 0 ? 0 : distM < 3000 ? 1 : distM < 6000 ? 2 : distM < 10000 ? 3 : 4;

const addDays = (ts: number, n: number) => { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); };
export const startOfDay = (ts: number) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** Monday 00:00 (local time) of the week containing `ts`. */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** Distance and average pace per week, oldest first, ending with the current week. */
export function weeklyTotals(history: RunResult[], now: number, weeks = 12): WeekStat[] {
  const thisWeek = startOfWeek(now);
  const stats: WeekStat[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const from = addDays(thisWeek, -7 * i), to = addDays(from, 7);
    const runs = history.filter((r) => r.date >= from && r.date < to);
    const withDistance = runs.filter((r) => r.distM > 0);
    stats.push({
      weekStart: from, matches: runs.length, distM: runs.reduce((a, r) => a + r.distM, 0),
      paceMinKm: averagePaceMinKm(withDistance.reduce((a, r) => a + r.elapsed, 0), withDistance.reduce((a, r) => a + r.distM, 0)),
    });
  }
  return stats;
}

/** Calendar heatmap: `weeks` columns (oldest first) of 7 days (Monday → Sunday). */
export function calendarGrid(history: RunResult[], now: number, weeks = 16): DayCell[][] {
  const perDay = new Map<number, number>();
  for (const r of history) perDay.set(startOfDay(r.date), (perDay.get(startOfDay(r.date)) ?? 0) + r.distM);
  const first = addDays(startOfWeek(now), -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(first, w * 7 + d);
      const distM = perDay.get(date) ?? 0;
      return { date, distM, level: heatLevel(distM), future: date > now };
    }));
}

/** Consecutive weeks with at least one completed match. The current week may still be empty. */
export function weekStreak(history: RunResult[], now: number): number {
  const active = new Set(history.filter((r) => r.completed).map((r) => startOfWeek(r.date)));
  let week = startOfWeek(now);
  if (!active.has(week)) week = addDays(week, -7);
  let streak = 0;
  while (active.has(week)) { streak++; week = addDays(week, -7); }
  return streak;
}

/** All matches grouped by calendar month, newest first. */
export function groupByMonth(history: RunResult[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const r of [...history].sort((a, b) => b.date - a.date)) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const g = groups.get(key) ?? { key, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), distM: 0, runs: [] };
    g.runs.push(r);
    g.distM += r.distM;
    groups.set(key, g);
  }
  return [...groups.values()];
}
