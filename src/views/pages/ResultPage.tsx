import type { RunResult } from '../../models/progressModel';
import { RESULT_TITLE, SCREEN_TITLE, TROPHIES } from '../../models/vocabulary';
import { formatClock, formatKm } from '../../utils/format';
import TrophyCard from '../components/TrophyCard';

interface Props { result: RunResult; newBadges: string[]; onShare: () => void; onViewMatch: () => void; onHome: () => void }

export default function ResultPage({ result, newBadges, onShare, onViewMatch, onHome }: Props) {
  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.result}</div>
      <h2>{result.completed ? RESULT_TITLE.completed : RESULT_TITLE.interrupted}</h2>
      <div className="card">
        Duration {formatClock(result.elapsed)}
        <br />
        Distance {formatKm(result.distM)} km ({result.source})
        <br />
        {result.format === 'intervals' && <>Speed-ups completed: {result.challenges}<br /></>}
        <b>+{result.xp} XP</b>
      </div>
      {newBadges.map((b) => (
        <TrophyCard key={b} prefix="Trophy: " name={TROPHIES[b].name} />
      ))}
      <button className="big" onClick={onShare}>Share</button>
      <button onClick={onViewMatch}>Match details</button>
      <button onClick={onHome}>Home</button>
    </>
  );
}
