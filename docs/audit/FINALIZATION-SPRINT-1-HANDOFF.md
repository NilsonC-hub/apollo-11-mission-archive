# Finalization Sprint 1 Handoff — Control Continuity Spine

Status: implementation-ready

Branch: `finalization/control-continuity`

Worktree: `D:\apollo-11-mission-archive-worktrees\control-continuity`

Base: `f8ac79784eb91c8869a9625bfadeb440010ded43`

## Objective

Replace the current slide-like replay foundation with a continuous, truthful,
interruptible Control experience. This sprint builds the playback, state, URL,
and camera-interaction spine. It does not yet build the final launch-to-Moon
scene sequence, historical audio package, or Archive media expansion.

The product direction is:

- `GUIDED VIEW`: continuous authored replay with an honest narrative-rate label.
- `FREE LOOK`: the user can rotate, zoom, and reframe without the camera fighting
  them; a visible action returns to the guided composition.
- `INSPECT`: selecting a vehicle component pauses the replay, focuses the part,
  opens one dossier, and resumes only if playback was active before inspection.

Use the Artemis reference project only for interaction principles: persistent
scene state, user camera takeover, component focus transactions, and event-timed
feedback. Do not copy its audio assets, phase-hold cadence, dense console layout,
hard-coded celestial staging, or non-interruptible camera moves.

## Owner decisions already made

1. No paint/livery switching.
2. Real photographs will later provide historical appearance; 3D will explain
   structure, configuration, and interaction.
3. Guided replay must feel continuous. Ordinary events must not behave like
   mandatory presentation slides.
4. The UI remains restrained, documentary, and technical — not cinematic,
   game-like, neon, or promotional.
5. Missing factual attitude or motion data must be labelled schematic; authored
   motion must never be presented as measured Apollo telemetry.

## Required scope

### 1. Separate the three time domains

- `metSeconds`: factual Mission Elapsed Time used for records, state boundaries,
  citations, and display.
- `storyTime`: the edited guided-replay position.
- `visualTime`: local animation time for separation, camera movement, fades, and
  other authored motion.
- Do not calculate authored animation duration directly from MET or playback
  speed.
- Do not label an edited narrative multiplier as physical mission-time `1x`.
  Use an explicit narrative-rate label until a true real-time mode exists.

### 2. Add explicit Control interaction state

- Model `guided`, `free-look`, and `inspect` as explicit state, not incidental
  combinations of booleans.
- Pointer/wheel/touch camera input must immediately interrupt a guided camera
  move and enter free look.
- Provide visible rotate/zoom/reset affordances and `RETURN TO GUIDED VIEW`.
- Keep gesture alternatives available for keyboard and touch users.
- Component inspection must remember whether playback was running, pause once,
  focus the component, and resume exactly once on close.

### 3. Make Guided replay continuous

- Ordinary phase boundaries update the event log and visual state without a
  mandatory hard hold.
- Preserve procedural holds behind an explicit Step/Procedure path or a reusable
  policy seam; do not expose fourteen compulsory holds in Guided replay.
- Keep event transitions deterministic and reconstructable from any deep link.
- Page visibility loss, page hide, and focus loss must pause safely. Returning
  must not apply the entire hidden duration as one playback delta.

### 4. Keep URL, playback, and displayed precision aligned

- Scrub, event jump, phase jump, Previous/Next, and keyboard navigation must
  update a shareable URL without creating an unusable history entry per frame.
- Refresh, Back, and Forward must restore the same event/MET state.
- Preserve source precision when formatting event MET. A tenth-second source
  must not be rounded to an integer second in event lists or readouts.

### 5. Repair state truth needed by replay

- Add terminal-state coverage for every vehicle component.
- A discarded, landed, or otherwise inactive component must not remain
  `engineMode: burning`.
- Do not invent unknown cutoff times. Represent an ignition-only fact without
  extending a burn indefinitely; use an explicit unknown/point-event model if
  the source set cannot establish the interval.
- Runtime component lookup should follow semantic IDs and Node Manifest data
  rather than JSX-only model paths or array positions.

### 6. Add regression coverage before visual expansion

Cover at minimum:

- MET/storyTime/visualTime separation.
- Guided phase crossing without mandatory holds.
- visibility/focus pause and explicit resume.
- guided camera interrupted by user input.
- inspect pause/focus/close/resume transaction.
- scrub/jump then refresh, Back, and Forward.
- source-preserved MET formatting.
- no `discarded|landed + burning` terminal state.

## Out of scope for Sprint 1

- Final launch, Earth-orbit, translunar, lunar-orbit, landing-site, and entry
  reference-frame content. Sprint 1 may define the interfaces; Sprint 2 supplies
  the complete scene plan and assets.
- Landing-site terrain and First Step historical-media composition.
- Historical voice clips, vehicle/cabin sound, interface-tone implementation,
  and rights clearance.
- Archive photograph acquisition, document plates, and Archive 3D inspection UI.
- Global typography, mobile visual redesign, hero redesign, and image delivery
  optimization except where required to make new controls usable.
- Rights remediation or Git-history rewriting.

## Non-negotiable constraints

- Read `AGENTS.md` and `docs/APOLLO_11_PRODUCTION_SPEC.md` before implementation.
- Do not hard-code Apollo facts in JSX, scene coordinates, or component copy.
- Every displayed mission number must resolve through the mission pack and a
  citation, or be explicitly labelled schematic.
- Do not reuse audio from `D:\artemis-mission-archive`; its `radio-call.mp3`
  references Atlantis and is not valid Apollo/Artemis mission evidence.
- Do not modify `master` or the original worktree.
- Keep commits scoped and intentional; do not combine later Archive/audio work
  into this sprint.

## Recommended implementation order

1. Write failing core/store/browser tests for the required behaviors.
2. Introduce the time-domain and interaction-state types.
3. Repair playback, visibility handling, and URL synchronization.
4. Implement interruptible camera controls and the inspect transaction.
5. Repair terminal component state semantics and semantic model lookup seams.
6. Run the complete gate suite and perform a real desktop/mobile interaction
   pass before requesting review.

## Verification gates

Run from this worktree:

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
pnpm test:visual
pnpm perf:budget
```

Visual baselines must only be updated after behavior is accepted. A green
snapshot comparison proves stability, not compliance.

## Review handoff

When Sprint 1 is ready:

1. Confirm the worktree is clean after committing.
2. Report the commit hash and exact commands/results.
3. List any Production Spec clauses intentionally deferred to Sprint 2.
4. Return to the original review task for diff, runtime, and contract review.
