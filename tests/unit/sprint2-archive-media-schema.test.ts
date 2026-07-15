import assert from 'node:assert/strict'
import test from 'node:test'

import {
  type DocumentPlateRecord,
  type HistoricalImageRecord,
  validateArchiveMediaRecords,
} from '../../src/missions/apollo11/mediaSchema.ts'

const hash = 'a'.repeat(64)

function imageRecord(): HistoricalImageRecord {
  return {
    kind: 'historical-image',
    id: 'a11-image-test',
    source: {
      sourceId: 'NASA-A11-IMAGE-TEST',
      landingPageUrl: 'https://www.nasa.gov/history/example/',
      originalUrl: 'https://images-assets.nasa.gov/image/example/example~orig.jpg',
      effectiveDownloadUrl: 'https://images-assets.nasa.gov/image/example/example~orig.jpg',
      accessedAt: '2026-07-15',
    },
    nasaImageId: 'S69-TEST',
    caption: 'A factual test caption.',
    alt: 'A Saturn V test image on a launch pad.',
    subjectTags: ['saturn-v', 'launch-pad'],
    capturedAt: '1969-07-01',
    raw: {
      localPath: 'assets/raw/images/test.jpg',
      sha256: hash,
      bytes: 1000,
      width: 1000,
      height: 800,
      format: 'jpeg',
    },
    delivery: [
      {
        localPath: 'public/missions/apollo11/images/test-480.webp',
        publicPath: '/missions/apollo11/images/test-480.webp',
        sha256: hash,
        bytes: 500,
        width: 480,
        height: 384,
        format: 'webp',
      },
      {
        localPath: 'public/missions/apollo11/images/test-960.webp',
        publicPath: '/missions/apollo11/images/test-960.webp',
        sha256: hash,
        bytes: 800,
        width: 960,
        height: 768,
        format: 'webp',
      },
      {
        localPath: 'public/missions/apollo11/images/test-960.jpg',
        publicPath: '/missions/apollo11/images/test-960.jpg',
        sha256: hash,
        bytes: 900,
        width: 960,
        height: 768,
        format: 'jpeg',
      },
    ],
    evidence: 'actual',
    rightsStatus: 'NASA photograph - U.S. government work, public domain.',
    processingNote: 'No crop; no color or tonal adjustment; resized and encoded only.',
  }
}

function documentRecord(): DocumentPlateRecord {
  return {
    kind: 'document-plate',
    id: 'a11-document-test',
    source: {
      sourceId: 'NASA-A11-MR',
      landingPageUrl: 'https://ntrs.nasa.gov/citations/19720015535',
      originalUrl: 'https://ntrs.nasa.gov/api/citations/19720015535/downloads/19720015535.pdf',
      effectiveDownloadUrl:
        'https://ntrs.nasa.gov/api/citations/19720015535/downloads/19720015535.pdf',
      accessedAt: '2026-07-15',
    },
    documentId: 'NASA SP-238',
    locator: { pdfPage: 18, printedPage: '3-4', label: 'Table 3-I' },
    caption: 'Launch sequence excerpt from the Apollo 11 Mission Report.',
    alt: 'Apollo 11 Mission Report page containing launch sequence data.',
    subjectTags: ['mission-report', 'saturn-v'],
    sourceDocument: {
      localPath: 'assets/raw/NASA-A11-MR.pdf',
      sha256: hash,
      bytes: 10000,
    },
    renderedPage: {
      localPath: 'assets/derived/images/apollo11-mission-report-table-3-i-p3-4.png',
      sha256: hash,
      bytes: 2000,
      width: 1200,
      height: 1600,
      format: 'png',
    },
    delivery: [
      {
        localPath: 'public/missions/apollo11/images/mission-report-p3-4-480.webp',
        publicPath: '/missions/apollo11/images/mission-report-p3-4-480.webp',
        sha256: hash,
        bytes: 500,
        width: 480,
        height: 640,
        format: 'webp',
      },
      {
        localPath: 'public/missions/apollo11/images/mission-report-p3-4-960.webp',
        publicPath: '/missions/apollo11/images/mission-report-p3-4-960.webp',
        sha256: hash,
        bytes: 900,
        width: 960,
        height: 1280,
        format: 'webp',
      },
      {
        localPath: 'public/missions/apollo11/images/mission-report-p3-4-960.jpg',
        publicPath: '/missions/apollo11/images/mission-report-p3-4-960.jpg',
        sha256: hash,
        bytes: 1000,
        width: 960,
        height: 1280,
        format: 'jpeg',
      },
    ],
    evidence: 'actual',
    rightsStatus: 'NASA technical report - U.S. government work, public domain.',
    processingNote: 'Full page; no crop; no color or tonal adjustment; resized and encoded only.',
  }
}

test('Sprint 2 Archive media schema accepts a local responsive NASA image record', () => {
  assert.deepEqual(validateArchiveMediaRecords([imageRecord()]), [])
})

test('Sprint 2 Archive media schema accepts a traceable document plate', () => {
  assert.deepEqual(validateArchiveMediaRecords([documentRecord()]), [])
})

test('Sprint 2 Archive media schema rejects hotlinks, missing responsive widths, and silent crop', () => {
  const record = imageRecord()
  record.source.effectiveDownloadUrl = 'https://example.com/hotlink.jpg'
  record.delivery = record.delivery.slice(0, 1)
  record.processingNote = 'Resized for the web.'

  const fields = validateArchiveMediaRecords([record]).map((issue) => issue.field)
  assert.ok(fields.includes('source.effectiveDownloadUrl'))
  assert.ok(fields.includes('delivery'))
  assert.ok(fields.includes('processingNote'))
})

test('Sprint 2 Archive media schema rejects aspect-ratio distortion', () => {
  const record = imageRecord()
  record.delivery = record.delivery.map((variant) => ({ ...variant, height: variant.height + 50 }))

  assert.ok(
    validateArchiveMediaRecords([record]).some((issue) => issue.field.endsWith('.dimensions')),
  )
})

test('Sprint 2 Archive media schema rejects malformed dates and cross-wired local paths', () => {
  const first = imageRecord()
  first.capturedAt = 'July 1, 1969'
  const second = imageRecord()
  second.id = 'a11-image-test-two'
  second.nasaImageId = 'S69-TEST-TWO'

  const issues = validateArchiveMediaRecords([first, second])
  assert.ok(issues.some((issue) => issue.field === 'capturedAt'))
  assert.ok(issues.some((issue) => issue.field === 'raw.localPath'))
  assert.ok(issues.some((issue) => issue.field.endsWith('.publicPath')))
  assert.ok(issues.some((issue) => issue.field.endsWith('.localPath')))
})

test('Sprint 2 Archive media schema rejects unscoped document paths and inconsistent source reuse', () => {
  const first = documentRecord()
  first.sourceDocument.localPath = 'tmp/report.pdf'
  first.renderedPage.localPath = 'tmp/page.png'
  const second = documentRecord()
  second.id = 'a11-document-test-two'
  second.sourceDocument.sha256 = 'b'.repeat(64)

  const issues = validateArchiveMediaRecords([first, second])
  assert.ok(issues.some((issue) => issue.field === 'sourceDocument.localPath'))
  assert.ok(issues.some((issue) => issue.field === 'renderedPage.localPath'))
})
