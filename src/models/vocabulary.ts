import type { Kind, Level } from './constants';

// All user-facing words live here (Quidditch-inspired). Change the wording in this file only.

export const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Rookie',
  intermediate: 'Chaser',
  advanced: 'Seeker',
};

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

export const SCREEN_TITLE = {
  home: 'Locker Room',
  config: 'Team Sheet',
  preview: 'Game Plan',
  run: 'The Pitch',
  result: 'Final Whistle',
  progress: 'Progress',
  match: 'Match',
  trophies: 'Trophy Room',
};

export const RESULT_TITLE = { completed: 'Snitch caught!', interrupted: 'Mission interrupted' };

// Trophy ids are persisted (as `badges`): never rename them.
export const TROPHIES: Record<string, { name: string; hint: string }> = {
  first: { name: 'First Catch', hint: 'Complete your first match' },
  w3: { name: 'Hat-trick Week', hint: 'Complete 3 matches in one week' },
  d10: { name: 'Ten Speed-ups', hint: 'Complete 10 speed-ups in total' },
  k5: { name: 'Cross-country Flyer', hint: 'Fly 5 km in total' },
};

export const MESSAGES = {
  gpsUnavailable: 'GPS unavailable: duration mode only.',
  gpsDenied: 'Location denied: duration mode only (no penalty).',
  gpsLost: 'GPS signal lost…',
  gpsSlow: 'GPS is slow to respond…',
  signalLost: 'GPS signal lost: distance is paused, the timer keeps running.',
  stepsUnavailable:
    'Steps cannot be read from Safari (no access to Apple Health or the Apple Watch). Use GPS or duration mode.',
  shareFailed: 'Could not create the image.',
  photoFailed: 'Could not read this photo.',
  imageSaved: 'Image saved to your downloads.',
  minDuration: 'Minimum duration: 10 minutes',
  minDistance: 'Minimum distance: 1 km',
  tooShort: 'Match too short for this level',
  invariant: 'Invariant violated: phase durations do not add up to the total',
};
