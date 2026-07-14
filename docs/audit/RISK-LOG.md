# Phase 0 Risk Log & Open Questions

**Phase**: 0 (remediation)
**Source**: `docs/audit/RISK-LOG.md`
**Date**: 2026-07-13 (remediation)
**Spec reference**: §48 (Phase 0 must record risks, unknowns, decisions); §60 (conditions requiring halt)

## Risks (ordered by severity)

### R-001 — SVS GSFC TLS certificate expired (HIGH)

**Symptom**: `curl https://svs.gsfc.nasa.gov/4720` fails with `SEC_E_CERT_EXPIRED`. Workaround is `curl -k` (insecure).

**Impact**: The CGI Moon Kit (NASA-MOON-CGI-KIT) is the primary source for Moon color + DEM textures. Phase 3 must download full-resolution variants (2K/4K/8K TIF, DEM TIFs). If the cert expiry persists, downloads will require `-k`, which is insecure for production asset pipelines.

**Likelihood**: Unknown — cert expiry observed 2026-07-13; could be transient (NASA IT rotation) or persistent.

**Mitigation**: Phase 3 must (a) re-probe cert status before fetching, (b) if persistent, use Internet Archive Wayback or escalate to NASA SVS contact, (c) record each variant's SHA-256 for integrity verification regardless of TLS.

**Status**: OPEN.

### R-002 — Blue Marble direct image URLs return 404 (HIGH)

**Symptom**: `eoimages.gsfc.nasa.gov/images/imagerecords/57/57723/land_ocean_ice_cloud_2048.jpg` and three other variants all return HTTP 404 as of 2026-07-13. The Visible Earth landing page itself loads.

**Impact**: The primary Earth texture cannot be downloaded from its canonical URL. Phase 3 needs a working 2K / 4K / 8K equirectangular Earth texture for orbit/TLI/TEI scenes.

**Likelihood**: Persistent (broken since at least the page rebuild; the URLs are referenced in older tutorials but no longer resolve).

**Mitigation**: Phase 3 must (a) try Internet Archive Wayback for the original URLs, (b) try NASA SVS Blue Mirror variants, (c) try "Blue Marble: Next Generation" referenced in the page sidebar, (d) if all fail, use a NASA-affiliated public-domain mirror with documented rights.

**Status**: OPEN.

### R-003 — Saturn V GLB has no semantic part naming (HIGH)

**Symptom**: NASA-MODEL-SATV.glb is a single-geometry model with 22 child nodes under root `saturnv_ca`. All child names are Maya defaults (`pCone`, `pCube`, `pCylinder`, `polySurface`, `group<N>`). No node is named S-IC, S-II, S-IVB, IU, SLA, CSM, or LES.

**Impact**: Per spec §31, the runtime renderer must use stable semantic IDs. The NASA GLB cannot be loaded directly; Phase 3 must perform offline semantic split.

**Likelihood**: Confirmed (Phase 0 inspection).

**Mitigation**: Phase 3 must define a documented split recipe (Blender script or `gltf-transform` pipeline) that partitions the geometry by Y-height ranges using documented Saturn V stage lengths from `NASA-A11-MR` and `NASA-CSM-NR`. The recipe must be committed to `scripts/optimize-models.ts` (or sibling), and the output GLBs must use the spec §31 semantic node names. Mark all derived geometry `RECONSTRUCTED` where appropriate.

**Status**: OPEN — Phase 3 work.

### R-004 — Lunar Module GLB has no semantic part naming (HIGH)

**Symptom**: Same as R-003 but for NASA-MODEL-LM.glb. 135 child nodes, all Maya defaults. No node named `ascent`, `descent`, `stage`, or any semantic label.

**Impact**: Phase 3 must split the LM into ascent stage + descent stage + accessories.

**Likelihood**: Confirmed.

**Mitigation**: Phase 3 must (a) decode Draco, (b) split by Y-height (bounds suggest split near Y ≈ 2.5), (c) verify against `NASA-LM-HB` and `NASA-A11-ALSJ` for LM-5 Eagle-specific features, (d) commit the recipe to `scripts/optimize-models.ts`, (e) label as `RECONSTRUCTED` where markings or details are added.

**Status**: OPEN — Phase 3 work.

### R-005 — Neither GLB is at real-world meter scale (MEDIUM)

