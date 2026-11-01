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
});
