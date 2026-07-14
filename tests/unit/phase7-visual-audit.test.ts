import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Phase 7 star field is deterministic, static, and truth-labelled', async () => {
  const scene = await readFile('src/features/control/MissionScene.tsx', 'utf8')
  const control = await readFile('src/features/control/ControlRoute.tsx', 'utf8')

  assert.match(scene, /function seededUnitRandom/)
  assert.match(scene, /function SchematicStarField/)
  assert.match(scene, /function webglAvailable/)
  assert.match(scene, /cachedWebglAvailability/)
  assert.match(scene, /WEBGL_lose_context/)
  assert.match(scene, /quality === 'fallback' \|\| !webglAvailable\(\)/)
  assert.match(scene, /apollo11:renderer-audit/)
  assert.match(scene, /renderer\.info\.render\.frame/)
  assert.match(scene, /renderer\.info\.render\.triangles/)
  assert.match(scene, /dataset\.rendererMaterials/)
  assert.doesNotMatch(scene, /Math\.random|useFrame|gridHelper/)
  assert.equal(scene.match(/<TrajectoryReference mode="orbit" \/>/g)?.length, 1)
  assert.match(control, /STAR FIELD \/ SCHEMATIC · NOT NAVIGATION/)
  assert.match(control, /STAGE SPLIT RECONSTRUCTED/)
})

test('Phase 7 scene avoids unsupported celestial spectacle features', async () => {
  const scene = await readFile('src/features/control/MissionScene.tsx', 'utf8')
  const styles = await readFile('src/styles/global.css', 'utf8')

  assert.doesNotMatch(scene, /nebula|telescope|lensFlare|atmosphere/i)
  assert.doesNotMatch(styles, /\.scene-frame::after/)
  assert.doesNotMatch(styles, /repeating-linear-gradient/)
})

test('Phase 7 Archive keeps small text contrast-safe and defers offscreen plates', async () => {
  const root = await readFile('src/app/RootLayout.tsx', 'utf8')
  const archive = await readFile('src/features/archive/ArchiveRoute.tsx', 'utf8')
  const styles = await readFile('src/styles/global.css', 'utf8')

  assert.doesNotMatch(root, /className="wordmark"[^>]+aria-label/)
  assert.match(styles, /--muted: #53574f/)
  assert.match(styles, /--oxide: #8d352d/)
  assert.match(styles, /\.mode-nav a\.active span\s*{\s*color: var\(--ops-amber\)/)
  assert.equal(archive.match(/loading="lazy"/g)?.length, 4)
})

test('Phase 7 browser playback advances storyTime and exposes editorial pauses', async () => {
  const playback = await readFile('src/features/control/useMissionPlayback.ts', 'utf8')
  const control = await readFile('src/features/control/ControlRoute.tsx', 'utf8')
  const store = await readFile('src/app/missionStore.ts', 'utf8')

  assert.match(playback, /storyTimeMs/)
  assert.match(playback, /beginEditorialPause/)
  assert.doesNotMatch(playback, /setMet|metSeconds/)
  assert.match(store, /storyTimeAtMet/)
  assert.match(control, /EVENT PAUSE — EDITORIAL/)
  assert.match(control, /MISSION COMPLETE/)
  assert.match(control, /EDITED \/ SOURCE-BOUND/)
})
