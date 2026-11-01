export default function HomePage({ summary, onStart, onProgress }: { summary: { xp: number; sessionCount: number; badgeCount: number }; onStart: () => void; onProgress: () => void }) {
  return (
    <>
      <p>
        Catch the golden Snitch by alternating accelerations and recoveries. Walking, slowing down or
        stopping never costs you points.
      </p>
      <div className="card">
        XP: <b>{summary.xp}</b> · Sessions: {summary.sessionCount} · Badges: {summary.badgeCount}
      </div>
      <button className="big" onClick={onStart}>Start a mission</button>
      <button onClick={onProgress}>Progress</button>
    </>
  );
}
