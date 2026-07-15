import { metAtStoryTime } from '../mission-core/index.ts'
import { recordControlTraversalSnapshot } from './controlDeepLink.ts'
import { mission } from './mission.ts'
import { useMissionStore } from './missionStore.ts'

let activeControlEntry: { entryId: string; pathname: string | null } | null = null
let popCaptureInstalled = false

export function setActiveControlHistoryEntry(
  entryId: string | null,
  pathname: string | null = null,
): void {
  activeControlEntry = entryId ? { entryId, pathname } : null
}

export function snapshotActiveControlHistoryEntry(): void {
  if (!activeControlEntry) return
  const state = useMissionStore.getState()
  const metSeconds = metAtStoryTime(mission.narrative, state.storyTimeMs)
  recordControlTraversalSnapshot(
    activeControlEntry.entryId,
    metSeconds,
    activeControlEntry.pathname ?? undefined,
    {
      visualTimeMs: state.visualTimeMs,
      visualTransitionAnchors: state.visualTransitionAnchors,
      suppressedGuidedCameraTransitionEventIds: state.suppressedGuidedCameraTransitionEventIds,
      guidedCameraRestPose: state.guidedCameraRestPose,
    },
  )
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
