import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Box3,
  BufferGeometry,
  Color,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Sphere,
  Vector3,
  type Group,
  type Object3D,
} from 'three'

import { getEvent, mission } from '../../app/mission.ts'
import {
  useMissionStore,
  type CameraCommand,
  type ControlInteractionState,
  type GuidedCameraRestPose,
  type ModelQuality,
  type PlaybackSpeed,
  type VisualTransitionAnchors,
} from '../../app/missionStore.ts'
import { stateAtMet, visualStateAtStoryTime } from '../../mission-core/index.ts'
import {
  findInspectableComponentNodes,
  resolveComponentNode,
  resolveSemanticNode,
  runtimeInspectableComponentIds,
} from './modelNodeLookup.ts'
import {
  launchGuidedShots,
  launchVisualStateAt,
  type LaunchVisualState,
  type VisualVector3,
} from './launchVisualState.ts'
import {
  applyGuidedCameraPose,
  guidedBoundsAreVisible,
  guidedPoseFramesBounds,
  interpolateGuidedCameraPose,
  resolveGuidedShotFraming,
  type GuidedCameraPose,
} from './guidedCameraFraming.ts'

const MODEL_ROOT = '/missions/apollo11/models'
const DRACO_ROOT = '/missions/apollo11/decoders/three-draco/'
const BASIS_ROOT = '/missions/apollo11/decoders/three-basis/'
const CAMERA_DRAG_THRESHOLD_PX = 4

type Position = [number, number, number]
type SceneMode =
  | 'launch'
  | 'translunar'
  | 'lunar-orbit'
  | 'descent'
  | 'surface'
  | 'rendezvous'
  | 'return'
  | 'entry'

function seededUnitRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1_664_525) + 1_013_904_223) >>> 0
    return value / 4_294_967_296
  }
}

