import { parseMet } from '../mission-core/index.ts'
import { replayEndStoryTime, replayEvents, replayStartMet } from './mission.ts'
import { GUIDED_CAMERA_REST_POSE_SHOT_IDS, type GuidedCameraRestPose } from './missionStore.ts'

const CONTROL_RELOAD_SNAPSHOT_KEY = 'apollo11.control.reload-snapshot.v1'
const CONTROL_TRAVERSAL_SNAPSHOTS_KEY = 'apollo11.control.traversal-snapshots.v1'
const CONTROL_HISTORY_ENTRY_ID_KEY = '__apollo11ControlEntryId'
const MAX_CONTROL_TRAVERSAL_SNAPSHOTS = 32
const CONTROL_MET_INVERSE_EPSILON_SECONDS = 1e-9
export const SATURN_V_INSPECTOR_PATH = '/control/inspect/saturn-v'

export function isControlReferencePath(pathname: string): boolean {
  return pathname.replace(/\/+$/, '') === SATURN_V_INSPECTOR_PATH
}

export function isControlPlaybackPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized === '/control' || /^\/control\/(?:event|met)\/[^/]+$/.test(normalized)
}

function controlMetSemanticallyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= CONTROL_MET_INVERSE_EPSILON_SECONDS
}

function controlReloadBootPathname(): string | null {
  if (
    typeof location === 'undefined' ||
    typeof performance === 'undefined' ||
    !isControlPlaybackPath(location.pathname)
  ) {
    return null
  }
  const navigation = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined
  return navigation?.type === 'reload' ? location.pathname : null
}

const CONTROL_RELOAD_BOOT_PATHNAME = controlReloadBootPathname()

export interface ControlPlaybackSnapshot {
  sourcePathname: string
  path: string
  metSeconds: number
  visualTimeMs: number
  visualTransitionAnchors: Readonly<Record<string, number>>
  suppressedGuidedCameraTransitionEventIds: readonly string[]
  guidedCameraRestPose: GuidedCameraRestPose | null
}

export interface ControlTraversalSnapshot {
  path: string
  metSeconds: number
  visualTimeMs: number
  visualTransitionAnchors: Readonly<Record<string, number>>
  suppressedGuidedCameraTransitionEventIds: readonly string[]
  guidedCameraRestPose: GuidedCameraRestPose | null
}

interface StoredControlTraversalSnapshot {
  entryId: string
  path: string
  visualTimeMs?: unknown
  visualTransitionAnchors?: unknown
  suppressedGuidedCameraTransitionEventIds?: unknown
  guidedCameraRestPose?: unknown
}

export interface ControlVisualSnapshotState {
  visualTimeMs: number
  visualTransitionAnchors: Readonly<Record<string, number>>
  suppressedGuidedCameraTransitionEventIds: readonly string[]
  guidedCameraRestPose: GuidedCameraRestPose | null
}

const canonicalReplayEventIds = new Set(replayEvents.map((event) => event.id))
const canonicalGuidedCameraShotIds = new Set<string>(GUIDED_CAMERA_REST_POSE_SHOT_IDS)
const MAX_SNAPSHOT_TRANSITIONS = 12
const emptyVisualSnapshot = (): ControlVisualSnapshotState => ({
  visualTimeMs: 0,
  visualTransitionAnchors: {},
  suppressedGuidedCameraTransitionEventIds: [],
  guidedCameraRestPose: null,
})

function validatedCameraVector(value: unknown): readonly [number, number, number] | undefined {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some(
      (entry) => typeof entry !== 'number' || !Number.isFinite(entry) || Math.abs(entry) > 10_000,
    )
  ) {
    return undefined
  }
  return [value[0] as number, value[1] as number, value[2] as number]
}

function validatedCameraRestPose(value: unknown): GuidedCameraRestPose | null | undefined {
  if (value === undefined || value === null) return value ?? null
  if (typeof value !== 'object' || Array.isArray(value)) return undefined
  const pose = value as Partial<GuidedCameraRestPose>
  const position = validatedCameraVector(pose.position)
  const target = validatedCameraVector(pose.target)
  if (
    typeof pose.shotId !== 'string' ||
    !canonicalGuidedCameraShotIds.has(pose.shotId) ||
    !position ||
    !target
  ) {
    return undefined
  }
  return {
    shotId: pose.shotId as GuidedCameraRestPose['shotId'],
    position,
    target,
  }
}

