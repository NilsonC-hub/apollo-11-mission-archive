# Phase 6 Completion Report

## Scope completed

Phase 6 completes the Archive and Mission Control UI scope in Production Spec
§55.

- Published Archive chapters 00–12 with route-addressable deep links, chapter
  source disclosures, a complete Source Room, spacecraft component dossiers,
  guidance/computing records, and transcript records.
- Added clear `PLANNED` mission intent beside separately cited `ACTUAL`
  outcome anchors without converting intent into an as-flown fact.
- Added crew and flight-role records from the frozen source pack without
  implying continuous crew-location telemetry.
- Completed staged Mission Control presentation from launch through recovery,
  including unavailable-data states, model-truth labels, transcript records,
  and the existing static model fallback.
- Mode changes now pause an active replay. Returning to Mission Control keeps
  the preserved MET paused and requires an explicit `RESUME REPLAY` action.
- Removed all world-space grids from the 3D scene. They had no sourced
  coordinate, scale, navigation, landing-site, or trajectory meaning and could
  visually intersect a planet. The decorative planet edge ring was also
  removed.
- Removed the orbit reference from descent and rendezvous local views. The
  remaining orbit ring appears only in the explicit lunar-orbit composition;
  it communicates orbit topology and remains schematic, not a position,
  altitude, inclination, or trajectory claim.
- Added responsive layouts, keyboard focus handling, a skip link, reduced
  motion behavior, 320 px reflow, and source/evidence labels that remain
  visible on small screens.
- Preserved Archive route isolation from Three, R3F, GLB, KTX2, and decoder
  requests.

Historical audio is a completed unavailable state, not fabricated media. The
frozen pack has transcript evidence but no verified local audio bytes, hash,
channel calibration, or clip bounds.

## Files changed

- Application shell and replay state: `src/app/RootLayout.tsx`,
  `src/app/missionStore.ts`.
- Complete Archive: `src/features/archive/ArchiveRoute.tsx`.
- Mission Control state and scene semantics:
  `src/features/control/ControlRoute.tsx`,
  `src/features/control/MissionScene.tsx`.
- Responsive/accessibility design system: `src/styles/global.css`.
- Regression coverage: `tests/unit/phase6-ui.test.ts`.
- Status and handoff: `package.json`, `README.md`, `AGENTS.md`.
- Browser evidence: `docs/media/phase6-*.png`.

## Facts added

| Fact ID | Value                                | Evidence | Citation |
| ------- | ------------------------------------ | -------- | -------- |
| None    | Phase 6 adds no mission Fact records | N/A      | N/A      |

All numbers shown by the new UI resolve through the existing mission pack.
The crew/objective prose paraphrases the frozen NASA source records and does
not add numeric data.

## Events added or changed

| Event ID | MET | Action                                                                                | Citation |
| -------- | --- | ------------------------------------------------------------------------------------- | -------- |
| None     | N/A | No mission event, MET, evidence class, citation, or state action was added or changed | N/A      |

Pending 1201/1202 alarm entries remain archive-only with `PRECISE MET NOT
VERIFIED`; they do not drive replay state or animation.

## Schematic / reconstructed content

| ID                                     | What is authored                                                       | Why                                                                       | UI label                                          |
| -------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `phase6-local-lunar-view`              | Moon/vehicle placement, apparent scale, lighting, and camera           | No continuous position, attitude, altitude, range, or local terrain set   | `LOCAL VIEW / SCHEMATIC · NO POSITION CLAIM`      |
| `phase6-lunar-orbit-reference`         | Thin orbit topology guide around the Moon in the lunar-orbit view only | It is a configuration guide, not a recovered trajectory or orbit solution | `VISUAL REFERENCE / SCHEMATIC`                    |
| `phase6-mode-switch-pause`             | Editorial pause/resume notice when changing top-level modes            | It is application playback state, not a mission event                     | `REPLAY PAUSED ON MODE CHANGE`                    |
| `apollo11-command-service-module`      | Existing reconstructed Phase 3 CSM                                     | No certified NASA Columbia CAD/GLB is available                           | `CSM: RECONSTRUCTED`                              |
| `apollo11-lunar-module`                | Existing generic NASA Apollo LM with reconstructed stage split         | Source model is not certified LM-5 Eagle geometry                         | `GENERIC NASA VISUALIZATION · NOT CERTIFIED LM-5` |
| `earth-blue-marble` / `moon-lro-color` | Existing modern global texture products                                | A real texture does not make scene scale, lighting, or camera historical  | Modern composite/product and color-only labels    |

The removed grid is deliberately absent from this table: it no longer exists
as published schematic content because it had no defensible semantic role.

## Assets processed

| Asset ID | Raw hash | Derived hash | Before | After | Recipe                                                          |
| -------- | -------- | ------------ | ------ | ----- | --------------------------------------------------------------- |
| None     | N/A      | N/A          | N/A    | N/A   | Phase 6 reuses the verified Phase 3 assets without reprocessing |

The Phase 6 PNGs are browser QA evidence, not mission source assets.

## Commands run

