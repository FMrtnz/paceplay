import { useEffect, useRef, useState } from 'react';
import { LEVELS, Level, Plan, Kind, pickPlan, durationForDistance } from './core/plan';
import { Clock, elapsedS, locate, pause, resume } from './core/session';
import { Tracker, watch, Fix } from './services/gps';
import { simulate } from './services/simulator';
import { load, save, Store, Result, Cfg, saveActive, loadActive, clearActive } from './services/storage';
import { computeXp, earnedBadges, BADGES } from './game/rewards';
import { stepsStatus } from './services/steps';
import { beep, vibrate, unlockAudio, soundOn, setSound } from './services/feedback';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const PHASE_LABEL: Record<Kind, string> = {
  warmup: 'Warm-up',
  accel: 'Speed up',
  recover: 'Recover',
  cooldown: 'Cool-down',
};

const PHASE_TIP: Record<Kind, string> = {
  warmup: 'Walk or jog gently',
  accel: 'Controlled effort, at your own pace',
  recover: 'Slow down or walk',
  cooldown: 'Easy pace',
};

// Slider settings (change the limits here)
const SLIDER = {
  time: { min: 10, max: 120, step: 1, unit: 'min', start: 20 },
  dist: { min: 1, max: 42, step: 0.5, unit: 'km', start: 3 },
};

type Screen = 'home' | 'conf' | 'prev' | 'run' | 'res' | 'prog';

/** Raw result returned by the run screen. */
interface RunOutcome {
  completed: boolean;
  elapsed: number;
  distM: number;
  challenges: number;
  P: number;
  source: string;
}

const mmss = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function Snitch({ P }: { P: number }) {
  const x = 40 + (1 - P) * 120;
  const y = 30 + 6 * Math.sin(P * 40);
  return (
    <svg viewBox="0 0 200 70" width="100%">
      <circle cx="20" cy="45" r="8" fill="#7fd1ff" />
      <g transform={`translate(${x} ${y})`}>
        <ellipse className="wing" cx="-14" cy="-4" rx="12" ry="5" fill="#fff8" />
        <ellipse className="wing" cx="14" cy="-4" rx="12" ry="5" fill="#fff8" />
        <circle r="9" fill="#f5c542" />
      </g>
    </svg>
  );
}

