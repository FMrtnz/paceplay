// Business constants shared by models, controllers and views.

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Kind = 'warmup' | 'accel' | 'recover' | 'steady' | 'cooldown';
export type Activity = 'run' | 'bike';
export type Format = 'intervals' | 'steady';

// A = acceleration, R = recovery (seconds), the same for every activity
export const LEVELS: Record<Level, { A: number; R: number }> = {
  beginner: { A: 30, R: 90 },
  intermediate: { A: 45, R: 75 },
  advanced: { A: 60, R: 60 },
};

// vE = easy speed, vA = acceleration speed (km/h): used to estimate distances and durations
export const SPEEDS: Record<Activity, Record<Level, { vE: number; vA: number }>> = {
  run: { beginner: { vE: 7, vA: 8.5 }, intermediate: { vE: 9, vA: 11 }, advanced: { vE: 10.5, vA: 13.5 } },
  bike: { beginner: { vE: 17, vA: 22 }, intermediate: { vE: 21, vA: 27 }, advanced: { vE: 25, vA: 32 } },
};

// Fastest plausible speed (m/s): faster GPS jumps are rejected. Simulation speed (m/s) per activity.
export const MAX_SPEED_MS: Record<Activity, number> = { run: 7, bike: 20 };
export const SIM_SPEED_MS: Record<Activity, number> = { run: 2.8, bike: 7.5 };

export const VARIATION_STEP_S = 15; // acceleration length varies by ±δ seconds
export const RECENT_SIGNATURES_COUNT = 20; // plans compared for the anti-repetition rule
export const WEEK_MS = 6048e5;

// Goal slider settings per activity (change the limits here)
export const SLIDER = {
  run: {
    time: { min: 10, max: 120, step: 1, unit: 'min', start: 20 },
    dist: { min: 1, max: 42, step: 0.5, unit: 'km', start: 3 },
  },
  bike: {
    time: { min: 10, max: 240, step: 5, unit: 'min', start: 45 },
    dist: { min: 5, max: 150, step: 1, unit: 'km', start: 20 },
  },
};

// Warm-up choices in minutes: null = automatic (15 % of the session, 3 to 5 min), 0 = none
export const WARMUP_CHOICES: (number | null)[] = [null, 0, 3, 5, 10, 15];
export const MIN_STEADY_BLOCK_S = 60; // shortest steady block a plan may have

// Run screen timings and messages
export const TICK_MS = 250; // display refresh + autosave period
export const SIGNAL_LOST_MS = 15000; // no GPS fix for this long → warn
export const CAPTURE_VIBRATION = [200, 100, 200, 100, 400];

// Pace
export const PACE_WINDOW_MS = 25000; // current pace is smoothed over this window
export const PACE_STALE_MS = 10000; // no fix for this long → current pace unknown
export const MIN_PACE_DISTANCE_M = 20; // below this, a pace is meaningless
export const PACE_APPROX_BELOW_S = 60; // paces over shorter periods are shown as approximate
export const MIN_PARTIAL_KM_M = 100; // a last partial km is listed only from this distance

// XP rules (points are never subtracted)
export const XP_COMPLETED = 50;
export const XP_PER_CHALLENGE = 10;
export const XP_MAX_CHALLENGES = 10;
export const XP_ALL_RECOVER_BONUS = 20;
export const XP_WEEK3_BONUS = 30;

export const BADGE_CHALLENGES_TARGET = 10;
export const BADGE_DISTANCE_TARGET_M = 5000;

