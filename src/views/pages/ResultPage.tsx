import { BADGES } from '../../models/constants';
import type { RunResult } from '../../models/progressModel';
import { formatClock, formatKm } from '../../utils/format';
import BadgeCard from '../components/BadgeCard';

export default function ResultPage({ result, newBadges, onHome }: { result: RunResult; newBadges: string[]; onHome: () => void }) {
  return (
    <>
      <h2>{result.completed ? 'Snitch caught!' : 'Mission interrupted'}</h2>
      <div className="card">
        Duration {formatClock(result.elapsed)}
        <br />
        Distance {formatKm(result.distM)} km ({result.source})
        <br />
        Challenges completed: {result.challenges}
        <br />
        <b>+{result.xp} XP</b>
      </div>
      {newBadges.map((b) => (
        <BadgeCard key={b} prefix="Badge: " name={BADGES[b]} />
      ))}
      <button className="big" onClick={onHome}>Home</button>
    </>
  );
}