function createStarGeometry(count: number, seed: number): BufferGeometry {
  const random = seededUnitRandom(seed)
  const positions = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    const vertical = random() * 2 - 1
    const azimuth = random() * Math.PI * 2
    const radius = 42 + random() * 24
    const horizontal = Math.sqrt(1 - vertical * vertical)
    const offset = index * 3
    positions[offset] = horizontal * Math.cos(azimuth) * radius
    positions[offset + 1] = vertical * radius
    positions[offset + 2] = horizontal * Math.sin(azimuth) * radius
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

function SchematicStarField({
  quality,
  opacity = 1,
}: {
  quality: Exclude<ModelQuality, 'fallback'>
  opacity?: number
}) {
  const [faintCount, brightCount] =
    quality === 'high' ? [420, 48] : quality === 'medium' ? [280, 32] : [150, 18]
  const faint = useMemo(() => createStarGeometry(faintCount, 0x6d2b79f5), [faintCount])
  const bright = useMemo(() => createStarGeometry(brightCount, 0x1b56c4e9), [brightCount])

  useEffect(
    () => () => {
      faint.dispose()
      bright.dispose()
    },
    [bright, faint],
  )

  return (
    <group>
      <points geometry={faint} frustumCulled={false}>
        <pointsMaterial
          color="#879088"
          size={1}
          sizeAttenuation={false}
          transparent
          opacity={0.38 * opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <points geometry={bright} frustumCulled={false}>
        <pointsMaterial
          color="#d8ddd1"
          size={1.55}
          sizeAttenuation={false}
          transparent
          opacity={0.72 * opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  )
}

function modelUrl(name: string, quality: Exclude<ModelQuality, 'fallback'>): string {
  return `${MODEL_ROOT}/apollo11-${name}-${quality}.glb`
}

function useGlb(url: string) {
  return useLoader(GLTFLoader, url, (loader) => {
    const draco = new DRACOLoader()
    draco.setDecoderPath(DRACO_ROOT)
    loader.setDRACOLoader(draco)
  })
}

function setComponentPresentation(
  root: Group,
  componentId: string,
  visible: boolean,
  offset: VisualVector3 = [0, 0, 0],
): void {
  const node = resolveComponentNode(root, componentId)
  const baseX = Number(node.userData.presentationBaseX ?? node.position.x)
  const baseY = Number(node.userData.presentationBaseY ?? node.position.y)
  const baseZ = Number(node.userData.presentationBaseZ ?? node.position.z)
  node.userData.presentationBaseX = baseX
  node.userData.presentationBaseY = baseY
  node.userData.presentationBaseZ = baseZ
  node.userData.semanticComponentId = componentId
  node.visible = visible
  node.position.set(baseX + offset[0], baseY + offset[1], baseZ + offset[2])
}

function handleSemanticClick(event: ThreeEvent<MouseEvent>): void {
  if (event.delta >= CAMERA_DRAG_THRESHOLD_PX) return
  let candidate: Object3D | null = event.object
  while (candidate) {
    const componentId = candidate.userData.semanticComponentId as string | undefined
    if (componentId) {
      event.stopPropagation()
      useMissionStore.getState().inspectComponent(componentId)
      return
    }
    candidate = candidate.parent
  }
}

function sceneModeAtMet(met: number): SceneMode {
  const phase = stateAtMet(mission, met).phaseId
  if (phase === 'translunar') return 'translunar'
  if (phase === 'lunar-orbit') return 'lunar-orbit'
  if (phase === 'descent') return 'descent'
  if (phase === 'surface') return 'surface'
  if (phase === 'ascent-rendezvous') return 'rendezvous'
  if (phase === 'lunar-orbit-return' || phase === 'transearth') return 'return'
  if (phase === 'entry' || phase === 'recovery') return 'entry'
  return 'launch'
}

type LaunchStageId = keyof LaunchVisualState['plumeIntensity']

const plumeAnchors: Readonly<Record<LaunchStageId, string>> = {
  's-ic': 'exhaust.sic',
  's-ii': 'exhaust.sii',
  's-ivb': 'exhaust.sivb',
}

function createPlume(radius: number, height: number): Mesh {
  const material = new MeshBasicMaterial({
    color: '#d0a45a',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  })
  const plume = new Mesh(new ConeGeometry(radius, height, 18, 1, true), material)
  plume.position.y = -height / 2
  plume.visible = false
  plume.userData.presentationRole = 'schematic-engine-plume'
  return plume
}

function SaturnStack({
  met,
  quality,
  visual,
}: {
  met: number
  quality: Exclude<ModelQuality, 'fallback'>
  visual: LaunchVisualState
}) {
  const gltf = useGlb(modelUrl('saturn-v', quality))
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const plumes = useMemo(
    () => ({
      's-ic': createPlume(2.1, 18),
      's-ii': createPlume(1.7, 14),
      's-ivb': createPlume(1.25, 10),
    }),
    [],
  )
  const state = stateAtMet(mission, met)
  const postCsmSeparation = met >= getEvent('a11-csm-sivb-separation').metSeconds

  useLayoutEffect(() => {
    for (const [stageId, anchorId] of Object.entries(plumeAnchors) as [LaunchStageId, string][]) {
      resolveSemanticNode(scene, 'apollo11-saturn-v', anchorId).add(plumes[stageId])
    }
    return () => {
      for (const plume of Object.values(plumes)) {
        plume.removeFromParent()
        plume.geometry.dispose()
        ;(plume.material as MeshBasicMaterial).dispose()
      }
    }
  }, [plumes, scene])

  useLayoutEffect(() => {
    const separatingComponents = [
      's-ic',
      's-ic-s-ii-interstage',
      's-ii',
      's-ii-s-ivb-interstage',
      'launch-escape-system',
    ] as const

    for (const componentId of separatingComponents) {
      const discarded = state.components[componentId]?.lifecycle === 'discarded'
      const departure = visual.departures[componentId]
      setComponentPresentation(
        scene,
        componentId,
        !discarded || Boolean(departure?.renderAfterSeparation),
        departure?.offsetMeters,
      )
    }
    for (const componentId of ['s-ivb', 'instrument-unit', 'spacecraft-lm-adapter']) {
      setComponentPresentation(scene, componentId, true)
    }
    const launchCsm = resolveSemanticNode(
      scene,
      'apollo11-saturn-v',
      'spacecraft.csmLaunchRepresentation',
    )
    launchCsm.visible = !postCsmSeparation
    for (const stageId of Object.keys(plumes) as LaunchStageId[]) {
      const intensity = visual.plumeIntensity[stageId]
      const plume = plumes[stageId]
      plume.visible = intensity > 0
      ;(plume.material as MeshBasicMaterial).opacity = 0.72 * intensity
    }
  }, [plumes, postCsmSeparation, scene, state.components, visual])

  return (
    <group
      name="launch-vehicle-visual"
      rotation={visual.vehicleRotation}
      position={visual.vehiclePosition}
    >
      <group name="launch-camera-anchor" position={[0, 3.7, 0]} />
      <primitive object={scene} scale={0.067} onClick={handleSemanticClick} />
    </group>
  )
}

function CsmModel({
  quality,
  configuration = 'full',
  position = [0, 0, 0],
  scale = 0.14,
}: {
  quality: Exclude<ModelQuality, 'fallback'>
  configuration?: 'full' | 'command-only'
  position?: Position
  scale?: number
}) {
  const gltf = useGlb(modelUrl('command-service-module', quality))
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])

  useLayoutEffect(() => {
    scene.userData.csmConfiguration = configuration
    setComponentPresentation(scene, 'service-module', configuration === 'full')
    setComponentPresentation(scene, 'command-module', true)
  }, [configuration, scene])

  return (
    <group position={position} rotation={[0, 0, -Math.PI / 2]}>
      <primitive object={scene} scale={scale} onClick={handleSemanticClick} />
    </group>
  )
}

function LunarModuleModel({
  quality,
  stage = 'both',
  position = [0, 0, 0],
  scale = 0.14,
}: {
  quality: Exclude<ModelQuality, 'fallback'>
  stage?: 'both' | 'descent' | 'ascent'
  position?: Position
  scale?: number
}) {
  const gltf = useGlb(modelUrl('lunar-module', quality))
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])

  useLayoutEffect(() => {
    setComponentPresentation(scene, 'lm-ascent-stage', stage !== 'descent')
    setComponentPresentation(scene, 'lm-descent-stage', stage !== 'ascent')
  }, [scene, stage])

  return (
    <group position={position} rotation={[0, 0, -Math.PI / 2]}>
      <primitive object={scene} scale={scale} onClick={handleSemanticClick} />
    </group>
  )
}

