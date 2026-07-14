import { useEffect, useRef } from 'react'

import { replayEndStoryTime, replayNarrative } from '../../app/mission.ts'
import { useMissionStore } from '../../app/missionStore.ts'

export function useMissionPlayback(): void {
  const frame = useRef<number | null>(null)
  const previous = useRef<number | null>(null)
  const playing = useMissionStore((state) => state.playing)
  const speed = useMissionStore((state) => state.speed)
  const setStoryTime = useMissionStore((state) => state.setStoryTime)
  const setPlaying = useMissionStore((state) => state.setPlaying)
  const beginEditorialPause = useMissionStore((state) => state.beginEditorialPause)

  useEffect(() => {
    if (!playing) {
      previous.current = null
      return
    }

    const tick = (now: number) => {
      const prior = previous.current ?? now
      previous.current = now
      const current = useMissionStore.getState().storyTimeMs
      const next = Math.min(replayEndStoryTime, current + (now - prior) * speed)
      const pauseSegment = replayNarrative.find(
        (segment) =>
          (segment.presentationPauseMs ?? 0) > 0 &&
          current <= segment.motionEndMs &&
          next > segment.motionEndMs,
      )
      if (pauseSegment) {
        beginEditorialPause(pauseSegment.id, pauseSegment.motionEndMs + 0.001)
        return
      }

      setStoryTime(next)
      if (next >= replayEndStoryTime) {
        setPlaying(false)
        return
      }
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      previous.current = null
    }
  }, [beginEditorialPause, playing, setPlaying, setStoryTime, speed])
}
