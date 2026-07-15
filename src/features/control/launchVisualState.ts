import { getEvent, mission, replayNarrative } from '../../app/mission.ts'
import type { PlaybackSpeed, VisualTransitionAnchors } from '../../app/missionStore.ts'
import { storyTimeAtMet } from '../../mission-core/index.ts'

export type VisualVector3 = readonly [number, number, number]

export interface AuthoredDeparture {
  /**
   * A discarded component may remain rendered briefly while the factual
   * lifecycle is already complete. This flag never feeds mission state.
   */
  renderAfterSeparation: boolean
  offsetMeters: VisualVector3
  progress: number
}

export type LaunchGuidedShotId =
  | 'launch-pad-reference'
  | 'ascent-lower-reference'
  | 'ascent-upper-reference'
  | 'earth-orbit-reference'

export interface LaunchGuidedShotDefinition {
  id: LaunchGuidedShotId
  targetAnchorName: 'launch-camera-anchor'
  cameraOffset: VisualVector3
  targetOffset: VisualVector3
}

export const launchGuidedShots: Readonly<
  Record<LaunchGuidedShotId, LaunchGuidedShotDefinition>
> = {
  'launch-pad-reference': {
    id: 'launch-pad-reference',
    targetAnchorName: 'launch-camera-anchor',
    cameraOffset: [9.2, 4.8, 12.8],
    targetOffset: [0, 0, 0],
  },
  'ascent-lower-reference': {
    id: 'ascent-lower-reference',
    targetAnchorName: 'launch-camera-anchor',
    cameraOffset: [10.4, 4.2, 13.6],
    targetOffset: [0, 0.15, 0],
  },
  'ascent-upper-reference': {
    id: 'ascent-upper-reference',
    targetAnchorName: 'launch-camera-anchor',
    cameraOffset: [11.2, 4.7, 14.4],
    targetOffset: [0, 0.1, 0],
  },
  'earth-orbit-reference': {
    id: 'earth-orbit-reference',
    targetAnchorName: 'launch-camera-anchor',
    cameraOffset: [9.8, 5.2, 13.2],
    targetOffset: [0, 0, 0],
  },
}

export interface LaunchVisualState {
  evidence: 'schematic'
  policy: 'authored-motion' | 'high-rate-overview' | 'reduced-motion'
  vehiclePosition: VisualVector3
  vehicleRotation: VisualVector3
  earthPosition: VisualVector3
  earthRadius: number
  earthRotationY: number
  atmosphereToSpace: number
  starOpacity: number
  launchReferenceOpacity: number
  guidedShotId: LaunchGuidedShotId
  guidedShotDurationMs: number
  guidedShotAnchorVisualTimeMs: number | null
  departures: Readonly<Record<string, AuthoredDeparture>>
  plumeIntensity: Readonly<Record<'s-ic' | 's-ii' | 's-ivb', number>>
}

interface LaunchVisualInput {
  storyTimeMs: number
  visualTimeMs: number
  transitionAnchors: VisualTransitionAnchors
  metSeconds: number
  speed: PlaybackSpeed
  reducedMotion: boolean
}

const ascentSegment = replayNarrative.find((segment) => segment.id === 'ascent')!
const earthOrbitSegment = replayNarrative.find((segment) => segment.id === 'earth-orbit')!

const milestones = {
  liftoff: eventMilestone('a11-liftoff'),
  sicCutoff: eventMilestone('a11-sic-outboard-cutoff'),
  sicSeparation: eventMilestone('a11-sic-sii-separation'),
  siiIgnition: eventMilestone('a11-sii-ignition-command'),
  lesJettison: eventMilestone('a11-les-jettison'),
  siiCutoff: eventMilestone('a11-sii-cutoff'),
  siiSeparation: eventMilestone('a11-sii-sivb-separation'),
  sivbIgnition: eventMilestone('a11-sivb-first-ignition'),
  sivbCutoff: eventMilestone('a11-sivb-first-cutoff'),
} as const

const orbitInsertion = milestones.sivbCutoff

