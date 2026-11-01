import { BADGES } from '../../models/constants';
import type { RunResult } from '../../models/progressModel';
import { formatClock, formatDate, formatKm } from '../../utils/format';
import BadgeCard from '../components/BadgeCard';

export default function ProgressPage({ xp, earnedBadgeIds, recentRuns, onBack }: { xp: number; earnedBadgeIds: string[]; recentRuns: RunResult[]; onBack: () => void }) {
  return (
    <>
      <div className="card">Total XP: <b>{xp}</b></div>
      <h3>Badges</h3>
      {Object.entries(BADGES).map(([id, name]) => (
        <BadgeCard key={id} name={name} opacity={earnedBadgeIds.includes(id) ? 1 : 0.4} />
      ))}
      <h3>History</h3>
      {recentRuns.map((h, i) => (
        <div key={i} className="card muted">
          {formatDate(h.date)} · {formatClock(h.elapsed)} · {formatKm(h.distM, 1)} km · +{h.xp} XP{' '}
          {h.completed ? '✓' : '(interrupted)'}
        </div>
      ))}
      <button onClick={onBack}>Back</button>
    </>
  );
}
