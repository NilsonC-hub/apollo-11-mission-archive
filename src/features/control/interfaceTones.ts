export type InterfaceToneKind = 'confirm' | 'action'

type AudioContextFactory = () => AudioContext | null

export interface InterfaceToneEngine {
  enable: () => Promise<boolean>
  play: (kind: InterfaceToneKind) => boolean
  disable: () => Promise<void>
  stopForLifecycle: () => void
}

interface ActiveTone {
  oscillator: OscillatorNode
  gain: GainNode
}

/**
 * Builds a serialized, coalescing tone engine. The factory is invoked only by
 * enable(), which the UI calls from an explicit user gesture.
 */
export function createInterfaceToneEngine(
  contextFactory: AudioContextFactory,
): InterfaceToneEngine {
  let context: AudioContext | null = null
  let activeTone: ActiveTone | null = null
  let desiredEnabled = false
  let operationQueue: Promise<unknown> = Promise.resolve()
  let enableRequest: Promise<boolean> | null = null

  const enqueue = <T>(operation: () => Promise<T> | T): Promise<T> => {
    const result = operationQueue.then(operation, operation)
    operationQueue = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  const releaseActiveTone = (stopSource: boolean) => {
    const active = activeTone
    if (!active) return
    activeTone = null
    active.oscillator.onended = null
    if (stopSource) {
      try {
        active.oscillator.stop()
      } catch {
        // The source may already have ended between lifecycle notifications.
      }
    }
    active.oscillator.disconnect()
    active.gain.disconnect()
  }

  const disable = async () => {
    desiredEnabled = false
    releaseActiveTone(true)
    await enqueue(async () => {
      if (desiredEnabled || !context || context.state !== 'running') return
      await context.suspend()
    }).catch(() => undefined)
  }

  return {
    enable: () => {
      desiredEnabled = true
      try {
        context ??= contextFactory()
      } catch {
        desiredEnabled = false
        return Promise.resolve(false)
      }
      if (!context) return Promise.resolve(false)
      if (enableRequest) return enableRequest

      const request = enqueue(async () => {
        if (!desiredEnabled || !context) return false
        if (context.state === 'suspended') await context.resume()
        if (!desiredEnabled) {
          if (context.state === 'running') await context.suspend()
          return false
        }
        return context.state === 'running'
      }).catch(() => false)
      enableRequest = request
      void request.then(() => {
        if (enableRequest === request) enableRequest = null
      })
      return request
    },
    play: (kind) => {
      if (!context || context.state !== 'running' || !desiredEnabled) return false
      releaseActiveTone(true)

      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(kind === 'confirm' ? 620 : 430, now)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(kind === 'confirm' ? 0.026 : 0.018, now + 0.006)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'confirm' ? 0.058 : 0.04))
      oscillator.connect(gain)
      gain.connect(context.destination)
      activeTone = { oscillator, gain }
      oscillator.onended = () => releaseActiveTone(false)
      oscillator.start(now)
      oscillator.stop(now + (kind === 'confirm' ? 0.062 : 0.044))
      return true
    },
    disable,
    stopForLifecycle: () => {
      void disable()
    },
  }
}

type AudioContextConstructor = new () => AudioContext

function browserAudioContext(): AudioContext | null {
  const audioWindow = window as Window & {
    webkitAudioContext?: AudioContextConstructor
  }
  const AudioContextClass = window.AudioContext ?? audioWindow.webkitAudioContext
  return AudioContextClass ? new AudioContextClass() : null
}

const browserEngine = createInterfaceToneEngine(browserAudioContext)

export const enableInterfaceTones = browserEngine.enable
export const playInterfaceTone = browserEngine.play
export const disableInterfaceTones = browserEngine.disable
export const stopInterfaceTones = browserEngine.stopForLifecycle
