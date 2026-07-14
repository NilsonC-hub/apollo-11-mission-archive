# CSM Reconstruction Plan (ADR-006)

**Phase**: 0
**Source**: `docs/audit/CSM-RECONSTRUCTION-PLAN.md`
**Date**: 2026-07-13
**Decision ID**: `ADR-006` (per spec Appendix B)
**Spec reference**: §30.3 — _Command and Service Module_

## Problem

The Production Spec §30.3 states:

> 当前已知 NASA 资源中没有可直接认定为"独立、正确 Apollo 11 CSM"的官方 GLB。
> 最终产品禁止用 Apollo-Soyuz Test Project 构型替代 Columbia.

Translation: No directly-attributable Apollo 11 CSM GLB is currently known in NASA's published resources. The final product must not use an Apollo-Soyuz Test Project configuration as a substitute for Columbia.

The acceptable paths per spec §30.3, in priority order:

1. Continue searching for and verify a NASA-released Apollo 11 / Block II CSM asset.
2. Use parts from `NASA-MODEL-SATV-STL` (Saturn V printing kit) that correspond to CM/SM, combined with `NASA-CSM-NR` (CSM News Reference) and official drawings, to reconstruct a web-suitable CSM.
3. Extract the verifiable spacecraft portion from inside the Saturn V GLB (`NASA-MODEL-SATV`) and supplement with reference-based geometry for an independent configuration.
4. Self-build a medium-detail Block II CSM, fully documenting dimension sources, trade-offs, topology, and material sources.

Regardless of path, if the geometry is not a NASA-directly-released complete Apollo 11 CSM, the UI and Asset Manifest must label it `RECONSTRUCTED FROM NASA REFERENCES`. It must NOT be labelled `NASA CAD`.

## Phase 0 work

### Path 1: continued search for NASA-released Apollo 11 CSM

Phase 0 probed the NASA Science 3D Resources index pages for all known Apollo-related models. Results:

| NASA 3D Resources page                                              | Asset                                                 | CSM-usable?                                                                                                                                                                     |
| ------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://science.nasa.gov/3d-resources/saturn-v/`                   | Saturn V GLB (`NASA-MODEL-SATV`)                      | Contains CSM portion **embedded inside the Saturn V stack** (top of rocket) — not separable without offline geometry extraction. Per spec §30.3 path 3.                         |
| `https://science.nasa.gov/3d-resources/apollo-lunar-module/`        | Apollo Lunar Module GLB (`NASA-MODEL-LM`)             | No — this is the LM, not the CSM.                                                                                                                                               |
| `https://science.nasa.gov/3d-resources/saturn-v-rocket/`            | Saturn V Printing Kit STL ZIP (`NASA-MODEL-SATV-STL`) | **Possibly yes** — print-kit STLs typically separate the spacecraft from the rocket for printing. ZIP contents not yet enumerated (deferred to Phase 3). Per spec §30.3 path 2. |
| `https://science.nasa.gov/3d-resources/apollo-11-view-of-the-moon/` | Photograph AS11-44-6665                               | No — image, not model                                                                                                                                                           |
| `https://science.nasa.gov/3d-resources/apollo-11-landing-site/`     | Landing Site STL                                      | No — terrain                                                                                                                                                                    |

**Apollo-Soyuz check**: searched the NASA 3D Resources index for "Apollo-Soyuz" — no separate page returned. The spec §30.4 explicitly bans the Apollo-Soyuz GLB; Phase 0 did not locate one anyway and would not use it if found.

**Path 1 verdict**: No independent, attributable Apollo 11 CSM GLB found in NASA's published 3D Resources as of 2026-07-13. Path 1 not actionable; move to Path 2.

### Path 2: Saturn V printing kit STL parts

The Saturn V Printing Kit ZIP (`NASA-MODEL-SATV-STL.zip`, 3.3 MiB, hash `c041898b075d7529a812b5e820cd3ce2efd9199b13dfeab5b60b1aa9f4674021`) is downloaded, archived, and **fully enumerated** (remediation). The ZIP contains 12 STL files, all inspected with triangle count, bounds, units heuristic, and SHA-256. Full inventory in `docs/audit/STL-INSPECTION.txt` and `src/missions/apollo11/source-manifest.json` under `NASA-MODEL-SATV-STL.stlParts`.

**CSM-relevant STLs found**:

