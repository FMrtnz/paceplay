// Business constants shared by models, controllers and views.

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Kind = 'warmup' | 'accel' | 'recover' | 'cooldown';

// A = acceleration, R = recovery (seconds); vE = easy speed, vA = acceleration speed (km/h)
export const LEVELS: Record<Level, { label: string; A: number; R: number; vE: number; vA: number }> = {
  beginner: { label: 'Débutant', A: 30, R: 90, vE: 7, vA: 8.5 },
  intermediate: { label: 'Intermédiaire', A: 45, R: 75, vE: 9, vA: 11 },
  advanced: { label: 'Avancé', A: 60, R: 60, vE: 10.5, vA: 13.5 },
};

export const VARIATION_STEP_S = 15; // acceleration length varies by ±δ seconds
export const RECENT_SIGNATURES_COUNT = 20; // plans compared for the anti-repetition rule
export const HISTORY_PREVIEW_COUNT = 15; // sessions listed on the progress page
export const WEEK_MS = 6048e5;

export const PHASE_LABEL: Record<Kind, string> = {
  warmup: 'Warm-up',
  accel: 'Speed up',
  recover: 'Recover',
  cooldown: 'Cool-down',
};

export const PHASE_TIP: Record<Kind, string> = {
  warmup: 'Walk or jog gently',
  accel: 'Controlled effort, at your own pace',
  recover: 'Slow down or walk',
  cooldown: 'Easy pace',
};

// Goal slider settings (change the limits here)
export const SLIDER = {
  time: { min: 10, max: 120, step: 1, unit: 'min', start: 20 },
  dist: { min: 1, max: 42, step: 0.5, unit: 'km', start: 3 },
};

// Run screen timings and messages
export const TICK_MS = 250; // display refresh + autosave period
export const SIGNAL_LOST_MS = 15000; // no GPS fix for this long → warn
export const SIGNAL_LOST_MESSAGE = 'GPS signal lost: distance is paused, the timer keeps running.';
export const CAPTURE_VIBRATION = [200, 100, 200, 100, 400];

// XP rules (points are never subtracted)
export const XP_COMPLETED = 50;
export const XP_PER_CHALLENGE = 10;
export const XP_MAX_CHALLENGES = 10;
export const XP_ALL_RECOVER_BONUS = 20;
export const XP_WEEK3_BONUS = 30;

// Badge ids are persisted: never rename them.
export const BADGES: Record<string, string> = {
  first: 'Première capture',
  w3: '3 séances / semaine',
  d10: '10 défis cumulés',
  k5: '5 km cumulés',
};
export const BADGE_CHALLENGES_TARGET = 10;
export const BADGE_DISTANCE_TARGET_M = 5000;

export const STEPS_UNAVAILABLE_REASON =
  "Les pas ne sont pas lisibles depuis Safari (pas d'accès à Apple Santé ni à l'Apple Watch). Utilisez le GPS ou le mode durée.";
