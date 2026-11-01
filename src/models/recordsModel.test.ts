import { describe, it, expect } from 'vitest';
import { computeRecords } from './recordsModel';
import type { RunResult } from './progressModel';

const at = (d: number) => new Date(2026, 9, d, 12).getTime();
const run = (date: number, over: Partial<RunResult>): RunResult => ({
  date, mode: 'time', level: 'beginner', activity: 'run', format: 'intervals', completed: true, elapsed: 1800, distM: 4000, source: 'GPS', challenges: 4, xp: 50, sig: 's' + date, P: 1, ...over,
});

describe('records', () => {
  it('empty history → no records', () => {
    const r = computeRecords([]);
    expect(r.fastestKmMinKm).toBe(null);
    expect(r.bestWeekM).toBe(null);
  });
  it('finds the best of each category, ignoring matches without detail for paces', () => {
    const h = [
      run(at(1), { distM: 3000, challenges: 2 }), // old match: no detail
      run(at(8), { distM: 6000, challenges: 7, detail: { splits: [330, 300, 320], partial: null, phases: [{ kind: 'accel', seconds: 60, distM: 200 }, { kind: 'accel', seconds: 60, distM: 250 }] } }),
      run(at(9), { distM: 2000, detail: { splits: [280], partial: null, phases: [] } }),
    ];
    const r = computeRecords(h);
    expect(r.fastestKmMinKm).toEqual({ value: 280 / 60, date: at(9) });
    expect(r.fastestSpeedUpMinKm?.value).toBe(4); // 60 s over 250 m
    expect(r.fastestSpeedUpMinKm?.date).toBe(at(8));
    expect(r.longestRunM).toEqual({ value: 6000, date: at(8) });
    expect(r.mostSpeedUps).toEqual({ value: 7, date: at(8) });
    expect(r.bestWeekM?.value).toBe(8000); // Oct 8 and 9 share a week
  });
});
