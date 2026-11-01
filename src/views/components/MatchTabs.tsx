import type { RunResult } from '../../models/progressModel';
import type { MatchView } from '../../models/matchModel';
import { PHASE_LABEL } from '../../models/vocabulary';
import { formatClock, formatKm, formatPace } from '../../utils/format';
import StatTile from './StatTile';

const pace = (p: number | null) => `${formatPace(p)} /km`;
const NO_DETAIL = <div className="card muted">Per-km and per-phase paces were not recorded for this match (they need GPS, and matches saved before this feature have none).</div>;

export function Overview({ match, view }: { match: RunResult; view: MatchView }) {
  return (
    <div className="tiles">
      <StatTile label="Distance" value={`${formatKm(match.distM)} km`} />
      <StatTile label="Time" value={formatClock(match.elapsed)} />
      <StatTile label="Avg pace" value={pace(view.avgPaceMinKm)} />
      <StatTile label="Speed-ups" value={String(match.challenges)} />
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
      <div className="tr th"><span>Km</span><span>Time</span><span>Pace</span></div>
      {view.kmRows.map((r) => (
        <div className="tr" key={r.index ?? 'last'}>
          <span>{r.index ?? `+${r.distM} m`}</span><span>{formatClock(Math.round(r.seconds))}</span><span>{pace(r.paceMinKm)}</span>
        </div>
      ))}
    </div>
  );
}

export function SpeedUpsAndRecoveries({ view }: { view: MatchView }) {
  if (!view.hasDetail) return NO_DETAIL;
  return (
    <>
      <div className="tiles">
        <StatTile label="Speed-ups avg" value={`≈ ${pace(view.speedUpAvgMinKm)}`} />
        <StatTile label="Recover avg" value={`≈ ${pace(view.recoverAvgMinKm)}`} />
        <StatTile label="Best speed-up" value={`≈ ${pace(view.bestSpeedUpMinKm)}`} />
      </div>
      <div className="card table">
        <div className="tr th"><span>Phase</span><span>Time · Dist</span><span>Pace</span></div>
        {view.phaseRows.map((r, i) => (
          <div className="tr" key={i}>
            <span className={r.kind}>{PHASE_LABEL[r.kind]}</span>
            <span>{formatClock(Math.round(r.seconds))} · {r.distM} m</span>
            <span>{r.approx ? '≈ ' : ''}{pace(r.paceMinKm)}</span>
          </div>
        ))}
      </div>
      <p className="muted">≈ marks paces measured over less than a minute: GPS makes them approximate.</p>
    </>
  );
}
