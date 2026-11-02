import { useEffect, useState } from 'react';
import { EFFORT_LABEL, END_RUN, PHASE_LABEL, PHASE_TIP, SCREEN_TITLE } from '../../models/vocabulary';
import type { RunView } from '../../controllers/useRunController';
import { formatClock, formatEffort, formatKm } from '../../utils/format';
import Snitch from '../components/Snitch';

/** Live session screen. Everything shown comes from the run controller. */
export default function RunPage({ run }: { run: RunView }) {
  const { phaseKind } = run;
  // Two-step end: the first tap only asks; the question disappears by itself after 6 s,
  // and "Yes" ignores taps in the first 0.8 s so a double tap cannot confirm by accident.
  const [askedAt, setAskedAt] = useState<number | null>(null);
  useEffect(() => {
    if (askedAt === null) return;
    const id = setTimeout(() => setAskedAt(null), 6000);
    return () => clearTimeout(id);
  }, [askedAt]);
  const confirmEnd = () => {
    if (askedAt !== null && Date.now() - askedAt > 800) run.endEarly();
  };
  return (
    <div className="w">
      <div className="eyebrow">{SCREEN_TITLE.run}</div>
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
        <br />
        {EFFORT_LABEL[run.activity].now}: <b>{formatEffort(run.paceNowMinKm, run.activity)}</b> · avg {formatEffort(run.paceAvgMinKm, run.activity)}
        {run.gpsNotice && <div style={{ color: '#ffb86b' }}>{run.gpsNotice}</div>}
      </div>

      <button className="big" onClick={run.togglePause}>{run.paused ? 'Resume' : 'Pause'}</button>
      {askedAt === null ? (
        <button style={{ width: '100%' }} onClick={() => setAskedAt(Date.now())}>{END_RUN.button}</button>
      ) : (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{END_RUN.ask}</div>
          <button className="big" onClick={() => setAskedAt(null)}>{END_RUN.keep}</button>
          <button style={{ width: '100%' }} onClick={confirmEnd}>{END_RUN.confirm}</button>
        </div>
      )}
      <p className="muted">Keep the screen on: Safari may suspend GPS in the background.</p>
    </div>
  );
}
