import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { useMissionStore } from '../../src/app/missionStore.ts'
import { apollo11MissionPack } from '../../src/missions/apollo11/mission.ts'

test('Phase 6 Archive publishes every numbered chapter as a deep-link section', async () => {
  const archive = await readFile('src/features/archive/ArchiveRoute.tsx', 'utf8')
  const expected = [
    ['00', 'index'],
    ['01', 'objectives'],
    ['02', 'crew'],
    ['03', 'timeline'],
    ['04', 'architecture'],
    ['05', 'saturn'],
    ['06', 'spacecraft'],
    ['07', 'guidance'],
    ['08', 'control-records'],
    ['09', 'landing'],
    ['10', 'surface'],
    ['11', 'return'],
    ['12', 'sources'],
  ]

  assert.deepEqual(
    apollo11MissionPack.archive.chapters.map((chapter) => chapter.id),
    expected.map(([number]) => number),
  )
  for (const [, id] of expected) assert.match(archive, new RegExp(`id="${id}"`))
  assert.match(archive, /to={`\/archive\/\${id}`}/)
  assert.match(archive, /mission\.sources\.sources/)
  assert.doesNotMatch(archive, /(?:three|react-three|\.glb|\.ktx2)/i)
})

test('Phase 6 removes world-space grids that could imply false planetary coordinates', async () => {
  const scene = await readFile('src/features/control/MissionScene.tsx', 'utf8')
  const control = await readFile('src/features/control/ControlRoute.tsx', 'utf8')

  assert.doesNotMatch(scene, /gridHelper/)
  assert.match(scene, /LunarSurfaceReference/)
  assert.equal(scene.match(/<TrajectoryReference mode="orbit" \/>/g)?.length, 1)
  assert.match(scene, /frameloop="demand"/)
  assert.match(control, /LOCAL VIEW \/ SCHEMATIC · NO POSITION CLAIM/)
})

test('mode changes pause playback and require explicit resume', () => {
  const store = useMissionStore.getState()
  store.setPlaying(true)
  store.pauseForModeSwitch()

  assert.equal(useMissionStore.getState().playing, false)
  assert.equal(useMissionStore.getState().resumeAvailable, true)

  useMissionStore.getState().resumeAfterModeSwitch()
  assert.equal(useMissionStore.getState().playing, true)
  assert.equal(useMissionStore.getState().resumeAvailable, false)

  useMissionStore.getState().setPlaying(false)
})

test('Phase 6 keeps pending guidance alarms archive-only and audio unavailable', async () => {
  const archive = await readFile('src/features/archive/ArchiveRoute.tsx', 'utf8')
  const control = await readFile('src/features/control/ControlRoute.tsx', 'utf8')

  assert.match(archive, /PRECISE MET NOT VERIFIED/)
  assert.match(archive, /ARCHIVE-ONLY · NO PRECISE ANIMATION/)
  assert.match(archive, /HISTORICAL AUDIO/)
  assert.match(archive, /NOT AVAILABLE/)
  assert.match(control, /AUDIO NOT AVAILABLE/)
})
