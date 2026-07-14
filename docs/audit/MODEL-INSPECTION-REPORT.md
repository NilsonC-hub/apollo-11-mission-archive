# NASA GLB Model Inspection Report — Saturn V & Lunar Module

**Phase**: 0 (remediation)
**Source**: `docs/audit/MODEL-INSPECTION-REPORT.md`
**Date**: 2026-07-13 (remediation)
**Scope**: Per Production Spec §30, every NASA-released visualization model must be inspected for nodes, units, bounds, materials, textures, and semantic detachability before adoption. This report covers `NASA-MODEL-SATV` and `NASA-MODEL-LM`. STL kit (`NASA-MODEL-SATV-STL`) is now fully enumerated (remediation). Landing-site terrain (`NASA-A11-LANDING-TERRAIN`) STL geometry inspection is deferred to Phase 3 (Blender / glTF-transform offline recipe).

## Remediation changes

1. **False-positive semantic detection fixed**: the original `inspect-glb.ts` used a loose regex `/^(s-?ic|s-?ii|s-?ivb|saturn|apollo|csm|lm|escape|tower|instrument|sla)/i` that matched `saturnv_ca` (the root node name) as having "Saturn stage semantic". This was a false positive — `saturnv_ca` is a Maya camera/assembly name, not a semantic stage label. The remediation uses strict token-boundary matching: a node name must contain `s-ic`, `s-ii`, `s-ivb`, etc. as a standalone token (split by whitespace/underscores/hyphens/slashes/dots), not as a substring of a longer identifier.
2. **STL kit fully enumerated**: the original report said "ZIP downloaded and hashed; contents not enumerated. Phase 3 must unzip and inventory." The remediation unzips, inspects every STL, and records triangle counts, bounds, units, SHA-256, and CSM-relevance.
3. **validate-models.ts upgraded**: the original validator only checked that the inspection JSON existed and had required fields. The remediation validator re-parses the GLB from disk, verifies the SHA-256 of the on-disk GLB matches the SHA-256 recorded in the inspection report, and confirms structural counts (scenes, meshes, materials, textures) match. This prevents a stale inspection report from passing validation after the GLB is replaced or modified.

## Tooling

- `@gltf-transform/core@4.4.1`, `@gltf-transform/extensions@4.4.1`, `@gltf-transform/functions@4.4.1`
- `draco3d@1.5.7` (decoder for the LM GLB which uses `KHR_draco_mesh_compression`)
- Node 22+ with `--experimental-strip-types`
- Script: `scripts/inspect-glb.ts` (writes `<basename>.inspection.json` next to the GLB)
- Manifest: `src/missions/apollo11/source-manifest.json` carries `inspectionSummary` per model

Commands run (remediation):

```bash
# Re-inspect Saturn V GLB with fixed semantic detection
node --experimental-strip-types scripts/inspect-glb.ts assets/raw/NASA-MODEL-SATV.glb
# Result: hasSemanticSaturnStages=false (was true before fix — false positive removed)

# Re-inspect Lunar Module GLB with fixed semantic detection
node --experimental-strip-types scripts/inspect-glb.ts assets/raw/NASA-MODEL-LM.glb
# Result: hasSemanticLMStages=false (correct — no ascent/descent semantic nodes)

# Upgraded validate-models: re-parses GLB, verifies hash + structural counts
node --experimental-strip-types scripts/validate-models.ts
# Result: PASS — both inspection reports correspond to on-disk GLBs

# Inspect STL kit contents
python E:\系统缓存\opencode\inspect_stls.py
# Result: Wrote docs/audit/STL-INSPECTION.txt — 12 STLs inventoried
```

## Saturn V (`NASA-MODEL-SATV`)

