# Apollo 11 visual direction prototype

This folder is an explicitly **non-production** interaction and visual-direction
prototype. It is not Phase 1, Phase 4, or a production application increment.

## Boundary

- It does not import or modify `src/mission-core`, the Apollo 11 mission pack,
  source/asset manifests, raw NASA archives, or Phase 0 audit reports.
- It uses plain HTML, CSS, and JavaScript. No React, Three.js, R3F, Zustand, or
  production runtime dependency has been added.
- Event values are a small display-only selection of values already verified in
  Phase 0. They are duplicated in `data.js` only to make the prototype portable;
  production must replace them with Fact/Event IDs from Phases 1–2.
- Diagrams are labelled `SCHEMATIC — NOT TO SCALE`. No diagram position,
  trajectory, vehicle silhouette, or animation is a mission measurement.
- The event-advance control demonstrates interaction rhythm only. It is not the
  production MET/storyTime/visualTime implementation.
- NASA imagery is loaded from the read-only `assets/raw/` archive and displayed
  with source and usage notes. It is not copied or altered here.

## Run

From the repository root:

```text
pnpm exec vite --host 127.0.0.1
```

Open:

- `http://127.0.0.1:5173/prototype/index.html#archive`
- `http://127.0.0.1:5173/prototype/index.html#control`

The production Phase 3 placeholder at `/` remains separate and unchanged by
the prototype.
