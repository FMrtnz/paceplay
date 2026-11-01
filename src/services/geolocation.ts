import type { Fix } from '../models/trackerModel';

/** Browser GPS subscription. Returns the function that stops it. */
export function watchGps(onFix: (f: Fix) => void, onMsg: (m: string) => void): () => void {
  if (!('geolocation' in navigator)) {
    onMsg('GPS indisponible : mode durée uniquement.');
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (p) => {
      onMsg('');
      onFix({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: p.timestamp });
    },
    (e) => onMsg(
      e.code === 1 ? 'Localisation refusée : mode durée uniquement (aucune pénalité).'
      : e.code === 2 ? 'Signal GPS perdu…'
      : 'GPS trop lent à répondre…'),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  return () => navigator.geolocation.clearWatch(id);
}