| Metric                  |                                                                                                Value |
| ----------------------- | ---------------------------------------------------------------------------------------------------: |
| File                    |                                                                     `assets/raw/NASA-MODEL-SATV.glb` |
| Bytes                   |                                                                                  927,212 (905.5 KiB) |
| SHA-256                 |                                   `6c44497bce54ee0b09d0edb8e33a6f484762a320dab1c54b383e434f5bba06b5` |
| Source URL              | `https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/saturn-v/Saturn%20V.glb` |
| Scenes / Nodes / Meshes |                                                                                          1 / 23 / 22 |
| Primitives              |                                                                                                   52 |
| Triangles               |                                                                                               34,814 |
| Vertices                |                                                                              104,442 (RENDER method) |
| Materials               |                         13 (all named `blinn*SG` or `initialShadingGr` — Maya shader-group defaults) |
| Textures                |     8 (4 unique in 2 formats: `SATURNVU`, `SATURNVA`, `SATURNVT`, `SATURNVW` × {WebP, PNG fallback}) |
| Animations              |                                                  23 (embedded — likely deployment/rollout sequences) |
| Extensions used         |                                                         `KHR_materials_specular`, `EXT_texture_webp` |
| Draco compressed        |                                                                                                   No |
| Scene bounds (min)      |                                                                        `[-1.0194, -0.1409, -0.2641]` |
| Scene bounds (max)      |                                                                          `[0.9949, 12.8459, 1.7502]` |
| Scene size (W × H × D)  |                                                                             `2.014 × 12.987 × 2.014` |
| Heuristic units         |                               **maybe-meters-or-scaled** (height 12.987 — not real Saturn V 110.6 m) |
| Root node name          |                                                                                         `saturnv_ca` |
| Max node depth          |                                                          1 (flat list of 22 children under one root) |
| Non-identity transforms |                                                                                                    0 |

### Node name list (alphabetical, depth 1)

```
group1 gro, group1 pCo, group10 pC, group11 pC, group3 gro, group6 pCu,
group7 pCu, group8 pCy, group9 pCy, pCone2 gro, pCube1 gr1, pCube1 gro,
pCylinder1, pCylinder2, pCylinder3, pCylinder4, pCylinder5,
polySurfa1, polySurfa2, polySurfa3, polySurfa4, polySurfac
```

**Verdict**: **No semantic separation.** Node names are Maya defaults (`pCone`, `pCube`, `pCylinder`, `polySurface`, `group<N>`). There is no node named `S-IC`, `S-II`, `S-IVB`, `IU`, `SLA`, `CSM`, or `LES`. The model is a single geometry hierarchy 1 level deep under `saturnv_ca`.

### Phase 3 implications (Saturn V)

1. **Units not real-world meters.** Phase 3 normalization must scale by ~8.52× (110.6 m / 12.987) and lock Y-up. The spec's IU/SLA/CSM/LES heights in meters must come from `NASA-A11-MR` and `NASA-CSM-NR`, not from this GLB.
2. **Semantic split required offline.** Because the rocket is much taller than wide (H = 12.987 vs W ≈ D ≈ 2.014), Phase 3 can split by Y-height ranges into S-IC / interstage / S-II / interstage / S-IVB / IU / SLA / CSM / LES. The split recipe must:
   - Be a Blender or `gltf-transform` script committed to `scripts/optimize-models.ts` (or sibling).
   - Use documented Y boundaries from `NASA-A11-MR` (stage lengths) and `NASA-CSM-NR` (spacecraft heights), not eyeballing.
   - Output stable semantic node names matching the spec §31 manifest (`launch-escape-system`, `command-service-module.command-module`, `command-service-module.service-module`, `spacecraft-lm-adapter.sla-panel-{1..4}`, `lunar-module.{lm-ascent-stage, lm-descent-stage}`, `instrument-unit`, `s-ivb`, `s-ii-s-ivb-interstage`, `s-ii`, `s-ic-s-ii-interstage`, `s-ic`).
   - Not modify `assets/raw/` — write derived GLBs to `assets/derived/`.
3. **23 embedded animations must be stripped.** They are likely NASA visualization deployment/rollout sequences, not mission-event animations. Strip before deriving runtime GLBs.
4. **AS-506 fidelity is not certified.** This is a generic Saturn V. The model may lack AS-506-specific markings (e.g., "USA" stencil, mission insignia, camera-target chevrons). Phase 3 must check against `NASA-A11-IMAGES` for AS-506 launch photography and label any reconstructed markings as `RECONSTRUCTED`.
5. **Texture inspection.** 4 textures (SATURNVU/V A/V T/V W — likely Upper, Active-area, Tail, White areas) ship in both WebP (small) and PNG (larger fallback). Phase 3 KTX2 conversion must use these as source; mark `NASA IMAGERY-BASED TEXTURE` with no claim of AS-506 specific livery.

## Lunar Module (`NASA-MODEL-LM`)

