import { create } from 'zustand'

import { replayEndMet, replayEvents, replayStartMet } from './mission.ts'

export type PlaybackSpeed = 1 | 10 | 100 | 1000
export type ModelQuality = 'high' | 'medium' | 'low' | 'fallback'

interface MissionUiState {
  metSeconds: number
  playing: boolean
  speed: PlaybackSpeed
  quality: ModelQuality
  setMet: (metSeconds: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setSpeed: (speed: PlaybackSpeed) => void
  setQuality: (quality: ModelQuality) => void
  nextEvent: () => void
  previousEvent: () => void
}

function clampMet(value: number): number {
  return Math.min(replayEndMet, Math.max(replayStartMet, value))
}

export const useMissionStore = create<MissionUiState>((set, get) => ({
  metSeconds: replayStartMet,
  playing: false,
  speed: 100,
  quality: 'medium',
  setMet: (metSeconds) => set({ metSeconds: clampMet(metSeconds) }),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((state) => ({ playing: !state.playing })),
  setSpeed: (speed) => set({ speed }),
  setQuality: (quality) => set({ quality }),
  nextEvent: () => {
    const next = replayEvents.find((event) => event.metSeconds > get().metSeconds + 0.01)
    if (next) set({ metSeconds: next.metSeconds, playing: false })
  },
  previousEvent: () => {
    const candidates = replayEvents.filter((event) => event.metSeconds < get().metSeconds - 0.01)
    const previous = candidates.at(-1)
    set({ metSeconds: previous?.metSeconds ?? replayStartMet, playing: false })
  },
}))