**Symptom**: Saturn V GLB scene height = 12.987 units (actual Saturn V ≈ 110.6 m); LM GLB scene height = 5.013 units (actual LM ≈ 7 m).

**Impact**: Models cannot be used at native scale. Phase 3 normalization must scale both. The Node Manifest must record the scale factor in `normalization.scale`.

**Likelihood**: Confirmed.

**Mitigation**: Phase 3 records `scale: 8.52` (Saturn V) and `scale: 1.396` (LM) in the Node Manifests, with source dimensions from `NASA-A11-MR` and `NASA-LM-HB`. Verify the scaled bounds match real-world expectations.

**Status**: OPEN — Phase 3 work.

### R-006 — Both GLBs ship embedded animations that must be stripped (LOW)

**Symptom**: Saturn V has 23 embedded animations; LM has 135.

**Impact**: These are NASA visualization deployment/rollout sequences, not mission-event animations. They must not be used as-is because they are not driven by the MET event state machine.

**Mitigation**: Phase 3 strips embedded animations during the optimize-models pipeline. Mission events drive the state machine, not embedded clips.

**Status**: OPEN — Phase 3 work.

### R-007 — NASA GLBs are generic, not AS-506 / LM-5 specific (MEDIUM)

**Symptom**: The Saturn V GLB is a generic Saturn V; the LM GLB is a generic Apollo LM. Neither is labelled as AS-506 or LM-5 Eagle.

**Impact**: The final product must be recognizably Apollo 11 (spec §2 success criterion). Generic Saturn V / LM models may lack mission-specific markings (AS-506, American flag, Eagle plaque, "USA" stencil).

**Mitigation**: Phase 3 must verify against `NASA-A11-IMAGES` launch photography (for AS-506 markings) and `NASA-A11-ALSJ` (for LM-5 Eagle-specific features). Any reconstructed markings must be labelled `RECONSTRUCTED` in the Asset Manifest.

**OPEN QUESTION for owner**: how AS-506 / LM-5 accurate must the final models be — generic acceptable, or must the models be visibly AS-506 / Eagle?

**Status**: OPEN.

### R-008 — Several NASA / ALSJ PDFs are no longer at spec-listed URLs (MEDIUM)

**Symptom**: Spec §8 lists 5 PDFs at `https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/...` paths that return HTTP 404 as of 2026-07-13:

- `a11-fltplan1.pdf` (Flight Plan part 1)
- `a11transcript_tec.pdf` (Technical Air-to-Ground Transcript)
- `lm10handbookvol1.pdf` (LM-10 Handbook)
- `CSM06_Command_Module_Overview_pp39-52.pdf` (CSM News Reference CM section)
- `A11TechCrewDebrfV1_ALSJ.pdf` (Technical Crew Debriefing Vol 1)

**Impact**: Spec-listed URLs are stale. Source Manifest must record both the spec-listed `originalUrl` (for traceability to the spec) and the `effectiveDownloadUrl` (the working retrieval path).

**Mitigation**: All 5 PDFs were retrieved via Internet Archive Wayback Machine and are archived in `assets/raw/` with SHA-256. The Source Manifest records `status: "webarchived"` and the Wayback URL for each. Future Phase 1+ work must treat the Wayback copy as the working source, with the spec URL retained for traceability.

**Status**: RESOLVED (Wayback fallback used) but the underlying URL rot is a continuing risk — Phase 2 should archive any additional ALSJ-hosted PDFs it discovers via Wayback as a preventive measure.

### R-009 — history.nasa.gov serves HTML wrapper for .pdf URLs (LOW)

**Symptom**: `https://history.nasa.gov/alsj/a11/a11final-fltpln.pdf` returns HTTP 200 but with `Content-Type: text/html` and identical 282,661-byte HTML wrapper for any `.pdf` path. The server is routing PDF requests to a generic landing page.

**Impact**: Cannot use `history.nasa.gov` as a direct PDF source. Wayback is the working alternative.

**Mitigation**: Already mitigated by R-008's Wayback fallback. Recorded here so future maintainers do not waste time probing `history.nasa.gov` paths.

**Status**: NOTED.

### R-010 — First-step timing discrepancy (LOW, but spec-critical) — RESOLVED

