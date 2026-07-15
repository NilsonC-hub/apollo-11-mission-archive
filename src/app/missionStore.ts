import { create } from 'zustand'

import { metAtStoryTime, storyTimeAtMet } from '../mission-core/index.ts'
import {
  mission,
  replayEndMet,
  replayEndStoryTime,
  replayEvents,
  replayNarrative,
  replayStartMet,
  replayStartStoryTime,
} from './mission.ts'

export type PlaybackSpeed = 1 | 10 | 100 | 1000
export type PlaybackPolicy = 'guided' | 'procedure'
export type PlaybackPauseReason = 'mode-switch' | 'visibility' | 'page-hide' | 'focus-loss'
export type ModelQuality = 'high' | 'medium' | 'low' | 'fallback'
export type SceneAvailability = 'loading' | 'ready' | 'fallback'
export type CameraCommandKind = 'rotate-left' | 'rotate-right' | 'zoom-in' | 'zoom-out' | 'reset'
export type VisualTransitionAnchors = Readonly<Record<string, number>>

export const GUIDED_CAMERA_REST_POSE_SHOT_IDS = [
  'launch-pad-reference',
  'ascent-lower-reference',
  'ascent-upper-reference',
  'earth-orbit-reference',
] as const
export type GuidedCameraRestPoseShotId = (typeof GUIDED_CAMERA_REST_POSE_SHOT_IDS)[number]

export type ControlInteractionState =
  | { mode: 'guided' }
  | { mode: 'free-look' }
  | {
      mode: 'inspect'
      componentId: string
      returnMode: 'guided' | 'free-look'
      resumePlaybackOnClose: boolean
      cameraControl: 'guided-focus' | 'free-look'
    }

export interface CameraCommand {
  kind: CameraCommandKind
  revision: number
}

export interface VisualTransitionRestoreState {
  visualTimeMs: number
  visualTransitionAnchors: VisualTransitionAnchors
  suppressedGuidedCameraTransitionEventIds: readonly string[]
  guidedCameraRestPose: GuidedCameraRestPose | null
}

export interface GuidedCameraRestPose {
  shotId: GuidedCameraRestPoseShotId
  position: readonly [number, number, number]
  target: readonly [number, number, number]
}

