import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { getEvent, mission, replayEndMet, replayNarrative } from '../../src/app/mission.ts'
import {
  clearControlTraversalSnapshot,
  controlMetPath,
  metForControlPath,
  readControlTraversalSnapshot,
  recordControlTraversalSnapshot,
} from '../../src/app/controlDeepLink.ts'
import { useMissionStore } from '../../src/app/missionStore.ts'
import { formatEventMet, stateAtMet } from '../../src/mission-core/index.ts'

const initialState = useMissionStore.getState()

afterEach(() => {
  useMissionStore.setState(initialState, true)
})

function enableInspection(...componentIds: string[]): void {
  useMissionStore.getState().setSceneRuntime('ready', componentIds)
}

function withMemorySessionStorage(run: () => void): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  const entries = new Map<string, string>()
  const storage = {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => [...entries.keys()][index] ?? null,
    removeItem: (key: string) => entries.delete(key),
    setItem: (key: string, value: string) => entries.set(key, value),
  }
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: storage,
  })
  try {
    run()
  } finally {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original)
    else delete (globalThis as typeof globalThis & { sessionStorage?: unknown }).sessionStorage
  }
}

test('storyTime and visualTime advance in separate domains', () => {
  useMissionStore.setState({
    storyTimeMs: 1_000,
    visualTimeMs: 250,
    speed: 100,
    playing: true,
  })

  useMissionStore.getState().advancePlayback(20)

  assert.equal(useMissionStore.getState().storyTimeMs, 3_000)
  assert.equal(useMissionStore.getState().visualTimeMs, 270)
})

test('guided playback crosses an authored phase boundary without a mandatory hold', () => {
  const boundary = replayNarrative.find((segment) => (segment.presentationPauseMs ?? 0) > 0)
  assert.ok(boundary)
  useMissionStore.setState({
    storyTimeMs: boundary.motionEndMs - 1,
    visualTimeMs: 0,
    speed: 1,
    playing: true,
    playbackPolicy: 'guided',
  })

  useMissionStore.getState().advancePlayback(2)

  assert.equal(useMissionStore.getState().playing, true)
  assert.equal(useMissionStore.getState().editorialPauseSegmentId, null)
  assert.ok(useMissionStore.getState().storyTimeMs > boundary.motionEndMs)
})

test('procedure policy retains the reusable editorial hold seam', () => {
  const boundary = replayNarrative.find((segment) => (segment.presentationPauseMs ?? 0) > 0)
  assert.ok(boundary)
  useMissionStore.setState({
    storyTimeMs: boundary.motionEndMs - 1,
    visualTimeMs: 0,
    speed: 1,
    playing: true,
    playbackPolicy: 'procedure',
  })

  useMissionStore.getState().advancePlayback(2)

  assert.equal(useMissionStore.getState().playing, false)
  assert.equal(useMissionStore.getState().editorialPauseSegmentId, boundary.id)
})

test('focus interruption pauses safely and requires an explicit resume', () => {
  useMissionStore.setState({ playing: true, resumeAvailable: false })

  useMissionStore.getState().pauseForInterruption('focus-loss')

  assert.equal(useMissionStore.getState().playing, false)
  assert.equal(useMissionStore.getState().resumeAvailable, true)
  assert.equal(useMissionStore.getState().pauseReason, 'focus-loss')

  useMissionStore.getState().resumeInterruptedPlayback()
  assert.equal(useMissionStore.getState().playing, true)
  assert.equal(useMissionStore.getState().resumeAvailable, false)
})

test('route traversal restore preserves the mode-switch interruption transaction', () => {
  useMissionStore.setState({ playing: true, resumeAvailable: false, pauseReason: null })
  useMissionStore.getState().pauseForModeSwitch()

  useMissionStore.getState().restoreTraversalMet(20)

  assert.equal(useMissionStore.getState().playing, false)
  assert.equal(useMissionStore.getState().resumeAvailable, true)
  assert.equal(useMissionStore.getState().pauseReason, 'mode-switch')
})

test('user camera input interrupts guided mode immediately', () => {
  assert.equal(useMissionStore.getState().interaction.mode, 'guided')
  useMissionStore.getState().enterFreeLook()
  assert.equal(useMissionStore.getState().interaction.mode, 'free-look')
})

