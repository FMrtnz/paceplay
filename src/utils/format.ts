/** Seconds → "m:ss". Rounds up so a countdown never shows 0:00 too early. */
export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Meters → kilometers as text, e.g. formatKm(1234, 1) === '1.2'. */
export const formatKm = (meters: number, digits = 2): string => (meters / 1000).toFixed(digits);

/** Timestamp → date in the user's locale. */
export const formatDate = (timestamp: number): string => new Date(timestamp).toLocaleDateString();

/** Timestamp → short date like "Oct 26". */
export const formatShortDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Pace in min/km → "m:ss", or "—" when unknown or absurd. */
export const formatPace = (minPerKm: number | null): string => {
  if (minPerKm === null || !isFinite(minPerKm)) return '—';
  const total = Math.round(minPerKm * 60);
  return total >= 6000 ? '—' : `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Pace as it is read aloud, e.g. "5 minutes 42 seconds". */
export const spokenPace = (minPerKm: number): string => {
  const total = Math.round(minPerKm * 60), m = Math.floor(total / 60), s = total % 60;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  return s ? `${part(m, 'minute')} ${part(s, 'second')}` : part(m, 'minute');
};

/** Pace (min/km) → speed in km/h, or null. */
export const kmhFromPace = (minPerKm: number | null): number | null =>
  minPerKm === null || !isFinite(minPerKm) || minPerKm <= 0 ? null : 60 / minPerKm;

/** The effort of a run as a pace ("5:42 /km"), of a ride as a speed ("27.3 km/h"). */
export const formatEffort = (minPerKm: number | null, activity: 'run' | 'bike'): string => {
  if (activity === 'run') return `${formatPace(minPerKm)} /km`;
  const kmh = kmhFromPace(minPerKm);
  return kmh === null ? '— km/h' : `${kmh.toFixed(1)} km/h`;
};

/** Same, as it is read aloud. */
export const spokenEffort = (minPerKm: number, activity: 'run' | 'bike'): string =>
  activity === 'run' ? `${spokenPace(minPerKm)} per kilometre` : `${(60 / minPerKm).toFixed(1)} kilometres per hour`;
