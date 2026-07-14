import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  compileNarrative,
  metAtStoryTime,
  narrativePositionAtStoryTime,
  storyTimeAtMet,
  visualStateAtStoryTime,
} from '../../src/mission-core/index.ts'
import { minimalMission } from '../fixtures/minimal-mission.ts'

const segments = minimalMission.narrative

test('compileNarrative gives each segment deterministic story bounds', () => {
  const compiled = compileNarrative(segments)
  assert.deepEqual(
    compiled.map(({ storyStartMs, motionEndMs, storyEndMs }) => ({
      storyStartMs,
      motionEndMs,
      storyEndMs,
    })),
    [
      { storyStartMs: 0, motionEndMs: 2000, storyEndMs: 2250 },
      { storyStartMs: 2250, motionEndMs: 3250, storyEndMs: 3250 },
    ],
  )
})

test('storyTime maps linearly to MET inside a motion segment', () => {
  assert.equal(metAtStoryTime(segments, 1000), 10)
  assert.equal(metAtStoryTime(segments, 2750), 30)
})

test('presentation pause freezes MET without pretending to be an operational hold', () => {
  const position = narrativePositionAtStoryTime(segments, 2125)
  assert.equal(position.kind, 'presentation-pause')
  assert.equal(position.metSeconds, 20)
})

test('story and MET round-trip within moving segments under 50 ms', () => {
  for (const storyTime of [0, 250, 1000, 1750, 2400, 2750, 3200]) {
    const met = metAtStoryTime(segments, storyTime)
    const roundTrip = storyTimeAtMet(segments, met)
    assert.ok(Math.abs(roundTrip - storyTime) < 50)
  }
})

test('storyTimeAtMet uses the earliest canonical story time at a paused boundary', () => {
  assert.equal(storyTimeAtMet(segments, 20), 2000)
})

test('narrative mapping clamps outside its authored bounds', () => {
  assert.equal(metAtStoryTime(segments, -100), 0)
  assert.equal(metAtStoryTime(segments, 99999), 40)
})

test('narrative mapping rejects discontinuous MET segments', () => {
  const broken = structuredClone(segments)
  broken[1].metStart = 21
  assert.throws(() => compileNarrative(broken), /previous segment MET end/)
})

test('visual state reconstructs from authored story time without using the MET span', () => {
  const first = visualStateAtStoryTime(segments, 1_000)
  assert.deepEqual(first, { segmentId: 'fixture-segment-a', visualTimeMs: 1_000, progress: 0.5 })
  assert.deepEqual(visualStateAtStoryTime(segments, 1_000), first)

  const differentMetSpan = structuredClone(segments)
  differentMetSpan[0].metEnd = 2_000
  differentMetSpan[1].metStart = 2_000
  differentMetSpan[1].metEnd = 4_000
  assert.deepEqual(visualStateAtStoryTime(differentMetSpan, 1_000), first)
})
