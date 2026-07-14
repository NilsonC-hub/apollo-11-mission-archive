import { parseMet } from '../mission-core/index.ts'
import { replayEvents } from './mission.ts'

const CONTROL_RELOAD_SNAPSHOT_KEY = 'apollo11.control.reload-snapshot.v1'

export interface ControlPlaybackSnapshot {
  sourcePathname: string
  path: string
  metSeconds: number
}

export function recordControlPlaybackSnapshot(
  sourcePathname: string,
  metSeconds: number,
  preserveSource = false,
): void {
  if (typeof sessionStorage === 'undefined') return
  let preservedSource: string | undefined
  if (preserveSource) {
    try {
      preservedSource = (
        JSON.parse(
          sessionStorage.getItem(CONTROL_RELOAD_SNAPSHOT_KEY) ?? 'null',
        ) as Partial<ControlPlaybackSnapshot> | null
      )?.sourcePathname
    } catch {
      preservedSource = undefined
    }
  }
  const snapshot: ControlPlaybackSnapshot = {
    sourcePathname: preservedSource ?? sourcePathname,
    path: controlMetPath(metSeconds),
    metSeconds,
  }
  sessionStorage.setItem(CONTROL_RELOAD_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function consumeControlReloadSnapshot(
  pathname: string,
): ControlPlaybackSnapshot | undefined {
  if (typeof sessionStorage === 'undefined' || typeof performance === 'undefined') return undefined
  const navigation = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined
  if (navigation?.type !== 'reload') return undefined

  const serialized = sessionStorage.getItem(CONTROL_RELOAD_SNAPSHOT_KEY)
  if (!serialized) return undefined
  try {
    const snapshot = JSON.parse(serialized) as Partial<ControlPlaybackSnapshot>
    if (
      snapshot.sourcePathname !== pathname ||
      typeof snapshot.path !== 'string' ||
      typeof snapshot.metSeconds !== 'number' ||
      !Number.isFinite(snapshot.metSeconds) ||
      metForControlPath(snapshot.path) !== snapshot.metSeconds
    ) {
      return undefined
    }
    return snapshot as ControlPlaybackSnapshot
  } catch {
    return undefined
  }
}

export function clearControlReloadSnapshot(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(CONTROL_RELOAD_SNAPSHOT_KEY)
  }
}

export function metForControlPath(pathname: string): number | undefined {
  const eventMatch = /^\/control\/event\/([^/]+)\/?$/.exec(pathname)
  if (eventMatch) {
    const eventId = decodeURIComponent(eventMatch[1])
    return replayEvents.find((event) => event.id === eventId)?.metSeconds
  }

  const metMatch = /^\/control\/met\/([^/]+)\/?$/.exec(pathname)
  if (!metMatch) return undefined

  try {
    const token = decodeURIComponent(metMatch[1])
    if (/^s-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) {
      const value = Number(token.slice(1))
      return Number.isFinite(value) ? value : undefined
    }
    return parseMet(token)
  } catch {
    return undefined
  }
}

export function controlMetPath(metSeconds: number): string {
  if (!Number.isFinite(metSeconds)) throw new TypeError('Control MET must be finite')
  return `/control/met/${encodeURIComponent(`s${metSeconds.toString()}`)}`
}

export function controlEventPath(eventId: string): string {
  return `/control/event/${encodeURIComponent(eventId)}`
}