/** Button group for choosing one value among several. */
function Choice<T extends string | number>(props: {
  value: T;
  options: T[];
  label: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      {props.options.map((o) => (
        <button
          key={String(o)}
          className={o === props.value ? 'on' : ''}
          onClick={() => props.onChange(o)}
        >
          {props.label(o)}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Run screen                                                          */
/* ------------------------------------------------------------------ */

function Run({ plan, cfg, onEnd }: { plan: Plan; cfg: Cfg; onEnd: (o: RunOutcome) => void }) {
  // Resume after a reload: read back the saved session
  const saved = useRef(loadActive()).current;
  const clock = useRef<Clock>(saved?.clock ?? { startedAt: Date.now(), pausedMs: 0, pausedAt: null });
  const tracker = useRef(new Tracker(saved?.dist ?? 0));
  const lastFixAt = useRef(Date.now());
  const finished = useRef(false);
  const [, refresh] = useState(0);
  const [gpsMessage, setGpsMessage] = useState('');

  // Values recomputed on every refresh (time comes from timestamps)
  const now = Date.now();
  const elapsed = elapsedS(clock.current, now);
  const position = locate(plan, elapsed);
  const phase = plan.phases[position.i];
  const distM = tracker.current.dist;
  const targetM = cfg.mode === 'dist' ? cfg.val * 1000 : 0;
  const progress = Math.min(1, Math.max(elapsed / plan.total, targetM ? distM / targetM : 0));
  const paused = !!clock.current.pausedAt;
  const signalLost = !paused && now - lastFixAt.current > 15000 && !gpsMessage;

  function endRun(completed: boolean) {
    if (finished.current) return;
    finished.current = true;
    clearActive();
    if (completed) {
      beep('capture');
      vibrate([200, 100, 200, 100, 400]);
    }
    // Challenges = fully completed accelerations
    let cumul = 0;
    let challenges = 0;
    for (const p of plan.phases) {
      cumul += p.dur;
      if (p.kind === 'accel' && cumul <= elapsed) challenges++;
    }
    onEnd({
      completed,
      elapsed: Math.round(elapsed),
      distM: Math.round(distM),
      challenges,
      P: progress,
      source: cfg.sim ? 'simulation' : 'GPS',
    });
  }

  function togglePause() {
    unlockAudio();
    const t = Date.now();
    clock.current = paused ? resume(clock.current, t) : pause(clock.current, t);
    refresh((x) => x + 1);
  }

  // Display loop + saving + end-of-run check
  useEffect(() => {
    const id = setInterval(() => {
      refresh((x) => x + 1);
      saveActive({ plan, cfg, clock: clock.current, dist: tracker.current.dist });
      const t = elapsedS(clock.current, Date.now());
      const reached = targetM ? tracker.current.dist >= targetM : t >= plan.total;
      if (reached) endRun(true);
    }, 250);
    return () => clearInterval(id);
  });

  // Position source: real GPS or simulation
  useEffect(() => {
    const onFix = (f: Fix) => {
      if (clock.current.pausedAt) return;
      lastFixAt.current = Date.now();
      tracker.current.add(f);
    };
    return cfg.sim ? simulate(onFix) : watch(onFix, setGpsMessage);
  }, []);

  // Keep the screen on when the browser allows it
  useEffect(() => {
    let lock: any;
    try {
      (navigator as any).wakeLock?.request('screen').then((l: any) => (lock = l)).catch(() => {});
    } catch {}
    return () => {
      try { lock?.release(); } catch {}
    };
  }, []);

  // Sound + voice prompt at each phase change
  useEffect(() => {
    if (!phase) return;
    beep(phase.kind === 'accel' ? 'up' : 'down');
    try {
      const say = new SpeechSynthesisUtterance(`${PHASE_LABEL[phase.kind]}. ${PHASE_TIP[phase.kind]}`);
      say.lang = 'en-US';
      speechSynthesis.speak(say);
    } catch {}
  }, [position.i]);

  return (
    <div className="w">
      <div className="card">
        <Snitch P={progress} />
        <div className="bar"><i style={{ width: `${progress * 100}%` }} /></div>
      </div>

      <div className={phase?.kind} style={{ textAlign: 'center', fontSize: '1.6em', fontWeight: 700 }}>
        {phase ? PHASE_LABEL[phase.kind] : 'Free pace'}
      </div>
      <div className="muted" style={{ textAlign: 'center' }}>
        {phase ? PHASE_TIP[phase.kind] : targetM ? `${Math.max(0, Math.round(targetM - distM))} m to go` : ''}
      </div>
      <div className="big-n">{phase ? mmss(position.left) : '∞'}</div>

      <div className="card">
        Time {mmss(elapsed)} / {mmss(plan.total)}
        <br />
        Distance: {(distM / 1000).toFixed(2)} km {targetM ? `/ ${cfg.val} km` : ''}{' '}
        <span className="muted">
          ({cfg.sim ? 'simulation' : 'GPS'} · reliability {tracker.current.quality()})
        </span>
        {(gpsMessage || signalLost) && (
          <div style={{ color: '#ffb86b' }}>
            {gpsMessage || 'GPS signal lost: distance is paused, the timer keeps running.'}
          </div>
        )}
      </div>

      <button className="big" onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button>
      <button style={{ width: '100%' }} onClick={() => endRun(false)}>End here (no penalty)</button>
      <p className="muted">Keep the screen on: Safari may suspend GPS in the background.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Other screens                                                       */
/* ------------------------------------------------------------------ */

function HomeScreen({ store, onStart, onProgress }: { store: Store; onStart: () => void; onProgress: () => void }) {
  return (
    <>
      <p>
        Catch the golden Snitch by alternating accelerations and recoveries. Walking, slowing down or
        stopping never costs you points.
      </p>
      <div className="card">
        XP: <b>{store.xp}</b> · Sessions: {store.history.length} · Badges: {store.badges.length}
      </div>
      <button className="big" onClick={onStart}>Start a mission</button>
      <button onClick={onProgress}>Progress</button>
    </>
  );
}

function ConfigScreen(props: {
  cfg: Cfg;
  setCfg: (c: Cfg) => void;
  sound: boolean;
  setSoundState: (on: boolean) => void;
  onCompute: () => void;
  onBack: () => void;
}) {
  const { cfg, setCfg } = props;
  const s = SLIDER[cfg.mode];

  return (
    <>
      <h3>Goal</h3>
      <Choice
        value={cfg.mode}
        options={['time', 'dist'] as const}
        label={(m) => (m === 'time' ? 'Duration' : 'Distance')}
        onChange={(m) => setCfg({ ...cfg, mode: m, val: SLIDER[m].start })}
      />
      <div className="card">
        <b>{cfg.val} {s.unit}</b>
        <input
          type="range"
          min={s.min}
          max={s.max}
          step={s.step}
          value={cfg.val}
          onChange={(e) => setCfg({ ...cfg, val: Number(e.target.value) })}
        />
        <span className="muted">From {s.min} to {s.max} {s.unit}</span>
      </div>

      <h3>Level</h3>
      <Choice
        value={cfg.level}
        options={Object.keys(LEVELS) as Level[]}
        label={(l) => LEVELS[l].label}
        onChange={(l) => setCfg({ ...cfg, level: l })}
      />

      <div className="card muted">
        GPS: requested only during the session (distance is measured, reliability is shown).
        <br />
        Steps: unavailable — {stepsStatus.reason}
        <br />
        Fallback: duration mode.
      </div>

      <label>
        <input type="checkbox" checked={cfg.sim} onChange={(e) => setCfg({ ...cfg, sim: e.target.checked })} />{' '}
        GPS simulation (test without going outside)
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={props.sound}
          onChange={(e) => {
            props.setSoundState(e.target.checked);
            setSound(e.target.checked);
          }}
        />{' '}
        Sounds and vibration (vibration unavailable on iPhone)
      </label>
      <br />
      <br />
      <button className="big" onClick={props.onCompute}>Generate session</button>
      <button onClick={props.onBack}>Back</button>
    </>
  );
}

function PreviewScreen(props: {
  plan: Plan;
  cfg: Cfg;
  repeated: boolean;
  onStart: () => void;
  onAnother: () => void;
  onBack: () => void;
}) {
  const { plan, cfg } = props;
  return (
    <>
      <div className="card">
        Duration {mmss(plan.total)} · {plan.n} accelerations · ≈ {plan.distKm.toFixed(2)} km (estimate)
        {cfg.mode === 'dist' && <><br />Goal: {cfg.val} km measured by GPS</>}
        {props.repeated && (
          <div className="muted">All recent variants have been played: this session was already seen.</div>
        )}
      </div>
      <div className="card" style={{ maxHeight: '40vh', overflow: 'auto' }}>
        {plan.phases.map((p, i) => (
          <div key={i} className={p.kind}>{PHASE_LABEL[p.kind]} — {mmss(p.dur)}</div>
        ))}
      </div>
      <button className="big" onClick={props.onStart}>Go</button>
      <button onClick={props.onAnother}>Another session</button>
      <button onClick={props.onBack}>Back</button>
    </>
  );
}

function ResultScreen({ result, newBadges, onHome }: { result: Result; newBadges: string[]; onHome: () => void }) {
  return (
    <>
      <h2>{result.completed ? 'Snitch caught!' : 'Mission interrupted'}</h2>
      <div className="card">
        Duration {mmss(result.elapsed)}
        <br />
        Distance {(result.distM / 1000).toFixed(2)} km ({result.source})
        <br />
        Challenges completed: {result.challenges}
        <br />
        <b>+{result.xp} XP</b>
      </div>
      {newBadges.map((b) => (
        <div key={b} className="card">🏅 Badge: {BADGES[b]}</div>
      ))}
      <button className="big" onClick={onHome}>Home</button>
    </>
  );
}

function ProgressScreen({ store, onBack }: { store: Store; onBack: () => void }) {
  return (
    <>
      <div className="card">Total XP: <b>{store.xp}</b></div>
      <h3>Badges</h3>
      {Object.entries(BADGES).map(([id, name]) => (
        <div key={id} className="card" style={{ opacity: store.badges.includes(id) ? 1 : 0.4 }}>🏅 {name}</div>
      ))}
      <h3>History</h3>
      {[...store.history].reverse().slice(0, 15).map((h, i) => (
        <div key={i} className="card muted">
          {new Date(h.date).toLocaleDateString()} · {mmss(h.elapsed)} · {(h.distM / 1000).toFixed(1)} km · +{h.xp} XP{' '}
          {h.completed ? '✓' : '(interrupted)'}
        </div>
      ))}
      <button onClick={onBack}>Back</button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Application                                                         */
/* ------------------------------------------------------------------ */

export default function App() {
  const [store, setStore] = useState<Store>(load);
  const [cfg, setCfg] = useState<Cfg>({ mode: 'time', val: SLIDER.time.start, level: store.level, sim: false });
  const [screen, setScreen] = useState<Screen>('home');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [repeated, setRepeated] = useState(false);
  const [sound, setSoundState] = useState(soundOn());
  const [last, setLast] = useState<{ result: Result; newBadges: string[] } | null>(null);

  // Session interrupted by a reload: resume it
  useEffect(() => {
    const active = loadActive();
    if (active) {
      setCfg(active.cfg);
      setPlan(active.plan);
      setScreen('run');
    }
  }, []);

  /** Generates a session that avoids the last 20 signatures. */
  function computePlan(seed: number) {
    const totalS = cfg.mode === 'time' ? cfg.val * 60 : durationForDistance(cfg.val, cfg.level);
    const recent = store.history.slice(-20).map((h) => h.sig);
    try {
      const r = pickPlan(totalS, cfg.level, seed, recent);
      setPlan(r.plan);
      setRepeated(r.repeated);
      setScreen('prev');
    } catch (e: any) {
      alert(e.message);
    }
  }

  function startRun() {
    unlockAudio();
    clearActive();
    setScreen('run');
  }

  /** Computes XP and badges, saves, shows the result. */
  function finishRun(o: RunOutcome) {
    const t = Date.now();
    const weekCount = store.history.filter((h) => h.completed && t - h.date < 6048e5).length + (o.completed ? 1 : 0);
    const week3 = o.completed && weekCount === 3;
    const xp = computeXp({ ...o, allRecover: o.completed, week3 });

    const result: Result = {
      date: t, mode: cfg.mode, level: cfg.level, completed: o.completed,
      elapsed: o.elapsed, distM: o.distM, source: o.source, challenges: o.challenges,
      xp, sig: plan!.sig, P: o.P,
    };
    const history = [...store.history, result];
    const badges = earnedBadges(history, week3 || store.badges.includes('w3'));
    const next: Store = { ...store, xp: store.xp + xp, history, badges, seed: plan!.seed + 1, level: cfg.level };

    save(next);
    setStore(next);
    setLast({ result, newBadges: badges.filter((b) => !store.badges.includes(b)) });
    setScreen('res');
  }

  if (screen === 'run' && plan) return <Run plan={plan} cfg={cfg} onEnd={finishRun} />;

  return (
    <div className="w">
      <h1>PACEPLAY</h1>
      {screen === 'home' && (
        <HomeScreen store={store} onStart={() => setScreen('conf')} onProgress={() => setScreen('prog')} />
      )}
      {screen === 'conf' && (
        <ConfigScreen
          cfg={cfg} setCfg={setCfg} sound={sound} setSoundState={setSoundState}
          onCompute={() => computePlan(store.seed)} onBack={() => setScreen('home')}
        />
      )}
      {screen === 'prev' && plan && (
        <PreviewScreen
          plan={plan} cfg={cfg} repeated={repeated}
          onStart={startRun} onAnother={() => computePlan(plan.seed + 1)} onBack={() => setScreen('conf')}
        />
      )}
      {screen === 'res' && last && (
        <ResultScreen result={last.result} newBadges={last.newBadges} onHome={() => setScreen('home')} />
      )}
      {screen === 'prog' && <ProgressScreen store={store} onBack={() => setScreen('home')} />}
    </div>
  );
}