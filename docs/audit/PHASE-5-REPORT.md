# Phase 5 Completion Report

## Scope completed

Phase 5 delivers the Translunar / Lunar / Return scope in Production Spec §54.

- Extended the deterministic replay from spacecraft ejection through lunar
  orbit, descent, landing, surface operations, ascent, rendezvous, docking, LM
  jettison, TEI, transearth coast, entry, splashdown, and recovery.
- Added eight phase-oriented Mission Control configurations and event-local
  logs spanning all 37 already-published ACTUAL events.
- Bound the Phase 3 Moon KTX2, generic NASA Apollo LM visualization, and
  reconstructed CSM to lifecycle-driven scene configurations.
- Preserved the LM descent stage on the lunar surface after ascent and reduced
  the return vehicle to CSM, then command-module-only, at the source event
  boundaries.
- Added textual transcript records with exact MET links while keeping historical
  audio explicitly unavailable.
- Extended Archive publication with Mission Control records, powered descent,
  surface operations, rendezvous/return/recovery, and the archived NASA
  AS11-44-6665 return-leg photograph.
- Preserved all Phase 0–4 source, mission, model, decoder, and route-isolation
  gates.

Phase 5 does not claim final Phase 6 Archive/UI closure or Phase 7 release
readiness.

## Files changed

- Replay adapter/state: `src/app/mission.ts`, `src/app/missionStore.ts`.
- Mission Control: `src/features/control/ControlRoute.tsx`,
  `src/features/control/MissionScene.tsx`,
  `src/features/control/useMissionPlayback.ts`.
- Archive: `src/features/archive/ArchiveRoute.tsx`.
- Visual system: `src/styles/global.css`.
- Runtime staging: `scripts/stage-runtime-assets.ts`, `.gitignore`.
- Regression coverage: `tests/unit/phase5-scope.test.ts`.
- Project status: `package.json`, `README.md`, `AGENTS.md`.
- Browser evidence: `docs/media/phase5-*.png`.

## Facts added

| Fact ID | Value                                | Evidence | Citation |
| ------- | ------------------------------------ | -------- | -------- |
| None    | Phase 5 adds no mission Fact records | N/A      | N/A      |

The single displayed landing vertical-speed reading was already published as
`a11-touchdown-vertical-speed-sample`; Phase 5 reads it only at its exact sample
MET and does not interpolate around it.

## Events added or changed

| Event ID | MET | Action                                                                                | Citation |
| -------- | --- | ------------------------------------------------------------------------------------- | -------- |
| None     | N/A | No mission event, MET, evidence class, citation, or state action was added or changed | N/A      |

The replay exposes the existing 37-event ACTUAL register. Pending 1201/1202,
SLA-panel, extraction-complete, APS-cutoff, parachute, and recovery subevents
remain outside the ACTUAL event set.

## Schematic / reconstructed content

| ID                                 | What is authored                                                            | Why                                                                 | UI label                                                   |
| ---------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `phase5-transfer-reference`        | Earth/Moon placement, apparent scale, path, camera, and transfer progress   | No continuous historical ephemeris or attitude series is published  | `TRAJECTORY AND CELESTIAL SCALE: SCHEMATIC · NOT TO SCALE` |
| `phase5-lunar-orbit-reference`     | Orbit ring and relative CSM/LM placement                                    | The ring is a configuration guide, not a recovered trajectory       | `TRAJECTORY / RELATIVE POSITION: SCHEMATIC · NOT TO SCALE` |
| `phase5-descent-surface-reference` | Lunar horizon, grid, LM descent path, surface placement, and apparent scale | No continuous descent or surface-position series is asserted        | `MISSION FRAME / SCHEMATIC` / `MOTION NOT TO SCALE`        |
| `phase5-rendezvous-reference`      | LM ascent-stage path and relative CSM placement                             | Only source event boundaries drive lifecycle changes                | `RELATIVE RANGE AND MOTION: SCHEMATIC · NOT TO SCALE`      |
| `phase5-entry-recovery-reference`  | Command-module entry/recovery placement and grid                            | Entry attitude, parachute subevents, and recovery motion are absent | `ENTRY / RECOVERY MOTION SCHEMATIC`                        |
| `apollo11-command-service-module`  | Phase 3 CM/SM reconstruction with service-module visibility at separation   | No certified NASA Columbia CAD/GLB is available                     | `CSM: RECONSTRUCTED`                                       |
| `apollo11-lunar-module`            | Generic NASA Apollo LM with reconstructed ascent/descent semantic split     | Source model is not certified LM-5 Eagle geometry                   | `GENERIC NASA VISUALIZATION · NOT CERTIFIED LM-5`          |
| `moon-lro-color`                   | Modern NASA LRO color product on the scene Moon                             | It is a modern global color product, not a July 1969 camera view    | `MOON TEXTURE / MODERN NASA LRO PRODUCT · COLOR ONLY`      |

