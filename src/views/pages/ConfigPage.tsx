import { LEVELS, SLIDER, WARMUP_CHOICES } from '../../models/constants';
import type { Activity, Format, Level } from '../../models/constants';
import type { RunConfig } from '../../models/sessionModel';
import { ACTIVITY_LABEL, FORMAT_LABEL, LEVEL_LABEL, MESSAGES, SCREEN_TITLE, warmupLabel } from '../../models/vocabulary';
import ChoiceGroup from '../components/ChoiceGroup';

interface Props {
  config: RunConfig;
  soundEnabled: boolean;
  onActivityChange: (activity: Activity) => void;
  onModeChange: (mode: RunConfig['mode']) => void;
  onValueChange: (value: number) => void;
  onLevelChange: (level: Level) => void;
  onFormatChange: (format: Format) => void;
  onWarmupChange: (minutes: number | null) => void;
  onSimulationChange: (on: boolean) => void;
  onSoundChange: (on: boolean) => void;
  onGenerate: () => void;
  onBack: () => void;
}

export default function ConfigPage(props: Props) {
  const { config } = props;
  const s = SLIDER[config.activity][config.mode];
  const w = {
      max: 20,
      min: 0,
      step:1
  }
  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.config}</div>
      <h3>Activity</h3>
      <ChoiceGroup value={config.activity} options={['run', 'bike'] as const} label={(a) => ACTIVITY_LABEL[a]} onChange={props.onActivityChange} />

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

      <h3>Format</h3>
      <ChoiceGroup value={config.format} options={['intervals', 'steady'] as const} label={(f) => FORMAT_LABEL[f]} onChange={props.onFormatChange} />
      <div className="muted">
        {config.format === 'intervals' ? 'Alternate speed-ups and recoveries.' : 'One continuous, even effort: no speed-ups.'}
      </div>

      <h3>Warm-up</h3>
      <div>
        <ChoiceGroup value={config.warmupMin} options={WARMUP_CHOICES} label={warmupLabel} onChange={props.onWarmupChange} />
      </div>

      {/* <label>
        <input type="checkbox" checked={config.sim} onChange={(e) => props.onSimulationChange(e.target.checked)} />{' '}
        GPS simulation (test without going outside)
      </label>
      <br /> */}
      <label>
        <input type="checkbox" checked={props.soundEnabled} onChange={(e) => props.onSoundChange(e.target.checked)} />{' '}
        Sounds and vibration (vibration unavailable on iPhone)
      </label>
      <br />
      <br />
      <button className="big" onClick={props.onGenerate}>Generate game plan</button>
      <button onClick={props.onBack}>Back</button>
    </>
  );
}
