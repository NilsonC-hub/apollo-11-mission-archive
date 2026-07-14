import { metAtStoryTime } from '../mission-core/index.ts'
import { recordControlTraversalSnapshot } from './controlDeepLink.ts'
import { mission } from './mission.ts'
import { useMissionStore } from './missionStore.ts'

let activeControlEntryId: string | null = null
let popCaptureInstalled = false

export function setActiveControlHistoryEntry(entryId: string | null): void {
  activeControlEntryId = entryId
}

export function snapshotActiveControlHistoryEntry(): void {
  if (!activeControlEntryId) return
  const state = useMissionStore.getState()
  const metSeconds = metAtStoryTime(mission.narrative, state.storyTimeMs)
  recordControlTraversalSnapshot(activeControlEntryId, metSeconds)
}

export function snapshotAndPauseActiveControlHistoryEntry(): void {
  try {
    snapshotActiveControlHistoryEntry()
  } finally {
    useMissionStore.getState().pauseForModeSwitch()
  }
}

export function installControlPopTraversalCapture(): void {
  if (popCaptureInstalled || typeof window === 'undefined') return
  popCaptureInstalled = true
  window.addEventListener('popstate', snapshotActiveControlHistoryEntry)
}
