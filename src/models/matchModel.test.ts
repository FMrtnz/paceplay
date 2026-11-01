import { describe, it, expect } from 'vitest';
import { describeMatch } from './matchModel';
import { buildShareCard } from './shareCardModel';
import type { RunResult } from './progressModel';

const base: RunResult = { date: 1_700_000_000_000, mode: 'time', level: 'intermediate', completed: true, elapsed: 1500, distM: 5000, source: 'GPS', challenges: 5, xp: 120, sig: 's', P: 1 };
const detailed: RunResult = {
  ...base,
  detail: {
    splits: [300, 295, 305, 290, 310], partial: { distM: 450, seconds: 140 },
    phases: [
      { kind: 'warmup', seconds: 180, distM: 500 }, { kind: 'accel', seconds: 45, distM: 180 }, { kind: 'recover', seconds: 75, distM: 160 },
      { kind: 'accel', seconds: 45, distM: 200 }, { kind: 'cooldown', seconds: 600, distM: 1700 },
    ],
  },
};

describe('describeMatch', () => {
  it('old matches (no detail) still describe: average pace only', () => {
    const v = describeMatch(base);
    expect(v.hasDetail).toBe(false);
    expect(v.avgPaceMinKm).toBe(5); // 1500 s over 5 km
    expect(v.kmRows).toEqual([]);
  });
  it('kilometre rows, with the partial km last', () => {
    const v = describeMatch(detailed);
    expect(v.kmRows).toHaveLength(6);
    expect(v.kmRows[0]).toEqual({ index: 1, distM: 1000, seconds: 300, paceMinKm: 5 });
    expect(v.kmRows[5].index).toBe(null);
    expect(v.kmRows[5].distM).toBe(450);
  });
  it('phase rows flag short periods as approximate; kind averages and best speed-up', () => {
    const v = describeMatch(detailed);
    expect(v.phaseRows[0].approx).toBe(false);
    expect(v.phaseRows[1].approx).toBe(true); // 45 s
    expect(v.speedUpAvgMinKm).toBeCloseTo(90 / 60 / 0.38, 3);
    expect(v.bestSpeedUpMinKm).toBeCloseTo(45 / 60 / 0.2, 3);
    expect(v.recoverAvgMinKm).toBeCloseTo(75 / 60 / 0.16, 3);
  });
});

describe('share card texts', () => {
  it('prints the KPIs', () => {
    const c = buildShareCard(detailed);
    expect(c.headline).toBe('Snitch caught!');
    expect(c.rank).toBe('Chaser');
    expect(c.distanceKm).toBe('5.00');
    expect(c.kpis).toEqual([
      { label: 'TIME', value: '25:00' }, { label: 'AVG PACE', value: '5:00 /km' },
      { label: 'SPEED-UPS', value: '5' }, { label: 'XP', value: '+120' },
    ]);
    expect(c.highlight).toBe('Best speed-up ≈ 3:45 /km');
  });
  it('interrupted match, no detail → no highlight', () => {
    const c = buildShareCard({ ...base, completed: false });
    expect(c.headline).toBe('Mission interrupted');
    expect(c.highlight).toBe('');
  });
});
