import { useEffect } from 'react';
import { SIM_SPEED_MS } from '../models/constants';
import type { Activity } from '../models/constants';
import type { Fix } from '../models/trackerModel';
import { watchGps } from '../services/geolocation';
import { keepScreenOn } from '../services/wakeLock';

/** Position source (real GPS or simulation) and screen wake lock, for the life of the run page. */
export function useRunSensors(source: { sim: boolean; activity: Activity }, onFix: (f: Fix) => void, onMessage: (m: string) => void) {
  useEffect(() => {
    if (!source.sim) return watchGps(onFix, onMessage);
    // The simulator is test-only code: load it on demand (the first simulated fix comes after 1 s)
    let stop = () => {};
    let cancelled = false;
    import('../services/simulator').then((m) => { if (!cancelled) stop = m.simulate(onFix, SIM_SPEED_MS[source.activity]); });
    return () => { cancelled = true; stop(); };
  }, []);

  useEffect(() => keepScreenOn(), []);
}
