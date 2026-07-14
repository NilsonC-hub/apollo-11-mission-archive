import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { replayEndMet, replayEvents } from '../../src/app/mission.ts'
import { stateAtMet } from '../../src/mission-core/index.ts'
import { apollo11Mission, apollo11MissionPack } from '../../src/missions/apollo11/mission.ts'

const byId = new Map(apollo11Mission.events.map((event) => [event.id, event]))
const at = (id: string) => stateAtMet(apollo11Mission, byId.get(id)!.metSeconds)

test('Phase 5 replay spans the 37 verified liftoff-through-splashdown events', () => {
  assert.equal(replayEvents.length, 37)
  assert.equal(replayEvents[0].id, 'a11-liftoff')
  assert.equal(replayEvents.at(-1)?.id, 'a11-splashdown')
  assert.equal(replayEndMet, replayEvents.at(-1)?.metSeconds)
  assert.ok(replayEvents.every((event) => event.evidence === 'actual'))
  assert.ok(replayEvents.every((event) => event.citations.length > 0))

  const pendingIds = new Set(apollo11MissionPack.unavailable.preciseEvents.map((event) => event.id))
  assert.ok(replayEvents.every((event) => !pendingIds.has(event.id)))
})

test('Phase 5 lunar configuration changes preserve both active and discarded stages', () => {
  const touchdown = at('a11-touchdown')
  assert.equal(touchdown.phaseId, 'surface')
  assert.equal(touchdown.components['lm-descent-stage'].lifecycle, 'landed')
  assert.equal(touchdown.components['lm-descent-stage'].engineMode, undefined)
  assert.equal(touchdown.components['lm-descent-stage'].engineStateBasis, 'terminal')
  assert.equal(touchdown.components['lm-descent-stage'].lastKnownEngineMode, 'cutoff')

  const liftoff = at('a11-lunar-liftoff')
  assert.equal(liftoff.phaseId, 'ascent-rendezvous')
  assert.equal(liftoff.components['lm-ascent-stage'].lifecycle, 'free')
  assert.equal(liftoff.components['lm-descent-stage'].lifecycle, 'landed')

  const jettison = at('a11-ascent-stage-jettison')
  assert.equal(jettison.phaseId, 'lunar-orbit-return')
  assert.equal(jettison.components['lm-ascent-stage'].lifecycle, 'discarded')
  assert.equal(jettison.components['service-module'].parentId, null)
})

test('Phase 5 return state ends with command-module-only recovery configuration', () => {
  const separation = at('a11-cm-sm-separation')
  assert.equal(separation.components['service-module'].lifecycle, 'discarded')
  assert.equal(separation.components['command-module'].lifecycle, 'attached')
  assert.equal(separation.components['command-module'].parentId, null)

  const splashdown = at('a11-splashdown')
  assert.equal(splashdown.phaseId, 'recovery')
  assert.equal(splashdown.components['command-module'].lifecycle, 'landed')
})

test('Phase 5 keeps Archive code 3D-free and labels scene motion as schematic', async () => {
  const [archive, control] = await Promise.all([
    readFile('src/features/archive/ArchiveRoute.tsx', 'utf8'),
    readFile('src/features/control/ControlRoute.tsx', 'utf8'),
  ])
  assert.doesNotMatch(archive, /(?:three|react-three|\.glb|\.ktx2)/i)
  assert.match(control, /TRAJECTORY[^']*SCHEMATIC/)
  assert.match(control, /AUDIO NOT AVAILABLE/)
})
