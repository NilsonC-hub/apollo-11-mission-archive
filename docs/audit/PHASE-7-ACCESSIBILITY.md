# Phase 7 Accessibility Audit

**Audit date:** 2026-07-14

**Target:** Production Spec §26 / WCAG 2.2 AA engineering checks

**Scope:** Archive and Mission Control production routes, keyboard, focus, contrast, Reduced Motion,
touch sizing, responsive layouts, 200% zoom equivalent, and non-WebGL fallback.

This is a project audit, not a third-party WCAG conformance certification.

## Automated results

| Route             | Lighthouse desktop | Lighthouse mobile | Contrast failures | Accessible-name failures | CLS |
| ----------------- | -----------------: | ----------------: | ----------------: | -----------------------: | --: |
| Archive           |                100 |               100 |                 0 |                        0 |   0 |
| Control / liftoff |                100 |               100 |                 0 |                        0 |   0 |

The audited contrast tokens are `--muted: #53574f` and `--oxide: #8d352d` on the Archive paper
surfaces. The redundant wordmark `aria-label` that disagreed with visible text was removed.

## Keyboard and focus

- First-entry keyboard flow exposes `Skip to content` and Enter moves focus to `#main-content`.
- The skip-link focus indicator is a visible 2 px outline.
- Archive chapter links, mode links, phase buttons, event controls, source disclosures, speed
  controls, and quality selection remain native interactive controls.
- Replay keyboard bindings remain documented in the UI: K play/pause, J/L previous/next, and [ / ]
  speed.
- Mode switching pauses playback and exposes explicit Resume / Keep Paused controls.
- Editorial pauses expose an explicit Continue Replay action and never pretend to be an operational
  mission hold.

## Responsive and zoom checks

The browser E2E matrix tested Archive, powered descent, and splashdown at:

- 320×568
- 390×844
- 768×1024
- 1024×768
- 1280×720
- 1440×900

All tested routes had 0–1 px root-width tolerance and no root horizontal scroll. Archive's chapter
rail may scroll inside its own labelled navigation region on narrow screens; it does not expand the
document root.

A separate context used a 720×450 CSS viewport with device scale factor 2, equivalent to the layout
area of a 1440×900 display at 200% zoom. The touchdown deep link, LM truth label, event text, and
fallback-capable scene remained readable with no root overflow.

## Touch targets

At 320 px and 390 px, Playwright measured all visible anchors, buttons, summaries, inputs, and
selects. No visible target was smaller than 44 px in either dimension after the Phase 7 mobile rules
were applied. Archive disclosure summaries, transcript entries, transport controls, and the range
input now meet that floor.

## Reduced Motion

- `prefers-reduced-motion: reduce` is detected.
- Root `scroll-behavior` resolves to `auto`.
- CSS transition durations collapse to the reduced-motion rule.
- The star field is static and fixed-seed in all modes; there is no flicker, drift, parallax game
  mechanic, or automatic camera rotation to disable.
- A dedicated Reduced Motion visual baseline is committed and compared by `pnpm test:visual`.

## Equivalent non-visual information

- Every 3D scene retains phase, component state, event log, evidence label, source locator, and
  data-availability text.
- WebGL unavailable and model/decoder failure paths keep that text and render a labelled static
  vehicle structure diagram.
- Historical audio remains unavailable rather than exposing an empty or deceptive player;
  transcript records and their source status remain visible.
- Missing continuous telemetry is written as `NOT AVAILABLE` / `NOT PUBLISHED`, never as zero.

## Accessibility verdict and limits

The automated Lighthouse, keyboard, focus, contrast, touch, Reduced Motion, responsive, and 200%
layout-equivalent checks pass. No product accessibility failure was found in that scope.

Known limit: no physical assistive-technology session with NVDA, JAWS, VoiceOver, Switch Control, or
voice input was run. The project therefore does not claim independent WCAG certification from this
audit alone.
