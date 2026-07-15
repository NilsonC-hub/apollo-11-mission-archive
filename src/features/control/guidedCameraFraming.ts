import {
  Box3,
  MathUtils,
  PerspectiveCamera,
  Sphere,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three'

import type { LaunchGuidedShotDefinition, VisualVector3 } from './launchVisualState.ts'

export interface GuidedCameraPose {
  position: VisualVector3
  target: VisualVector3
}

export interface GuidedShotFraming {
  bounds: Box3
  pose: GuidedCameraPose
  targetCount: number
}

function isActuallyVisible(object: Object3D): boolean {
  let current: Object3D | null = object
  while (current) {
    if (!current.visible) return false
    current = current.parent
  }
  return true
}

function vectorTuple(vector: Vector3): VisualVector3 {
  return [vector.x, vector.y, vector.z]
}

function visibleRenderableBounds(root: Object3D): Box3 | null {
  const bounds = new Box3()
  let renderableCount = 0
  root.traverseVisible((object) => {
    const renderable = object as Object3D & {
      geometry?: BufferGeometry
      material?: Material | Material[]
    }
    const geometry = renderable.geometry
    const materials = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material
        ? [renderable.material]
        : []
    if (!geometry || materials.length === 0 || materials.every((material) => !material.visible)) {
      return
    }
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    if (!geometry.boundingBox || geometry.boundingBox.isEmpty()) return
    const objectBounds = geometry.boundingBox.clone().applyMatrix4(object.matrixWorld)
    if (renderableCount === 0) bounds.copy(objectBounds)
    else bounds.union(objectBounds)
    renderableCount += 1
  })
  return renderableCount > 0 && !bounds.isEmpty() ? bounds : null
}

export function resolveGuidedShotFraming(
  scene: Object3D,
  camera: PerspectiveCamera,
  shot: LaunchGuidedShotDefinition,
  safeMargin = shot.safeMargin,
): GuidedShotFraming | null {
  scene.updateMatrixWorld(true)
  const bounds = new Box3()
  let targetCount = 0
  for (const objectName of shot.targetObjectNames) {
    const target = scene.getObjectByName(objectName)
    if (!target || !isActuallyVisible(target)) continue
    const targetBounds = visibleRenderableBounds(target)
    if (!targetBounds) continue
    if (targetCount === 0) bounds.copy(targetBounds)
    else bounds.union(targetBounds)
    targetCount += 1
  }
  if (targetCount !== shot.targetObjectNames.length || bounds.isEmpty()) return null
  bounds.expandByScalar(shot.paddingSceneUnits)

  const sphere = bounds.getBoundingSphere(new Sphere())
  const verticalHalfFov = MathUtils.degToRad(camera.fov) / 2
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
  const limitingHalfFov = Math.max(0.01, Math.min(verticalHalfFov, horizontalHalfFov))
  const distance = (Math.max(0.5, sphere.radius) / Math.sin(limitingHalfFov)) * safeMargin
  const direction = new Vector3(...shot.viewDirection).normalize()
  const position = sphere.center.clone().add(direction.multiplyScalar(distance))

  return {
    bounds,
    pose: { position: vectorTuple(position), target: vectorTuple(sphere.center) },
    targetCount,
  }
}

export function applyGuidedCameraPose(camera: PerspectiveCamera, pose: GuidedCameraPose): void {
  camera.position.set(...pose.position)
  camera.lookAt(...pose.target)
  camera.updateMatrixWorld(true)
  camera.updateProjectionMatrix()
}

export function guidedBoundsAreVisible(
  camera: PerspectiveCamera,
  bounds: Box3,
  minProjectedDiameterNdc: number,
): boolean {
  camera.updateMatrixWorld(true)
  camera.updateProjectionMatrix()
  const { min, max } = bounds
  const corners = [
    [min.x, min.y, min.z],
    [min.x, min.y, max.z],
    [min.x, max.y, min.z],
    [min.x, max.y, max.z],
    [max.x, min.y, min.z],
    [max.x, min.y, max.z],
    [max.x, max.y, min.z],
    [max.x, max.y, max.z],
  ] as const
  if (bounds.containsPoint(camera.position)) return false
  const projectedCorners = corners.map((corner) => new Vector3(...corner).project(camera))
  const safe = projectedCorners.every((projected) => {
    return (
      Number.isFinite(projected.x) &&
      Number.isFinite(projected.y) &&
      Number.isFinite(projected.z) &&
      Math.abs(projected.x) <= 0.82 &&
      Math.abs(projected.y) <= 0.78 &&
      projected.z >= -1 &&
      projected.z <= 1
    )
  })
  if (!safe) return false
  const xs = projectedCorners.map((corner) => corner.x)
  const ys = projectedCorners.map((corner) => corner.y)
  const projectedDiameter = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  )
  return projectedDiameter >= minProjectedDiameterNdc
}

export function guidedPoseFramesBounds(
  camera: PerspectiveCamera,
  bounds: Box3,
  pose: GuidedCameraPose,
  minProjectedDiameterNdc: number,
): boolean {
  const probe = camera.clone() as PerspectiveCamera
  applyGuidedCameraPose(probe, pose)
  return guidedBoundsAreVisible(probe, bounds, minProjectedDiameterNdc)
}

export function interpolateGuidedCameraPose(
  from: GuidedCameraPose,
  to: GuidedCameraPose,
  progress: number,
): GuidedCameraPose {
  const t = Math.min(1, Math.max(0, progress))
  const target = new Vector3(...from.target).lerp(new Vector3(...to.target), t)
  const fromOffset = new Vector3(...from.position).sub(new Vector3(...from.target))
  const toOffset = new Vector3(...to.position).sub(new Vector3(...to.target))
  const distance = MathUtils.lerp(fromOffset.length(), toOffset.length(), t)
  const direction = fromOffset.normalize().lerp(toOffset.normalize(), t)
  const position =
    direction.lengthSq() > 1e-8
      ? target.clone().add(direction.normalize().multiplyScalar(distance))
      : new Vector3(...from.position).lerp(new Vector3(...to.position), t)
  return { position: vectorTuple(position), target: vectorTuple(target) }
}
