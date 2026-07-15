import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isControlPlaybackPath,
  isControlReferencePath,
  metForControlPath,
  SATURN_V_INSPECTOR_PATH,
} from '../../src/app/controlDeepLink.ts'

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
  assert.equal(metForControlPath('/control/event/%E0%A4%A'), undefined)
  assert.equal(metForControlPath('/control/met/not-a-met'), undefined)
  assert.equal(metForControlPath('/control'), undefined)
})

test('Saturn V Inspector is a stable non-playing Control reference route', () => {
  assert.equal(metForControlPath(SATURN_V_INSPECTOR_PATH), 0)
  assert.equal(metForControlPath(`${SATURN_V_INSPECTOR_PATH}/`), 0)
  assert.equal(isControlReferencePath(SATURN_V_INSPECTOR_PATH), true)
  assert.equal(isControlPlaybackPath(SATURN_V_INSPECTOR_PATH), false)
  assert.equal(isControlPlaybackPath('/control'), true)
  assert.equal(isControlPlaybackPath('/control/'), true)
  assert.equal(isControlPlaybackPath('/control/event/a11-liftoff'), true)
  assert.equal(isControlPlaybackPath('/control/event/a11-liftoff/extra'), false)
  assert.equal(isControlPlaybackPath('/control/met/s0.6/extra'), false)
  assert.equal(isControlPlaybackPath('/control/inspect/saturn-v'), false)
})
