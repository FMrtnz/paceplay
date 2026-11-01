import type { Phase } from '../../models/planModel';
import { PHASE_LABEL } from '../../models/constants';
import { formatClock } from '../../utils/format';

/** Scrollable list of the phases of a plan. */
export default function PhaseList({ phases }: { phases: Phase[] }) {
  return (
    <div className="card" style={{ maxHeight: '40vh', overflow: 'auto' }}>
      {phases.map((p, i) => (
        <div key={i} className={p.kind}>{PHASE_LABEL[p.kind]} — {formatClock(p.dur)}</div>
      ))}
    </div>
  );
}
