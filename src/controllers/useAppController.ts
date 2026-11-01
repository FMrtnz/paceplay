import { useEffect, useState } from 'react';
import type { RunOutcome } from '../models/sessionModel';
import type { RunResult } from '../models/progressModel';
import { useProgressController } from './useProgressController';
import { useSetupController } from './useSetupController';
import type { PlanResult } from './useSetupController';

export type Screen = 'home' | 'config' | 'preview' | 'run' | 'result' | 'progress';

/** Root controller: owns the current screen and chains the setup, run and progress controllers. */
export function useAppController() {
  const progress = useProgressController();
  const setup = useSetupController({ recentSigs: progress.recentSigs, nextSeed: progress.nextSeed, lastLevel: progress.lastLevel });
  const [screen, setScreen] = useState<Screen>('home');
  const [lastRun, setLastRun] = useState<{ result: RunResult; newBadges: string[] } | null>(null);

  // Session interrupted by a reload: resume it
  useEffect(() => {
    if (setup.resumeSavedSession()) setScreen('run');
  }, []);

  /** On success the preview opens; on failure the caller gets the error to display. */
  const openPreviewIf = (r: PlanResult): PlanResult => {
    if (r.ok) setScreen('preview');
    return r;
  };

  return {
    screen, progress, setup, lastRun,
    goHome: () => setScreen('home'),
    openConfig: () => setScreen('config'),
    openProgress: () => setScreen('progress'),
    generatePlan: () => openPreviewIf(setup.generatePlan()),
    generateAnotherPlan: () => openPreviewIf(setup.generateAnotherPlan()),
    startRun() {
      setup.beginRun();
      setScreen('run');
    },
    finishRun(outcome: RunOutcome) {
      setLastRun(progress.recordRun(outcome, setup.config, setup.plan!));
      setScreen('result');
    },
  };
}
