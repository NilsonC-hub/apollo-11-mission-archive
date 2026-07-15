import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'

import {
  type ArchiveMediaProcessingReport,
  validateApollo11ArchiveMedia,
} from '../../scripts/validate-archive-media.ts'
import processingReportJson from '../../docs/audit/SPRINT-2-ARCHIVE-MEDIA-PROCESSING.json' with { type: 'json' }
import { apollo11ArchiveMediaRecords } from '../../src/missions/apollo11/archiveMedia.ts'
import type { ArchiveMediaRecord } from '../../src/missions/apollo11/mediaSchema.ts'

function mutableRecords(): ArchiveMediaRecord[] {
  return structuredClone(apollo11ArchiveMediaRecords) as ArchiveMediaRecord[]
}

function mutableProcessingReport(): ArchiveMediaProcessingReport {
  return structuredClone(processingReportJson) as ArchiveMediaProcessingReport
}

test('Sprint 2 concrete Apollo 11 media collection resolves manifest and disk evidence', () => {
  assert.deepEqual(validateApollo11ArchiveMedia(), [])
})

test('Sprint 2 concrete validator rejects an unresolved canonical source binding', () => {
  const records = mutableRecords()
  records[0].source.sourceId = 'NASA-A11-NOT-IN-MANIFEST'

  assert.ok(
    validateApollo11ArchiveMedia(records).some(
      (issue) =>
        issue.field === 'source.sourceId' && issue.message.includes('canonical Apollo 11 source'),
    ),
  )
})

test('Sprint 2 concrete validator binds displayed image identity, rights, date, dimensions, and format', () => {
  const records = mutableRecords()
  const image = records.find((record) => record.kind === 'historical-image')
  assert.ok(image)
  image.nasaImageId = 'S69-FABRICATED'
  image.rightsStatus = 'Fabricated rights statement'
  image.source.publicationDate = '1969-07-02'
  image.capturedAt = '1969-07-02'
  image.raw.width += 1
  image.raw.height += 1
  image.raw.format = 'png'

  const issues = validateApollo11ArchiveMedia(records)
  assert.ok(issues.some((issue) => issue.id === image.id && issue.field === 'nasaImageId'))
  assert.ok(issues.some((issue) => issue.id === image.id && issue.field === 'rightsStatus'))
  assert.ok(
    issues.some((issue) => issue.id === image.id && issue.field === 'source.publicationDate'),
  )
  assert.ok(issues.some((issue) => issue.id === image.id && issue.field === 'capturedAt'))
  assert.ok(issues.some((issue) => issue.id === image.id && issue.field === 'raw.width'))
  assert.ok(issues.some((issue) => issue.id === image.id && issue.field === 'raw.height'))
  assert.ok(issues.some((issue) => issue.id === image.id && issue.field === 'raw.format'))
})

test('Sprint 2 concrete validator checks real image dimensions', () => {
  const records = mutableRecords()
  const image = records.find((record) => record.kind === 'historical-image')
  assert.ok(image)
  image.raw.width += 1

  assert.ok(
    validateApollo11ArchiveMedia(records).some(
      (issue) => issue.id === image.id && issue.field === 'raw.dimensions',
    ),
  )
})

test('Sprint 2 processing report cannot drift from record inputs, outputs, hashes, or recipe', () => {
  const report = mutableProcessingReport()
  const image = report.items[0]
  assert.ok(image.raw)
  image.raw.sha256 = 'b'.repeat(64)
  report.items[1].delivery[0].width += 1
  report.policy.resize = 'Unpinned resize method'

  const issues = validateApollo11ArchiveMedia(apollo11ArchiveMediaRecords, undefined, report)
  assert.ok(issues.some((issue) => issue.field === 'processingReport.raw.sha256'))
  assert.ok(issues.some((issue) => issue.field === 'processingReport.delivery.0.width'))
  assert.ok(issues.some((issue) => issue.field === 'processingReport.policy.resize'))
})

test('Sprint 2 processing report IDs map one-to-one to media records', () => {
  const report = mutableProcessingReport()
  const removed = report.items.shift()
  assert.ok(removed)
  report.items.push({ ...structuredClone(report.items[0]), id: 'a11-unknown-processing-record' })

  const issues = validateApollo11ArchiveMedia(apollo11ArchiveMediaRecords, undefined, report)
  assert.ok(
    issues.some(
      (issue) =>
        issue.id === removed.id &&
        issue.field === 'processingReport.items.id' &&
        issue.message.includes('missing'),
    ),
  )
  assert.ok(
    issues.some(
      (issue) =>
        issue.id === 'a11-unknown-processing-record' &&
        issue.field === 'processingReport.items.id' &&
        issue.message.includes('unknown'),
    ),
  )
})

test('Sprint 2 rendered document source is tracked for a fresh clone', () => {
  assert.doesNotThrow(() =>
    execFileSync(
      'git',
      ['ls-files', '--error-unmatch', 'assets/derived/images/NASA-A11-MR-p334-A-10.png'],
      { stdio: 'ignore' },
    ),
  )
})
