import { describe, it, expect } from 'vitest';
import { averagePaceMinKm, isApproximatePace, paceMinKm } from './paceModel';

describe('pace', () => {
  it('computes min/km, null when the distance is too small', () => {
    expect(paceMinKm(300, 1000)).toBe(5);
    expect(paceMinKm(60, 200)).toBe(5);
    expect(paceMinKm(60, 10)).toBe(null);
    expect(paceMinKm(0, 1000)).toBe(null);
  });
  it('average pace needs 50 m', () => {
    expect(averagePaceMinKm(300, 40)).toBe(null);
    expect(averagePaceMinKm(600, 2000)).toBe(5);
  });
  it('short periods are approximate', () => {
    expect(isApproximatePace(45)).toBe(true);
    expect(isApproximatePace(60)).toBe(false);
  });
});