function ExtractionAssembly({
  met,
  quality,
}: {
  met: number
  quality: Exclude<ModelQuality, 'fallback'>
}) {
  const separation = getEvent('a11-csm-sivb-separation').metSeconds
  const docking = getEvent('a11-first-docking').metSeconds
  const ejection = getEvent('a11-spacecraft-ejection').metSeconds
  if (met < separation) return null

  const docked = met >= docking
  const ejected = met >= ejection
  const assemblyX = ejected ? 2.8 : 0
  const csmX = ejected ? 2.6 : docked ? 1 : 4.2

  return (
    <group position={[assemblyX, 0, 0]}>
      <LunarModuleModel quality={quality} position={[0, -0.4, 0]} />
      <CsmModel quality={quality} position={[csmX - assemblyX, 0.66, 0]} />
    </group>
  )
}

function Planet({
  kind,
  position,
  radius,
  rotationY = 0,
  name,
}: {
  kind: 'earth' | 'moon'
  position: Position
  radius: number
  rotationY?: number
  name?: string
}) {
  const gl = useThree((state) => state.gl)
  const url =
    kind === 'earth'
      ? '/missions/apollo11/textures/earth-blue-marble-1k.ktx2'
      : '/missions/apollo11/textures/moon-lro-color-1k.ktx2'
  const texture = useLoader(KTX2Loader, url, (loader) =>
    loader.setTranscoderPath(BASIS_ROOT).detectSupport(gl),
  )

  return (
    <mesh name={name} position={position} rotation={[0, rotationY, 0]} scale={radius}>
      <sphereGeometry args={[1, 64, 32]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  )
}

function LaunchReferenceFrame({ opacity }: { opacity: number }) {
  if (opacity <= 0.001) return null
  return (
    <group position={[0, -3.69, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.53, 64]} />
        <meshBasicMaterial
          color="#829789"
          transparent
          opacity={0.34 * opacity}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.2, 0.012, 0.012]} />
        <meshBasicMaterial color="#829789" transparent opacity={0.24 * opacity} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[4.2, 0.012, 0.012]} />
        <meshBasicMaterial color="#829789" transparent opacity={0.24 * opacity} />
      </mesh>
    </group>
  )
}

function LunarSurfaceReference() {
  return <Planet kind="moon" position={[-1.4, -10.4, -8]} radius={8} />
}

function TrajectoryReference({ mode }: { mode: 'outbound' | 'orbit' | 'return' }) {
  const rotation: Position = mode === 'orbit' ? [Math.PI / 2.7, 0, 0] : [Math.PI / 2, 0.35, 0]
  return (
    <mesh rotation={rotation} position={[0, -0.2, -2]}>
      <torusGeometry args={[mode === 'orbit' ? 4.1 : 6.4, 0.012, 4, 180]} />
      <meshBasicMaterial
        color={mode === 'return' ? '#cf9f58' : '#829789'}
        transparent
        opacity={0.55}
      />
    </mesh>
  )
}

function MissionConfiguration({
  met,
  phaseProgress,
  quality,
  launchVisual,
}: {
  met: number
  phaseProgress: number
  quality: Exclude<ModelQuality, 'fallback'>
  launchVisual: LaunchVisualState
}) {
  const mode = sceneModeAtMet(met)

  if (mode === 'launch') {
    return (
      <>
        <Planet
          kind="earth"
          name="launch-earth-reference"
          position={[...launchVisual.earthPosition]}
          radius={launchVisual.earthRadius}
          rotationY={launchVisual.earthRotationY}
        />
        <LaunchReferenceFrame opacity={launchVisual.launchReferenceOpacity} />
        <SaturnStack met={met} quality={quality} visual={launchVisual} />
        <ExtractionAssembly met={met} quality={quality} />
      </>
    )
  }

  if (mode === 'translunar') {
    const progress = phaseProgress
    return (
      <>
        <Planet
          kind="earth"
          position={[-8.4 - progress * 2, -5.4, -9]}
          radius={4.5 - progress * 1.6}
        />
        <Planet
          kind="moon"
          position={[8 - progress * 2.5, 2.4, -10]}
          radius={2.2 + progress * 1.8}
        />
        <TrajectoryReference mode="outbound" />
        <LunarModuleModel quality={quality} position={[-0.4, -0.45, 0]} />
        <CsmModel quality={quality} position={[0.75, 0.6, 0]} />
      </>
    )
  }

  if (mode === 'lunar-orbit') {
    return (
      <>
        <Planet kind="moon" position={[-4.8, -4.8, -8]} radius={5.4} />
        <TrajectoryReference mode="orbit" />
        <LunarModuleModel quality={quality} position={[1.2, -0.2, 0]} />
        <CsmModel quality={quality} position={[2.3, 0.85, 0]} />
      </>
    )
  }

  if (mode === 'descent') {
    const progress = phaseProgress
    return (
      <>
        <LunarSurfaceReference />
        <CsmModel quality={quality} position={[4.3, 2.2, -1]} scale={0.11} />
        <LunarModuleModel
          quality={quality}
          position={[-1.3, 1.8 - progress * 4.2, 0]}
          scale={0.17}
        />
      </>
    )
  }

  if (mode === 'surface') {
    return (
      <>
        <LunarSurfaceReference />
        <LunarModuleModel quality={quality} position={[-0.7, -2.42, 0]} scale={0.2} />
      </>
    )
  }

  if (mode === 'rendezvous') {
    const progress = phaseProgress
    return (
      <>
        <LunarSurfaceReference />
        <LunarModuleModel
          quality={quality}
          stage="descent"
          position={[-3.8, -2.5, -1]}
          scale={0.14}
        />
        <LunarModuleModel
          quality={quality}
          stage="ascent"
          position={[-1.8 + progress * 3.2, -1.4 + progress * 3.3, 0]}
          scale={0.16}
        />
        <CsmModel quality={quality} position={[3.4, 2.25, -0.6]} scale={0.13} />
      </>
    )
  }

  if (mode === 'return') {
    const missionState = stateAtMet(mission, met)
    const transearth = missionState.phaseId === 'transearth'
    const csmConfiguration =
      missionState.components['service-module']?.lifecycle === 'discarded' ? 'command-only' : 'full'
    return (
      <>
        <Planet kind="moon" position={[-8.6, -3.9, -10]} radius={transearth ? 2.5 : 5.2} />
        {transearth && <Planet kind="earth" position={[9.5, 3.8, -12]} radius={2.2} />}
        <TrajectoryReference mode="return" />
        <CsmModel
          quality={quality}
          configuration={csmConfiguration}
          position={[0.6, 0.4, 0]}
          scale={0.18}
        />
      </>
    )
  }

  const recovered = met >= getEvent('a11-splashdown').metSeconds
  return (
    <>
      <Planet kind="earth" position={[-4.5, -6.2, -9]} radius={6.3} />
      <CsmModel
        quality={quality}
        configuration="command-only"
        position={[recovered ? 0.2 : 2.4, recovered ? -1.75 : 1.6, 0]}
        scale={0.22}
      />
    </>
  )
}

