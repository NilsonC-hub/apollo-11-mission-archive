# Phase 7 Final Review Handoff

**Handoff date:** 2026-07-14  
**Repository:** `D:\apollo-11-mission-archive` only  
**Branch:** `master`  
**Implementation baseline before this handoff:** `331053da3e5a8f8fd860144f1487ea8719bbde2b`  
**Package version:** `0.0.0-phase7-dev`

## Reviewer posture

Phase 7 execution is complete as an audit, remediation, evidence, and release-decision work package.
Its truthful decision is still **Release Candidate NO-GO**. Do not reinterpret “Phase 7 complete” as a
release approval, version promotion, tag, push, or deployment authorization.

The final reviewer should assess whether the recorded evidence supports the negative decision and
whether the two remaining blocker classes are correctly described. The reviewer should not silently
downgrade either blocker to a warning.

## Scope and repository boundaries

- Work only in `D:\apollo-11-mission-archive`.
- `D:\artemis-mission-archive` was read only for provenance comparison and was not modified.
- No duplicate Apollo project was created in the projectless chat directory.
- No Phase 0–6 audit report was edited during Phase 7.
- No tag, push, deployment, or release was performed.
- No GLM or other model collaboration/subagent was used.

## Phase 7 commits to review

| Commit       | Purpose                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- |
| `1f21a3a`    | fixed-seed, low-density, static schematic star field with continuous truth labels         |
| `1b65767`    | removed the 4 px CRT scanline overlay without a pixel/noise/retro-filter replacement      |
| `8748d63`    | Phase 7 runtime corrections, audit suites, baselines, reports, notices, and NO-GO verdict |
| `331053d`    | Windows one-click production-preview launcher and README instructions                     |
| current HEAD | this final-review handoff                                                                 |

## Primary evidence package

- `docs/audit/PHASE-7-REPORT.md`
- `docs/audit/PHASE-7-PERFORMANCE.md`
- `docs/audit/PHASE-7-ACCESSIBILITY.md`
- `docs/audit/PHASE-7-RIGHTS-AND-PROVENANCE.md`
- `docs/audit/PHASE-7-VISUAL-REGRESSION.md`
- `docs/audit/PHASE-7-VISUAL-BASELINE.json`
- `docs/audit/MODEL-PROCESSING-NOTES.md`
- `LICENSE`
- `NOTICE`

The committed visual baseline contains 18 PNGs under `tests/browser/__screenshots__/`. Exact paths,
routes, dimensions, states, byte lengths, and SHA-256 values are recorded in the baseline JSON.

## Runtime corrections completed in Phase 7

1. `/control/event/:id` and `/control/met/:met` now initialize at verified MET and event/transcript
   selection updates the deep link.
2. Browser playback advances `storyTimeMs`; MET is derived through the authored narrative mapping.
3. Editorial pauses are explicit, require continue, and are not presented as operational holds.
4. Splashdown has a restrained, source-bound `MISSION COMPLETE` terminal state.
5. WebGL availability is checked before Canvas creation. The capability result is cached and the probe
   context is explicitly released, removing the context leak discovered during the audit.
6. Static fallback covers explicit fallback, unavailable WebGL, and failed model/texture/decoder
   requests while retaining readable mission data.
7. Renderer metrics are exposed through a read-only audit event/dataset for reproducible resource
   plateau and performance checks.
8. Contrast, skip-link/focus behavior, mobile target sizes, lazy Archive images, 1024 px overflow, and
   redundant wordmark labelling were corrected.
9. Persistent model truth labels state that the LM is a generic NASA visualization, not certified LM-5,
   and that the stage split is reconstructed.
10. The prohibited spectacle and filter boundaries remain intact: no close unrelated planet, nebula,
    fog, lens flare, flickering/drifting stars, telescope interaction, CRT scanline, pixel grid, noise,
    or retro filter.

## Reproducible release gates

