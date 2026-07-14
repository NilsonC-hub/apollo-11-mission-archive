# Phase 3 Completion Report

## Scope completed

Phase 3 delivers the reproducible model and celestial-asset pipeline required by
Production Spec §30–§35 and §52. It does not deliver the React/R3F application.

- Archived and hash-verified official NASA 8K Earth and Moon imagery sources.
- Produced high/medium/low Draco GLBs for Saturn V, the Lunar Module, and a
  reconstructed Command and Service Module.
- Produced 1K/2K/4K ETC1S KTX2 Earth and Moon color maps with mipmaps.
- Added stable semantic nodes, required anchors, versioned Node Manifests, a
  populated Asset Manifest, model/texture processing reports, and thumbnails.
- Staged pinned local Draco and Basis Universal decoder artifacts and verified
  offline decoding/validation.
- Added a static, accessible SVG vehicle-structure fallback.

## Files changed

- Asset recipes and validators: `scripts/blender/process_apollo11_assets.py`,
  `scripts/optimize-models.ts`, `scripts/bootstrap-ktx.ts`,
  `scripts/prepare-textures.ts`, `scripts/stage-decoders.ts`,
  `scripts/validate-decoders.ts`, `scripts/validate-models.ts`,
  `scripts/hydrate-assets.ts`.
- Derived assets: `assets/derived/models/`, `assets/derived/textures/`.
- Manifests: `src/missions/apollo11/asset-manifest.json`,
  `src/missions/apollo11/node-manifests/*.json`, and two new image records in
  `src/missions/apollo11/source-manifest.json`.
- Offline/fallback runtime files: `public/missions/apollo11/decoders/` and
  `public/missions/apollo11/fallbacks/vehicle-structure.svg`.
- Processing evidence: `docs/audit/PHASE-3-MODEL-PROCESSING.json`,
  `docs/audit/PHASE-3-TEXTURE-PROCESSING.json`, and `docs/media/phase3-*.png`.
- Regression coverage: `tests/unit/apollo11-assets.test.ts`.
- Project status/commands: `AGENTS.md`, `README.md`, `package.json`,
  `.gitignore`, `.prettierignore`, `eslint.config.js`, `index.html`, and
  `src/placeholder.ts`.

## Facts added

| Fact ID | Value                                | Evidence | Citation |
| ------- | ------------------------------------ | -------- | -------- |
| None    | Phase 3 adds no mission Fact records | N/A      | N/A      |

Normalization dimensions are asset-processing inputs, not new replay facts:
Saturn V height follows the already archived Saturn source; generic LM footpad
span is read from `NASA-LM-HB-WB.pdf` PDF p19, Figure 1-3; CM height and diameter
are read from `NASA-CSM06-WB.pdf` PDF p1 / printed p39. They are recorded only
inside processing recipes and Node Manifests.

## Events added or changed

| Event ID | MET | Action                                       | Citation |
| -------- | --- | -------------------------------------------- | -------- |
| None     | N/A | No mission event or MET was added or changed | N/A      |

## Schematic / reconstructed content

| ID                                  | What is authored                                                                                 | Why                                                     | UI label                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `apollo11-saturn-v` semantic bands  | Raw NASA visualization triangles assigned to stage nodes by versioned face-centroid height bands | Source GLB has no semantic stage nodes                  | `NASA VISUALIZATION MODEL — SEMANTIC SPLIT RECONSTRUCTED; NOT NASA CAD`                |
| `apollo11-lunar-module` stage split | Generic LM source triangles assigned above/below raw height 2.50                                 | Source GLB has no ascent/descent nodes                  | `NASA GENERIC APOLLO LM VISUALIZATION — NOT CERTIFIED LM-5; STAGE SPLIT RECONSTRUCTED` |
| `apollo11-command-service-module`   | NASA print-kit CM and SM STLs reoriented, normalized, assembled, materialized, and reduced       | No verified independent Apollo 11 CSM GLB was found     | `RECONSTRUCTED FROM NASA REFERENCES — NOT NASA CAD`                                    |
| Earth sphere color                  | Modern NASA Blue Marble global composite                                                         | Stable global map is not a same-instant 1969 photograph | `NASA IMAGERY-BASED TEXTURE — MODERN COMPOSITE`                                        |
| Moon sphere color                   | Modern LRO color product with pole fill                                                          | Stable global map is not the 1969 visual appearance     | `NASA IMAGERY-BASED TEXTURE — MODERN LRO PRODUCT`                                      |
| `vehicle-structure-fallback`        | Editorial static vehicle diagram                                                                 | Archive/replay must remain usable without WebGL         | `SCHEMATIC — NOT TO SCALE`                                                             |

