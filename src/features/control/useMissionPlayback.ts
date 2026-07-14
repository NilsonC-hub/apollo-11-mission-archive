import { useEffect, useRef } from 'react'

import { useMissionStore } from '../../app/missionStore.ts'

function usePlaybackInterruptionSafety(): void {
  useEffect(() => {
    const pause = useMissionStore.getState().pauseForInterruption
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pause('visibility')
    }
    const onPageHide = () => pause('page-hide')
    const onBlur = () => pause('focus-loss')

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

export function useMissionPlayback(): void {
  const frame = useRef<number | null>(null)
  const previous = useRef<number | null>(null)
  const playing = useMissionStore((state) => state.playing)

  usePlaybackInterruptionSafety()

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
