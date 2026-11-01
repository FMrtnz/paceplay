/** Seconds → "m:ss". Rounds up so a countdown never shows 0:00 too early. */
export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Meters → kilometers as text, e.g. formatKm(1234, 1) === '1.2'. */
export const formatKm = (meters: number, digits = 2): string => (meters / 1000).toFixed(digits);

/** Timestamp → date in the user's locale. */
export const formatDate = (timestamp: number): string => new Date(timestamp).toLocaleDateString();
