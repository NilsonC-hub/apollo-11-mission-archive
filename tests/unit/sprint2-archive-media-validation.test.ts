import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'

import { validateApollo11ArchiveMedia } from '../../scripts/validate-archive-media.ts'
import { apollo11ArchiveMediaRecords } from '../../src/missions/apollo11/archiveMedia.ts'
import type { ArchiveMediaRecord } from '../../src/missions/apollo11/mediaSchema.ts'

function mutableRecords(): ArchiveMediaRecord[] {
  return structuredClone(apollo11ArchiveMediaRecords) as ArchiveMediaRecord[]
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

test('Sprint 2 rendered document source is tracked for a fresh clone', () => {
  assert.doesNotThrow(() =>
    execFileSync(
      'git',
      ['ls-files', '--error-unmatch', 'assets/derived/images/NASA-A11-MR-p334-A-10.png'],
      { stdio: 'ignore' },
    ),
  )
})
