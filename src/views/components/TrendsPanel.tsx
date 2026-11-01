import type { WeekStat } from '../../models/statsModel';
import { formatPace, formatShortDate } from '../../utils/format';
import MiniChart from './MiniChart';

/** Weekly distance and average pace over the last 12 weeks. */
export default function TrendsPanel({ weekly }: { weekly: WeekStat[] }) {
  const first = formatShortDate(weekly[0].weekStart), last = formatShortDate(weekly[weekly.length - 1].weekStart);
  return (
    <>
      <MiniChart title="Distance per week (km)" kind="bars" values={weekly.map((w) => w.distM / 1000)}
        format={(n) => `${n.toFixed(1)} km`} firstLabel={first} lastLabel={last} />
      <MiniChart title="Average pace per week (higher = faster)" kind="line" invert values={weekly.map((w) => w.paceMinKm)}
        format={(n) => `${formatPace(n)} /km`} firstLabel={first} lastLabel={last} />
    </>
  );
}
