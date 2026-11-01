// Business constants shared by models, controllers and views.

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Kind = 'warmup' | 'accel' | 'recover' | 'cooldown';

// A = acceleration, R = recovery (seconds); vE = easy speed, vA = acceleration speed (km/h)
export const LEVELS: Record<Level, { A: number; R: number; vE: number; vA: number }> = {
  beginner: { A: 30, R: 90, vE: 7, vA: 8.5 },
  intermediate: { A: 45, R: 75, vE: 9, vA: 11 },
  advanced: { A: 60, R: 60, vE: 10.5, vA: 13.5 },
};

export const VARIATION_STEP_S = 15; // acceleration length varies by ±δ seconds
export const RECENT_SIGNATURES_COUNT = 20; // plans compared for the anti-repetition rule
export const WEEK_MS = 6048e5;

// Goal slider settings (change the limits here)
export const SLIDER = {
  time: { min: 10, max: 120, step: 1, unit: 'min', start: 20 },
  dist: { min: 1, max: 42, step: 0.5, unit: 'km', start: 3 },
};

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

