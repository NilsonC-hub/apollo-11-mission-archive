import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  getEvent,
  mission,
  replayEndMet,
  replayEndStoryTime,
  replayEvents,
  replayNarrative,
} from '../../src/app/mission.ts'
import { controlMetPath, metForControlPath } from '../../src/app/controlDeepLink.ts'
import { metAtStoryTime, stateAtMet, storyTimeAtMet } from '../../src/mission-core/index.ts'

test('published Apollo 11 events reconstruct one deterministic end-to-end journey', () => {
  assert.equal(replayEvents.length, 37)

  let previousMet = Number.NEGATIVE_INFINITY
  for (const event of replayEvents) {
    assert.ok(event.metSeconds >= previousMet, `${event.id} must remain MET-sorted`)
    assert.deepEqual(stateAtMet(mission, event.metSeconds), stateAtMet(mission, event.metSeconds))
    previousMet = event.metSeconds
  }

  const recovered = stateAtMet(mission, replayEndMet)
  assert.equal(recovered.phaseId, 'recovery')
  assert.equal(recovered.components['command-module']?.lifecycle, 'landed')
  assert.equal(recovered.components['service-module']?.lifecycle, 'discarded')
  assert.equal(recovered.components['lm-ascent-stage']?.lifecycle, 'discarded')
  assert.equal(recovered.components['lm-descent-stage']?.lifecycle, 'landed')
  for (const [componentId, component] of Object.entries(recovered.components)) {
    if (component.lifecycle === 'discarded' || component.lifecycle === 'landed') {
      assert.notEqual(component.engineMode, 'burning', `${componentId} has a terminal lifecycle`)
    }
  }
})

test('storyTime remains the playback driver across authored pauses and mission completion', () => {
  const pause = replayNarrative.find((segment) => (segment.presentationPauseMs ?? 0) > 0)
  assert.ok(pause)

  const frozenMet = metAtStoryTime(mission.narrative, pause.motionEndMs + 500)
  assert.equal(frozenMet, pause.metEnd)
  assert.equal(storyTimeAtMet(mission.narrative, pause.metEnd), pause.motionEndMs)
  assert.equal(metAtStoryTime(mission.narrative, replayEndStoryTime), replayEndMet)
  assert.equal(replayEndMet, getEvent('a11-splashdown').metSeconds)
})

test('source MET URLs and ignition records preserve event truth across app and mission-core', () => {
  for (const event of replayEvents) {
    assert.equal(metForControlPath(controlMetPath(event.metSeconds)), event.metSeconds, event.id)
    for (const action of event.actions) {
      if (action.type !== 'record-engine-ignition') continue
      const before = stateAtMet(mission, event.metSeconds - 0.000_001)
      const after = stateAtMet(mission, event.metSeconds + 0.000_001)
      assert.equal(
        after.components[action.componentId].engineMode,
        before.components[action.componentId].engineMode,
        `${event.id} must not create a persistent engine mode`,
      )
    }
  }
})
