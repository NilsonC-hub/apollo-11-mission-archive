import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { getEvent, mission, replayEndMet, replayNarrative } from '../../src/app/mission.ts'
import { controlMetPath } from '../../src/app/controlDeepLink.ts'
import { useMissionStore } from '../../src/app/missionStore.ts'
import { formatEventMet, stateAtMet } from '../../src/mission-core/index.ts'

const initialState = useMissionStore.getState()

afterEach(() => {
  useMissionStore.setState(initialState, true)
})

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

test('user camera input interrupts guided mode immediately', () => {
  assert.equal(useMissionStore.getState().interaction.mode, 'guided')
  useMissionStore.getState().enterFreeLook()
  assert.equal(useMissionStore.getState().interaction.mode, 'free-look')
})

test('inspect pauses, focuses, and resumes playback exactly once on close', () => {
  useMissionStore.setState({ playing: true })

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
  useMissionStore.getState().inspectComponent('s-ic')
  useMissionStore.getState().closeInspection()
  assert.equal(useMissionStore.getState().playing, false)
})

test('control MET URLs use stable source-compatible precision', () => {
  assert.equal(controlMetPath(369_939.9), '/control/met/102%3A45%3A39.9')
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

test('ignition-only facts remain point events instead of indefinite burns', () => {
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
    const engineActions = event.actions.filter((action) => action.type === 'set-engine-mode')
    assert.ok(engineActions.length > 0, eventId)
    assert.ok(
      engineActions.every((action) => action.engineMode === 'ignition'),
      eventId,
    )
  }

  assert.equal(
    stateAtMet(mission, getEvent('a11-pdi-ignition').metSeconds).components['lm-descent-stage']
      .engineMode,
    'burning',
  )
  assert.equal(
    stateAtMet(mission, getEvent('a11-touchdown').metSeconds).components['lm-descent-stage']
      .engineMode,
    'cutoff',
  )
})
