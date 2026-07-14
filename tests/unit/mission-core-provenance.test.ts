import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createMissingValue,
  hasCitationLocator,
  mergeCitations,
} from '../../src/mission-core/index.ts'

test('missing value has no numeric fallback field', () => {
  const missing = createMissingValue({
    id: 'fixture-missing',
    reason: 'not-available-in-source',
    unit: 'm',
  })
  assert.equal(missing.kind, 'missing')
  assert.equal('value' in missing, false)
})

test('citation merge removes exact duplicates without discarding locators', () => {
  const citation = { sourceId: 'TEST', pages: '1', locator: 'row 2' }
  assert.deepEqual(mergeCitations([citation], [citation]), [citation])
})

test('citation locator requires pages or a semantic locator', () => {
  assert.equal(hasCitationLocator({ sourceId: 'TEST' }), false)
  assert.equal(hasCitationLocator({ sourceId: 'TEST', locator: 'event row' }), true)
})
