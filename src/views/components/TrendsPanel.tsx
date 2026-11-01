import type { WeekStat } from '../../models/statsModel';
import type { Activity } from '../../models/constants';
import { formatEffort, formatShortDate, kmhFromPace } from '../../utils/format';
import MiniChart from './MiniChart';

/** Weekly distance and average pace over the last 12 weeks. */
export default function TrendsPanel({ weekly, activity }: { weekly: WeekStat[]; activity: Activity }) {
  const first = formatShortDate(weekly[0].weekStart), last = formatShortDate(weekly[weekly.length - 1].weekStart);
  return (
    <>
      <MiniChart title="Distance per week (km)" kind="bars" values={weekly.map((w) => w.distM / 1000)}
        format={(n) => `${n.toFixed(1)} km`} firstLabel={first} lastLabel={last} />
      {activity === 'run'
        ? <MiniChart title="Average pace per week (higher = faster)" kind="line" invert values={weekly.map((w) => w.paceMinKm)}
            format={(n) => formatEffort(n, 'run')} firstLabel={first} lastLabel={last} />
        : <MiniChart title="Average speed per week (km/h)" kind="line" values={weekly.map((w) => kmhFromPace(w.paceMinKm))}
            format={(n) => `${n.toFixed(1)} km/h`} firstLabel={first} lastLabel={last} />}
    </>
  );
}
