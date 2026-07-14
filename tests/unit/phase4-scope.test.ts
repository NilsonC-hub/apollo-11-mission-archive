import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { phase4EndMet, phase4Events } from '../../src/app/mission.ts'
import { stateAtMet } from '../../src/mission-core/index.ts'
import { apollo11Mission } from '../../src/missions/apollo11/mission.ts'

test('Phase 4 replay exposes only the verified launch-through-ejection event range', () => {
  assert.equal(phase4Events.length, 13)
  assert.equal(phase4Events[0].id, 'a11-liftoff')
  assert.equal(phase4Events.at(-1)?.id, 'a11-spacecraft-ejection')
  assert.equal(phase4EndMet, phase4Events.at(-1)?.metSeconds)
  assert.ok(phase4Events.every((event) => event.evidence === 'actual'))
  assert.ok(phase4Events.every((event) => event.citations.length > 0))
  assert.ok(!phase4Events.some((event) => event.id === 'a11-loi-ignition'))
})

test('Phase 4 configuration boundaries are deterministic at verified event METs', () => {
  const byId = new Map(apollo11Mission.events.map((event) => [event.id, event]))
  const at = (id: string) => stateAtMet(apollo11Mission, byId.get(id)!.metSeconds)

  assert.equal(at('a11-sic-sii-separation').components['s-ic'].lifecycle, 'discarded')
  assert.equal(at('a11-sii-sivb-separation').components['s-ii'].lifecycle, 'discarded')
  assert.equal(at('a11-les-jettison').components['launch-escape-system'].lifecycle, 'discarded')
  assert.equal(at('a11-csm-sivb-separation').components['service-module'].parentId, null)
  assert.equal(at('a11-first-docking').components['service-module'].parentId, 'lm-ascent-stage')
  assert.equal(at('a11-spacecraft-ejection').components['lm-descent-stage'].parentId, null)
  assert.equal(at('a11-spacecraft-ejection').phaseId, 'translunar')
})

test('Archive route remains free of Three, R3F, GLB, and KTX2 imports', async () => {
  const archive = await readFile('src/features/archive/ArchiveRoute.tsx', 'utf8')
  assert.doesNotMatch(archive, /(?:three|react-three|\.glb|\.ktx2)/i)
})
