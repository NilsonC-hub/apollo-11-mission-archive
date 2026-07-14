// tests/unit/satv-fe-table22.test.ts
// Regression test for Saturn V Flight Evaluation Report Table 2-2 and Table 4-3
// row/value mapping. Prevents the OCR/table misalignment that occurred in
// remediation round 2, where values from the "RANGE TIME ACTUAL SEC" column
// were assigned to the wrong event rows.
//
// This test reads from a shared JSON fixture (tests/fixtures/satv-fe-table22.json)
// and cross-checks against:
//   1. The fixture itself (internal consistency)
//   2. source-manifest.json (PDF SHA-256, source ID, report numbers)
//   3. SATV-FE-SEPARATION-VERIFICATION.txt (values present in the audit document)
//
// Source: NASA-A11-SATV-FE.pdf (MPR-SAT-FE-69-9), Table 2-2 (pp 41-42) + Table 4-3 (p 63).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const ROOT = resolve(__dirname, '..', '..')

// Load shared fixture
const fixture = JSON.parse(
  readFileSync(resolve(ROOT, 'tests', 'fixtures', 'satv-fe-table22.json'), 'utf8'),
)

// Load source manifest
const manifest = JSON.parse(
  readFileSync(resolve(ROOT, 'src', 'missions', 'apollo11', 'source-manifest.json'), 'utf8'),
)

// Load verification txt
const verificationTxt = readFileSync(
  resolve(ROOT, 'docs', 'audit', 'SATV-FE-SEPARATION-VERIFICATION.txt'),
  'utf8',
)

// Find the SATV-FE source in the manifest
const satvfeSource = manifest.sources.find((s: { id: string }) => s.id === fixture.sourceManifestId)

// Helper: round to 1 decimal place to avoid floating-point issues
const r1 = (n: number) => Math.round(n * 10) / 10

// Get specific events from fixture
const ev27 = fixture.table22.sicSiiRegion.events.find((e: { event: number }) => e.event === 27)
const ev29 = fixture.table22.sicSiiRegion.events.find((e: { event: number }) => e.event === 29)
const ev46 = fixture.table22.siiSivbRegion.events.find((e: { event: number }) => e.event === 46)
const ev48 = fixture.table22.siiSivbRegion.events.find((e: { event: number }) => e.event === 48)

// === Fixture vs manifest cross-check ===

test('fixture PDF SHA-256 matches source manifest', () => {
  assert.ok(satvfeSource, 'NASA-A11-SATV-FE must be in source manifest')
  assert.equal(satvfeSource.sha256, fixture.pdfSha256)
})

test('fixture PDF bytes matches source manifest', () => {
  assert.equal(satvfeSource.bytes, fixture.pdfBytes)
})

test('fixture report number matches source manifest', () => {
  assert.equal(satvfeSource.reportNumber, fixture.reportNumber)
  assert.equal(satvfeSource.nasaTmNumber, fixture.nasaTmNumber)
})

test('fixture NTRS citation ID matches source manifest', () => {
  assert.equal(satvfeSource.ntrsCitationId, fixture.ntrsCitationId)
})

// === Fixture vs verification txt cross-check ===

test('verification txt contains Table 4-3 S-IC/S-II ACTUAL 162.3', () => {
  assert.ok(verificationTxt.includes('162.3'), 'Verification txt must mention 162.3')
  assert.ok(
    verificationTxt.includes('Table 4-3') || verificationTxt.includes('Table 4-3'),
    'Verification txt must reference Table 4-3',
  )
})

test('verification txt contains Table 4-3 S-II/S-IVB ACTUAL 549.0', () => {
  assert.ok(verificationTxt.includes('549.0'), 'Verification txt must mention 549.0')
})

test('verification txt contains Event 27 TFB cross-check', () => {
  assert.ok(
    verificationTxt.includes('0.7') && verificationTxt.includes('161.6'),
    'Verification txt must contain TFB 0.7 and base 161.6 for Event 27',
  )
})

test('verification txt contains Event 46 TFB cross-check', () => {
  assert.ok(
    verificationTxt.includes('0.8') && verificationTxt.includes('548.2'),
    'Verification txt must contain TFB 0.8 and base 548.2 for Event 46',
  )
})

test('verification txt contains Event 29 direct ACTUAL 164.0', () => {
  assert.ok(verificationTxt.includes('164.0'), 'Verification txt must contain 164.0 for Event 29')
})

test('verification txt contains Event 48 direct ACTUAL 550.4', () => {
  assert.ok(verificationTxt.includes('550.4'), 'Verification txt must contain 550.4 for Event 48')
})

// === Table 4-3 primary source verification ===

test('Table 4-3 S-IC/S-II separation ACTUAL = 162.3 sec', () => {
  assert.equal(fixture.table43.separations['S-IC/S-II'].rangeTimeActual, 162.3)
})

test('Table 4-3 S-II/S-IVB separation ACTUAL = 549.0 sec', () => {
  assert.equal(fixture.table43.separations['S-II/S-IVB'].rangeTimeActual, 549.0)
})