test('inspect pauses, focuses, and resumes playback exactly once on close', () => {
  useMissionStore.setState({ playing: true })
  enableInspection('s-ic')

  useMissionStore.getState().inspectComponent('s-ic')
  assert.equal(useMissionStore.getState().playing, false)
  assert.deepEqual(useMissionStore.getState().interaction, {
    mode: 'inspect',
    componentId: 's-ic',
    returnMode: 'guided',
    resumePlaybackOnClose: true,
    cameraControl: 'guided-focus',
  })

  useMissionStore.getState().closeInspection()
  assert.equal(useMissionStore.getState().playing, true)
  assert.equal(useMissionStore.getState().interaction.mode, 'guided')

  useMissionStore.getState().closeInspection()
  assert.equal(useMissionStore.getState().playing, true)
})

test('visibility interruption cancels inspect auto-resume', () => {
  useMissionStore.setState({ playing: true })
  enableInspection('s-ic')
  useMissionStore.getState().inspectComponent('s-ic')

  useMissionStore.getState().pauseForInterruption('visibility')
  useMissionStore.getState().closeInspection()

  assert.equal(useMissionStore.getState().playing, false)
  assert.equal(useMissionStore.getState().resumeAvailable, true)
  useMissionStore.getState().resumeInterruptedPlayback()
  assert.equal(useMissionStore.getState().playing, true)
})

test('inspect entered while paused remains paused on close', () => {
  useMissionStore.setState({ playing: false })
  enableInspection('s-ic')
  useMissionStore.getState().inspectComponent('s-ic')
  useMissionStore.getState().closeInspection()
  assert.equal(useMissionStore.getState().playing, false)
})

test('inspection is unavailable until one runtime semantic target is ready', () => {
  useMissionStore.getState().inspectComponent('s-ic')
  assert.equal(useMissionStore.getState().interaction.mode, 'guided')

  useMissionStore.getState().setSceneRuntime('ready', [])
  useMissionStore.getState().inspectComponent('s-ic')
  assert.equal(useMissionStore.getState().interaction.mode, 'guided')

  enableInspection('s-ic')
  useMissionStore.getState().inspectComponent('s-ic')
  assert.equal(useMissionStore.getState().interaction.mode, 'inspect')
})

test('changing inspected components restores guided focus without changing the close transaction', () => {
  useMissionStore.setState({ playing: true, interaction: { mode: 'free-look' } })
  enableInspection('s-ic', 's-ii')
  useMissionStore.getState().inspectComponent('s-ic')
  useMissionStore.getState().enterFreeLook()
  useMissionStore.getState().inspectComponent('s-ii')

  assert.deepEqual(useMissionStore.getState().interaction, {
    mode: 'inspect',
    componentId: 's-ii',
    returnMode: 'free-look',
    resumePlaybackOnClose: true,
    cameraControl: 'guided-focus',
  })
})

test('control MET URLs use stable source-compatible precision', () => {
  assert.equal(controlMetPath(369_939.9), '/control/met/s369939.9')
  for (const met of [161.66, 699.3, 360_720, 393_855.0, 705_000.125]) {
    const path = controlMetPath(met)
    assert.equal(metForControlPath(path), met, `${met} must survive a URL round trip`)
  }
})

test('control MET URLs canonically round-trip playback doubles over the replay range', () => {
  const boundary = 223_971.499_240_796_3
  assert.ok(Object.is(metForControlPath(controlMetPath(boundary)), boundary))

  for (const met of [
    -0,
    0,
    Number.MIN_VALUE,
    -Number.MIN_VALUE,
    2.225_073_858_507_201_4e-308,
    -2.225_073_858_507_201_4e-308,
    Number.MAX_VALUE,
    -Number.MAX_VALUE,
  ]) {
    assert.ok(
      Object.is(metForControlPath(controlMetPath(met)), met),
      `${Object.is(met, -0) ? '-0' : met} must survive a strict URL round trip`,
    )
  }
  assert.equal(controlMetPath(-0), '/control/met/s-0')
  assert.ok(
    Object.is(metForControlPath('/control/met/s0'), 0),
    'the existing s0 URL stays readable',
  )

  let seed = 0x51f15e
  for (let index = 0; index < 4_096; index += 1) {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0
    const whole = (seed / 0x1_0000_0000) * replayEndMet
    const met = index % 3 === 0 ? whole : whole + (index % 10) / 10
    assert.ok(Object.is(metForControlPath(controlMetPath(met)), met), `round trip ${met}`)
  }
})