## Assets processed

| Asset ID                          | Raw hash                                       | Derived hash                                                                   | Before                                                                          | After                                                                                                 | Recipe                                       |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `apollo11-saturn-v`               | `6c44497bce54…06b5`                            | high `4206c3c82c51…4087`; medium `ccd451723067…93d7`; low `3cfa51e4b523…d356`  | 34,814 triangles, 23 animations, non-semantic nodes, source height 12.987 units | 34,814 / 19,147 / 7,718 triangles; 0 animations; nine semantic mesh nodes; meter/+Y normalized; Draco | `scripts/blender/process_apollo11_assets.py` |
| `apollo11-lunar-module`           | `379101dfcee3…c4e`                             | high `8195b2144cb3…4dc5`; medium `2633e76e48ac…d674`; low `3c92bcab0174…1583`  | 97,588 triangles, 135 animations, generic non-semantic GLB                      | 97,588 / 53,671 / 21,468 triangles; 0 animations; ascent/descent nodes; meter/+Y normalized; Draco    | Same Blender recipe                          |
| `apollo11-command-service-module` | CM `12d6e8d1bc35…32b2`; SM `1e7b612d310b…9fbe` | high `7cf1b2c1d991…74a48`; medium `1ae76b6778a3…444c`; low `34c297a90399…e6fe` | Two print-oriented, unmaterialized STL parts                                    | 50,234 / 27,628 / 11,050 triangles; separate CM/SM nodes; anchors; meter/+Y; Draco                    | Same Blender recipe                          |
| `earth-blue-marble`               | `d36bc094b710…b58b`                            | 1K `29d555c3890b…2cdf`; 2K `296b676a4044…ec60`; 4K `ce35ebeac64e…943`          | Official NASA SVS 8192×4096 TIFF                                                | ETC1S KTX2, sRGB, mipmapped, 1K/2K/4K                                                                 | `scripts/prepare-textures.ts`                |
| `moon-lro-color`                  | `4af8b0cd4d50…b4ef`                            | 1K `b89a00c9cf04…c63f`; 2K `876928cbf1fa…fcc9`; 4K `dca8f26d8927…8b65`         | Official NASA SVS 8192×4096 pole-filled LRO TIFF                                | ETC1S KTX2, sRGB, mipmapped, 1K/2K/4K                                                                 | Same texture recipe                          |

Exact hashes, byte lengths, bounds, triangle counts, encoder settings, and paths
are in the Asset/Node Manifests and the two Phase 3 processing JSON reports.

## Commands run

| Command                  | Exit code | Summary                                                                                              |
| ------------------------ | --------: | ---------------------------------------------------------------------------------------------------- |
| `pnpm bootstrap:ktx`     |         0 | Verified official Khronos 4.4.2 installer and web-transcoder hashes; provisioned project-local tools |
| `pnpm optimize:models`   |         0 | Rebuilt 9 Draco GLBs and 3 audit thumbnails with Blender 4.3.2                                       |
| `pnpm optimize:textures` |         0 | Built 6 KTX2 variants from the two official 8K TIFF sources                                          |
| `pnpm stage:decoders`    |         0 | Restored four pinned, unmodified local decoder artifacts                                             |
| `pnpm typecheck`         |         0 | TypeScript project references passed                                                                 |
| `pnpm lint`              |         0 | ESLint passed with generated/tool caches excluded                                                    |
| `pnpm format:check`      |         0 | All tracked authoring files matched Prettier style; pinned decoder files are excluded from rewriting |
| `pnpm test:unit`         |         0 | 112/112 tests passed                                                                                 |
| `pnpm validate:sources`  |         0 | 0 errors, 0 warnings; new 8K NASA source hashes verified                                             |
| `pnpm validate:mission`  |         0 | 37 published events, 70 facts, 24 missing event times; no Phase 3 event changes                      |
| `pnpm validate:models`   |         0 | Raw reports plus all 3×3 model LODs, semantic paths, KTX2 files, fallback, and decoder hashes passed |
| `pnpm validate:decoders` |         0 | Both WASM modules compiled; 9 Draco GLBs decoded; 6 KTX2 files validated offline                     |
| `pnpm inspect-stls`      |         0 | 12/12 NASA print-kit STLs matched size, hash, triangles, and bounds                                  |
| `pnpm build`             |         0 | Phase 3 placeholder build passed; `dist/index.html` 1.56 kB, gzip 0.76 kB                            |

