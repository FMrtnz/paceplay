import type { Plan } from './models/planModel';
import type { RunConfig, RunOutcome } from './models/sessionModel';
import { useAppController } from './controllers/useAppController';
import type { PlanResult } from './controllers/useSetupController';
import { useRunController } from './controllers/useRunController';
import BottomNav from './views/components/BottomNav';
import type { NavTab } from './views/components/BottomNav';
import Logo from './views/components/Logo';
import ShareSheet from './views/components/ShareSheet';
import HomePage from './views/pages/HomePage';
import ConfigPage from './views/pages/ConfigPage';
import PreviewPage from './views/pages/PreviewPage';
import RunPage from './views/pages/RunPage';
import ResultPage from './views/pages/ResultPage';
import ProgressPage from './views/pages/ProgressPage';
import MatchPage from './views/pages/MatchPage';
import TrophyPage from './views/pages/TrophyPage';

/** Mounts the run controller only while a session is on screen (it owns timers and GPS). */
function RunRoute(props: { plan: Plan; config: RunConfig; soundEnabled: boolean; onEnd: (o: RunOutcome) => void }) {
  const run = useRunController(props);
  return <RunPage run={run} />;
}

/** The only place that talks to the user about a failed generation. */
const alertIfFailed = (r: PlanResult) => { if (!r.ok) alert(r.error); };
/** Deleting is destructive: ask first. */
const confirmDelete = () => confirm('Delete this match? Its XP will be removed (trophies are kept).');

export default function App() {
  const app = useAppController();
  const { setup, progress, match, matchView, share } = app;

  if (app.screen === 'run' && setup.plan) {
    return <RunRoute plan={setup.plan} config={setup.config} soundEnabled={setup.soundEnabled} onEnd={app.finishRun} />;
  }

  // The bottom bar belongs to the browsing screens, not to the setup / result flow
  const nav: NavTab | null = app.screen === 'home' ? 'home' : app.screen === 'trophies' ? 'trophies'
    : app.screen === 'progress' || app.screen === 'match' ? 'progress' : null;
  const selectTab = (t: NavTab) => (t === 'home' ? app.goHome() : t === 'progress' ? app.openProgress() : app.openTrophies());

  return (
    <div className="w">
      <header className="brand"><Logo /><h1>PACEPLAY</h1></header>
      {app.screen === 'home' && <HomePage summary={progress.summary} onStart={app.openConfig} />}
      {app.screen === 'config' && (
        <ConfigPage
          config={setup.config} soundEnabled={setup.soundEnabled}
          onModeChange={setup.setMode} onValueChange={setup.setValue} onLevelChange={setup.setLevel}
          onActivityChange={setup.setActivity} onFormatChange={setup.setFormat} onWarmupChange={setup.setWarmup}
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
        <ResultPage
          result={app.lastRun.result} newBadges={app.lastRun.newBadges}
          onShare={share.openSheet} onViewMatch={() => app.openMatch(app.lastRun!.result.date)} onHome={app.goHome}
        />
      )}
      {app.screen === 'progress' && (
        <ProgressPage
          xp={progress.summary.xp} monthGroups={progress.monthGroups} stats={progress.statsByActivity} streak={progress.streak}
          onOpenMatch={app.openMatch} onDeleteMatch={(date) => { if (confirmDelete()) progress.deleteRun(date); }}
        />
      )}
      {app.screen === 'match' && match && matchView && (
        <MatchPage match={match} view={matchView} onShare={share.openSheet} onBack={app.openProgress} />
      )}
      {app.screen === 'trophies' && <TrophyPage earnedIds={progress.earnedTrophyIds} />}
      {nav && <BottomNav current={nav} onSelect={selectTab} />}
      {share.open && <ShareSheet share={share} />}
    </div>
  );
}
