# Fartlek

A small PWA that guides a fartlek session with beeps. React + Vite + TypeScript, works offline.

## How it works
1. Set the **warm-up** (min) and the **fartlek** duration (min), e.g. 20 + 10.
2. At Start, the app draws an **irregular fartlek** that fills the fartlek time exactly: VMA-type efforts of about 20-95 s (a mix of short, medium and long) and recoveries of 30-125 s. Two efforts or two recoveries in a row are never equal, a new programme is drawn every session, and it ends on an effort followed by a short easy stretch (30-60 s).
3. A beep marks every change:
   - 3 high beeps: an effort starts
   - 1 long low beep: the warm-up or a recovery starts
   - a tick in the last 3 seconds of each phase, 2 beeps at the end

The app paces the efforts; it does not measure your speed, so run them at your VMA.

## Session screen
Total chrono (elapsed / total), the current part with its countdown, a progress bar, the step `x/t`, Pause, and End (with confirmation).
Colours: blue = warm-up, red = effort, green = recovery.

## Why the sound works with the screen locked
The whole session's sound is **one pre-built audio track** (`renderTrack` in `src/fartlek.ts`): beeps at exact times inside silence. It is played by an `<audio>` element, so the phone keeps playing it with the screen locked, with no timer needed. The screen only reads the track's position, so the clock cannot drift or freeze.

The "Sound" setting picks the audio session type of the track:
- `playback` (default): works locked, ignores the silent switch. Your music **pauses** during the session.
- `transient` (test): meant to mix with other audio. Unverified: it may still be muted when the screen locks, and the music may stay lowered (ducked) for the whole session since the track plays continuously.
- `ambient`: mixes with your music, but is muted when the screen locks, so the screen is kept on.

## Files
```
src/fartlek.ts       programme generator + beep track (pure, tested)
src/App.tsx          setup screen and session screen
src/fartlek.test.ts
public/sw.js         offline cache
```

## Commands
`npm install`, `npm run dev`, `npm test`, `npm run build`, `npm run deploy` (GitHub Pages).
When you ship a new version, bump the cache name in `public/sw.js` (currently `pp-v10` → `pp-v11`), otherwise an installed PWA keeps the old files.
