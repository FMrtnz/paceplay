import { useEffect, useRef, useState } from 'react';
import { CAPTURE_VIBRATION, MAX_SPEED_MS, SIGNAL_LOST_MS, TICK_MS } from '../models/constants';
import type { Activity, Kind } from '../models/constants';
import { buildDetail, emptyLog, phasePaceMinKm, updateLog } from '../models/detailModel';
import type { RunLog } from '../models/detailModel';
import { averagePaceMinKm } from '../models/paceModel';
import type { Plan } from '../models/planModel';
import {
  computeProgress, countCompletedAccelerations, createClock, elapsedS, goalDistanceM, isGoalReached, locate, pause, resume,
} from '../models/sessionModel';
import type { Clock, RunConfig, RunOutcome } from '../models/sessionModel';
import { clearActiveSession, loadActiveSession, saveActiveSession } from '../models/storage';
import { Tracker } from '../models/trackerModel';
import type { Fix } from '../models/trackerModel';
import { MESSAGES, PHASE_LABEL } from '../models/vocabulary';
import { spokenEffort } from '../utils/format';
import { announcePhase, beep, unlockAudio, vibrate } from '../services/feedback';
import { useRunSensors } from './useRunSensors';

/** Everything the run page displays, plus its two actions. */
export interface RunView {
  activity: Activity; // a run is shown as a pace, a ride as a speed
  phaseKind: Kind | null; // null once the plan is over but a distance goal is still open
  phaseTimeLeft: number;
  elapsed: number;
  totalS: number;
  distM: number;
  goalKm: number | null;
  metersToGo: number | null;
  paceNowMinKm: number | null; // smoothed over ~25 s
  paceAvgMinKm: number | null;
  progress: number;
  paused: boolean;
  sourceLabel: 'simulation' | 'GPS';
  quality: string;
  gpsNotice: string;
  togglePause: () => void;
  endEarly: () => void;
}

/** Runs one session: clock, GPS/simulation, recording, autosave, end detection, sound and voice cues. */
export function useRunController(props: { plan: Plan; config: RunConfig; soundEnabled: boolean; onEnd: (o: RunOutcome) => void }): RunView {
  const { plan, config, soundEnabled: sound, onEnd } = props;
  // Resume after a reload: read back the saved session (once)
  const [saved] = useState(loadActiveSession);
  const tracked = !saved || !!saved.log; // sessions saved before pace tracking cannot be recorded
  const clock = useRef<Clock>(saved?.clock ?? createClock(Date.now()));
  const tracker = useRef(new Tracker(saved?.dist ?? 0, MAX_SPEED_MS[config.activity]));
  const log = useRef<RunLog>(saved?.log ?? emptyLog(plan));
  const lastFixAt = useRef(Date.now());
  const finished = useRef(false);
  const firstCue = useRef(true);
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
      detail: tracked ? buildDetail(plan, log.current, elapsed, distM) : undefined,
    });
  }

  function togglePause() {
    unlockAudio();
    const t = Date.now();
    clock.current = paused ? resume(clock.current, t) : pause(clock.current, t);
    refresh((x) => x + 1);
  }

  // Display loop + recording + saving + end-of-run check.
  // No dependency list on purpose: it is re-created at every render so `endRun` sees fresh values.
  useEffect(() => {
    const id = setInterval(() => {
      refresh((x) => x + 1);
      const t = elapsedS(clock.current, Date.now());
      if (tracked) log.current = updateLog(log.current, plan, t, tracker.current.dist);
      saveActiveSession({
        plan, cfg: config, clock: clock.current, dist: tracker.current.dist, log: tracked ? log.current : undefined,
      });
      if (isGoalReached(plan, t, tracker.current.dist, targetM)) endRun(true);
    }, TICK_MS);
    return () => clearInterval(id);
  });

  useRunSensors(config, (f: Fix) => {
    if (clock.current.pausedAt) return;
    lastFixAt.current = Date.now();
    tracker.current.add(f);
  }, setGpsMessage);

  // Sound + voice prompt at each phase change; after a speed-up, the pace that was held
  useEffect(() => {
    if (!phase) return;
    beep(phase.kind === 'accel' || phase.kind === 'steady' ? 'up' : 'down', sound);
    const i = position.i;
    const afterSpeedUp = tracked && !firstCue.current && i > 0 && plan.phases[i - 1].kind === 'accel';
    firstCue.current = false;
    const held = afterSpeedUp ? phasePaceMinKm(plan, log.current, i - 1) : null;
    announcePhase(phase.kind, held === null ? null : `${PHASE_LABEL.accel} complete. ${spokenEffort(held, config.activity)}.`);
  }, [position.i]);

  return {
    activity: config.activity,
    phaseKind: phase ? phase.kind : null,
    phaseTimeLeft: position.left,
    elapsed,
    totalS: plan.total,
    distM,
    goalKm: targetM ? config.val : null,
    metersToGo: targetM ? Math.max(0, Math.round(targetM - distM)) : null,
    paceNowMinKm: tracker.current.recentPaceMinKm(now),
    paceAvgMinKm: averagePaceMinKm(elapsed, distM),
    progress,
    paused,
    sourceLabel,
    quality: tracker.current.quality(),
    gpsNotice: gpsMessage || (signalLost ? MESSAGES.signalLost : ''),
    togglePause,
    endEarly: () => endRun(false),
  };
}
