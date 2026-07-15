# Finalization Sprint 2 — Archive Media Checkpoint Report

Status: implementation complete; owner visual acceptance pending

Branch: `finalization/sprint2-archive-media`

Accepted base: `4e22a9b6a1f9f76145f82d828b87f96464b050f2`

## Delivered scope

This branch delivers only the Archive half of Finalization Sprint 2 checkpoint 1. It does not edit
Control playback, `MissionScene`, the mission store, shared global CSS, or the Control-side inspector.

Scoped commits:

| Commit                                     | Intent                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a5393557c1f9bf46cfde87cb8f25fe51568eac59` | Commit the implementation-ready Sprint 2 checkpoint handoff.                                                                                      |
| `311e0a2b32334502f60a89d31afaa776388bcebf` | Freeze the reusable Archive evidence-media schema.                                                                                                |
| `7144ce68ddad7bd2da3ffe544257a2de732751a8` | Add schema and traceability failure-path tests.                                                                                                   |
| `d79e30e93a5a2ee8404d0a70b216256250dc55f7` | Add verified NASA originals, responsive derivatives, the document plate, manifests, and reproducible processing.                                  |
| `301961abf39ac746ec95a515f37c0bde675608e0` | Compose the Mission Index and Saturn V evidence dossier, accessible metadata surfaces, responsive behavior, and Archive browser acceptance tests. |
| `ed1c7cd3db93f1a0e3659f0a1d58e810c823e3d1` | Bind displayed media facts and processing output to canonical evidence; prove the production Archive bundle closure remains 3D-free.              |

## Evidence selection and provenance

| Project record                | Canonical source     | Subject                                                      |   Accessed | Effective source                                                                                               |
| ----------------------------- | -------------------- | ------------------------------------------------------------ | ---------: | -------------------------------------------------------------------------------------------------------------- |
| `a11-s69-38660`               | `NASA-A11-S69-38660` | Saturn V AS-506 on Pad 39A, 1969-07-01                       | 2026-07-15 | [NASA-hosted 38660 scan](https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/kippsphotos/38660.jpg) |
| `a11-s69-39525`               | `NASA-A11-S69-39525` | Ground launch perspective, 1969-07-16                        | 2026-07-15 | [NASA Images original](https://images-assets.nasa.gov/image/s69-39525/s69-39525~orig.jpg)                      |
| `a11-s69-39961`               | `NASA-A11-S69-39961` | Launch-tower-camera perspective, 1969-07-16                  | 2026-07-15 | [NASA Images original](https://images-assets.nasa.gov/image/S69-39961/S69-39961~orig.jpg)                      |
| `a11-mission-report-p334-a10` | `NASA-A11-MR`        | Mission Report Appendix A §A.5, PDF p. 334 / printed p. A-10 | 2026-07-13 | [NASA NTRS PDF](https://ntrs.nasa.gov/api/citations/19700008096/downloads/19700008096.pdf)                     |

No capture MET or camera body/lens was inferred. `S69-39961` states only the source-supported
launch-tower-camera context and explicitly says that the camera body and lens are not identified in
NASA metadata. The `S69-38660` record discloses that the accessible NASA-hosted scan is credited to
Kipp Teague; it does not present that 800 × 663 file as an original archival-resolution scan.

All records expose project ID, source ID, subject tags, original/effective URLs, source/access date,
dimensions, bytes, format, local path, SHA-256, alt text, rights/credit status, processing note, and
every delivery variant inside keyboard-accessible native `details` elements. Document metadata also
exposes its PDF/printed locator and source/rendered-page evidence.

## Exact archival and derived files

| Record                        | File role                |     Dimensions |      Bytes | SHA-256                                                            |
| ----------------------------- | ------------------------ | -------------: | ---------: | ------------------------------------------------------------------ |
| `a11-s69-38660`               | raw JPEG                 |      800 × 663 |    150,373 | `c85615b525b909e7ea405be4772bad0da5940cbed1ec299735ff191800cdabe9` |
| `a11-s69-39525`               | raw JPEG                 | 6,896 × 15,853 | 12,895,141 | `e8f3f5c220ba1146f51e43b9944a79dc2d30c9db262cd973a36b18387ab5d45a` |
| `a11-s69-39961`               | raw JPEG                 |  2,797 × 4,038 |  2,142,044 | `15fedded2f4c0be7347cc1820592a04cb87a2b319653922574ec6c21cc9f0b2d` |
| `a11-mission-report-p334-a10` | rendered source page PNG |  1,382 × 1,969 |    490,553 | `ffbb7ce28f0ef7d0a8fa85b260ce5e5c9f771013cfee3da8d365f1019ead8c76` |
| `NASA-A11-MR.pdf`             | source PDF               |            n/a | 15,973,944 | `3314d99654ebb2ac3e3ef0ab70a84be9519a5f071cf1362118b2b20a6f161dea` |

The rendered document PNG is tracked for a fresh clone despite the broader derived-assets ignore
policy. The three historical originals remain under `assets/raw/images/`.

### Runtime delivery variants

| Public file                            |    Dimensions |   Bytes | SHA-256                                                            |
| -------------------------------------- | ------------: | ------: | ------------------------------------------------------------------ |
| `a11-s69-38660-480.webp`               |     480 × 398 |  35,920 | `c15af8ce9475c726ff3465d5c8cf39b2156c71b5e769aa35e5462e318ee0b23a` |
| `a11-s69-38660-800.webp`               |     800 × 663 |  95,470 | `f1a96722693a3a638a3f49c0609821d249f5f47ee922f8deb74c91b6aca1e13c` |
| `a11-s69-38660-800.jpg`                |     800 × 663 | 136,353 | `bd5ca4cc9627c0666bbe0556a6f5b8e2c9c5abc9183118abfba4e451318a7a5c` |
| `a11-s69-39525-480.webp`               |   480 × 1,103 |  28,536 | `5c6b356e5369b460410e61d4848125e09ec04336a4e40d9a2449841e7d88ec73` |
| `a11-s69-39525-960.webp`               |   960 × 2,207 |  83,804 | `a44ab09a5eba9a31221a60582278680edc7b89f9e67b14b74e9a3fc03ac765d3` |
| `a11-s69-39525-1440.webp`              | 1,440 × 3,310 | 173,484 | `d28b6f89e9506be87e922a6b372aa90792d4c5aab463687288c6b861e1b4a3ce` |
| `a11-s69-39525-1440.jpg`               | 1,440 × 3,310 | 512,240 | `bcd9712e860d58033e687e570e7c73880dfc2ee142a7d7544a6af9f6f12d34f6` |
| `a11-s69-39961-480.webp`               |     480 × 693 |  64,482 | `bdbf1227d8ae0ed1c880f6ac57a949760550d3a418aa28c9e221685907c0dc47` |
| `a11-s69-39961-960.webp`               |   960 × 1,386 | 177,848 | `8d0bae1a839798c4dcf5b59815278953a0623b6c09ef76073c460673195a1988` |
| `a11-s69-39961-1440.webp`              | 1,440 × 2,079 | 381,382 | `c70193df9e1ee8ee0d3d6674a481c61ce1b1e488cbfeb9bc9ec7e5403f5a8cef` |
| `a11-s69-39961-1440.jpg`               | 1,440 × 2,079 | 605,516 | `0d1d347a54989b550ab043ae15a573b079a818a574aab376ee975a6688cc9495` |
| `a11-mission-report-p334-a10-480.webp` |     480 × 684 |  54,618 | `e67858c71780a698bea57b302a4194d9538a1c5a82f8ff34e69a47c427fc17c4` |
| `a11-mission-report-p334-a10-960.webp` |   960 × 1,368 | 142,892 | `2f557e60c0775835eb2ee384fb30c897b55947513c4944148946486bff4f5d95` |
| `a11-mission-report-p334-a10-960.jpg`  |   960 × 1,368 | 236,375 | `192ba5200ada44e2e9d772a9b1ec0c619b3ad7b21691bcc36d2a8a0d1dfa760e` |

Processing is reproducible through `scripts/prepare-archive-media.py`. The pinned policy is full
frame/full PDF page, no crop, no color or tonal adjustment, Lanczos downsample only, no upscaling,
responsive WebP, and a local JPEG fallback. `pnpm validate:archive-media` now cross-checks record IDs,
input/output paths, hashes, bytes, dimensions, formats, delivery variants, document locator, and
processing recipe against `SPRINT-2-ARCHIVE-MEDIA-PROCESSING.json` as well as the canonical source
manifest and on-disk bytes. Displayed NASA image ID, rights, source/capture date, raw dimensions, and
normalized format are also bound to the canonical source manifest. An in-memory Vite production
build recursively checks the Archive chunk's static import closure and fails on Control/Three/R3F
modules, dynamic imports, model/texture assets, or decoder assets without writing to `dist`.

## Archive composition and behavior

- Mission Index uses `S69-38660` as the eager, high-priority responsive Hero while preserving the
  full 800 × 663 aspect ratio.
- Saturn V pairs `S69-39961` with the existing static model-processing plate and semantic component
  ledger. The UI says `source-bound component identity · reconstructed model geometry`; it does not
  claim actual engineering geometry or NASA CAD.
- A second pair presents `S69-39525` beside Mission Report page A-10.
- The static model record derives source IDs, truth label, Node Manifest, processing recipe, runtime
  record, thumbnail, and external citations from the canonical asset/source manifests.
- `OPEN SATURN V INSPECTOR` links to `/control/inspect/saturn-v`. Archive imports no Three/R3F runtime
  and never requests GLB, KTX2, Draco, Basis, or `MissionScene` assets.
- Legacy `/archive/saturn`, `/archive#saturn`, exact `/archive/saturn/#saturn`, and the new
  `/archive/saturn/#saturn-v` return anchor all resolve. Malformed percent-encoded hashes cannot
  crash the route.
