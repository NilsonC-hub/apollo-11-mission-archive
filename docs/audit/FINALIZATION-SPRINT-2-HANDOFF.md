# Finalization Sprint 2 Handoff — Visual Continuity & Media Foundation

Status: implementation-ready, checkpoint 1 only

Accepted base: `4e22a9b6a1f9f76145f82d828b87f96464b050f2`

Integration branch: `finalization/sprint2-integration`

Integration worktree: `D:\apollo-11-mission-archive-worktrees\sprint2-integration`

## Objective

Build the first complete visual-production sample on top of the accepted Sprint 1
continuity spine without reopening its playback, URL, interaction, or truth-model
architecture.

Checkpoint 1 joins two deliberately small vertical slices:

1. Control: liftoff through ascent into a stable Earth-orbit composition.
2. Archive: a Saturn V evidence path from historical photography and a static
   structure plate into a dedicated Control-side 3D inspector.

The checkpoint exists to approve the motion language, media presentation, 3D entry
pattern, performance envelope, and accessibility behavior before the same patterns
are expanded across the mission.

## Owner decisions already made

1. Sprint 1 behavior is accepted. Do not replace its three time domains, guided /
   free-look / inspect states, URL traversal, or deterministic state restoration.
2. Historical photography provides appearance and documentary evidence. 3D explains
   structure, configuration, and user-controlled inspection.
3. No paint or livery switching.
4. A complete launch-tower model is not required for the checkpoint. The vehicle may
   ignite and rise from a restrained schematic launch frame.
5. The visual identity remains editorial, industrial, documentary, and technically
   restrained. Cyberpunk, neon, cinematic spectacle, retro filters, and game feedback
   remain prohibited.
6. The Archive route must remain free of Three, R3F, GLB, KTX2, and decoder requests.
   Interactive 3D therefore lives in a Control-loaded inspector route.
7. Sound remains muted by default. Historical audio and project interface tones are
   separate capabilities.

## Checkpoint 1 workstreams

### A. Control visual continuity sample

Implement a deterministic authored bridge covering:

```text
LIFTOFF
  -> ASCENT
  -> S-IC / S-II / S-IVB CONFIGURATION CHANGES
  -> ATMOSPHERE-TO-SPACE VISUAL TRANSITION
  -> STABLE EARTH-ORBIT COMPOSITION
```

Required behavior:

- Vehicle pose, separation offsets, flame visibility/intensity, celestial rotation,
  and camera-shot progress derive from `storyTime`, `visualTime`, and factual vehicle
  state. They must not depend on accumulated frame deltas.
- Replay, jump, backward scrub, refresh, and re-entry at the same time produce the
  same serialized visual pose.
- Earth may rotate slowly as an explicitly schematic visual treatment. Its modern
  composite texture must not be presented as epoch-accurate 1969 lighting.
- The launch-to-space background transition is continuous and restrained. No camera
  shake, screen flash, lens flare, particle spectacle, or fake telemetry.
- Stage separation is a short authored displacement after the factual event boundary;
  it must not alter event MET or component lifecycle truth.
- Guided shots are short, stable, and interruptible. Any valid pointer, wheel, touch,
  or keyboard camera input cancels the active shot and enters free look immediately.
- Once the user takes control, later shots do not steal the camera until the user
  explicitly returns to guided view.
- Reduced Motion applies the stable endpoint composition without automatic camera
  tween, celestial rotation, star drift, or separation travel. Manual 3D remains
  available.
- High narrative rates use a quick-overview policy: skip long transitions and apply a
  deterministic safe composition rather than attempting to play every transient.

### B. Control-side Saturn V inspector

Provide a deep-linkable inspector that is loaded by the Control route chunk, not by
Archive.

Minimum capability:

- Saturn V medium LOD by default, with existing quality fallback behavior.
- rotate, zoom, reset, keyboard alternatives, and touch-safe controls;
- semantic component tree and focus actions using Node Manifest IDs;
- component name, assembly, current or selected reference state, model source,
  reconstruction boundary, and truth label;
- static fallback when WebGL/model/decoder loading fails;
- a stable back/return path to the originating Archive chapter;
- direct URL refresh and browser Back/Forward restoration.

The inspector is not an auto-rotating hero and must not add a new top-level product
mode.

### C. Archive Saturn V evidence sample

Create reusable, non-3D media presentation primitives and use them in the Mission
Index / Saturn V path.

Required primitives:

- `EvidencePlate`: one historical photograph with original aspect ratio and complete
  caption/source metadata;
- `EvidencePair`: historical photograph beside a static annotated model/structure
  plate, reflowing vertically on narrow viewports;
- `DocumentPlate`: a sourced NASA document page or documented excerpt without using
  the two unresolved contractor-document sources;
- an accessible details surface for metadata, processing notes, rights status, and
  source locator;
- an explicit `INSPECT SATURN V IN 3D` link into the Control inspector.

Checkpoint media target:

- two or three verified NASA historical photographs covering launch-pad / launch
  context and, if source quality permits, crew or vehicle preparation;
- one cleared NASA document plate from the Mission Report, Flight Plan, or Technical
  Transcript;
- the existing static Saturn V processing plate retained as a reconstruction record,
  no longer used as a substitute for historical photography.

