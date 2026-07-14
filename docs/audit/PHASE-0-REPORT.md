# Phase 0 Completion Report

**Phase**: 0 — Baseline, Source Freeze & Feasibility (remediation round 2)
**Project**: Apollo 11 Mission Archive + Historical Replay
**Path**: `D:\apollo-11-mission-archive`
**Date**: 2026-07-13 (remediation round 2)
**Spec reference**: APOLLO_11_PRODUCTION_SPEC §49 (Phase 0 deliverables + acceptance)
**Report template**: spec §58

## Scope completed

### Original Phase 0 scope (carried forward)

- ✅ New project skeleton at `D:\apollo-11-mission-archive` (independent of `D:\artemis-mission-archive` per spec §4 / ADR-001).
- ✅ Project config: `package.json`, `tsconfig.json` + 3 ref configs, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.nvmrc`, `LICENSE`, `README.md`, `AGENTS.md`.
- ✅ Full directory structure per spec §39.
- ✅ Production Spec copied into `docs/APOLLO_11_PRODUCTION_SPEC.md` for traceability.
- ✅ Complete initial Source Manifest: all 31 spec §8 Source IDs registered + 1 remediation source (NASA-A11-SATV-FE) = 32 total.
- ✅ NASA PDFs / GLBs / STL / ZIP / images / web pages downloaded, hashed, registered.
- ✅ Appendix A.1 key event table cross-checked against `NASA-A11-MR` Table 3-I extracted text.
- ✅ Artemis reuse map; Earth / Moon texture candidate inventory.

### Remediation round 1 fixes

- ✅ **Appendix A.3 event investigation completed** — 28 Event IDs established across 10 A.3 categories in `docs/audit/EVENT-VERIFICATION-A3.md`, each with source candidates, verification status, and non-ACTUAL processing rules. No longer deferred to Phase 2.
- ✅ **Saturn V STL printing kit fully enumerated** — 12 STL files inspected (triangle count, bounds, units, SHA-256) in `docs/audit/STL-INSPECTION.txt`. CSM-relevant parts identified: CM, SM, LES, SLA.
- ✅ **NASA-A11-POSTTRAJ fixed** — correct PDF downloaded (8,004,579 bytes, sha256 `55b94c5947c91a3cd0539601517c82941a04ec9631dbb90458275664b855a7b3`), manifest entry corrected from cross-wired HTML to proper PDF.
- ✅ **validate-sources.ts upgraded** — kind/localPath/status consistency, file-signature/magic-byte checks (PDF/GLB/ZIP/JPG/PNG/TIF), cross-wiring detection. NASA-EARTH-BLUE-MARBLE kind corrected from `image` to `web` (only landing page archived).
- ✅ **SP-4029 first-step 109:24:15.00 page-level verification complete** — PyMuPDF extraction found two citations on PDF pages 104 (narrative) and 118 (timeline table), both confirming `109:24:15` / `109:24:15.00`. Recorded in `docs/audit/SP4029-extraction.txt`.
- ✅ **inspect-glb.ts false-positive semantic detection fixed** — `saturnv_ca` no longer matches as Saturn stage semantic; strict token-boundary matching. `validate-models.ts` now re-parses GLB from disk, verifies SHA-256 correspondence, confirms structural counts.
- ✅ **All 8 release gates pass** — typecheck, lint, format:check, test:unit, validate:sources, validate:mission, validate:models, build (all exit 0).
- ✅ **Git initialized** — no prior `.git` existed; initial commit created on branch `master`.

### Remediation round 2 fixes

- ✅ **R-016 RESOLVED** — Saturn V Launch Vehicle Flight Evaluation Report (MPR-SAT-FE-69-9 / NASA-TM-X-62558 / NTRS 19900066485) archived from archive.org mirror. NTRS record de-indexed (API 404); Wayback has only HTML wrappers. S-IC/S-II separation verified at **162.3 sec** and S-II/S-IVB separation at **549.0 sec**; both are direct ACTUAL values in Table 2-2 and Table 4-3, with TFB arithmetic as an additional cross-check. A.3 Event IDs updated to MET-CONFIRMED. See `docs/audit/SATV-FE-SEPARATION-VERIFICATION.txt`.
- ✅ **Git reproducibility achieved** — `scripts/hydrate-assets.ts` downloads all gitignored GLB/STL/ZIP binaries from canonical URLs with SHA-256 verification and ZIP extraction. Verified in clean `git archive` clone: all 4 binaries downloaded, hashed, and extracted; all 8 gates pass. `.gitattributes` added to force LF for text files and mark binary/archive files as `binary` to preserve exact bytes for hash verification.
- ✅ **STL documentation contradiction fixed** — "command module.stl not present" corrected to "exact spelling 'command module.stl' does NOT exist; 'command moduel.stl' (original typo) exists and is the CM candidate." Path 2 changed from "confirmed viable" to **"provisionally viable"** pending visual geometry verification (Phase 3). `scripts/inspect-stls.ts` committed and validates all 12 manifest stlParts.
- ✅ **Cross-wiring detection improved** — `validate-sources.ts` now supports `contentAssertions` field with `htmlCanonicalMarker` check (verifies HTML content contains a declared marker string) and `ntrsCitationId` cross-check. Unit test `tests/unit/cross-wiring.test.ts` verifies that a wrong HTML path fails the content assertion.
- ✅ **All 8 release gates pass in both original repo and clean clone** — verified with real command outputs.

### Remediation round 3 fixes

- ✅ **Table 2-2 transcription corrected** — coordinate-based PyMuPDF extraction revealed row/value misalignment: Event 27 = 162.3 (not 164.0, which is Event 29); Event 46 = 549.0 (not 550.4, which is Event 48). Removed "physical separation before command" argument.
- ✅ **Cross-wiring test uses real validator** — `validate-sources.ts` exports `validate()` function; CLI supports `--manifest`/`--root` flags. Test calls real validator, no inline logic duplication. Added `htmlCanonicalMarker` to 15 production HTML sources. Removed unimplemented PDF assertion fields.
- ✅ **Old wording cleaned** — EVENT-VERIFICATION.md, EVENT-VERIFICATION-A3.md, MODEL-INSPECTION-REPORT.md, CSM-RECONSTRUCTION-PLAN.md updated.
- ✅ **Table 2-2 regression test** — `tests/unit/satv-fe-table22.test.ts` with 11 tests covering Events 27/29/46/48, base+TFB consistency, ordering invariants.

### Remediation round 4 fixes (this round)

- ❌ **Table 2-2 source classification was incorrect** — round 4 wrongly stated that Events 27/46 lacked direct ACTUAL cells. This was superseded by round 5 after visual inspection of the ruled source table.
- ✅ **4 non-unique HTML markers fixed** — NASA-A11-AFJ, NASA-A11-FP, NASA-A11-LANDING, NASA-A11-ALSJ markers replaced with precise unique strings (full title tag, unique file reference, or unique MET timestamp). Added test verifying each marker hits exactly one file. Removed "without contentAssertions is allowed" test — all HTML sources must now declare markers.
- ✅ **Table 2-2 test uses shared JSON fixture** — `tests/fixtures/satv-fe-table22.json` contains PDF SHA-256, page numbers, events, direct ACTUAL, TFB, Table 4-3 values. Test cross-checks fixture, source-manifest.json, and SATV-FE-SEPARATION-VERIFICATION.txt — no hardcoded constants in test file.
- ✅ **CLI direct-run guard added** — `validate-sources.ts` checks `isMainModule` before executing CLI code, preventing auto-execution on import.
- ✅ **37 tests pass** (6 epoch + 5 cross-wiring + 26 Table 2-2/fixture).

### Remediation round 5 fixes (this round)

- ✅ **Table 2-2 direct ACTUAL cells restored** — visual inspection confirms Event 27 = 162.3 and Event 46 = 549.0 in the `RANGE TIME ACTUAL SEC` column. Table 4-3 independently records the same ACTUAL values; TFB 0.7/0.8 remains an additional arithmetic cross-check.
- ✅ **False self-consistency removed** — corrected the shared fixture and the two tests that previously asserted the direct ACTUAL cells were absent. Synchronized source manifest, A.3 verification, separation verification, and risk log.
- ✅ **Audit history preserved** — round 4 remains documented as an incorrect classification rather than being silently rewritten as successful.

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

### Release gates (spec §47) — all must pass — remediation round 4

| Command                 | Exit code | Summary                                                                                                                             |
| ----------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`        | 0         | `tsc -b` — no errors. TypeScript 5.9.3.                                                                                             |
| `pnpm lint`             | 0         | `eslint .` — no errors.                                                                                                             |
| `pnpm format:check`     | 0         | `prettier --check .` — "All matched files use Prettier code style!"                                                                 |
| `pnpm test:unit`        | 0         | `node --test --experimental-strip-types tests/unit/**/*.test.ts` — 37 tests pass (6 epoch + 5 cross-wiring + 26 Table 2-2), 0 fail. |
| `pnpm validate:sources` | 0         | 0 errors, 0 warnings. 32 sources. All binary SHA-256 + sizes verified. Content assertions pass (15 production HTML markers).        |
| `pnpm validate:mission` | 0         | 21/21 prerequisites present.                                                                                                        |
| `pnpm validate:models`  | 0         | Both GLB inspection reports valid and correspond to on-disk files (hash + structural count verification).                           |
| `pnpm build`            | 0         | `tsc -b && vite build` — emits `dist/index.html` (1.44 kB, gzip 0.70 kB).                                                           |
| `pnpm inspect-stls`     | 0         | 12 stlParts verified (size, SHA-256, triangle count, bounds).                                                                       |

