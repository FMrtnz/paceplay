import type { MonthGroup } from '../../models/statsModel';
import { formatClock, formatDate, formatKm } from '../../utils/format';

/** Every match, grouped by month. Tap a match to open it; each row can be deleted. */
export default function MatchLog({ groups, onOpen, onDelete }: { groups: MonthGroup[]; onOpen: (date: number) => void; onDelete: (date: number) => void }) {
  if (groups.length === 0) return <div className="card muted">No matches yet. Start your first one from the Locker Room.</div>;
  return (
    <>
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="month">{g.label} <span className="muted">· {g.runs.length} · {formatKm(g.distM, 1)} km</span></h3>
          {g.runs.map((r) => (
            <div key={r.date} className="card match-row">
              <button className="row-open" onClick={() => onOpen(r.date)} aria-label={`Open match of ${formatDate(r.date)}`}>
                {formatDate(r.date)} · {formatClock(r.elapsed)} · {formatKm(r.distM, 1)} km · +{r.xp} XP{' '}
                {r.completed ? '✓' : '(interrupted)'}
              </button>
              <button className="row-delete" aria-label="Delete this match" onClick={() => onDelete(r.date)}>Delete</button>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
