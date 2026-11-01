import { emptyProgress, normalizeProgress } from './progressModel';
import type { Progress } from './progressModel';
import type { ActiveSession } from './sessionModel';

// Only controllers call this file. Every access is guarded: storage can be blocked (private mode).
// Keys are persisted: never rename them.
const PROGRESS_KEY = 'pp_store', ACTIVE_KEY = 'pp_active', SOUND_KEY = 'pp_sound';

export function loadProgress(): Progress {
  try { return normalizeProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')); }
  catch { return emptyProgress(); }
}
export function saveProgress(p: Progress) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {}
}

export function loadActiveSession(): ActiveSession | null {
  try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); } catch { return null; }
}
export function saveActiveSession(a: ActiveSession) {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(a)); } catch {}
}
export function clearActiveSession() {
  try { localStorage.removeItem(ACTIVE_KEY); } catch {}
}

export function loadSoundEnabled(): boolean {
  try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
}
export function saveSoundEnabled(on: boolean) {
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch {}
}
