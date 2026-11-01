import { describe, it, expect } from 'vitest';
import { computeXp } from './rewardModel';

describe('rewards', () => {
  it('XP never negative, interrupted runs still rewarded', () => {
    expect(computeXp({ completed: false, progress: 0, challenges: 0, allRecover: false, week3: false })).toBe(0);
    expect(computeXp({ completed: false, progress: 0.5, challenges: 2, allRecover: false, week3: false })).toBe(45);
  });
});
