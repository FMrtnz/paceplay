import { describe, it, expect } from 'vitest';
import { buildPlan, pickPlan, durationForDistance, totalSecondsFor } from './planModel';
import { LEVELS } from './constants';
import type { Level } from './constants';

const levels = Object.keys(LEVELS) as Level[];

describe('plan', () => {
  it('phase durations sum exactly (all levels, durations, seeds)', () => {
    for (const l of levels) for (let T = 600; T <= 3600; T += 60) for (let s = 0; s < 30; s++)
      expect(buildPlan(T, l, s).phases.reduce((a, x) => a + x.dur, 0)).toBe(T);
  });
  it('Σδ=0: total acceleration time is constant', () => {
    for (const l of levels) for (let s = 0; s < 100; s++) {
      const p = buildPlan(1800, l, s);
      expect(p.phases.filter((x) => x.kind === 'accel').reduce((a, x) => a + x.dur, 0)).toBe(p.n * LEVELS[l].A);
    }
  });
  it('example: 20 min beginner', () => {
    const p = buildPlan(1200, 'beginner', 0);
    expect(p.phases[0].dur).toBe(180);
    expect(p.n).toBe(7);
    expect(p.phases[p.phases.length - 1].dur).toBe(180);
  });
  it('example: 3 km intermediate → 1140 s', () => {
    expect(durationForDistance(3, 'intermediate')).toBe(1140);
    expect(buildPlan(1140, 'intermediate').distKm).toBeCloseTo(3.03, 2);
  });
  it('deterministic, rejects <10 min', () => {
    expect(buildPlan(1200, 'advanced', 5)).toEqual(buildPlan(1200, 'advanced', 5));
    expect(() => buildPlan(540, 'beginner')).toThrow();
  });
  it('anti-repetition', () => {
    const a = buildPlan(1800, 'advanced', 1);
    const r = pickPlan(1800, 'advanced', 1, [a.sig]);
    expect(r.plan.sig).not.toBe(a.sig);
  });
  it('totalSecondsFor: minutes for time goals, pace estimate for distance goals', () => {
    expect(totalSecondsFor('time', 20, 'beginner')).toBe(1200);
    expect(totalSecondsFor('dist', 3, 'intermediate')).toBe(1140);
  });
});
