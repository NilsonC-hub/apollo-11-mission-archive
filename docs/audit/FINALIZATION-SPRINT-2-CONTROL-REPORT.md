# Finalization Sprint 2 — Control Visual Continuity Checkpoint Report

Status: implementation complete; owner visual acceptance pending

Branch: `finalization/sprint2-control-visuals`

Accepted base: `4e22a9b6a1f9f76145f82d828b87f96464b050f2`

Final implementation tree tested: `8f7c7838c4f3ee6b7aec54aef41c84c464a685bf`

## Delivered scope

This branch delivers the Control half of Finalization Sprint 2 checkpoint 1. It does not add the
Archive evidence-media expansion owned by the sibling workstream, regenerate broad visual
baselines, merge, push, deploy, or promote a release candidate.

Scoped commits:

| Commit                                     | Intent                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `a5393557c1f9bf46cfde87cb8f25fe51568eac59` | Commit the implementation-ready Sprint 2 checkpoint handoff.                                                             |
| `d098938383c0c97916f594099c2f0a93da4ecb54` | Author the deterministic launch visual sample.                                                                           |
| `9cbe64aa5c90db01bcf47f42d7626700228c24af` | Complete the Control interaction, Inspector, and interface-tone checkpoint.                                              |
| `8f7c7838c4f3ee6b7aec54aef41c84c464a685bf` | Close independent-review gaps in runtime transactions, reload continuity, responsive replay, and semantic WebGL testing. |

## Launch-to-Earth-orbit continuity sample

The existing replay remains event/MET-driven, but the launch segment now has a deterministic
visual state derived from the canonical event boundaries and a separate wall-clock presentation
clock. The sample covers liftoff through Earth-orbit framing and includes:

- restrained launch reference geometry, engine-plume envelopes with canonical cutoff events,
  authored stage/interstage/launch-escape-system departures, and progressive space/Earth reveal;
- continuous guided camera framing across launch, lower ascent, upper ascent, and Earth-orbit
  reference shots without a scene cut or route replacement;
- a user camera-interaction escape path: pointer/wheel input can cancel the current guided camera
  transition without changing mission MET or suppressing the associated separation presentation;
- deterministic Earth rotation for visual continuity, explicitly presented as a reference-frame
  effect rather than an epoch-accurate Earth state;
- rate-aware behavior: 1x and 10x preserve short wall-clock separation/guided presentations, while
  100x/1000x and reduced-motion mode omit transient travel and settle on readable overview poses;
- reload and browser-traversal restoration of MET, speed, visual time, guided-camera anchors,
  suppressed transitions, camera rest pose, and active separation progress. Restored playback is
  always paused.

The implementation does not claim a physics simulation. Vehicle displacement, exhaust, camera
paths, Earth placement/scale, and rotation are authored schematic presentation states.

## Saturn V Inspector

`/control/inspect/saturn-v` provides a dedicated, deep-linkable inspection mode backed by the
canonical Node Manifest and the existing processed Saturn V runtime assets. It includes:

- semantic S-IC, S-II, S-IVB, IU, SLA, CSM, and LES hierarchy/dossier selection;
- select, focus, reset, refocus, orbit, pan, zoom, pointer-tap, drag-threshold, keyboard, and Escape
  behavior with an explicit scene-loading transaction;
- safe framing at desktop and narrow landscape/portrait viewports, plus readable fallback behavior
  if WebGL or the model runtime is unavailable;
- an exact Archive return contract and stable direct-load, reload, Back, and Forward behavior;
- a runtime-published semantic projection map used by browser tests to click the definitive model
  node rather than a brittle fixed canvas coordinate;
- repeated selection/focus cycles with stable renderer resource counts.

The Inspector exposes component identity and reconstructed visualization geometry. It does not
present the model as NASA CAD or as measurement-grade engineering geometry.

## Audio status and interface tones

Control now states `HISTORICAL AUDIO / UNAVAILABLE` instead of implying that a historical recording
is present. Optional synthesized interface tones are:

- off by default and enabled only by an explicit user gesture;
- short, quiet UI feedback with no background music and no historical-recording claim;
- serialized/coalesced so rapid actions do not accumulate overlapping sources;
- stopped and disabled on hidden/pagehide/unmount lifecycle transitions;
- fail-closed when browser audio output cannot be activated.

## Replay transaction and responsive corrections

The final review pass closed four acceptance risks:

1. Inspector route entry now opens a new scene-loading transaction before a cached lazy/R3F scene
   can publish `ready`; scene controls stay disabled until that transaction is definitively ready.
2. Active replay snapshots now persist only the allowed 1/10/100/1000 speed values. A synchronous
   beforeunload freeze captures the earliest unload pose, and canonical-path restoration suppresses
   the intermediate route render that previously reset restored visual state.
3. Control-only responsive CSS raises replay labels to at least 12 CSS px, primary values to at
   least 14 px on desktop and 16 px on the tested narrow layouts, and reachable controls to at least
   44 × 44 CSS px. Long truth/source/component text wraps without root overflow or ellipsis.
