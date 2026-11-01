import { useState } from 'react';
import { SLIDER } from '../models/constants';
import type { Activity, Format, Level } from '../models/constants';
import { pickPlan, totalSecondsFor } from '../models/planModel';
import type { Plan } from '../models/planModel';
import { planOptions } from '../models/sessionModel';
import type { RunConfig } from '../models/sessionModel';
import { clearActiveSession, loadActiveSession, loadSoundEnabled, saveSoundEnabled } from '../models/storage';
import { unlockAudio } from '../services/feedback';

export type PlanResult = { ok: true } | { ok: false; error: string };

/** Owns the session setup: goal, level, options, generated plan and sound preference. */
export function useSetupController(opts: { recentSigs: string[]; nextSeed: number; lastLevel: Level }) {
  const [config, setConfig] = useState<RunConfig>({
    mode: 'time', val: SLIDER.run.time.start, level: opts.lastLevel, sim: false,
    activity: 'run', format: 'intervals', warmupMin: null,
  });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [repeated, setRepeated] = useState(false);
  const [soundEnabled, setSoundState] = useState(loadSoundEnabled);

  // Changing the goal type or the activity resets the slider to that setting's default value
  const setMode = (mode: RunConfig['mode']) => setConfig({ ...config, mode, val: SLIDER[config.activity][mode].start });
  const setActivity = (activity: Activity) => setConfig({ ...config, activity, val: SLIDER[activity][config.mode].start });
  const setFormat = (format: Format) => setConfig({ ...config, format });
  const setWarmup = (warmupMin: number | null) => setConfig({ ...config, warmupMin });
  const setValue = (val: number) => setConfig({ ...config, val });
  const setLevel = (level: Level) => setConfig({ ...config, level });
  const setSimulation = (sim: boolean) => setConfig({ ...config, sim });

  function setSoundEnabled(on: boolean) {
    setSoundState(on);
    saveSoundEnabled(on);
  }

  /** Builds a plan that avoids the latest signatures. Errors are returned, not thrown. */
  function buildFrom(seed: number): PlanResult {
    try {
      const r = pickPlan(
        totalSecondsFor(config.mode, config.val, config.level, config.activity), config.level, seed, opts.recentSigs, planOptions(config),
      );
      setPlan(r.plan);
      setRepeated(r.repeated);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
  const generatePlan = () => buildFrom(opts.nextSeed);
  const generateAnotherPlan = () => buildFrom(plan!.seed + 1);

  /** Called when the user taps Go. Audio needs a user gesture; any stale saved session must go. */
  function beginRun() {
    unlockAudio();
    clearActiveSession();
  }

  /** Restores a session interrupted by a reload. Returns true if there was one. */
  function resumeSavedSession(): boolean {
    const saved = loadActiveSession();
    if (!saved) return false;
    setConfig(saved.cfg);
    setPlan(saved.plan);
    return true;
  }

  return {
    config, plan, repeated, soundEnabled,
    setMode, setActivity, setFormat, setWarmup, setValue, setLevel, setSimulation, setSoundEnabled,
    generatePlan, generateAnotherPlan, beginRun, resumeSavedSession,
  };
}
