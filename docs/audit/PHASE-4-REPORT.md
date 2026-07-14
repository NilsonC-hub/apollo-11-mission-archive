# Phase 4 Completion Report

## Scope completed

Phase 4 delivers the production React/R3F application for the Launch / Earth
Orbit / TLI boundary defined by Production Spec §53.

- Added independently lazy-loaded Archive and Mission Control routes.
- Published Archive chapters for mission identity, the Phase 4 as-flown event
  register, flight architecture, Saturn V, Columbia/Eagle model truth, and the
  source room.
- Published deterministic Mission Control playback from prelaunch through
  spacecraft ejection, with exact-event navigation, scrubbing, 1×/10×/100×/1000×
  playback, phase navigation, keyboard controls, and source locators.
- Bound the Phase 3 Saturn V, CSM, LM, Earth KTX2, Draco, and Basis assets to the
  browser using only local runtime paths.
- Added responsive desktop/mobile layouts, reduced-motion behavior, a static
  no-WebGL fallback, and explicit missing-data states.
- Preserved all Phase 0–3 source, mission, model, and decoder gates.

The UI deliberately stops at the verified spacecraft-ejection record. The
mission pack still contains later events, but the Phase 4 route does not expose
them as replay scope.

## Files changed

- Application shell and state: `src/main.tsx`, `src/app/RootLayout.tsx`,
  `src/app/mission.ts`, `src/app/missionStore.ts`.
- Archive: `src/features/archive/ArchiveRoute.tsx`.
- Mission Control: `src/features/control/ControlRoute.tsx`,
  `src/features/control/MissionScene.tsx`,
  `src/features/control/useMissionPlayback.ts`.
- Visual system: `src/styles/global.css`, `index.html`.
- Runtime staging: `scripts/stage-runtime-assets.ts`, `public/missions/apollo11/`.
- Configuration: `package.json`, `pnpm-lock.yaml`, `vite.config.ts`,
  `eslint.config.js`, `README.md`, `AGENTS.md`.
- Regression coverage: `tests/unit/phase4-scope.test.ts`.
- Browser evidence: `docs/media/phase4-*.png`.
- Removed the obsolete Phase 3-only `src/placeholder.ts`.

## Facts added

| Fact ID | Value                                | Evidence | Citation |
| ------- | ------------------------------------ | -------- | -------- |
| None    | Phase 4 adds no mission Fact records | N/A      | N/A      |

## Events added or changed

| Event ID | MET | Action                                                                                | Citation |
| -------- | --- | ------------------------------------------------------------------------------------- | -------- |
| None     | N/A | No mission event, MET, evidence class, citation, or state action was added or changed | N/A      |

The UI selects 13 already-published ACTUAL events from `a11-liftoff` through
`a11-spacecraft-ejection`. It does not relabel spacecraft ejection as a separately
timed extraction-complete event.

## Schematic / reconstructed content

| ID                                | What is authored                                                           | Why                                                                                              | UI label                                                       |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `phase4-relative-motion`          | Stage-discard and CSM/LM relative placement between exact event boundaries | The source event record establishes configuration changes, not a continuous recovered trajectory | `MOTION NOT TO SCALE` / `SCHEMATIC`                            |
| `phase4-earth-reference`          | Earth placement, grid, camera, light, orientation, and relative scale      | No historical continuous ephemeris/attitude solution is asserted                                 | `EARTH REFERENCE / SCHEMATIC`                                  |
| `earth-blue-marble-1k`            | Modern Blue Marble global composite on the Earth sphere                    | Stable global texture, not a same-instant July 1969 view                                         | `EARTH TEXTURE / MODERN NASA COMPOSITE`                        |
| `apollo11-saturn-v`               | Phase 3 NASA visualization model with reconstructed semantic bands         | Source GLB has no certified AS-506 semantic nodes                                                | `SATURN V: NASA VISUALIZATION` and Archive truth caption       |
| `apollo11-command-service-module` | Phase 3 CM/SM assembly from NASA print-kit STLs and references             | No certified NASA Columbia CAD/GLB is available                                                  | `CSM: RECONSTRUCTED` / `NOT NASA CAD`                          |
| `apollo11-lunar-module`           | Generic NASA Apollo LM visualization with reconstructed stage split        | Source model is not certified LM-5 Eagle geometry                                                | Archive `NOT CERTIFIED LM-5 GEOMETRY` caption                  |
| `phase4-static-fallback`          | Existing accessible SVG vehicle structure                                  | WebGL/model/decoder failure must not remove access to structure/state                            | `STATIC STRUCTURE VIEW` / `WEBGL OR MODEL DECODER UNAVAILABLE` |

