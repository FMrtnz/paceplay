import type { DayCell } from '../../models/statsModel';
import { formatKm, formatShortDate } from '../../utils/format';

/** Heatmap of the last 16 weeks: one square per day, darker = further. */
export default function CalendarPanel({ grid, streak }: { grid: DayCell[][]; streak: number }) {
  return (
    <div className="card">
      <div className="chart-title">Week streak: <b>{streak}</b> {streak === 1 ? 'week' : 'weeks'}</div>
      <div className="heatmap">
        {grid.flat().map((c) => (
          <div key={c.date} className={`cell l${c.level}${c.future ? ' future' : ''}`} title={`${formatShortDate(c.date)}: ${formatKm(c.distM, 1)} km`} />
        ))}
      </div>
      <div className="heat-legend muted">Less {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`cell l${l}`} />)} More</div>
    </div>
  );
}
