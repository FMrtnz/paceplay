/** Small SVG chart: bars or a line over equally spaced points. `null` values are gaps. */
export default function MiniChart(props: {
  title: string; values: (number | null)[]; kind: 'bars' | 'line'; invert?: boolean;
  format: (n: number) => string; firstLabel: string; lastLabel: string;
}) {
  const W = 320, H = 120, PAD = 6;
  const nums = props.values.filter((v): v is number => v !== null);
  const max = nums.length ? Math.max(...nums) : 1, min = props.kind === 'line' && nums.length ? Math.min(...nums) : 0;
  const span = max - min || 1;
  const step = (W - 2 * PAD) / props.values.length;
  // `invert`: a lower value is better (pace), so it is drawn higher
  const y = (v: number) => {
    const t = (v - min) / span;
    return PAD + (props.invert ? t : 1 - t) * (H - 2 * PAD);
  };
  const points = props.values.map((v, i) => (v === null ? null : { x: PAD + step * (i + 0.5), y: y(v), v }));
  const path = points.reduce((d, p) => (p ? `${d}${d.endsWith('Z') || d === '' ? 'M' : 'L'}${p.x},${p.y}` : d + 'Z'), '').replace(/Z$/, '');

  return (
    <div className="card">
      <div className="chart-title">{props.title}</div>
      {nums.length === 0 ? <div className="muted">No data yet.</div> : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={props.title}>
          {props.kind === 'bars'
            ? points.map((p, i) => p && <rect key={i} x={p.x - step * 0.35} y={p.y} width={step * 0.7} height={H - PAD - p.y} rx="3" className="bar-fill" />)
            : <>
                <path d={path} fill="none" className="line-stroke" strokeWidth="2.5" strokeLinejoin="round" />
                {points.map((p, i) => p && <circle key={i} cx={p.x} cy={p.y} r="3.5" className="dot-fill" />)}
              </>}
        </svg>
      )}
      <div className="chart-axis"><span>{props.firstLabel}</span><span>{nums.length ? `best ${props.format(props.invert ? min : max)}` : ''}</span><span>{props.lastLabel}</span></div>
    </div>
  );
}