const guidedCameraPosition = new Vector3(9.2, 4.8, 12.8)
const guidedCameraTarget = new Vector3(0, 0, 0)
const verticalAxis = new Vector3(0, 1, 0)

function CameraRig({
  met,
  interaction,
  cameraCommand,
  guidedShotId,
  guidedCameraFromShotId,
  guidedCameraProgress,
  guidedCameraActive,
  guidedCameraTransitionEventId,
}: {
  met: number
  interaction: ControlInteractionState
  cameraCommand: CameraCommand | null
  guidedShotId: LaunchVisualState['guidedShotId'] | null
  guidedCameraFromShotId: LaunchVisualState['guidedCameraFromShotId'] | null
  guidedCameraProgress: number
  guidedCameraActive: boolean
  guidedCameraTransitionEventId: string | null
}) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl.domElement])
  const tweenFrame = useRef<number | null>(null)
  const settleFrame = useRef<number | null>(null)
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(null)
  const guidedCameraRestPose = useMissionStore((state) => state.guidedCameraRestPose)
  const lastGuidedPose = useRef<GuidedCameraPose | null>(null)
  const metRef = useRef(met)
  metRef.current = met

  useEffect(() => {
    controls.enableDamping = false
    controls.enablePan = true
    controls.minDistance = 1.2
    controls.maxDistance = 480
    const onChange = () => invalidate()
    const onPointerDown = (event: PointerEvent) => {
      pointerStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    }
    const onPointerMove = (event: PointerEvent) => {
      const start = pointerStart.current
      if (!start || start.id !== event.pointerId) return
      if (
        Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CAMERA_DRAG_THRESHOLD_PX
      ) {
        useMissionStore.getState().enterFreeLook()
        pointerStart.current = null
      }
    }
    const onPointerEnd = () => {
      pointerStart.current = null
    }
    const onWheel = () => useMissionStore.getState().enterFreeLook()
    const onTouchMove = () => useMissionStore.getState().enterFreeLook()
    controls.addEventListener('change', onChange)
    gl.domElement.addEventListener('pointerdown', onPointerDown, { capture: true })
    gl.domElement.addEventListener('pointermove', onPointerMove, { capture: true })
    gl.domElement.addEventListener('pointerup', onPointerEnd, { capture: true })
    gl.domElement.addEventListener('pointercancel', onPointerEnd, { capture: true })
    gl.domElement.addEventListener('wheel', onWheel, { capture: true, passive: true })
    gl.domElement.addEventListener('touchmove', onTouchMove, { capture: true, passive: true })
    controls.update()
    return () => {
      controls.removeEventListener('change', onChange)
      gl.domElement.removeEventListener('pointerdown', onPointerDown, { capture: true })
      gl.domElement.removeEventListener('pointermove', onPointerMove, { capture: true })
      gl.domElement.removeEventListener('pointerup', onPointerEnd, { capture: true })
      gl.domElement.removeEventListener('pointercancel', onPointerEnd, { capture: true })
      gl.domElement.removeEventListener('wheel', onWheel, { capture: true })
      gl.domElement.removeEventListener('touchmove', onTouchMove, { capture: true })
      controls.dispose()
    }
  }, [controls, invalidate])

  useEffect(() => {
    document.documentElement.dataset.controlInteraction = interaction.mode
    return () => {
      delete document.documentElement.dataset.controlInteraction
    }
  }, [interaction.mode])

  useEffect(() => {
    if (!cameraCommand) return
    const offset = camera.position.clone().sub(controls.target)
    if (cameraCommand.kind === 'rotate-left') offset.applyAxisAngle(verticalAxis, Math.PI / 12)
    if (cameraCommand.kind === 'rotate-right') offset.applyAxisAngle(verticalAxis, -Math.PI / 12)
    if (cameraCommand.kind === 'zoom-in') offset.multiplyScalar(0.82)
    if (cameraCommand.kind === 'zoom-out') offset.multiplyScalar(1.22)
    if (cameraCommand.kind === 'reset') {
      const resetPose = lastGuidedPose.current
      if (resetPose) {
        camera.position.set(...resetPose.position)
        controls.target.set(...resetPose.target)
      } else {
        camera.position.copy(guidedCameraPosition)
        controls.target.copy(guidedCameraTarget)
      }
    } else {
      camera.position.copy(controls.target).add(offset)
    }
    controls.update()
    invalidate()
    document.documentElement.dataset.cameraCommand = cameraCommand.kind
  }, [camera, cameraCommand, controls, invalidate])

  useLayoutEffect(() => {
    const html = document.documentElement
    const store = useMissionStore.getState()
    if (interaction.mode !== 'guided') {
      if (store.guidedCameraActive) store.setGuidedCameraStatus(false)
      html.dataset.cameraGuidance = 'manual'
      delete html.dataset.cameraShotProgress
      delete html.dataset.cameraVisibility
      delete html.dataset.cameraVisibilityGuard
      delete html.dataset.cameraVisibilityTargets
      delete html.dataset.cameraDestinationTargets
      delete html.dataset.cameraTransitionOrigin
      delete html.dataset.cameraPosition
      delete html.dataset.cameraTarget
      delete html.dataset.cameraSettled
      return
    }

    const setStatus = (active: boolean) => {
      const current = useMissionStore.getState()
      if (
        current.guidedCameraActive === active &&
        (!active ||
          (current.guidedCameraShotId === guidedShotId &&
            current.guidedCameraTransitionEventId === guidedCameraTransitionEventId))
      ) {
        return
      }
      current.setGuidedCameraStatus(
        active,
        guidedShotId ?? 'mission-reference',
        guidedCameraTransitionEventId ?? undefined,
      )
    }

    if (!guidedShotId || !guidedCameraFromShotId || !(camera instanceof PerspectiveCamera)) {
      const pose: GuidedCameraPose = {
        position: [guidedCameraPosition.x, guidedCameraPosition.y, guidedCameraPosition.z],
        target: [guidedCameraTarget.x, guidedCameraTarget.y, guidedCameraTarget.z],
      }
      camera.position.set(...pose.position)
      controls.target.set(...pose.target)
      controls.update()
      lastGuidedPose.current = pose
      setStatus(false)
      html.dataset.cameraShot = 'mission-reference'
      html.dataset.cameraGuidance = 'released'
      html.dataset.cameraSettled = 'guided'
      delete html.dataset.cameraVisibility
      delete html.dataset.cameraVisibilityGuard
      delete html.dataset.cameraVisibilityTargets
      delete html.dataset.cameraDestinationTargets
      invalidate()
      return
    }

    const shot = launchGuidedShots[guidedShotId]
    const activateStaticFallback = (reason: string) => {
      setStatus(false)
      html.dataset.cameraShot = guidedShotId
      html.dataset.cameraGuidance = 'released'
      html.dataset.cameraVisibility = 'static-fallback'
      html.dataset.cameraVisibilityGuard = reason
      html.dataset.cameraFallbackReason = reason
      html.dataset.cameraVisibilityTargets = shot.targetObjectNames.join(',')
      html.dataset.cameraDestinationTargets = shot.targetObjectNames.join(',')
      useMissionStore.getState().setQuality('fallback')
    }

    const framing = resolveGuidedShotFraming(scene, camera, shot)
    if (!framing) {
      activateStaticFallback('static-fallback-missing-target')
      return
    }

    const restMatchesShot = guidedCameraRestPose?.shotId === guidedShotId
    const previousShot = launchGuidedShots[guidedCameraFromShotId]
    const previousFraming = resolveGuidedShotFraming(scene, camera, previousShot)
    const storedFromPose: GuidedCameraPose | null =
      guidedCameraRestPose?.shotId === guidedCameraFromShotId
        ? {
            position: guidedCameraRestPose.position,
            target: guidedCameraRestPose.target,
          }
        : null
    const storedFromPoseIsSafe =
      storedFromPose !== null &&
      previousFraming !== null &&
      guidedPoseFramesBounds(
        camera,
        previousFraming.bounds,
        storedFromPose,
        previousShot.minProjectedDiameterNdc,
      )
    const fromPose: GuidedCameraPose = storedFromPoseIsSafe
      ? storedFromPose
      : (previousFraming?.pose ?? framing.pose)
    let pose = guidedCameraActive
      ? interpolateGuidedCameraPose(fromPose, framing.pose, guidedCameraProgress)
      : restMatchesShot
        ? {
            position: guidedCameraRestPose.position,
            target: guidedCameraRestPose.target,
          }
        : framing.pose

    applyGuidedCameraPose(camera, pose)
    controls.target.set(...pose.target)
    controls.update()
    const previousVisible =
      guidedCameraActive &&
      previousFraming !== null &&
      guidedBoundsAreVisible(camera, previousFraming.bounds, previousShot.minProjectedDiameterNdc)
    let visible = guidedBoundsAreVisible(camera, framing.bounds, shot.minProjectedDiameterNdc)
    let guard = 'authored-fit'
    let visibleTargetNames = shot.targetObjectNames
    // During a live handoff, retain the prior composition until the destination
    // bounds enter the safe frame. This keeps the camera path continuous while
    // ensuring at least one declared target set is protected on every frame.
    if (!visible && previousVisible) {
      visible = true
      guard = 'transition-previous-fit'
      visibleTargetNames = previousShot.targetObjectNames
    }
    if (!visible) {
      const fallback = resolveGuidedShotFraming(scene, camera, shot, shot.fallbackSafeMargin)
      if (fallback) {
        pose = fallback.pose
        applyGuidedCameraPose(camera, pose)
        controls.target.set(...pose.target)
        controls.update()
        visible = guidedBoundsAreVisible(camera, fallback.bounds, shot.minProjectedDiameterNdc)
        guard = 'deterministic-safe-fit'
        visibleTargetNames = shot.targetObjectNames
      }
    }

    if (!visible) {
      activateStaticFallback('static-fallback-visibility-guard')
      return
    }

    lastGuidedPose.current = pose
    setStatus(guidedCameraActive)
    html.dataset.cameraShot = guidedShotId
    html.dataset.cameraShotProgress = guidedCameraProgress.toFixed(4)
    html.dataset.cameraGuidance = guidedCameraActive ? 'active' : 'released'
    html.dataset.cameraVisibility = 'safe'
    html.dataset.cameraVisibilityGuard = guard
    html.dataset.cameraVisibilityTargets = visibleTargetNames.join(',')
    html.dataset.cameraDestinationTargets = shot.targetObjectNames.join(',')
    html.dataset.cameraTransitionOrigin = storedFromPoseIsSafe
      ? 'persisted-safe-rest'
      : 'canonical-safe-composition'
    html.dataset.cameraPosition = pose.position.map((value) => value.toFixed(6)).join(',')
    html.dataset.cameraTarget = pose.target.map((value) => value.toFixed(6)).join(',')
    if (guidedCameraActive) delete html.dataset.cameraSettled
    else html.dataset.cameraSettled = 'guided'

    if (!guidedCameraActive) {
      const nextRestPose: GuidedCameraRestPose = {
        shotId: guidedShotId,
        position: pose.position,
        target: pose.target,
      }
      const currentRest = useMissionStore.getState().guidedCameraRestPose
      if (
        currentRest?.shotId !== nextRestPose.shotId ||
        currentRest.position.some((value, index) => value !== nextRestPose.position[index]) ||
        currentRest.target.some((value, index) => value !== nextRestPose.target[index])
      ) {
        useMissionStore.getState().setGuidedCameraRestPose(nextRestPose)
      }
    }
    invalidate()
  }, [
    camera,
    controls,
    guidedCameraActive,
    guidedCameraFromShotId,
    guidedCameraProgress,
    guidedCameraRestPose,
    guidedCameraTransitionEventId,
    guidedShotId,
    interaction.mode,
    invalidate,
    scene,
  ])

  useEffect(() => {
    if (tweenFrame.current !== null) cancelAnimationFrame(tweenFrame.current)
    if (settleFrame.current !== null) cancelAnimationFrame(settleFrame.current)
    delete document.documentElement.dataset.inspectTarget
    delete document.documentElement.dataset.inspectTargetCount
    if (interaction.mode !== 'inspect' || interaction.cameraControl !== 'guided-focus') return

    const targets = findInspectableComponentNodes(
      scene,
      interaction.componentId,
      stateAtMet(mission, metRef.current),
    )
    document.documentElement.dataset.inspectTargetCount = String(targets.length)
    const targetObject = targets.length === 1 ? targets[0] : undefined
    if (!targetObject) return
    document.documentElement.dataset.inspectTarget = interaction.componentId
    delete document.documentElement.dataset.cameraSettled

    const sphere = new Box3().setFromObject(targetObject).getBoundingSphere(new Sphere())
    const direction = camera.position.clone().sub(controls.target).normalize()
    const distance = Math.max(3.5, sphere.radius * 5)
    const targetLookAt = sphere.center.clone()
    const targetPosition = sphere.center.clone().add(direction.multiplyScalar(distance))
    const startPosition = camera.position.clone()
    const startTarget = controls.target.clone()
    const durationMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550
    const startedAt = performance.now()

    const settle = () => {
      settleFrame.current = requestAnimationFrame(() => {
        invalidate()
        settleFrame.current = requestAnimationFrame(() => {
          document.documentElement.dataset.cameraSettled = interaction.componentId
          settleFrame.current = null
        })
      })
    }
    const snapForLifecycle = () => {
      if (tweenFrame.current !== null) cancelAnimationFrame(tweenFrame.current)
      tweenFrame.current = null
      camera.position.copy(targetPosition)
      controls.target.copy(targetLookAt)
      controls.update()
      invalidate()
      document.documentElement.dataset.cameraSettled = interaction.componentId
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') snapForLifecycle()
    }
    const update = (now: number) => {
      const progress = durationMs === 0 ? 1 : Math.min(1, (now - startedAt) / durationMs)
      const eased = 1 - (1 - progress) ** 3
      camera.position.lerpVectors(startPosition, targetPosition, eased)
      controls.target.lerpVectors(startTarget, targetLookAt, eased)
      controls.update()
      invalidate()
      if (progress < 1) tweenFrame.current = requestAnimationFrame(update)
      else {
        tweenFrame.current = null
        settle()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', snapForLifecycle)
    tweenFrame.current = requestAnimationFrame(update)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', snapForLifecycle)
      if (tweenFrame.current !== null) cancelAnimationFrame(tweenFrame.current)
      if (settleFrame.current !== null) cancelAnimationFrame(settleFrame.current)
      tweenFrame.current = null
      settleFrame.current = null
    }
  }, [camera, controls, interaction, invalidate, scene])

  useEffect(
    () => () => {
      useMissionStore.getState().setGuidedCameraStatus(false)
      const html = document.documentElement
      if (html.dataset.cameraVisibility !== 'static-fallback') {
        delete html.dataset.cameraGuidance
        delete html.dataset.cameraVisibility
        delete html.dataset.cameraVisibilityGuard
        delete html.dataset.cameraVisibilityTargets
        delete html.dataset.cameraDestinationTargets
        delete html.dataset.cameraTransitionOrigin
        delete html.dataset.cameraPosition
        delete html.dataset.cameraTarget
      }
    },
    [],
  )

  return null
}

