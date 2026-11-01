import { describe, it, expect } from 'vitest';
import { formatClock, formatKm, formatPace, spokenPace } from './format';

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
  it('formatPace', () => {
    expect(formatPace(5.7)).toBe('5:42');
    expect(formatPace(6)).toBe('6:00');
    expect(formatPace(5.999)).toBe('6:00');
    expect(formatPace(null)).toBe('—');
    expect(formatPace(Infinity)).toBe('—');
    expect(formatPace(200)).toBe('—');
  });
  it('spokenPace', () => {
    expect(spokenPace(5.7)).toBe('5 minutes 42 seconds');
    expect(spokenPace(6)).toBe('6 minutes');
    expect(spokenPace(4 + 1 / 60)).toBe('4 minutes 1 second');
  });
});
