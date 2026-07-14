import { useEffect, useRef } from 'react'

import { replayEndMet } from '../../app/mission.ts'
import { useMissionStore } from '../../app/missionStore.ts'

export function useMissionPlayback(): void {
  const frame = useRef<number | null>(null)
  const previous = useRef<number | null>(null)
  const playing = useMissionStore((state) => state.playing)
  const speed = useMissionStore((state) => state.speed)
  const setMet = useMissionStore((state) => state.setMet)
  const setPlaying = useMissionStore((state) => state.setPlaying)

  useEffect(() => {
    if (!playing) {
      previous.current = null
      return
    }

    const tick = (now: number) => {
      const prior = previous.current ?? now
      previous.current = now
      const deltaSeconds = (now - prior) / 1000

      const current = useMissionStore.getState().metSeconds
      const next = Math.min(replayEndMet, current + deltaSeconds * speed)
      setMet(next)
      if (next >= replayEndMet) {
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
  }, [playing, setMet, setPlaying, speed])
}
