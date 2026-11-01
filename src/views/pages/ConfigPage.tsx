import { LEVELS, SLIDER } from '../../models/constants';
import { LEVEL_LABEL, MESSAGES, SCREEN_TITLE } from '../../models/vocabulary';
import type { Level } from '../../models/constants';
import type { RunConfig } from '../../models/sessionModel';
import ChoiceGroup from '../components/ChoiceGroup';

export default function ConfigPage(props: {
  config: RunConfig;
  soundEnabled: boolean;
  onModeChange: (mode: RunConfig['mode']) => void;
  onValueChange: (value: number) => void;
  onLevelChange: (level: Level) => void;
  onSimulationChange: (on: boolean) => void;
  onSoundChange: (on: boolean) => void;
  onGenerate: () => void;
  onBack: () => void;
}) {
  const { config } = props;
  const s = SLIDER[config.mode];

  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.config}</div>
      <h3>Goal</h3>
      <ChoiceGroup
        value={config.mode}
        options={['time', 'dist'] as const}
        label={(m) => (m === 'time' ? 'Duration' : 'Distance')}
        onChange={props.onModeChange}
      />
      <div className="card">
        <b>{config.val} {s.unit}</b>
        <input
          type="range"
          min={s.min}
          max={s.max}
          step={s.step}
          value={config.val}
          onChange={(e) => props.onValueChange(Number(e.target.value))}
        />
        <span className="muted">From {s.min} to {s.max} {s.unit}</span>
      </div>

      <h3>Level</h3>
      <ChoiceGroup
        value={config.level}
        options={Object.keys(LEVELS) as Level[]}
        label={(l) => LEVEL_LABEL[l]}
        onChange={props.onLevelChange}
      />

      <div className="card muted">
        GPS: requested only during the session (distance is measured, reliability is shown).
        <br />
        Steps: unavailable — {MESSAGES.stepsUnavailable}
        <br />
        Fallback: duration mode.
      </div>

      <label>
        <input type="checkbox" checked={config.sim} onChange={(e) => props.onSimulationChange(e.target.checked)} />{' '}
        GPS simulation (test without going outside)
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={props.soundEnabled}
          onChange={(e) => {
            props.onSoundChange(e.target.checked);
          }}
        />{' '}
        Sounds and vibration (vibration unavailable on iPhone)
      </label>
      <br />
      <br />
      <button className="big" onClick={props.onGenerate}>Generate game plan</button>
      <button onClick={props.onBack}>Back</button>
    </>
  );
}
