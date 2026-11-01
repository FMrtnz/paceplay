import { useEffect, useMemo, useState } from 'react';
import { describeMatch } from '../models/matchModel';
import type { RunOutcome } from '../models/sessionModel';
import type { RunResult } from '../models/progressModel';
import { useProgressController } from './useProgressController';
import { useSetupController } from './useSetupController';
import type { PlanResult } from './useSetupController';
import { useShareController } from './useShareController';

export type Screen = 'home' | 'config' | 'preview' | 'run' | 'result' | 'progress' | 'match' | 'trophies';

/** Root controller: owns the current screen and chains the setup, run, progress and share controllers. */
export function useAppController() {
  const progress = useProgressController();
  const setup = useSetupController({ recentSigs: progress.recentSigs, nextSeed: progress.nextSeed, lastLevel: progress.lastLevel });
  const [screen, setScreen] = useState<Screen>('home');
  const [lastRun, setLastRun] = useState<{ result: RunResult; newBadges: string[] } | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const match = progress.findMatch(selectedDate);
  const matchView = useMemo(() => (match ? describeMatch(match) : null), [match]);
  const share = useShareController(screen === 'match' ? match : screen === 'result' ? lastRun?.result ?? null : null);

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
    screen, progress, setup, lastRun, match, matchView, share,
    goHome: () => setScreen('home'),
    openConfig: () => setScreen('config'),
    openProgress: () => setScreen('progress'),
    openTrophies: () => setScreen('trophies'),
    openMatch(date: number) {
      setSelectedDate(date);
      setScreen('match');
    },
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