**Symptom**: NASA SP-214 Apollo 11 Preliminary Science Report gives "first step" as both `109:24:19 g.e.t.` (camera-recorded) and `109:24:20 g.e.t.` (crew quotation) in the same document. NASA SP-4029 Apollo by the Numbers gives `109:24:15.00` per spec §A.2. ALSJ One Small Step page gives `109:24:15` initial contact with `109:24:18` and `109:24:20` in other releases.

**Impact**: Cannot pick one canonical "first step" MET without acknowledging the discrepancy. The spec §A.2 forbids silently smoothing it.

**Mitigation**: Phase 0 decision (per spec §A.2 / §60):

- Adopt `109:24:15` as the canonical MET for `a11-first-step` in the event table.
- Tag precision as `source-rounded / timing varies by source`.
- Maintain `ADR-P0-002` in `docs/audit/DECISIONS.md` listing all sources and second-level values.
- UI Source Room must explain the discrepancy.
- Media-synced clip times use the media's own calibration, not the canonical MET.

**Remediation**: SP-4029 `109:24:15.00` page-level verification COMPLETE. PyMuPDF (fitz) extracted text from `NASA-APOLLO-NUMBERS.pdf` (sha256 `2b8051684d39e0e8dfd914320908e3d67b3729b68ffc17d5ee96449fdeeb18af`). Two independent citations found:

- PDF page 104 (narrative): "The commander's left foot made first contact with the lunar surface at 02:56:15 GMT on 21 July (22:56:15 EDT on 20 July) at 109:24:15."
- PDF page 118 (Apollo 11 Timeline table): "1st step taken on lunar surface (CDR)... 109:24:15.00 02:56:15 21 Jul 1969"

Extraction recorded in `docs/audit/SP4029-extraction.txt`. Printed-page labels in SP-4029 use chapter-prefixed numbering (e.g. "11-N") and were not found on PDF pages 104/118 specifically — the labels may be on adjacent pages or rendered as image. Phase 2 must locate exact printed-page labels if required for citation fidelity. PDF page numbers (104, 118) are sufficient for Phase 0 verification.

**Status**: RESOLVED — canonical MET adopted, SP-4029 page-level verification complete, discrepancy documented in `ADR-P0-002` and `EVENT-VERIFICATION.md`.

### R-011 — Windows PowerShell Invoke-WebRequest fails for HTTPS (MEDIUM, environmental)

**Symptom**: `Invoke-WebRequest` fails for all HTTPS URLs in the host environment with a PowerShell firewall-mode error. `curl.exe` (Windows-bundled, 8.19.0) works correctly.

**Impact**: Phase 0 worked around this by using `curl.exe` exclusively. Phase 1+ scripts that need HTTP should use `curl.exe` or Node's `fetch` / `https` module, not PowerShell cmdlets.

**Mitigation**: Documented here for future maintainers. All Phase 0 download commands use `curl.exe` and are recorded in `docs/audit/PHASE-0-REPORT.md` and the Source Manifest `notes` fields.

**Status**: NOTED — workaround in place.

### R-012 — SP-4029 text not extractable in Phase 0 (LOW) — RESOLVED

**Symptom**: `NASA-APOLLO-NUMBERS` (SP-4029) PDF is archived (35.6 MiB, sha256 recorded) but its text could not be extracted in the original Phase 0 release because the toolchain had no PDF text-extraction tool.

**Impact**: Could not complete the second-source verification of the `109:24:15.00` "first step" citation.

**Mitigation (remediation)**: PyMuPDF (fitz 1.28.0) was available on the host Python 3.13 installation. Extraction script `E:\系统缓存\opencode\extract_sp4029.py` located `109:24:15` on PDF pages 104 and 118 of SP-4029. Full extraction recorded in `docs/audit/SP4029-extraction.txt`.

**Status**: RESOLVED — SP-4029 page-level verification complete. See R-010 for details.

### R-013 — NTRS 19690026499 (Post-launch Operational Trajectory) — RESOLVED

