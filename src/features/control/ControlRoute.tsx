import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  clearControlReloadSnapshot,
  clearControlTraversalSnapshot,
  consumeControlReloadSnapshot,
  controlEventPath,
  controlMetPath,
  currentControlHistoryEntryId,
  metForControlPath,
  readControlTraversalSnapshot,
  type ControlPlaybackSnapshot,
} from '../../app/controlDeepLink.ts'
import {
  currentReplayEvent,
  eventsForPhase,
  formatCitation,
  mission,
  missionPack,
  phasesById,
  replayEndMet,
  replayEvents,
  replayStartMet,
} from '../../app/mission.ts'
import { type ModelQuality, type PlaybackSpeed, useMissionStore } from '../../app/missionStore.ts'
import { snapshotActiveControlHistoryEntry } from '../../app/controlTraversal.ts'
import {
  formatMet,
  formatEventMet,
  isMissingValue,
  metAtStoryTime,
  sampleTelemetryAtMet,
  stateAtMet,
  type MissionState,
} from '../../mission-core/index.ts'
import { useMissionPlayback } from './useMissionPlayback.ts'

const MissionScene = lazy(() =>
  import('./MissionScene.tsx').then((module) => ({ default: module.MissionScene })),
)

const speeds: PlaybackSpeed[] = [1, 10, 100, 1000]
const qualities: ModelQuality[] = ['high', 'medium', 'low', 'fallback']

const phaseGroups = [
  { number: '01', label: 'LAUNCH', phaseIds: ['prelaunch', 'ascent'], target: 'prelaunch' },
  {
    number: '02',
    label: 'EARTH / TLI',
    phaseIds: ['earth-orbit', 'tli-extraction'],
    target: 'earth-orbit',
  },
  { number: '03', label: 'TRANSLUNAR', phaseIds: ['translunar'], target: 'translunar' },
  { number: '04', label: 'LUNAR ORBIT', phaseIds: ['lunar-orbit'], target: 'lunar-orbit' },
  { number: '05', label: 'DESCENT', phaseIds: ['descent'], target: 'descent' },
  { number: '06', label: 'SURFACE', phaseIds: ['surface'], target: 'surface' },
  {
    number: '07',
    label: 'RENDEZVOUS',
    phaseIds: ['ascent-rendezvous', 'lunar-orbit-return'],
    target: 'ascent-rendezvous',
  },
  {
    number: '08',
    label: 'RETURN',
    phaseIds: ['transearth', 'entry', 'recovery'],
    target: 'transearth',
  },
] as const

type ConsoleMode =
  | 'launch'
  | 'earth'
  | 'translunar'
  | 'lunar-orbit'
  | 'descent'
  | 'surface'
  | 'rendezvous'
  | 'return'

function consoleModeForPhase(phaseId: string): ConsoleMode {
  if (phaseId === 'prelaunch' || phaseId === 'ascent') return 'launch'
  if (phaseId === 'earth-orbit' || phaseId === 'tli-extraction') return 'earth'
  if (phaseId === 'translunar') return 'translunar'
  if (phaseId === 'lunar-orbit') return 'lunar-orbit'
  if (phaseId === 'descent') return 'descent'
  if (phaseId === 'surface') return 'surface'
  if (phaseId === 'ascent-rendezvous' || phaseId === 'lunar-orbit-return') {
    return 'rendezvous'
  }
  return 'return'
}

function adjacentReplayTarget(direction: 'next' | 'previous'): {
  metSeconds: number
  eventId?: string
} | null {
  const currentMet = metAtStoryTime(mission.narrative, useMissionStore.getState().storyTimeMs)
  const targetEvent =
    direction === 'next'
      ? replayEvents.find((event) => event.metSeconds > currentMet + 0.01)
      : replayEvents.findLast((event) => event.metSeconds < currentMet - 0.01)
  if (direction === 'next' && !targetEvent) return null
  const metSeconds = targetEvent?.metSeconds ?? replayStartMet
  return {
    metSeconds,
    eventId: targetEvent?.id,
  }
}

