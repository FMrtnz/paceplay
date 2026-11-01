import type { Best, Records } from '../../models/recordsModel';
import { formatDate, formatKm, formatPace, formatShortDate } from '../../utils/format';
import StatTile from './StatTile';

/** Personal bests. Paces over a short speed-up are approximate (≈). */
export default function RecordsBoard({ records }: { records: Records }) {
  const tile = (label: string, best: Best | null, show: (n: number) => string, hint = formatDate) =>
    <StatTile label={label} value={best ? show(best.value) : '—'} hint={best ? hint(best.date) : 'No data yet'} />;
  return (
    <div className="tiles">
      {tile('Fastest km', records.fastestKmMinKm, (n) => `${formatPace(n)} /km`)}
      {tile('Fastest speed-up', records.fastestSpeedUpMinKm, (n) => `≈ ${formatPace(n)} /km`)}
      {tile('Longest match', records.longestRunM, (n) => `${formatKm(n)} km`)}
      {tile('Most speed-ups', records.mostSpeedUps, (n) => String(n))}
      {tile('Best week', records.bestWeekM, (n) => `${formatKm(n, 1)} km`, (d) => `Week of ${formatShortDate(d)}`)}
    </div>
  );
}