### Clean clone gate verification (remediation round 2)

Verified that all 8 gates pass in a clean `git archive` clone after running `pnpm install` + `node --experimental-strip-types scripts/hydrate-assets.ts`:

| Step                                                        | Exit code | Summary                                                                                         |
| ----------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `git archive --format=zip -o repo.zip master`               | 0         | Archive created from HEAD.                                                                      |
| `Expand-Archive repo.zip`                                   | 0         | Clean clone extracted (no gitignored binaries present).                                         |
| `pnpm install --prefer-offline`                             | 0         | 94 packages installed.                                                                          |
| `node --experimental-strip-types scripts/hydrate-assets.ts` | 0         | 4 binaries downloaded (GLB x2, STL x1, ZIP x1), all SHA-256 verified, ZIP extracted to 12 STLs. |
| `pnpm typecheck`                                            | 0         | PASS                                                                                            |
| `pnpm lint`                                                 | 0         | PASS                                                                                            |
| `pnpm format:check`                                         | 0         | PASS                                                                                            |
| `pnpm test:unit`                                            | 0         | PASS (8 tests)                                                                                  |
| `pnpm validate:sources`                                     | 0         | PASS (0 errors, 0 warnings)                                                                     |
| `pnpm validate:mission`                                     | 0         | PASS (21/21 prerequisites)                                                                      |
| `pnpm validate:models`                                      | 0         | PASS (2 GLBs verified)                                                                          |
| `pnpm build`                                                | 0         | PASS                                                                                            |
| `pnpm inspect-stls`                                         | 0         | PASS (12 stlParts verified)                                                                     |

