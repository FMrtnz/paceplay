/** Asks the browser to keep the screen on when it can. Returns the function that releases it.
 *  The browser drops the lock whenever the page is hidden (app switch, lock screen, notification),
 *  so it is requested again each time the page becomes visible. */
export function keepScreenOn(): () => void {
  let lock: any;
  let stopped = false;
  const acquire = () => {
    try {
      (navigator as any).wakeLock?.request('screen')
        .then((l: any) => {
          if (stopped) { try { l.release(); } catch {} return; }
          lock = l;
        })
        .catch(() => {});
    } catch {}
  };
  const onVisible = () => { if (document.visibilityState === 'visible') acquire(); };
  acquire();
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    stopped = true;
    document.removeEventListener('visibilitychange', onVisible);
    try { lock?.release(); } catch {}
  };
}