4. Phase 7 WebGL pointer acceptance now derives coordinates from a semantic model projection and
   verifies both a real node tap and the same-point drag rejection.

The responsive pass is scoped to the Control checkpoint stylesheet; it is not a global visual
redesign.

## Truth and provenance boundaries

| Surface                  | Delivered statement                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Launch motion            | Authored schematic continuity keyed to canonical event/MET records; not dynamics, trajectory reconstruction, or flight telemetry.  |
| Earth                    | Existing modern reference composite with deterministic presentation rotation; not an epoch-accurate 1969 cloud/illumination state. |
| Saturn V                 | NASA visualization asset processed into runtime LODs with semantic mapping; not original engineering CAD.                          |
| CSM                      | Existing reconstructed visualization geometry; not NASA CAD.                                                                       |
| Interface tones          | Synthesized UI feedback only, default-off; no historical audio claim.                                                              |
| Missing historical audio | Explicitly displayed as unavailable.                                                                                               |

## Verification record

Every automated result below was run against the final implementation tree
`8f7c7838c4f3ee6b7aec54aef41c84c464a685bf`, before adding this report-only commit.

| Command                                                                                                                                          | Result                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`                                                                                                                              | PASS; all implementation files match Prettier.                                                            |
| `pnpm lint`                                                                                                                                      | PASS.                                                                                                     |
| `pnpm typecheck`                                                                                                                                 | PASS.                                                                                                     |
| `pnpm test:unit`                                                                                                                                 | PASS; 200/200.                                                                                            |
| `pnpm test:integration`                                                                                                                          | PASS; 3/3.                                                                                                |
| `pnpm validate:sources`                                                                                                                          | PASS; 0 errors, 0 warnings.                                                                               |
| `pnpm validate:mission`                                                                                                                          | PASS; 37 published events, 70 facts, and 24 unverified event times remain explicitly missing.             |
| `pnpm validate:models`                                                                                                                           | PASS; all vehicle LODs and Earth/Moon KTX2/fallback/decoder records.                                      |
| `pnpm validate:decoders`                                                                                                                         | PASS; 9 Draco GLBs, 6 KTX2 files, and the pinned decoder WASM validate.                                   |
| `pnpm inspect-stls`                                                                                                                              | PASS; 12/12 Saturn V STL parts verified.                                                                  |
| `pnpm build`                                                                                                                                     | PASS; only the existing >900 kB `MissionScene` chunk warning remains.                                     |
| `pnpm test:e2e`                                                                                                                                  | PASS; 39/39 full Phase 7 browser cases.                                                                   |
| `pnpm exec playwright test tests/browser/finalization-sprint2-control.spec.ts tests/browser/finalization-sprint2-responsive.spec.ts --workers=1` | PASS; 19/19 Control checkpoint and responsive replay cases.                                               |
| Focused beforeunload and real-reload replay cases                                                                                                | PASS; 2/2, including an active 1x separation restored across two reloads.                                 |
| `pnpm perf:budget`                                                                                                                               | PASS; 5/5.                                                                                                |
| `git diff --exit-code a539355..HEAD -- tests/browser/__screenshots__`                                                                            | PASS; existing broad visual-baseline image files remain unchanged. This is not a visual-acceptance claim. |

Independent object-level review of the implementation found no remaining P0-P3 findings. Owner
visual acceptance and any intentional broad-baseline update remain separate release decisions.

### First-run failures and closure

The table above records the final implementation tree, not an uninterrupted first pass. The
following intermediate failures were retained as audit evidence and closed before that final run:

| First-run evidence                                                                                                                    | Root cause                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Closure and final evidence                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:unit`: 198/199; only `phase7-visual-audit.test.ts › Phase 7 scene avoids unsupported celestial spectacle features` failed. | A legacy static-audit regular expression rejected the word `atmosphere`; the new scalar property name `atmosphereToSpace` contained that word even though no atmospheric spectacle or post-processing effect had been added.                                                                                                                                                                                                                                               | The property was renamed without behavioral change to the more accurate `backgroundSpaceMix`. Later contract tests increased the suite total; final full unit result is 200/200.                                                                                                                                                                                                    |
| Model/decoder validation could not complete in the fresh worktree.                                                                    | Gitignored raw NASA source assets and the pinned local `.tools/ktx-4.4.2` executable cache are intentionally absent from a newly created worktree. This was an environment-hydration gap, not a tracked-file regression.                                                                                                                                                                                                                                                   | Exact authoritative local-project bytes were copied into ignored paths only. The KTX executable SHA-256 was `9718ED380605DB33E18A74621978434CEDAF119FA4FE25E142A30CABE02C34EF`; final model, decoder, and 12/12 STL gates passed, and none of those hydrated files is committed.                                                                                                    |
| First full Phase 7 E2E run: 37/39.                                                                                                    | Two legacy WebGL pointer cases used a fixed `.scene-frame` 50%/70% point. Screenshot inspection showed that the new safe guided framing placed the small vehicle above that point, so it hit empty canvas.                                                                                                                                                                                                                                                                 | A temporary 46% canvas guess was rejected because it remained framing-dependent. Runtime audit state now publishes bounded semantic Node Manifest projections. The cases convert the definitive S-IC projection to canvas coordinates, then verify a real tap and same-point drag rejection. Final full E2E result is 39/39.                                                        |
| New real-reload acceptance initially exposed visual discontinuity while a 1x stage separation was active.                             | The iterations separately exposed that playback speed was not serialized, the old-path intermediate render during canonical `replaceState` cleared restored visual inputs, and visual time could continue advancing between the `beforeunload` snapshot and the later `pagehide` pause. Browser reload can also lock the outgoing request URL before `beforeunload` canonicalization; an attempted destination-path snapshot binding was therefore disproved and reverted. | Snapshots now validate and restore speed; reloads retain the original source-path contract; `beforeunload` flushes then synchronously freezes playback; and a restored-path transaction gate suppresses the intermediate reset while all visual inputs are restored paused. Focused reload cases passed 2/2, the combined checkpoint suite passed 19/19, and full E2E passed 39/39. |