### Remediation round 2 commands

| Command                                                                                                       | Exit code | Summary                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `curl.exe -L --ssl-no-revoke ... archive.org/.../saturn-v-launch-vehicle-flight-evaluation-report-as-506.pdf` | 0         | 200 OK, 11,581,879 bytes. sha256 `feb84bc2f6d761cc0996faf7ca74d449d83beb885b8ec67d4892f57e4ed0d212`.                                                    |
| `python extract_satv_fe.py`                                                                                   | 0         | PyMuPDF extracted S-IC/S-II separation = 162.3 sec (Table 4-3), S-II/S-IVB separation = 549.0 sec (Table 4-3). Section 12.2 + 12.3 narrative confirmed. |
| `node --experimental-strip-types scripts/inspect-stls.ts`                                                     | 0         | 12 STL parts verified (size, SHA-256, triangle count, bounds).                                                                                          |
| `node --experimental-strip-types scripts/hydrate-assets.ts`                                                   | 0         | 4 binaries hydrated (download + SHA-256 + ZIP extract).                                                                                                 |

### Remediation commands

| Command                                                                                 | Exit code | Summary                                                                                                                               |
| --------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `curl.exe ... NASA-A11-POSTTRAJ.pdf`                                                    | 0         | 200 OK, 8,004,579 bytes, application/pdf. sha256 `55b94c5947c91a3cd0539601517c82941a04ec9631dbb90458275664b855a7b3`.                  |
| `python E:\系统缓存\opencode\extract_sp4029.py`                                         | 0         | Wrote `docs/audit/SP4029-extraction.txt`. Found `109:24:15` on PDF page 104 (narrative) and PDF page 118 (timeline table) of SP-4029. |
| `python E:\系统缓存\opencode\inspect_stls.py`                                           | 0         | Wrote `docs/audit/STL-INSPECTION.txt`. 12 STLs inventoried with triangle count, bounds, units, SHA-256.                               |
| `Expand-Archive NASA-MODEL-SATV-STL.zip`                                                | 0         | 12 STL files extracted to `assets/raw/NASA-MODEL-SATV-STL-extracted/`.                                                                |
| `node --experimental-strip-types scripts/inspect-glb.ts assets/raw/NASA-MODEL-SATV.glb` | 0         | Re-inspected with fixed semantic detection: `hasSemanticSaturnStages=false` (was `true` — false positive removed).                    |
| `node --experimental-strip-types scripts/inspect-glb.ts assets/raw/NASA-MODEL-LM.glb`   | 0         | Re-inspected: `hasSemanticLMStages=false` (correct).                                                                                  |
| `git init`                                                                              | 0         | Initialized empty Git repository.                                                                                                     |
| `git add -A`                                                                            | 0         | 79 files staged (node_modules, dist, raw GLB/STL/ZIP excluded by .gitignore).                                                         |
| `git commit -m "Phase 0 remediation..."`                                                | 0         | Commit `81444525603d93b8f9e98ceb943863fab3759868` on branch `master`.                                                                 |

