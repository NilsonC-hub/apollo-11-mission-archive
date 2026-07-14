import assert from 'node:assert/strict'
import test from 'node:test'

import { metForControlPath } from '../../src/app/controlDeepLink.ts'

test('Control event deep links resolve to the verified event MET', () => {
  assert.equal(metForControlPath('/control/event/a11-touchdown'), 369_939.9)
  assert.equal(metForControlPath('/control/event/a11-splashdown/'), 703_115)
})

test('Control MET deep links preserve fractional mission time', () => {
  assert.equal(metForControlPath('/control/met/102%3A45%3A39.9'), 369_939.9)
  assert.equal(metForControlPath('/control/met/195:18:35'), 703_115)
})

test('unknown or malformed Control deep links do not invent a target MET', () => {
  assert.equal(metForControlPath('/control/event/not-an-event'), undefined)
  assert.equal(metForControlPath('/control/met/not-a-met'), undefined)
  assert.equal(metForControlPath('/control'), undefined)
})
