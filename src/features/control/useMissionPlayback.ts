import { useEffect, useRef } from 'react'

import { controlMetPath } from '../../app/controlDeepLink.ts'
import { mission } from '../../app/mission.ts'
import { useMissionStore } from '../../app/missionStore.ts'
import { metAtStoryTime } from '../../mission-core/index.ts'

function flushPlaybackUrl(): void {
  if (!window.location.pathname.startsWith('/control')) return
  const state = useMissionStore.getState()
  const met = metAtStoryTime(mission.narrative, state.storyTimeMs)
  window.history.replaceState(window.history.state, '', controlMetPath(met))
}

function usePlaybackInterruptionSafety(): void {
  useEffect(() => {
    const pause = useMissionStore.getState().pauseForInterruption
    const interrupt = (reason: 'visibility' | 'page-hide' | 'focus-loss') => {
      flushPlaybackUrl()
      pause(reason)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') interrupt('visibility')
    }
    const onPageHide = () => interrupt('page-hide')
    const onBlur = () => interrupt('focus-loss')

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}

function usePlaybackUrlSync(playing: boolean): void {
  useEffect(
    () =>
      useMissionStore.subscribe((state, previous) => {
        if (previous.playing && !state.playing) flushPlaybackUrl()
      }),
    [],
  )

  useEffect(() => {
    if (!playing) return
    const interval = window.setInterval(flushPlaybackUrl, 1_000)
    return () => window.clearInterval(interval)
  }, [playing])
}

export function useMissionPlayback(): void {
  const frame = useRef<number | null>(null)
  const previous = useRef<number | null>(null)
  const playing = useMissionStore((state) => state.playing)

  usePlaybackInterruptionSafety()
  usePlaybackUrlSync(playing)

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