- At 320 and 390 CSS px, image, model, and document details are expanded during browser acceptance;
  long hashes, paths, URLs, and source links wrap without root overflow. All reachable links and
  summaries remain at least 44 CSS px tall.
- New labels/metadata are at least 12 px. At 320/390, new Archive body/caption/model explanatory text
  is at least 16 px. Inspector, disclosure, and record links retain explicit visible 2 px keyboard
  focus outlines.
- The four broad Archive Phase 7 visual baseline PNGs are intentionally unchanged. Per the sprint handoff,
  they must not be regenerated until the owner accepts the checkpoint visuals.

## Local performance and layout evidence

All values in this section are local Chromium/localhost laboratory diagnostics on the implementation
host. They are not field measurements, throttled Lighthouse results, or guarantees for physical
devices and networks.

| Measurement                |    Result | Scope                                                                                     |
| -------------------------- | --------: | ----------------------------------------------------------------------------------------- |
| Hero encoded body          |  95,470 B | Selected `a11-s69-38660-800.webp` on the tested desktop viewport.                         |
| Archive resource transfer  | 240,345 B | `PerformanceResourceTiming` resources only; excludes navigation HTML.                     |
| Archive JS encoded body    | 132,664 B | Cold Archive resource entries ending in `.js`.                                            |
| Archive CSS encoded body   |   8,911 B | Cold Archive resource entries ending in `.css`.                                           |
| Shell readable             |    406 ms | Wall-clock navigation start to the `APOLLO 11` heading in the focused Phase 7 test.       |
| LCP candidate              |    288 ms | Hero image in a fresh local Playwright page; lab-only diagnostic.                         |
| Cumulative layout shift    |         0 | Layout-shift observer excluding recent-input entries, after fonts and Hero decode settle. |
| Forbidden Archive requests |         0 | No Three/R3F/MissionScene/GLB/KTX2/Draco/Basis request.                                   |

