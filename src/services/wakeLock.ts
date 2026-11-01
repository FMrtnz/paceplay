/** Asks the browser to keep the screen on when it can. Returns the function that releases it. */
export function keepScreenOn(): () => void {
  let lock: any;
  try {
    (navigator as any).wakeLock?.request('screen').then((l: any) => (lock = l)).catch(() => {});
  } catch {}
  return () => {
    try { lock?.release(); } catch {}
  };
}
