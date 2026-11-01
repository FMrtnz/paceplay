import type { Plan } from './models/planModel';
import type { RunConfig, RunOutcome } from './models/sessionModel';
import { useAppController } from './controllers/useAppController';
import type { PlanResult } from './controllers/useSetupController';
import { useRunController } from './controllers/useRunController';
import HomePage from './views/pages/HomePage';
import ConfigPage from './views/pages/ConfigPage';
import PreviewPage from './views/pages/PreviewPage';
import RunPage from './views/pages/RunPage';
import ResultPage from './views/pages/ResultPage';
import ProgressPage from './views/pages/ProgressPage';

/** Mounts the run controller only while a session is on screen (it owns timers and GPS). */
function RunRoute(props: { plan: Plan; config: RunConfig; soundEnabled: boolean; onEnd: (o: RunOutcome) => void }) {
  const run = useRunController(props);
  return <RunPage run={run} />;
}

/** The only place that talks to the user about a failed generation. */
const alertIfFailed = (r: PlanResult) => { if (!r.ok) alert(r.error); };

export default function App() {
  const app = useAppController();
  const { setup, progress } = app;

  if (app.screen === 'run' && setup.plan) {
    return <RunRoute plan={setup.plan} config={setup.config} soundEnabled={setup.soundEnabled} onEnd={app.finishRun} />;
  }

  return (
    <div className="w">
      <h1>PACEPLAY</h1>
      {app.screen === 'home' && (
        <HomePage summary={progress.summary} onStart={app.openConfig} onProgress={app.openProgress} />
      )}
      {app.screen === 'config' && (
        <ConfigPage
          config={setup.config} soundEnabled={setup.soundEnabled}
          onModeChange={setup.setMode} onValueChange={setup.setValue} onLevelChange={setup.setLevel}
          onSimulationChange={setup.setSimulation} onSoundChange={setup.setSoundEnabled}
          onGenerate={() => alertIfFailed(app.generatePlan())} onBack={app.goHome}
        />
      )}
      {app.screen === 'preview' && setup.plan && (
        <PreviewPage
          plan={setup.plan} config={setup.config} repeated={setup.repeated} onStart={app.startRun}
          onAnother={() => alertIfFailed(app.generateAnotherPlan())} onBack={app.openConfig}
        />
      )}
      {app.screen === 'result' && app.lastRun && (
        <ResultPage result={app.lastRun.result} newBadges={app.lastRun.newBadges} onHome={app.goHome} />
      )}
      {app.screen === 'progress' && (
        <ProgressPage
          xp={progress.summary.xp} earnedBadgeIds={progress.earnedBadgeIds}
          recentRuns={progress.recentRuns} onBack={app.goHome}
        />
      )}
    </div>
  );
}
