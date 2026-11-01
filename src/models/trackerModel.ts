import { PACE_STALE_MS, PACE_WINDOW_MS } from './constants';

export interface Fix { lat: number; lon: number; acc: number; t: number }

/** Great-circle distance in meters between two fixes. */
export function haversine(a: Fix, b: Fix) {
  const R = 6371000, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Accumulates distance from GPS fixes. Deliberately mutable: it lives in a ref, not in React state. */
export class Tracker {
  last: Fix | null = null;
  speed = 0;
  rejected = 0;
  accSum = 0;
  n = 0;
  private samples: { t: number; d: number }[] = []; // (time, distance) after each accepted fix

  /** `maxSpeedMs`: faster jumps between two fixes are rejected (7 m/s ≈ 25 km/h on foot). */
  constructor(public dist = 0, private maxSpeedMs = 7) {}

  /** Returns meters added. Rejects accuracy >30 m, jumps above the maximum speed, jitter and repeated positions. */
  add(f: Fix): number {
    if (f.acc > 30) { this.rejected++; return 0; }
    if (!this.last) { this.last = f; this.note(f); return 0; }
    const dt = (f.t - this.last.t) / 1000;
    if (dt <= 0) return 0;
    const d = haversine(this.last, f);
    if (d < Math.max(3, f.acc * 0.5)) return 0;
    if (d / dt > this.maxSpeedMs) { this.rejected++; return 0; }
    this.last = f;
    this.dist += d;
    this.speed = d / dt;
    this.note(f);
    return d;
  }

  private note(f: Fix) {
    this.accSum += f.acc;
    this.n++;
    this.samples.push({ t: f.t, d: this.dist });
    if (this.samples.length > 60) this.samples.shift(); // enough for any window at 1 fix/s
  }

  quality(): 'good' | 'fair' | 'poor' | '—' {
    if (!this.n) return '—';
    const a = this.accSum / this.n;
    return a <= 10 ? 'good' : a <= 20 ? 'fair' : 'poor';
  }

  /** Pace in min/km over the last ~25 s, or null when stopped, stale or not enough data. */
  recentPaceMinKm(now: number): number | null {
    const s = this.samples;
    if (s.length < 2) return null;
    const last = s[s.length - 1];
    if (now - last.t > PACE_STALE_MS) return null;
    let i = s.length - 1;
    while (i > 0 && last.t - s[i - 1].t <= PACE_WINDOW_MS) i--;
    const seconds = (last.t - s[i].t) / 1000, meters = last.d - s[i].d;
    if (seconds < 5 || meters < 5) return null;
    return seconds / 60 / (meters / 1000);
  }
}
