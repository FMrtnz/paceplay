import { STEPS_UNAVAILABLE_REASON } from '../models/constants';

/** Safari iOS exposes neither HealthKit nor the Apple Watch. No universal step API: mode disabled. */
export const stepsStatus = { available: false, reason: STEPS_UNAVAILABLE_REASON };
export const stepsDistanceKm = (steps: number, strideM: number) => steps * strideM / 1000;