### Original Phase 0 commands (carried forward)

| Command                                            | Exit code | Summary                                                                              |
| -------------------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `node --version`                                   | 0         | v25.8.1                                                                              |
| `pnpm --version`                                   | 0         | 10.6.2                                                                               |
| `pnpm install --prefer-offline`                    | 0         | 94 packages.                                                                         |
| `pnpm add -D draco3d@1.5.7`                        | 0         | Draco decoder for LM GLB.                                                            |
| `pnpm add -D vite@latest`                          | 0         | Vite 8.1.4 (remediation — needed for build gate).                                    |
| `pnpm add -D @eslint/js typescript-eslint globals` | 0         | ESLint deps (remediation — needed for lint gate).                                    |
| `pnpm add -D typescript@~5.9`                      | 0         | TypeScript 5.9.3 (remediation — downgraded from 7.0.2 for typescript-eslint compat). |
| `curl.exe ... NASA-A11-MR.pdf`                     | 0         | 200 OK, 15,973,944 bytes.                                                            |
| `curl.exe ... NASA-A11-SCIENCE-PRELIM.pdf`         | 0         | 200 OK, 32,131,355 bytes.                                                            |
| `curl.exe ... NASA-A11-TRAJ-RECON.pdf`             | 0         | 200 OK, 4,829,177 bytes.                                                             |
| `curl.exe ... NASA-APOLLO-NUMBERS.pdf`             | 0         | 200 OK, 36,037,981 bytes.                                                            |
| `curl.exe ... NASA-MODEL-SATV.glb`                 | 0         | 200 OK, 927,212 bytes.                                                               |
| `curl.exe ... NASA-MODEL-LM.glb`                   | 0         | 200 OK, 716,840 bytes.                                                               |
| `curl.exe ... NASA-MODEL-SATV-STL.zip`             | 0         | 200 OK, 3,306,320 bytes.                                                             |
| `curl.exe ... NASA-A11-LANDING-TERRAIN.stl`        | 0         | 200 OK, 7,138,484 bytes.                                                             |
| `curl.exe ... NASA-A11-MOON-VIEW.jpg`              | 0         | 200 OK, 2,957,499 bytes.                                                             |
| (5 Wayback PDFs)                                   | 0         | all 200 OK; SHA-256 recorded.                                                        |
| (24 web page snapshots)                            | 0         | all 200 OK; SHA-256 recorded.                                                        |

## Screenshots / recordings

Phase 0 has no UI to screenshot. Phase 6 (full UI) and Phase 7 (visual regression) produce screenshots per spec §45. The GLB inspection outputs in `assets/raw/*.inspection.json` are the Phase 0 equivalent of screenshots — they capture the model structure at a point in time.

## Performance delta

Not applicable in Phase 0. Phase 7 (audit, optimization, release candidate) reports performance against the spec §35 budget.

## Accessibility checks

Not applicable in Phase 0. Phase 6 (full UI) and Phase 7 (audit) run accessibility checks against spec §28 (WCAG 2.2 AA). Phase 0 deliverables are documents and scripts — no UI surfaces to audit.

## Open questions / known gaps

See `docs/audit/RISK-LOG.md` for the complete list. Summary (remediation):

