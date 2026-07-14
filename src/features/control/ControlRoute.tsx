import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { metForControlPath } from '../../app/controlDeepLink.ts'
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
import {
  formatMet,
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

function useControlKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, select, textarea, button, a, summary')) return
      const store = useMissionStore.getState()
      if (event.key.toLowerCase() === 'k') store.togglePlaying()
      if (event.key.toLowerCase() === 'j') store.previousEvent()
      if (event.key.toLowerCase() === 'l') store.nextEvent()
      if (event.key === '[' || event.key === ']') {
        const index = speeds.indexOf(store.speed)
        const nextIndex =
          event.key === '[' ? Math.max(0, index - 1) : Math.min(speeds.length - 1, index + 1)
        store.setSpeed(speeds[nextIndex])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

function useControlDeepLink(): number | undefined {
  const location = useLocation()
  const appliedPath = useRef<string | null>(null)
  const targetMet = metForControlPath(location.pathname)
  const pendingMet = appliedPath.current === location.pathname ? undefined : targetMet

  useLayoutEffect(() => {
    appliedPath.current = location.pathname
    if (targetMet !== undefined) useMissionStore.getState().setMet(targetMet)
  }, [location.pathname, targetMet])

  return pendingMet
}

function EventLog({ met, phaseId }: { met: number; phaseId: string }) {
  const navigate = useNavigate()
  const setMet = useMissionStore((state) => state.setMet)
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
                  setMet(event.metSeconds)
                  void navigate(`/control/event/${event.id}`)
                }}
              >
                <time>{formatMet(event.metSeconds)}</time>
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
  if (component.lifecycle === 'discarded') return { label: 'DISCARDED', tone: 'off' }
  if (component.lifecycle === 'landed') return { label: 'LANDED', tone: 'on' }
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

function TranscriptRecords({ met }: { met: number }) {
  const navigate = useNavigate()
  const setMet = useMissionStore((state) => state.setMet)
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
            setMet(record.metSeconds)
            void navigate(`/control/met/${encodeURIComponent(formatMet(record.metSeconds))}`)
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

function PhaseDataPanel({ met, mode }: { met: number; mode: ConsoleMode }) {
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
          return (
            <div key={id}>
              <span>{definition.label}</span>
              <b>{presentation.label}</b>
              <i className={`status-${presentation.tone}`} />
            </div>
          )
        })}
      </div>

      {(mode === 'descent' || mode === 'surface') && <TranscriptRecords met={met} />}

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

function PlaybackControls({ met }: { met: number }) {
  const playing = useMissionStore((state) => state.playing)
  const editorialPause = useMissionStore((state) => state.editorialPauseSegmentId)
  const speed = useMissionStore((state) => state.speed)
  const setMet = useMissionStore((state) => state.setMet)
  const togglePlaying = useMissionStore((state) => state.togglePlaying)
  const nextEvent = useMissionStore((state) => state.nextEvent)
  const previousEvent = useMissionStore((state) => state.previousEvent)
  const setSpeed = useMissionStore((state) => state.setSpeed)

  return (
    <section className="playback-deck" aria-label="Mission replay controls">
      <div className="transport-controls">
        <button type="button" onClick={previousEvent} aria-label="Previous event">
          ←
        </button>
        <button className="play-button" type="button" onClick={togglePlaying}>
          {editorialPause ? 'CONTINUE REPLAY' : playing ? 'PAUSE' : 'PLAY'}
        </button>
        <button type="button" onClick={nextEvent} aria-label="Next event">
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
          onChange={(event) => setMet(Number(event.target.value))}
        />
        <span>
          <i style={{ width: `${(met / replayEndMet) * 100}%` }} />
        </span>
      </label>
      <div className="speed-controls" aria-label="Playback speed">
        {speeds.map((option) => (
          <button
            type="button"
            key={option}
            className={speed === option ? 'is-active' : undefined}
            onClick={() => setSpeed(option)}
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
  useMissionPlayback()
  useControlKeyboard()

  const storyTimeMs = useMissionStore((state) => state.storyTimeMs)
  const storeMet = metAtStoryTime(mission.narrative, storyTimeMs)
  const met = deepLinkMet ?? storeMet
  const quality = useMissionStore((state) => state.quality)
  const setQuality = useMissionStore((state) => state.setQuality)
  const resumeAvailable = useMissionStore((state) => state.resumeAvailable)
  const editorialPause = useMissionStore((state) => state.editorialPauseSegmentId)
  const playing = useMissionStore((state) => state.playing)
  const resumeAfterModeSwitch = useMissionStore((state) => state.resumeAfterModeSwitch)
  const dismissResume = useMissionStore((state) => state.dismissResume)
  const continueEditorialPause = useMissionStore((state) => state.continueEditorialPause)
  const currentEvent = currentReplayEvent(met)
  const state = stateAtMet(mission, met)
  const phase = phasesById.get(state.phaseId)
  const mode = consoleModeForPhase(state.phaseId)
  const copy = sceneCopy(mode)

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
          <b className="met-display">{formatMet(met, { fractionDigits: 1 })}</b>
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
            <span id="resume-title">REPLAY PAUSED ON MODE CHANGE</span>
            <b>{formatMet(met, { fractionDigits: 1 })} · STATE PRESERVED</b>
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
              onClick={() => useMissionStore.getState().setMet(startEvent?.metSeconds ?? 0)}
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
        <EventLog met={met} phaseId={state.phaseId} />
        <section className="visualization-panel" aria-label="Vehicle configuration view">
          <div className="viewport-tools">
            <div>
              <span>{copy.heading}</span>
              <b>{copy.truth} · MOTION NOT TO SCALE</b>
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
          <div className="scene-frame">
            <Suspense fallback={<div className="scene-loading outside">INITIALIZING 3D VIEW</div>}>
              <MissionScene met={met} quality={quality} />
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
        <PhaseDataPanel met={met} mode={mode} />
      </div>

      <PlaybackControls met={met} />
      <p className="keyboard-note">KEYS: K PLAY/PAUSE · J/L PREVIOUS/NEXT EVENT · [ / ] SPEED</p>
    </main>
  )
}
