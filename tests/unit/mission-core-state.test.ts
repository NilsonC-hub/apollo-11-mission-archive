import assert from 'node:assert/strict'
import { test } from 'node:test'

import { eventAtOrBefore, nextEventAfter, stateAtMet } from '../../src/mission-core/index.ts'
import { minimalMission } from '../fixtures/minimal-mission.ts'

test('state before the first event equals the declared initial state', () => {
  const state = stateAtMet(minimalMission, 9.999)
  assert.equal(state.phaseId, 'fixture-ground')
  assert.equal(state.components['fixture-carrier'].engineMode, 'off')
  assert.equal(state.components['fixture-payload'].parentId, 'fixture-carrier')
  assert.deepEqual(state.appliedEventIds, [])
})

test('event boundary applies exactly at event MET', () => {
  const before = stateAtMet(minimalMission, 9.999)
  const at = stateAtMet(minimalMission, 10)
  const after = stateAtMet(minimalMission, 10.001)
  assert.equal(before.phaseId, 'fixture-ground')
  assert.equal(at.phaseId, 'fixture-flight')
  assert.deepEqual(at, { ...after, metSeconds: 10 })
})

test('separation changes lifecycle and parent without mutating the definition', () => {
  const beforeDefinition = structuredClone(minimalMission.vehicle)
  const state = stateAtMet(minimalMission, 20)
  assert.equal(state.components['fixture-payload'].lifecycle, 'separating')
  assert.equal(state.components['fixture-payload'].parentId, null)
  assert.equal(state.components['fixture-carrier'].engineMode, 'cutoff')
  assert.deepEqual(minimalMission.vehicle, beforeDefinition)
})

test('jump, rewind, and repeated jump reconstruct identical serialized state', () => {
  const first = JSON.stringify(stateAtMet(minimalMission, 30))
  stateAtMet(minimalMission, 0)
  const second = JSON.stringify(stateAtMet(minimalMission, 30))
  assert.equal(second, first)
})

test('stateAtMet rejects wall-clock-like non-finite inputs', () => {
  assert.throws(() => stateAtMet(minimalMission, Number.NaN), /MET must be finite/)
})

test('event selectors return adjacent source events', () => {
  assert.equal(eventAtOrBefore(minimalMission.events, 20.001)?.id, 'fixture-separate')
  assert.equal(nextEventAfter(minimalMission.events, 20)?.id, 'fixture-free-flight')
  assert.equal(eventAtOrBefore(minimalMission.events, 0), undefined)
})
