# Phase 7 Source, Fact, Model, and Rights Audit

**Audit date:** 2026-07-14

**Scope:** canonical source manifest, selected mission sources, facts/events, media, derived assets,
processing records, software attribution, NASA non-endorsement, and unresolved rights boundaries.

## Audit inventory

| Record class                          |                                           Count | Audit result                                                            |
| ------------------------------------- | ----------------------------------------------: | ----------------------------------------------------------------------- |
| Canonical Source Manifest records     |                                              34 | all have a local path, SHA-256, source URL, and non-empty rights status |
| Source kinds                          | 11 PDF / 14 web / 4 image / 4 model / 1 dataset | schema-valid                                                            |
| Mission-selected source records       |                                              17 | all resolve to the canonical manifest                                   |
| Facts                                 |                                              70 | validator and unit coverage pass                                        |
| Published verified events             |                                              37 | all use ACTUAL SI-second Fact IDs and locatable citations               |
| Pending precise events                |                                              24 | remain excluded from replay; no guessed MET                             |
| Mission phases / narrative segments   |                                         13 / 12 | source-bound phase anchors; storyTime is separate                       |
| Vehicle components                    |                                              16 | deterministic state reconstruction                                      |
| Published telemetry                   |                      1 channel / 1 cited sample | no synthesized continuous stream                                        |
| Unavailable telemetry definitions     |                                               3 | hidden or labelled unavailable, never zero-filled                       |
| Transcript / image / audio candidates |                                       3 / 1 / 1 | transcript and image verified; 0 audio clips available                  |
| Derived asset records                 |              3 models / 2 textures / 1 fallback | hashes, LODs, truth labels, and recipes present                         |

## Four audit chains

### 1. Source chain — PASS

`pnpm validate:sources` reports zero errors and zero warnings. All 34 canonical records have local
bytes or archived pages, a SHA-256, and a rights note. HTML content assertions and the Phase 0
cross-wiring regression tests remain active. Phase 7 did not rewrite the Phase 0 source audit.

### 2. Fact chain — PASS

`pnpm validate:mission` reports 37 published events and 70 facts. Twenty-four events still lack a
verified precise time and remain outside the replay. The single telemetry value is an actual cited
sample. Missing channels, audio, and event times are never filled with zero, interpolation, or
authored estimates.

### 3. Model / texture chain — PASS

- Saturn V and LM are NASA-released generic visualization models, not mission-flight CAD.
- Saturn V semantic separation and the LM stage split are reconstructed by committed recipes.
- CSM is reconstructed from NASA-published references and print-kit geometry; it is not certified
  CSM-107 Columbia CAD.
- All three models have high/medium/low GLBs with declared byte length, triangle count, and SHA-256.
- All nine Draco GLBs decode with local pinned decoders.
- Earth and Moon have validated 1K/2K/4K KTX2 outputs; the imagery is modern and not a 1969
  same-instant reconstruction.
- Processing details are indexed in `MODEL-PROCESSING-NOTES.md` without modifying the Phase 3
  records.

### 4. Rights chain — BLOCKED FOR RELEASE

Every source has a rights-status string, but metadata completeness is not the same as clearance.
The following boundaries remain unresolved or conditional:

| Source / class                       | Recorded boundary                                                                                                          | Release implication                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `NASA-CSM-NR`                        | NASA-published reference containing Rockwell-supplied diagrams subject to original terms                                   | confirm per-figure redistribution terms before an RC containing those source bytes or derived figures           |
| `NASA-LM-HB`                         | NASA contractor document; rights still recorded as needing confirmation                                                    | confirm redistribution/derivative-use terms or replace with an equivalently authoritative cleared source        |
| ALSJ / AFJ / landing editorial pages | raw NASA records may be public domain; editorial annotation and curation are separately protected                          | do not treat the whole archived page as a U.S. government work; retain by-lines and separate raw transcript use |
| Teague-curated image/index pages     | NASA image bytes may be public domain; curation is separately credited                                                     | preserve source-level credit and do not copy protected editorial presentation wholesale                         |
| Historical audio candidate           | original NASA recording may be public domain, but local bytes, hash, channel alignment, and clip boundaries are unverified | audio playback stays unavailable                                                                                |

Because the first two contractor-document questions are unresolved in the canonical manifest,
Phase 7 cannot truthfully mark the rights audit chain closed and cannot approve a release candidate.
Phase 7 does not silently relabel either document as public domain.

## Software license and attribution

- `LICENSE` now contains the complete canonical MIT grant and warranty disclaimer for this
  repository's original software.
- `NOTICE` preserves attribution to `redradman/artemis`, MIT, Copyright (c) 2026 Radman
  Rakhshandehroo, and states that this is a separate Apollo 11 product.
- `NOTICE` also records NASA non-endorsement, the model/texture truth boundary, and the fact that
  contractor/editorial material is not automatically public domain.
- Third-party package versions remain locked in `pnpm-lock.yaml` and retain their own licenses.

## Release verdict

Source, fact, and model chains pass. The rights chain remains blocked by explicit contractor and
editorial boundaries. This is a release-candidate **NO-GO**, not a validator failure and not a reason
to erase the cautious source records.
