import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  formatMet,
  metSecondsToUtcIso,
  metSecondsToUtcMs,
  parseMet,
  utcMsToMetSeconds,
} from '../../src/mission-core/index.ts'
import type { MissionEpochs } from '../../src/mission-core/index.ts'

const epochs: MissionEpochs = {
  rangeZeroUtc: '2000-01-01T00:00:00.000Z',
  liftoffMetSeconds: 0.5,
  displayPrecision: 'source-preserved',
}

test('parseMet preserves fractional seconds and hours greater than 24', () => {
  assert.equal(parseMet('125:03:04.25'), 450184.25)
})

test('parseMet supports signed pre-range-zero values', () => {
  assert.equal(parseMet('-001:02:03.5'), -3723.5)
})

test('parseMet rejects invalid minute and second fields', () => {
  assert.throws(() => parseMet('001:60:00'), /Invalid MET/)
  assert.throws(() => parseMet('001:00:60'), /Invalid MET/)
})

test('formatMet uses tabular mission-hour shape and requested precision', () => {
  assert.equal(formatMet(0.6, { fractionDigits: 1 }), '000:00:00.6')
  assert.equal(formatMet(450184.25, { fractionDigits: 2 }), '125:03:04.25')
})

test('formatMet carries rounded seconds into minutes', () => {
  assert.equal(formatMet(59.96, { fractionDigits: 1 }), '000:01:00.0')
})

test('MET and UTC conversion is reversible', () => {
  for (const met of [-10, 0, 0.5, 12345.678]) {
    const utc = metSecondsToUtcMs(epochs, met)
    assert.ok(Math.abs(utcMsToMetSeconds(epochs, utc) - met) < 1e-9)
  }
})

test('UTC conversion requires an explicit Z timezone', () => {
  assert.throws(
    () => metSecondsToUtcMs({ ...epochs, rangeZeroUtc: '2000-01-01T00:00:00' }, 0),
    /ending in Z/,
  )
})

test('UTC ISO conversion retains millisecond precision', () => {
  assert.equal(metSecondsToUtcIso(epochs, 1.25), '2000-01-01T00:00:01.250Z')
})
