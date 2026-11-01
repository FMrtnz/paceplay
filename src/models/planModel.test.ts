import { describe, it, expect } from 'vitest';
import { buildPlan, pickPlan, durationForDistance, totalSecondsFor } from './planModel';
import type { PlanOptions } from './planModel';
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

const sum = (p: { phases: { dur: number }[] }) => p.phases.reduce((a, x) => a + x.dur, 0);

describe('steady format', () => {
  it('warm-up, one steady block, cool-down; durations add up for every level and length', () => {
    for (const l of levels) for (let T = 600; T <= 7200; T += 60) {
      const p = buildPlan(T, l, 3, { format: 'steady' });
      expect(p.phases.map((x) => x.kind)).toEqual(['warmup', 'steady', 'cooldown']);
      expect(sum(p)).toBe(T);
      expect(p.n).toBe(0);
    }
  });
  it('is the same whatever the seed, and never reported as already seen', () => {
    const o: PlanOptions = { format: 'steady' };
    expect(buildPlan(1800, 'advanced', 1, o)).toEqual({ ...buildPlan(1800, 'advanced', 1, o), seed: 1 });
    expect(buildPlan(1800, 'advanced', 1, o).phases).toEqual(buildPlan(1800, 'advanced', 99, o).phases);
    const p = buildPlan(1800, 'advanced', 1, o);
    expect(pickPlan(1800, 'advanced', 1, [p.sig], o).repeated).toBe(false);
  });
  it('distance estimate equals the intervals estimate for the same warm-up and cool-down', () => {
    const km = (d: number, o: PlanOptions) => buildPlan(1800, 'intermediate', 0, o).distKm - d;
    expect(Math.abs(km(0, { format: 'steady' }) - km(0, {}))).toBeLessThan(0.15);
  });
});

describe('warm-up option', () => {
  it('uses the chosen length; 0 removes the phase; null keeps the automatic length', () => {
    expect(buildPlan(1800, 'beginner', 0, { warmupS: 600 }).phases[0]).toEqual({ kind: 'warmup', dur: 600 });
    const none = buildPlan(1800, 'beginner', 0, { warmupS: 0 });
    expect(none.phases[0].kind).toBe('accel');
    expect(sum(none)).toBe(1800);
    expect(buildPlan(1800, 'beginner', 0, { warmupS: null })).toEqual(buildPlan(1800, 'beginner', 0));
    expect(buildPlan(1800, 'beginner', 0, { format: 'steady', warmupS: 0 }).phases[0].kind).toBe('steady');
  });
  it('totals stay exact with any warm-up, and a warm-up that leaves no room is rejected', () => {
    for (const w of [0, 180, 300, 600, 900]) for (const f of ['intervals', 'steady'] as const)
      expect(sum(buildPlan(2400, 'intermediate', 2, { warmupS: w, format: f }))).toBe(2400);
    expect(() => buildPlan(1200, 'advanced', 0, { warmupS: 1050 })).toThrow();
    expect(() => buildPlan(1200, 'advanced', 0, { warmupS: 1050, format: 'steady' })).toThrow();
  });
});

describe('bike', () => {
  it('same phases as a run, but a longer distance for the same time', () => {
    const run = buildPlan(3600, 'intermediate', 4), bike = buildPlan(3600, 'intermediate', 4, { activity: 'bike' });
    expect(bike.phases).toEqual(run.phases);
    expect(bike.distKm).toBeGreaterThan(run.distKm * 2);
  });
  it('distance goals give shorter sessions on a bike', () => {
    expect(durationForDistance(20, 'intermediate', 'bike')).toBeLessThan(durationForDistance(20, 'intermediate', 'run'));
    expect(totalSecondsFor('dist', 30, 'beginner', 'bike')).toBe(durationForDistance(30, 'beginner', 'bike'));
    expect(totalSecondsFor('time', 45, 'beginner', 'bike')).toBe(2700);
  });
});
