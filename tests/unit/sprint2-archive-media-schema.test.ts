import assert from 'node:assert/strict'
import test from 'node:test'

import {
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

test('Sprint 2 Archive media schema accepts a local responsive NASA image record', () => {
  assert.deepEqual(validateArchiveMediaRecords([imageRecord()]), [])
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