function RuntimeSceneState({
  state,
  configurationKey,
}: {
  state: ReturnType<typeof stateAtMet>
  configurationKey: string
}) {
  const scene = useThree((three) => three.scene)
  const invalidate = useThree((three) => three.invalidate)
  const stateRef = useRef(state)
  stateRef.current = state

  useLayoutEffect(() => {
    const html = document.documentElement
    html.dataset.controlScene = 'loading'
    useMissionStore.getState().setSceneRuntime('loading')
    const inspectable = runtimeInspectableComponentIds(scene, stateRef.current)
    useMissionStore.getState().setSceneRuntime('ready', inspectable)
    html.dataset.controlScene = 'ready'
    invalidate()
    return () => {
      if (html.dataset.controlScene === 'ready') delete html.dataset.controlScene
    }
  }, [configurationKey, invalidate, scene])

  return null
}

function LaunchAuditState({ visual }: { visual: LaunchVisualState }) {
  useEffect(() => {
    const html = document.documentElement
    html.dataset.launchVisualPolicy = visual.policy
    html.dataset.launchGuidedShot = visual.guidedShotId
    html.dataset.earthPresentation = 'schematic-not-epoch-accurate'
    html.dataset.earthRotationY = visual.earthRotationY.toFixed(6)
    html.dataset.launchDeparture = Object.entries(visual.departures)
      .filter(([, departure]) => departure.progress > 0 && departure.progress < 1)
      .map(([componentId]) => componentId)
      .join(',')
    return () => {
      delete html.dataset.launchVisualPolicy
      delete html.dataset.launchGuidedShot
      delete html.dataset.earthPresentation
      delete html.dataset.earthRotationY
      delete html.dataset.launchDeparture
    }
  }, [visual])

  return null
}