function useControlKeyboard(): void {
  const navigate = useNavigate()
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.key === 'Escape') {
        const protectsTextEntry = target?.matches(
          'textarea, [contenteditable="true"], input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="password"]',
        )
        if (!protectsTextEntry) useMissionStore.getState().closeInspection()
        return
      }
      if (target?.matches('input, select, textarea, button, a, summary')) return
      const store = useMissionStore.getState()
      if (event.key.toLowerCase() === 'k') store.togglePlaying()
      if (event.key.toLowerCase() === 'j') {
        const target = adjacentReplayTarget('previous')
        if (!target) return
        snapshotActiveControlHistoryEntry()
        store.setPlaying(false)
        store.setMet(target.metSeconds)
        void navigate(controlMetPath(target.metSeconds))
      }
      if (event.key.toLowerCase() === 'l') {
        const target = adjacentReplayTarget('next')
        if (!target) return
        snapshotActiveControlHistoryEntry()
        store.setPlaying(false)
        store.setMet(target.metSeconds)
        void navigate(controlMetPath(target.metSeconds))
      }
      if (event.key === '[' || event.key === ']') {
        const index = speeds.indexOf(store.speed)
        const nextIndex =
          event.key === '[' ? Math.max(0, index - 1) : Math.min(speeds.length - 1, index + 1)
        store.setSpeed(speeds[nextIndex])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])
}

function useControlDeepLink(): number | undefined {
  const location = useLocation()
  const navigate = useNavigate()
  const appliedPath = useRef<string | null>(null)
  const restoreSnapshot = useRef<
    | {
        locationKey: string
        restore: {
          kind: 'reload' | 'traversal'
          entryId?: string
          snapshot: Pick<ControlPlaybackSnapshot, 'path' | 'metSeconds'>
        } | null
      }
    | undefined
  >(undefined)
  if (restoreSnapshot.current?.locationKey !== location.key) {
    const reload = consumeControlReloadSnapshot(location.pathname)
    if (reload) {
      restoreSnapshot.current = {
        locationKey: location.key,
        restore: { kind: 'reload', snapshot: reload },
      }
    } else {
      const entryId = currentControlHistoryEntryId(location.key)
      const traversal = readControlTraversalSnapshot(entryId)
      restoreSnapshot.current = {
        locationKey: location.key,
        restore: traversal ? { kind: 'traversal', entryId, snapshot: traversal } : null,
      }
    }
  }
  const restore = restoreSnapshot.current.restore
  const effectivePath = restore?.snapshot.path ?? location.pathname
  const targetMet = restore?.snapshot.metSeconds ?? metForControlPath(location.pathname)
  const pendingMet = restore
    ? targetMet
    : appliedPath.current === effectivePath
      ? undefined
      : targetMet

  useLayoutEffect(() => {
    appliedPath.current = effectivePath
    if (pendingMet !== undefined) {
      const store = useMissionStore.getState()
      if (restore?.kind === 'traversal') {
        store.restoreTraversalMet(pendingMet)
      } else {
        store.setMet(pendingMet)
        store.setPlaying(false)
      }
    }
    if (restore) {
      const restoredPath = restore.snapshot.path
      restoreSnapshot.current = { locationKey: location.key, restore: null }
      if (restore.kind === 'reload') clearControlReloadSnapshot()
      else if (restore.entryId) clearControlTraversalSnapshot(restore.entryId)
      if (restoredPath !== location.pathname) void navigate(restoredPath, { replace: true })
    }
  }, [effectivePath, location.key, location.pathname, navigate, pendingMet, restore])

  return pendingMet
}

type ControlJump = (
  metSeconds: number,
  path: string,
  replace?: boolean,
  pausePlayback?: boolean,
) => void

function useControlJump(): ControlJump {
  const navigate = useNavigate()
  return useCallback(
    (metSeconds: number, path: string, replace = false, pausePlayback = false) => {
      if (!replace) snapshotActiveControlHistoryEntry()
      const store = useMissionStore.getState()
      if (pausePlayback) store.setPlaying(false)
      store.setMet(metSeconds)
      void navigate(path, { replace })
    },
    [navigate],
  )
}

