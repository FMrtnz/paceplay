import { MIN_PARTIAL_KM_M } from './constants';
import type { Kind } from './constants';
import { paceMinKm } from './paceModel';
import type { Plan } from './planModel';
import { locate } from './sessionModel';

/** Live recording of a run, saved with the active session so it survives a reload. */
export interface RunLog {
  kmMarks: number[]; // elapsed seconds at which each full km was reached
  phaseDistM: number[]; // meters covered during each phase of the plan
  lastElapsed: number;
  lastDistM: number;
}

export interface PhaseStat { kind: Kind; seconds: number; distM: number }

/** What is kept in the history for one match (persisted: never rename these fields). */
export interface RunDetail {
  splits: number[]; // seconds taken by each full km
  partial: { distM: number; seconds: number } | null; // remainder after the last full km
  phases: PhaseStat[];
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export const emptyLog = (plan: Plan): RunLog => ({
  kmMarks: [], phaseDistM: plan.phases.map(() => 0), lastElapsed: 0, lastDistM: 0,
});

/** Records the progress made since the last call. Pure: returns a new log. */
export function updateLog(log: RunLog, plan: Plan, elapsed: number, distM: number): RunLog {
  const delta = distM - log.lastDistM;
  if (delta <= 0) return elapsed === log.lastElapsed ? log : { ...log, lastElapsed: elapsed };

  const phase = Math.min(locate(plan, elapsed).i, plan.phases.length - 1);
  const phaseDistM = log.phaseDistM.slice();
  phaseDistM[phase] += delta;

  // Time of each km boundary crossed since the last call, interpolated between the two points
  const kmMarks = log.kmMarks.slice();
  for (let k = kmMarks.length + 1; k * 1000 <= distM; k++) {
    const share = (k * 1000 - log.lastDistM) / delta;
    kmMarks.push(log.lastElapsed + share * (elapsed - log.lastElapsed));
  }
  return { kmMarks, phaseDistM, lastElapsed: elapsed, lastDistM: distM };
}

/** Final per-km and per-phase figures of a finished (or interrupted) run. */
export function buildDetail(plan: Plan, log: RunLog, elapsed: number, distM: number): RunDetail {
  const done = updateLog(log, plan, elapsed, distM);
  const marks = done.kmMarks;
  const splits = marks.map((t, i) => round1(t - (i ? marks[i - 1] : 0)));
  const restM = distM - marks.length * 1000;
  const partial = restM >= MIN_PARTIAL_KM_M
    ? { distM: Math.round(restM), seconds: round1(elapsed - (marks.length ? marks[marks.length - 1] : 0)) }
    : null;

  const phases: PhaseStat[] = [];
  let start = 0;
  plan.phases.forEach((p, i) => {
    // The last phase also absorbs any time spent beyond the plan (distance goals)
    const cap = i === plan.phases.length - 1 ? Infinity : p.dur;
    const seconds = Math.min(cap, Math.max(0, elapsed - start));
    start += p.dur;
    if (seconds > 0) phases.push({ kind: p.kind, seconds: round1(seconds), distM: Math.round(done.phaseDistM[i]) });
  });
  return { splits, partial, phases };
}

/** Pace of a phase that has just ended (used for the voice prompt). */
export const phasePaceMinKm = (plan: Plan, log: RunLog, index: number) =>
  paceMinKm(plan.phases[index].dur, log.phaseDistM[index]);

/** Average pace over all phases of one kind. */
export function kindPaceMinKm(detail: RunDetail, kind: Kind): number | null {
  const of = detail.phases.filter((p) => p.kind === kind);
  return paceMinKm(of.reduce((a, p) => a + p.seconds, 0), of.reduce((a, p) => a + p.distM, 0));
}

/** Fastest single phase of one kind, as a pace. */
export function bestPhasePaceMinKm(detail: RunDetail, kind: Kind): number | null {
  const paces = detail.phases.filter((p) => p.kind === kind)
    .map((p) => paceMinKm(p.seconds, p.distM)).filter((x): x is number => x !== null);
  return paces.length ? Math.min(...paces) : null;
}
