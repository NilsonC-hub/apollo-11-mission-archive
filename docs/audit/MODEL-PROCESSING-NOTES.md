# Apollo 11 Model and Texture Processing Notes

This document is the Phase 7 index for the existing, reproducible Phase 3 asset pipeline. It does
not replace or rewrite the Phase 0–3 inspection and processing records.

## Truth boundary

| Runtime asset          | Source boundary                                                   | Authored processing                                                                          | Required product label                                                                 |
| ---------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Saturn V               | NASA-released generic visualization model; not flight CAD         | scale normalization, animation removal, semantic stage split, LOD and Draco generation       | `NASA VISUALIZATION MODEL — SEMANTIC SPLIT RECONSTRUCTED; NOT NASA CAD`                |
| Lunar Module           | NASA-released generic Apollo LM visualization; not certified LM-5 | scale normalization, animation removal, ascent/descent stage split, LOD and Draco generation | `NASA GENERIC APOLLO LM VISUALIZATION — NOT CERTIFIED LM-5; STAGE SPLIT RECONSTRUCTED` |
| Command/Service Module | NASA-released print-kit parts plus NASA-published references      | CM/SM reconstruction, normalization, material authoring, LOD and Draco generation            | `RECONSTRUCTED FROM NASA REFERENCES — NOT NASA CAD`                                    |
| Earth                  | modern NASA Blue Marble composite                                 | Lanczos4 downsample, ETC1S KTX2, mipmaps                                                     | `NASA IMAGERY-BASED TEXTURE — MODERN COMPOSITE`                                        |
| Moon                   | modern NASA LRO color product                                     | Lanczos4 downsample, ETC1S KTX2, mipmaps                                                     | `NASA IMAGERY-BASED TEXTURE — MODERN LRO PRODUCT`                                      |

No runtime asset is certified as AS-506, CSM-107 Columbia, LM-5 Eagle, or mission-flight CAD. Scene
position, scale, path, star field, illumination, and motion remain schematic unless a separate
source-bound record says otherwise.

## Reproducible model pipeline

- Orchestrator: `scripts/optimize-models.ts`
- Blender recipe: `scripts/blender/process_apollo11_assets.py`
- Required Blender version: 4.3.2
- LOD ratios: high 1.00, medium 0.55, low 0.22
- Compression: Draco level 6
- Immutable output record: `docs/audit/PHASE-3-MODEL-PROCESSING.json`
- Runtime manifest: `src/missions/apollo11/asset-manifest.json`
- Semantic node contracts: `src/missions/apollo11/node-manifests/*.json`

The asset manifest records the byte length, triangle count, and SHA-256 for every high, medium, and
low GLB. `pnpm validate:models` reparses the files and validates those declarations. `pnpm
validate:decoders` proves that all nine Draco GLBs can be decoded with the pinned local decoder.

## Reproducible texture pipeline

- Orchestrator: `scripts/prepare-textures.ts`
- Encoder: Khronos `toktx` 4.4.2
- Output: KTX2 ETC1S, qlevel 180, clevel 2, single-threaded, mipmapped, sRGB
- Downsample filter: Lanczos4
- Variants: 1K, 2K, and 4K for Earth and Moon
- Immutable output record: `docs/audit/PHASE-3-TEXTURE-PROCESSING.json`

The runtime currently uses the 1K Earth and Moon textures. The higher variants remain validated
derived assets; selecting high model quality does not silently imply a historically reconstructed
or higher-resolution celestial appearance.

## Inspection and provenance records

- `docs/audit/MODEL-INSPECTION-REPORT.md` — raw NASA GLB/STL structure, bounds, units, materials,
  animations, and semantic limitations.
- `docs/audit/CSM-RECONSTRUCTION-PLAN.md` — CSM reconstruction choice and evidence boundary.
- `docs/audit/STL-INSPECTION.txt` — source print-kit part inventory.
- `docs/audit/PHASE-3-REPORT.md` — Phase 3 completion evidence and commands.
- `src/missions/apollo11/source-manifest.json` — source URLs, local hashes, and rights notes.

## Runtime staging and fallback

`scripts/stage-runtime-assets.ts` copies only manifest-declared derived assets into the runtime
tree. Decoder staging is local and version-pinned. If WebGL, a model, a texture, or a decoder is
unavailable, Mission Control preserves the mission shell and source text and uses the static
`SCHEMATIC — NOT TO SCALE` vehicle structure fallback.

## Phase 7 verification

Phase 7 does not reprocess or replace Phase 3 outputs. It reruns model/decoder validation, measures
all three model qualities in the production browser, verifies the fallback path, and records the
results in `PHASE-7-PERFORMANCE.md`, `PHASE-7-RIGHTS-AND-PROVENANCE.md`, and
`PHASE-7-REPORT.md`.
