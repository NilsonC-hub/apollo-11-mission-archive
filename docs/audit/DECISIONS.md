# Phase 0 Decision Records

**Source**: `docs/audit/DECISIONS.md`
**Date**: 2026-07-13

Decision records logged during Phase 0. Spec Appendix B decisions (`ADR-001` through `ADR-010`) are reproduced verbatim from the spec for traceability; Phase 0 adds new decisions (`ADR-P0-001`+) as needed.

## Spec Appendix B decisions (reproduced)

| Decision ID | Decision                                            | Rationale                                            |
| ----------- | --------------------------------------------------- | ---------------------------------------------------- |
| `ADR-001`   | 建立独立 Apollo 项目，不直接改 Artemis              | 两个项目的火箭资产规则不同，并避免污染现有原型       |
| `ADR-002`   | 首版只做 Apollo 11，但 core 支持 mission packs      | 控制史料和模型范围，同时避免一次性架构               |
| `ADR-003`   | 顶层只有 Archive 与 Historical Replay               | 保持原型最强结构，Surface Ops 是阶段配置而非第三产品 |
| `ADR-004`   | 使用真实 MET + edited storyTime + local visualTime  | 防止压缩播放、事实时间与动画互相污染                 |
| `ADR-005`   | NASA Saturn V / LM 可视化资产先 inspection 后采用   | NASA 发布不自动等于单位、节点和任务构型完全正确      |
| `ADR-006`   | Apollo 11 CSM 必须重建/验证，拒绝 Apollo-Soyuz 替代 | 外形和任务构型错误会破坏项目最核心可信度             |
| `ADR-007`   | 无完整逐秒遥测时优先离散事件和有证据采样            | 可信度高于"满屏动起来"                               |
| `ADR-008`   | 历史声音默认关闭，不使用 AI 仿声/背景音乐           | 尊重史料、权限、可访问性和产品定位                   |
| `ADR-009`   | Archive 不加载 3D bundle                            | 保证档案阅读性能和渐进增强                           |
| `ADR-010`   | First step 保留来源秒级差异记录                     | 不用一个看似精确的数字掩盖官方资料差异               |

## Phase 0 decisions

### ADR-P0-001 — Use Internet Archive Wayback for stale ALSJ PDFs

**Date**: 2026-07-13
**Context**: Spec §8 lists 5 PDFs at `https://www.nasa.gov/wp-content/uploads/static/history/alsj/...` paths that return HTTP 404 as of 2026-07-13. They are:

- `a11-fltplan1.pdf` (Flight Plan)
- `a11transcript_tec.pdf` (Technical Air-to-Ground Transcript)
- `lm10handbookvol1.pdf` (LM-10 Handbook)
- `CSM06_Command_Module_Overview_pp39-52.pdf` (CSM News Reference CM section)
- `A11TechCrewDebrfV1_ALSJ.pdf` (Technical Crew Debriefing Vol 1)

**Decision**: Retrieve all 5 via Internet Archive Wayback Machine (`https://web.archive.org/web/2024/<original-url>`). Record both `originalUrl` (spec-listed, for traceability) and `effectiveDownloadUrl` (Wayback URL, for working retrieval) in the Source Manifest. Mark `status: "webarchived"`.

**Consequence**: Source Manifest has mixed retrieval paths. Phase 1+ validation scripts treat `webarchived` as a valid status, not an error. Future maintainers can re-fetch via Wayback if needed.

**Alternatives considered**: (a) skip these sources entirely — rejected, they are spec-required; (b) use `history.nasa.gov/alsj/...` — rejected, that host serves HTML wrappers for `.pdf` URLs (R-009); (c) replace with later editions — rejected, spec lists these specific editions for citation fidelity.

### ADR-P0-002 — Adopt 109:24:15 as canonical first-step MET

**Date**: 2026-07-13
**Context**: Per spec §A.2, multiple NASA sources give different second-level times for "first step":

- SP-4029 Apollo by the Numbers: `109:24:15.00` (per spec; not yet text-verified)
- SP-214 Preliminary Science Report: `109:24:19 g.e.t.` (camera-recorded, verified in extracted text)
- SP-214 same document: `109:24:20 g.e.t.` (crew quotation, verified in extracted text)
- ALSJ One Small Step: `109:24:15` initial contact; `109:24:18` and `109:24:20` in other releases

**Decision**: Adopt `109:24:15` (spec seed + SP-4029) as the canonical MET for `a11-first-step`. Tag precision as `source-rounded / timing varies by source`. Maintain this decision record listing all sources. UI Source Room must explain the discrepancy. Media-synced clip times use the media's own calibration.

**Consequence**: The event table has one canonical `a11-first-step` MET, but every UI surface that shows it must either show the precision tag or link to the Source Room explanation. Phase 2 must complete SP-4029 text extraction to fully verify the `109:24:15.00` citation.

**Alternatives considered**: (a) pick `109:24:19` from SP-214 — rejected, spec §A.2 explicitly names `109:24:15` as the seed; (b) show multiple events for "first step" — rejected, would confuse users; (c) defer the decision to Phase 2 — rejected, Phase 0 needs a canonical value to seed the event table.

### ADR-P0-003 — Phase 0 toolchain is Node-only (no Blender)