## Assets processed

| Asset ID | Raw hash                                     | Derived hash                        | Before                                 | After                                                                             | Recipe                            |
| -------- | -------------------------------------------- | ----------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| None     | Phase 4 creates no new derived mission asset | Phase 3 hashes remain authoritative | Verified files under `assets/derived/` | Deterministically copied to `public/missions/apollo11/` for Vite runtime delivery | `scripts/stage-runtime-assets.ts` |

The runtime staging script also copies Three-compatible browser Draco/Basis
decoders from the locked `three@0.185.1` package. Phase 3's independently pinned
decoder validation files and hashes remain unchanged.

## Commands run

| Command                                        | Exit code | Summary                                                                                                   |
| ---------------------------------------------- | --------: | --------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                               |         0 | TypeScript project references passed with React/R3F strict types                                          |
| `pnpm lint`                                    |         0 | ESLint passed across data, scripts, tests, and UI                                                         |
| `pnpm format:check`                            |         0 | Prettier check passed across authored source, documentation, and configuration                            |
| `pnpm test:unit`                               |         0 | 115/115 tests passed, including Phase 4 scope and Archive dependency-boundary tests                       |
| `pnpm validate:sources`                        |         0 | 0 errors, 0 warnings; Source Manifest and archived hashes remain valid                                    |
| `pnpm validate:mission`                        |         0 | 37 events, 70 facts, 24 missing event times; mission-core boundary passed                                 |
| `pnpm validate:models`                         |         0 | Three LODs for all vehicle models, KTX2 variants, manifests, fallback, and decoder records passed         |
| `pnpm validate:decoders`                       |         0 | Nine Draco GLBs decoded and six KTX2 files validated offline                                              |
| `pnpm inspect-stls`                            |         0 | 12/12 NASA print-kit STL parts matched manifest hashes, bounds, and triangle counts                       |
| `pnpm build`                                   |         0 | Vite production build passed; Archive and Control/scene emitted as separate chunks                        |
| Playwright Chromium production Archive load    |         0 | 0 console errors/warnings; request audit found no Three, R3F, GLB, KTX2, or decoder request               |
| Playwright Chromium production Control load    |         0 | 0 console errors; Saturn medium GLB, Earth 1K KTX2, and local Draco/Basis decoders returned 200           |
| Playwright playback check                      |         0 | 1000× playback advanced MET deterministically; event selection stopped playback at the exact selected MET |
| Playwright 390×844 / 320×720 responsive checks |         0 | Root `scrollWidth === clientWidth`; mobile selected low LOD; controls remained touch-sized and usable     |

The only browser warning is Three/R3F's upstream `THREE.Clock` deprecation
notice; it does not indicate a failed loader or render path.

## Screenshots / recordings

- `docs/media/phase4-archive-desktop.png` — production Archive at 1440×1000.
- `docs/media/phase4-control-desktop.png` — production prelaunch Mission Control
  with the actual NASA Saturn V visualization model and modern NASA Earth
  composite.
- `docs/media/phase4-control-extraction-desktop.png` — production spacecraft
  ejection boundary with Saturn upper-stage representation, reconstructed CSM,
  and generic NASA LM model.
