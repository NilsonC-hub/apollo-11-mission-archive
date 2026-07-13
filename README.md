# Apollo 11 Mission Archive + Historical Replay

A contemporary, verifiable digital archive and metric-time-driven historical
replay of NASA's Apollo 11 mission (AS-506, CSM-107 **Columbia**, LM-5
**Eagle**, launched 16 July 1969, splashdown 24 July 1969).

## Product shape

Two top-level modes:

- **`01 MISSION ARCHIVE`** — document archive: mission index, objectives,
  crew, as-flown timeline, flight architecture, vehicle dossiers, guidance &
  computing, mission control & network, powered descent & landing, lunar
  surface operations, rendezvous & return, source room.
- **`02 MISSION CONTROL / HISTORICAL REPLAY`** — console-view replay driven
  by real Mission Elapsed Time (MET): mission clock, vehicle configuration,
  trajectory schematic, event log, discrete telemetry, historical audio with
  synced captions, GO/NO-GO records, DSN/MSFN handovers.

This is **not** a game, real-time telemetry simulator, cinematic showcase, or
Apollo Guidance Computer emulator. Every mission number on screen must trace to
a NASA-source PDF or be labelled schematic.

## Status

Phase 0 (baseline, source freeze, feasibility) — in progress. See
[`docs/audit/PHASE-0-REPORT.md`](./docs/audit/PHASE-0-REPORT.md).

## Provenance & attribution

This project builds on the experience of the
[`redradman/artemis`](https://github.com/redradman/artemis) (MIT) prototype
but is a separate codebase for a separate mission. The Apollo 11 archive is a
new product. MIT attribution to the prototype is preserved here per the
project's source license chain.

All NASA imagery, audio, models, and documents are used as public-domain works
of the U.S. federal government where applicable; rights status is recorded per
asset in the Source Manifest and Asset Manifest. This project is **not** an
official NASA product and does not imply NASA endorsement. The NASA Insignia,
Logotype, and Seal are not used as this project's brand identifiers.

## Tech stack (planned)

React 19 + TypeScript + Three.js (R3F) + Zustand + Vite, Node 22, pnpm.
Mission data, owns, and rights live under `src/missions/apollo11`.

### Phase 0 tooling only

Phase 0 uses `node --experimental-strip-types` to run scripts and the
`@gltf-transform` + `gltf-validator` toolchain for GLB inspection. No React
or Three runtime is imported by Phase 0 deliverables.

## Commands

```
pnpm install                # install dev tools
pnpm validate:sources       # verify Source Manifest references + hashes
pnpm validate:mission       # verify event table + fact coverage
pnpm validate:models         # verify Node Manifests + GLB parseability
node scripts/inspect-glb.ts <glb-path>   # inspect a single GLB
```

## License

MIT for this project's own code (see [LICENSE](./LICENSE)). NASA works are
public-domain U.S. government works where original.

Project conventions for AI / human collaborators are documented in
[`AGENTS.md`](./AGENTS.md). The complete build contract is in
[`docs/APOLLO_11_PRODUCTION_SPEC.md`](./docs/APOLLO_11_PRODUCTION_SPEC.md).
