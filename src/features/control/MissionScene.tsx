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

function setNodePresentation(root: Group, nodeName: string, visible: boolean, offsetY = 0): void {
  const node = root.getObjectByName(nodeName)
  if (!node) return
  const baseY = Number(node.userData.presentationBaseY ?? node.position.y)
  node.userData.presentationBaseY = baseY
  node.visible = visible
  node.position.y = baseY + offsetY
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
        <mesh position={[0, -4.2, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.2, 1.4, 14]} />
          <meshBasicMaterial color="#d0a45a" transparent opacity={0.72} />
        </mesh>
      )}
    </group>
  )
}

function SpacecraftAssembly({
  met,
  quality,
}: {
  met: number
  quality: Exclude<ModelQuality, 'fallback'>
}) {
  const csm = useGlb(modelUrl('command-service-module', quality))
  const lm = useGlb(modelUrl('lunar-module', quality))
  const csmScene = useMemo(() => csm.scene.clone(true), [csm.scene])
  const lmScene = useMemo(() => lm.scene.clone(true), [lm.scene])
  const separation = getEvent('a11-csm-sivb-separation').metSeconds
  const docking = getEvent('a11-first-docking').metSeconds
  const ejection = getEvent('a11-spacecraft-ejection').metSeconds
  const active = met >= separation
  const dockingProgress = Math.min(1, Math.max(0, (met - separation) / (docking - separation)))
  const ejected = met >= ejection

  if (!active) return null
  const csmX = ejected ? 2.6 : 4.2 - dockingProgress * 3.2
  const assemblyX = ejected ? 2.8 : 0

  return (
    <group position={[assemblyX, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <primitive object={lmScene} scale={0.14} position={[0, -0.4, 0]} />
      <primitive object={csmScene} scale={0.14} position={[csmX - assemblyX, 0.66, 0]} />
    </group>
  )
}

function Earth() {
  const gl = useThree((state) => state.gl)
  const texture = useLoader(
    KTX2Loader,
    '/missions/apollo11/textures/earth-blue-marble-1k.ktx2',
    (loader) => loader.setTranscoderPath(BASIS_ROOT).detectSupport(gl),
  )
  return (
    <group position={[-7.6, -4.8, -7]}>
      <mesh>
        <sphereGeometry args={[5.5, 64, 32]} />
        <meshStandardMaterial map={texture} roughness={1} metalness={0} />
      </mesh>
      <mesh rotation={[Math.PI / 2.8, 0, 0]}>
        <torusGeometry args={[6.4, 0.008, 4, 160]} />
        <meshBasicMaterial color="#8da1a2" transparent opacity={0.38} />
      </mesh>
    </group>
  )
}

function SceneContents({
  met,
  quality,
}: {
  met: number
  quality: Exclude<ModelQuality, 'fallback'>
}) {
  const spacecraftSeparated = met >= getEvent('a11-csm-sivb-separation').metSeconds
  return (
    <>
      <color attach="background" args={['#050706']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[8, 7, 10]} intensity={2.5} color="#f3ead8" />
      <directionalLight position={[-6, 2, -4]} intensity={0.7} color="#758a83" />
      <Earth />
      <SaturnStack met={met} quality={quality} />
      {spacecraftSeparated && <SpacecraftAssembly met={met} quality={quality} />}
      <gridHelper args={[24, 24, '#2f3a34', '#172019']} position={[0, -4.4, 0]} />
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
      aria-label="Static Saturn V structure fallback"
    >
      <img src="/missions/apollo11/fallbacks/vehicle-structure.svg" alt="" />
      <div>
        <b>STATIC STRUCTURE VIEW</b>
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