**Date**: 2026-07-13
**Context**: Phase 0 needs to inspect GLB models. Blender is the canonical tool for GLB inspection and processing, but adding Blender to the Phase 0 toolchain would expand the tooling surface significantly. `@gltf-transform` + `draco3d` via Node can inspect GLB node trees, bounds, triangle counts, materials, and textures.

**Decision**: Phase 0 uses Node-only tooling (`@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`, `draco3d`). The `scripts/inspect-glb.ts` script extracts all spec-§32-required inspection data.

**Consequence**: Phase 0 cannot do geometry editing, UV re-packing, or marking reconstruction. Phase 3 (Model & Celestial Asset Pipeline) must decide whether to add Blender or extend the `gltf-transform` pipeline. This is OPEN QUESTION 2 in `RISK-LOG.md`.

**Alternatives considered**: (a) install Blender for Phase 0 — rejected, would delay Phase 0 by hours and is not needed for inspection; (b) skip GLB inspection — rejected, spec §30 requires it.

### ADR-P0-004 — Bounded disk usage: defer large texture downloads to Phase 3

**Date**: 2026-07-13
**Context**: The CGI Moon Kit has many texture variants (1K/2K/4K/8K/16K color + DEM). Downloading all would consume gigabytes of disk and most are not needed until Phase 3. Similarly, the Blue Marble texture direct URLs are broken (R-002), so Phase 0 cannot download the primary Earth texture anyway.

**Decision**: Phase 0 downloads only:

- A 1K Moon color sample (`lroc_color_poles_1k.jpg`, 139 KiB) to verify color space and pole handling.
- The Apollo 11 Landing Site LROC image (203 KiB).
- The Apollo 11 Landing Site STL (7.1 MiB).
- AS11-44-6665 "View of the Moon" photograph (3.0 MiB).

Full-resolution Moon textures, Blue Marble texture, and full audio archive are deferred to Phase 3 / Phase 2 respectively.

**Consequence**: Phase 0 disk usage is bounded. The Source Manifest records the available variants and the deferred-download plan.

**Alternatives considered**: (a) download all Moon Kit variants in Phase 0 — rejected, excessive disk usage for unused assets; (b) skip texture archiving entirely — rejected, spec §34 requires documentation of available variants.

### ADR-P0-005 — Treat history.nasa.gov .pdf URLs as HTML wrappers, not PDFs

**Date**: 2026-07-13
**Context**: `https://history.nasa.gov/alsj/a11/<file>.pdf` returns HTTP 200 with `Content-Type: text/html` and a 282,661-byte HTML wrapper for any `.pdf` path. The server is routing PDF requests to a generic landing page.

**Decision**: Do not use `history.nasa.gov/...pdf` URLs as direct PDF sources. Use Internet Archive Wayback (per ADR-P0-001) for spec-listed PDFs that have rotted. Document this in R-009 so future maintainers do not waste time probing these paths.

**Consequence**: All working PDF retrievals go through Wayback. Source Manifest `effectiveDownloadUrl` reflects this.

**Alternatives considered**: (a) treat the HTML wrapper as the source — rejected, it is not the PDF content; (b) report this as a NASA IT bug — noted but not actionable by this project.

### ADR-P0-006 — CSM reconstruction strategy: parallel Paths 2 + 3, fall back to Path 4

**Date**: 2026-07-13
**Context**: Per spec §30.3 / ADR-006, no directly-attributable Apollo 11 CSM GLB is known. Phase 0 confirmed: NASA 3D Resources has no standalone Apollo 11 CSM GLB. Apollo-Soyuz GLB is forbidden and was not located anyway.

**Decision**: Phase 3 will attempt Path 2 (Saturn V printing kit STL parts) and Path 3 (extract CSM from top of Saturn V GLB) in parallel. If both fail, fall back to Path 4 (self-build a medium-detail Block II CSM from `NASA-CSM-NR` dimensions). The final CSM is always labelled `RECONSTRUCTED FROM NASA REFERENCES`.

**Consequence**: Phase 3 has a clear plan with two primary attempts and one fallback. The CSM reconstruction plan is documented in `docs/audit/CSM-RECONSTRUCTION-PLAN.md`.

**Alternatives considered**: (a) commit to Path 4 only — rejected, wasteful if Paths 2 or 3 yield usable geometry; (b) commit to Path 3 only — rejected, the STL kit may have better spacecraft separation; (c) use Apollo-Soyuz — explicitly forbidden by spec §30.4.

### ADR-P0-007 — Treat Saturn V and LM GLBs as generic, not AS-506 / LM-5 specific

**Date**: 2026-07-13
**Context**: Phase 0 inspection confirmed both NASA GLBs are generic Saturn V / Apollo LM, not AS-506 / LM-5 Eagle. They may lack mission-specific markings.

**Decision**: Treat both GLBs as base geometry. Phase 3 will verify against `NASA-A11-IMAGES` (launch photography for AS-506 markings) and `NASA-A11-ALSJ` (for LM-5 Eagle features). Any reconstructed markings will be labelled `RECONSTRUCTED` in the Asset Manifest.

**Consequence**: The final 3D models may show generic markings unless Phase 3 explicitly adds AS-506 / Eagle-specific decals. OPEN QUESTION 1 in `RISK-LOG.md` asks the owner how AS-506 / LM-5 accurate the final models must be.

**Alternatives considered**: (a) assume GLBs are AS-506 / LM-5 — rejected, not certified by NASA; (b) refuse to use the GLBs — rejected, they are the spec-named primary candidates.
