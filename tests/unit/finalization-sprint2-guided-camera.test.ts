import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
} from 'three'

import {
  applyGuidedCameraPose,
  guidedBoundsAreVisible,
  guidedPoseFramesBounds,
  interpolateGuidedCameraPose,
  resolveGuidedShotFraming,
} from '../../src/features/control/guidedCameraFraming.ts'
import { launchGuidedShots } from '../../src/features/control/launchVisualState.ts'

function orbitScene(): Scene {
  const scene = new Scene()
  const vehicle = new Group()
  vehicle.name = 'launch-vehicle-visual'
  vehicle.position.set(0.35, 0.2, 0)
  vehicle.rotation.set(-0.08, 0.24, -Math.PI / 2)
  vehicle.add(new Mesh(new BoxGeometry(1.15, 7.42, 1.15), new MeshBasicMaterial()))
  const earth = new Mesh(new SphereGeometry(6.15, 16, 8), new MeshBasicMaterial())
  earth.name = 'launch-earth-reference'
  earth.position.set(-4.9, -6.3, -9)
  scene.add(vehicle, earth)
  return scene
}

function cameraAtAspect(aspect: number): PerspectiveCamera {
  return new PerspectiveCamera(38, aspect, 0.1, 500)
}

test('Earth-orbit framing includes the live Earth and vehicle bounds on desktop and mobile', () => {
  for (const aspect of [1440 / 900, 390 / 844]) {
    const camera = cameraAtAspect(aspect)
    const shot = launchGuidedShots['earth-orbit-reference']
    const framing = resolveGuidedShotFraming(orbitScene(), camera, shot)
    assert.ok(framing)
    assert.equal(framing.targetCount, 2)
    applyGuidedCameraPose(camera, framing.pose)
    assert.equal(guidedBoundsAreVisible(camera, framing.bounds, shot.minProjectedDiameterNdc), true)
  }
})

test('guided transition start, midpoint and endpoint stay on the authored safe path', () => {
  const scene = orbitScene()
  const camera = cameraAtAspect(1440 / 900)
  const shot = launchGuidedShots['earth-orbit-reference']
  const previous = launchGuidedShots['ascent-upper-reference']
  const fromFraming = resolveGuidedShotFraming(scene, camera, previous)
  const toFraming = resolveGuidedShotFraming(scene, camera, shot)
  assert.ok(fromFraming)
  assert.ok(toFraming)

  const samples = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
    interpolateGuidedCameraPose(fromFraming.pose, toFraming.pose, progress),
  )
  for (const pose of samples) {
    assert.equal(
      guidedPoseFramesBounds(camera, fromFraming.bounds, pose, previous.minProjectedDiameterNdc) ||
        guidedPoseFramesBounds(camera, toFraming.bounds, pose, shot.minProjectedDiameterNdc),
      true,
    )
  }
  assert.equal(
    guidedPoseFramesBounds(
      camera,
      fromFraming.bounds,
      samples[0],
      previous.minProjectedDiameterNdc,
    ),
    true,
  )
  assert.equal(
    guidedPoseFramesBounds(camera, toFraming.bounds, samples.at(-1)!, shot.minProjectedDiameterNdc),
    true,
  )
  const midpointDelta = Math.hypot(
    ...samples[2].position.map((value, index) => value - samples[0].position[index]),
  )
  const endpointDelta = Math.hypot(
    ...samples[4].position.map((value, index) => value - samples[2].position[index]),
  )
  assert.ok(midpointDelta > 0)
  assert.ok(endpointDelta > 0)
  assert.ok(Math.abs(midpointDelta - endpointDelta) < 0.25)
})

test('missing or hidden authored targets fail closed before a camera pose is applied', () => {
  const scene = orbitScene()
  const camera = cameraAtAspect(1)
  const shot = launchGuidedShots['earth-orbit-reference']
  scene.getObjectByName('launch-earth-reference')!.visible = false
  assert.equal(resolveGuidedShotFraming(scene, camera, shot), null)
})

test('a visible target group with no visible renderable descendant fails closed', () => {
  const scene = new Scene()
  const vehicle = new Group()
  vehicle.name = 'launch-vehicle-visual'
  const hiddenMesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial())
  hiddenMesh.visible = false
  vehicle.add(hiddenMesh)
  scene.add(vehicle)
  assert.equal(
    resolveGuidedShotFraming(scene, cameraAtAspect(1), launchGuidedShots['launch-pad-reference']),
    null,
  )
})

test('hidden lifecycle stages do not expand the fitted vehicle bounds', () => {
  const scene = new Scene()
  const vehicle = new Group()
  vehicle.name = 'launch-vehicle-visual'
  vehicle.add(new Mesh(new BoxGeometry(1, 5, 1), new MeshBasicMaterial()))
  const discardedStage = new Mesh(new BoxGeometry(20, 20, 20), new MeshBasicMaterial())
  discardedStage.position.set(500, 0, 0)
  discardedStage.visible = false
  vehicle.add(discardedStage)
  scene.add(vehicle)

  const framing = resolveGuidedShotFraming(
    scene,
    cameraAtAspect(1),
    launchGuidedShots['launch-pad-reference'],
  )
  assert.ok(framing)
  assert.ok(framing.bounds.max.x < 10)
})
