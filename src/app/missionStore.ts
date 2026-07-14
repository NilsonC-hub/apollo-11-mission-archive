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
export type ModelQuality = 'high' | 'medium' | 'low' | 'fallback'

interface MissionUiState {
  storyTimeMs: number
  playing: boolean
  resumeAvailable: boolean
  editorialPauseSegmentId: string | null
  speed: PlaybackSpeed
  quality: ModelQuality
  setStoryTime: (storyTimeMs: number) => void
  setMet: (metSeconds: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setSpeed: (speed: PlaybackSpeed) => void
  setQuality: (quality: ModelQuality) => void
  pauseForModeSwitch: () => void
  resumeAfterModeSwitch: () => void
  dismissResume: () => void
  beginEditorialPause: (segmentId: string, storyTimeMs: number) => void
  continueEditorialPause: () => void
  nextEvent: () => void
  previousEvent: () => void
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

export const useMissionStore = create<MissionUiState>((set, get) => ({
  storyTimeMs: replayStartStoryTime,
  playing: false,
  resumeAvailable: false,
  editorialPauseSegmentId: null,
  speed: 100,
  quality: 'medium',
  setStoryTime: (storyTimeMs) => set({ storyTimeMs: clampStoryTime(storyTimeMs) }),
  setMet: (metSeconds) =>
    set({
      storyTimeMs: storyTimeAtMet(mission.narrative, clampMet(metSeconds)),
      resumeAvailable: false,
      editorialPauseSegmentId: null,
    }),
  setPlaying: (playing) => set({ playing, resumeAvailable: false }),
  togglePlaying: () => {
    if (get().editorialPauseSegmentId) {
      get().continueEditorialPause()
      return
    }
    set((state) => ({ playing: !state.playing, resumeAvailable: false }))
  },
  setSpeed: (speed) => set({ speed }),
  setQuality: (quality) => set({ quality }),
  pauseForModeSwitch: () => {
    if (get().playing) set({ playing: false, resumeAvailable: true })
  },
  resumeAfterModeSwitch: () => {
    if (get().resumeAvailable) set({ playing: true, resumeAvailable: false })
  },
  dismissResume: () => set({ resumeAvailable: false }),
  beginEditorialPause: (segmentId, storyTimeMs) =>
    set({
      storyTimeMs: clampStoryTime(storyTimeMs),
      playing: false,
      resumeAvailable: false,
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
      editorialPauseSegmentId: null,
    })
  },
  nextEvent: () => {
    const metSeconds = currentMet(get())
    const next = replayEvents.find((event) => event.metSeconds > metSeconds + 0.01)
    if (next) get().setMet(next.metSeconds)
    set({ playing: false })
  },
  previousEvent: () => {
    const metSeconds = currentMet(get())
    const candidates = replayEvents.filter((event) => event.metSeconds < metSeconds - 0.01)
    const previous = candidates.at(-1)
    set({
      storyTimeMs: storyTimeAtMet(mission.narrative, previous?.metSeconds ?? replayStartMet),
      playing: false,
      resumeAvailable: false,
      editorialPauseSegmentId: null,
    })
  },
}))