function SceneContents({
  met,
  storyTimeMs,
  visualTimeMs,
  transitionAnchors,
  suppressedGuidedCameraTransitionEventIds,
  speed,
  reducedMotion,
  interaction,
  cameraCommand,
  quality,
}: {
  met: number
  storyTimeMs: number
  visualTimeMs: number
  transitionAnchors: VisualTransitionAnchors
  suppressedGuidedCameraTransitionEventIds: readonly string[]
  speed: PlaybackSpeed
  reducedMotion: boolean
  interaction: ControlInteractionState
  cameraCommand: CameraCommand | null
  quality: Exclude<ModelQuality, 'fallback'>
}) {
  const phaseProgress = visualStateAtStoryTime(mission.narrative, storyTimeMs).progress
  const runtimeState = stateAtMet(mission, met)
  const mode = sceneModeAtMet(met)
  const launchVisual = launchVisualStateAt({
    storyTimeMs,
    visualTimeMs,
    transitionAnchors,
    suppressedGuidedCameraTransitionEventIds,
    metSeconds: met,
    speed,
    reducedMotion,
  })
  const background = useMemo(
    () =>
      new Color('#1a292e').lerp(
        new Color('#050706'),
        mode === 'launch' ? launchVisual.backgroundSpaceMix : 1,
      ),
    [launchVisual.backgroundSpaceMix, mode],
  )
  const configurationKey = `${quality}:${mode}:${Object.entries(runtimeState.components)
    .map(
      ([id, component]) =>
        `${id}:${component.lifecycle}:${component.parentId ?? '-'}:${component.visible}`,
    )
    .join('|')}`
  return (
    <>
      <color attach="background" args={[background]} />
      <SchematicStarField
        quality={quality}
        opacity={mode === 'launch' ? launchVisual.starOpacity : 1}
      />
      <ambientLight intensity={1.15} />
      <directionalLight position={[8, 7, 10]} intensity={2.5} color="#f3ead8" />
      <directionalLight position={[-6, 2, -4]} intensity={0.7} color="#758a83" />
      <MissionConfiguration
        met={met}
        phaseProgress={phaseProgress}
        quality={quality}
        launchVisual={launchVisual}
      />
      <CameraRig
        met={met}
        interaction={interaction}
        cameraCommand={cameraCommand}
        guidedShotId={mode === 'launch' ? launchVisual.guidedShotId : null}
        guidedCameraFromShotId={mode === 'launch' ? launchVisual.guidedCameraFromShotId : null}
        guidedCameraProgress={mode === 'launch' ? launchVisual.guidedCameraProgress : 1}
        guidedCameraActive={mode === 'launch' && launchVisual.guidedCameraActive}
        guidedCameraTransitionEventId={
          mode === 'launch' ? launchVisual.guidedCameraTransitionEventId : null
        }
      />
      {mode === 'launch' && <LaunchAuditState visual={launchVisual} />}
      <RuntimeSceneState state={runtimeState} configurationKey={configurationKey} />
    </>
  )
}