1. **R-001 / OPEN**: SVS GSFC TLS cert expired as of 2026-07-13. Phase 3 must re-probe.
2. **R-002 / OPEN**: Blue Marble direct image URLs return 404. Phase 3 must find working URL via Wayback or alternative. (Remediation: NASA-EARTH-BLUE-MARBLE kind corrected from `image` to `web`; the image binary is `pending`, not falsely `downloaded`.)
3. **R-003 / OPEN**: Saturn V GLB has no semantic part naming. Phase 3 must split.
4. **R-004 / OPEN**: LM GLB has no semantic part naming. Phase 3 must split.
5. **R-005 / OPEN**: Neither GLB is at real-world meter scale. Phase 3 must normalize.
6. **R-007 / OPEN**: Neither GLB is AS-506 / LM-5 specific. Owner input needed on marking fidelity.
7. **R-010 / RESOLVED (remediation)**: First-step timing discrepancy documented; canonical MET `109:24:15` adopted per `ADR-P0-002`. **SP-4029 page-level verification COMPLETE** — `109:24:15` found on PDF pages 104 + 118 of SP-4029 via PyMuPDF extraction.
8. **R-012 / RESOLVED (remediation)**: SP-4029 PDF text extracted with PyMuPDF (fitz 1.28.0); `109:24:15.00` citation verified.
9. **R-013 / RESOLVED (remediation)**: NASA-A11-POSTTRAJ correct PDF downloaded (8,004,579 bytes); manifest cross-wiring fixed; validator upgraded to detect recurrence.
10. **R-014 / OPEN**: Apollo 11 audio archive not enumerated. Phase 2 must scope MVP clips.
11. **R-015 / NOTED**: ALSJ / AFJ editorial content rights status requires per-citation care in Phase 2.
12. **R-016 / RESOLVED (remediation round 2)**: Apollo 11 launch vehicle flight evaluation report archived from archive.org mirror (NTRS de-indexed). S-IC/S-II separation = 162.3 sec (Table 4-3 ACTUAL), S-II/S-IVB separation = 549.0 sec (Table 4-3 ACTUAL) — both MET-CONFIRMED with Table 2-2 TFB cross-check.
13. **Owner input needed**: AS-506 / LM-5 marking fidelity (Q1), Blender availability for Phase 3 (Q2), Phase 2 audio scope (Q3), Blue Marble variant preference (Q4), CSM self-build acceptability (Q5).

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
- ❌ **Landing-site STL geometry inspection** (bounds + 60× Z exaggeration verification) — Phase 3.
- ❌ **Full-resolution Moon textures** (2K / 4K / 8K / DEM TIFs) — Phase 3.
- ❌ **Blue Marble texture binary download** — Phase 3.
- ❌ **Apollo 11 audio clip enumeration and download** — Phase 2.
- ❌ **CSM News Reference remaining chapters** (CSM01–05, CSM07–13) — Phase 2.
- ❌ **Technical Crew Debriefing Vol. 2** — Phase 2 (if needed).
- ❌ **Specific Apollo 11 image plates** (curated from `NASA-A11-IMAGES`) — Phase 2.
- ❌ **mission-core unit tests** (epoch/first-step smoke tests exist in Phase 0) — Phase 1+.
- ❌ **Blender integration** (if needed) — Phase 3.
- ❌ **Apollo Experience Reports** (specific subsystem reports) — Phase 2 / Phase 3.
- ❌ **LOD generation** (high / medium / low) — Phase 3.
- ❌ **Draco / KTX2 runtime decoder integration** — Phase 3.
- ❌ **Visual regression baseline** — Phase 7.
- ❌ **Performance audit** — Phase 7.
- ❌ **Accessibility audit** — Phase 6 / Phase 7.

Items removed from this list in remediation (now completed):

- ✅ Saturn V STL ZIP enumeration — DONE (12 STLs inspected, `docs/audit/STL-INSPECTION.txt`).
- ✅ SP-4029 text extraction and `109:24:15.00` verification — DONE (PyMuPDF, PDF pages 104 + 118).
- ✅ NTRS 19690026499 direct PDF download — DONE (8,004,579 bytes archived).
- ✅ PDF text-extraction tool — DONE (PyMuPDF / fitz 1.28.0 used; not added as npm dep because it is a host Python tool, but extraction outputs are committed).

## Phase 0 acceptance criteria (spec §49)

