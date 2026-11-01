import { describe, it, expect } from 'vitest';
import { bestPhasePaceMinKm, buildDetail, emptyLog, kindPaceMinKm, phasePaceMinKm, updateLog } from './detailModel';
import { buildPlan } from './planModel';

const plan = buildPlan(1200, 'beginner', 0);
const SPEED = 3; // m/s, constant

/** Runs the log like the controller does: a tick every 250 ms at constant speed. */
function simulate(seconds: number, speed = SPEED) {
  let log = emptyLog(plan);
  for (let t = 0.25; t <= seconds + 1e-9; t += 0.25) log = updateLog(log, plan, t, speed * t);
  return log;
}

describe('run log', () => {
  it('records a km mark every 1000/speed seconds', () => {
    const log = simulate(1000); // 3000 m
    expect(log.kmMarks).toHaveLength(3);
    log.kmMarks.forEach((m, i) => expect(Math.abs(m - (i + 1) * (1000 / SPEED))).toBeLessThan(0.3));
  });
  it('splits the distance between phases', () => {
    const log = simulate(1200);
    expect(Math.abs(log.phaseDistM.reduce((a, b) => a + b, 0) - 3600)).toBeLessThan(1);
    expect(Math.abs(log.phaseDistM[0] - SPEED * plan.phases[0].dur)).toBeLessThan(2);
    expect(Math.abs(log.phaseDistM[1] - SPEED * plan.phases[1].dur)).toBeLessThan(2);
  });
  it('interpolates when one update crosses several km', () => {
    const log = updateLog(emptyLog(plan), plan, 600, 2500);
    expect(log.kmMarks.map((m) => Math.round(m))).toEqual([240, 480]);
  });
  it('ignores time passing without distance, but keeps the clock', () => {
    const a = updateLog(emptyLog(plan), plan, 10, 30);
    const b = updateLog(a, plan, 20, 30);
    expect(b.phaseDistM).toEqual(a.phaseDistM);
    expect(b.lastElapsed).toBe(20);
  });
});

describe('buildDetail', () => {
  it('gives km splits, a partial km and per-phase figures', () => {
    const log = simulate(1000);
    const d = buildDetail(plan, log, 1000, 3000 + 450);
    expect(d.splits).toHaveLength(3);
    d.splits.forEach((s) => expect(Math.abs(s - 333.3)).toBeLessThan(0.5));
    expect(d.partial?.distM).toBe(450);
    expect(d.phases.reduce((a, p) => a + p.seconds, 0)).toBe(1000);
    expect(d.phases[0].kind).toBe('warmup');
  });
  it('omits a tiny remainder and phases never reached', () => {
    const d = buildDetail(plan, simulate(340), 340, 1020); // 1 full km + 20 m
    expect(d.splits).toHaveLength(1);
    expect(d.partial).toBe(null);
    expect(d.phases.length).toBeLessThan(plan.phases.length);
    expect(d.phases[d.phases.length - 1].seconds).toBeGreaterThan(0);
  });
  it('time beyond the plan goes to the last phase', () => {
    const d = buildDetail(plan, simulate(1200), 1500, 3600);
    expect(d.phases[d.phases.length - 1].seconds).toBe(plan.phases[plan.phases.length - 1].dur + 300);
  });
  it('kind averages and best phase', () => {
    const d = buildDetail(plan, simulate(1200), 1200, 3600);
    expect(Math.abs((kindPaceMinKm(d, 'accel') ?? 0) - 1000 / SPEED / 60)).toBeLessThan(0.02);
    expect(Math.abs((bestPhasePaceMinKm(d, 'accel') ?? 0) - 1000 / SPEED / 60)).toBeLessThan(0.1);
    expect(kindPaceMinKm({ splits: [], partial: null, phases: [] }, 'accel')).toBe(null);
  });
  it('phasePace for the voice prompt', () => {
    const log = simulate(1200);
    expect(Math.abs((phasePaceMinKm(plan, log, 1) ?? 0) - 1000 / SPEED / 60)).toBeLessThan(0.02);
  });
});
