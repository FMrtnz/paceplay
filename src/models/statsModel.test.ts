import { describe, it, expect } from 'vitest';
import type { RunResult } from './progressModel';
import { calendarGrid, groupByMonth, startOfWeek, weekStreak, weeklyTotals } from './statsModel';

// Dates are built in local time so the tests do not depend on the machine's time zone.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 11, 1); // a Sunday
const run = (date: number, distM: number, completed = true, elapsed = 1800): RunResult => ({
  date, mode: 'time', level: 'beginner', completed, elapsed, distM, source: 'GPS', challenges: 3, xp: 50, sig: 's' + date, P: 1,
});

describe('weeks', () => {
  it('weeks start on Monday', () => {
    expect(startOfWeek(NOW)).toBe(at(2026, 10, 26, 0));
    expect(startOfWeek(at(2026, 10, 26, 0))).toBe(at(2026, 10, 26, 0));
    expect(startOfWeek(at(2026, 10, 27))).toBe(at(2026, 10, 26, 0));
  });
  it('weeklyTotals: distance and pace per week, current week last', () => {
    const w = weeklyTotals([run(at(2026, 10, 27), 5000, true, 1800), run(at(2026, 10, 20), 3000)], NOW, 4);
    expect(w).toHaveLength(4);
    expect(w[3].distM).toBe(5000);
    expect(w[3].paceMinKm).toBe(6); // 1800 s over 5 km
    expect(w[2].distM).toBe(3000);
    expect(w[1].matches).toBe(0);
    expect(w[1].paceMinKm).toBe(null);
  });
});

describe('calendar', () => {
  it('grid of weeks × 7 days, Monday first, with distance per day and future days flagged', () => {
    const g = calendarGrid([run(at(2026, 10, 27), 5000), run(at(2026, 10, 27, 18), 1000)], NOW, 3);
    expect(g).toHaveLength(3);
    expect(g[2]).toHaveLength(7);
    expect(g[2][1].distM).toBe(6000); // Tuesday Oct 27
    expect(g[2][1].level).toBe(3);
    expect(g[2][0].level).toBe(0);
    expect(g[2][6].future).toBe(false); // Sunday Nov 1 = today
    expect(g[0][0].date).toBe(at(2026, 10, 12, 0));
  });
  it('streak counts consecutive weeks with a completed match', () => {
    const h = [run(at(2026, 10, 27), 1), run(at(2026, 10, 20), 1), run(at(2026, 10, 5), 1)];
    expect(weekStreak(h, NOW)).toBe(2);
    expect(weekStreak([run(at(2026, 10, 20), 1)], NOW)).toBe(1); // current week still empty
    expect(weekStreak([run(at(2026, 10, 20), 1, false)], NOW)).toBe(0); // interrupted does not count
    expect(weekStreak([], NOW)).toBe(0);
  });
});

describe('groupByMonth', () => {
  it('groups newest first with totals', () => {
    const g = groupByMonth([run(at(2026, 10, 3), 1000), run(at(2026, 11, 1), 2000), run(at(2026, 10, 28), 3000)]);
    expect(g.map((x) => x.key)).toEqual(['2026-11', '2026-10']);
    expect(g[0].label).toBe('November 2026');
    expect(g[1].runs.map((r) => r.date)).toEqual([at(2026, 10, 28), at(2026, 10, 3)]);
    expect(g[1].distM).toBe(4000);
  });
});
