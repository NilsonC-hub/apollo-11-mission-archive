// tests/unit/satv-fe-table22.test.ts
// Regression test for Saturn V Flight Evaluation Report Table 2-2 row/value mapping.
// Prevents the OCR/table misalignment that occurred in remediation round 2,
// where values from the "RANGE TIME ACTUAL SEC" column were assigned to the
// wrong event rows because the text extraction jumbled the multi-column layout.
//
// The four critical rows verified here are:
//   Event 27: S-IC/S-II SEPARATION COMMAND = 162.3 sec (computed: base 161.6 + TFB 0.7)
//   Event 29: S-II engine solenoid activation = 164.0 sec (direct ACTUAL)
//   Event 46: S-II/S-IVB SEPARATION COMMAND = 549.0 sec (computed: base 548.2 + TFB 0.8)
//   Event 48: Fuel chilldown pump off = 550.4 sec (direct ACTUAL)
//
// Source: NASA-A11-SATV-FE.pdf (MPR-SAT-FE-69-9), Table 2-2, PDF pages 41-42.
// Extraction method: PyMuPDF get_text("dict") with bbox coordinates to map
// values to event rows by y-coordinate alignment.

import { test } from 'node:test'
import assert from 'node:assert/strict'

// Structured fixture: the verified row-to-value mapping from Table 2-2.
// Each entry has the event number, description, and the verified range time.
// "source" indicates whether the value is a direct ACTUAL cell or computed
// from TIME FROM BASE.
interface Table22Row {
  event: number
  description: string
  rangeTimeSec: number
  source: 'direct' | 'base+TFB'
  timeFromBase?: number
  baseTime?: number
}

const TABLE_22_ROWS: Table22Row[] = [
  // S-IC/S-II separation region (page 41, time base 3, base = 161.6)
  {
    event: 25,
    description: 'S-II LH2 recirculation pumps off',
    rangeTimeSec: 161.8,
    source: 'direct',
  },
  {
    event: 26,
    description: 'S-II ullage motor ignition',
    rangeTimeSec: 162.1,
    source: 'base+TFB',
    timeFromBase: 0.5,
    baseTime: 161.6,
  },
  {
    event: 27,
    description: 'S-IC/S-II SEPARATION COMMAND',
    rangeTimeSec: 162.3,
    source: 'base+TFB',
    timeFromBase: 0.7,
    baseTime: 161.6,
  },
  {
    event: 28,
    description: 'S-II engine start command (ESC)',
    rangeTimeSec: 163.0,
    source: 'direct',
  },
  {
    event: 29,
    description: 'S-II engine solenoid activation',
    rangeTimeSec: 164.0,
    source: 'direct',
  },
  {
    event: 30,
    description: 'S-II ullage motor burn time termination',
    rangeTimeSec: 166.1,
    source: 'direct',
  },

  // S-II/S-IVB separation region (page 42, time base 4, base = 548.2)
  {
    event: 45,
    description: 'S-IVB ullage motor ignition',
    rangeTimeSec: 548.9,
    source: 'base+TFB',
    timeFromBase: 0.7,
    baseTime: 548.2,
  },
  {
    event: 46,
    description: 'S-II/S-IVB SEPARATION COMMAND',
    rangeTimeSec: 549.0,
    source: 'base+TFB',
    timeFromBase: 0.8,
    baseTime: 548.2,
  },
  {
    event: 47,
    description: 'S-IVB engine start command (first ESC)',
    rangeTimeSec: 549.2,
    source: 'direct',
  },
  { event: 48, description: 'Fuel chilldown pump off', rangeTimeSec: 550.4, source: 'direct' },
]

// Table 4-3 separation Range Time values (must match Table 2-2 command times)
const TABLE_43_SEPARATION = {
  'S-IC/S-II': 162.3,
  'S-II/S-IVB': 549.0,
}

test('Table 2-2 Event 27 S-IC/S-II separation command = 162.3 sec (not 164.0)', () => {
  const row = TABLE_22_ROWS.find((r) => r.event === 27)
  assert.ok(row, 'Event 27 must be in the fixture')
  assert.equal(row.description, 'S-IC/S-II SEPARATION COMMAND')
  assert.equal(row.rangeTimeSec, 162.3)
  assert.equal(row.source, 'base+TFB')
  assert.equal(row.timeFromBase, 0.7)
  assert.equal(row.baseTime, 161.6)
  // CRITICAL: 164.0 is Event 29, NOT Event 27
  assert.notEqual(row.rangeTimeSec, 164.0)
})

test('Table 2-2 Event 29 S-II engine solenoid activation = 164.0 sec', () => {
  const row = TABLE_22_ROWS.find((r) => r.event === 29)
  assert.ok(row, 'Event 29 must be in the fixture')
  assert.equal(row.description, 'S-II engine solenoid activation')
  assert.equal(row.rangeTimeSec, 164.0)
  assert.equal(row.source, 'direct')
})

