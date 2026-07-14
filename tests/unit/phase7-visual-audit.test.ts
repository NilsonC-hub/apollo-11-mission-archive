import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Phase 7 star field is deterministic, static, and truth-labelled', async () => {
  const scene = await readFile('src/features/control/MissionScene.tsx', 'utf8')
  const control = await readFile('src/features/control/ControlRoute.tsx', 'utf8')

  assert.match(scene, /function seededUnitRandom/)
  assert.match(scene, /function SchematicStarField/)
  assert.doesNotMatch(scene, /Math\.random|useFrame|gridHelper/)
  assert.equal(scene.match(/<TrajectoryReference mode="orbit" \/>/g)?.length, 1)
  assert.match(control, /STAR FIELD \/ SCHEMATIC · NOT NAVIGATION/)
})

test('Phase 7 scene avoids unsupported celestial spectacle features', async () => {
  const scene = await readFile('src/features/control/MissionScene.tsx', 'utf8')

  assert.doesNotMatch(scene, /nebula|telescope|lensFlare|atmosphere/i)
})
