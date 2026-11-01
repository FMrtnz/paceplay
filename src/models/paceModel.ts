import { MIN_PACE_DISTANCE_M, PACE_APPROX_BELOW_S } from './constants';

/** Pace in min/km, or null when the distance is too small for a meaningful value. */
export function paceMinKm(seconds: number, meters: number, minMeters = MIN_PACE_DISTANCE_M): number | null {
  if (!(seconds > 0) || meters < minMeters) return null;
  return seconds / 60 / (meters / 1000);
}

/** Whole-run average pace (needs at least 50 m). */
export const averagePaceMinKm = (elapsedS: number, distM: number) => paceMinKm(elapsedS, distM, 50);

/** Paces measured over a short period are noisy: the screen marks them with "≈". */
export const isApproximatePace = (seconds: number) => seconds < PACE_APPROX_BELOW_S;