All images retain original aspect ratio. Any crop, tonal adjustment, resize, or format
conversion is recorded in a processing note.

### D. Interface-tone foundation

Add a separate, user-enabled `INTERFACE TONES` capability if it can remain isolated
from historical audio state.

Checkpoint tones are limited to quiet project-interface feedback for explicit user
actions or configuration completion. They must be created only after a user gesture,
remain off by default, stop on page hide, and avoid event-rate stacking at accelerated
playback.

Do not add background music, continuous ambient hum, fake radio noise, imitation
Quindar tones, external-space sound effects, or any Artemis audio byte. Historical
audio stays `UNAVAILABLE` until local bytes, hash, channel, MET range, transcript,
processing, and rights records are complete.

## Source and media contract

Primary source IDs for checkpoint research:

- `NASA-A11-IMAGES`
- `NASA-A11-MEDIA50`
- `NASA-A11-MR`
- `NASA-A11-FP` / `NASA-A11-FP1`
- `NASA-A11-TTEC` / `NASA-A11-TTEC-WEB`
- `NASA-MODEL-SATV`
- `NASA-MEDIA-RULES`

Every delivered historical image record must include:

- stable project ID and NASA image ID;
- source ID and original/effective URL;
- access date, local raw path, SHA-256, width, and height;
- caption, subject/event tags, and known date/MET/camera information;
- rights status, alt text, and processing note;
- responsive delivery variants with fixed intrinsic dimensions.

Do not hotlink images or copy the editorial layout of a gallery page. Original bytes
remain in `assets/raw`; browser delivery uses processed local variants. Newspaper
scans and figures from `NASA-CSM-NR` / `NASA-LM-HB` are out of scope.

## Branch and file ownership

Both implementation branches are created from the committed version of this handoff.

### Control branch owns

- `src/features/control/**`
- new Control visual-pose, camera-shot, inspector, and interface-tone modules
- Control-only route wiring under `src/app/**`
- Control store changes required for inspector/audio state
- Control-specific tests and styles

It must not edit Archive media records, Archive components, source manifests, or
Archive styles.

### Archive branch owns

- `src/features/archive/**`
- `src/missions/apollo11/media.ts` and any new image/media record modules
- source/media manifest additions and their validators
- `assets/raw` historical image originals and processed `public` image variants
- Archive-specific tests and styles

It must not edit `MissionScene`, Control playback/store code, Control route wiring, or
Control visual tests. It links to the inspector route contract but does not implement
the Three/R3F inspector.

To reduce merge conflict, new feature-scoped CSS files are preferred over concurrent
edits to `src/styles/global.css`. Shared router or global-style changes require an
integration-branch decision.

## Verification and acceptance

### Control acceptance

- The liftoff-to-Earth-orbit sample has no full-scene hard cut.
- Same time/state yields the same visual pose after play, jump, backward scrub,
  refresh, and deep-link load.
- User camera input interrupts a guided shot within one rendered frame and prevents
  later camera takeover until explicit return.
- Stage lifecycle truth and authored separation travel remain distinct.
- Reduced Motion, WebGL fallback, and high-rate overview remain information-complete.
- Desktop p95 target remains at least 50 fps; 390x844 low-quality p95 remains at least
  30 fps.
- Ten reset/jump/focus cycles do not increase live renderer resources.
- With interface tones off, the application is silent; page hide stops active tones.

### Archive acceptance

- The historical images and document plate display complete, inspectable metadata.
- Original aspect ratios are preserved; no unrecorded crop or color treatment exists.
- 390x844 and 320x568 reflow without root horizontal overflow or hidden captions.
- Keyboard and touch users can open/close details and reach the inspector link.
- Archive cold load requests no Three/R3F/model/texture/decoder asset.
- Images declare dimensions, load responsively, keep CLS at zero, and do not regress
  the existing Archive cold-transfer envelope without an explicit report.

### Required gates before checkpoint review

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm validate:sources
pnpm validate:mission
pnpm validate:models
pnpm validate:decoders
pnpm inspect-stls
pnpm build
pnpm test:e2e
pnpm perf:budget
```

Run focused tests during development. Do not update broad visual baselines until the
owner accepts the checkpoint's visual direction.

## Explicitly out of scope for checkpoint 1

- the remaining translunar, lunar, landing, ascent, return, and entry visual bridges;
- all 37 events receiving unique animation;
- a complete launch tower, terrain rebuild, dust, plasma, or post-processing system;
- LM/CSM Archive inspection, CSM geometry enhancement, or livery work;
- six-to-eight-image full Archive expansion beyond the Saturn V sample;
- newspaper scans or unclear third-party editorial imagery;
- historical audio playback or full audio archive enumeration;
- global typography, navigation, or theme redesign;
- Phase 7 rights-blocker remediation, Git-history rewrite, release, deployment, or RC
  promotion.

## Review handoff

Each branch must end with:

1. a clean worktree and scoped commits;
2. exact commit hash and commands/results;
3. changed-source/media records and any authored schematic methods;
4. screenshots or externally opened preview instructions for desktop and mobile;
5. performance/accessibility deltas and known gaps;
6. an explicit list of work deferred until checkpoint approval.