| Metric                  |                                                                                                                                               Value |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------: |
| File                    |                                                                                                                      `assets/raw/NASA-MODEL-LM.glb` |
| Bytes                   |                                                                                                                                 716,840 (700.0 KiB) |
| SHA-256                 |                                                                                  `379101dfcee399267addf771709107c35e826b0b9e5233272f123e4c8a585c4e` |
| Source URL              |                        `https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/apollo-lunar-module/Apollo%20Lunar%20Module.glb` |
| Scenes / Nodes / Meshes |                                                                                                                                       1 / 135 / 134 |
| Primitives              |                                                                                                                                                 157 |
| Triangles               |                                                                                                                                              97,588 |
| Vertices                |                                                                                                                             292,764 (RENDER method) |
| Materials               |                                                                              12 (all named `blinn*SG.NNN` — Maya shader-group defaults, duplicated) |
| Textures                |                                                                6 (3 unique in 2 formats: `BOOSTER3`, `TEXTUREA`, `TEXTURE_` × {WebP, PNG fallback}) |
| Animations              |                                                                                                        135 (embedded — likely deployment sequences) |
| Extensions used         |                                                                          `KHR_draco_mesh_compression`, `KHR_materials_specular`, `EXT_texture_webp` |
| Extensions required     |                                                                              `KHR_draco_mesh_compression` (Draco decoder must be available offline) |
| Draco compressed        |                                                                                                                     Yes (required to read geometry) |
| Scene bounds (min)      |                                                                                                                        `[-3.2145, 0.1026, -3.2157]` |
| Scene bounds (max)      |                                                                                                                          `[3.2129, 5.1154, 3.2109]` |
| Scene size (W × H × D)  |                                                                                                                             `6.427 × 5.013 × 6.427` |
| Heuristic units         | **maybe-meters-or-scaled** (height 5.013 — LM-5 actual height ~7 m with gear extended; model is roughly 5:6:5 ratio consistent with LM proportions) |
| Root node name          |                                                                                                                                 see inspection JSON |
| Max node depth          |                                                                                                        1 (flat list of 134 children under one root) |
| Non-identity transforms |                                                                                                                                                   0 |

### Top 10 LM nodes by triangle count

| Node name    | Triangles | Vertices |
| ------------ | --------: | -------: |
| `polySurfa4` |     6,400 |    3,988 |
| `polySurfa3` |     6,400 |    3,944 |
| `group31 20` |     6,240 |    3,440 |
| `group31 15` |     6,240 |    4,132 |
| `group31 16` |     6,240 |    3,880 |
| `group31 19` |     6,240 |    3,440 |
| `group31 21` |     3,040 |    1,756 |
| `group31 22` |     3,040 |    1,756 |
| `group31 17` |     2,384 |    1,464 |
| `group31 18` |     2,384 |    1,464 |

### Node name pattern

Node names follow Maya defaults: `group13 {1..14, g1..g9, gr, p1, p2, pC}`, `group31 {10..22, g1..g9, ...}`, plus `polySurfa*`, `pCone*`, `pCylinder*`, `polySurfac`. **No nodes named `ascent`, `descent`, `stage`, `eagle`, `lunar-module`, or any semantic label.**

### Phase 3 implications (Lunar Module)

1. **Decode Draco.** All geometry requires Draco; runtime decoder must be locally hosted and version-locked (per spec §33).
2. **Ascent / descent stage split required offline.** Bounds suggest split near Y ≈ 2.5 (ascent stage sits atop descent stage; lower ~2.4 units of height is descent stage, upper ~2.6 is ascent stage). The split recipe must:
   - Be a Blender / `gltf-transform` script committed to `scripts/optimize-models.ts`.
   - Use documented stage heights from `NASA-LM-HB` (LM-10 Handbook — generic, not LM-5 specific) and `NASA-A11-ALSJ` for Eagle dimensions where available.
   - Output stable semantic node names matching the spec §31 manifest (`lunar-module.lm-ascent-stage`, `lunar-module.lm-descent-stage`).
   - Establish label / exhaust / docking / camera-focus anchors per spec §32.
3. **LM-5 Eagle fidelity is not certified.** This is a generic Apollo LM. Phase 3 must verify against `NASA-A11-ALSJ` and `NASA-LM-HB` for: Eagle-specific markings, American flag, plaque ("Here men from the planet Earth first set foot upon the Moon..."), EASEP mounting, RCS quad arrangement, contact probes, ladder placement. Mark any reconstructed details as `RECONSTRUCTED`.
4. **135 embedded animations must be stripped.** Likely deployment sequences; not mission-event animations.
5. **Texture inspection.** Only 3 unique textures (`BOOSTER3`, `TEXTUREA`, `TEXTURE_` — cryptic NASA names). Phase 3 must map these to physical LM regions via UV inspection and document the mapping in the Node Manifest.

