import { PHASE_LABEL, PHASE_TIP } from '../../models/constants';
import type { RunView } from '../../controllers/useRunController';
import { formatClock, formatKm } from '../../utils/format';
import Snitch from '../components/Snitch';

/** Live session screen. Everything shown comes from the run controller. */
export default function RunPage({ run }: { run: RunView }) {
  const { phaseKind } = run;
  return (
    <div className="w">
      <div className="card">
        <Snitch P={run.progress} />
        <div className="bar"><i style={{ width: `${run.progress * 100}%` }} /></div>
      </div>

      <div className={phaseKind ?? undefined} style={{ textAlign: 'center', fontSize: '1.6em', fontWeight: 700 }}>
        {phaseKind ? PHASE_LABEL[phaseKind] : 'Free pace'}
      </div>
      <div className="muted" style={{ textAlign: 'center' }}>
        {phaseKind ? PHASE_TIP[phaseKind] : run.metersToGo !== null ? `${run.metersToGo} m to go` : ''}
      </div>
      <div className="big-n">{phaseKind ? formatClock(run.phaseTimeLeft) : '∞'}</div>

      <div className="card">
        Time {formatClock(run.elapsed)} / {formatClock(run.totalS)}
        <br />
        Distance: {formatKm(run.distM)} km {run.goalKm !== null ? `/ ${run.goalKm} km` : ''}{' '}
        <span className="muted">({run.sourceLabel} · reliability {run.quality})</span>
        {run.gpsNotice && <div style={{ color: '#ffb86b' }}>{run.gpsNotice}</div>}
      </div>

      <button className="big" onClick={run.togglePause}>{run.paused ? 'Resume' : 'Pause'}</button>
      <button style={{ width: '100%' }} onClick={run.endEarly}>End here (no penalty)</button>
      <p className="muted">Keep the screen on: Safari may suspend GPS in the background.</p>
    </div>
  );
}
