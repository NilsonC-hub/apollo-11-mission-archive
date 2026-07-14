import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
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
  type ModelQuality,
} from '../../app/missionStore.ts'
import { stateAtMet, visualStateAtStoryTime } from '../../mission-core/index.ts'
import { resolveComponentNode, resolveSemanticNode } from './modelNodeLookup.ts'

const MODEL_ROOT = '/missions/apollo11/models'
const DRACO_ROOT = '/missions/apollo11/decoders/three-draco/'
const BASIS_ROOT = '/missions/apollo11/decoders/three-basis/'

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

function SchematicStarField({ quality }: { quality: Exclude<ModelQuality, 'fallback'> }) {
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
          opacity={0.38}
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
          opacity={0.72}
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
  offsetY = 0,
): void {
  const node = resolveComponentNode(root, componentId)
  const baseY = Number(node.userData.presentationBaseY ?? node.position.y)
  node.userData.presentationBaseY = baseY
  node.userData.semanticComponentId = componentId
  node.visible = visible
  node.position.y = baseY + offsetY
}

function handleSemanticClick(event: ThreeEvent<MouseEvent>): void {
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

function SaturnStack({
  met,
  quality,
}: {
  met: number
  quality: Exclude<ModelQuality, 'fallback'>
}) {
  const gltf = useGlb(modelUrl('saturn-v', quality))
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const state = stateAtMet(mission, met)
  const postCsmSeparation = met >= getEvent('a11-csm-sivb-separation').metSeconds

  useEffect(() => {
    const separatingComponents = [
      's-ic',
      's-ic-s-ii-interstage',
      's-ii',
      's-ii-s-ivb-interstage',
      'launch-escape-system',
    ] as const

    for (const componentId of separatingComponents) {
      const discarded = state.components[componentId]?.lifecycle === 'discarded'
      setComponentPresentation(scene, componentId, !discarded)
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
  }, [met, postCsmSeparation, scene, state.components])

  const ascent = state.phaseId === 'prelaunch' || state.phaseId === 'ascent'
  return (
    <group rotation={[0, 0, ascent ? 0 : -Math.PI / 2]} position={[0, ascent ? -3.7 : 0, 0]}>
      <primitive object={scene} scale={0.067} onClick={handleSemanticClick} />
      {state.components['s-ic']?.engineMode === 'burning' && (
        <mesh position={[0, -4.2, 0]}>
          <coneGeometry args={[0.2, 1.4, 14]} />
          <meshBasicMaterial color="#d0a45a" transparent opacity={0.72} />
        </mesh>
      )}
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

  useEffect(() => {
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

  useEffect(() => {
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
}: {
  kind: 'earth' | 'moon'
  position: Position
  radius: number
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
    <mesh position={position}>
      <sphereGeometry args={[radius, 64, 32]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
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
}: {
  met: number
  phaseProgress: number
  quality: Exclude<ModelQuality, 'fallback'>
}) {
  const mode = sceneModeAtMet(met)

  if (mode === 'launch') {
    return (
      <>
        <Planet kind="earth" position={[-7.6, -4.8, -7]} radius={5.5} />
        <SaturnStack met={met} quality={quality} />
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
    const transearth = stateAtMet(mission, met).phaseId === 'transearth'
    return (
      <>
        <Planet kind="moon" position={[-8.6, -3.9, -10]} radius={transearth ? 2.5 : 5.2} />
        {transearth && <Planet kind="earth" position={[9.5, 3.8, -12]} radius={2.2} />}
        <TrajectoryReference mode="return" />
        <CsmModel quality={quality} position={[0.6, 0.4, 0]} scale={0.18} />
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
  interaction,
  cameraCommand,
}: {
  interaction: ControlInteractionState
  cameraCommand: CameraCommand | null
}) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl.domElement])
  const tweenFrame = useRef<number | null>(null)

  useEffect(() => {
    controls.enableDamping = false
    controls.enablePan = true
    controls.minDistance = 1.2
    controls.maxDistance = 80
    const onStart = () => useMissionStore.getState().enterFreeLook()
    const onChange = () => invalidate()
    const onDirectInput = () => useMissionStore.getState().enterFreeLook()
    controls.addEventListener('start', onStart)
    controls.addEventListener('change', onChange)
    gl.domElement.addEventListener('pointerdown', onDirectInput, { capture: true })
    gl.domElement.addEventListener('wheel', onDirectInput, { capture: true, passive: true })
    gl.domElement.addEventListener('touchstart', onDirectInput, { capture: true, passive: true })
    controls.update()
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('change', onChange)
      gl.domElement.removeEventListener('pointerdown', onDirectInput, { capture: true })
      gl.domElement.removeEventListener('wheel', onDirectInput, { capture: true })
      gl.domElement.removeEventListener('touchstart', onDirectInput, { capture: true })
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
      camera.position.copy(guidedCameraPosition)
      controls.target.copy(guidedCameraTarget)
    } else {
      camera.position.copy(controls.target).add(offset)
    }
    controls.update()
    invalidate()
    document.documentElement.dataset.cameraCommand = cameraCommand.kind
  }, [camera, cameraCommand, controls, invalidate])

  useEffect(() => {
    if (tweenFrame.current !== null) cancelAnimationFrame(tweenFrame.current)

    let targetPosition: Vector3 | undefined
    let targetLookAt: Vector3 | undefined
    if (interaction.mode === 'guided') {
      targetPosition = guidedCameraPosition.clone()
      targetLookAt = guidedCameraTarget.clone()
    } else if (interaction.mode === 'inspect' && interaction.cameraControl === 'guided-focus') {
      let targetObject: Group | undefined
      scene.traverse((object) => {
        if (object.userData.semanticComponentId === interaction.componentId) {
          targetObject = object as Group
        }
      })
      if (targetObject) {
        const sphere = new Box3().setFromObject(targetObject).getBoundingSphere(new Sphere())
        const direction = camera.position.clone().sub(controls.target).normalize()
        const distance = Math.max(3.5, sphere.radius * 5)
        targetLookAt = sphere.center.clone()
        targetPosition = sphere.center.clone().add(direction.multiplyScalar(distance))
      }
    }

    if (!targetPosition || !targetLookAt) return
    const startPosition = camera.position.clone()
    const startTarget = controls.target.clone()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const durationMs = reduceMotion ? 0 : 550
    const startedAt = performance.now()

    const update = (now: number) => {
      const progress = durationMs === 0 ? 1 : Math.min(1, (now - startedAt) / durationMs)
      const eased = 1 - (1 - progress) ** 3
      camera.position.lerpVectors(startPosition, targetPosition, eased)
      controls.target.lerpVectors(startTarget, targetLookAt, eased)
      controls.update()
      invalidate()
      if (progress < 1) tweenFrame.current = requestAnimationFrame(update)
      else tweenFrame.current = null
    }
    tweenFrame.current = requestAnimationFrame(update)
    return () => {
      if (tweenFrame.current !== null) cancelAnimationFrame(tweenFrame.current)
      tweenFrame.current = null
    }
  }, [camera, controls, interaction, invalidate, scene])

  return null
}

function SceneContents({
  met,
  storyTimeMs,
  interaction,
  cameraCommand,
  quality,
}: {
  met: number
  storyTimeMs: number
  interaction: ControlInteractionState
  cameraCommand: CameraCommand | null
  quality: Exclude<ModelQuality, 'fallback'>
}) {
  const phaseProgress = visualStateAtStoryTime(mission.narrative, storyTimeMs).progress
  return (
    <>
      <color attach="background" args={['#050706']} />
      <SchematicStarField quality={quality} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[8, 7, 10]} intensity={2.5} color="#f3ead8" />
      <directionalLight position={[-6, 2, -4]} intensity={0.7} color="#758a83" />
      <MissionConfiguration met={met} phaseProgress={phaseProgress} quality={quality} />
      <CameraRig interaction={interaction} cameraCommand={cameraCommand} />
    </>
  )
}

function LoadingScene() {
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
      scene.traverse((object) => {
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

let cachedWebglAvailability: boolean | undefined

function webglAvailable(): boolean {
  if (cachedWebglAvailability !== undefined) return cachedWebglAvailability

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  cachedWebglAvailability = Boolean(context)
  context?.getExtension('WEBGL_lose_context')?.loseContext()
  return cachedWebglAvailability
}

export function MissionScene({
  met,
  storyTimeMs,
  interaction,
  cameraCommand,
  quality,
}: {
  met: number
  storyTimeMs: number
  interaction: ControlInteractionState
  cameraCommand: CameraCommand | null
  quality: ModelQuality
}) {
  if (quality === 'fallback' || !webglAvailable()) return <StaticVehicleFallback />

  return (
    <SceneErrorBoundary fallback={<StaticVehicleFallback />}>
      <Canvas
        dpr={[1, quality === 'high' ? 2 : 1.5]}
        camera={{ position: [9.2, 4.8, 12.8], fov: 38, near: 0.1, far: 120 }}
        frameloop="demand"
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
        fallback={<StaticVehicleFallback />}
      >
        <RendererAuditProbe />
        <Suspense fallback={<LoadingScene />}>
          <SceneContents
            met={met}
            storyTimeMs={storyTimeMs}
            interaction={interaction}
            cameraCommand={cameraCommand}
            quality={quality}
          />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  )
}