interface MissionUiState {
  storyTimeMs: number
  visualTimeMs: number
  visualTransitionAnchors: VisualTransitionAnchors
  playing: boolean
  resumeAvailable: boolean
  pauseReason: PlaybackPauseReason | null
  editorialPauseSegmentId: string | null
  playbackPolicy: PlaybackPolicy
  speed: PlaybackSpeed
  quality: ModelQuality
  sceneAvailability: SceneAvailability
  runtimeInspectableComponentIds: readonly string[]
  interaction: ControlInteractionState
  cameraCommand: CameraCommand | null
  guidedCameraActive: boolean
  guidedCameraShotId: string | null
  guidedCameraTransitionEventId: string | null
  guidedCameraSkipRevision: number
  suppressedGuidedCameraTransitionEventIds: readonly string[]
  guidedCameraRestPose: GuidedCameraRestPose | null
  interfaceTonesEnabled: boolean
  setStoryTime: (storyTimeMs: number) => void
  setMet: (metSeconds: number) => void
  restoreTraversalMet: (metSeconds: number, visualState?: VisualTransitionRestoreState) => void
  advancePlayback: (wallDeltaMs: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setPlaybackPolicy: (policy: PlaybackPolicy) => void
  setSpeed: (speed: PlaybackSpeed) => void
  setQuality: (quality: ModelQuality) => void
  setSceneRuntime: (
    availability: SceneAvailability,
    inspectableComponentIds?: readonly string[],
  ) => void
  pauseForInterruption: (reason: PlaybackPauseReason) => void
  pauseForModeSwitch: () => void
  resumeInterruptedPlayback: () => void
  resumeAfterModeSwitch: () => void
  dismissResume: () => void
  beginEditorialPause: (segmentId: string, storyTimeMs: number) => void
  continueEditorialPause: () => void
  enterFreeLook: () => void
  returnToGuided: () => void
  requestCameraCommand: (kind: CameraCommandKind) => void
  setGuidedCameraStatus: (active: boolean, shotId?: string, transitionEventId?: string) => void
  skipGuidedCamera: () => void
  setInterfaceTonesEnabled: (enabled: boolean) => void
  setGuidedCameraRestPose: (pose: GuidedCameraRestPose | null) => void
  inspectComponent: (componentId: string) => void
  closeInspection: () => void
  nextEvent: () => number | undefined
  previousEvent: () => number
}

function clampMet(value: number): number {
  return Math.min(replayEndMet, Math.max(replayStartMet, value))
}

function clampStoryTime(value: number): number {
  return Math.min(replayEndStoryTime, Math.max(replayStartStoryTime, value))
}

function currentMet(state: Pick<MissionUiState, 'storyTimeMs'>): number {
  return metAtStoryTime(mission.narrative, state.storyTimeMs)
}

const replayEventStoryTimes = replayEvents.map((event) => ({
  id: event.id,
  storyTimeMs: storyTimeAtMet(mission.narrative, event.metSeconds),
}))
const MAX_VISUAL_TRANSITION_ANCHORS = 12

function captureVisualTransitionAnchors(
  state: Pick<MissionUiState, 'storyTimeMs' | 'visualTimeMs' | 'visualTransitionAnchors' | 'speed'>,
  nextStoryTimeMs: number,
): VisualTransitionAnchors {
  const crossed = replayEventStoryTimes.filter(
    (event) => event.storyTimeMs > state.storyTimeMs && event.storyTimeMs <= nextStoryTimeMs,
  )
  if (crossed.length === 0) return state.visualTransitionAnchors

  const anchors = new Map(Object.entries(state.visualTransitionAnchors))
  for (const event of crossed) {
    anchors.set(
      event.id,
      state.visualTimeMs + (event.storyTimeMs - state.storyTimeMs) / state.speed,
    )
  }
  return Object.fromEntries(
    [...anchors.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, MAX_VISUAL_TRANSITION_ANCHORS),
  )
}

function withoutInspectResume(interaction: ControlInteractionState): ControlInteractionState {
  return interaction.mode === 'inspect'
    ? { ...interaction, resumePlaybackOnClose: false }
    : interaction
}

export const useMissionStore = create<MissionUiState>((set, get) => ({
  storyTimeMs: replayStartStoryTime,
  visualTimeMs: 0,
  visualTransitionAnchors: {},
  playing: false,
  resumeAvailable: false,
  pauseReason: null,
  editorialPauseSegmentId: null,
  playbackPolicy: 'guided',
  speed: 100,
  quality: 'medium',
  sceneAvailability: 'loading',
  runtimeInspectableComponentIds: [],
  interaction: { mode: 'guided' },
  cameraCommand: null,
  guidedCameraActive: false,
  guidedCameraShotId: null,
  guidedCameraTransitionEventId: null,
  guidedCameraSkipRevision: 0,
  suppressedGuidedCameraTransitionEventIds: [],
  guidedCameraRestPose: null,
  interfaceTonesEnabled: false,
  setStoryTime: (storyTimeMs) =>
    set({
      storyTimeMs: clampStoryTime(storyTimeMs),
      visualTimeMs: 0,
      visualTransitionAnchors: {},
      suppressedGuidedCameraTransitionEventIds: [],
      guidedCameraRestPose: null,
    }),
  setMet: (metSeconds) =>
    set({
      storyTimeMs: storyTimeAtMet(mission.narrative, clampMet(metSeconds)),
      visualTimeMs: 0,
      visualTransitionAnchors: {},
      resumeAvailable: false,
      pauseReason: null,
      editorialPauseSegmentId: null,
      guidedCameraActive: false,
      guidedCameraShotId: null,
      guidedCameraTransitionEventId: null,
      suppressedGuidedCameraTransitionEventIds: [],
      guidedCameraRestPose: null,
    }),
  restoreTraversalMet: (metSeconds, visualState) =>
    set({
      storyTimeMs: storyTimeAtMet(mission.narrative, clampMet(metSeconds)),
      visualTimeMs: visualState?.visualTimeMs ?? 0,
      visualTransitionAnchors: visualState?.visualTransitionAnchors ?? {},
      playing: false,
      guidedCameraActive: false,
      guidedCameraShotId: null,
      guidedCameraTransitionEventId: null,
      suppressedGuidedCameraTransitionEventIds:
        visualState?.suppressedGuidedCameraTransitionEventIds ?? [],
      guidedCameraRestPose: visualState?.guidedCameraRestPose ?? null,
    }),
  advancePlayback: (wallDeltaMs) => {
    if (!Number.isFinite(wallDeltaMs) || wallDeltaMs < 0) {
      throw new RangeError('Playback wall delta must be a finite non-negative number')
    }
    const state = get()
    if (!state.playing) return

    const next = Math.min(replayEndStoryTime, state.storyTimeMs + wallDeltaMs * state.speed)
    if (state.playbackPolicy === 'procedure') {
      const pauseSegment = replayNarrative.find(
        (segment) =>
          (segment.presentationPauseMs ?? 0) > 0 &&
          state.storyTimeMs <= segment.motionEndMs &&
          next > segment.motionEndMs,
      )
      if (pauseSegment) {
        get().beginEditorialPause(pauseSegment.id, pauseSegment.motionEndMs + 0.001)
        return
      }
    }

    set({
      storyTimeMs: next,
      visualTimeMs: Math.min(replayEndStoryTime, state.visualTimeMs + wallDeltaMs),
      visualTransitionAnchors: captureVisualTransitionAnchors(state, next),
      ...(next >= replayEndStoryTime ? { playing: false } : {}),
    })
  },
  setPlaying: (playing) =>
    set({
      playing,
      resumeAvailable: false,
      pauseReason: null,
      ...(playing ? { editorialPauseSegmentId: null } : {}),
    }),
  togglePlaying: () => {
    if (get().editorialPauseSegmentId) {
      get().continueEditorialPause()
      return
    }
    if (get().interaction.mode === 'inspect') return
    set((state) => ({
      playing: !state.playing,
      resumeAvailable: false,
      pauseReason: null,
    }))
  },
  setPlaybackPolicy: (playbackPolicy) => set({ playbackPolicy }),
  setSpeed: (speed) =>
    set((state) => ({
      speed,
      ...(state.speed >= 100 !== speed >= 100
        ? {
            visualTransitionAnchors: {},
            suppressedGuidedCameraTransitionEventIds: [],
            guidedCameraRestPose: null,
          }
        : {}),
    })),
  setQuality: (quality) => set({ quality }),
  setSceneRuntime: (sceneAvailability, componentIds = []) =>
    set((state) => {
      // Loading is not evidence that an inspected semantic node disappeared.
      // Preserve the paused inspection transaction until a definitive runtime
      // result (ready/fallback) can validate its binding.
      if (sceneAvailability === 'loading') return { sceneAvailability }
      const runtimeInspectableComponentIds = [...new Set(componentIds)].sort()
      if (
        state.interaction.mode === 'inspect' &&
        !runtimeInspectableComponentIds.includes(state.interaction.componentId)
      ) {
        return {
          sceneAvailability,
          runtimeInspectableComponentIds,
          interaction: { mode: state.interaction.returnMode },
          playing: state.interaction.resumePlaybackOnClose,
        }
      }
      return { sceneAvailability, runtimeInspectableComponentIds }
    }),
  pauseForInterruption: (pauseReason) => {
    const state = get()
    const inspectWouldResume =
      state.interaction.mode === 'inspect' && state.interaction.resumePlaybackOnClose
    if (!state.playing && !inspectWouldResume && !state.resumeAvailable) return
    set({
      playing: false,
      resumeAvailable: state.resumeAvailable || state.playing || inspectWouldResume,
      pauseReason: state.pauseReason ?? pauseReason,
      interaction: withoutInspectResume(state.interaction),
    })
  },
  pauseForModeSwitch: () => get().pauseForInterruption('mode-switch'),
  resumeInterruptedPlayback: () => {
    const state = get()
    if (!state.resumeAvailable || state.interaction.mode === 'inspect') return
    set({ playing: true, resumeAvailable: false, pauseReason: null })
  },
  resumeAfterModeSwitch: () => get().resumeInterruptedPlayback(),
  dismissResume: () => set({ resumeAvailable: false, pauseReason: null }),
  beginEditorialPause: (segmentId, storyTimeMs) =>
    set({
      storyTimeMs: clampStoryTime(storyTimeMs),
      playing: false,
      resumeAvailable: false,
      pauseReason: null,
      editorialPauseSegmentId: segmentId,
      visualTransitionAnchors: {},
      suppressedGuidedCameraTransitionEventIds: [],
    }),
  continueEditorialPause: () => {
    const segment = replayNarrative.find(
      (candidate) => candidate.id === get().editorialPauseSegmentId,
    )
    if (!segment) return
    set({
      storyTimeMs: clampStoryTime(
        segment.storyEndMs < replayEndStoryTime ? segment.storyEndMs + 0.001 : segment.storyEndMs,
      ),
      playing: segment.storyEndMs < replayEndStoryTime,
      resumeAvailable: false,
      pauseReason: null,
      editorialPauseSegmentId: null,
      visualTransitionAnchors: {},
      suppressedGuidedCameraTransitionEventIds: [],
    })
  },
  enterFreeLook: () =>
    set((state) => ({
      interaction:
        state.interaction.mode === 'inspect'
          ? { ...state.interaction, cameraControl: 'free-look' }
          : { mode: 'free-look' },
      guidedCameraActive: false,
      guidedCameraShotId: null,
      guidedCameraTransitionEventId: null,
    })),
  returnToGuided: () =>
    set((state) => ({
      interaction:
        state.interaction.mode === 'inspect'
          ? { ...state.interaction, cameraControl: 'guided-focus' }
          : { mode: 'guided' },
      cameraCommand: null,
    })),
  requestCameraCommand: (kind) =>
    set((state) => ({
      interaction:
        state.interaction.mode === 'inspect'
          ? { ...state.interaction, cameraControl: 'free-look' }
          : { mode: 'free-look' },
      cameraCommand: { kind, revision: (state.cameraCommand?.revision ?? 0) + 1 },
      guidedCameraActive: false,
      guidedCameraShotId: null,
      guidedCameraTransitionEventId: null,
    })),
  setGuidedCameraStatus: (guidedCameraActive, shotId, transitionEventId) =>
    set({
      guidedCameraActive,
      guidedCameraShotId: guidedCameraActive ? (shotId ?? null) : null,
      guidedCameraTransitionEventId: guidedCameraActive ? (transitionEventId ?? null) : null,
    }),
  skipGuidedCamera: () =>
    set((state) =>
      state.guidedCameraActive
        ? {
            guidedCameraSkipRevision: state.guidedCameraSkipRevision + 1,
            guidedCameraActive: false,
            guidedCameraShotId: null,
            guidedCameraTransitionEventId: null,
            suppressedGuidedCameraTransitionEventIds: state.guidedCameraTransitionEventId
              ? [
                  ...state.suppressedGuidedCameraTransitionEventIds.filter(
                    (eventId) => eventId !== state.guidedCameraTransitionEventId,
                  ),
                  state.guidedCameraTransitionEventId,
                ].slice(-MAX_VISUAL_TRANSITION_ANCHORS)
              : state.suppressedGuidedCameraTransitionEventIds,
          }
        : state,
    ),
  setInterfaceTonesEnabled: (interfaceTonesEnabled) => set({ interfaceTonesEnabled }),
  setGuidedCameraRestPose: (guidedCameraRestPose) => set({ guidedCameraRestPose }),
  inspectComponent: (componentId) =>
    set((state) => {
      if (
        state.sceneAvailability !== 'ready' ||
        !state.runtimeInspectableComponentIds.includes(componentId)
      ) {
        return state
      }
      if (state.interaction.mode === 'inspect') {
        return {
          interaction: {
            ...state.interaction,
            componentId,
            cameraControl:
              state.interaction.componentId === componentId
                ? state.interaction.cameraControl
                : 'guided-focus',
          },
        }
      }
      return {
        playing: false,
        interaction: {
          mode: 'inspect',
          componentId,
          returnMode: state.interaction.mode,
          resumePlaybackOnClose: state.playing,
          cameraControl: 'guided-focus',
        },
      }
    }),
  closeInspection: () => {
    const state = get()
    if (state.interaction.mode !== 'inspect') return
    set({
      interaction: { mode: state.interaction.returnMode },
      playing: state.interaction.resumePlaybackOnClose,
    })
  },
  nextEvent: () => {
    const metSeconds = currentMet(get())
    const next = replayEvents.find((event) => event.metSeconds > metSeconds + 0.01)
    if (next) get().setMet(next.metSeconds)
    set({ playing: false })
    return next?.metSeconds
  },
  previousEvent: () => {
    const metSeconds = currentMet(get())
    const candidates = replayEvents.filter((event) => event.metSeconds < metSeconds - 0.01)
    const previous = candidates.at(-1)
    const targetMet = previous?.metSeconds ?? replayStartMet
    set({
      storyTimeMs: storyTimeAtMet(mission.narrative, targetMet),
      visualTimeMs: 0,
      playing: false,
      resumeAvailable: false,
      pauseReason: null,
      editorialPauseSegmentId: null,
      visualTransitionAnchors: {},
      suppressedGuidedCameraTransitionEventIds: [],
      guidedCameraRestPose: null,
    })
    return targetMet
  },
}))
