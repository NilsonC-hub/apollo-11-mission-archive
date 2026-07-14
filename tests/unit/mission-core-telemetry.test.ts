import assert from 'node:assert/strict'
import { test } from 'node:test'

import { sampleTelemetryAtMet } from '../../src/mission-core/index.ts'
import type { TelemetryChannel } from '../../src/mission-core/index.ts'
import { minimalMission } from '../fixtures/minimal-mission.ts'

const channel = minimalMission.telemetry[0]

test('exact telemetry sampling returns the cited source sample', () => {
  const reading = sampleTelemetryAtMet(channel, 0)
  assert.equal(reading.kind, 'value')
  if (reading.kind === 'value') {
    assert.equal(reading.value, 0)
    assert.equal(reading.evidence, 'actual')
  }
})

test('linear interpolation is explicit and retains both sample inputs', () => {
  const reading = sampleTelemetryAtMet(channel, 5)
  assert.equal(reading.kind, 'value')
  if (reading.kind === 'value') {
    assert.equal(reading.value, 50)
    assert.equal(reading.evidence, 'interpolated')
    assert.equal(reading.interpolation?.beforeFactId, 'fixture-distance-sample-a')
    assert.equal(reading.interpolation?.afterFactId, 'fixture-distance-sample-b')
  }
})

test('sampling outside cited bounds returns missing, never zero', () => {
  const reading = sampleTelemetryAtMet(channel, 20)
  assert.equal(reading.kind, 'missing')
  if (reading.kind === 'missing') {
    assert.equal(reading.reason, 'not-available-in-source')
    assert.equal('value' in reading, false)
  }
})

test('channel with interpolation disabled returns missing between samples', () => {
  const reading = sampleTelemetryAtMet({ ...channel, interpolation: 'none' }, 5)
  assert.equal(reading.kind, 'missing')
})

test('missing interpolation boundary prevents fabricated values', () => {
  const broken: TelemetryChannel = structuredClone(channel)
  broken.samples[1].reading = {
    kind: 'missing',
    id: 'fixture-missing-sample',
    reason: 'not-available-in-source',
    unit: 'm',
    citations: [],
  }
  assert.equal(sampleTelemetryAtMet(broken, 5).kind, 'missing')
})