const departureMethods = {
  's-ic': { milestone: milestones.sicSeparation, durationMs: 1_600, offset: [-4, -28, 1] },
  's-ic-s-ii-interstage': {
    milestone: milestones.sicSeparation,
    durationMs: 1_350,
    offset: [-2, -18, 0.5],
  },
  'launch-escape-system': {
    milestone: milestones.lesJettison,
    durationMs: 1_200,
    offset: [8, 24, 1.5],
  },
  's-ii': { milestone: milestones.siiSeparation, durationMs: 1_500, offset: [2, -24, -1] },
  's-ii-s-ivb-interstage': {
    milestone: milestones.siiSeparation,
    durationMs: 1_250,
    offset: [1, -15, -0.5],
  },
} as const satisfies Record<
  string,
  { milestone: EventMilestone; durationMs: number; offset: VisualVector3 }
>

interface EventMilestone {
  eventId: string
  metSeconds: number
  storyTimeMs: number
}

function eventMilestone(eventId: string): EventMilestone {
  const event = getEvent(eventId)
  return {
    eventId,
    metSeconds: event.metSeconds,
    storyTimeMs: storyTimeAtMet(mission.narrative, event.metSeconds),
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function easeInOutCubic(value: number): number {
  const t = clamp01(value)
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function easeOutCubic(value: number): number {
  return 1 - (1 - clamp01(value)) ** 3
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress
}

function lerpVector(
  start: VisualVector3,
  end: VisualVector3,
  progress: number,
): VisualVector3 {
  return [
    lerp(start[0], end[0], progress),
    lerp(start[1], end[1], progress),
    lerp(start[2], end[2], progress),
  ]
}

function overviewAscentProgress(metSeconds: number): number {
  if (metSeconds >= orbitInsertion.metSeconds) return 1
  if (metSeconds >= milestones.siiSeparation.metSeconds) return 0.82
  if (metSeconds >= milestones.sicSeparation.metSeconds) return 0.56
  if (metSeconds >= milestones.liftoff.metSeconds) return 0.28
  return 0
}

function authoredAscentProgress(storyTimeMs: number): number {
  return easeInOutCubic(
    (storyTimeMs - ascentSegment.storyStartMs) /
      (ascentSegment.motionEndMs - ascentSegment.storyStartMs),
  )
}

function departureAt(
  input: LaunchVisualInput,
  method: (typeof departureMethods)[keyof typeof departureMethods],
  transientMotionAllowed: boolean,
): AuthoredDeparture {
  if (input.metSeconds < method.milestone.metSeconds) {
    return { renderAfterSeparation: false, offsetMeters: [0, 0, 0], progress: 0 }
  }

  if (!transientMotionAllowed) {
    return { renderAfterSeparation: false, offsetMeters: method.offset, progress: 1 }
  }

  const anchorVisualTimeMs = input.transitionAnchors[method.milestone.eventId]
  if (anchorVisualTimeMs === undefined) {
    return { renderAfterSeparation: false, offsetMeters: method.offset, progress: 1 }
  }

  const progress = easeOutCubic(
    (input.visualTimeMs - anchorVisualTimeMs) / method.durationMs,
  )
  return {
    renderAfterSeparation: progress < 1,
    offsetMeters: method.offset.map((value) => value * progress) as unknown as VisualVector3,
    progress,
  }
}

function burnEnvelope(
  input: LaunchVisualInput,
  ignition: EventMilestone,
  cutoff: EventMilestone,
  transientMotionAllowed: boolean,
): number {
  if (input.metSeconds < ignition.metSeconds || input.metSeconds >= cutoff.metSeconds) return 0
  if (!transientMotionAllowed) return 1
  const anchorVisualTimeMs = input.transitionAnchors[ignition.eventId]
  if (anchorVisualTimeMs === undefined) return 1
  return easeOutCubic((input.visualTimeMs - anchorVisualTimeMs) / 600)
}

function guidedShotAt(metSeconds: number): LaunchGuidedShotId {
  if (metSeconds >= orbitInsertion.metSeconds) return 'earth-orbit-reference'
  if (metSeconds >= milestones.sicSeparation.metSeconds) return 'ascent-upper-reference'
  if (metSeconds >= milestones.liftoff.metSeconds) return 'ascent-lower-reference'
  return 'launch-pad-reference'
}

function guidedShotMilestone(shotId: LaunchGuidedShotId): EventMilestone | null {
  if (shotId === 'ascent-lower-reference') return milestones.liftoff
  if (shotId === 'ascent-upper-reference') return milestones.sicSeparation
  if (shotId === 'earth-orbit-reference') return orbitInsertion
  return null
}

/**
 * Returns the authored launch visualization without mutating mission truth.
 * Long-range pose is reconstructed from story/MET, while short motion uses
 * explicit wall-clock visual time and canonical crossing anchors. Re-entry
 * without an anchor intentionally resolves to the stable endpoint instead of
 * replaying a transient. No frame delta or prior render pose is consulted.
 */
export function launchVisualStateAt(input: LaunchVisualInput): LaunchVisualState {
  const highRate = input.speed >= 100
  const transientMotionAllowed = !input.reducedMotion && !highRate
  const policy = input.reducedMotion
    ? 'reduced-motion'
    : highRate
      ? 'high-rate-overview'
      : 'authored-motion'
  const authoredProgress = authoredAscentProgress(input.storyTimeMs)
  const ascentProgress = transientMotionAllowed
    ? authoredProgress
    : overviewAscentProgress(input.metSeconds)
  const orbitSettle = transientMotionAllowed
    ? easeOutCubic((input.storyTimeMs - earthOrbitSegment.storyStartMs) / 4_000)
    : input.metSeconds >= orbitInsertion.metSeconds
      ? 1
      : 0
  const spaceProgress = transientMotionAllowed
    ? easeInOutCubic((authoredProgress - 0.08) / 0.7)
    : ascentProgress >= 1
      ? 1
      : ascentProgress >= 0.56
        ? 0.84
        : ascentProgress > 0
          ? 0.42
          : 0.08

  const departures = Object.fromEntries(
    Object.entries(departureMethods).map(([componentId, method]) => [
      componentId,
      departureAt(input, method, transientMotionAllowed),
    ]),
  ) as Record<string, AuthoredDeparture>

  const normalRotation = Math.max(0, input.storyTimeMs - milestones.liftoff.storyTimeMs) * 0.000_0035
  const overviewRotation =
    input.metSeconds >= orbitInsertion.metSeconds
      ? 0.32
      : input.metSeconds >= milestones.siiSeparation.metSeconds
        ? 0.24
        : input.metSeconds >= milestones.sicSeparation.metSeconds
          ? 0.15
          : input.metSeconds >= milestones.liftoff.metSeconds
            ? 0.07
            : 0
  const guidedShotId = guidedShotAt(input.metSeconds)
  const guidedMilestone = guidedShotMilestone(guidedShotId)
  const guidedShotAnchorVisualTimeMs = guidedMilestone
    ? (input.transitionAnchors[guidedMilestone.eventId] ?? null)
    : null

  return {
    evidence: 'schematic',
    policy,
    vehiclePosition: lerpVector(
      [0, -3.7, 0],
      [0.35, 0.2, 0],
      easeOutCubic(ascentProgress),
    ),
    vehicleRotation: [
      lerp(0, -0.08, ascentProgress),
      lerp(0, 0.24, ascentProgress),
      lerp(0, -Math.PI / 2, ascentProgress),
    ],
    earthPosition: lerpVector(
      [-7.6, -4.8, -7],
      [-4.9, -6.3, -9],
      easeOutCubic(ascentProgress),
    ),
    earthRadius: lerp(5.5, 6.15, easeOutCubic(ascentProgress)),
    earthRotationY: input.reducedMotion
      ? 0
      : highRate
        ? overviewRotation
        : normalRotation,
    atmosphereToSpace: Math.max(spaceProgress, orbitSettle),
    starOpacity: lerp(0.12, 1, Math.max(spaceProgress, orbitSettle)),
    launchReferenceOpacity: input.reducedMotion
      ? input.metSeconds < milestones.liftoff.metSeconds
        ? 1
        : 0
      : 1 - easeOutCubic(ascentProgress * 3.4),
    guidedShotId,
    guidedShotDurationMs:
      transientMotionAllowed && guidedShotAnchorVisualTimeMs !== null ? 560 : 0,
    guidedShotAnchorVisualTimeMs,
    departures,
    plumeIntensity: {
      's-ic': burnEnvelope(
        input,
        milestones.liftoff,
        milestones.sicCutoff,
        transientMotionAllowed,
      ),
      's-ii': burnEnvelope(
        input,
        milestones.siiIgnition,
        milestones.siiCutoff,
        transientMotionAllowed,
      ),
      's-ivb': burnEnvelope(
        input,
        milestones.sivbIgnition,
        milestones.sivbCutoff,
        transientMotionAllowed,
      ),
    },
  }
}