function LoadingScene() {
  useLayoutEffect(() => {
    document.documentElement.dataset.controlScene = 'loading'
    useMissionStore.getState().setSceneRuntime('loading')
  }, [])
  return (
    <mesh>
      <octahedronGeometry args={[0.34, 0]} />
      <meshBasicMaterial color="#a7b58f" wireframe />
    </mesh>
  )
}

function RendererAuditProbe() {
  const renderer = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const report = () => {
      const materials = new Set<unknown>()
      const csmConfigurations = new Set<string>()
      scene.traverse((object) => {
        const csmConfiguration = object.userData.csmConfiguration as string | undefined
        if (object.visible && csmConfiguration) csmConfigurations.add(csmConfiguration)
        const material = (object as { material?: unknown | unknown[] }).material
        for (const entry of Array.isArray(material) ? material : [material]) {
          if (entry) materials.add(entry)
        }
      })
      document.documentElement.dataset.rendererGeometries = String(renderer.info.memory.geometries)
      document.documentElement.dataset.rendererTextures = String(renderer.info.memory.textures)
      document.documentElement.dataset.rendererPrograms = String(
        renderer.info.programs?.length ?? 0,
      )
      document.documentElement.dataset.rendererMaterials = String(materials.size)
      document.documentElement.dataset.rendererFrames = String(renderer.info.render.frame)
      document.documentElement.dataset.rendererCalls = String(renderer.info.render.calls)
      document.documentElement.dataset.rendererTriangles = String(renderer.info.render.triangles)
      document.documentElement.dataset.renderedCsmConfigurations = [...csmConfigurations]
        .sort()
        .join(',')
    }

    report()
    window.addEventListener('apollo11:renderer-audit', report)
    return () => window.removeEventListener('apollo11:renderer-audit', report)
  }, [renderer, scene])

  return null
}

class SceneErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function StaticVehicleFallback() {
  useLayoutEffect(() => {
    const html = document.documentElement
    const reportFallback = () => {
      html.dataset.controlScene = 'fallback'
      html.dataset.cameraGuidance = 'released'
      html.dataset.cameraVisibility = 'static-fallback'
      html.dataset.cameraVisibilityGuard =
        html.dataset.cameraFallbackReason ?? 'static-fallback-selected'
      useMissionStore.getState().setSceneRuntime('fallback')
    }
    reportFallback()
    // A replaced Canvas subtree can finish child layout cleanups later in the
    // same commit. Re-assert at the next paint boundary against the final tree.
    const frame = requestAnimationFrame(reportFallback)
    return () => {
      cancelAnimationFrame(frame)
      if (html.dataset.controlScene === 'fallback') delete html.dataset.controlScene
      if (html.dataset.cameraVisibility === 'static-fallback') {
        delete html.dataset.cameraGuidance
        delete html.dataset.cameraVisibility
        delete html.dataset.cameraVisibilityGuard
        delete html.dataset.cameraFallbackReason
      }
    }
  }, [])
  return (
    <div
      className="static-vehicle-fallback"
      role="img"
      aria-label="Static vehicle structure fallback"
    >
      <img src="/missions/apollo11/fallbacks/vehicle-structure.svg" alt="" />
      <div>
        <b>STATIC VEHICLE STRUCTURE VIEW</b>
        <span>WEBGL OR MODEL DECODER UNAVAILABLE</span>
      </div>
    </div>
  )
}

function CanvasSupportFallback() {
  return <span hidden aria-hidden="true" />
}

let cachedWebglAvailability: boolean | undefined

function webglAvailable(): boolean {
  if (cachedWebglAvailability !== undefined) return cachedWebglAvailability

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  cachedWebglAvailability = Boolean(context)
  context?.getExtension('WEBGL_lose_context')?.loseContext()
  return cachedWebglAvailability
}

function useReducedMotionPreference(): boolean {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

export function MissionScene({
  met,
  storyTimeMs,
  visualTimeMs,
  transitionAnchors,
  suppressedGuidedCameraTransitionEventIds,
  speed,
  interaction,
  cameraCommand,
  quality,
}: {
  met: number
  storyTimeMs: number
  visualTimeMs: number
  transitionAnchors: VisualTransitionAnchors
  suppressedGuidedCameraTransitionEventIds: readonly string[]
  speed: PlaybackSpeed
  interaction: ControlInteractionState
  cameraCommand: CameraCommand | null
  quality: ModelQuality
}) {
  const reducedMotion = useReducedMotionPreference()
  if (quality === 'fallback' || !webglAvailable()) return <StaticVehicleFallback />

  return (
    <SceneErrorBoundary fallback={<StaticVehicleFallback />}>
      <Canvas
        dpr={[1, quality === 'high' ? 2 : 1.5]}
        camera={{ position: [9.2, 4.8, 12.8], fov: 38, near: 0.1, far: 500 }}
        frameloop="demand"
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
        fallback={<CanvasSupportFallback />}
      >
        <RendererAuditProbe />
        <Suspense fallback={<LoadingScene />}>
          <SceneContents
            met={met}
            storyTimeMs={storyTimeMs}
            visualTimeMs={visualTimeMs}
            transitionAnchors={transitionAnchors}
            suppressedGuidedCameraTransitionEventIds={suppressedGuidedCameraTransitionEventIds}
            speed={speed}
            reducedMotion={reducedMotion}
            interaction={interaction}
            cameraCommand={cameraCommand}
            quality={quality}
          />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  )
}
