// tests/unit/cross-wiring.test.ts
// Unit test for source-manifest cross-wiring detection.
// Validates that the content-assertion check catches the case where a
// source's localPath points at an HTML snapshot that belongs to a DIFFERENT
// source — i.e., the file has the right extension and valid HTML, but its
// content does not contain the declared canonical marker.
//
// This test calls the REAL production validator (scripts/validate-sources.ts)
// via its exported `validate` function with --manifest/--root fixture paths.
// It does NOT duplicate validation logic.
//
// Spec ref: §9 — every source must trace to its declared identity; the
// validator must detect cross-wiring beyond just kind/magic checks.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validate } from '../../scripts/validate-sources.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const ROOT = resolve(__dirname, '..', '..')

const FIXTURE_DIR = join(ROOT, 'tests', 'fixtures', 'cross-wiring-test')

function setupFixture(): string {
  if (existsSync(FIXTURE_DIR)) {
    rmSync(FIXTURE_DIR, { recursive: true, force: true })
  }
  mkdirSync(join(FIXTURE_DIR, 'docs', 'sources'), { recursive: true })
  mkdirSync(join(FIXTURE_DIR, 'src', 'missions', 'apollo11'), { recursive: true })
  return FIXTURE_DIR
}

function teardownFixture(): void {
  if (existsSync(FIXTURE_DIR)) {
    rmSync(FIXTURE_DIR, { recursive: true, force: true })
  }
}

function writeManifest(dir: string, sources: object[]): void {
  const manifest = {
    manifestVersion: 1,
    missionId: 'apollo11',
    sources,
  }
  writeFileSync(
    join(dir, 'src', 'missions', 'apollo11', 'source-manifest.json'),
    JSON.stringify(manifest, null, 2),
  )
}

test('cross-wiring detection: wrong HTML path fails content assertion via real validator', () => {
  const dir = setupFixture()
  try {
    // Create two HTML snapshots with DIFFERENT canonical markers
    writeFileSync(
      join(dir, 'docs', 'sources', 'NASA-A11-MR.page.html'),
      '<html><head><title>Apollo 11 Mission Report</title></head><body>Apollo 11 Mission Report MSC-00171</body></html>',
    )
    writeFileSync(
      join(dir, 'docs', 'sources', 'NASA-A11-OVERVIEW.page.html'),
      '<html><head><title>Apollo 11 Mission Overview</title></head><body>Apollo 11 Mission Overview</body></html>',
    )

    // Manifest where source B's localPath is cross-wired to source A's HTML
    writeManifest(dir, [
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
    ])

    const manifestPath = join(dir, 'src', 'missions', 'apollo11', 'source-manifest.json')
    const errors = validate(manifestPath, dir)

    // The real validator MUST detect the cross-wiring
    const crossWiredErrors = errors.filter(
      (e) =>
        e.sourceId === 'NASA-A11-OVERVIEW' && e.field === 'contentAssertions.htmlCanonicalMarker',
    )
    assert.ok(
      crossWiredErrors.length > 0,
      'Real validator must detect cross-wired HTML path via content assertion',
    )
  } finally {
    teardownFixture()
  }
})

test('cross-wiring detection: correct HTML path passes content assertion via real validator', () => {
  const dir = setupFixture()
  try {
    writeFileSync(
      join(dir, 'docs', 'sources', 'NASA-A11-MR.page.html'),
      '<html><head><title>Apollo 11 Mission Report</title></head><body>Apollo 11 Mission Report MSC-00171</body></html>',
    )
    writeFileSync(
      join(dir, 'docs', 'sources', 'NASA-A11-OVERVIEW.page.html'),
      '<html><head><title>Apollo 11 Mission Overview</title></head><body>Apollo 11 Mission Overview</body></html>',
    )

    // Manifest where both sources point at their OWN HTML — no cross-wiring
    writeManifest(dir, [
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
    ])

    const manifestPath = join(dir, 'src', 'missions', 'apollo11', 'source-manifest.json')
    const errors = validate(manifestPath, dir)

    const contentErrors = errors.filter((e) => e.field === 'contentAssertions.htmlCanonicalMarker')
    assert.equal(
      contentErrors.length,
      0,
      `Validator must pass when paths are correct. Errors: ${JSON.stringify(contentErrors)}`,
    )
  } finally {
    teardownFixture()
  }
})