| Criterion                                                                              | Status                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Did not modify Artemis product code                                                    | ✅ `D:\artemis-mission-archive` untouched.                                                                                                                                                                                                                                       |
| Every local raw source traces to official URL                                          | ✅ All 32 sources in Source Manifest have `originalUrl`; binaries have `sha256`. Validator enforces kind/localPath consistency + file-signature checks + content assertions.                                                                                                     |
| No key event has un-verified "actual" time                                             | ✅ 33 of 34 Appendix A.1 events verified against `NASA-A11-MR` Table 3-I; first-step canonical MET `109:24:15` page-level verified in SP-4029; 28 A.3 sub-event IDs established. S-IC/S-II (162.3s) and S-II/S-IVB (549.0s) separations now MET-CONFIRMED from NASA-A11-SATV-FE. |
| CSM path determined, no Apollo-Soyuz substitute                                        | ✅ `ADR-006` + `CSM-RECONSTRUCTION-PLAN.md`: hybrid Path 2 (STL kit: CM+SM+LES+SLA — **provisionally** viable pending visual verification) + Path 3 (GLB top extraction for higher-detail CM), fall back to Path 4. Apollo-Soyuz explicitly forbidden.                           |
| Model semantic separability determined, unknowns have clear experiments                | ✅ Both GLBs inspected; neither has semantic part naming; Phase 3 split plan documented. STL kit fully enumerated (12 parts verified by inspect-stls.ts) with CSM-relevant parts identified.                                                                                     |
| `ACTUAL / DERIVED / INTERPOLATED / PLANNED / RECONSTRUCTED / SCHEMATIC` usage is clear | ✅ Documented in `AGENTS.md`, `EVENT-VERIFICATION.md`, `EVENT-VERIFICATION-A3.md`, `MODEL-INSPECTION-REPORT.md`, `CSM-RECONSTRUCTION-PLAN.md`, `CELESTIAL-TEXTURE-CANDIDATES.md`.                                                                                                |
| Git delivery is reproducible                                                           | ✅ `scripts/hydrate-assets.ts` downloads all gitignored binaries from canonical URLs with SHA-256 verification + ZIP extraction. Verified in clean `git archive` clone: all 8 gates pass after hydration.                                                                        |

## Phase 0 exit gate

**PASS** — all 8 release gates plus STL inspection pass in the current repository. The clean `git archive` hydration check was completed in remediation round 2; round 5 changes only tracked fixture, test, manifest, and audit text:

- `pnpm typecheck` exit 0
- `pnpm lint` exit 0
- `pnpm format:check` exit 0
- `pnpm test:unit` exit 0 (37 tests pass: 6 epoch + 5 cross-wiring + 26 Table 2-2/fixture)
- `pnpm validate:sources` exit 0 (0 errors, 0 warnings, 32 sources, 15 production HTML markers)
- `pnpm validate:mission` exit 0 (21/21 prerequisites)
- `pnpm validate:models` exit 0 (2 GLBs re-verified)
- `pnpm build` exit 0
- `pnpm inspect-stls` exit 0 (12 stlParts verified)

### Git commit structure

| Commit    | Type                        | Description                                                                      |
| --------- | --------------------------- | -------------------------------------------------------------------------------- |
| `8144452` | Remediation round 1         | Source freeze, event verification, model inspection, gates                       |
| `f00a0f9` | Report finalization round 1 | PHASE-0-REPORT updated with round 1 command outputs                              |
| `e23eee4` | Remediation round 2         | R-016 resolve, git reproducibility, STL fix, cross-wiring detection              |
| `0ef794e` | Remediation round 2         | .gitattributes for LF line endings                                               |
| `ad62ce6` | Remediation round 2         | .gitattributes binary file rules for hash preservation                           |
| `8d74061` | Remediation round 2         | Renormalize HTML snapshots for CRLF byte preservation                            |
| `01d1d3a` | Report finalization round 2 | PHASE-0-REPORT updated with round 2 command outputs and clean clone verification |
| `f39a515` | Remediation round 3         | Table 2-2 transcription corrections, real-validator tests, old wording cleanup   |
| `be940c1` | Remediation round 4         | Incorrect Table 2-2 classification; valid unique-marker, fixture, and CLI work   |
| (this)    | Remediation round 5         | Restore direct ACTUAL classification and correct fixture, tests, and audit chain |

Git: branch `master`, dirty status: clean (0 modified files).

## Next steps (Phase 1 — Mission Core)

Per spec §50, Phase 1 delivers:

- Time, epoch, event, source, unit, evidence, and state types in `src/mission-core/types/`.
- Narrative time mapping in `src/mission-core/narrative/`.
- Pure `stateAtMet` in `src/mission-core/state-machine/`.
- Schema and validation scripts in `src/mission-core/validation/`.
- Minimal fixture mission in `tests/fixtures/`.
- Unit tests in `tests/unit/`.

**Phase 1 may proceed after owner signs off on Phase 0** (per spec §48: "上一阶段验收通过后再继续").
