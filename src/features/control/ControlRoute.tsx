import { lazy, Suspense, useEffect } from 'react'

import {
  currentPhase4Event,
  formatCitation,
  mission,
  phase4EndMet,
  phase4Events,
  phase4StartMet,
  phasesById,
} from '../../app/mission.ts'
import { type ModelQuality, type PlaybackSpeed, useMissionStore } from '../../app/missionStore.ts'
import { formatMet, stateAtMet } from '../../mission-core/index.ts'
import { useMissionPlayback } from './useMissionPlayback.ts'

const MissionScene = lazy(() =>
  import('./MissionScene.tsx').then((module) => ({ default: module.MissionScene })),
)

const speeds: PlaybackSpeed[] = [1, 10, 100, 1000]
const qualities: ModelQuality[] = ['high', 'medium', 'low', 'fallback']
const phaseIds = ['prelaunch', 'ascent', 'earth-orbit', 'tli-extraction'] as const

function useControlKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, select, textarea, button, a')) return
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

function EventLog({ met }: { met: number }) {
  const setMet = useMissionStore((state) => state.setMet)
  const current = currentPhase4Event(met)
  return (
    <section className="console-panel event-log-panel" aria-labelledby="event-log-title">
      <header className="panel-head">
        <h2 id="event-log-title">EVENT LOG</h2>
        <span>{phase4Events.length} VERIFIED</span>
      </header>
      <ol className="control-event-log">
        {phase4Events.map((event) => {
          const passed = event.metSeconds <= met
          return (
            <li key={event.id} className={event.id === current?.id ? 'is-current' : undefined}>
              <button type="button" onClick={() => setMet(event.metSeconds)}>
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

function SystemsPanel({ met }: { met: number }) {
  const state = stateAtMet(mission, met)
  const tliCutoffUnresolved =
    met >= mission.events.find((event) => event.id === 'a11-csm-sivb-separation')!.metSeconds
  const components = ['s-ic', 's-ii', 's-ivb', 'service-module', 'lm-descent-stage']
  return (
    <aside className="console-panel systems-panel" aria-labelledby="systems-title">
      <header className="panel-head">
        <h2 id="systems-title">VEHICLE STATE</h2>
        <span>DETERMINISTIC</span>
      </header>
      <div className="systems-list">
        {components.map((id) => {
          const definition = mission.vehicle.components.find((component) => component.id === id)!
          const componentState = state.components[id]
          const unresolved = id === 's-ivb' && tliCutoffUnresolved
          return (
            <div key={id}>
              <span>{definition.label}</span>
              <b>
                {unresolved
                  ? 'CUTOFF MET N/A'
                  : (componentState.engineMode ?? componentState.lifecycle)}
              </b>
              <i
                className={
                  componentState.lifecycle === 'discarded' || unresolved
                    ? 'status-off'
                    : 'status-on'
                }
              />
            </div>
          )
        })}
      </div>
      <div className="data-availability">
        <h3>FLIGHT DATA AVAILABILITY</h3>
        <dl>
          <div>
            <dt>ALTITUDE</dt>
            <dd>NOT AVAILABLE</dd>
          </div>
          <div>
            <dt>VELOCITY</dt>
            <dd>NOT AVAILABLE</dd>
          </div>
          <div>
            <dt>ATTITUDE</dt>
            <dd>NOT AVAILABLE</dd>
          </div>
          <div>
            <dt>TLI CUTOFF MET</dt>
            <dd>NOT IN EVENT SET</dd>
          </div>
        </dl>
        <p>No continuous values are synthesized between source events.</p>
      </div>
    </aside>
  )
}

function PlaybackControls({ met }: { met: number }) {
  const playing = useMissionStore((state) => state.playing)
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
          {playing ? 'PAUSE' : 'PLAY'}
        </button>
        <button type="button" onClick={nextEvent} aria-label="Next event">
          →
        </button>
      </div>
      <label className="timeline-slider">
        <span className="sr-only">Mission elapsed time</span>
        <input
          type="range"
          min={phase4StartMet}
          max={phase4EndMet}
          step="0.1"
          value={met}
          onChange={(event) => setMet(Number(event.target.value))}
        />
        <span>
          <i style={{ width: `${(met / phase4EndMet) * 100}%` }} />
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

export function Component() {
  useMissionPlayback()
  useControlKeyboard()

  const met = useMissionStore((state) => state.metSeconds)
  const quality = useMissionStore((state) => state.quality)
  const setQuality = useMissionStore((state) => state.setQuality)
  const currentEvent = currentPhase4Event(met)
  const state = stateAtMet(mission, met)
  const phase = phasesById.get(state.phaseId)

  useEffect(() => {
    if (
      window.matchMedia('(max-width: 620px)').matches &&
      useMissionStore.getState().quality === 'medium'
    ) {
      setQuality('low')
    }
  }, [setQuality])

  return (
    <main id="main-content" className="control-shell" tabIndex={-1}>
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
            <i /> SOURCE-BOUND
          </b>
        </div>
      </section>

      <nav className="phase-rail" aria-label="Phase navigation">
        {phaseIds.map((id, index) => {
          const target = mission.phases.find((candidate) => candidate.id === id)!
          const startEvent = target.startEventId
            ? mission.events.find((event) => event.id === target.startEventId)
            : undefined
          const active =
            id === state.phaseId || (id === 'tli-extraction' && state.phaseId === 'translunar')
          return (
            <button
              key={id}
              type="button"
              className={active ? 'is-active' : undefined}
              onClick={() => useMissionStore.getState().setMet(startEvent?.metSeconds ?? 0)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {target.label}
            </button>
          )
        })}
      </nav>

      <div className="console-grid">
        <EventLog met={met} />
        <section className="visualization-panel" aria-label="Vehicle configuration view">
          <div className="viewport-tools">
            <div>
              <span>VIEW / NASA MODEL ASSETS</span>
              <b>SATURN V: NASA VISUALIZATION · CSM: RECONSTRUCTED · MOTION NOT TO SCALE</b>
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
            <div className="scene-corner top-left">+Y / MISSION FRAME</div>
            <div className="scene-corner bottom-left">EARTH TEXTURE / MODERN NASA COMPOSITE</div>
            <div className="scene-corner bottom-right">MODEL TRUTH / SEE ARCHIVE 05–06</div>
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
        <SystemsPanel met={met} />
      </div>

      <PlaybackControls met={met} />
      <p className="keyboard-note">KEYS: K PLAY/PAUSE · J/L PREVIOUS/NEXT EVENT · [ / ] SPEED</p>
    </main>
  )
}