The complete sequential Phase 7 release-gate run recorded in the report passed:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit` — 130 passed, 0 failed
- `pnpm test:integration` — 2 passed, 0 failed
- `pnpm validate:sources` — 0 errors, 0 warnings
- `pnpm validate:mission` — 37 published events, 70 facts, 24 precise event times still unavailable
- `pnpm validate:models`
- `pnpm validate:decoders` — nine Draco GLBs and six KTX2 files passed
- `pnpm inspect-stls` — 12 parts passed
- `pnpm build`
- `pnpm test:e2e` — 10 passed
- `pnpm test:visual` — 18 passed
- `pnpm perf:budget` — 5 passed
- four Lighthouse audits exited successfully

After the preview-launcher commit, `format:check`, lint, typecheck, the 130 unit tests, the two
integration tests, and a full production build were rerun successfully. The launcher itself passed a
build -> serve -> HTTP readiness -> cleanup cycle, and Playwright CLI verified `/archive` plus
`/control/event/a11-pdi-ignition` with zero console errors. The only browser warning was the already
recorded upstream `THREE.Clock` deprecation warning.

## Performance evidence to spot-check

- Final `MissionScene`: 1,000.28 kB minified / 275.77 kB gzip; the configured greater-than-900 kB
  warning remains.
- `ArchiveRoute`: 20.10 kB / 5.98 kB gzip.
- Archive cold route requested no Three, R3F, GLB, KTX2, Draco, or Basis asset.
- Archive cold shell readable: 463 ms; total transfer: 785,460 B.
- PDI Control cold deep link readable: 275 ms; interactive shell: 346 ms; model-visible proxy:
  1,135 ms; total transfer: 1,955,175 B.
- Renderer resources plateaued across ten cycles at 55 geometries, 7 materials, 10 textures, and
  6 programs, with one canvas and zero context loss.
- Conservative high-quality GPU upper bound: approximately 25.34 MiB.
- Headless-host FPS result: desktop average 118.51; mobile average 119.01.

Lighthouse evidence:

| Route / profile | Performance | Accessibility |      FCP |      LCP |      TBT | CLS |
| --------------- | ----------: | ------------: | -------: | -------: | -------: | --: |
| Archive desktop |          99 |           100 |   435 ms | 1,011 ms |     0 ms |   0 |
| Archive mobile  |          79 |           100 | 1,951 ms | 5,307 ms |     0 ms |   0 |
| Control desktop |          97 |           100 |   433 ms |   744 ms |   143 ms |   0 |
| Control mobile  |          83 |           100 | 1,910 ms | 3,515 ms | 291.5 ms |   0 |

The raw Lighthouse JSON is intentionally under ignored `output/playwright/phase7-audit/` rather than
committed as a release artifact.

## Accessibility evidence and limitation

- All four Lighthouse accessibility scores are 100.
- Six responsive viewports passed without root overflow: 320x568, 390x844, 768x1024, 1024x768,
  1280x720, and 1440x900.
- A DPR-2 720x450 CSS viewport check represented 200% equivalent physical scaling without root
  overflow and with the truth label visible.
- Reduced Motion, skip link/focus, and 44x44 minimum visible mobile controls passed.
- There was no physical NVDA, JAWS, or VoiceOver certification session. Do not claim one.

## Source, fact, model, and rights state

- Canonical source records: 34, each with URL, access date, local path, hash, and rights-status text.
- Mission-selected sources: 17.
- Facts: 70; published verified events: 37; mission phases: 13; narrative segments: 12.
- Available telemetry: one cited channel/sample. Three channels remain explicitly unavailable.
- Available historical audio clips: zero. Audio remains labelled unavailable.
- Saturn V and LM are NASA-released generic visualization models, not certified flight CAD.
- CSM is references-based `RECONSTRUCTED`, not NASA CAD and not certified CSM-107 geometry.

### Rights blocker — still open

The canonical manifest still does not claim final clearance for:

- `NASA-CSM-NR`, a NASA-hosted North American Rockwell news-reference excerpt; and
- `NASA-LM-HB`, a Grumman contractor handbook used as a generic schematic reference.

Post-report research found favorable but not dispositive evidence:

- Visual PDF review found no copyright notice in the local excerpts. The LM title page identifies
  NAS 9-1100, Grumman, and preparation under NASA direction.
- A NASA NTRS record for a closely related LM handbook volume in the same document series and under
  NAS 9-1100 is marked `Public` and `Work of the US Gov. Public Use Permitted`:
  `https://ntrs.nasa.gov/citations/19710071423`.
- The exact local LM Volume I was not found as its own NTRS citation, so the related record must not be
  silently treated as exact-item clearance.
