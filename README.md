# PACEPLAY

Interval-running game: catch the golden Snitch by alternating accelerations and recoveries.
React + Vite + TypeScript, offline-capable PWA.

## Getting started

npm install && npm run dev

- Test: `npm test`
- Build: `npm run build`

## Architecture (MVC)

```
src/
  models/        MODEL: data and business rules, pure functions (no React, no DOM)
    vocabulary.ts    ALL user-facing words (levels, phases, screen titles, trophies, messages)
    constants.ts     numbers and rules (levels' paces, XP, timings, pace thresholds)
    planModel.ts     build and pick interval plans (pure, seeded)
    sessionModel.ts  clock, current phase, progress, goal checks
    trackerModel.ts  GPS distance filter + smoothed current pace
    paceModel.ts     pace maths (min/km)
    detailModel.ts   live recording of a run (per-km marks, per-phase distance) → per-km / per-phase detail
    rewardModel.ts   XP and trophies
    progressModel.ts player progress: applyRun, removeRun, legacy-data migration
    statsModel.ts    weekly totals, calendar heatmap, week streak, matches grouped by month
    recordsModel.ts  personal records
    matchModel.ts    one match → rows for the km / speed-up tabs
    shareCardModel.ts texts printed on the share image
    storage.ts       the only file that touches localStorage
  controllers/   CONTROLLER: hooks that own state and expose actions
    useAppController.ts       current screen, chains the other controllers
    useSetupController.ts     goal, level, options, plan generation, sound preference
    useRunController.ts       one live session: timers, recording, autosave, sound and voice cues
    useRunSensors.ts          GPS / simulator and screen wake lock
    useProgressController.ts  XP, history, trophies and the figures built from them
    useShareController.ts     share sheet: preview, photo, share / download
  views/         VIEW: display only
    pages/           Home (Locker Room), Config (Team Sheet), Preview (Game Plan), Run (The Pitch),
                     Result (Final Whistle), Progress (tabs), Match (tabs), Trophy Room
    components/      reusable pieces (tabs, charts, heatmap, bottom nav, share sheet…)
  services/      browser APIs: GPS, audio (beeps + voice clips), wake lock, share, simulator and share-image drawing (both loaded on demand)
  utils/         formatting helpers
  App.tsx        root: plugs the app controller into the pages
public/
  voice/         coach voice clips, one per phase (warmup, accel, recover, steady, cooldown .m4a), made by the script below
  sw.js          service worker (offline cache)
scripts/
  make-voice.sh  generates the voice clips with the macOS voice
```

Data flow: model → controller (hook) → view. Views receive data and callbacks as props and never
touch storage. Models are unit-tested next to their file (`npm test`).

Rules of thumb:
- Words go in `models/vocabulary.ts`, business logic in `models/`, state and side effects in
  `controllers/`, JSX in `views/`.
- Keep files under ~150 lines; split when they grow.
- Persisted field names (`P`, `distM`, `sig`, `challenges`, `detail`, `log`, trophy ids, `pp_*` keys)
  must never be renamed without a migration in `progressModel.normalizeProgress`.
- The text of each voice clip must stay equal to `"<PHASE_LABEL>. <PHASE_TIP>"` in `models/vocabulary.ts`:
  if you change one, change `scripts/make-voice.sh` and generate the clips again.
- `useRunController`'s interval effect has no dependency list on purpose: it is re-created on
  every render so the end-of-run handler always sees fresh values.
- Matches saved before pace tracking have no `detail`, and matches/sessions saved before the bike and steady modes
  have no `activity` / `format` / `warmupMin`: `normalizeProgress` and `storage.loadActiveSession` fill in
  run / intervals / auto. Every screen must keep working without `detail`.

## Features

- Two activities: **Run** (shown as a pace, min/km) and **Bike** (shown as a speed, km/h), each with its own goal ranges, GPS speed limit and records.
- Two formats: **Intervals** (speed-ups and recoveries) and **Steady** (one continuous, even effort).
- Configurable **warm-up**: Auto, None, 3, 5, 10 or 15 min.
- Live pace (current, smoothed over ~25 s, and average). The pace is shown on screen, not spoken.
- Cues at each phase change: a beep (or vibration where the device supports it) and a **voice clip** that names the phase and gives the tip.
- **Ending a run early asks for confirmation** ("End this run now?"): the question goes away by itself after 6 s and the confirm button ignores taps in the first 0.8 s, so a stray or double tap cannot stop a session.
- **Screen kept on** during a run (screen wake lock). The browser releases it whenever the app is hidden, so it is requested again each time the app comes back to the front.
- Every match keeps its pace per kilometre and per phase (GPS only; paces over less than a minute are marked ≈).
- Progress: matches by month, records, weekly trends, calendar heatmap and week streak. Trophies have their own page.
- Share a match as an image (default artwork or your own photo, which never leaves the device).

## Sound and voice

Goal: the app's sounds live alongside the user's music or podcast instead of cutting it.

- The audio session is kept on `ambient` (mixes with other audio) and switches to `transient` only while a beep or a voice clip plays, then goes back (`services/feedback.ts`).
- The coach voice is **not** speech synthesis, which stops other audio on some devices. It is a short audio clip per phase, played through one `<audio>` element that is unlocked by the Start tap, so later cues can play without a new tap.
- Clips are fetched into blob URLs when the run starts, so they work offline through the service worker. A missing clip is silent (no fallback to synthesized speech).
- When the app comes back to the front, queued speech is dropped and the session is reset to `ambient`.
- Beeps use Web Audio and need the same Start / Resume tap to unlock.

### Making the voice clips

On a Mac, from the project root:

```
bash scripts/make-voice.sh
```

This writes `public/voice/*.m4a` with the system voice (Samantha by default; `VOICE=Daniel bash scripts/make-voice.sh` to change it, `say -v '?'` lists the voices). Commit the clips with the project. Open the app once online after each deployment so the clips are cached.

## Deployment (free)

Push to GitHub, then either:

- **GitHub Pages**: enable Pages with the "static" GitHub Actions workflow, serving the `dist` folder.
- **Cloudflare Pages**: build command `npm run build`, output directory `dist`.

HTTPS is required for GPS.

When you ship a new version, bump the cache name in `public/sw.js` (currently `pp-v4` → `pp-v5`), otherwise
installed PWAs keep serving the old cached files. This also drops a clip that was cached as "not found" before it existed.