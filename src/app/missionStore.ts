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

interface MissionUiState {
  storyTimeMs: number
  visualTimeMs: number
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
  setStoryTime: (storyTimeMs: number) => void
  setMet: (metSeconds: number) => void
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

function withoutInspectResume(interaction: ControlInteractionState): ControlInteractionState {
  return interaction.mode === 'inspect'
    ? { ...interaction, resumePlaybackOnClose: false }
    : interaction
}

export const useMissionStore = create<MissionUiState>((set, get) => ({
  storyTimeMs: replayStartStoryTime,
  visualTimeMs: 0,
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
  setStoryTime: (storyTimeMs) => set({ storyTimeMs: clampStoryTime(storyTimeMs) }),
  setMet: (metSeconds) =>
    set({
      storyTimeMs: storyTimeAtMet(mission.narrative, clampMet(metSeconds)),
      visualTimeMs: 0,
      resumeAvailable: false,
      pauseReason: null,
      editorialPauseSegmentId: null,
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
      visualTimeMs: state.visualTimeMs + wallDeltaMs,
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
  setSpeed: (speed) => set({ speed }),
  setQuality: (quality) => set({ quality }),
  setSceneRuntime: (sceneAvailability, componentIds = []) =>
    set((state) => {
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
    })
  },
  enterFreeLook: () =>
    set((state) => ({
      interaction:
        state.interaction.mode === 'inspect'
          ? { ...state.interaction, cameraControl: 'free-look' }
          : { mode: 'free-look' },
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
    })),
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
    })
    return targetMet
  },
}))
