/** Pennant-shaped icon: gold when earned, grey when locked. */
function Pennant({ earned }: { earned: boolean }) {
  return (
    <svg viewBox="0 0 40 48" width="34" height="42" aria-hidden="true">
      <path d="M8 4v42" stroke={earned ? '#f2c14e' : '#56608f'} strokeWidth="3" strokeLinecap="round" />
      <path d="M10 6l26 9-26 9z" fill={earned ? '#e0524a' : '#2a3158'} stroke={earned ? '#f2c14e' : '#56608f'} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** One trophy. `prefix` lets the result page say "Trophy: …". */
export default function TrophyCard({ name, hint, earned = true, prefix = '' }: { name: string; hint?: string; earned?: boolean; prefix?: string }) {
  return (
    <div className={`card trophy${earned ? '' : ' locked'}`}>
      <Pennant earned={earned} />
      <div>
        <b>{prefix}{name}</b>
        {hint && <div className="muted">{hint}</div>}
      </div>
    </div>
  );
}
