# AGENTS.md — AI 协作指南 / AI Collaboration Guide

Read this first when working on this project (applies to Codex, GPT, or any
coding agent). The authoritative build contract is
`docs/APOLLO_11_PRODUCTION_SPEC.md` — read it in full before writing any file.

## What this project is

**Apollo 11 Mission Archive + Historical Replay** — a verifiable digital
archive and Mission-Elapsed-Time (MET)-driven historical replay of NASA's
Apollo 11 mission (AS-506, CSM-107 Columbia, LM-5 Eagle, 16–24 Jul 1969).

Two top-level modes:

- `01 MISSION ARCHIVE` — document-style mission archive (mission index,
  objectives, crew, as-flown timeline, flight architecture, vehicle dossiers,
  guidance & computing, MCC/network, descent & landing, lunar surface ops,
  rendezvous & return, source room).
- `02 MISSION CONTROL / HISTORICAL REPLAY` — console-view replay: MET clock,
  vehicle configuration state machine, trajectory schematic, event log,
  discrete telemetry, historical audio + captions, GO/NO-GO records.

Based on lessons from [`redradman/artemis`](https://github.com/redradman/artemis)
(MIT). Design brief: restrained, technical, credible — a 1969 mission archive
built today, **not** a cinematic showcase, game UI, sci-fi neon, or marketing
page.

## Hard rules (see Production Spec §5–§7, §15, §29 for the full list)

1. **Every mission number must trace to `docs/sources/apollo11/` PDFs or be
   labelled `SCHEMATIC` / `RECONSTRUCTED`.** Plan values ≠ actual values.
2. **No tea-leaving data: missing is `NOT AVAILABLE IN SOURCE`, never `0`.**
3. **Forbidden: Artemis/SLS/Orion terminology or model swap; Apollo-Soyuz
   model as Apollo 11 CSM; NASA Worm used as 1969 identity; `LIVE` /
   `REAL-TIME TELEMETRY`; AI-synthesized astronaut voices; background music.**
4. **Mission core is pure TypeScript; no React/Three/Zustand imports.** Search
   for `apollo11`, `saturn-v`, `columbia`, `eagle` in `src/mission-core`
   must return zero hits.
5. **Three time axes stay separate:** real MET (seconds, fact primary key),
   `storyTime` (ms, edited watch time), `visualTime` (local animations).
   Browser wall clock drives only `storyTime`.
6. **Archive route must not load Three / R3F / GLB.**
7. **Historical audio default OFF; no pitch-stretch on accelerated playback.**
8. **State must be deterministic at any MET.** Both `stateAtMet(def, met)` and
   `visualStateAtStoryTime` must reconstruct identically after jump, scrub,
   reset, refresh.
9. **Replay UI dependencies stay outside mission-core.** React, R3F, Three,
   and Zustand may appear under app/features/scene code, never in mission-core.

## Stages & commands (current state)

Phases 0–6 complete — source freeze, mission core, Apollo 11 mission pack,
reproducible model/celestial assets, Launch / Earth Orbit / TLI, and the
Translunar / Lunar / Return replay through splashdown, plus complete Archive /
Mission Control UI. Phase 7 release audit remains pending.

```
pnpm install                # install dev tools (node 22, pnpm)
pnpm validate:sources       # verify Source Manifest references + SHA-256
pnpm validate:mission       # verify event table + fact coverage (Phase 1+)
pnpm validate:models        # verify Node Manifests + GLB parseability
pnpm validate:decoders      # offline-decode Draco and validate KTX2 assets
pnpm dev                    # stage verified runtime assets and start the app
pnpm build                  # typecheck + production bundle
node scripts/inspect-glb.ts <glb-path>   # inspect a single GLB
node scripts/validate-sources.ts          # alt invocation
```

Every earlier phase must remain green before the next phase starts. Phase exit requires
`docs/audit/PHASE-{N}-REPORT.md` per spec §58.

## Layout (see Production Spec §39 for the full plan)

| Path                                         | Current contents                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/missions/apollo11/source-manifest.json` | Source Manifest — URL, accessedAt, SHA-256, rights, notes for every NASA asset |
| `src/missions/apollo11/asset-manifest.json`  | Phase 3 derived model/texture/fallback/decoder inventory                       |
| `assets/raw/`                                | Read-only archive of original NASA files (PDFs, GLBs, STLs, textures)          |
| `docs/sources/apollo11/`                     | Per-source metadata sidecars + locator excerpts                                |
| `docs/audit/`                                | Phase reports, risk log, decision log, model inspection reports                |
| `docs/decisions/`                            | Architecture Decision Records                                                  |
| `scripts/`                                   | Validation / inspection scripts (Node, no React)                               |
| `src/app/`                                   | Mission adapter, shared shell, and replay UI state                             |
| `src/features/archive/`                      | Archive route; must remain free of Three/R3F/model imports                     |
| `src/features/control/`                      | Phase 4–6 Mission Control route and R3F mission configurations                 |
| `src/styles/`                                | Archive/Control design system and responsive/accessibility rules               |
| `tests/unit/`                                | Regression tests for mission-core, pack, sources, assets, and Phase 4–6 scope  |
| `docs/APOLLO_11_PRODUCTION_SPEC.md`          | The build contract (copied verbatim from project seed)                         |

## References

- Prototype (read-only): `D:\artemis-mission-archive` — do **not** modify it.
  Its procedural wireframe rocket rule does not apply here; Apollo 11 uses
  NASA-released visualization models per Production Spec §30.
- Apollo 11 Mission Report (NASA-A11-MR) is the primary source for actual
  MET values; secondary sources must defer where they conflict.
- The Production Spec is a contract, not a brief. See its Part X (AI work
  protocol) for what to emit at phase start, what to report at phase end,
  and the conditions under which to halt and escalate.

## Working memory

- If two high-authority sources conflict on the same actual value and the
  conflict cannot be explained, halt and log an OPEN QUESTION (spec §60). Do
  not silently pick one.
- If a NASA model's structure cannot be semantically separated without
  irreversible reconstruction, halt and propose alternatives.
- Do not assume the NASA Saturn V or Lunar Module GLB is the correct as-flown
  AS-506 / LM-5 until you've inspected nodes, units, bounds, and texture
  space. A page titled "Saturn V" does not certify as-flight fidelity.