## Saturn V Printing Kit (`NASA-MODEL-SATV-STL`)

| Metric            |                                                                                                                                       Value |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------: |
| File              |                                                                                                        `assets/raw/NASA-MODEL-SATV-STL.zip` |
| Bytes             |                                                                                                                                   3,306,320 |
| SHA-256           |                                                                          `c041898b075d7529a812b5e820cd3ce2efd9199b13dfeab5b60b1aa9f4674021` |
| Source URL        | `https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/saturn-v-rocket/Saturn%20V%20Rocket.zip?emrc=6a546a332e425` |
| Extracted to      |                                                                                                 `assets/raw/NASA-MODEL-SATV-STL-extracted/` |
| STL count         |                                                                                                                                          12 |
| Inspection report |                                                                                                             `docs/audit/STL-INSPECTION.txt` |

**Phase 0 status (remediation)**: ✅ ZIP fully enumerated. ✅ All 12 STLs inspected with triangle count, bounds, units, SHA-256. ✅ CSM-relevant parts identified.

### CSM-relevant STLs (for ADR-006 Path 2)

| STL file                         |     Bytes | SHA-256       | Triangles | Bounds (W×H×D)         | Units     | CSM role |
| -------------------------------- | --------: | ------------- | --------: | ---------------------- | --------- | -------- |
| `command moduel.stl` (note typo) |   182,684 | `12d6e8d1...` |     3,652 | 33.95 × 20.09 × 33.90  | likely-cm | **CM**   |
| `service module.stl`             | 2,329,184 | `1e7b612d...` |    46,582 | 39.91 × 81.37 × 42.29  | likely-cm | **SM**   |
| `escape tower.stl`               |   801,584 | `42ff337d...` |    16,030 | 38.31 × 110.89 × 38.36 | likely-mm | **LES**  |
| `lem shroud.stl`                 |    58,184 | `03c45c2d...` |     1,162 | 58.31 × 63.65 × 58.09  | likely-cm | **SLA**  |

### Non-CSM STLs (rocket stages)

| STL file                   | Triangles | Role                       |
| -------------------------- | --------: | -------------------------- |
| `S-IC bottom.stl`          |    37,827 | S-IC first-stage lower     |
| `S-IC top.stl`             |    16,406 | S-IC first-stage upper     |
| `S-IC joining cube.stl`    |        12 | S-IC assembly jig          |
| `S-II.stl`                 |    16,322 | S-II second stage          |
| `S-IV b.stl`               |    16,731 | S-IVB third stage          |
| `stage 1-2 coupler.stl`    |     4,148 | S-IC/S-II interstage       |
| `stage 1-2 coupler v2.stl` |     6,622 | S-IC/S-II interstage (alt) |
| `fin (print 4).stl`        |        66 | F-1 engine fin             |

### Key findings

- **All four CSM components are present** as separate STLs: CM (`command moduel.stl`, note original typo), SM, LES, SLA. This makes Path 2 **provisionally viable** for CSM reconstruction, pending visual geometry verification (Phase 3: open each STL in a viewer and confirm the shape matches the expected CSM component).
- **Units are inconsistent across the kit**: some STLs in millimeters (escape tower, S-IC sections, S-II, S-IVB), others in centimeters (CM, SM, SLA, couplers). Phase 3 normalization must scale each part individually.
- **STLs have no UVs or materials** (typical for 3D-print kits). Phase 3 must remesh + UV unwrap + author materials.
- **CM is low-detail** (3,652 triangles). Phase 3 may supplement with Path 3 (Saturn V GLB top extraction) for a higher-detail CM. See `CSM-RECONSTRUCTION-PLAN.md` for the hybrid recommendation.
- **SM is relatively high-detail** (46,582 triangles) — likely includes RCS quad housings and engine bell recess.

### Phase 3 actions

1. Open each CSM-relevant STL in Blender or via `gltf-transform`.
2. Verify geometry matches expected CSM component shapes.
3. Cross-check dimensions against `NASA-CSM06-WB.pdf` (CSM News Reference CM section, archived).
4. Normalize units to meters using documented CSM dimensions.
5. Remesh + UV unwrap + author materials.
6. Generate high / medium / low LOD per spec §33.
7. Label as `RECONSTRUCTED FROM NASA REFERENCES` per spec §30.3.