test('route traversal snapshots are isolated by history entry key, not pathname', () => {
  withMemorySessionStorage(() => {
    recordControlTraversalSnapshot('control-entry-a', 20)

    assert.equal(readControlTraversalSnapshot('control-entry-b'), undefined)
    assert.deepEqual(readControlTraversalSnapshot('control-entry-a'), {
      path: '/control/met/s20',
      metSeconds: 20,
    })

    clearControlTraversalSnapshot('control-entry-a')
    assert.equal(readControlTraversalSnapshot('control-entry-a'), undefined)
  })
})

test('event MET formatting preserves source precision', () => {
  assert.equal(formatEventMet(getEvent('a11-touchdown')), '102:45:39.9')
  assert.equal(formatEventMet(getEvent('a11-undocking')), '100:12:00')
  assert.equal(formatEventMet(getEvent('a11-first-step')), '109:24:15.00')
})

test('terminal vehicle components cannot remain burning', () => {
  const terminal = stateAtMet(mission, replayEndMet)
  for (const [componentId, component] of Object.entries(terminal.components)) {
    if (component.lifecycle === 'discarded' || component.lifecycle === 'landed') {
      assert.notEqual(component.engineMode, 'burning', componentId)
      if (component.engineStateBasis === 'terminal') {
        assert.equal(component.engineMode, undefined, componentId)
        assert.ok(component.lastKnownEngineMode, `${componentId} retains its last-known mode`)
      }
    }
  }

  assert.deepEqual(
    Object.fromEntries(
      Object.entries(terminal.components).map(([componentId, component]) => [
        componentId,
        component.lifecycle,
      ]),
    ),
    {
      's-ic': 'discarded',
      's-ic-s-ii-interstage': 'discarded',
      's-ii': 'discarded',
      's-ii-s-ivb-interstage': 'discarded',
      's-ivb': 'discarded',
      'instrument-unit': 'attached',
      'spacecraft-lm-adapter': 'attached',
      'sla-panel-1': 'attached',
      'sla-panel-2': 'attached',
      'sla-panel-3': 'attached',
      'sla-panel-4': 'attached',
      'lm-descent-stage': 'landed',
      'lm-ascent-stage': 'discarded',
      'service-module': 'discarded',
      'command-module': 'landed',
      'launch-escape-system': 'discarded',
    },
  )
})

test('ignition-only facts produce an unknown current mode with last-known provenance', () => {
  const ignitionOnly = [
    'a11-tli-ignition',
    'a11-mcc1-ignition',
    'a11-loi-ignition',
    'a11-doi-ignition',
    'a11-lunar-liftoff',
    'a11-tei-ignition',
  ]
  for (const eventId of ignitionOnly) {
    const event = getEvent(eventId)
    const ignitionRecords = event.actions.filter(
      (action) => action.type === 'record-engine-ignition',
    )
    assert.ok(ignitionRecords.length > 0, eventId)
    assert.ok(
      event.actions.every(
        (action) => action.type !== 'set-engine-mode' || action.engineMode !== 'ignition',
      ),
      eventId,
    )
    const componentId = ignitionRecords[0].componentId
    const component = stateAtMet(mission, event.metSeconds + 0.001).components[componentId] as {
      engineMode?: string
      engineStateBasis?: string
      lastKnownEngineMode?: string
    }
    assert.equal(component.engineMode, 'unknown', eventId)
    assert.equal(component.engineStateBasis, 'point-event', eventId)
    assert.ok(component.lastKnownEngineMode, `${eventId} must retain a last-known mode`)
  }

  assert.equal(
    stateAtMet(mission, getEvent('a11-pdi-ignition').metSeconds).components['lm-descent-stage']
      .engineMode,
    'burning',
  )
  assert.equal(
    stateAtMet(mission, getEvent('a11-touchdown').metSeconds).components['lm-descent-stage']
      .engineMode,
    undefined,
  )
  assert.equal(
    stateAtMet(mission, getEvent('a11-touchdown').metSeconds).components['lm-descent-stage']
      .engineStateBasis,
    'terminal',
  )
})