- NASA's CSM News Reference page says the contributed copy lacked its original cover:
  `https://www.nasa.gov/wp-content/uploads/static/history/alsj/CSMNewsRef-Boothman.html`.
- NASA's current media guidelines say NASA content is generally usable but NASA-hosted third-party
  material may retain separate copyright:
  `https://www.nasa.gov/nasa-brand-center/images-and-media/`.

Recommended owner decision: distribute a clean release artifact that excludes both contractor PDF
byte streams and copied figures, replace their model-validation role with exact-item sources carrying
clear NASA/NTRS distribution metadata, and retain external citations plus independent-reconstruction
notes. Publishing this repository's complete Git history would still expose the PDF blobs in earlier
commits and therefore requires a separate owner/legal decision. No history rewrite is authorized.

### Visual matrix blocker — still open

The 18 committed baselines cover Production Spec section 45 and all ten Appendix C.9 event IDs at
1440x900. They do not cover the full event x viewport x low/high/failure x interaction cross-product.
The current product also has no authored guided-camera tween, so a camera-tween interruption baseline
cannot truthfully be produced without adding a new product feature.

Recommended owner decision: explicitly mark camera-tween interruption as not applicable to this
product, with an ADR/spec addendum, and generate the remaining applicable event, viewport, resource,
failure, backward-scrub, and re-entry matrix. Until that decision and evidence are complete, keep the
RC verdict at NO-GO.

## Artemis MIT attribution question

No attribution was removed in the final Phase 7 state.

A read-only provenance comparison covered 65 Artemis source/config files and Apollo production plus
prototype source. Git's 20% rename/copy heuristic found no copied or renamed source file. An exact
normalized-line scan found only one run of five or more matching nonblank lines: six lines of standard
Vite configuration in `vite.config.ts`. The Phase 0 reuse map also records that no file was copied
verbatim.

This evidence supports an owner decision that Artemis is design-history inspiration rather than a
software-license dependency, but the current Production Spec section 4.3 explicitly promises active
attribution. Removing it requires a new ADR/spec addendum and coordinated updates to active README,
NOTICE, Archive, and prototype wording. Do not rewrite historical Phase 0–6 reports. Relevant primary
sources:

- upstream MIT text: `https://raw.githubusercontent.com/redradman/artemis/master/LICENSE`;
- United States copyright subject-matter boundary: `https://www.copyright.gov/title17/92chap1.html`.

The evidence is an engineering provenance audit, not a legal opinion.

## One-click local preview

Windows users can double-click:

`D:\apollo-11-mission-archive\OPEN-APOLLO-11-PREVIEW.cmd`

The launcher checks Node 22+ and pnpm, installs the locked dependency set only when missing, builds the
current source, starts Vite production preview on `http://127.0.0.1:4173/archive`, waits for a valid
Apollo response, and then opens the default browser. `pnpm preview:open` is equivalent. Directly
opening `dist/index.html` with `file://` is unsupported because BrowserRouter and root-relative assets
require HTTP serving.

No preview server or owned browser session should be running when this handoff is reviewed.

## Known material gaps that are not silently closed

1. The two release-blocker classes above.
2. Archive mobile LCP of 5.307 seconds in the recorded Lighthouse profile.
3. The greater-than-900 kB minified MissionScene warning.
4. The upstream `THREE.Clock` deprecation warning.
5. No historical audio playback because verified local bytes/alignment are unavailable.
6. Twenty-four precise event times and three telemetry channels remain unavailable by design.
7. No physical assistive-technology certification session.

## Final reviewer checklist

1. Read `AGENTS.md` and the complete `docs/APOLLO_11_PRODUCTION_SPEC.md` before judging the build.
2. Confirm branch, HEAD, and a clean worktree.
3. Verify that Phase 0–6 reports and `D:\artemis-mission-archive` remain untouched.
4. Reproduce the required gates in proportion to review scope; do not infer success from this handoff
   alone.
5. Cross-check the reports, committed baseline manifest, model truth labels, and current runtime.
6. Confirm that Archive remains free of Three/R3F/model/texture/decoder requests.
7. Confirm that the two blocker classes remain visible and that the package version remains
   `0.0.0-phase7-dev`.
8. Report Phase 7 as an evidence-complete audit with a negative RC decision unless the owner later
   authorizes and completes the documented blocker-resolution work.
