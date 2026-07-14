# Phase 7 Performance Audit

**Audit date:** 2026-07-14

**Build:** production Vite preview from `master` Phase 7 working tree

**Environment:** Windows, Node 25.8.1, pnpm 10.6.2, Google Chrome 150.0.7871.101,
`@playwright/test` 1.61.1

**Important:** these are measurements from the named local headless-Chrome environment, not mission
facts and not promises for every end-user device.

## Method

- `pnpm build` produced the audited production bundle.
- Lighthouse 13.4.0 ran four isolated cold-route audits through Chrome's remote-debugging port.
- Repository Playwright tests used new contexts, production routes, and disabled-cache checks.
- FPS is based on Three's cumulative `renderer.info.render.frame`, sampled during 1× replay. It is
  not a count of browser `requestAnimationFrame` callbacks.
- The GPU estimate is a conservative engineering upper bound: 108 bytes per visible triangle, two
  mipmapped 1K RGBA8 celestial textures, then 20% overhead. Actual compressed GPU allocation is
  renderer/driver dependent.

## Production bundle

| Artifact     |    Minified |      Gzip |
| ------------ | ----------: | --------: |
| Entry        |   184.84 kB |  58.50 kB |
| ArchiveRoute |    20.10 kB |   5.98 kB |
| ControlRoute |    16.93 kB |   5.72 kB |
| MissionScene | 1,000.28 kB | 275.77 kB |
| CSS          |    34.65 kB |   7.20 kB |

The build passes. Vite still emits the configured warning because `MissionScene` exceeds 900 kB
minified. It remains lazy and route-isolated; the warning is not suppressed.

## Cold-route transfer and readiness

| Route / method                          | JS encoded body | CSS encoded body | Total transfer | Shell / deep link readable | Interactive shell | Model visible proxy |
| --------------------------------------- | --------------: | ---------------: | -------------: | -------------------------: | ----------------: | ------------------: |
| Archive / Playwright cold context       |       122,138 B |          7,155 B |      785,460 B |                     463 ms |               n/a |                 n/a |
| PDI Control / Playwright cache disabled |        included |         included |    1,955,175 B |                     275 ms |            346 ms |            1,135 ms |

The Archive JS result is 119.28 KiB, below the 350 KiB gzip/encoded-body target. The Control
measurement uses `/control/event/a11-pdi-ignition`, so it includes the lunar scene's lazy model,
decoder, and texture requests. `model visible proxy` means a canvas existed and the renderer
reported more than five geometries; it does not use `camera.lookAt()` as a visibility claim.

## Lighthouse

| Route             | Profile | Performance | Accessibility |      FCP |      LCP |      TBT | CLS |    Transfer | Requests |
| ----------------- | ------- | ----------: | ------------: | -------: | -------: | -------: | --: | ----------: | -------: |
| Archive           | Desktop |          99 |           100 |   435 ms | 1,011 ms |     0 ms |   0 |   786,878 B |       11 |
| Archive           | Mobile  |          79 |           100 | 1,951 ms | 5,307 ms |     0 ms |   0 |   786,878 B |       11 |
| Control / liftoff | Desktop |          97 |           100 |   433 ms |   744 ms |   143 ms |   0 | 1,484,233 B |       28 |
| Control / liftoff | Mobile  |          83 |           100 | 1,910 ms | 3,515 ms | 291.5 ms |   0 | 1,421,117 B |       27 |

Lighthouse JSON is retained in ignored local audit output under
`output/playwright/phase7-audit/`. The mobile Archive LCP is a known performance gap even though the
explicit §35 route and scene budgets pass.

## Scene quality budgets

Each quality was loaded in a fresh route state and traversed through all eight phase controls.
Transfer includes every GLB and KTX2 requested during that traversal.

| Quality | Intended use    | Max visible triangles | Max draw calls | Max textures | GLB + KTX2 transfer | Conservative GPU upper bound | Budget result                        |
| ------- | --------------- | --------------------: | -------------: | -----------: | ------------------: | ---------------------------: | ------------------------------------ |
| Low     | Mobile default  |                37,926 |             29 |            9 |           785,840 B |                    11.09 MiB | PASS: ≤120k, ≤100, ≤7 MiB, ≤128 MiB  |
| Medium  | Desktop default |                86,707 |             33 |           10 |         1,125,444 B |                    17.12 MiB | PASS: ≤400k, ≤200, ≤12 MiB, ≤256 MiB |
| High    | User-selected   |               153,230 |             33 |           14 |         1,626,852 B |                    25.34 MiB | PASS: ≤400k, ≤200, ≤30 MiB, ≤256 MiB |

The runtime celestial maps are the 1K variants for all three model qualities. Selecting high model
quality does not imply a historically reconstructed celestial image or silently select the 4K
derived texture.

## Renderer FPS

| Profile  | Samples | Renderer frames |    Elapsed |    Average | p50 frame interval / FPS | p95 frame interval / FPS |        Target |
| -------- | ------: | --------------: | ---------: | ---------: | -----------------------: | -----------------------: | ------------: |
| 1440×900 |     120 |             119 | 1,004.1 ms | 118.51 fps |      8.3 ms / 120.48 fps |      8.5 ms / 117.65 fps | p95 ≥50: PASS |
| 390×844  |     120 |             119 |   999.9 ms | 119.01 fps |      8.3 ms / 120.48 fps |      8.5 ms / 117.65 fps | p95 ≥30: PASS |

The headless Chrome scheduler exposed a 120 Hz cadence on this host. These values prove the tested
build clears the engineering floor on this host; they are not evidence that every physical mobile
GPU will run at 120 fps.

## Renderer resource stability

After a warm traversal loaded every phase asset, ten further complete traversals reported the exact
same resource tuple on every cycle:

| Metric               | Warmed value | Cycles 1–10 | Result |
| -------------------- | -----------: | ----------- | ------ |
| Canvas count         |            1 | always 1    | PASS   |
| Geometries           |           55 | always 55   | PASS   |
| Materials            |            7 | always 7    | PASS   |
| Textures             |           10 | always 10   | PASS   |
| Programs             |            6 | always 6    | PASS   |
| WebGL context losses |            0 | 0 total     | PASS   |

Phase 7 found and fixed an earlier leak in `webglAvailable()`: the old implementation created a new
probe context on every MET render. The probe is now cached and its one diagnostic context is
explicitly released. The browser console returned to one upstream warning only:
`THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`

## Route isolation and failure behavior

- Archive cold-route requests contain no `MissionScene`, Three, R3F, GLB, KTX2, Draco, or Basis
  resource.
- All runtime model, texture, and decoder requests are same-origin and local.
- Aborting model, texture, and decoder requests produces the static vehicle fallback while retaining
  MET, phase, event, provenance, and transcript text.
- Returning a null WebGL/WebGL2 context prevents Canvas creation and renders the same readable
  fallback.

## Performance verdict

The explicit §35 default desktop/mobile budgets pass, Archive route isolation passes, renderer
resources plateau, and failure behavior is readable. Performance alone does not block an RC.

Known gaps remain visible and unsuppressed:

1. Mobile Archive Lighthouse LCP: 5.307 s / score 79 under simulated throttling.
2. MissionScene: 1,000.28 kB minified and still above the 900 kB warning threshold.
3. Control's only normal console warning is the upstream Three Clock deprecation.