The production build reports the Archive route JavaScript at 45.66 kB raw / 13.44 kB gzip and its
feature CSS at 6.30 kB raw / 1.41 kB gzip. The 12.9 MB `S69-39525` archival original increases Git
history size but is never served by the browser; its runtime WebP variants are 28,536–173,484 bytes.

The `1440×900 physical / 720×450 CSS / DPR2` test is a reflow-equivalent context. It is not evidence
that the browser's page-zoom control was set to 200 percent.

## Verification record

| Command                                                                             | Result                                                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`                                                                 | PASS; all files match Prettier.                                                                                                             |
| `pnpm lint`                                                                         | PASS.                                                                                                                                       |
| `pnpm typecheck`                                                                    | PASS.                                                                                                                                       |
| `pnpm test:unit`                                                                    | PASS; 173/173.                                                                                                                              |
| `pnpm test:integration`                                                             | PASS; 4/4, including the in-memory production-bundle closure check.                                                                         |
| `pnpm validate:sources`                                                             | PASS; 0 errors, 0 warnings.                                                                                                                 |
| `pnpm validate:archive-media`                                                       | PASS; 4 concrete records plus source, disk, and processing-report checks.                                                                   |
| `pnpm validate:mission`                                                             | PASS; 37 published events, 70 facts, 24 unverified event times remain explicitly missing.                                                   |
| `pnpm validate:models`                                                              | PASS; all model LOD/hash/semantic and celestial texture records.                                                                            |
| `pnpm validate:decoders`                                                            | PASS; 9 Draco GLBs decode and 6 KTX2 files validate.                                                                                        |
| `pnpm inspect-stls`                                                                 | PASS; 12/12 Saturn V STL parts verified.                                                                                                    |
| `pnpm build`                                                                        | PASS; only the pre-existing >900 kB `MissionScene` warning remains.                                                                         |
| `pnpm test:e2e`                                                                     | PASS; 39/39.                                                                                                                                |
| `pnpm perf:budget`                                                                  | PASS; 5/5.                                                                                                                                  |
| `pnpm exec playwright test tests/browser/sprint2-archive-media.spec.ts --workers=1` | PASS; 5/5, including complete metadata, exact deep links, focus, typography, expanded narrow records, CLS, LCP, transfer, and 3D isolation. |
| Archive-specific cases inside the full E2E run                                      | PASS; 3/3 for cold-route isolation, responsive matrix, and keyboard/touch behavior.                                                         |
| Archive-specific case inside the full performance run                               | PASS; 1/1 with the measurements above.                                                                                                      |
| `git diff --exit-code a539355..HEAD -- tests/browser/__screenshots__`               | PASS; all four Archive baselines and all Control baselines remain byte-identical to the handoff commit.                                     |

The ignored local STL extraction and pinned KTX CLI cache were hydrated from the authoritative local
project copy only so the repository's existing model/decoder gates could run. They are not committed.

## Preview instructions

From this worktree:

```powershell
pnpm build
pnpm preview --host 127.0.0.1 --port <free-port>
```

Review routes:

- `/archive` — Mission Index Hero and complete image record;
- `/archive#saturn-v` — Saturn V historical/model/document evidence composition;
- `/archive/saturn/#saturn-v` — exact Control return-anchor contract.

No preview server is intentionally left running after handoff.

## Known gaps and deferred work

1. `S69-38660` is limited to the accessible 800 × 663 NASA-hosted scan; the historical high-resolution
   link found during research returns 404 and is not silently substituted.
2. This checkpoint intentionally contains three pad/launch photographs, not crew or preparation
   imagery. Full six-to-eight-image Archive expansion remains deferred.
3. CSM/LM evidence paths and inspectors are outside this checkpoint.
4. The Control-side Saturn V inspector is owned by the sibling branch. Final merged validation must
   prove its refresh/Back/Forward return behavior against this Archive anchor.
5. External NASA URLs can change. Local bytes and hashes preserve the delivered evidence, but source
   link availability still needs release-time verification.
6. The local LCP/CLS/transfer values above are diagnostics only. Field RUM or throttled device testing
   is still required before making user-performance claims.
7. Historical audio, interface tones, complete mission animation bridges, broad visual baseline
   regeneration, release, deployment, and RC promotion remain outside this branch.

This branch is intentionally not pushed or merged by the Archive workstream.
