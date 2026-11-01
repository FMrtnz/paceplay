import { useEffect, useRef, useState } from 'react';
import { CAPTURE_VIBRATION, SIGNAL_LOST_MESSAGE, SIGNAL_LOST_MS, TICK_MS } from '../models/constants';
import type { Kind } from '../models/constants';
import type { Plan } from '../models/planModel';
import {
  computeProgress, countCompletedAccelerations, createClock, elapsedS, goalDistanceM, isGoalReached, locate, pause, resume,
} from '../models/sessionModel';
import type { Clock, RunConfig, RunOutcome } from '../models/sessionModel';
import { clearActiveSession, loadActiveSession, saveActiveSession } from '../models/storage';
import { Tracker } from '../models/trackerModel';
import type { Fix } from '../models/trackerModel';
import { announcePhase, beep, unlockAudio, vibrate } from '../services/feedback';
import { watchGps } from '../services/geolocation';
import { keepScreenOn } from '../services/wakeLock';

/** Everything the run page displays, plus its two actions. */
export interface RunView {
  phaseKind: Kind | null; // null once the plan is over but a distance goal is still open
  phaseTimeLeft: number;
  elapsed: number;
  totalS: number;
  distM: number;
  goalKm: number | null;
  metersToGo: number | null;
  progress: number;
  paused: boolean;
  sourceLabel: 'simulation' | 'GPS';
  quality: string;
  gpsNotice: string;
  togglePause: () => void;
  endEarly: () => void;
}

/** Runs one session: clock, GPS/simulation, autosave, end detection, sound and voice cues. */
export function useRunController(props: { plan: Plan; config: RunConfig; soundEnabled: boolean; onEnd: (o: RunOutcome) => void }): RunView {
  const { plan, config, soundEnabled: sound, onEnd } = props;
  // Resume after a reload: read back the saved session (once)
  const [saved] = useState(loadActiveSession);
  const clock = useRef<Clock>(saved?.clock ?? createClock(Date.now()));
  const tracker = useRef(new Tracker(saved?.dist ?? 0));
  const lastFixAt = useRef(Date.now());
  const finished = useRef(false);
  const [, refresh] = useState(0);
  const [gpsMessage, setGpsMessage] = useState('');

  // Values recomputed on every refresh (time comes from timestamps)
  const now = Date.now();
  const elapsed = elapsedS(clock.current, now);
  const position = locate(plan, elapsed);
  const phase = plan.phases[position.i];
  const distM = tracker.current.dist;
  const targetM = goalDistanceM(config);
  const progress = computeProgress(elapsed, plan.total, distM, targetM);
  const paused = !!clock.current.pausedAt;
  const signalLost = !paused && now - lastFixAt.current > SIGNAL_LOST_MS && !gpsMessage;
  const sourceLabel = config.sim ? 'simulation' : 'GPS';

  function endRun(completed: boolean) {
    if (finished.current) return;
    finished.current = true;
    clearActiveSession();
    if (completed) {
      beep('capture', sound);
      vibrate(CAPTURE_VIBRATION, sound);
    }
    onEnd({
      completed,
      elapsed: Math.round(elapsed),
      distM: Math.round(distM),
      challenges: countCompletedAccelerations(plan, elapsed),
      progress,
      source: sourceLabel,
    });
  }

  function togglePause() {
    unlockAudio();
    const t = Date.now();
    clock.current = paused ? resume(clock.current, t) : pause(clock.current, t);
    refresh((x) => x + 1);
  }

  // Display loop + saving + end-of-run check.
  // No dependency list on purpose: it is re-created at every render so `endRun` sees fresh values.
  useEffect(() => {
    const id = setInterval(() => {
      refresh((x) => x + 1);
      saveActiveSession({ plan, cfg: config, clock: clock.current, dist: tracker.current.dist });
      const t = elapsedS(clock.current, Date.now());
      if (isGoalReached(plan, t, tracker.current.dist, targetM)) endRun(true);
    }, TICK_MS);
    return () => clearInterval(id);
  });

  // Position source: real GPS or simulation
  useEffect(() => {
    const onFix = (f: Fix) => {
      if (clock.current.pausedAt) return;
      lastFixAt.current = Date.now();
      tracker.current.add(f);
    };
    if (!config.sim) return watchGps(onFix, setGpsMessage);
    // The simulator is test-only code: load it on demand (the first simulated fix comes after 1 s)
    let stop = () => {};
    let cancelled = false;
    import('../services/simulator').then((m) => { if (!cancelled) stop = m.simulate(onFix); });
    return () => { cancelled = true; stop(); };
  }, []);

  // Keep the screen on when the browser allows it
  useEffect(() => keepScreenOn(), []);

  // Sound + voice prompt at each phase change
  useEffect(() => {
    if (!phase) return;
    beep(phase.kind === 'accel' ? 'up' : 'down', sound);
    announcePhase(phase.kind);
  }, [position.i]);

  return {
    phaseKind: phase ? phase.kind : null,
    phaseTimeLeft: position.left,
    elapsed,
    totalS: plan.total,
    distM,
    goalKm: targetM ? config.val : null,
    metersToGo: targetM ? Math.max(0, Math.round(targetM - distM)) : null,
    progress,
    paused,
    sourceLabel,
    quality: tracker.current.quality(),
    gpsNotice: gpsMessage || (signalLost ? SIGNAL_LOST_MESSAGE : ''),
    togglePause,
    endEarly: () => endRun(false),
  };
}