// === Table 2-2 Event 27 (S-IC/S-II separation command) ===

test('Table 2-2 Event 27 has no direct ACTUAL cell', () => {
  assert.ok(ev27, 'Event 27 must be in fixture')
  assert.equal(ev27.rangeTimeActualDirect, null)
})

test('Table 2-2 Event 27 TFB = 0.7, base = 161.6, computed = 162.3', () => {
  assert.equal(ev27.timeFromBase, 0.7)
  assert.equal(fixture.table22.sicSiiRegion.timeBase, 161.6)
  assert.equal(r1(fixture.table22.sicSiiRegion.timeBase + ev27.timeFromBase), 162.3)
})

test('Table 2-2 Event 27 TFB cross-check matches Table 4-3 ACTUAL', () => {
  assert.equal(r1(fixture.table22.sicSiiRegion.timeBase + ev27.timeFromBase), ev27.table43Actual)
  assert.equal(ev27.table43Actual, fixture.table43.separations['S-IC/S-II'].rangeTimeActual)
})

test('Table 2-2 Event 27 is NOT 164.0 (that is Event 29)', () => {
  assert.notEqual(ev27.table43Actual, 164.0)
  assert.notEqual(r1(fixture.table22.sicSiiRegion.timeBase + ev27.timeFromBase), 164.0)
})

// === Table 2-2 Event 29 (S-II engine solenoid activation) ===

test('Table 2-2 Event 29 direct ACTUAL = 164.0 sec', () => {
  assert.ok(ev29, 'Event 29 must be in fixture')
  assert.equal(ev29.rangeTimeActualDirect, 164.0)
})

// === Table 2-2 Event 46 (S-II/S-IVB separation command) ===

test('Table 2-2 Event 46 has no direct ACTUAL cell', () => {
  assert.ok(ev46, 'Event 46 must be in fixture')
  assert.equal(ev46.rangeTimeActualDirect, null)
})

test('Table 2-2 Event 46 TFB = 0.8, base = 548.2, computed = 549.0', () => {
  assert.equal(ev46.timeFromBase, 0.8)
  assert.equal(fixture.table22.siiSivbRegion.timeBase, 548.2)
  assert.equal(r1(fixture.table22.siiSivbRegion.timeBase + ev46.timeFromBase), 549.0)
})

test('Table 2-2 Event 46 TFB cross-check matches Table 4-3 ACTUAL', () => {
  assert.equal(r1(fixture.table22.siiSivbRegion.timeBase + ev46.timeFromBase), ev46.table43Actual)
  assert.equal(ev46.table43Actual, fixture.table43.separations['S-II/S-IVB'].rangeTimeActual)
})

test('Table 2-2 Event 46 is NOT 550.4 (that is Event 48)', () => {
  assert.notEqual(ev46.table43Actual, 550.4)
  assert.notEqual(r1(fixture.table22.siiSivbRegion.timeBase + ev46.timeFromBase), 550.4)
})

// === Table 2-2 Event 48 (fuel chilldown pump off) ===

test('Table 2-2 Event 48 direct ACTUAL = 550.4 sec', () => {
  assert.ok(ev48, 'Event 48 must be in fixture')
  assert.equal(ev48.rangeTimeActualDirect, 550.4)
})

// === Base time consistency ===

test('S-IC/S-II region base time is consistent across all direct-ACTUAL events', () => {
  const base = fixture.table22.sicSiiRegion.timeBase
  for (const ev of fixture.table22.sicSiiRegion.events) {
    if (ev.rangeTimeActualDirect !== null) {
      // Allow ±0.1 sec tolerance for OCR rounding (e.g. Event 30: 166.1-4.4=161.7 vs base 161.6)
      const computed = r1(ev.rangeTimeActualDirect - ev.timeFromBase)
      assert.ok(
        Math.abs(computed - base) <= 0.1,
        `Event ${ev.event}: ${ev.rangeTimeActualDirect} - ${ev.timeFromBase} = ${computed}, expected base ${base} (±0.1 tolerance)`,
      )
    }
  }
})

test('S-II/S-IVB region base time is consistent across all direct-ACTUAL events', () => {
  const base = fixture.table22.siiSivbRegion.timeBase
  for (const ev of fixture.table22.siiSivbRegion.events) {
    if (ev.rangeTimeActualDirect !== null) {
      const computed = r1(ev.rangeTimeActualDirect - ev.timeFromBase)
      assert.ok(
        Math.abs(computed - base) <= 0.1,
        `Event ${ev.event}: ${ev.rangeTimeActualDirect} - ${ev.timeFromBase} = ${computed}, expected base ${base} (±0.1 tolerance)`,
      )
    }
  }
})

// === Ordering invariants ===

test('separation command (162.3) is before S-II solenoid activation (164.0)', () => {
  assert.ok(ev27.table43Actual < ev29.rangeTimeActualDirect)
})

test('separation command (549.0) is before fuel chilldown (550.4)', () => {
  assert.ok(ev46.table43Actual < ev48.rangeTimeActualDirect)
})