function validatedVisualSnapshot(value: {
  visualTimeMs?: unknown
  visualTransitionAnchors?: unknown
  suppressedGuidedCameraTransitionEventIds?: unknown
  guidedCameraRestPose?: unknown
}): ControlVisualSnapshotState | undefined {
  const legacy =
    value.visualTimeMs === undefined &&
    value.visualTransitionAnchors === undefined &&
    value.suppressedGuidedCameraTransitionEventIds === undefined &&
    value.guidedCameraRestPose === undefined
  if (legacy) return emptyVisualSnapshot()
  if (
    typeof value.visualTimeMs !== 'number' ||
    !Number.isFinite(value.visualTimeMs) ||
    value.visualTimeMs < 0 ||
    value.visualTimeMs > replayEndStoryTime ||
    typeof value.visualTransitionAnchors !== 'object' ||
    value.visualTransitionAnchors === null ||
    Array.isArray(value.visualTransitionAnchors) ||
    !Array.isArray(value.suppressedGuidedCameraTransitionEventIds)
  ) {
    return undefined
  }

  const anchorEntries = Object.entries(value.visualTransitionAnchors)
  if (anchorEntries.length > MAX_SNAPSHOT_TRANSITIONS) return undefined
  const visualTransitionAnchors: Record<string, number> = {}
  for (const [eventId, anchor] of anchorEntries) {
    if (
      !canonicalReplayEventIds.has(eventId) ||
      typeof anchor !== 'number' ||
      !Number.isFinite(anchor) ||
      anchor < 0 ||
      anchor > value.visualTimeMs + Number.EPSILON
    ) {
      return undefined
    }
    visualTransitionAnchors[eventId] = anchor
  }

  if (value.suppressedGuidedCameraTransitionEventIds.length > MAX_SNAPSHOT_TRANSITIONS) {
    return undefined
  }
  const suppressed = value.suppressedGuidedCameraTransitionEventIds
  const guidedCameraRestPose = validatedCameraRestPose(value.guidedCameraRestPose)
  if (
    guidedCameraRestPose === undefined ||
    suppressed.some(
      (eventId) => typeof eventId !== 'string' || !canonicalReplayEventIds.has(eventId),
    )
  ) {
    return undefined
  }

  return {
    visualTimeMs: value.visualTimeMs,
    visualTransitionAnchors,
    suppressedGuidedCameraTransitionEventIds: [...new Set(suppressed)],
    guidedCameraRestPose,
  }
}

function controlSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

export interface ControlReloadSnapshotConsumer {
  consume: (pathname: string) => ControlPlaybackSnapshot | undefined
  clear: () => void
}

export function createControlReloadSnapshotConsumer(
  bootPathname: string | null,
): ControlReloadSnapshotConsumer {
  let bootSnapshot: ControlPlaybackSnapshot | null | undefined

  return {
    consume: (pathname) => {
      if (bootPathname === null || pathname !== bootPathname) return undefined
      if (bootSnapshot !== undefined) return bootSnapshot ?? undefined

      const storage = controlSessionStorage()
      if (!storage) {
        bootSnapshot = null
        return undefined
      }

      try {
        const serialized = storage.getItem(CONTROL_RELOAD_SNAPSHOT_KEY)
        if (!serialized) {
          bootSnapshot = null
          return undefined
        }
        const snapshot = JSON.parse(serialized) as Partial<ControlPlaybackSnapshot>
        const metSeconds =
          typeof snapshot.path === 'string' ? metForControlPath(snapshot.path) : undefined
        const visualSnapshot = validatedVisualSnapshot(snapshot)
        if (
          snapshot.sourcePathname !== pathname ||
          typeof snapshot.path !== 'string' ||
          metSeconds === undefined ||
          !Number.isFinite(metSeconds) ||
          !visualSnapshot
        ) {
          bootSnapshot = null
          return undefined
        }
        bootSnapshot = {
          sourcePathname: snapshot.sourcePathname,
          path: snapshot.path,
          metSeconds,
          ...visualSnapshot,
        }
        return bootSnapshot
      } catch {
        bootSnapshot = null
        return undefined
      }
    },
    clear: () => {
      bootSnapshot = null
      const storage = controlSessionStorage()
      if (!storage) return
      try {
        storage.removeItem(CONTROL_RELOAD_SNAPSHOT_KEY)
      } catch {
        // The in-memory boot transaction is still consumed when cleanup fails.
      }
    },
  }
}

