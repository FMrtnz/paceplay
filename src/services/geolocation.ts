import type { Fix } from '../models/trackerModel';
import { MESSAGES } from '../models/vocabulary';

/** Browser GPS subscription. Returns the function that stops it. */
export function watchGps(onFix: (f: Fix) => void, onMsg: (m: string) => void): () => void {
  if (!('geolocation' in navigator)) {
    onMsg(MESSAGES.gpsUnavailable);
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (p) => {
      onMsg('');
      onFix({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: p.timestamp });
    },
    (e) => onMsg(
      e.code === 1 ? MESSAGES.gpsDenied
      : e.code === 2 ? MESSAGES.gpsLost
      : MESSAGES.gpsSlow),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  return () => navigator.geolocation.clearWatch(id);
}
