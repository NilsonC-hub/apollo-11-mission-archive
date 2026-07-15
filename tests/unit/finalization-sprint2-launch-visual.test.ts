import assert from 'node:assert/strict'
import test from 'node:test'

import { getEvent, mission } from '../../src/app/mission.ts'
import { launchVisualStateAt } from '../../src/features/control/launchVisualState.ts'
import { metAtStoryTime, storyTimeAtMet } from '../../src/mission-core/index.ts'

function poseAt(eventId: string, speed: 1 | 10 | 100 | 1000 = 10, reducedMotion = false) {
  const event = getEvent(eventId)
  return launchVisualStateAt({
    storyTimeMs: storyTimeAtMet(mission.narrative, event.metSeconds),
    visualTimeMs: 0,
    transitionAnchors: {},
    metSeconds: event.metSeconds,
    speed,
    reducedMotion,
  })
}

test('launch visual state is deterministic for the same story/MET input', () => {
  const first = poseAt('a11-sic-sii-separation')
  const second = poseAt('a11-sic-sii-separation')
  assert.deepEqual(first, second)
  assert.equal(first.evidence, 'schematic')
})

test('factual separation begins a separate authored displacement window', () => {
  const event = getEvent('a11-sic-sii-separation')
  const storyTimeMs = storyTimeAtMet(mission.narrative, event.metSeconds)
  const atBoundary = launchVisualStateAt({
    storyTimeMs,
    visualTimeMs: 1_000,
    transitionAnchors: { [event.id]: 1_000 },
    metSeconds: event.metSeconds,
    speed: 10,
    reducedMotion: false,
  })
  const afterBoundary = launchVisualStateAt({
    storyTimeMs: storyTimeMs + 8_000,
    visualTimeMs: 1_800,
    transitionAnchors: { [event.id]: 1_000 },
    metSeconds: event.metSeconds + 0.001,
    speed: 10,
    reducedMotion: false,
  })

  assert.equal(atBoundary.departures['s-ic'].progress, 0)
  assert.equal(atBoundary.departures['s-ic'].renderAfterSeparation, true)
  assert.ok(afterBoundary.departures['s-ic'].progress > 0)
  assert.equal(afterBoundary.departures['s-ic'].renderAfterSeparation, true)
})

test('high-rate overview and reduced motion remove transient separation travel', () => {
  const overview = poseAt('a11-sic-sii-separation', 100)
  const reduced = poseAt('a11-sic-sii-separation', 10, true)

  assert.equal(overview.policy, 'high-rate-overview')
  assert.equal(overview.guidedShotDurationMs, 0)
  assert.equal(overview.departures['s-ic'].renderAfterSeparation, false)
  assert.equal(reduced.policy, 'reduced-motion')
  assert.equal(reduced.earthRotationY, 0)
  assert.equal(reduced.departures['s-ic'].renderAfterSeparation, false)
})

test('Earth rotation is story-derived and pauses when story time does not change', () => {
  const event = getEvent('a11-sivb-first-cutoff')
  const storyTimeMs = storyTimeAtMet(mission.narrative, event.metSeconds)
  const input = {
    storyTimeMs,
    visualTimeMs: 4_000,
    transitionAnchors: {},
    metSeconds: event.metSeconds,
    speed: 10 as const,
    reducedMotion: false,
  }
  assert.equal(launchVisualStateAt(input).earthRotationY, launchVisualStateAt(input).earthRotationY)
  assert.ok(launchVisualStateAt(input).earthRotationY > poseAt('a11-liftoff').earthRotationY)
})

test('launch plume envelopes stop at their canonical cutoff events', () => {
  const cutoffs = [
    ['s-ic', 'a11-sic-outboard-cutoff'],
    ['s-ii', 'a11-sii-cutoff'],
    ['s-ivb', 'a11-sivb-first-cutoff'],
  ] as const

  for (const [stageId, eventId] of cutoffs) {
    const cutoff = getEvent(eventId)
    const atCutoff = poseAt(eventId)
    const afterCutoff = launchVisualStateAt({
      storyTimeMs: storyTimeAtMet(mission.narrative, cutoff.metSeconds + 1),
      visualTimeMs: 8_000,
      transitionAnchors: {},
      metSeconds: cutoff.metSeconds + 1,
      speed: 10,
      reducedMotion: false,
    })

    assert.equal(atCutoff.plumeIntensity[stageId], 0)
    assert.equal(afterCutoff.plumeIntensity[stageId], 0)
  }
})

test('stable Earth orbit has no S-IVB plume at any motion policy', () => {
  assert.equal(poseAt('a11-sivb-first-cutoff', 10).plumeIntensity['s-ivb'], 0)
  assert.equal(poseAt('a11-sivb-first-cutoff', 100).plumeIntensity['s-ivb'], 0)
  assert.equal(poseAt('a11-sivb-first-cutoff', 10, true).plumeIntensity['s-ivb'], 0)
})

test('separation transient wall duration is independent of 1x or 10x story rate', () => {
  const event = getEvent('a11-sic-sii-separation')
  const storyTimeMs = storyTimeAtMet(mission.narrative, event.metSeconds)
  const transitionAnchors = { [event.id]: 2_000 }
  const atRate = (speed: 1 | 10) => {
    const currentStoryTimeMs = storyTimeMs + 800 * speed
    return launchVisualStateAt({
      storyTimeMs: currentStoryTimeMs,
      visualTimeMs: 2_800,
      transitionAnchors,
      metSeconds: metAtStoryTime(mission.narrative, currentStoryTimeMs),
      speed,
      reducedMotion: false,
    })
  }

  assert.equal(atRate(1).departures['s-ic'].progress, atRate(10).departures['s-ic'].progress)
})

test('direct jump reconstructs stable endpoint instead of replaying a transient', () => {
  const event = getEvent('a11-sic-sii-separation')
  const jumped = launchVisualStateAt({
    storyTimeMs: storyTimeAtMet(mission.narrative, event.metSeconds),
    visualTimeMs: 0,
    transitionAnchors: {},
    metSeconds: event.metSeconds,
    speed: 10,
    reducedMotion: false,
  })

  assert.equal(jumped.departures['s-ic'].progress, 1)
  assert.equal(jumped.departures['s-ic'].renderAfterSeparation, false)
  assert.equal(jumped.guidedShotDurationMs, 0)
})

test('camera transition policy is wall-duration based at 1x/10x and overview at 100x', () => {
  const event = getEvent('a11-liftoff')
  const transitionAnchors = { [event.id]: 400 }
  const input = {
    storyTimeMs: storyTimeAtMet(mission.narrative, event.metSeconds),
    visualTimeMs: 400,
    transitionAnchors,
    metSeconds: event.metSeconds,
    reducedMotion: false,
  }

  assert.equal(launchVisualStateAt({ ...input, speed: 1 }).guidedShotDurationMs, 560)
  assert.equal(launchVisualStateAt({ ...input, speed: 10 }).guidedShotDurationMs, 560)
  assert.equal(launchVisualStateAt({ ...input, speed: 100 }).guidedShotDurationMs, 0)
})
