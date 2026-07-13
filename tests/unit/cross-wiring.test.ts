// tests/unit/cross-wiring.test.ts
// Unit test for source-manifest cross-wiring detection.
// Validates that the content-assertion check catches the case where a
// source's localPath points at an HTML snapshot that belongs to a DIFFERENT
// source — i.e., the file has the right extension and valid HTML, but its
// content does not contain the declared canonical marker.
//
// Spec ref: §9 — every source must trace to its declared identity; the
// validator must detect cross-wiring beyond just kind/magic checks.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const ROOT = resolve(__dirname, '..', '..')

const FIXTURE_DIR = join(ROOT, 'tests', 'fixtures', 'cross-wiring-test')

function setupFixture(): void {
  if (existsSync(FIXTURE_DIR)) {
    rmSync(FIXTURE_DIR, { recursive: true, force: true })
  }
  mkdirSync(join(FIXTURE_DIR, 'docs', 'sources'), { recursive: true })
  mkdirSync(join(FIXTURE_DIR, 'src', 'missions', 'apollo11'), { recursive: true })
}

function teardownFixture(): void {
  if (existsSync(FIXTURE_DIR)) {
    rmSync(FIXTURE_DIR, { recursive: true, force: true })
  }
}

// Inline validator logic — mirrors the content-assertion check in validate-sources.ts
function validateContentAssertions(
  fixtureRoot: string,
): Array<{ id: string; marker: string; message: string }> {
  const manifestPath = join(fixtureRoot, 'src', 'missions', 'apollo11', 'source-manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const errors: Array<{ id: string; marker: string; message: string }> = []

  for (const s of manifest.sources) {
    if (!s.contentAssertions?.htmlCanonicalMarker || !s.localPath) continue
    const abs = join(fixtureRoot, s.localPath)
    if (!existsSync(abs)) continue
    const ext =
      s.localPath.toLowerCase().endsWith('.html') || s.localPath.toLowerCase().endsWith('.htm')
    if (!ext) continue
    const content = readFileSync(abs, 'utf8')
    if (!content.includes(s.contentAssertions.htmlCanonicalMarker)) {
      errors.push({
        id: s.id,
        marker: s.contentAssertions.htmlCanonicalMarker,
        message: `HTML canonical marker '${s.contentAssertions.htmlCanonicalMarker}' not found in '${s.localPath}' — cross-wired`,
      })
    }
  }
  return errors
}

test('cross-wiring detection: wrong HTML path fails content assertion', () => {
  setupFixture()
  try {
    // Create two HTML snapshots with DIFFERENT canonical markers
    writeFileSync(
      join(FIXTURE_DIR, 'docs', 'sources', 'NASA-A11-MR.page.html'),
      '<html><head><title>Apollo 11 Mission Report</title></head><body>Apollo 11 Mission Report MSC-00171</body></html>',
    )
    writeFileSync(
      join(FIXTURE_DIR, 'docs', 'sources', 'NASA-A11-OVERVIEW.page.html'),
      '<html><head><title>Apollo 11 Mission Overview</title></head><body>Apollo 11 Mission Overview</body></html>',
    )

    // Manifest where source B's localPath is cross-wired to source A's HTML
    const manifest = {
      manifestVersion: 1,
      missionId: 'apollo11',
      sources: [
        {
          id: 'NASA-A11-MR',
          kind: 'web',
          title: 'Apollo 11 Mission Report (HTML landing page)',
          originalUrl: 'https://example.com/mr',
          accessedAt: '2026-07-13',
          rightsStatus: 'public domain',
          purpose: 'test',
          localPath: 'docs/sources/NASA-A11-MR.page.html',
          status: 'downloaded',
          contentAssertions: { htmlCanonicalMarker: 'Apollo 11 Mission Report' },
        },
        {
          id: 'NASA-A11-OVERVIEW',
          kind: 'web',
          title: 'Apollo 11 Mission Overview (HTML landing page)',
          originalUrl: 'https://example.com/overview',
          accessedAt: '2026-07-13',
          rightsStatus: 'public domain',
          purpose: 'test',
          // CROSS-WIRED: points at source A's HTML file, not its own
          localPath: 'docs/sources/NASA-A11-MR.page.html',
          status: 'downloaded',
          contentAssertions: { htmlCanonicalMarker: 'Apollo 11 Mission Overview' },
        },
      ],
    }

    writeFileSync(
      join(FIXTURE_DIR, 'src', 'missions', 'apollo11', 'source-manifest.json'),
      JSON.stringify(manifest, null, 2),
    )

    const errors = validateContentAssertions(FIXTURE_DIR)

    // The validator MUST find the cross-wiring: NASA-A11-OVERVIEW's localPath
    // points at NASA-A11-MR's HTML, which does NOT contain the
    // "Apollo 11 Mission Overview" canonical marker.
    assert.ok(errors.length > 0, 'Validator must detect cross-wiring')
    const overviewError = errors.find((e) => e.id === 'NASA-A11-OVERVIEW')
    assert.ok(overviewError, 'Error must identify NASA-A11-OVERVIEW as cross-wired')
    assert.ok(
      overviewError!.marker.includes('Apollo 11 Mission Overview'),
      'Error must reference the missing canonical marker',
    )
  } finally {
    teardownFixture()
  }
})

test('cross-wiring detection: correct HTML path passes content assertion', () => {
  setupFixture()
  try {
    writeFileSync(
      join(FIXTURE_DIR, 'docs', 'sources', 'NASA-A11-MR.page.html'),
      '<html><head><title>Apollo 11 Mission Report</title></head><body>Apollo 11 Mission Report MSC-00171</body></html>',
    )
    writeFileSync(
      join(FIXTURE_DIR, 'docs', 'sources', 'NASA-A11-OVERVIEW.page.html'),
      '<html><head><title>Apollo 11 Mission Overview</title></head><body>Apollo 11 Mission Overview</body></html>',
    )

    // Manifest where both sources point at their OWN HTML — no cross-wiring
    const manifest = {
      manifestVersion: 1,
      missionId: 'apollo11',
      sources: [
        {
          id: 'NASA-A11-MR',
          kind: 'web',
          title: 'Apollo 11 Mission Report (HTML landing page)',
          originalUrl: 'https://example.com/mr',
          accessedAt: '2026-07-13',
          rightsStatus: 'public domain',
          purpose: 'test',
          localPath: 'docs/sources/NASA-A11-MR.page.html',
          status: 'downloaded',
          contentAssertions: { htmlCanonicalMarker: 'Apollo 11 Mission Report' },
        },
        {
          id: 'NASA-A11-OVERVIEW',
          kind: 'web',
          title: 'Apollo 11 Mission Overview (HTML landing page)',
          originalUrl: 'https://example.com/overview',
          accessedAt: '2026-07-13',
          rightsStatus: 'public domain',
          purpose: 'test',
          localPath: 'docs/sources/NASA-A11-OVERVIEW.page.html',
          status: 'downloaded',
          contentAssertions: { htmlCanonicalMarker: 'Apollo 11 Mission Overview' },
        },
      ],
    }

    writeFileSync(
      join(FIXTURE_DIR, 'src', 'missions', 'apollo11', 'source-manifest.json'),
      JSON.stringify(manifest, null, 2),
    )

    const errors = validateContentAssertions(FIXTURE_DIR)

    assert.equal(
      errors.length,
      0,
      `Validator must pass when paths are correct. Errors: ${JSON.stringify(errors)}`,
    )
  } finally {
    teardownFixture()
  }
})
