import type { Plan } from '../../models/planModel';
import type { RunConfig } from '../../models/sessionModel';
import { SCREEN_TITLE } from '../../models/vocabulary';
import { formatClock } from '../../utils/format';
import PhaseList from '../components/PhaseList';

export default function PreviewPage(props: {
  plan: Plan;
  config: RunConfig;
  repeated: boolean;
  onStart: () => void;
  onAnother: () => void;
  onBack: () => void;
}) {
  const { plan, config } = props;
  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.preview}</div>
      <div className="card">
        Duration {formatClock(plan.total)} · {plan.n} speed-ups · ≈ {plan.distKm.toFixed(2)} km (estimate)
        {config.mode === 'dist' && <><br />Goal: {config.val} km measured by GPS</>}
        {props.repeated && (
          <div className="muted">All recent variants have been played: this game plan was already seen.</div>
        )}
      </div>
      <PhaseList phases={plan.phases} />
      <button className="big" onClick={props.onStart}>Go</button>
      <button onClick={props.onAnother}>Another game plan</button>
      <button onClick={props.onBack}>Back</button>
    </>
  );
}
