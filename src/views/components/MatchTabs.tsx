import type { RunResult } from '../../models/progressModel';
import type { MatchView } from '../../models/matchModel';
import { EFFORT_LABEL, PHASE_LABEL } from '../../models/vocabulary';
import { formatClock, formatEffort, formatKm } from '../../utils/format';
import StatTile from './StatTile';

const NO_DETAIL = <div className="card muted">Per-km and per-phase figures were not recorded for this match (they need GPS, and matches saved before this feature have none).</div>;

export function Overview({ match, view }: { match: RunResult; view: MatchView }) {
  const effort = EFFORT_LABEL[view.activity];
  return (
    <div className="tiles">
      <StatTile label="Distance" value={`${formatKm(match.distM)} km`} />
      <StatTile label="Time" value={formatClock(match.elapsed)} />
      <StatTile label={effort.avg} value={formatEffort(view.avgPaceMinKm, view.activity)} />
      {view.format === 'intervals' && <StatTile label="Speed-ups" value={String(match.challenges)} />}
      <StatTile label="XP" value={`+${match.xp}`} />
      <StatTile label="Source" value={match.source} />
    </div>
  );
}

export function Kilometres({ view }: { view: MatchView }) {
  if (!view.hasDetail) return NO_DETAIL;
  if (view.kmRows.length === 0) return <div className="card muted">No full kilometre recorded.</div>;
  return (
    <div className="card table">
      <div className="tr th"><span>Km</span><span>Time</span><span>{EFFORT_LABEL[view.activity].column}</span></div>
      {view.kmRows.map((r) => (
        <div className="tr" key={r.index ?? 'last'}>
          <span>{r.index ?? `+${r.distM} m`}</span><span>{formatClock(Math.round(r.seconds))}</span><span>{formatEffort(r.paceMinKm, view.activity)}</span>
        </div>
      ))}
    </div>
  );
}

/** Per-phase figures. Intervals: speed-ups against recoveries. Steady: warm-up, steady block, cool-down. */
export function Phases({ view }: { view: MatchView }) {
  if (!view.hasDetail) return NO_DETAIL;
  const a = view.activity;
  return (
    <>
      <div className="tiles">
        {view.format === 'intervals' ? <>
          <StatTile label="Speed-ups avg" value={`≈ ${formatEffort(view.speedUpAvgMinKm, a)}`} />
          <StatTile label="Recover avg" value={`≈ ${formatEffort(view.recoverAvgMinKm, a)}`} />
          <StatTile label="Best speed-up" value={`≈ ${formatEffort(view.bestSpeedUpMinKm, a)}`} />
        </> : <StatTile label="Steady avg" value={formatEffort(view.steadyAvgMinKm, a)} />}
      </div>
      <div className="card table">
        <div className="tr th"><span>Phase</span><span>Time · Dist</span><span>{EFFORT_LABEL[a].column}</span></div>
        {view.phaseRows.map((r, i) => (
          <div className="tr" key={i}>
            <span className={r.kind}>{PHASE_LABEL[r.kind]}</span>
            <span>{formatClock(Math.round(r.seconds))} · {r.distM} m</span>
            <span>{r.approx ? '≈ ' : ''}{formatEffort(r.paceMinKm, a)}</span>
          </div>
        ))}
      </div>
      <p className="muted">≈ marks figures measured over less than a minute: GPS makes them approximate.</p>
    </>
  );
}