| STL file                                  | Triangles | Bounds size            | Units     | CSM role                                  |
| ----------------------------------------- | --------: | ---------------------- | --------- | ----------------------------------------- |
| `command moduel.stl` (note original typo) |     3,652 | 33.95 × 20.09 × 33.90  | likely-cm | **Command Module** — CM candidate         |
| `service module.stl`                      |    46,582 | 39.91 × 81.37 × 42.29  | likely-cm | **Service Module** — SM candidate         |
| `escape tower.stl`                        |    16,030 | 38.31 × 110.89 × 38.36 | likely-mm | **Launch Escape System** — LES candidate  |
| `lem shroud.stl`                          |     1,162 | 58.31 × 63.65 × 58.09  | likely-cm | **Spacecraft/LM Adapter** — SLA candidate |

**Non-CSM STLs** (for completeness): `S-IC bottom.stl`, `S-IC top.stl`, `S-IC joining cube.stl`, `S-II.stl`, `S-IV b.stl`, `stage 1-2 coupler.stl`, `stage 1-2 coupler v2.stl`, `fin (print 4).stl`.

**Phase 0 status (remediation)**: ✅ ZIP contents fully enumerated. ✅ CM, SM, LES, SLA candidates identified. ✅ Triangle counts and bounds recorded. ✅ SHA-256 of each STL recorded. ⚠️ Visual geometry verification NOT yet done — the STL shapes have not been opened in a viewer to confirm they match the expected CSM component geometry. Path 2 is **PROVISIONALLY viable** pending visual confirmation in Phase 3.

**Units inconsistency**: STL units are inconsistent across the kit — some parts are in millimeters (escape tower, S-IC sections, S-II, S-IVB), others in centimeters (command module, service module, SLA, couplers). Phase 3 normalization must scale each part individually against documented Saturn V / CSM dimensions from `NASA-A11-MR` and `NASA-CSM-NR`.

**Phase 3 actions**:

1. Open each CSM-relevant STL (`command moduel.stl`, `service module.stl`, `escape tower.stl`, `lem shroud.stl`) in Blender or via `gltf-transform`.
2. Verify the geometry matches the expected CSM components:
   - CM: conical capsule shape, 3,652 triangles — likely a simplified CM outer mold.
   - SM: cylindrical body with engine bell recess, 46,582 triangles — more detailed, likely includes RCS quads and high-gain antenna housing.
   - LES: tower with motor shape, 16,030 triangles.
   - SLA: conical adapter, 1,162 triangles — simplified.
3. Cross-check dimensions against `NASA-CSM06-WB.pdf` (CSM News Reference — Command Module Overview, archived).
4. Normalize units to meters using documented CSM dimensions.
5. Remesh + UV unwrap as needed for browser use (STLs have no UVs).
6. Label as `RECONSTRUCTED FROM NASA REFERENCES` per spec §30.3.

**Risks**:

- STLs are 3D-print-oriented: high face count for some parts (SM at 46,582 tris), no UVs, no materials. All need remeshing.
- Units inconsistency across the kit requires per-part normalization.
- The CM STL (3,652 tris) is low-detail — may need supplementation from Path 3 (Saturn V GLB top extraction) for a higher-detail CM.
- No separate docking probe, RCS thruster, or high-gain antenna STL — these details may be fused into the SM STL or absent.

### Path 3: Extract CSM from Saturn V GLB

The Saturn V GLB (`NASA-MODEL-SATV`) is a single-geometry model with 22 child nodes under root `saturnv_ca`. None are semantically named. The CSM is at the top of the stack (highest Y values). Scene bounds max Y = 12.8459; Saturn V total height ≈ 110.6 m, so 1 model unit ≈ 8.52 m. The CSM portion is roughly the top 6–8 m of the rocket (CM + SM + SLA enclosing LM), which corresponds to roughly the top 0.7–0.9 units of the model.

**Phase 3 actions**:

1. Open `NASA-MODEL-SATV.glb` in Blender or via `gltf-transform`.
2. Select all geometry with Y > (some threshold derived from documented Saturn V stage lengths — to be calculated from `NASA-A11-MR` and `NASA-CSM-NR`).
3. Extract that geometry into a new GLB.
4. Verify it visually matches the CSM (CM cone + SM cylinder + nozzle bell + RCS quads + high-gain antenna).
5. Cross-check dimensions against `NASA-CSM06-WB.pdf` and `NASA-CSM-NR` HTML frameset stub.
6. If the extraction is viable, mark as Path 3 input and label `RECONSTRUCTED FROM NASA REFERENCES`.

**Risks**:

- The Saturn V GLB may have the CSM fused with the SLA / LM adapter, requiring manual separation.
- The GLB may not include CSM interior or detailed external features (RCS thruster layout, high-gain antenna dish, EVA hatch, etc.).
- The geometry may be lower-detail than what an Archive dossier viewer needs.

### Path 4: Self-build a medium-detail Block II CSM

If Paths 2 and 3 both yield insufficient geometry, Phase 3 must self-build. Inputs:

