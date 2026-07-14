import { parseMet } from '../mission-core/index.ts'
import { replayEvents } from './mission.ts'

const CONTROL_RELOAD_SNAPSHOT_KEY = 'apollo11.control.reload-snapshot.v1'
const CONTROL_TRAVERSAL_SNAPSHOTS_KEY = 'apollo11.control.traversal-snapshots.v1'
const CONTROL_HISTORY_ENTRY_ID_KEY = '__apollo11ControlEntryId'
const MAX_CONTROL_TRAVERSAL_SNAPSHOTS = 32

export interface ControlPlaybackSnapshot {
  sourcePathname: string
  path: string
  metSeconds: number
}

export interface ControlTraversalSnapshot {
  path: string
  metSeconds: number
}

interface StoredControlTraversalSnapshot {
  entryId: string
  path: string
}

function storedControlTraversalSnapshots(): StoredControlTraversalSnapshot[] {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const snapshots = JSON.parse(
      sessionStorage.getItem(CONTROL_TRAVERSAL_SNAPSHOTS_KEY) ?? '[]',
    ) as unknown
    if (!Array.isArray(snapshots)) return []
    return snapshots.filter(
      (snapshot): snapshot is StoredControlTraversalSnapshot =>
        typeof snapshot === 'object' &&
        snapshot !== null &&
        typeof (snapshot as Partial<StoredControlTraversalSnapshot>).entryId === 'string' &&
        typeof (snapshot as Partial<StoredControlTraversalSnapshot>).path === 'string',
    )
  } catch {
    return []
  }
}

export function currentControlHistoryEntryId(locationKey: string): string {
  if (typeof history !== 'undefined') {
    const state = history.state as Record<string, unknown> | null
    const entryId = state?.[CONTROL_HISTORY_ENTRY_ID_KEY]
    if (typeof entryId === 'string' && entryId.startsWith(`control:${locationKey}:`)) {
      return entryId
    }
  }
  return `location:${locationKey}`
}

export function ensureControlHistoryEntryId(locationKey: string): string {
  const current = currentControlHistoryEntryId(locationKey)
  if (!current.startsWith('location:') || typeof history === 'undefined') return current
  const state =
    typeof history.state === 'object' && history.state !== null
      ? (history.state as Record<string, unknown>)
      : {}
  const entryId = `control:${locationKey}:${crypto.randomUUID()}`
  history.replaceState({ ...state, [CONTROL_HISTORY_ENTRY_ID_KEY]: entryId }, '')
  return entryId
}

export function recordControlTraversalSnapshot(entryId: string, metSeconds: number): void {
  if (typeof sessionStorage === 'undefined' || entryId.length === 0) return
  const snapshots = storedControlTraversalSnapshots().filter(
    (snapshot) => snapshot.entryId !== entryId,
  )
  snapshots.push({ entryId, path: controlMetPath(metSeconds) })
  sessionStorage.setItem(
    CONTROL_TRAVERSAL_SNAPSHOTS_KEY,
    JSON.stringify(snapshots.slice(-MAX_CONTROL_TRAVERSAL_SNAPSHOTS)),
  )
}

export function readControlTraversalSnapshot(
  entryId: string,
): ControlTraversalSnapshot | undefined {
  const snapshot = storedControlTraversalSnapshots().findLast(
    (candidate) => candidate.entryId === entryId,
  )
  if (!snapshot) return undefined
  const metSeconds = metForControlPath(snapshot.path)
  if (metSeconds === undefined || !Number.isFinite(metSeconds)) return undefined
  return { path: snapshot.path, metSeconds }
}

export function clearControlTraversalSnapshot(entryId: string): void {
  if (typeof sessionStorage === 'undefined') return
  const snapshots = storedControlTraversalSnapshots().filter(
    (snapshot) => snapshot.entryId !== entryId,
  )
  if (snapshots.length === 0) sessionStorage.removeItem(CONTROL_TRAVERSAL_SNAPSHOTS_KEY)
  else sessionStorage.setItem(CONTROL_TRAVERSAL_SNAPSHOTS_KEY, JSON.stringify(snapshots))
}

export function recordControlPlaybackSnapshot(sourcePathname: string, metSeconds: number): void {
  if (typeof sessionStorage === 'undefined') return
  const snapshot: ControlPlaybackSnapshot = {
    sourcePathname,
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
    const metSeconds =
      typeof snapshot.path === 'string' ? metForControlPath(snapshot.path) : undefined
    if (
      snapshot.sourcePathname !== pathname ||
      typeof snapshot.path !== 'string' ||
      metSeconds === undefined ||
      !Number.isFinite(metSeconds)
    ) {
      return undefined
    }
    return {
      sourcePathname: snapshot.sourcePathname,
      path: snapshot.path,
      metSeconds,
    }
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
  const token = Object.is(metSeconds, -0) ? '-0' : metSeconds.toString()
  return `/control/met/${encodeURIComponent(`s${token}`)}`
}

export function controlEventPath(eventId: string): string {
  return `/control/event/${encodeURIComponent(eventId)}`
}
