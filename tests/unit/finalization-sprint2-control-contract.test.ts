import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

import { getEvent, mission, replayNarrative } from '../../src/app/mission.ts'
import { useMissionStore } from '../../src/app/missionStore.ts'
import { launchVisualStateAt } from '../../src/features/control/launchVisualState.ts'
import { metAtStoryTime, storyTimeAtMet } from '../../src/mission-core/index.ts'

const initialState = useMissionStore.getState()

beforeEach(() => {
  useMissionStore.setState(initialState, true)
})

test('continuous replay captures a fractional wall-time anchor for canonical events', () => {
  const event = getEvent('a11-sic-sii-separation')
  const eventStoryTime = storyTimeAtMet(mission.narrative, event.metSeconds)
  useMissionStore.setState({
    storyTimeMs: eventStoryTime - 5_000,
    visualTimeMs: 200,
    visualTransitionAnchors: {},
    speed: 10,
    playbackPolicy: 'guided',
    playing: true,
  })

  useMissionStore.getState().advancePlayback(1_000)

  assert.equal(useMissionStore.getState().visualTransitionAnchors[event.id], 700)
})

test('advancePlayback preserves the same separation wall duration at 1x and 10x', () => {
  const event = getEvent('a11-sic-sii-separation')
  const eventStoryTime = storyTimeAtMet(mission.narrative, event.metSeconds)
  const progressAtRate = (speed: 1 | 10) => {
    useMissionStore.setState(initialState, true)
    useMissionStore.setState({
      storyTimeMs: eventStoryTime - 1_000 * speed,
      visualTimeMs: 0,
      visualTransitionAnchors: {},
      speed,
      playbackPolicy: 'guided',
      playing: true,
    })
    useMissionStore.getState().advancePlayback(1_800)
    const state = useMissionStore.getState()
    return {
      anchor: state.visualTransitionAnchors[event.id],
      departure: launchVisualStateAt({
        storyTimeMs: state.storyTimeMs,
        visualTimeMs: state.visualTimeMs,
        transitionAnchors: state.visualTransitionAnchors,
        metSeconds: metAtStoryTime(mission.narrative, state.storyTimeMs),
        speed,
        reducedMotion: false,
      }).departures['s-ic'].progress,
    }
  }

  const one = progressAtRate(1)
  const ten = progressAtRate(10)
  assert.equal(one.anchor, 1_000)
  assert.equal(ten.anchor, 1_000)
  assert.equal(one.departure, ten.departure)
})

test('crossing the transient/overview speed class clears active visual anchors', () => {
  useMissionStore.setState({
    speed: 10,
    visualTransitionAnchors: { 'a11-liftoff': 120 },
  })
  useMissionStore.getState().setSpeed(100)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})

  useMissionStore.setState({ visualTransitionAnchors: { 'a11-liftoff': 180 } })
  useMissionStore.getState().setSpeed(1000)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {
    'a11-liftoff': 180,
  })

  useMissionStore.getState().setSpeed(10)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})
})

test('procedure editorial boundary resolves to a stable endpoint with no carried transient', () => {
  const boundary = replayNarrative.find((segment) => (segment.presentationPauseMs ?? 0) > 0)!
  useMissionStore.setState({
    storyTimeMs: boundary.motionEndMs - 10,
    visualTimeMs: 450,
    visualTransitionAnchors: { 'a11-liftoff': 20 },
    speed: 10,
    playbackPolicy: 'procedure',
    playing: true,
  })

  useMissionStore.getState().advancePlayback(2)

  assert.equal(useMissionStore.getState().editorialPauseSegmentId, boundary.id)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})
})

test('noncontinuous relocation clears visual transition anchors', () => {
  const seed = () =>
    useMissionStore.setState({ visualTransitionAnchors: { 'a11-liftoff': 20 } })

  seed()
  useMissionStore.getState().setStoryTime(100)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})

  seed()
  useMissionStore.getState().setMet(20)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})

  seed()
  useMissionStore.getState().restoreTraversalMet(30)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})

  seed()
  useMissionStore.getState().previousEvent()
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})
})

test('guided camera skip and interface tones remain explicit store transactions', () => {
  assert.equal(useMissionStore.getState().interfaceTonesEnabled, false)
  useMissionStore.getState().setGuidedCameraStatus(true, 'ascent-lower-reference')
  const before = useMissionStore.getState().guidedCameraSkipRevision
  useMissionStore.getState().skipGuidedCamera()

  assert.equal(useMissionStore.getState().guidedCameraActive, false)
  assert.equal(useMissionStore.getState().guidedCameraSkipRevision, before + 1)

  useMissionStore.getState().setInterfaceTonesEnabled(true)
  assert.equal(useMissionStore.getState().interfaceTonesEnabled, true)
})
