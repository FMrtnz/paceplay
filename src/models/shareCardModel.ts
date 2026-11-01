import { describeMatch } from './matchModel';
import type { RunResult } from './progressModel';
import { LEVEL_LABEL, RESULT_TITLE } from './vocabulary';
import { formatClock, formatDate, formatKm, formatPace } from '../utils/format';

export interface ShareCard {
  headline: string;
  rank: string;
  date: string;
  distanceKm: string;
  kpis: { label: string; value: string }[];
  highlight: string; // best speed-up line, empty when unknown
}

/** The texts printed on the shareable image (kept apart from the drawing code so they can be tested). */
export function buildShareCard(match: RunResult): ShareCard {
  const v = describeMatch(match);
  return {
    headline: match.completed ? RESULT_TITLE.completed : RESULT_TITLE.interrupted,
    rank: LEVEL_LABEL[match.level],
    date: formatDate(match.date),
    distanceKm: formatKm(match.distM),
    kpis: [
      { label: 'TIME', value: formatClock(match.elapsed) },
      { label: 'AVG PACE', value: `${formatPace(v.avgPaceMinKm)} /km` },
      { label: 'SPEED-UPS', value: String(match.challenges) },
      { label: 'XP', value: `+${match.xp}` },
    ],
    highlight: v.bestSpeedUpMinKm === null ? '' : `Best speed-up ≈ ${formatPace(v.bestSpeedUpMinKm)} /km`,
  };
}
