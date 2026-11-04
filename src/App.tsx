import { useEffect, useRef, useState } from 'react';
import { buildPlan, phaseAt, renderTrack, totalSeconds, type Params, type Phase } from './fartlek';

type Mode = 'playback' | 'transient' | 'ambient'; // the audio session type used for the beep track
type Settings = Params & { mode: Mode };
const MODES: [Mode, string][] = [
  ['playback', 'Beeps with screen locked (music pauses)'],
  ['transient', 'TEST: beeps with screen locked, mixed with music'],
  ['ambient', 'Music keeps playing (screen stays on)'],
];
const LABEL = { warmup: 'Warm-up', intense: 'GO! Intense', recovery: 'Recover' } as const;
const KEY = 'fartlek:settings3';
const DEFAULTS: Settings = { warmupMin: 20, fartlekMin: 10, mode: 'playback' };
const mmss = (s: number) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const load = (): Settings => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return DEFAULTS; } };

/** Keeps the screen on, asking again each time the app comes back to the front (the browser drops the lock when hidden). */
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on) return;
    let lock: any, stop = false;
    const get = () => (navigator as any).wakeLock?.request('screen').then((l: any) => { if (stop) l.release(); else lock = l; }).catch(() => {});
    const vis = () => { if (document.visibilityState === 'visible') get(); };
    get();
    document.addEventListener('visibilitychange', vis);
    return () => { stop = true; document.removeEventListener('visibilitychange', vis); lock?.release?.(); };
  }, [on]);
}

function Setup({ msg, onStart }: { msg: string; onStart: (s: Settings) => void }) {
  const [s, setS] = useState(load);
  const num = (k: 'warmupMin' | 'fartlekMin', label: string, unit: string) => (
    <label className="row">{label}
      <span><input type="number" inputMode="numeric" min={0} value={s[k]} onChange={(e) => setS({ ...s, [k]: Math.max(0, Number(e.target.value) || 0) })} /> {unit}</span>
    </label>
  );
  return (
    <main>
      <h1>Fartlek</h1>
      {msg && <p className="ok">{msg}</p>}
      {num('warmupMin', 'Warm-up', 'min')}
      {num('fartlekMin', 'Fartlek', 'min')}
      <label className="row">Sound
        <select value={s.mode} onChange={(e) => setS({ ...s, mode: e.target.value as Mode })}>
          {MODES.map(([m, label]) => <option key={m} value={m}>{label}</option>)}
        </select>
      </label>
      <p className="muted">Total {mmss((s.warmupMin + s.fartlekMin) * 60)} · the fartlek efforts and recoveries are drawn at random when you start</p>
      <button className="go" disabled={!s.fartlekMin} onClick={() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} onStart(s); }}>Start</button>
    </main>
  );
}

function Run({ audio, plan, mode, onExit }: { audio: HTMLAudioElement; plan: Phase[]; mode: Mode; onExit: (done: boolean) => void }) {
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  const [askedAt, setAskedAt] = useState<number | null>(null);
  const total = totalSeconds(plan);
  useWakeLock(mode === 'ambient'); // a mixed (ambient) sound is muted when the screen locks, so keep it on
  useEffect(() => { // the audio track is the clock: the screen only reads its position
    const id = setInterval(() => setT(audio.currentTime), 250);
    const end = () => onExit(true), pause = () => setPaused(true), play = () => setPaused(false);
    audio.addEventListener('ended', end); audio.addEventListener('pause', pause); audio.addEventListener('play', play);
    return () => { clearInterval(id); audio.removeEventListener('ended', end); audio.removeEventListener('pause', pause); audio.removeEventListener('play', play); };
  }, [audio]);
  useEffect(() => {
    if (askedAt === null) return;
    const id = setTimeout(() => setAskedAt(null), 6000);
    return () => clearTimeout(id);
  }, [askedAt]);
  const cur = phaseAt(plan, t);
  return (
    <main className={`run ${cur?.phase.kind ?? 'recovery'}`}>
      <div className="top"><b>{mmss(t)}</b> / {mmss(total)}</div>
      <div className="mid">
        <div className="label">{cur ? LABEL[cur.phase.kind] : 'Done'}</div>
        <div className="big">{mmss(cur ? cur.left : 0)}</div>
      </div>
      <div className="bar"><i style={{ width: `${Math.min(100, (t / total) * 100)}%` }} /></div>
      <div className="muted">Step {cur ? cur.index + 1 : plan.length}/{plan.length}</div>
      <button onClick={() => (paused ? audio.play() : audio.pause())}>{paused ? 'Resume' : 'Pause'}</button>
      {askedAt === null ? (
        <button className="quiet" onClick={() => setAskedAt(Date.now())}>End session</button>
      ) : (
        <div className="ask">
          <b>End this session now?</b>
          <button className="go" onClick={() => setAskedAt(null)}>Keep going</button>
          <button className="quiet" onClick={() => { if (Date.now() - askedAt > 800) onExit(false); }}>Yes, end it</button>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const [run, setRun] = useState<{ audio: HTMLAudioElement; plan: Phase[]; mode: Mode; url: string } | null>(null);
  const [msg, setMsg] = useState('');
  const runRef = useRef(run);
  runRef.current = run;

  // Everything that needs the tap (sound unlock) happens here, inside the Start click.
  function start(s: Settings) {
    const plan = buildPlan(s);
    const url = URL.createObjectURL(new Blob([renderTrack(plan)], { type: 'audio/wav' }));
    const audio = new Audio(url);
    try { (navigator as any).audioSession.type = s.mode; } catch {}
    audio.play().catch(() => {});
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'Fartlek', artist: 'Intervals' });
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    } catch {}
    setMsg('');
    setRun({ audio, plan, mode: s.mode, url });
  }
  function exit(done: boolean) {
    const r = runRef.current;
    if (r) { r.audio.pause(); URL.revokeObjectURL(r.url); }
    try { navigator.mediaSession.metadata = null; } catch {}
    setMsg(done ? 'Session complete. Well done!' : '');
    setRun(null);
  }
  return run ? <Run audio={run.audio} plan={run.plan} mode={run.mode} onExit={exit} /> : <Setup msg={msg} onStart={start} />;
}