- `docs/media/phase4-archive-mobile.png` — production Archive at 390×844.
- `docs/media/phase4-control-mobile.png` — production Mission Control at
  390×844 using low model quality.

All screenshots were captured from the built app served by `vite preview`, not
from the non-production `prototype/`.

## Performance delta

- Archive route isolation was verified in a fresh browser session: no Three,
  R3F, MissionScene, GLB, KTX2, Draco, or Basis request was made.
- Production gzip sizes: Archive route 3.28 kB; Control route 3.25 kB; shared
  mission pack 20.99 kB; shared application entry 88.59 kB; CSS 5.70 kB.
- The 3D scene is a Control-only dynamic chunk (274.26 kB gzip). The current
  minified chunk is 995.00 kB and remains an explicit Phase 6 optimization item.
- Initial desktop Control mission assets are Saturn V medium (203,280 bytes) and
  Earth 1K KTX2 (123,284 bytes), plus one-time local decoder payloads. CSM and LM
  GLBs are not requested until the CSM/S-IVB separation boundary.
- Mobile changes to low LOD automatically and has no root horizontal overflow at
  390 px or 320 px.

## Accessibility checks

- Skip link, landmark elements, labelled navigation, native buttons, range input,
  select, details/summary, list semantics, definition lists, and source table
  roles are present in the browser accessibility snapshot.
- Keyboard controls: K play/pause, J/L previous/next event, brackets speed; form
  controls and links are excluded from global shortcuts.
- Touch controls are at least 44 CSS px in mobile layouts.
- `prefers-reduced-motion` disables authored scrolling/transition motion.
- MET is not placed in a per-second `aria-live` region.
- The 3D view has a static SVG fallback and the same deterministic state is
  available as text in event and vehicle panels.
- Chromium checks at 390 px and 320 px showed no document-level horizontal
  overflow. Mobile's main view is capped at 46dvh.

## Open questions / known gaps

1. The reviewed Phase 2 event set contains TLI ignition but no precise second
   S-IVB cutoff MET. Phase 4 does not invent one: after CSM/S-IVB separation the
   state panel displays `CUTOFF MET N/A` / `NOT IN EVENT SET` rather than
   presenting the last ignition action as a continuing historical burn.
2. `a11-spacecraft-ejection` is the Phase 4 end boundary. The separately named
   LM extraction-complete time remains missing and cannot drive animation.
3. SLA panel-by-panel jettison timing remains missing. The presentation does not
   claim a timed panel sequence.
4. Vehicle relative distances, Earth scale/orientation, grid, lighting, camera,
   and separation motion are schematic, not recovered trajectory or attitude.
5. The Control-only Three/R3F chunk exceeds Vite's 900 kB minified warning
   threshold (274.26 kB gzip). Route isolation protects Archive; deeper scene
   code splitting remains Phase 6 work.
6. The upstream R3F stack emits a non-fatal `THREE.Clock` deprecation warning.
7. Historical audio remains unavailable because verified local bytes, hashes,
   synchronization, and clip boundaries do not exist.

## Explicitly not completed

- Phase 5 lunar orbit, descent, surface, ascent, rendezvous, return, entry, and
  recovery scenes are not implemented.
- Phase 6 full Archive chapter publication, final performance budgets, complete
  accessibility certification, telemetry-chart audit, and release deployment are
  not implemented.
- No new mission fact, event, MET, transcript, telemetry sample, audio clip, or
  source classification was created.
- No continuous altitude, velocity, attitude, trajectory, docking range, or
  engine cutoff value was synthesized.
- No NASA CAD, certified AS-506 digital twin, certified Columbia model, or
  certified LM-5 geometry claim is made.
- No sound, music, AI imagery, AI voice, remote runtime decoder, GLM-generated
  code, external agent, commit, push, deployment, or Phase 5 work was performed.
