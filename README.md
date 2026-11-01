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
  models/        MODEL: data and business rules
    constants.ts     business constants (levels, labels, XP rules, timings)
    planModel.ts     build and pick interval plans (pure, seeded)
    sessionModel.ts  clock, current phase, progress, goal checks (pure)
    trackerModel.ts  GPS distance filter
    rewardModel.ts   XP and badges (pure)
    progressModel.ts player progress: applyRun, selectors, legacy-data migration (pure)
    storage.ts       the only file that touches localStorage
  controllers/   CONTROLLER: hooks that own state and expose actions
    useAppController.ts       current screen, chains the other controllers
    useSetupController.ts     goal, level, options, plan generation, sound preference
    useRunController.ts       one live session: timers, GPS, autosave, sound cues
    useProgressController.ts  XP, history, badges
  views/         VIEW: display only
    pages/           one file per screen
    components/      reusable pieces (Snitch, ChoiceGroup, BadgeCard, PhaseList)
  services/      browser APIs: GPS, audio/voice, wake lock, simulator (loaded on demand)
  utils/         formatting helpers
  App.tsx        root: plugs the app controller into the pages
```

Data flow: model → controller (hook) → view. Views receive data and callbacks as props and never
touch storage. Models are pure functions: no React, no DOM, unit-tested next to their file.

Rules of thumb:
- Business logic goes in `models/`, state and side effects in `controllers/`, JSX in `views/`.
- Keep files under ~150 lines; split when they grow.
- Persisted field names (`P`, `distM`, `sig`, `challenges`, badge ids, `pp_*` keys) must never be
  renamed without a migration in `progressModel.normalizeProgress`.
- `useRunController`'s interval effect has no dependency list on purpose: it is re-created on
  every render so the end-of-run handler always sees fresh values.

## Deployment (free)

Push to GitHub, then either:

- **GitHub Pages**: enable Pages with the "static" GitHub Actions workflow, serving the `dist` folder.
- **Cloudflare Pages**: build command `npm run build`, output directory `dist`.

HTTPS is required for GPS.

When you ship a new version, bump the cache name in `public/sw.js` (`pp-v1` → `pp-v2`), otherwise
installed PWAs keep serving the old cached files.
