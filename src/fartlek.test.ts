import { describe, expect, it } from 'vitest';
import { buildPlan, fartlekBlocks, phaseAt, renderTrack, totalSeconds } from './fartlek';

const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

describe('fartlek', () => {
  it('fits the requested time exactly, in 5 s steps, with sensible durations, on every draw', () => {
    for (let s = 1; s <= 300; s++) {
      for (const min of [3, 5, 10, 20]) {
        const blocks = fartlekBlocks(min * 60, seeded(s));
        expect(blocks.reduce((t, [e, r]) => t + e + r, 0)).toBe(min * 60);
        blocks.forEach(([e, r], i) => {
          expect(e % 5 === 0 && r % 5 === 0).toBe(true);
          expect(e).toBeGreaterThanOrEqual(20); expect(e).toBeLessThanOrEqual(95);
          expect(r).toBeGreaterThanOrEqual(30); expect(r).toBeLessThanOrEqual(125);
          if (i > 0) { expect(e).not.toBe(blocks[i - 1][0]); expect(r).not.toBe(blocks[i - 1][1]); }
        });
        expect(blocks[blocks.length - 1][1]).toBeLessThanOrEqual(60);
      }
    }
  });
  it('is irregular: efforts differ from one another', () => {
    const efforts = fartlekBlocks(600, seeded(7)).map(([e]) => e);
    expect(new Set(efforts).size).toBeGreaterThan(2);
  });
  it('builds warm-up, then effort/recovery, ending on a recovery', () => {
    const plan = buildPlan({ warmupMin: 20, fartlekMin: 10 }, seeded(3));
    expect(plan[0]).toEqual({ kind: 'warmup', seconds: 1200 });
    expect(plan[1].kind).toBe('intense');
    expect(plan[plan.length - 1].kind).toBe('recovery');
    expect(totalSeconds(plan)).toBe(1800);
  });
  it('finds the phase at a given time', () => {
    const plan = buildPlan({ warmupMin: 1, fartlekMin: 5 }, seeded(3));
    expect(phaseAt(plan, 0)?.phase.kind).toBe('warmup');
    expect(phaseAt(plan, 30)?.left).toBe(30);
    expect(phaseAt(plan, totalSeconds(plan))).toBeNull();
  });
  it('renders a WAV as long as the session plus a 3 s tail', () => {
    const plan = buildPlan({ warmupMin: 1, fartlekMin: 5 }, seeded(3));
    expect(renderTrack(plan).length).toBe(44 + (totalSeconds(plan) + 3) * 8000);
  });
});