## Screenshots / recordings

- `docs/media/phase3-apollo11-saturn-v.png` — high LOD audit render.
- `docs/media/phase3-apollo11-lunar-module.png` — high LOD audit render.
- `docs/media/phase3-apollo11-command-service-module.png` — reconstructed high
  LOD audit render. The first generated orientation was rejected during visual
  QA; the recipe now flips the print-kit long axis so the CM and SPS bell are
  correctly ordered.
- No production browser recording exists because Phase 4 UI has not started.
  The separate `prototype/` remains the explicitly non-production visual study.

## Performance delta

- Desktop default candidate (Saturn V medium + CSM medium + Earth 2K):
  923,508 transferred asset bytes and 46,775 model triangles before renderer
  overhead. This is below the Phase 3 default transfer and visible-triangle
  budgets.
- Mobile default candidate (Saturn V low + CSM low + Earth 1K): 420,392 bytes
  and 18,768 model triangles before renderer overhead.
- User-selected high assets remain individually below the 400k triangle budget.
- Frame-rate, draw-call, GPU-memory, disposal, and ten-reset checks require the
  Phase 4 renderer and are not claimed here.

## Accessibility checks

- The WebGL fallback is an inline-readable SVG with `<title>`, `<desc>`, and a
  persistent `SCHEMATIC — NOT TO SCALE` label.
- Node Manifests provide the structure needed for a Phase 4 text tree/table
  alternative to 3D.
- Keyboard, zoom, reduced-motion, touch-target, and screen-reader UI tests are
  not applicable until the Phase 4 interface exists.

## Open questions / known gaps

1. Saturn V stage interfaces are deterministic editorial face bands, not
   manufacturing separation planes. Some triangles cross a band and remain
   whole; the Node Manifest discloses this.
2. The NASA Saturn V GLB has not been certified for every AS-506 marking or
   exterior detail.
3. The NASA LM GLB is generic and is not certified as LM-5 Eagle. Eagle-specific
   markings/equipment still require image-by-image validation.
4. The CSM is deliberately medium-detail and lacks a verified docking
   probe/tunnel, Apollo 11 markings, full high-gain antenna articulation, and
   interior geometry. It must always show the reconstructed label.
5. Moon DEM/displacement and the 60×-exaggerated landing-site terrain were not
   published as runtime assets. The color sphere makes no elevation claim;
   terrain belongs to later lunar-scene work after its vertical scale is proven.
6. Earth cloud cover, illumination, Moon lighting, star field, and celestial
   scale/orientation are not historical-state computations in Phase 3; Phase 4
   must label schematic presentation where appropriate.
7. The local decoder files are verified independently of a renderer. Phase 4
   must bind its Three/R3F loaders to these exact local paths and repeat the
   browser-offline test.

## Explicitly not completed

- No production React, Three.js, R3F, Zustand, routing, scene, or interaction UI.
- No claim that formal Phase 4 has begun.
- No new or changed Fact, Event, MET, telemetry, transcript, or audio record.
- No historical trajectory, cloud, lighting, celestial-scale, or camera-state
  reconstruction.
- No AI-generated vehicle geometry, Apollo-Soyuz substitute, NASA CAD claim, or
  remote runtime decoder dependency.
- No commit, push, or Phase 4 release was created by this worktree session.