| Command                                       | Exit code | Summary                                                                                                                                                         |
| --------------------------------------------- | --------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`                           |         0 | All matched files use Prettier formatting                                                                                                                       |
| `pnpm lint`                                   |         0 | ESLint completed without errors                                                                                                                                 |
| `pnpm test:unit`                              |         0 | 123/123 tests passed, including Phase 6 deep-link, route-isolation, grid-removal, pause/resume, pending-alarm, and audio-unavailable tests                      |
| `pnpm validate:sources`                       |         0 | Source Manifest: 0 errors, 0 warnings                                                                                                                           |
| `pnpm validate:mission`                       |         0 | 37 published events, 70 facts, and 24 deliberately missing event times; mission-core boundary passed                                                            |
| `pnpm validate:models`                        |         0 | Vehicle LODs, hashes, semantic nodes, celestial textures, static fallback, and local decoders passed                                                            |
| `pnpm validate:decoders`                      |         0 | Nine Draco GLBs decoded and six KTX2 files validated offline                                                                                                    |
| `pnpm inspect-stls`                           |         0 | 12/12 NASA print-kit STL parts matched bytes, hashes, bounds, and triangle counts                                                                               |
| `pnpm build`                                  |         0 | Runtime staging, TypeScript project build, and Vite production build passed                                                                                     |
| Playwright Archive production request audit   |         0 | 14 requests returned 200; Archive requested its route chunks and four image plates, with no Three/R3F scene, GLB, KTX2, or decoder asset                        |
| Playwright Control production rendering       |         0 | Lunar orbit, descent, surface, and responsive compositions rendered with 0 application errors                                                                   |
| Playwright 1440/640/390/320 reflow checks     |         0 | `scrollWidth === clientWidth`; 640 CSS px covers a 1280 px screen at 200% browser zoom, and 320 px is the stricter reflow case                                  |
| Playwright keyboard and Reduced Motion checks |         0 | First Tab exposes `Skip to content` with a visible outline; reduced-motion query matched, transition duration became 0.01 ms, and smooth scrolling was disabled |

The browser emitted only the upstream R3F `THREE.Clock` deprecation warning
on Control. Archive emitted zero warnings and zero errors.

## Screenshots / recordings

- `docs/media/phase6-control-descent-desktop.png` — local descent view after
  removal of the ambiguous grid and local orbit reference.
- `docs/media/phase6-control-surface-desktop.png` — lunar surface record at
  1440×900 with explicit schematic/no-position and model-truth labels.
- `docs/media/phase6-control-surface-mobile.png` — the same state at 390×844.
- `docs/media/phase6-archive-objectives-desktop.png` — planned mission intent
  separated from cited as-flown outcome anchors at 1440×900.
- `docs/media/phase6-archive-objectives-mobile.png` — the same deep-linked
  chapter at 390×844.

All screenshots came from the production build served by `vite preview`. They
do not come from `prototype/`.

## Performance delta

- Archive route isolation remains intact. A fresh Archive session requested
  only application/Archive/state/provenance chunks, CSS, and four archived
  image plates.
- Production gzip sizes: Archive route 5.93 kB; Control route 5.11 kB;
  application entry 88.67 kB; CSS 7.00 kB.
- The Control-only MissionScene chunk is 998.17 kB minified / 275.05 kB gzip,
  slightly below Phase 5's 998.65 kB / 275.15 kB but still above Vite's 900 kB
  warning threshold. It is not loaded by Archive.
- The R3F canvas uses `frameloop="demand"`; it does not request a continuous
  render loop while the visual state is unchanged.

## Accessibility checks

- The accessibility tree exposes the skip link, banner, mode/phase navigation,
  landmarks, headings, native buttons, source details, range/select controls,
  transcript records, and textual model/vehicle state.
- Keyboard focus has a visible outline. Existing J/L/K/bracket shortcuts do
  not intercept input from buttons, links, form controls, or source summaries.
- Reduced Motion removes smooth scrolling and compresses animations and
  transitions to 0.01 ms.
- At 390 px and 320 px, `SCHEMATIC`, `PLANNED`, `ACTUAL`, `RECONSTRUCTED`,
  missing-data, model-truth, and `AUDIO NOT AVAILABLE` states remain visible or
  present in the accessibility tree.
- Mode switching never resumes replay implicitly; the preserved MET and both
  explicit choices remain keyboard-operable.
- No continuous `aria-live` announcement was introduced.

## Open questions / known gaps

1. Historical audio remains unavailable because verified bytes, hashes,
   channel calibration, and clip bounds are absent. Transcript records remain
   available; no synthetic voice or substitute audio was created.
2. Continuous altitude, velocity, attitude, range, orbital, propellant, and
   biomedical data remain unavailable and are not interpolated.
3. The 1201/1202 alarms and other pending subevents remain outside the ACTUAL
   replay until precise source-backed MET values are verified.
4. Scene bodies, spacecraft placement, camera, lighting, apparent scale, and
   remaining orbit/transfer references are schematic. The application does
   not claim a recovered navigation solution or landing-site coordinate frame.
5. The Control-only Three/R3F chunk remains above the 900 kB warning threshold.
   Deeper engine-level splitting belongs to the Phase 7 performance audit.
6. The upstream R3F stack emits a non-fatal `THREE.Clock` deprecation warning.

## Explicitly not completed

- Phase 7 release audit, visual-regression baseline, sustained GPU-resource
  monitoring, publication, deployment, and release-candidate sign-off are not
  claimed.
- No new mission fact, event, MET, quote, continuous telemetry series, audio
  clip, model, texture, or source classification was created.
- No pending event was promoted to ACTUAL and no missing value was replaced by
  zero, interpolation, or visual inference.
- The remaining trajectory references are not claimed as recovered trajectory,
  altitude, inclination, or spacecraft position.
- No certified NASA CAD, certified AS-506 digital twin, certified Columbia
  model, or certified LM-5 geometry claim is made.
- No GLM-generated code, external model collaboration, push, deployment, or
  formal Phase 7 work was performed.