## Apollo 11 Landing Site STL (`NASA-A11-LANDING-TERRAIN`)

| Metric     |                                                                                                                                                             Value |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| File       |                                                                                                                         `assets/raw/NASA-A11-LANDING-TERRAIN.stl` |
| Bytes      |                                                                                                                                                         7,138,484 |
| SHA-256    |                                                                                                `72eae5e493d3966dae392ce7563d66676e5a0b72d9753609d39723c8e84b1c72` |
| Source URL | `https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/apollo-11---landing-site/Apollo%2011%20-%20Landing%20Site.stl?emrc=6a546a354da1d` |

**Phase 0 status**: STL downloaded and hashed; geometry not inspected. Source page states the original STL exaggerates the Z axis 60× for visual relief (spec §34 / C.2). Phase 3 must:

1. Open the STL, verify bounds, and confirm or refute the 60× Z exaggeration.
2. Either undo the 60× exaggeration in a documented recipe, or regenerate from raw LRO/LOLA DEM with documented vertical scale.
3. Verify terrain against known Tranquility Base coordinates (`0.6740°N, 23.4730°E`).
4. Label as `RECONSTRUCTED TERRAIN` in the UI per spec §34 / C.2.

## Cross-model findings

- **Neither NASA GLB ships with semantic part naming.** Both are flat hierarchies under a single root with Maya-default node names. The Production Spec §31 semantic node tree (`apollo11-vehicle.launch-escape-system`, `...s-ic`, `...s-ii`, etc.) cannot be obtained by simple node renaming — it requires offline geometric / positional analysis.
- **Neither NASA GLB is at real-world meter scale.** Saturn V: 12.987 units vs 110.6 m actual. LM: 5.013 units vs ~7 m actual. Phase 3 normalization must scale both and record the scale factor in the Node Manifest `normalization.scale` field.
- **Both GLBs ship embedded animations** (23 / 135) that are NASA visualization sequences, not mission-event animations. These must be stripped before runtime use; mission events drive the state machine, not embedded clips.
- **Both GLBs ship textures in WebP + PNG fallback.** Phase 3 KTX2 conversion will use these as source.
- **LM requires Draco decoder.** Runtime decoder must be locally hosted (spec §33).

## Phase 3 readiness

Phase 3 (Model & Celestial Asset Pipeline) can proceed because Phase 0 has:

- ✅ All NASA GLBs / STLs / ZIPs archived in `assets/raw/` with SHA-256.
- ✅ GLB inspection reports written for the two main visualization models.
- ✅ Critical findings documented: no semantic separation, Maya default names, embedded animations must be stripped, units must be normalized.
- ✅ Source URLs and effective download URLs recorded in the Source Manifest.

Phase 3 must still:

- ⚠ Inventory the Saturn V Rocket ZIP contents.
- ⚠ Inspect the Landing-Site STL bounds and verify 60× Z exaggeration.
- ⚠ Define and commit the offline semantic-split recipe (Blender script or `gltf-transform` pipeline).
- ⚠ Verify Eagle-specific markings against `NASA-A11-ALSJ` and `NASA-LM-HB`.
- ⚠ Verify AS-506-specific markings against `NASA-A11-IMAGES` launch photography.
- ⚠ Generate high / medium / low LOD with Draco + KTX2 per spec §33.
- ⚠ Write Node Manifests per spec §32 for every derived GLB.

## Open questions

1. **Blender availability.** The Phase 0 toolchain is Node-only (`gltf-transform` + `draco3d`). Phase 3's semantic split can be done in `gltf-transform` (Y-height partition + rename), but Blender may be needed for high-quality LOD generation, UV re-packing, and marking reconstruction. **OPEN QUESTION for owner**: is Blender available on the build host, or should Phase 3 plan for `gltf-transform`-only?
2. **AS-506 marking sources.** The NASA GLB is generic Saturn V. Markings like "USA", mission insignia, and AS-506 specific paint may need to be sourced from `NASA-A11-IMAGES` launch photography and applied as `RECONSTRUCTED` textures. **OPEN QUESTION for owner**: how AS-506-accurate must the final model be — generic Saturn V acceptable, or must the model be visibly AS-506?
3. **LM-5 Eagle-specific markings.** Same question as above for the LM.