test('cross-wiring detection: production POSTTRAJ scenario — unique wrong HTML path fails', () => {
  // This test reproduces the original R-013 cross-wiring scenario:
  // NASA-A11-POSTTRAJ (a PDF source) has its localPath pointing at
  // NASA-A11-MR.page.html (an HTML snapshot belonging to a different source).
  // The validator must catch this via the kind/localPath consistency check
  // (binary kind pointing at HTML) even without content assertions.
  const dir = setupFixture()
  try {
    writeFileSync(
      join(dir, 'docs', 'sources', 'NASA-A11-MR.page.html'),
      '<html><head><title>Apollo 11 Mission Report</title></head><body>Mission Report</body></html>',
    )

    // POSTTRAJ is declared as kind=pdf but points at MR's HTML snapshot
    writeManifest(dir, [
      {
        id: 'NASA-A11-MR',
        kind: 'web',
        title: 'Apollo 11 Mission Report (HTML landing page)',
        originalUrl: 'https://ntrs.nasa.gov/citations/19700008096',
        accessedAt: '2026-07-13',
        rightsStatus: 'public domain',
        purpose: 'test',
        localPath: 'docs/sources/NASA-A11-MR.page.html',
        status: 'downloaded',
        contentAssertions: { htmlCanonicalMarker: 'Mission Report' },
      },
      {
        id: 'NASA-A11-POSTTRAJ',
        kind: 'pdf',
        title: 'Apollo 11 Post-launch Operational Trajectory',
        originalUrl: 'https://ntrs.nasa.gov/citations/19690026499',
        accessedAt: '2026-07-13',
        rightsStatus: 'public domain',
        purpose: 'test',
        // CROSS-WIRED: pdf kind pointing at an HTML file
        localPath: 'docs/sources/NASA-A11-MR.page.html',
        status: 'downloaded',
      },
    ])

    const manifestPath = join(dir, 'src', 'missions', 'apollo11', 'source-manifest.json')
    const errors = validate(manifestPath, dir)

    // The validator must catch: (a) binary kind=pdf with HTML localPath,
    // and (b) duplicate localPath cross-wiring
    const posttrajErrors = errors.filter((e) => e.sourceId === 'NASA-A11-POSTTRAJ')
    assert.ok(
      posttrajErrors.length > 0,
      'Real validator must detect POSTTRAJ cross-wiring (pdf kind → HTML path)',
    )
    // Must catch either the kind mismatch or the duplicate localPath
    const hasKindError = posttrajErrors.some((e) => e.message.includes('HTML page'))
    const hasDuplicateError = posttrajErrors.some(
      (e) => e.message.includes('cross-wired') || e.message.includes('also claimed by'),
    )
    assert.ok(
      hasKindError || hasDuplicateError,
      `POSTTRAJ errors must include kind mismatch or duplicate path. Got: ${JSON.stringify(posttrajErrors)}`,
    )
  } finally {
    teardownFixture()
  }
})

test('cross-wiring detection: production markers are unique across all HTML snapshots', () => {
  // Verify that each production htmlCanonicalMarker appears in exactly ONE
  // HTML snapshot file. This ensures the markers can detect cross-wiring —
  // if a marker appeared in multiple files, it could not distinguish them.
  const manifest = JSON.parse(
    readFileSync(resolve(ROOT, 'src/missions/apollo11/source-manifest.json'), 'utf8'),
  )

  // Collect all sources with HTML localPaths and markers (web + dataset kinds)
  const htmlSources = manifest.sources.filter(
    (s: {
      kind: string
      localPath?: string
      contentAssertions?: { htmlCanonicalMarker?: string }
    }) =>
      s.localPath && s.localPath.endsWith('.page.html') && s.contentAssertions?.htmlCanonicalMarker,
  )

  assert.ok(
    htmlSources.length >= 14,
    `Expected at least 14 HTML sources with markers, got ${htmlSources.length}`,
  )

  for (const source of htmlSources) {
    const marker = source.contentAssertions.htmlCanonicalMarker

    // Check how many HTML snapshot files contain this marker
    let hitCount = 0
    const hitFiles: string[] = []
    for (const other of htmlSources) {
      const otherPath = resolve(ROOT, other.localPath)
      if (!existsSync(otherPath)) continue
      const content = readFileSync(otherPath, 'utf8')
      if (content.includes(marker)) {
        hitCount++
        hitFiles.push(other.id)
      }
    }

    assert.equal(
      hitCount,
      1,
      `Marker '${marker}' for ${source.id} must be unique (found in ${hitCount} files: ${hitFiles.join(', ')}). ` +
        `If the marker appears in multiple files, it cannot detect cross-wiring.`,
    )
  }
})

test('cross-wiring detection: all production HTML sources have contentAssertions', () => {
  // All local HTML snapshots must declare an htmlCanonicalMarker.
  // Sources without markers do not get cross-wiring protection.
  const manifest = JSON.parse(
    readFileSync(resolve(ROOT, 'src/missions/apollo11/source-manifest.json'), 'utf8'),
  )

  const htmlSources = manifest.sources.filter(
    (s: { kind: string; localPath?: string }) => s.localPath && s.localPath.endsWith('.page.html'),
  )

  for (const source of htmlSources) {
    assert.ok(
      source.contentAssertions?.htmlCanonicalMarker,
      `HTML source ${source.id} must have contentAssertions.htmlCanonicalMarker`,
    )
  }
})
