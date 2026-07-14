import { Component, Suspense, useEffect, useMemo } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import type { Group } from 'three'

import { getEvent, mission } from '../../app/mission.ts'
import type { ModelQuality } from '../../app/missionStore.ts'
import { stateAtMet } from '../../mission-core/index.ts'

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

function presentationProgress(met: number, eventId: string, duration = 24): number {
  const start = getEvent(eventId).metSeconds
  return Math.min(1, Math.max(0, (met - start) / duration))
}

function rangeProgress(met: number, startEventId: string, endEventId: string): number {
  const start = getEvent(startEventId).metSeconds
  const end = getEvent(endEventId).metSeconds
  return Math.min(1, Math.max(0, (met - start) / (end - start)))
}

function setNodePresentation(root: Group, nodeName: string, visible: boolean, offsetY = 0): void {
  const node = root.getObjectByName(nodeName)
  if (!node) return
  const baseY = Number(node.userData.presentationBaseY ?? node.position.y)
  node.userData.presentationBaseY = baseY
  node.visible = visible
  node.position.y = baseY + offsetY
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
    const separations = [
      ['s-ic', 'a11-sic-sii-separation'],
      ['s-ic-s-ii-interstage', 'a11-sic-sii-separation'],
      ['s-ii', 'a11-sii-sivb-separation'],
      ['s-ii-s-ivb-interstage', 'a11-sii-sivb-separation'],
      ['launch-escape-system', 'a11-les-jettison'],
    ] as const

    for (const [componentId, eventId] of separations) {
      const progress = presentationProgress(met, eventId)
      const discarded = state.components[componentId]?.lifecycle === 'discarded'
      setNodePresentation(scene, componentId, !discarded || progress < 1, -progress * 12)
    }
    setNodePresentation(scene, 'command-service-module', !postCsmSeparation)
  }, [met, postCsmSeparation, scene, state.components])

  const ascent = state.phaseId === 'prelaunch' || state.phaseId === 'ascent'
  return (
    <group rotation={[0, 0, ascent ? 0 : -Math.PI / 2]} position={[0, ascent ? -3.7 : 0, 0]}>
      <primitive object={scene} scale={0.067} />
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
    setNodePresentation(scene, 'service-module', configuration === 'full')
  }, [configuration, scene])

  return (
    <group position={position} rotation={[0, 0, -Math.PI / 2]}>
      <primitive object={scene} scale={scale} />
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
    setNodePresentation(scene, 'lm-ascent-stage', stage !== 'descent')
    setNodePresentation(scene, 'lm-descent-stage', stage !== 'ascent')
  }, [scene, stage])

  return (
    <group position={position} rotation={[0, 0, -Math.PI / 2]}>
      <primitive object={scene} scale={scale} />
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

  const dockingProgress = Math.min(1, Math.max(0, (met - separation) / (docking - separation)))
  const ejected = met >= ejection
  const assemblyX = ejected ? 2.8 : 0
  const csmX = ejected ? 2.6 : 4.2 - dockingProgress * 3.2

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
  quality,
}: {
  met: number
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
    const progress = rangeProgress(met, 'a11-spacecraft-ejection', 'a11-loi-ignition')
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
    const progress = rangeProgress(met, 'a11-undocking', 'a11-touchdown')
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
    const progress = rangeProgress(met, 'a11-lunar-liftoff', 'a11-lm-csm-docking')
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

function SceneContents({
  met,
  quality,
}: {
  met: number
  quality: Exclude<ModelQuality, 'fallback'>
}) {
  return (
    <>
      <color attach="background" args={['#050706']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[8, 7, 10]} intensity={2.5} color="#f3ead8" />
      <directionalLight position={[-6, 2, -4]} intensity={0.7} color="#758a83" />
      <MissionConfiguration met={met} quality={quality} />
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

export function MissionScene({ met, quality }: { met: number; quality: ModelQuality }) {
  if (quality === 'fallback') return <StaticVehicleFallback />

  return (
    <SceneErrorBoundary fallback={<StaticVehicleFallback />}>
      <Canvas
        dpr={[1, quality === 'high' ? 2 : 1.5]}
        camera={{ position: [9.2, 4.8, 12.8], fov: 38, near: 0.1, far: 120 }}
        frameloop="demand"
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
        fallback={<StaticVehicleFallback />}
      >
        <Suspense fallback={<LoadingScene />}>
          <SceneContents met={met} quality={quality} />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  )
}