## Assets processed

| Asset ID                 | Raw hash                                                           | Derived hash                                 | Before                                       | After                                     | Recipe                              |
| ------------------------ | ------------------------------------------------------------------ | -------------------------------------------- | -------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| `a11-image-as11-44-6665` | `1318334a5089fb186d39996f60677b5f5b42cde74158ceff97b3e2283bfd41d4` | Same byte-identical archived JPEG            | `assets/raw/NASA-A11-MOON-VIEW.jpg`          | Runtime copy under the Archive plate path | Byte copy; no crop or color changes |
| Existing Phase 3 assets  | Phase 3 Asset Manifest remains authoritative                       | Phase 3 Asset Manifest remains authoritative | Verified GLB/KTX2/decoder/fallback artifacts | Reused without reprocessing in Phase 5    | Runtime staging only                |

AS11-44-6665 is captioned only as a return-leg photograph, taken after lunar
departure at about 10,000 nautical miles from the Moon. It is not presented as
an approach or LOI view.

## Commands run

| Command                                     | Exit code | Summary                                                                                          |
| ------------------------------------------- | --------: | ------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`                            |         0 | Strict TypeScript project references passed                                                      |
| `pnpm lint`                                 |         0 | ESLint passed across project source, tests, and scripts                                          |
| `pnpm test:unit`                            |         0 | 119/119 tests passed, including Phase 4 isolation and Phase 5 lifecycle/scope regression tests   |
| `pnpm validate:sources`                     |         0 | Source Manifest validation completed with 0 errors and 0 warnings                                |
| `pnpm validate:mission`                     |         0 | 37 events, 70 facts, and 24 deliberately missing event times; mission-core boundary passed       |
| `pnpm validate:models`                      |         0 | Three LODs, semantic nodes, KTX2 variants, fallback, and decoder records passed                  |
| `pnpm validate:decoders`                    |         0 | Nine Draco GLBs decoded and six KTX2 files validated offline                                     |
| `pnpm inspect-stls`                         |         0 | 12/12 NASA print-kit STL parts matched manifest bytes, hashes, bounds, and triangle counts       |
| `pnpm build`                                |         0 | Runtime assets staged, TypeScript passed, and Vite production build completed                    |
| Playwright production Control request audit |         0 | Saturn/CSM/LM GLBs, Earth/Moon KTX2, and local Draco/Basis assets returned 200; 0 console errors |
| Playwright production Archive request audit |         0 | Only app, Archive, image-plate, and mission-data requests; no scene, GLB, KTX2, or decoder load  |
| Playwright 1440/390/320 responsive checks   |         0 | Both routes reported `scrollWidth === clientWidth`; phase rail and controls remained usable      |
| Playwright static fallback selection        |         0 | Accessible fallback exposed `STATIC VEHICLE STRUCTURE VIEW` and deterministic text state         |

The only browser warning is the upstream `THREE.Clock` deprecation notice from
the R3F stack. There were no loader, WebGL, React, or application errors.

## Screenshots / recordings

- `docs/media/phase5-control-translunar-desktop.png` — translunar transfer
  configuration at 1440×1000.
- `docs/media/phase5-control-surface-desktop.png` — lunar surface configuration,
  exact transcript records, and missing-data labels at 1440×1000.
- `docs/media/phase5-control-return-desktop.png` — TEI/transearth return
  configuration at 1440×1000.
- `docs/media/phase5-control-surface-mobile.png` — surface Mission Control at
  390×844.
- `docs/media/phase5-archive-return-desktop.png` — Archive return/recovery chapter
  and NASA AS11-44-6665 plate at 1440×1000.
- `docs/media/phase5-archive-return-mobile.png` — same Archive chapter at 390×844.

All screenshots were captured from the built application served by
`vite preview`; none came from the labelled non-production `prototype/`.

## Performance delta

- Archive isolation remains intact. Its fresh browser session requested only
  application/Archive chunks, three Phase 3 PNG plates, and the return-leg JPG.
- Production gzip sizes: Archive route 4.67 kB; Control route 5.18 kB; shared
  mission pack 21.08 kB; application entry 88.59 kB; CSS 6.28 kB.
- The Control-only MissionScene chunk is 998.65 kB minified / 275.15 kB gzip,
  compared with Phase 4's 995.00 kB / 274.26 kB. It remains isolated from
  Archive and remains an explicit Phase 6 optimization item.
- Initial Control loading still mounts only the launch/Earth resources. Moon,
  CSM, and LM assets are requested when their configurations are selected.
- Desktop defaults to medium LOD; the user can choose high, medium, low, or the
  static fallback. Document-level overflow was absent at 1440, 390, and 320 px.

## Accessibility checks

- Browser snapshots expose skip link, banner, mode and phase navigation,
  landmarks, headings, lists, native buttons, labelled select/range controls,
  definition lists, transcript buttons, and source details.
- Phase navigation and exact transcript records are keyboard-focusable buttons;
  existing J/L/K/bracket shortcuts remain excluded from native controls.
- Vehicle lifecycle and evidence remain available as text when WebGL is disabled
  or the static fallback is selected.
- `SCHEMATIC`, model-truth, missing-data, and `AUDIO NOT AVAILABLE` labels remain
  in the mobile accessibility tree.
- Root horizontal overflow checks passed at 390×844 and 320×720 for both modes.
- No per-frame or per-second `aria-live` announcement was introduced.

## Open questions / known gaps

1. Continuous altitude, velocity, attitude, range, orbital, propellant, and
   biomedical data are not available in the reviewed pack and remain hidden with
   explicit explanations.
2. TLI cutoff, service-module burn cutoffs, APS cutoff, parachute subevents, and
   detailed recovery sequence METs are not in the verified event set. The UI
   reports `CUTOFF MET N/A` or `NOT VERIFIED` instead of extending a burn or
   inventing subevents.
3. The 1201/1202 alarm events remain pending and do not enter ACTUAL replay.
4. Lunar surface position, orbit rings, transfer paths, lighting, camera, and
   relative vehicle placement are schematic, not recovered navigation data.
5. The Moon uses a modern NASA LRO color product; no DEM/displacement or claim of
   a July 1969 same-instant globe is made.
6. Historical audio remains unavailable because verified local bytes, hashes,
   synchronization, and clip boundaries do not exist.
7. The Control-only Three/R3F chunk exceeds the 900 kB minified warning
   threshold; deeper code splitting and performance closure remain Phase 6/7.
8. The upstream R3F stack emits a non-fatal `THREE.Clock` deprecation warning.

## Explicitly not completed

- Phase 6 complete Archive chapter set, final UI state coverage, sound/caption
  implementation, reduced-motion certification, 200% zoom certification, and
  final accessibility/performance closure are not claimed.
- Phase 7 release audit, visual-regression baseline, sustained GPU-resource
  monitoring, publication, deployment, and release candidate are not completed.
- No new mission fact, event, MET, quote, telemetry series, audio clip, model,
  texture, or source classification was created.
- No pending event was promoted to ACTUAL and no missing value was replaced by
  zero or interpolation.
- No certified NASA CAD, certified AS-506 digital twin, certified Columbia
  model, or certified LM-5 geometry claim is made.
- No GLM-generated code, external model collaboration, push, deployment, or
  formal Phase 6 work was performed.
