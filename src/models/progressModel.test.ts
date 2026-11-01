import { describe, it, expect } from 'vitest';
import { applyRun, emptyProgress, latestHistory, normalizeProgress, recentSignatures } from './progressModel';
import type { RunResult } from './progressModel';
import type { Plan } from './planModel';
import type { RunConfig, RunOutcome } from './sessionModel';

describe('normalizeProgress (legacy migration)', () => {
  it('fills defaults for an empty object', () => {
    expect(normalizeProgress({})).toEqual(emptyProgress());
  });
  it('migrates French level names and `defis` → `challenges`', () => {
    const p = normalizeProgress({
      level: 'intermediaire',
      history: [{ level: 'debutant', defis: 4 }, { level: 'avance', challenges: 2, defis: 9 }, { level: 'beginner' }],
    });
    expect(p.level).toBe('intermediate');
    expect(p.history.map((r) => r.level)).toEqual(['beginner', 'advanced', 'beginner']);
    expect(p.history.map((r) => r.challenges)).toEqual([4, 2, 0]);
  });
  it('throws on a malformed history (storage then falls back to empty)', () => {
    expect(() => normalizeProgress({ history: 'oops' })).toThrow();
  });
});

const DAY = 864e5, NOW = 1_700_000_000_000;
const plan = { sig: 'w180-a30', seed: 4 } as Plan;
const config: RunConfig = { mode: 'time', val: 20, level: 'intermediate', sim: false };
const outcome = (o: Partial<RunOutcome> = {}): RunOutcome =>
  ({ completed: true, elapsed: 1200, distM: 3000, challenges: 7, progress: 1, source: 'GPS', ...o });
const past = (daysAgo: number, completed = true): RunResult => ({
  date: NOW - daysAgo * DAY, mode: 'time', level: 'beginner', completed, elapsed: 600, distM: 0,
  source: 'GPS', challenges: 0, xp: 0, sig: 's' + daysAgo, P: 1,
});

describe('applyRun', () => {
  it('first completed run: XP, first badge, next seed, last level', () => {
    const r = applyRun(emptyProgress(), outcome(), config, plan, NOW);
    expect(r.result.xp).toBe(50 + 10 * 7 + 20);
    expect(r.next.xp).toBe(140);
    expect(r.newBadges).toEqual(['first']);
    expect(r.next.seed).toBe(5);
    expect(r.next.level).toBe('intermediate');
    expect(r.result.P).toBe(1);
    expect(r.next.history).toHaveLength(1);
  });
  it('interrupted run still earns a share of XP, no badge', () => {
    const r = applyRun(emptyProgress(), outcome({ completed: false, progress: 0.5, challenges: 2 }), config, plan, NOW);
    expect(r.result.xp).toBe(25 + 20);
    expect(r.newBadges).toEqual([]);
  });
  it('3rd completed session within 7 days gives the week bonus and the w3 badge', () => {
    const base = { ...emptyProgress(), history: [past(1), past(2)], badges: ['first'] };
    const r = applyRun(base, outcome({ challenges: 0 }), config, plan, NOW);
    expect(r.result.xp).toBe(50 + 20 + 30);
    expect(r.newBadges).toEqual(['w3']);
  });
  it('sessions older than 7 days do not count for the week bonus', () => {
    const base = { ...emptyProgress(), history: [past(8), past(9)], badges: ['first'] };
    const r = applyRun(base, outcome({ challenges: 0 }), config, plan, NOW);
    expect(r.result.xp).toBe(50 + 20);
    expect(r.newBadges).toEqual([]);
  });
});

describe('history selectors', () => {
  it('keeps the last N signatures and lists latest runs first', () => {
    const h = Array.from({ length: 30 }, (_, i) => past(30 - i));
    expect(recentSignatures(h)).toHaveLength(20);
    expect(recentSignatures(h)[19]).toBe(h[29].sig);
    expect(latestHistory(h)).toHaveLength(15);
    expect(latestHistory(h)[0]).toBe(h[29]);
  });
});