**Symptom**: The original Phase 0 release could not resolve the direct PDF download URL for NTRS record 19690026499 and incorrectly recorded the source as `kind=web` with `localPath` pointing at the NASA-A11-MR NTRS HTML page (cross-wired to the Mission Report's landing-page snapshot).

**Impact**: The Source Manifest had a cross-wired entry — `NASA-A11-POSTTRAJ` pointed at a file belonging to `NASA-A11-MR`. The source validator did not catch this because it only checked "file exists + hash matches", not "file content matches declared kind".

**Mitigation (remediation)**:

1. The NTRS API pattern `/api/citations/{id}/downloads/{id}.pdf` works for record 19690026499. The actual PDF is now downloaded: `assets/raw/NASA-A11-POSTTRAJ.pdf` (8,004,579 bytes, sha256 `55b94c5947c91a3cd0539601517c82941a04ec9631dbb90458275664b855a7b3`).
2. Source Manifest entry corrected: `kind=pdf`, `localPath=assets/raw/NASA-A11-POSTTRAJ.pdf`, `status=downloaded`, with `effectiveDownloadUrl` and `landingPageUrl` recorded.
3. `validate-sources.ts` upgraded to detect cross-wiring: it now checks file extensions against declared `kind`, verifies magic-byte signatures (PDF / GLB / ZIP / JPG / PNG), and tracks every `localPath` across all sources to detect when two source IDs point to the same file.

**Status**: RESOLVED — correct PDF archived, manifest fixed, validator upgraded to prevent recurrence.

### R-014 — Audio archive not enumerated (LOW, deferred per spec)

**Symptom**: `NASA-A11-AUDIO` landing page is a frameset stub (1,479 bytes). It references an `a11.html` sub-page and one mp3 clip (`ap11_07a__landing_dsea.mp3`). Full channel audio enumeration not done in Phase 0.

**Impact**: Phase 2 must enumerate the full Apollo 11 air-to-ground audio channel list and identify rights-cleared clips for the historical audio feature. Spec §27 requires per-clip metadata: `sourceUrl`, `sourceChannel`, `speaker`, `metStart`, `metEnd`, `originalFilename`, `sha256`, `transcriptSource`, `rightsStatus`, `processingNote`.

**Mitigation**: Phase 2 work. The archive.org mirror at `https://www.archive.org/details/Apollo11Audio` is referenced in the ALSJ page and may host full channel audio — verify it is the same public-domain NASA source.

**Status**: OPEN — Phase 2 work (per spec §3.1 includes "少量经过权利核查的原始音频片段" in MVP, so Phase 2 must scope which clips are in MVP).

### R-015 — ALSJ / AFJ editorial content rights status (MEDIUM)

**Symptom**: ALSJ and AFJ pages are hosted on NASA domains but contain editorial contributions by Eric Jones, Frank O'Brien, and others. Per spec §8 note, "ALSJ/AFJ 页面包含编辑、校注或第三方贡献内容时，不能因为页面位于 NASA 域名就默认全部为 public domain."

**Impact**: Citations from ALSJ / AFJ must distinguish between (a) raw NASA transcript/imagery (public domain) and (b) editorial commentary (third-party, subject to ALSJ project terms). The Source Manifest records this distinction per source, but per-citation care is needed in Phase 2.

**Mitigation**: Phase 2 must, for every ALSJ / AFJ citation, identify whether the cited text is a NASA original or an editorial annotation. Editorial annotations must cite the editor by name and reference the ALSJ project terms.

**Status**: NOTED — Phase 2 work.

### R-016 — Apollo 11 launch vehicle flight evaluation report — RESOLVED

**Symptom**: The S-IC/S-II and S-II/S-IVB physical-separation METs are most authoritatively recorded in the Apollo 11 launch vehicle flight evaluation report (MPR-SAT-FE-69-9 / NASA-TM-X-62558 / NTRS 19900066485). This report was NOT in the spec §8 Source Manifest and was not archived in the original Phase 0 release.

**Impact (original)**: The A.3 Event IDs `a11-sic-sii-separation` and `a11-sii-sivb-separation` were `QUALITATIVE-ONLY` — the Mission Report body §4 references staging qualitatively but the precise separation METs require the launch vehicle flight evaluation report.

**Remediation (round 2)**: The report has been archived and the separation METs verified:

1. **NTRS record 19900066485**: de-indexed as of 2026-07-13. API returns 404. Citation page serves SPA shell only ("Page not found"). Old archive URL serves HTML wrapper, not PDF. NTRS search for "MPR-SAT-FE-69-9" and "NASA-TM-X-62558": 0 results.
2. **Wayback Machine**: CDX query found 10 snapshots of the old NTRS archive URL (2015-2017), but ALL are text/html HTML wrappers (5-6 KB). The actual PDF binary was never captured.
3. **Archive.org**: advancedsearch.php found the item `saturn-v-launch-vehicle-flight-evaluation-report-as-506`. PDF downloaded from `https://ia802806.us.archive.org/24/items/...` — 11,581,879 bytes, SHA-256 `feb84bc2f6d761cc0996faf7ca74d449d83beb885b8ec67d4892f57e4ed0d212`. Title page confirms MPR-SAT-FE-69-9, NASA-TM-X-62558, AS-506, Apollo 11, Marshall Space Flight Center.
4. **Provenance grade**: MIRROR — not NTRS-direct, but archive.org copy is a faithful reproduction of the original NASA technical memorandum. Content is U.S. government work, public domain.
5. **Separation METs verified** via PyMuPDF extraction:
   - S-IC/S-II separation: **162.3 sec** (direct ACTUAL in Table 2-2 Event 27 and Table 4-3; TFB cross-check: 161.6+0.7=162.3)
   - S-II/S-IVB separation: **549.0 sec** (direct ACTUAL in Table 2-2 Event 46 and Table 4-3; TFB cross-check: 548.2+0.8=549.0)
   - Section 12.2 confirms S-IC/S-II separation was "accomplished as planned" with "clean severance"
   - Section 12.3 confirms S-II/S-IVB separation was "nominal"
   - Cross-check with Mission Report Table 3-I: OECO 161.7s (MR) vs 161.63s (SATV-FE) — delta 0.07s; S-II cutoff 548.3s (MR) vs 548.22s (SATV-FE) — delta 0.08s. Consistent.

**Status**: RESOLVED — PDF archived, separation METs verified, A.3 Event IDs updated to MET-CONFIRMED. See `docs/audit/SATV-FE-SEPARATION-VERIFICATION.txt` for full extraction.

## Open questions (owner input needed)

These are questions that Phase 0 cannot answer alone and require owner input before Phase 1/3 work can finalize:

1. **AS-506 / LM-5 marking fidelity** (R-007): how accurate must the final 3D models be to AS-506 and LM-5 Eagle specifically? Generic Saturn V / LM acceptable, or must the models show mission-specific markings (American flag, "USA" stencil, Eagle plaque, AS-506 mission insignia)?
2. **Blender availability for Phase 3** (MODEL-INSPECTION-REPORT): is Blender installed on the build host, or should Phase 3 plan for `gltf-transform`-only? Blender would help with high-quality LOD, UV re-packing, and marking reconstruction.
3. **Phase 2 audio scope**: which specific Apollo 11 audio clips are MVP-required? Spec §3.1 says "少量经过权利核查的原始音频片段" — recommend: liftoff, touchdown exchange, first step, lunar liftoff, splashdown. Owner confirmation needed.
4. **Blue Marble variant preference**: 2002 original, "Next Generation" (2007), or a more recent NASA composite? Recommendation: 2002 original for day map.
5. **CSM self-build acceptability** (ADR-006 Path 4): if Paths 2 and 3 both fail, is self-building a medium-detail Block II CSM acceptable, or should the project search additional NASA centers (Marshall history office, Smithsonian 3D)?

## Spec §60 halt conditions — none triggered

Per spec §60, the following conditions would have required a halt and owner escalation:

- Two high-authority sources conflict on the same actual value, unexplained → **NOT TRIGGERED**: first-step discrepancy is documented in spec §A.2 and is anticipated; Phase 0 decision recorded.
- Asset rights status unclear with no safe official alternative → **NOT TRIGGERED**: all archived assets are NASA public-domain or NASA-contractor (rights status recorded per source).
- NASA model structure requires irreversible large-scale reconstruction → **NOT TRIGGERED**: semantic split is reversible (geometry is partitioned, not destroyed). Original GLBs preserved in `assets/raw/`.
- Requirement change would break spec non-goals → **NOT TRIGGERED**.
- Modify reference Artemis repo → **NOT TRIGGERED**: Artemis repo untouched.
- Need new external account / paid resource / publish permission → **NOT TRIGGERED**.

Phase 0 may proceed to exit gate.