function EventLog({ met, phaseId, jump }: { met: number; phaseId: string; jump: ControlJump }) {
  const current = currentReplayEvent(met)
  const events = eventsForPhase(phaseId)
  return (
    <section className="console-panel event-log-panel" aria-labelledby="event-log-title">
      <header className="panel-head">
        <h2 id="event-log-title">EVENT LOG / {phasesById.get(phaseId)?.label}</h2>
        <span>{events.length} VERIFIED</span>
      </header>
      <ol className="control-event-log">
        {events.map((event) => {
          const passed = event.metSeconds <= met
          return (
            <li key={event.id} className={event.id === current?.id ? 'is-current' : undefined}>
              <button
                type="button"
                onClick={() => {
                  jump(event.metSeconds, controlEventPath(event.id))
                }}
              >
                <time>{formatEventMet(event)}</time>
                <span>{event.label}</span>
                <i>{passed ? 'REC' : 'QUE'}</i>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function enginePresentation(
  componentId: string,
  state: MissionState,
  met: number,
): { label: string; tone: 'on' | 'off' | 'unknown' } {
  const component = state.components[componentId]
  const isIgnitionRecord = replayEvents.some(
    (event) =>
      Math.abs(event.metSeconds - met) < 0.000_01 &&
      event.actions.some(
        (action) => action.type === 'record-engine-ignition' && action.componentId === componentId,
      ),
  )
  if (isIgnitionRecord) return { label: 'IGNITION EVENT · DURATION N/A', tone: 'unknown' }
  if (component.lifecycle === 'discarded') return { label: 'DISCARDED', tone: 'off' }
  if (component.lifecycle === 'landed') return { label: 'LANDED', tone: 'on' }
  if (component.engineMode === 'unknown') {
    const lastKnown = component.lastKnownEngineMode?.toUpperCase() ?? 'N/A'
    return { label: `ENGINE MODE UNKNOWN · LAST KNOWN ${lastKnown}`, tone: 'unknown' }
  }
  if (component.engineMode !== 'burning') {
    return {
      label: (component.engineMode ?? component.lifecycle).toUpperCase(),
      tone: component.lifecycle === 'attached' || component.lifecycle === 'free' ? 'on' : 'off',
    }
  }

  const ignition = [...replayEvents]
    .reverse()
    .find(
      (event) =>
        event.metSeconds <= met &&
        event.actions.some(
          (action) =>
            action.type === 'set-engine-mode' &&
            action.componentId === componentId &&
            action.engineMode === 'burning',
        ),
    )
  const nextCutoff = replayEvents.find(
    (event) =>
      event.metSeconds > (ignition?.metSeconds ?? met) &&
      event.actions.some(
        (action) =>
          action.type === 'set-engine-mode' &&
          action.componentId === componentId &&
          action.engineMode === 'cutoff',
      ),
  )
  if (ignition && !nextCutoff && met > ignition.metSeconds) {
    return { label: 'CUTOFF MET N/A', tone: 'unknown' }
  }
  return { label: 'BURNING', tone: 'on' }
}

const componentsByMode: Record<ConsoleMode, string[]> = {
  launch: ['s-ic', 's-ii', 's-ivb', 'service-module', 'lm-descent-stage'],
  earth: ['s-ivb', 'service-module', 'command-module', 'lm-ascent-stage', 'lm-descent-stage'],
  translunar: ['service-module', 'command-module', 'lm-ascent-stage', 'lm-descent-stage'],
  'lunar-orbit': ['service-module', 'command-module', 'lm-ascent-stage', 'lm-descent-stage'],
  descent: ['service-module', 'command-module', 'lm-ascent-stage', 'lm-descent-stage'],
  surface: ['lm-ascent-stage', 'lm-descent-stage', 'service-module', 'command-module'],
  rendezvous: ['lm-ascent-stage', 'lm-descent-stage', 'service-module', 'command-module'],
  return: ['command-module', 'service-module', 'lm-ascent-stage'],
}

const missingRowsByMode: Record<ConsoleMode, Array<[string, string]>> = {
  launch: [
    ['ALTITUDE', 'NOT AVAILABLE'],
    ['VELOCITY', 'NOT AVAILABLE'],
    ['ATTITUDE', 'NOT AVAILABLE'],
  ],
  earth: [
    ['ORBIT PARAMETERS', 'NOT IN CURRENT PACK'],
    ['TLI CUTOFF MET', 'NOT IN EVENT SET'],
    ['DOCKING RANGE', 'NOT AVAILABLE'],
  ],
  translunar: [
    ['EARTH / MOON RANGE', 'NOT AVAILABLE'],
    ['VELOCITY', 'NOT AVAILABLE'],
    ['PTC ATTITUDE', 'NOT AVAILABLE'],
  ],
  'lunar-orbit': [
    ['ORBIT / PASS', 'NOT AVAILABLE'],
    ['AOS / LOS', 'NOT AVAILABLE'],
    ['ATTITUDE', 'NOT AVAILABLE'],
  ],
  descent: [
    ['ALTITUDE', 'NOT AVAILABLE'],
    ['HORIZONTAL VELOCITY', 'NOT AVAILABLE'],
    ['DESCENT PROPELLANT', 'NOT AVAILABLE'],
  ],
  surface: [
    ['SUIT TELEMETRY', 'NOT PUBLISHED'],
    ['SURFACE ROUTE', 'NOT IN CURRENT PACK'],
    ['EASEP STATUS', 'NOT IN CURRENT PACK'],
  ],
  rendezvous: [
    ['RELATIVE RANGE', 'NOT AVAILABLE'],
    ['RANGE RATE', 'NOT AVAILABLE'],
    ['APS CUTOFF MET', 'NOT VERIFIED'],
  ],
  return: [
    ['EARTH RANGE', 'NOT AVAILABLE'],
    ['ENTRY ATTITUDE', 'NOT AVAILABLE'],
    ['PARACHUTE SUB-EVENTS', 'NOT VERIFIED'],
  ],
}

function TranscriptRecords({ met, jump }: { met: number; jump: ControlJump }) {
  return (
    <div className="transcript-records">
      <div className="subpanel-head">
        <h3>TRANSCRIPT RECORDS</h3>
        <span>AUDIO NOT AVAILABLE</span>
      </div>
      {missionPack.media.transcripts.map((record) => (
        <button
          type="button"
          key={record.id}
          className={record.metSeconds <= met ? 'is-passed' : undefined}
          onClick={() => {
            jump(record.metSeconds, controlMetPath(record.metSeconds))
          }}
        >
          <span>
            {formatMet(record.metSeconds)} · {record.speaker}
          </span>
          <q>{record.text}</q>
        </button>
      ))}
    </div>
  )
}

function PhaseDataPanel({
  met,
  mode,
  jump,
}: {
  met: number
  mode: ConsoleMode
  jump: ControlJump
}) {
  const sceneAvailability = useMissionStore((store) => store.sceneAvailability)
  const runtimeInspectable = useMissionStore((store) => store.runtimeInspectableComponentIds)
  const state = stateAtMet(mission, met)
  const touchdownChannel = mission.telemetry.find(
    (channel) => channel.id === 'a11-touchdown-vertical-speed',
  )
  const touchdownReading = touchdownChannel
    ? sampleTelemetryAtMet(touchdownChannel, met)
    : undefined

  return (
    <aside className="console-panel systems-panel" aria-labelledby="systems-title">
      <header className="panel-head">
        <h2 id="systems-title">{mode === 'surface' ? 'SURFACE CONFIGURATION' : 'VEHICLE STATE'}</h2>
        <span>DETERMINISTIC</span>
      </header>
      <div className="systems-list">
        {componentsByMode[mode].map((id) => {
          const definition = mission.vehicle.components.find((component) => component.id === id)!
          const presentation = enginePresentation(id, state, met)
          const inspectionAvailable =
            sceneAvailability === 'ready' && runtimeInspectable.includes(id)
          return (
            <button
              key={id}
              type="button"
              className="system-row"
              onClick={() => useMissionStore.getState().inspectComponent(id)}
              disabled={!inspectionAvailable}
              title={
                inspectionAvailable ? undefined : '3D inspection unavailable in the current view'
              }
            >
              <span>
                <span className="sr-only">Inspect </span>
                {definition.label}
              </span>
              <b>{presentation.label}</b>
              <i className={`status-${presentation.tone}`} />
            </button>
          )
        })}
      </div>

      {(mode === 'descent' || mode === 'surface') && <TranscriptRecords met={met} jump={jump} />}

      <div className="data-availability">
        <h3>{mode === 'surface' ? 'SURFACE RECORD AVAILABILITY' : 'FLIGHT DATA AVAILABILITY'}</h3>
        <dl>
          {(mode === 'descent' || mode === 'surface') &&
            touchdownReading &&
            !isMissingValue(touchdownReading) && (
              <div>
                <dt>LANDING VERTICAL SPEED</dt>
                <dd>{touchdownReading.value} M/S DOWN · ACTUAL</dd>
              </div>
            )}
          {missingRowsByMode[mode].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p>No continuous values are synthesized between source events.</p>
      </div>
    </aside>
  )
}

function PlaybackControls({ met, jump }: { met: number; jump: ControlJump }) {
  const playing = useMissionStore((state) => state.playing)
  const editorialPause = useMissionStore((state) => state.editorialPauseSegmentId)
  const speed = useMissionStore((state) => state.speed)
  const togglePlaying = useMissionStore((state) => state.togglePlaying)
  const setSpeed = useMissionStore((state) => state.setSpeed)
  const goToAdjacentEvent = (direction: 'next' | 'previous') => {
    const target = adjacentReplayTarget(direction)
    if (!target) return
    jump(
      target.metSeconds,
      target.eventId ? controlEventPath(target.eventId) : controlMetPath(target.metSeconds),
      false,
      true,
    )
  }

  return (
    <section className="playback-deck" aria-label="Mission replay controls">
      <div className="transport-controls">
        <button
          type="button"
          onClick={() => goToAdjacentEvent('previous')}
          aria-label="Previous event"
        >
          ←
        </button>
        <button className="play-button" type="button" onClick={togglePlaying}>
          {editorialPause ? 'CONTINUE REPLAY' : playing ? 'PAUSE' : 'PLAY'}
        </button>
        <button type="button" onClick={() => goToAdjacentEvent('next')} aria-label="Next event">
          →
        </button>
      </div>
      <label className="timeline-slider">
        <span className="sr-only">Mission elapsed time</span>
        <input
          type="range"
          min={replayStartMet}
          max={replayEndMet}
          step="0.1"
          value={met}
          onChange={(event) => {
            const targetMet = Number(event.target.value)
            jump(targetMet, controlMetPath(targetMet), true)
          }}
        />
        <span>
          <i style={{ width: `${(met / replayEndMet) * 100}%` }} />
        </span>
      </label>
      <div className="speed-controls" aria-label="Narrative playback rate">
        <span>NARRATIVE RATE</span>
        {speeds.map((option) => (
          <button
            type="button"
            key={option}
            className={speed === option ? 'is-active' : undefined}
            onClick={() => setSpeed(option)}
            aria-pressed={speed === option}
          >
            {option}×
          </button>
        ))}
      </div>
    </section>
  )
}

function sceneCopy(mode: ConsoleMode): { heading: string; truth: string; body: string } {
  if (mode === 'launch' || mode === 'earth') {
    return {
      heading: 'VIEW / NASA MODEL ASSETS',
      truth: 'SATURN V: NASA VISUALIZATION · CSM: RECONSTRUCTED',
      body: 'EARTH TEXTURE / MODERN NASA COMPOSITE',
    }
  }
  if (mode === 'translunar') {
    return {
      heading: 'VIEW / EARTH–MOON TRANSFER',
      truth: 'TRAJECTORY AND CELESTIAL SCALE: SCHEMATIC · NOT TO SCALE',
      body: 'MOON TEXTURE / MODERN NASA LRO PRODUCT',
    }
  }
  if (mode === 'lunar-orbit' || mode === 'descent' || mode === 'surface') {
    return {
      heading: 'VIEW / LUNAR OPERATIONS',
      truth: 'LM: GENERIC NASA VISUALIZATION · NOT CERTIFIED LM-5 · STAGE SPLIT RECONSTRUCTED',
      body: 'MOON TEXTURE / MODERN NASA LRO PRODUCT · COLOR ONLY',
    }
  }
  if (mode === 'rendezvous') {
    return {
      heading: 'VIEW / ASCENT & RENDEZVOUS',
      truth: 'RELATIVE RANGE AND MOTION: SCHEMATIC · NOT TO SCALE',
      body: 'DESCENT STAGE REMAINS ON LUNAR SURFACE',
    }
  }
  return {
    heading: 'VIEW / TRANSEARTH & ENTRY',
    truth: 'CSM: RECONSTRUCTED · ENTRY / RECOVERY MOTION SCHEMATIC',
    body: 'EARTH TEXTURE / MODERN NASA COMPOSITE',
  }
}

export function Component() {
  const deepLinkMet = useControlDeepLink()
  const jump = useControlJump()
  useMissionPlayback()
  useControlKeyboard()

  const storyTimeMs = useMissionStore((state) => state.storyTimeMs)
  const storeMet = metAtStoryTime(mission.narrative, storyTimeMs)
  const met = deepLinkMet ?? storeMet
  const quality = useMissionStore((state) => state.quality)
  const sceneAvailability = useMissionStore((state) => state.sceneAvailability)
  const setQuality = useMissionStore((state) => state.setQuality)
  const resumeAvailable = useMissionStore((state) => state.resumeAvailable)
  const editorialPause = useMissionStore((state) => state.editorialPauseSegmentId)
  const playing = useMissionStore((state) => state.playing)
  const pauseReason = useMissionStore((state) => state.pauseReason)
  const interaction = useMissionStore((state) => state.interaction)
  const cameraCommand = useMissionStore((state) => state.cameraCommand)
  const enterFreeLook = useMissionStore((state) => state.enterFreeLook)
  const requestCameraCommand = useMissionStore((state) => state.requestCameraCommand)
  const returnToGuided = useMissionStore((state) => state.returnToGuided)
  const closeInspection = useMissionStore((state) => state.closeInspection)
  const resumeAfterModeSwitch = useMissionStore((state) => state.resumeAfterModeSwitch)
  const dismissResume = useMissionStore((state) => state.dismissResume)
  const continueEditorialPause = useMissionStore((state) => state.continueEditorialPause)
  const currentEvent = currentReplayEvent(met)
  const state = stateAtMet(mission, met)
  const phase = phasesById.get(state.phaseId)
  const mode = consoleModeForPhase(state.phaseId)
  const copy = sceneCopy(mode)
  const exactEvent = replayEvents.find((event) => Math.abs(event.metSeconds - met) < 0.000_01)
  const displayedMet = exactEvent
    ? formatEventMet(exactEvent)
    : formatMet(met, { fractionDigits: 1 })
  const inspectedComponent =
    interaction.mode === 'inspect'
      ? mission.vehicle.components.find((component) => component.id === interaction.componentId)
      : undefined
  const sceneInteractive = quality !== 'fallback' && sceneAvailability === 'ready'

  useEffect(() => {
    if (
      window.matchMedia('(max-width: 620px)').matches &&
      useMissionStore.getState().quality === 'medium'
    ) {
      setQuality('low')
    }
  }, [setQuality])

  return (
    <main id="main-content" className={`control-shell control-mode-${mode}`} tabIndex={-1}>
      <section className="mission-status" aria-label="Current mission state">
        <div>
          <span>MISSION ELAPSED TIME</span>
          <b className="met-display">{displayedMet}</b>
        </div>
        <div>
          <span>FLIGHT PHASE</span>
          <b>{phase?.label ?? state.phaseId}</b>
        </div>
        <div className="current-event">
          <span>CURRENT RECORD</span>
          <b>{currentEvent?.label ?? 'PRELAUNCH RECORD'}</b>
        </div>
        <div className="record-status">
          <span>REPLAY BASIS</span>
          <b>
            <i /> EDITED / SOURCE-BOUND
          </b>
        </div>
      </section>

      {resumeAvailable && (
        <section className="resume-notice" aria-labelledby="resume-title">
          <div>
            <span id="resume-title">
              {pauseReason === 'mode-switch'
                ? 'REPLAY PAUSED ON MODE CHANGE'
                : 'REPLAY PAUSED SAFELY'}
            </span>
            <b>{displayedMet} · STATE PRESERVED · EXPLICIT RESUME REQUIRED</b>
          </div>
          <button type="button" onClick={resumeAfterModeSwitch}>
            RESUME REPLAY
          </button>
          <button type="button" onClick={dismissResume}>
            KEEP PAUSED
          </button>
        </section>
      )}

      {editorialPause && (
        <section className="editorial-pause-notice" aria-labelledby="editorial-pause-title">
          <div>
            <span id="editorial-pause-title">EVENT PAUSE — EDITORIAL</span>
            <b>{currentEvent?.label ?? phase?.label}</b>
            <p>
              MET IS FROZEN FOR REVIEW · HISTORICAL AUDIO NOT AVAILABLE · TRANSCRIPT RECORDS REMAIN
              AVAILABLE
            </p>
          </div>
          <button type="button" onClick={continueEditorialPause}>
            CONTINUE REPLAY
          </button>
        </section>
      )}

      {interaction.mode === 'inspect' && inspectedComponent && (
        <section className="component-inspection" aria-labelledby="component-inspection-title">
          <div>
            <span>COMPONENT INSPECTION · REPLAY PAUSED</span>
            <b id="component-inspection-title">{inspectedComponent.label}</b>
            <p>
              {state.components[inspectedComponent.id]?.lifecycle.toUpperCase()} ·{' '}
              {(inspectedComponent.evidence ?? 'reconstructed').toUpperCase()}
            </p>
            <small>SOURCES: {inspectedComponent.sourceIds?.join(' · ')}</small>
          </div>
          <button type="button" onClick={closeInspection}>
            CLOSE DOSSIER
          </button>
        </section>
      )}

      {met >= replayEndMet && !playing && !editorialPause && (
        <section className="mission-complete" aria-labelledby="mission-complete-title">
          <div>
            <span id="mission-complete-title">MISSION COMPLETE</span>
            <b>SPLASHDOWN · {formatMet(replayEndMet)}</b>
          </div>
          <p>ACTUAL MISSION RESULT · SOURCE LOCATOR AVAILABLE IN THE EVENT RECORD</p>
        </section>
      )}

      <nav className="phase-rail" aria-label="Phase navigation">
        {phaseGroups.map((group) => {
          const target = phasesById.get(group.target)!
          const startEvent = target.startEventId
            ? mission.events.find((event) => event.id === target.startEventId)
            : undefined
          const active = (group.phaseIds as readonly string[]).includes(state.phaseId)
          return (
            <button
              key={group.number}
              type="button"
              className={active ? 'is-active' : undefined}
              onClick={() => {
                const targetMet = startEvent?.metSeconds ?? replayStartMet
                jump(
                  targetMet,
                  startEvent ? controlEventPath(startEvent.id) : controlMetPath(targetMet),
                )
              }}
            >
              <span>{group.number}</span>
              {group.label}
            </button>
          )
        })}
      </nav>

      {mode === 'surface' && (
        <div className="configuration-change" role="status">
          <span>CONSOLE CONFIGURATION</span>
          LUNAR SURFACE OPERATIONS · TRANQUILITY BASE
        </div>
      )}

      <div className="console-grid">
        <EventLog met={met} phaseId={state.phaseId} jump={jump} />
        <section className="visualization-panel" aria-label="Vehicle configuration view">
          <div className="viewport-tools">
            <div>
              <span>{copy.heading}</span>
              <b>{copy.truth} · MOTION NOT TO SCALE</b>
            </div>
            <div className="camera-mode" role="status">
              <span>CAMERA</span>
              <b>
                {interaction.mode === 'guided'
                  ? 'GUIDED VIEW'
                  : interaction.mode === 'free-look'
                    ? 'FREE LOOK'
                    : 'INSPECT'}
              </b>
            </div>
            <label>
              QUALITY
              <select
                value={quality}
                onChange={(event) => setQuality(event.target.value as ModelQuality)}
              >
                {qualities.map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="camera-tools" aria-label="Camera controls">
            <button
              type="button"
              disabled={!sceneInteractive}
              onClick={() => requestCameraCommand('rotate-left')}
            >
              ROTATE −
            </button>
            <button
              type="button"
              disabled={!sceneInteractive}
              onClick={() => requestCameraCommand('rotate-right')}
            >
              ROTATE +
            </button>
            <button
              type="button"
              disabled={!sceneInteractive}
              onClick={() => requestCameraCommand('zoom-in')}
            >
              ZOOM +
            </button>
            <button
              type="button"
              disabled={!sceneInteractive}
              onClick={() => requestCameraCommand('zoom-out')}
            >
              ZOOM −
            </button>
            <button
              type="button"
              disabled={!sceneInteractive}
              onClick={() => requestCameraCommand('reset')}
            >
              RESET VIEW
            </button>
            {interaction.mode === 'free-look' && (
              <button className="return-guided" type="button" onClick={returnToGuided}>
                RETURN TO GUIDED VIEW
              </button>
            )}
            {interaction.mode === 'inspect' && interaction.cameraControl === 'free-look' && (
              <button className="return-guided" type="button" onClick={returnToGuided}>
                REFOCUS COMPONENT
              </button>
            )}
          </div>
          <div
            className="scene-frame"
            tabIndex={sceneInteractive ? 0 : -1}
            aria-disabled={!sceneInteractive}
            onWheel={sceneInteractive ? enterFreeLook : undefined}
            onKeyDown={(event) => {
              const command =
                event.key === 'ArrowLeft'
                  ? 'rotate-left'
                  : event.key === 'ArrowRight'
                    ? 'rotate-right'
                    : event.key === '+' || event.key === '='
                      ? 'zoom-in'
                      : event.key === '-'
                        ? 'zoom-out'
                        : event.key === 'Home'
                          ? 'reset'
                          : undefined
              if (!command || !sceneInteractive) return
              event.preventDefault()
              requestCameraCommand(command)
            }}
            aria-label={
              sceneInteractive
                ? 'Interactive vehicle camera; use arrow keys to rotate, plus or minus to zoom, and Home to reset'
                : 'Static vehicle view; interactive camera unavailable'
            }
          >
            <Suspense fallback={<div className="scene-loading outside">INITIALIZING 3D VIEW</div>}>
              <MissionScene
                met={met}
                storyTimeMs={storyTimeMs}
                interaction={interaction}
                cameraCommand={cameraCommand}
                quality={quality}
              />
            </Suspense>
            <div className="scene-corner top-left">
              <span>
                {mode === 'descent' || mode === 'surface' || mode === 'rendezvous'
                  ? 'LOCAL VIEW / SCHEMATIC · NO POSITION CLAIM'
                  : 'VISUAL REFERENCE / SCHEMATIC'}
              </span>
              <span>STAR FIELD / SCHEMATIC · NOT NAVIGATION</span>
            </div>
            <div className="scene-corner bottom-left">{copy.body}</div>
            <div className="scene-corner bottom-right">MODEL TRUTH / SEE ARCHIVE 05–11</div>
          </div>
          <div className="event-readout">
            <div>
              <span>EVENT RECORD</span>
              <b>{currentEvent?.label ?? 'PRELAUNCH RECORD'}</b>
            </div>
            <div>
              <span>EVIDENCE</span>
              <b>{currentEvent?.evidence.toUpperCase() ?? 'ACTUAL'}</b>
            </div>
            <details>
              <summary>SOURCE LOCATOR</summary>
              <p>
                {currentEvent
                  ? formatCitation(currentEvent.citations[0])
                  : 'NASA Apollo 11 Mission Report'}
              </p>
            </details>
          </div>
        </section>
        <PhaseDataPanel met={met} mode={mode} jump={jump} />
      </div>

      <PlaybackControls met={met} jump={jump} />
      <p className="keyboard-note">KEYS: K PLAY/PAUSE · J/L PREVIOUS/NEXT EVENT · [ / ] SPEED</p>
    </main>
  )
}
