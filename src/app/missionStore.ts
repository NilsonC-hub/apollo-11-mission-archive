import { create } from 'zustand'

import { phase4EndMet, phase4Events, phase4StartMet } from './mission.ts'

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
  return Math.min(phase4EndMet, Math.max(phase4StartMet, value))
}

export const useMissionStore = create<MissionUiState>((set, get) => ({
  metSeconds: phase4StartMet,
  playing: false,
  speed: 100,
  quality: 'medium',
  setMet: (metSeconds) => set({ metSeconds: clampMet(metSeconds) }),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((state) => ({ playing: !state.playing })),
  setSpeed: (speed) => set({ speed }),
  setQuality: (quality) => set({ quality }),
  nextEvent: () => {
    const next = phase4Events.find((event) => event.metSeconds > get().metSeconds + 0.01)
    if (next) set({ metSeconds: next.metSeconds, playing: false })
  },
  previousEvent: () => {
    const candidates = phase4Events.filter((event) => event.metSeconds < get().metSeconds - 0.01)
    const previous = candidates.at(-1)
    set({ metSeconds: previous?.metSeconds ?? phase4StartMet, playing: false })
  },
}))