- `NASA-CSM-NR` (CSM News Reference — full chapter list referenced in the HTML frameset stub; Phase 0 archived only CSM06 Command Module Overview; Phase 2 must archive the remaining chapters, especially CSM07 Service Module Overview).
- `NASA-A11-MR` (Mission Report — has CSM performance data).
- `NASA-A11-IMAGES` (Apollo 11 image gallery — has CSM photography).
- `NASA-MODEL-SATV-STL` (print-kit STLs for dimensional reference).
- `NASA-MODEL-SATV` (Saturn V GLB top portion for shape reference).

**Phase 3 actions** (if Path 4 is needed):

1. Compile a CSM dimension table from `NASA-CSM-NR` chapters (CM length, diameter, mass; SM length, diameter, mass; engine bell dimensions; RCS quad locations; high-gain antenna location; EVA hatch location).
2. Model a medium-detail Block II CSM in Blender or programmatically in `gltf-transform` / Three.js BufferGeometry.
3. Document every dimension's source page in the Asset Manifest.
4. Label as `RECONSTRUCTED FROM NASA REFERENCES` per spec §30.3.

## Phase 0 decision (remediation)

**Adopt a hybrid Path 2 + Path 3 approach, fall back to Path 4 if both fail.**

- **Path 2 is now provisionally viable** for CM + SM + LES + SLA as a set. All four CSM-relevant STLs are identified, inspected, and hashed. However, visual geometry verification has NOT been performed — the STL shapes have not been opened in a viewer to confirm they match the expected CSM components (conical CM, cylindrical SM, tower LES, conical SLA). The triangle counts and bounds are consistent with these shapes, but visual confirmation is a Phase 3 action. Phase 3 must normalize units, remesh, UV-unwrap, and visually verify each part.
- **Path 3 remains valuable** for higher-detail CM geometry — the STL `command moduel.stl` has only 3,652 triangles, which may be too low for close-up dossier views. The Saturn V GLB top extraction could provide a higher-detail CM.
- **Recommended hybrid**: use Path 2 STLs for SM + LES + SLA (which have adequate detail: 46,582 / 16,030 / 1,162 triangles respectively), and use Path 3 (Saturn V GLB top extraction) for the CM if it yields higher detail than the STL's 3,652 triangles. If Path 3 CM extraction fails or is lower-detail, fall back to the Path 2 STL CM.
- If both Path 2 and Path 3 yield insufficient CM detail, fall back to Path 4 (self-build the CM from `NASA-CSM-NR` dimensions).
- The final CSM asset is always labelled `RECONSTRUCTED FROM NASA REFERENCES` in the UI and Asset Manifest.
- The Apollo-Soyuz GLB is explicitly forbidden (spec §30.4) and was not located anyway.

**Remediation change from original Phase 0 decision**: the original decision said "Phase 3 must attempt Path 2 and Path 3 in parallel" — but Path 2 was not yet enumerated. The remediation confirms Path 2 is **provisionally viable** (pending visual geometry verification) and specifies which STLs map to which CSM components. The hybrid approach (Path 2 for SM/LES/SLA + Path 3 for CM) is the new recommendation.

## UI labelling commitment

Regardless of which path produces the CSM, the following labels must appear in the final product:

- In the CSM component dossier: `RECONSTRUCTED FROM NASA REFERENCES` (per spec §30.3).
- In the Asset Manifest: `evidence: 'reconstructed'`, with the source IDs and pages used.
- In the Node Manifest: `geometrySource: 'extracted-from-NASA-MODEL-SATV' | 'assembled-from-NASA-MODEL-SATV-STL' | 'self-built-from-NASA-CSM-NR'` (whichever applies).
- Never `NASA CAD`, never `Apollo-Soyuz`, never `official Apollo 11 CSM geometry`.

## Open questions

1. **STL kit contents**: not yet enumerated. Phase 3 will unzip and inventory. **OPEN QUESTION for owner**: if the STL kit does not contain a separable CSM, is Path 4 (self-build) acceptable, or should the project search additional NASA centers (e.g., Marshall Space Flight Center history office, Smithsonian 3D Digitization)?
2. **Level of detail**: how detailed must the CSM be for the Archive dossier view? Spec §25 says "组件聚焦显示：名称、所属总成、当前任务状态、资料支持的尺寸/质量、几何来源与真实性标签." This implies medium detail is acceptable — RCS quad count, antenna placement, engine bell — but not necessarily individual thruster nozzles. **Recommendation**: target medium-detail (comparable to the LM GLB's level) and document any omitted features.
3. **CSM phase-specific configurations**: Apollo 11 CSM changes configuration during the mission (docked to LM, CM/SM separation before entry, etc.). The CSM model must support these configurations. This is a Phase 3 / Phase 5 concern, not Phase 0.
