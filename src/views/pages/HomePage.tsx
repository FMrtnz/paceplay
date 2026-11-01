import { SCREEN_TITLE } from '../../models/vocabulary';

export default function HomePage({ summary, onStart }: { summary: { xp: number; matchCount: number; trophyCount: number; streak: number }; onStart: () => void }) {
  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.home}</div>
      <p>
        Catch the golden Snitch by alternating accelerations and recoveries. Walking, slowing down or
        stopping never costs you points.
      </p>
      <div className="card">
        XP: <b>{summary.xp}</b> · Matches: {summary.matchCount} · Trophies: {summary.trophyCount}
        {summary.streak > 0 && <> · Streak: {summary.streak} {summary.streak === 1 ? 'week' : 'weeks'}</>}
      </div>
      <button className="big" onClick={onStart}>Start a match</button>
    </>
  );
}
