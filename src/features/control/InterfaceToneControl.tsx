import { useEffect, useRef, useState } from 'react'

import { useMissionStore } from '../../app/missionStore.ts'
import {
  disableInterfaceTones,
  enableInterfaceTones,
  playInterfaceTone,
  stopInterfaceTones,
} from './interfaceTones.ts'

export function InterfaceToneControl() {
  const enabled = useMissionStore((state) => state.interfaceTonesEnabled)
  const setEnabled = useMissionStore((state) => state.setInterfaceTonesEnabled)
  const [activationFailed, setActivationFailed] = useState(false)
  const [activationPending, setActivationPending] = useState(false)
  const mounted = useRef(true)
  const lifecycleRevision = useRef(0)
  const activationInFlight = useRef(false)

  useEffect(() => {
    // StrictMode runs a setup → cleanup → setup probe in development.
    mounted.current = true
    const stop = () => {
      lifecycleRevision.current += 1
      stopInterfaceTones()
      useMissionStore.getState().setInterfaceTonesEnabled(false)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop()
    }
    window.addEventListener('pagehide', stop)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      mounted.current = false
      window.removeEventListener('pagehide', stop)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stop()
    }
  }, [])

  const toggle = async () => {
    if (activationInFlight.current) return
    activationInFlight.current = true
    const activationRevision = lifecycleRevision.current
    setActivationPending(true)
    if (enabled) {
      await disableInterfaceTones()
      if (mounted.current) {
        setEnabled(false)
        setActivationPending(false)
      }
      activationInFlight.current = false
      return
    }

    const activated = await enableInterfaceTones()
    if (!mounted.current || lifecycleRevision.current !== activationRevision) {
      stopInterfaceTones()
      if (mounted.current) {
        setActivationPending(false)
        activationInFlight.current = false
      }
      return
    }
    setEnabled(activated)
    setActivationFailed(!activated)
    setActivationPending(false)
    activationInFlight.current = false
    if (activated) playInterfaceTone('confirm')
  }

  return (
    <section className="interface-audio-control" aria-label="Audio status and interface tones">
      <div>
        <span>HISTORICAL AUDIO</span>
        <b>UNAVAILABLE</b>
      </div>
      <div>
        <span>INTERFACE TONES</span>
        <button
          type="button"
          aria-pressed={enabled}
          disabled={activationPending}
          onClick={() => void toggle()}
        >
          {activationPending ? 'AUDIO / WAIT' : enabled ? 'ON / DISABLE' : 'OFF / ENABLE'}
        </button>
      </div>
      <p>
        {activationFailed
          ? 'AUDIO OUTPUT UNAVAILABLE IN THIS BROWSER SESSION'
          : 'QUIET UI FEEDBACK · NO HISTORICAL RECORDING CLAIM'}
      </p>
    </section>
  )
}
