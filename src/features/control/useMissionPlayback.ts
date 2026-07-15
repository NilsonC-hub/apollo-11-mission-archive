import { useEffect, useRef } from 'react'

import {
  controlMetPath,
  isControlPlaybackPath,
  recordControlPlaybackSnapshot,
} from '../../app/controlDeepLink.ts'
import { snapshotActiveControlHistoryEntry } from '../../app/controlTraversal.ts'
import { mission } from '../../app/mission.ts'
import { useMissionStore } from '../../app/missionStore.ts'
import { metAtStoryTime } from '../../mission-core/index.ts'

interface NavigationSourceRef {
  current: string | null
}

function flushPlaybackUrl(
  navigationSource: NavigationSourceRef,
  persistReloadSnapshot = true,
): void {
  if (!isControlPlaybackPath(window.location.pathname)) return
  const state = useMissionStore.getState()
  const met = metAtStoryTime(mission.narrative, state.storyTimeMs)
  if (persistReloadSnapshot) {
    recordControlPlaybackSnapshot(navigationSource.current ?? window.location.pathname, met, {
      speed: state.speed,
      visualTimeMs: state.visualTimeMs,
      visualTransitionAnchors: state.visualTransitionAnchors,
      suppressedGuidedCameraTransitionEventIds: state.suppressedGuidedCameraTransitionEventIds,
      guidedCameraRestPose: state.guidedCameraRestPose,
    })
  }
  window.history.replaceState(window.history.state, '', controlMetPath(met))
}

function usePlaybackInterruptionSafety(navigationSource: NavigationSourceRef): void {
  useEffect(() => {
    const pause = useMissionStore.getState().pauseForInterruption
    const interrupt = (reason: 'visibility' | 'page-hide' | 'focus-loss') => {
      flushPlaybackUrl(navigationSource)
      pause(reason)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') interrupt('visibility')
    }
    const onPageHide = () => {
      navigationSource.current ??= window.location.pathname
      flushPlaybackUrl(navigationSource)
      pause('page-hide')
    }
    const onBlur = () => interrupt('focus-loss')
    const onBeforeUnload = () => {
      navigationSource.current ??= window.location.pathname
      flushPlaybackUrl(navigationSource)
      // Freeze at the earliest unload boundary. Waiting for pagehide allows a
      // short authored camera/staging transition to advance while the next
      // document is loading, so refresh would no longer reconstruct the pose
      // the user actually left.
      pause('page-hide')
    }
    const onPageShow = () => {
      navigationSource.current = null
    }
    const onDocumentClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      const anchor = target instanceof Element ? target.closest<HTMLAnchorElement>('a[href]') : null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin) return
      if (destination.pathname.startsWith('/control')) {
        snapshotActiveControlHistoryEntry()
      } else {
        flushPlaybackUrl(navigationSource, false)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('click', onDocumentClick, true)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('blur', onBlur)
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('click', onDocumentClick, true)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [navigationSource])
}

function usePlaybackUrlSync(playing: boolean, navigationSource: NavigationSourceRef): void {
  useEffect(
    () =>
      useMissionStore.subscribe((state, previous) => {
        if (previous.playing && !state.playing) flushPlaybackUrl(navigationSource)
      }),
    [navigationSource],
  )

  useEffect(() => {
    if (!playing) return
    const interval = window.setInterval(() => flushPlaybackUrl(navigationSource), 1_000)
    return () => window.clearInterval(interval)
  }, [navigationSource, playing])
}

export function useMissionPlayback(): void {
  const frame = useRef<number | null>(null)
  const previous = useRef<number | null>(null)
  const navigationSource = useRef<string | null>(null)
  const playing = useMissionStore((state) => state.playing)

  usePlaybackInterruptionSafety(navigationSource)
  usePlaybackUrlSync(playing, navigationSource)

  useEffect(() => {
    if (!playing) {
      previous.current = null
      return
    }

    const tick = (now: number) => {
      const prior = previous.current ?? now
      previous.current = now
      useMissionStore.getState().advancePlayback(now - prior)
      if (!useMissionStore.getState().playing) return
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      previous.current = null
    }
  }, [playing])
}
