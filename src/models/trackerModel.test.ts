import { describe, it, expect } from 'vitest';
import { Tracker } from './trackerModel';

const fix = (lat: number, t: number, acc = 5) => ({ lat, lon: 2, acc, t });

describe('gps tracker', () => {
  it('rejects poor accuracy, jumps and repeated positions', () => {
    const t = new Tracker();
    t.add(fix(48, 0));
    expect(t.add(fix(48.0001, 1000, 50))).toBe(0);
    expect(t.add(fix(48.01, 2000))).toBe(0);
    expect(t.add(fix(48, 3000))).toBe(0);
    expect(t.dist).toBe(0);
  });
  it('accumulates real progress', () => {
    const t = new Tracker();
    t.add(fix(48, 0));
    t.add(fix(48.00003, 10000));
    expect(t.dist).toBeGreaterThan(3);
  });
  it('smoothed pace over the last ~25 s, null when stale or stopped', () => {
    const t = new Tracker();
    // 4 m/s for 40 s: 1000 / 4 / 60 = 4.1667 min/km
    for (let s = 0; s <= 40; s++) t.add({ lat: 48 + (4 * s) / 111320, lon: 2, acc: 5, t: s * 1000 });
    expect(Math.abs((t.recentPaceMinKm(40000) ?? 0) - 4.1667)).toBeLessThan(0.05);
    expect(t.recentPaceMinKm(40000 + 11000)).toBe(null); // no fix for 11 s
    expect(new Tracker().recentPaceMinKm(0)).toBe(null);
  });
  it('the speed limit depends on the activity', () => {
    // 15 m/s is a jump for a runner but normal for a cyclist
    const fast = (tr: Tracker) => { tr.add({ lat: 48, lon: 2, acc: 5, t: 0 }); return tr.add({ lat: 48 + 15 / 111320, lon: 2, acc: 5, t: 1000 }); };
    expect(fast(new Tracker())).toBe(0);
    expect(fast(new Tracker(0, 20))).toBeGreaterThan(14);
  });
});
