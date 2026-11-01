import { MIN_PARTIAL_KM_M } from './constants';
import type { Kind } from './constants';
import { bestPhasePaceMinKm, kindPaceMinKm } from './detailModel';
import { averagePaceMinKm, isApproximatePace, paceMinKm } from './paceModel';
import type { RunResult } from './progressModel';

export interface KmRow { index: number | null; distM: number; seconds: number; paceMinKm: number | null } // index null = last partial km
export interface PhaseRow { kind: Kind; seconds: number; distM: number; paceMinKm: number | null; approx: boolean }
export interface MatchView {
  avgPaceMinKm: number | null;
  hasDetail: boolean;
  kmRows: KmRow[];
  phaseRows: PhaseRow[];
  speedUpAvgMinKm: number | null;
  recoverAvgMinKm: number | null;
  bestSpeedUpMinKm: number | null;
}

/** Everything the match page and the share card show, derived from one history entry. */
export function describeMatch(match: RunResult): MatchView {
  const d = match.detail;
  const view: MatchView = {
    avgPaceMinKm: averagePaceMinKm(match.elapsed, match.distM),
    hasDetail: !!d, kmRows: [], phaseRows: [], speedUpAvgMinKm: null, recoverAvgMinKm: null, bestSpeedUpMinKm: null,
  };
  if (!d) return view;

  view.kmRows = d.splits.map((seconds, i) => ({ index: i + 1, distM: 1000, seconds, paceMinKm: paceMinKm(seconds, 1000) }));
  if (d.partial) {
    view.kmRows.push({ index: null, distM: d.partial.distM, seconds: d.partial.seconds, paceMinKm: paceMinKm(d.partial.seconds, d.partial.distM, MIN_PARTIAL_KM_M) });
  }
  view.phaseRows = d.phases.map((p) => ({
    kind: p.kind, seconds: p.seconds, distM: p.distM, paceMinKm: paceMinKm(p.seconds, p.distM), approx: isApproximatePace(p.seconds),
  }));
  view.speedUpAvgMinKm = kindPaceMinKm(d, 'accel');
  view.recoverAvgMinKm = kindPaceMinKm(d, 'recover');
  view.bestSpeedUpMinKm = bestPhasePaceMinKm(d, 'accel');
  return view;
}
