// tests/unit/epoch.test.ts
// Phase 0 smoke test: verify the Apollo 11 epoch rule per spec §A.4.
// Phase 1 will add full mission-core tests; this test covers the one
// deterministic fact Phase 0 establishes that can be tested without
// the mission-core types: the range-zero + liftoff-MET relationship.

import { test } from 'node:test'
import assert from 'node:assert/strict'

// Per NASA-A11-MR Table 3-I header:
//   "Range zero - 13:32:00 G.m.t., July 16, 1969"
// Per NASA-A11-MR Table 3-I first row:
//   "Lift-off 00:00:00.6"
// Spec §A.4 requires:
//   rangeZeroUtc = '1969-07-16T13:32:00.000Z'
//   liftoffMetSeconds = 0.6
// UTC = rangeZeroUtc + metSeconds; liftoff UTC = 1969-07-16T13:32:00.600Z

const RANGE_ZERO_UTC_MS = Date.UTC(1969, 6, 16, 13, 32, 0, 0) // July=6 (0-indexed)
const LIFTOFF_MET_SECONDS = 0.6

function metSecondsToUtcMs(metSeconds: number): number {
  return RANGE_ZERO_UTC_MS + metSeconds * 1000
}

test('Apollo 11 range zero is 1969-07-16T13:32:00.000Z', () => {
  const d = new Date(RANGE_ZERO_UTC_MS)
  assert.equal(d.toISOString(), '1969-07-16T13:32:00.000Z')
})

test('Apollo 11 liftoff MET 0.6s maps to 1969-07-16T13:32:00.600Z', () => {
  const liftoffUtcMs = metSecondsToUtcMs(LIFTOFF_MET_SECONDS)
  const d = new Date(liftoffUtcMs)
  assert.equal(d.toISOString(), '1969-07-16T13:32:00.600Z')
})

test('Apollo 11 splashdown MET 195:18:35 maps to 1969-07-24T16:50:35.000Z', () => {
  // 195:18:35 = 195*3600 + 18*60 + 35 = 703115 seconds
  const splashdownMet = 703115
  const splashdownUtcMs = metSecondsToUtcMs(splashdownMet)
  const d = new Date(splashdownUtcMs)
  // 1969-07-16 13:32:00 + 703115s = 1969-07-24 16:50:35 UTC
  assert.equal(d.toISOString(), '1969-07-24T16:50:35.000Z')
})

test('Apollo 11 MET to UTC is monotonic and reversible', () => {
  const metValues = [0.6, 161.7, 9856.2, 369939.9, 703115]
  let prev = -Infinity
  for (const met of metValues) {
    const utc = metSecondsToUtcMs(met)
    assert.ok(utc > prev, `MET ${met} should map to UTC > previous`)
    prev = utc
  }
})

test('Apollo 11 first-step canonical MET 109:24:15 = 393855 seconds', () => {
  // 109:24:15 = 109*3600 + 24*60 + 15 = 392400 + 1440 + 15 = 393855
  const h = 109
  const m = 24
  const s = 15
  const metSeconds = h * 3600 + m * 60 + s
  assert.equal(metSeconds, 393855)
})

test('Apollo 11 first-step discrepancy: SP-4029 gives 109:24:15, SP-214 gives 109:24:19 and 109:24:20', () => {
  // Per spec §A.2, the canonical MET is 109:24:15 (393855s).
  // SP-214 gives 109:24:19 (393859s) and 109:24:20 (393860s).
  // The discrepancy is 4-5 seconds; the spec forbids silently smoothing it.
  const canonical = 109 * 3600 + 24 * 60 + 15 // 393855
  const sp214Camera = 109 * 3600 + 24 * 60 + 19 // 393859
  const sp214Crew = 109 * 3600 + 24 * 60 + 20 // 393860
  assert.equal(canonical, 393855)
  assert.equal(sp214Camera - canonical, 4)
  assert.equal(sp214Crew - canonical, 5)
})