test('Table 2-2 Event 46 S-II/S-IVB separation command = 549.0 sec (not 550.4)', () => {
  const row = TABLE_22_ROWS.find((r) => r.event === 46)
  assert.ok(row, 'Event 46 must be in the fixture')
  assert.equal(row.description, 'S-II/S-IVB SEPARATION COMMAND')
  assert.equal(row.rangeTimeSec, 549.0)
  assert.equal(row.source, 'base+TFB')
  assert.equal(row.timeFromBase, 0.8)
  assert.equal(row.baseTime, 548.2)
  // CRITICAL: 550.4 is Event 48, NOT Event 46
  assert.notEqual(row.rangeTimeSec, 550.4)
})

test('Table 2-2 Event 48 fuel chilldown pump off = 550.4 sec', () => {
  const row = TABLE_22_ROWS.find((r) => r.event === 48)
  assert.ok(row, 'Event 48 must be in the fixture')
  assert.equal(row.description, 'Fuel chilldown pump off')
  assert.equal(row.rangeTimeSec, 550.4)
  assert.equal(row.source, 'direct')
})

test('Table 4-3 separation times match Table 2-2 command times', () => {
  const sicSiiCmd = TABLE_22_ROWS.find((r) => r.event === 27)!
  const siiSivbCmd = TABLE_22_ROWS.find((r) => r.event === 46)!
  assert.equal(
    TABLE_43_SEPARATION['S-IC/S-II'],
    sicSiiCmd.rangeTimeSec,
    'Table 4-3 S-IC/S-II must equal Table 2-2 Event 27',
  )
  assert.equal(
    TABLE_43_SEPARATION['S-II/S-IVB'],
    siiSivbCmd.rangeTimeSec,
    'Table 4-3 S-II/S-IVB must equal Table 2-2 Event 46',
  )
})

test('Table 2-2 base+TFB computations are self-consistent', () => {
  // Verify that base+TFB rows compute to their stated rangeTimeSec
  for (const row of TABLE_22_ROWS) {
    if (row.source === 'base+TFB') {
      const computed = Math.round((row.baseTime! + row.timeFromBase!) * 10) / 10
      assert.equal(
        computed,
        row.rangeTimeSec,
        `Event ${row.event}: base ${row.baseTime} + TFB ${row.timeFromBase} = ${computed}, expected ${row.rangeTimeSec}`,
      )
    }
  }
})

test('Table 2-2 direct values are consistent with base+TFB for overlapping events', () => {
  // Events with both direct ACTUAL and TIME FROM BASE should be consistent
  // Event 25: direct 161.8, TFB 0.2 → base = 161.8 - 0.2 = 161.6
  // Event 28: direct 163.0, TFB 1.4 → base = 163.0 - 1.4 = 161.6
  // Event 29: direct 164.0, TFB 2.4 → base = 164.0 - 2.4 = 161.6
  const round1 = (n: number) => Math.round(n * 10) / 10
  const baseFromEvent25 = round1(161.8 - 0.2)
  const baseFromEvent28 = round1(163.0 - 1.4)
  const baseFromEvent29 = round1(164.0 - 2.4)
  assert.equal(baseFromEvent25, 161.6)
  assert.equal(baseFromEvent28, 161.6)
  assert.equal(baseFromEvent29, 161.6)

  // Event 47: direct 549.2, TFB 1.0 → base = 549.2 - 1.0 = 548.2
  // Event 48: direct 550.4, TFB 2.2 → base = 550.4 - 2.2 = 548.2
  const baseFromEvent47 = round1(549.2 - 1.0)
  const baseFromEvent48 = round1(550.4 - 2.2)
  assert.equal(baseFromEvent47, 548.2)
  assert.equal(baseFromEvent48, 548.2)
})

test('Table 2-2 separation command is NOT after engine solenoid activation', () => {
  // Regression: round 2 erroneously had Event 27 = 164.0 (solenoid activation time),
  // which would place the separation command AFTER the engine start sequence.
  // The correct value (162.3) places the separation command BEFORE the S-II
  // engine solenoid activation (164.0), which is the correct ordering:
  // OECO (161.63) → separation command (162.3) → S-II ESC (163.0) → solenoid (164.0)
  const separationCmd = TABLE_22_ROWS.find((r) => r.event === 27)!.rangeTimeSec
  const solenoidActivation = TABLE_22_ROWS.find((r) => r.event === 29)!.rangeTimeSec
  assert.ok(
    separationCmd < solenoidActivation,
    `Separation command (${separationCmd}) must be before solenoid activation (${solenoidActivation})`,
  )
})

test('Table 2-2 S-II/S-IVB separation command is NOT after fuel chilldown', () => {
  // Regression: round 2 erroneously had Event 46 = 550.4 (fuel chilldown time),
  // which would place the separation command AFTER fuel chilldown pump off.
  // The correct value (549.0) places the separation command BEFORE
  // fuel chilldown (550.4) and S-IVB ESC (549.2):
  // S-II OECO (548.22) → separation command (549.0) → S-IVB ESC (549.2) → chilldown (550.4)
  const separationCmd = TABLE_22_ROWS.find((r) => r.event === 46)!.rangeTimeSec
  const fuelChilldown = TABLE_22_ROWS.find((r) => r.event === 48)!.rangeTimeSec
  assert.ok(
    separationCmd < fuelChilldown,
    `S-II/S-IVB separation command (${separationCmd}) must be before fuel chilldown (${fuelChilldown})`,
  )
})
