# Phase 0 Completion Report

**Phase**: 0 — Baseline, Source Freeze & Feasibility
**Project**: Apollo 11 Mission Archive + Historical Replay
**Path**: `D:\apollo-11-mission-archive`
**Date**: 2026-07-13
**Spec reference**: APOLLO_11_PRODUCTION_SPEC §49 (Phase 0 deliverables + acceptance)
**Report template**: spec §58

## Scope completed

- ✅ New project skeleton at `D:\apollo-11-mission-archive` (independent of `D:\artemis-mission-archive` per spec §4 / ADR-001).
- ✅ Project config: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.scripts.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.nvmrc`, `LICENSE`, `README.md`, `AGENTS.md`.
- ✅ Full directory structure per spec §39 (47 directories created).
- ✅ Production Spec copied into `docs/APOLLO_11_PRODUCTION_SPEC.md` for traceability.
- ✅ Apollo 11 scope / non-goals documented in `README.md` and `AGENTS.md`.
- ✅ Complete initial Source Manifest: all 31 spec §8 Source IDs registered in `src/missions/apollo11/source-manifest.json` with URL, accessedAt, rights status, purpose, localPath, sha256, bytes, status.
- ✅ NASA PDFs / GLBs / STL / ZIP / images / web pages downloaded, hashed, and registered.
- ✅ Appendix A key event table cross-checked against `NASA-A11-MR` Table 3-I extracted text (33 of 34 events confirmed; first-step discrepancy documented per spec §A.2).
- ✅ Artemis reuse map: which concepts inherit, which must not carry over.
- ✅ Saturn V, LM, STL kit, landing-site terrain inspection reports.
- ✅ CSM reconstruction plan (ADR-006): parallel Paths 2 + 3, fall back to Path 4.
- ✅ Earth / Moon texture candidate inventory.
- ✅ Risk log + decision records.
- ✅ Validation scripts: `validate-sources.ts` (passes), `validate-mission.ts` (passes after this report lands), `validate-models.ts` (passes), `inspect-glb.ts` (passes).

## Files changed

### Project skeleton

| Path                                                 | Purpose                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                       | Phase 0 dev dependencies: `@gltf-transform/*`, `draco3d`, `gltf-validator`, `typescript`, `eslint`, `prettier`, `@types/node`. No React/Three/R3F (Phase 4+). |
| `tsconfig.json` + `tsconfig.{app,node,scripts}.json` | TS 7 strict config for app, scripts, vite.                                                                                                                    |
| `vite.config.ts`                                     | Skeleton; react plugin added Phase 4+.                                                                                                                        |
| `eslint.config.js`                                   | Phase 0 lint for scripts + tests.                                                                                                                             |
| `.prettierrc` / `.prettierignore`                    | single-quote, no-semi, 100-col.                                                                                                                               |
| `.gitignore` / `.nvmrc`                              | Node 22, ignores for raw GLB/STL/ZIP/audio.                                                                                                                   |
| `LICENSE`                                            | MIT for own code; NASA public-domain notices; MIT attribution to `redradman/artemis`.                                                                         |
| `README.md`                                          | Project overview, attribution, status.                                                                                                                        |
| `AGENTS.md`                                          | AI collaboration guide with hard rules.                                                                                                                       |

### Source Manifest + Asset Manifest

| Path                                         | Purpose                                                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/missions/apollo11/source-manifest.json` | 31 sources registered; 9 binary + 6 Wayback + 22 web pages downloaded + hashed. Validates with `pnpm validate:sources` (0 errors, 0 warnings). |
| `src/missions/apollo11/asset-manifest.json`  | Stub (Phase 3 fills).                                                                                                                          |

### Raw NASA assets (in `assets/raw/`)

| File                            |      Bytes | SHA-256 (truncated)   | Source ID                                |
| ------------------------------- | ---------: | --------------------- | ---------------------------------------- |
| `NASA-A11-MR.pdf`               | 15,973,944 | `3314d99654ebb2ac...` | `NASA-A11-MR`                            |
| `NASA-A11-MR.txt`               |    475,421 | `19ba185ee4fee429...` | `NASA-A11-MR` (NTRS full-text extract)   |
| `NASA-A11-SCIENCE-PRELIM.pdf`   | 32,131,355 | `99b1984f2e0e6668...` | `NASA-A11-SCIENCE-PRELIM`                |
| `NASA-A11-SCIENCE-PRELIM.txt`   |    460,194 | `fa5921ec3493d1da...` | `NASA-A11-SCIENCE-PRELIM` (NTRS extract) |
| `NASA-A11-TRAJ-RECON.pdf`       |  4,829,177 | `9b9aa3bd4fa9a410...` | `NASA-A11-TRAJ-RECON`                    |
| `NASA-APOLLO-NUMBERS.pdf`       | 36,037,981 | `2b8051684d39e0e8...` | `NASA-APOLLO-NUMBERS`                    |
| `NASA-A11-FP1-WB.pdf`           | 10,955,047 | `5563218d1e47166a...` | `NASA-A11-FP1` (Wayback)                 |
| `NASA-A11-TTEC-WB.pdf`          |  1,641,170 | `59d9e5d0dc872873...` | `NASA-A11-TTEC` (Wayback)                |
| `NASA-LM-HB-WB.pdf`             | 35,374,566 | `61b9f16ac41ab1ca...` | `NASA-LM-HB` (Wayback)                   |
| `NASA-CSM06-WB.pdf`             |  4,258,078 | `8bfcc957a12d3606...` | `NASA-CSM-NR` (Wayback; CM section only) |
| `NASA-A11-DEBRIEF-V1-WB.pdf`    |  2,742,116 | `7c8f6bd542cbb44c...` | `NASA-A11-DEBRIEF` (Wayback; Vol 1 only) |
| `NASA-MODEL-SATV.glb`           |    927,212 | `6c44497bce54ee0b...` | `NASA-MODEL-SATV`                        |
| `NASA-MODEL-LM.glb`             |    716,840 | `379101dfcee39926...` | `NASA-MODEL-LM`                          |
| `NASA-MODEL-SATV-STL.zip`       |  3,306,320 | `c041898b075d7529...` | `NASA-MODEL-SATV-STL`                    |
| `NASA-A11-LANDING-TERRAIN.stl`  |  7,138,484 | `72eae5e493d3966d...` | `NASA-A11-LANDING-TERRAIN`               |
| `NASA-A11-MOON-VIEW.jpg`        |  2,957,499 | `1318334a5089fb18...` | `NASA-A11-MOON-VIEW`                     |
| `NASA-A11-LANDING-SITE-LRO.jpg` |    202,986 | `c8ebab62a7c56b53...` | `NASA-A11-LANDING-SITE-LRO`              |
| `NASA-MOON-CGI-1k.jpg`          |    139,068 | `b246064f217f8d47...` | `NASA-MOON-CGI-KIT` (sample)             |

### Source page snapshots (in `docs/sources/apollo11/`)

24 HTML snapshots registered in the Source Manifest with SHA-256. See the manifest for full list.

### Inspection reports

| Path                                         | Purpose                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `assets/raw/NASA-MODEL-SATV.inspection.json` | Full node tree, bounds, triangle count, materials, textures for Saturn V GLB. |
| `assets/raw/NASA-MODEL-LM.inspection.json`   | Same for Lunar Module GLB.                                                    |

### Scripts

| Path                          | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `scripts/inspect-glb.ts`      | Node-only GLB inspector using `@gltf-transform` + `draco3d`. |
| `scripts/validate-sources.ts` | Source Manifest validator (URLs, hashes, sizes, fields).     |
| `scripts/validate-mission.ts` | Phase 0 exit-gate checker (all prerequisites present).       |
| `scripts/validate-models.ts`  | GLB inspection report validator.                             |

### Audit documents (in `docs/audit/`)

| Path                              | Purpose                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| `EVENT-VERIFICATION.md`           | Appendix A cross-check against NASA-A11-MR Table 3-I extracted text. |
| `MODEL-INSPECTION-REPORT.md`      | Saturn V + LM GLB inspection findings + Phase 3 implications.        |
| `ARTEMIS-REUSE-MAP.md`            | What may / must-not inherit from the Artemis prototype.              |
| `CSM-RECONSTRUCTION-PLAN.md`      | ADR-006: parallel Paths 2 + 3, fall back to Path 4.                  |
| `CELESTIAL-TEXTURE-CANDIDATES.md` | Earth + Moon texture inventory + Phase 3 plan.                       |
| `RISK-LOG.md`                     | 15 risks + 5 open questions + spec §60 halt check.                   |
| `DECISIONS.md`                    | Spec Appendix B ADRs reproduced + 7 Phase 0 decisions.               |
| `PHASE-0-REPORT.md`               | This file.                                                           |

## Facts added

| Fact ID                                          | Value                          | Evidence                                                               | Citation                                                                                                                                                                                                                          |
| ------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a11-epoch-range-zero`                           | `1969-07-16T13:32:00.000Z`     | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I header line ("Range zero - 13:32:00 G.m.t., July 16, 1969"), `assets/raw/NASA-A11-MR.txt` offset ~24,000                                                                                                  |
| `a11-epoch-liftoff-met`                          | `0.6` seconds                  | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I row "Lift-off 00:00:00.6"                                                                                                                                                                                 |
| `a11-event-liftoff-met`                          | `0.6` seconds                  | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-sic-outboard-cutoff-met`              | `161.7` seconds                | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-sii-ignition-cmd-met`                 | `163.0` seconds                | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-les-jettison-met`                     | `197.9` seconds                | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-sii-cutoff-met`                       | `548.3` seconds                | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-sivb-first-ignition-cmd-met`          | `552.2` seconds                | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-sivb-first-cutoff-met`                | `699.3` seconds                | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-tli-ignition-met`                     | `9856.2` seconds               | `ACTUAL` (engine ignition time, source footnote `*`)                   | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-csm-sivb-separation-met`              | `11824.6` seconds              | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-first-docking-met`                    | `12243.1` seconds              | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-spacecraft-ejection-met`              | `15419.1` seconds              | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-sivb-separation-maneuver-met`         | `16801.8` seconds              | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-mcc1-ignition-met`                    | `96298.7` seconds              | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-loi-ignition-met`                     | `272990.4` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-lunar-orbit-circularization-met`      | `288696.8` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-undocking-met`                        | `360720` seconds (integer)     | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-lm-separation-maneuver-met`           | `362392.9` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-doi-ignition-met`                     | `365774` seconds (integer)     | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-pdi-ignition-met`                     | `369185.2` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-touchdown-met`                        | `369939.9` seconds             | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-lm-hatch-open-met`                    | `392853` seconds (integer)     | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-lm-hatch-close-met`                   | `401953` seconds (integer)     | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-lunar-liftoff-met`                    | `447720.8` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-csi-ignition-met`                     | `451176` seconds (integer)     | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-cdh-ignition-met`                     | `454669.6` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-tpi-ignition-met`                     | `457431.8` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I                                                                                                                                                                                                           |
| `a11-event-lm-csm-docking-met`                   | `460980` seconds (integer)     | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I (p. 3-5)                                                                                                                                                                                                  |
| `a11-event-ascent-stage-jettison-met`            | `468571.2` seconds             | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I (p. 3-5)                                                                                                                                                                                                  |
| `a11-event-ascent-stage-separation-maneuver-met` | `469801` seconds (integer)     | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I (p. 3-5)                                                                                                                                                                                                  |
| `a11-event-tei-ignition-met`                     | `487422.3` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I (p. 3-5)                                                                                                                                                                                                  |
| `a11-event-mcc2-ignition-met`                    | `541797.4` seconds             | `ACTUAL` (engine ignition time)                                        | `NASA-A11-MR` Table 3-I (p. 3-5)                                                                                                                                                                                                  |
| `a11-event-cm-sm-separation-met`                 | `701352.7` seconds             | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I (p. 3-5)                                                                                                                                                                                                  |
| `a11-event-entry-interface-met`                  | `702185.7` seconds             | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I (p. 3-5)                                                                                                                                                                                                  |
| `a11-event-splashdown-met`                       | `703115` seconds (integer)     | `ACTUAL`                                                               | `NASA-A11-MR` Table 3-I (p. 3-5)                                                                                                                                                                                                  |
| `a11-event-first-step-met`                       | `393855` seconds (`109:24:15`) | `ACTUAL` with `source-rounded / timing varies by source` precision tag | `NASA-APOLLO-NUMBERS` per spec §A.2 (text verification deferred to Phase 2 — R-012); discrepancy with `NASA-A11-SCIENCE-PRELIM` `109:24:19` and `109:24:20` documented in `EVENT-VERIFICATION.md` and `DECISIONS.md` `ADR-P0-002` |

**Fact IDs are provisional and not yet written to `src/missions/apollo11/facts.ts`** — that file is Phase 1 / Phase 2 work (`mission-core` + Apollo 11 mission pack). Phase 0 establishes the canonical values, sources, and evidence tags; the TypeScript fact records are not part of Phase 0 deliverables.

## Events added or changed

| Event ID                                |   MET (sec) | Action                                    | Citation                |
| --------------------------------------- | ----------: | ----------------------------------------- | ----------------------- |
| (34 events listed in Facts table above) | (see above) | seeded but not yet written to `events.ts` | `NASA-A11-MR` Table 3-I |

**Events are not yet written to `src/missions/apollo11/events.ts`** — that file is Phase 1 / Phase 2 work. Phase 0 establishes the canonical MET values via the Event Verification document; the TypeScript event records are not part of Phase 0 deliverables.

## Schematic / reconstructed content

| ID                            | What is authored                                                                                                                     | Why                                                              | UI label                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------ |
| `saturn-v-glb-semantic-split` | Partition of single-geometry NASA Saturn V GLB into S-IC / interstage / S-II / interstage / S-IVB / IU / SLA / CSM / LES by Y-height | NASA GLB has no semantic part naming (R-003)                     | `RECONSTRUCTED FROM NASA REFERENCES` |
| `lm-glb-ascent-descent-split` | Partition of single-geometry NASA LM GLB into ascent stage + descent stage by Y-height                                               | NASA GLB has no semantic part naming (R-004)                     | `RECONSTRUCTED FROM NASA REFERENCES` |
| `csm-reconstruction`          | CSM model from Saturn V STL kit parts or Saturn V GLB top extraction (Phase 3)                                                       | No standalone Apollo 11 CSM GLB exists (ADR-006)                 | `RECONSTRUCTED FROM NASA REFERENCES` |
| `landing-site-terrain`        | Landing-site STL with 60× Z exaggeration undone, or regenerated from LRO/LOLA DEM                                                    | Original NASA STL exaggerates Z 60× for visual relief (spec C.2) | `RECONSTRUCTED TERRAIN`              |
| `earth-blue-marble-texture`   | Modern NASA composite used as global Earth texture                                                                                   | No single 1969 Earth photograph covers the full sphere           | `NASA IMAGERY-BASED TEXTURE`         |
| `moon-cgi-kit-texture`        | Modern LRO composite used as global Moon texture                                                                                     | No single 1969 Moon photograph covers the full sphere            | `NASA IMAGERY-BASED TEXTURE`         |

No schematic-only or fabricated content was authored in Phase 0. Phase 0 establishes what must be labelled `RECONSTRUCTED` in later phases.

## Assets processed

| Asset ID                    | Raw hash (sha256)                                                  | Derived hash   | Before                                                                                          | After                                                         | Recipe                                  |
| --------------------------- | ------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `NASA-MODEL-SATV`           | `6c44497bce54ee0b09d0edb8e33a6f484762a320dab1c54b383e434f5bba06b5` | (Phase 3)      | 927,212 bytes; 22 nodes; 34,814 tris; 13 mats; 8 textures; no semantic split                    | (Phase 3: split into 11 semantic GLBs with stable node names) | (Phase 3: `scripts/optimize-models.ts`) |
| `NASA-MODEL-LM`             | `379101dfcee399267addf771709107c35e826b0b9e5233272f123e4c8a585c4e` | (Phase 3)      | 716,840 bytes; 134 nodes; 97,588 tris; 12 mats; 6 textures; Draco-compressed; no semantic split | (Phase 3: split into ascent + descent + accessories)          | (Phase 3)                               |
| `NASA-MODEL-SATV-STL`       | `c041898b075d7529a812b5e820cd3ce2efd9199b13dfeab5b60b1aa9f4674021` | (Phase 3)      | 3,306,320 bytes ZIP; contents not enumerated                                                    | (Phase 3: unzip, inventory STLs, identify CM/SM candidates)   | (Phase 3)                               |
| `NASA-A11-LANDING-TERRAIN`  | `72eae5e493d3966dae392ce7563d66676e5a0b72d9753609d39723c8e84b1c72` | (Phase 3)      | 7,138,484 bytes STL; Z exaggerated 60× per source                                               | (Phase 3: undo exaggeration or regenerate from LRO/LOLA DEM)  | (Phase 3)                               |
| `NASA-A11-MOON-VIEW`        | `1318334a5089fb186d39996f60677b5f5b42cde74158ceff97b3e2283bfd41d4` | n/a            | 2,957,499 bytes JPG                                                                             | used as-is (Phase 2: also archive TIF variant)                | n/a                                     |
| `NASA-A11-LANDING-SITE-LRO` | `c8ebab62a7c56b5320b7b9100787a048e262643f5d893b7ce079d706279b597b` | n/a            | 202,986 bytes JPG                                                                               | used as-is with capture-year label                            | n/a                                     |
| `NASA-MOON-CGI-1k.jpg`      | `b246064f217f8d479df78c49c7c8595a8f5fbda008a72fd539978d2e121e0109` | (Phase 3 KTX2) | 139,068 bytes JPG sample                                                                        | (Phase 3: full-res variants downloaded + KTX2-converted)      | (Phase 3)                               |

Phase 0 did not run the optimize-models pipeline. That is Phase 3 work.

## Commands run

| Command                                                                                 | Exit code | Summary                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node --version`                                                                        | 0         | v25.8.1                                                                                                                                                                                                                                          |
| `pnpm --version`                                                                        | 0         | 10.6.2                                                                                                                                                                                                                                           |
| `pnpm install --prefer-offline`                                                         | 0         | 94 packages, 6.1s. Installed: `@gltf-transform/core@4.4.1`, `@gltf-transform/extensions@4.4.1`, `@gltf-transform/functions@4.4.1`, `@types/node@26.1.1`, `eslint@10.7.0`, `gltf-validator@2.0.0-dev.3.10`, `prettier@3.9.5`, `typescript@7.0.2`. |
| `pnpm add -D draco3d@1.5.7`                                                             | 0         | 1 package added (Draco decoder for LM GLB)                                                                                                                                                                                                       |
| `curl.exe ... NASA-A11-MR.pdf`                                                          | 0         | 200 OK, 15,973,944 bytes, application/pdf                                                                                                                                                                                                        |
| `curl.exe ... NASA-A11-SCIENCE-PRELIM.pdf`                                              | 0         | 200 OK, 32,131,355 bytes                                                                                                                                                                                                                         |
| `curl.exe ... NASA-A11-TRAJ-RECON.pdf`                                                  | 0         | 200 OK, 4,829,177 bytes                                                                                                                                                                                                                          |
| `curl.exe ... NASA-APOLLO-NUMBERS.pdf`                                                  | 0         | 200 OK, 36,037,981 bytes                                                                                                                                                                                                                         |
| `curl.exe ... NASA-MODEL-SATV.glb`                                                      | 0         | 200 OK, 927,212 bytes, model/gltf-binary                                                                                                                                                                                                         |
| `curl.exe ... NASA-MODEL-LM.glb`                                                        | 0         | 200 OK, 716,840 bytes, model/gltf-binary                                                                                                                                                                                                         |
| `curl.exe ... NASA-MODEL-SATV-STL.zip`                                                  | 0         | 200 OK, 3,306,320 bytes, application/zip                                                                                                                                                                                                         |
| `curl.exe ... NASA-A11-LANDING-TERRAIN.stl`                                             | 0         | 200 OK, 7,138,484 bytes, application/vnd.ms-pki.stl                                                                                                                                                                                              |
| `curl.exe ... NASA-A11-MOON-VIEW.jpg`                                                   | 0         | 200 OK, 2,957,499 bytes, image/jpeg                                                                                                                                                                                                              |
| `curl.exe ... web.archive.org/.../a11final-fltpln.pdf`                                  | 0         | 200 OK, 10,955,047 bytes, application/pdf                                                                                                                                                                                                        |
| `curl.exe ... web.archive.org/.../a11transcript_tec.pdf`                                | 0         | 200 OK, 1,641,170 bytes, application/pdf                                                                                                                                                                                                         |
| `curl.exe ... web.archive.org/.../lm10handbookvol1.pdf`                                 | 0         | 200 OK, 35,374,566 bytes, application/pdf                                                                                                                                                                                                        |
| `curl.exe ... web.archive.org/.../CSM06_Command_Module_Overview_pp39-52.pdf`            | 0         | 200 OK, 4,258,078 bytes, application/pdf                                                                                                                                                                                                         |
| `curl.exe ... web.archive.org/.../A11TechCrewDebrfV1_ALSJ.pdf`                          | 0         | 200 OK, 2,742,116 bytes, application/pdf                                                                                                                                                                                                         |
| `curl.exe ... a11_lro.jpg`                                                              | 0         | 200 OK, 202,986 bytes, image/jpeg                                                                                                                                                                                                                |
| `curl.exe -k ... svs.gsfc.nasa.gov/vis/.../lroc_color_poles_1k.jpg`                     | 0         | 200 OK, 139,068 bytes (with `-k` for expired TLS cert)                                                                                                                                                                                           |
| `curl.exe ... NTRS 19700008096.txt`                                                     | 0         | 200 OK, 475,421 bytes — NTRS-extracted full text of Mission Report                                                                                                                                                                               |
| `curl.exe ... NTRS 19700000726.txt`                                                     | 0         | 200 OK, 460,194 bytes — NTRS-extracted full text of Preliminary Science Report                                                                                                                                                                   |
| (24 web page snapshots)                                                                 | 0         | all 200 OK; SHA-256 recorded in Source Manifest                                                                                                                                                                                                  |
| `node --experimental-strip-types scripts/inspect-glb.ts assets/raw/NASA-MODEL-SATV.glb` | 0         | 22 nodes, 34,814 tris, 13 mats, 8 textures; no semantic split; height 12.987 units                                                                                                                                                               |
| `node --experimental-strip-types scripts/inspect-glb.ts assets/raw/NASA-MODEL-LM.glb`   | 0         | 134 nodes, 97,588 tris, 12 mats, 6 textures; Draco-compressed; no semantic split; height 5.013 units                                                                                                                                             |
| `node --experimental-strip-types scripts/validate-sources.ts`                           | 0         | 0 errors, 0 warnings. All binary SHA-256 + sizes verified.                                                                                                                                                                                       |
| `node --experimental-strip-types scripts/validate-models.ts`                            | 0         | 2 inspection reports present and valid.                                                                                                                                                                                                          |
| `node --experimental-strip-types scripts/validate-mission.ts`                           | 0         | 11 of 12 prerequisites present; the 12th is this file. Passes after this file is written.                                                                                                                                                        |

## Screenshots / recordings

Phase 0 has no UI to screenshot. Phase 6 (full UI) and Phase 7 (visual regression) produce screenshots per spec §45.

The GLB inspection outputs in `assets/raw/*.inspection.json` are the Phase 0 equivalent of screenshots — they capture the model structure at a point in time.

## Performance delta

Not applicable in Phase 0. Phase 7 (audit, optimization, release candidate) reports performance against the spec §35 budget.

## Accessibility checks

Not applicable in Phase 0. Phase 6 (full UI) and Phase 7 (audit) run accessibility checks against spec §28 (WCAG 2.2 AA).

Phase 0 deliverables are documents and scripts — no UI surfaces to audit.

## Open questions / known gaps

See `docs/audit/RISK-LOG.md` for the complete list. Summary:

1. **R-001 / OPEN**: SVS GSFC TLS cert expired as of 2026-07-13. Phase 3 must re-probe.
2. **R-002 / OPEN**: Blue Marble direct image URLs return 404. Phase 3 must find working URL via Wayback or alternative.
3. **R-003 / OPEN**: Saturn V GLB has no semantic part naming. Phase 3 must split.
4. **R-004 / OPEN**: LM GLB has no semantic part naming. Phase 3 must split.
5. **R-005 / OPEN**: Neither GLB is at real-world meter scale. Phase 3 must normalize.
6. **R-007 / OPEN**: Neither GLB is AS-506 / LM-5 specific. Owner input needed on marking fidelity.
7. **R-010 / RESOLVED at Phase 0**: First-step timing discrepancy documented; canonical MET `109:24:15` adopted per `ADR-P0-002`. SP-4029 text verification deferred to Phase 2 (R-012).
8. **R-012 / OPEN**: SP-4029 PDF text not extractable in Phase 0 (NTRS does not host it). Phase 2 must install a PDF text-extraction tool.
9. **R-013 / OPEN**: NTRS 19690026499 (Post-launch Operational Trajectory) direct PDF URL not resolved. Phase 2 must probe the NTRS API.
10. **R-014 / OPEN**: Apollo 11 audio archive not enumerated. Phase 2 must scope MVP clips.
11. **R-015 / NOTED**: ALSJ / AFJ editorial content rights status requires per-citation care in Phase 2.
12. **Owner input needed**: AS-506 / LM-5 marking fidelity (Q1), Blender availability for Phase 3 (Q2), Phase 2 audio scope (Q3), Blue Marble variant preference (Q4), CSM self-build acceptability (Q5).

## Explicitly not completed

Per spec §48 ("Phase 0 之前不得批量生成任务数据或制作最终 UI") and §49 (Phase 0 deliverables scope), the following are **NOT** part of Phase 0 and are explicitly deferred:

- ❌ **Final UI** — no React / R3F / Three components. Phase 4+.
- ❌ **`mission-core` types and selectors** — Phase 1.
- ❌ **`src/missions/apollo11/events.ts`** with TypeScript event records — Phase 1 / Phase 2.
- ❌ **`src/missions/apollo11/facts.ts`** with TypeScript fact records — Phase 2.
- ❌ **`src/missions/apollo11/narrative.ts`** with storyTime mapping — Phase 1.
- ❌ **`src/missions/apollo11/vehicle.ts`** with vehicle definition — Phase 2.
- ❌ **`src/missions/apollo11/telemetry/`** with telemetry channels — Phase 2.
- ❌ **`src/missions/apollo11/archive/`** with Archive section content — Phase 2.
- ❌ **`asset-manifest.json`** populated — Phase 3.
- ❌ **`node-manifests/`** for derived GLBs — Phase 3.
- ❌ **Derived GLBs** in `assets/derived/` — Phase 3.
- ❌ **KTX2 textures** — Phase 3.
- ❌ **Saturn V STL ZIP enumeration** — Phase 3.
- ❌ **Landing-site STL geometry inspection** — Phase 3.
- ❌ **Full-resolution Moon textures** (2K / 4K / 8K / DEM TIFs) — Phase 3.
- ❌ **Blue Marble texture** — Phase 3.
- ❌ **Apollo 11 audio clip enumeration and download** — Phase 2.
- ❌ **SP-4029 text extraction and `109:24:15.00` verification** — Phase 2.
- ❌ **NTRS 19690026499 direct PDF download** — Phase 2.
- ❌ **CSM News Reference remaining chapters** (CSM01–05, CSM07–13) — Phase 2.
- ❌ **Technical Crew Debriefing Vol. 2** — Phase 2 (if needed).
- ❌ **Specific Apollo 11 image plates** (curated from `NASA-A11-IMAGES`) — Phase 2.
- ❌ **Unit tests** — Phase 1+ (mission-core).
- ❌ **PDF text-extraction tool** (e.g., `pdfplumber`) — Phase 2.
- ❌ **Blender integration** (if needed) — Phase 3.
- ❌ **Apollo Experience Reports** (specific subsystem reports) — Phase 2 / Phase 3.
- ❌ **LOD generation** (high / medium / low) — Phase 3.
- ❌ **Draco / KTX2 runtime decoder integration** — Phase 3.
- ❌ **Visual regression baseline** — Phase 7.
- ❌ **Performance audit** — Phase 7.
- ❌ **Accessibility audit** — Phase 6 / Phase 7.

## Phase 0 acceptance criteria (spec §49)

| Criterion                                                                              | Status                                                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Did not modify Artemis product code                                                    | ✅ `D:\artemis-mission-archive` untouched.                                                                                                                             |
| Every local raw source traces to official URL                                          | ✅ All 31 sources in Source Manifest have `originalUrl`; binaries have `sha256`.                                                                                       |
| No key event has un-verified "actual" time                                             | ✅ 33 of 34 Appendix A.1 events verified against `NASA-A11-MR` Table 3-I extracted text; first-step discrepancy documented and canonical MET adopted per `ADR-P0-002`. |
| CSM path determined, no Apollo-Soyuz substitute                                        | ✅ `ADR-006` + `CSM-RECONSTRUCTION-PLAN.md`: parallel Paths 2 + 3, fall back to Path 4. Apollo-Soyuz explicitly forbidden and not located.                             |
| Model semantic separability determined, unknowns have clear experiments                | ✅ Both GLBs inspected; neither has semantic part naming; Phase 3 split plan documented.                                                                               |
| `ACTUAL / DERIVED / INTERPOLATED / PLANNED / RECONSTRUCTED / SCHEMATIC` usage is clear | ✅ Documented in `AGENTS.md`, `EVENT-VERIFICATION.md`, `MODEL-INSPECTION-REPORT.md`, `CSM-RECONSTRUCTION-PLAN.md`, `CELESTIAL-TEXTURE-CANDIDATES.md`.                  |

**Phase 0 exit gate: PASS** (pending owner review of open questions in `RISK-LOG.md`).

## Next steps (Phase 1 — Mission Core)

Per spec §50, Phase 1 delivers:

- Time, epoch, event, source, unit, evidence, and state types in `src/mission-core/types/`.
- Narrative time mapping in `src/mission-core/narrative/`.
- Pure `stateAtMet` in `src/mission-core/state-machine/`.
- Schema and validation scripts in `src/mission-core/validation/`.
- Minimal fixture mission in `tests/fixtures/`.
- Unit tests in `tests/unit/`.

**Phase 1 may proceed after owner signs off on Phase 0** (per spec §48: "上一阶段验收通过后再继续").
