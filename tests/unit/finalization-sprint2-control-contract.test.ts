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
        suppressedGuidedCameraTransitionEventIds: state.suppressedGuidedCameraTransitionEventIds,
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

test('visual time remains bounded when a delayed frame reaches replay end', () => {
  useMissionStore.setState({
    storyTimeMs: replayNarrative.at(-1)!.storyEndMs - 10,
    visualTimeMs: replayNarrative.at(-1)!.storyEndMs - 20,
    playing: true,
    speed: 1,
  })

  useMissionStore.getState().advancePlayback(60_000)

  assert.equal(useMissionStore.getState().storyTimeMs, replayNarrative.at(-1)!.storyEndMs)
  assert.equal(useMissionStore.getState().visualTimeMs, replayNarrative.at(-1)!.storyEndMs)
  assert.equal(useMissionStore.getState().playing, false)
})

test('crossing the transient/overview speed class clears active visual anchors', () => {
  useMissionStore.setState({
    speed: 10,
    visualTransitionAnchors: { 'a11-liftoff': 120 },
    suppressedGuidedCameraTransitionEventIds: ['a11-liftoff'],
    guidedCameraRestPose: {
      shotId: 'launch-pad-reference',
      position: [1, 2, 3],
      target: [0, 0, 0],
    },
  })
  useMissionStore.getState().setSpeed(100)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})
  assert.deepEqual(useMissionStore.getState().suppressedGuidedCameraTransitionEventIds, [])
  assert.equal(useMissionStore.getState().guidedCameraRestPose, null)

  useMissionStore.setState({ visualTransitionAnchors: { 'a11-liftoff': 180 } })
  useMissionStore.getState().setSpeed(1000)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {
    'a11-liftoff': 180,
  })

  useMissionStore.getState().setSpeed(10)
  assert.deepEqual(useMissionStore.getState().visualTransitionAnchors, {})
})

test('free look retains the released pose only as an explicit same-shot return point', () => {
  const restPose = {
    shotId: 'ascent-lower-reference',
    position: [8, 4, 12] as const,
    target: [0, 0, 0] as const,
  }
  useMissionStore.setState({ guidedCameraRestPose: restPose })
  useMissionStore.getState().enterFreeLook()
  assert.deepEqual(useMissionStore.getState().guidedCameraRestPose, restPose)
  useMissionStore.getState().returnToGuided()
  assert.equal(useMissionStore.getState().interaction.mode, 'guided')
  assert.deepEqual(useMissionStore.getState().guidedCameraRestPose, restPose)

  useMissionStore.getState().setMet(getEvent('a11-sivb-first-cutoff').metSeconds)
  assert.equal(useMissionStore.getState().guidedCameraRestPose, null)
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
  const seed = () => useMissionStore.setState({ visualTransitionAnchors: { 'a11-liftoff': 20 } })

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