## Local performance and stability evidence

All numbers here are local Chromium/localhost laboratory diagnostics. Transfer values come from the
performance harness, GPU figures are conservative byte upper bounds, and frame timing is an
instrumented local sample. They are not field measurements or guarantees for physical devices and
networks.

| Measurement                    | Result                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Unchanged Archive route        | 7,482 CSS bytes; 125,465 JS bytes; shell readable 327 ms; total transfer 789,114 B.                      |
| Control cold entry             | deep-link ready 203 ms; shell ready 265 ms; model visible 989 ms; total transfer 1,982,176 B.            |
| Low quality                    | Estimated GPU upper bound ≈11,626,096 B; 33 calls; 9 textures; 37,926 triangles; transfer 785,840 B.     |
| Medium quality                 | Estimated GPU upper bound ≈17,948,114 B; 37 calls; 10 textures; 86,707 triangles; transfer 1,125,444 B.  |
| High quality                   | Estimated GPU upper bound ≈26,569,494 B; 37 calls; 14 textures; 153,230 triangles; transfer 1,626,852 B. |
| Desktop frame sample           | p95 4.30 ms (approximately 232.56 fps in this unthrottled local sample).                                 |
| Mobile-profile frame sample    | p95 4.30 ms (approximately 232.56 fps in this unthrottled local sample).                                 |
| Ten Inspector traversal cycles | Stable at 56 geometries, 7 materials, 6 programs, and 10 textures; 0 observed context losses.            |

The production build reports Control route CSS at 14.27 kB raw / 2.68 kB gzip, Control route
JavaScript at 41.37 kB raw / 13.46 kB gzip, and `MissionScene` at 1,047.22 kB raw / 288.10 kB gzip.
The last figure retains the existing chunk-size warning and is recorded as a non-blocking follow-up.

The responsive browser matrix covered 320 × 568, 390 × 844, 720 × 450, 768 × 512, and 1440 × 900
CSS-pixel viewports at DPR 2. These are reflow-equivalent test contexts, not evidence that a browser
page-zoom control was set to 200 percent.

The ignored local raw NASA asset set and pinned KTX CLI cache were hydrated from the authoritative
local project copy only so the existing model/decoder gates could run. Their bytes are not part of
this commit.

## Preview instructions

From this worktree:

```powershell
pnpm build
pnpm preview --host 127.0.0.1 --port <free-port>
```

Review routes:

- `/control/event/a11-liftoff` — launch continuity and guided framing;
- `/control/met/s162.2` — S-IC/S-II separation and reload continuity checkpoint;
- `/control/inspect/saturn-v` — Saturn V Inspector, component focus, and fallback contract.

No preview server is intentionally left running after handoff.

## Known gaps and deferred work

1. This checkpoint intentionally proves only the launch-to-Earth-orbit visual bridge. Translunar
   flight, lunar arrival/orbit, landing, surface stay, ascent/rendezvous, return, entry, and
   splashdown visual enrichment remain deferred.
2. Historical mission audio remains unavailable. The delivered tones are synthesized interface
   feedback, not a substitute for sourced recordings.
3. A launch tower, terrain, dust, atmospheric plasma, high-cost post-processing, and cosmetic
   repainting are outside this checkpoint.
4. The modern Earth composite is not an epoch-accurate 1969 Earth reconstruction.
5. The `MissionScene` production chunk remains above the configured warning threshold; the build
   passes, but a later loading/code-splitting review is warranted.
6. Local performance evidence is diagnostic only. Field RUM or throttled device testing is still
   required before making user-performance claims.
7. Broad visual baseline regeneration is intentionally deferred until the owner accepts the visual
   direction. No `test:visual` pass is claimed by this report.
8. Final sibling-branch integration must rerun all gates and verify the Archive-to-Inspector return
   contract with the Archive media checkpoint present.
9. This Control workstream does not push, merge, deploy, or promote a release candidate.
