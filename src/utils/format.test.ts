import { describe, it, expect } from 'vitest';
import { formatClock, formatKm } from './format';

describe('format', () => {
  it('formatClock rounds up and never goes negative', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(0.2)).toBe('0:01');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(-5)).toBe('0:00');
  });
  it('formatKm converts meters', () => {
    expect(formatKm(1234)).toBe('1.23');
    expect(formatKm(1234, 1)).toBe('1.2');
  });
});
