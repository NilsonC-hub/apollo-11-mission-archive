# Phase 7 Visual Regression Audit

**Audit date:** 2026-07-14

**Runner:** `@playwright/test` 1.61.1, Google Chrome 150.0.7871.101, Windows headless

**Command:** `pnpm test:visual`

## Baseline result

Eighteen deterministic screenshots were generated with `pnpm test:visual:update` and then compared
in a separate run. Result: **18 passed, 0 failed**.

The committed PNGs live in `tests/browser/__screenshots__/`. Exact byte lengths, SHA-256 values,
routes, viewports, and states are in `PHASE-7-VISUAL-BASELINE.json`.

Comparison settings:

- animations disabled;
- caret hidden;
- pixel threshold 0.2;
- maximum differing pixel ratio 1%;
- fixed-seed, static star field;
- source-bound event deep links;
- no random visual time, scanline, noise, auto-rotation, or wall-clock scene state.

## Production Spec §45 coverage

| Required view                             | Baseline evidence                                               |
| ----------------------------------------- | --------------------------------------------------------------- |
| Archive Mission Index desktop / 390 px    | `archive-index-desktop.png`, `archive-index-mobile-390.png`     |
| Archive Saturn V / Spacecraft             | `archive-saturn-v.png`, `archive-spacecraft.png`                |
| Launch / ascent                           | `control-editorial-pause.png` at verified liftoff               |
| Translunar coast                          | `control-a11-tli-ignition.png`                                  |
| Powered descent                           | `control-a11-pdi-ignition.png`                                  |
| Lunar surface operations                  | `control-a11-touchdown.png`, `control-a11-first-step.png`       |
| Editorial pause + audio/transcript status | `control-editorial-pause.png`                                   |
| Entry / recovery                          | `control-a11-entry-interface.png`, `control-a11-splashdown.png` |
| Mission Complete                          | `control-a11-splashdown.png`                                    |
| WebGL fallback                            | `control-webgl-fallback.png`                                    |
| Reduced Motion                            | `control-reduced-motion.png`                                    |
| 390 px event jump / playback              | `control-mobile-390-playback.png`                               |

The desktop baseline also covers every required Appendix C.9 event ID: TLI, LOI, undocking, PDI,
touchdown, first step, lunar liftoff, TEI, entry interface, and splashdown.

## Visual boundary review

- Archive remains a document register rather than a generic SaaS dashboard.
- Control remains a restrained historical replay rather than a game or cinematic HUD.
- The star field is low-density, fixed-seed, static, and continuously labelled
  `SCHEMATIC · NOT NAVIGATION`.
- No CRT scanlines, pixel grid, noise overlay, retro filter, nebula, close unrelated planet, lens
  flare, atmospheric fog, blinking/drifting stars, or telescope interaction appears.
- Saturn V, LM, CSM, celestial texture, motion, and local-view truth labels remain visible.
- Powered descent and surface operations use different information configurations.
- Fallback retains the vehicle structure diagram, MET, source status, and transcript/data panels.

## Appendix C.9 gap

The committed baseline does **not** close the full Appendix C.9 cross-product. The following
combinations are still absent:

- all ten event IDs at all four mandatory viewports as committed screenshots;
- low texture, high texture success, and injected high-texture failure for each event/viewport;
- user interruption during camera tween (the current product has no authored guided camera tween);
- backward scrub and re-entry screenshots for every event/resource state.

The E2E suite does cover the six responsive viewports, all ten direct deep links, backward-capable
deterministic state, Reduced Motion, explicit fallback, browser WebGL unavailability, and injected
model/texture/decoder request failure. That is strong functional evidence, but it is not the
exhaustive committed screenshot matrix required by Appendix C.9.

## Visual verdict

The §45 baseline passes and is reproducible. The Appendix C.9 cross-product remains a documented
release blocker; visual evidence alone does not approve an RC.