const controlReloadSnapshotConsumer = createControlReloadSnapshotConsumer(
  CONTROL_RELOAD_BOOT_PATHNAME,
)

function storedControlTraversalSnapshots(
  storage: Storage | null = controlSessionStorage(),
): StoredControlTraversalSnapshot[] {
  if (!storage) return []
  try {
    const snapshots = JSON.parse(
      storage.getItem(CONTROL_TRAVERSAL_SNAPSHOTS_KEY) ?? '[]',
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

export function recordControlTraversalSnapshot(
  entryId: string,
  metSeconds: number,
  preferredPathname?: string,
  visualSnapshot: ControlVisualSnapshotState = emptyVisualSnapshot(),
): void {
  const storage = controlSessionStorage()
  if (!storage || entryId.length === 0) return
  const snapshots = storedControlTraversalSnapshots(storage).filter(
    (snapshot) => snapshot.entryId !== entryId,
  )
  const preferredMet = preferredPathname ? metForControlPath(preferredPathname) : undefined
  const path =
    preferredPathname !== undefined &&
    preferredMet !== undefined &&
    (isControlReferencePath(preferredPathname) ||
      controlMetSemanticallyEqual(preferredMet, metSeconds))
      ? preferredPathname
      : controlMetPath(metSeconds)
  snapshots.push({ entryId, path, ...visualSnapshot })
  try {
    storage.setItem(
      CONTROL_TRAVERSAL_SNAPSHOTS_KEY,
      JSON.stringify(snapshots.slice(-MAX_CONTROL_TRAVERSAL_SNAPSHOTS)),
    )
  } catch {
    // Route continuity is best-effort when browser storage is unavailable.
  }
}

export function readControlTraversalSnapshot(
  entryId: string,
): ControlTraversalSnapshot | undefined {
  const snapshot = storedControlTraversalSnapshots().findLast(
    (candidate) => candidate.entryId === entryId,
  )
  if (!snapshot) return undefined
  const metSeconds = metForControlPath(snapshot.path)
  const visualSnapshot = validatedVisualSnapshot(snapshot)
  if (metSeconds === undefined || !Number.isFinite(metSeconds) || !visualSnapshot) {
    return undefined
  }
  return { path: snapshot.path, metSeconds, ...visualSnapshot }
}

export function clearControlTraversalSnapshot(entryId: string): void {
  const storage = controlSessionStorage()
  if (!storage) return
  const snapshots = storedControlTraversalSnapshots(storage).filter(
    (snapshot) => snapshot.entryId !== entryId,
  )
  try {
    if (snapshots.length === 0) storage.removeItem(CONTROL_TRAVERSAL_SNAPSHOTS_KEY)
    else storage.setItem(CONTROL_TRAVERSAL_SNAPSHOTS_KEY, JSON.stringify(snapshots))
  } catch {
    // A failed cleanup must not interrupt navigation.
  }
}

export function recordControlPlaybackSnapshot(
  sourcePathname: string,
  metSeconds: number,
  visualSnapshot: ControlVisualSnapshotState = emptyVisualSnapshot(),
): void {
  const storage = controlSessionStorage()
  if (!storage) return
  const snapshot: ControlPlaybackSnapshot = {
    sourcePathname,
    path: controlMetPath(metSeconds),
    metSeconds,
    ...visualSnapshot,
  }
  try {
    storage.setItem(CONTROL_RELOAD_SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // URL replacement still provides a recovery point when storage is unavailable.
  }
}

export function consumeControlReloadSnapshot(
  pathname: string,
): ControlPlaybackSnapshot | undefined {
  return controlReloadSnapshotConsumer.consume(pathname)
}

export function clearControlReloadSnapshot(): void {
  controlReloadSnapshotConsumer.clear()
}

export function metForControlPath(pathname: string): number | undefined {
  if (isControlReferencePath(pathname)) return replayStartMet

  const eventMatch = /^\/control\/event\/([^/]+)\/?$/.exec(pathname)
  if (eventMatch) {
    try {
      const eventId = decodeURIComponent(eventMatch[1])
      return replayEvents.find((event) => event.id === eventId)?.metSeconds
    } catch {
      return undefined
    }
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
