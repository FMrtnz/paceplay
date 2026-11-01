import { describe, it, expect } from 'vitest';
import { buildPlan } from './planModel';
import { computeProgress, countCompletedAccelerations, elapsedS, goalDistanceM, isGoalReached, locate, pause, resume } from './sessionModel';

describe('clock', () => {
  it('pause/resume', () => {
    let c = { startedAt: 0, pausedMs: 0, pausedAt: null as number | null };
    c = pause(c, 10000);
    expect(elapsedS(c, 50000)).toBe(10);
    c = resume(c, 50000);
    expect(elapsedS(c, 60000)).toBe(20);
  });
});

describe('run helpers', () => {
  const plan = buildPlan(1200, 'beginner', 0); // acceleration lengths vary by ±15 s
  it('counts only fully completed accelerations', () => {
    const firstEnd = plan.phases[0].dur + plan.phases[1].dur; // end of the 1st acceleration
    expect(countCompletedAccelerations(plan, 0)).toBe(0);
    expect(countCompletedAccelerations(plan, firstEnd - 1)).toBe(0);
    expect(countCompletedAccelerations(plan, firstEnd)).toBe(1);
    expect(countCompletedAccelerations(plan, 1200)).toBe(plan.n);
  });
  it('progress is the furthest of time and distance, capped at 1', () => {
    expect(computeProgress(600, 1200, 0, 0)).toBe(0.5);
    expect(computeProgress(600, 1200, 900, 1000)).toBe(0.9);
    expect(computeProgress(2000, 1200, 0, 0)).toBe(1);
  });
  it('goal: distance target ends on distance, duration goal on time', () => {
    expect(goalDistanceM({ mode: 'dist', val: 3, level: 'beginner', sim: false })).toBe(3000);
    expect(goalDistanceM({ mode: 'time', val: 20, level: 'beginner', sim: false })).toBe(0);
    expect(isGoalReached(plan, 1199, 0, 0)).toBe(false);
    expect(isGoalReached(plan, 1200, 0, 0)).toBe(true);
    expect(isGoalReached(plan, 5000, 2999, 3000)).toBe(false);
    expect(isGoalReached(plan, 0, 3000, 3000)).toBe(true);
  });
  it('locate: phase index and time left', () => {
    expect(locate(plan, 10)).toEqual({ i: 0, left: plan.phases[0].dur - 10 });
    expect(locate(plan, 1200).i).toBe(plan.phases.length);
  });
});
