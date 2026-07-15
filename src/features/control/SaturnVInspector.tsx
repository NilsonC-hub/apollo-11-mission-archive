import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { mission, replayStartMet } from '../../app/mission.ts'
import {
  type CameraCommandKind,
  type ModelQuality,
  useMissionStore,
} from '../../app/missionStore.ts'
import { stateAtMet, storyTimeAtMet } from '../../mission-core/index.ts'
import assetManifest from '../../missions/apollo11/asset-manifest.json' with { type: 'json' }
import saturnManifest from '../../missions/apollo11/node-manifests/apollo11-saturn-v.json' with { type: 'json' }
import { InterfaceToneControl } from './InterfaceToneControl.tsx'
import { playInterfaceTone } from './interfaceTones.ts'
import { resolveSaturnVInspectorTruth } from './saturnVInspectorTruth.ts'
import './controlCheckpoint.css'

const MissionScene = lazy(() =>
  import('./MissionScene.tsx').then((module) => ({ default: module.MissionScene })),
)

const inspectorMet = replayStartMet
const inspectorStoryTime = storyTimeAtMet(mission.narrative, inspectorMet)
const saturnComponents = mission.vehicle.components.filter(
  (component) => component.nodeBinding?.assetId === 'apollo11-saturn-v',
)
const inspectorTruth = resolveSaturnVInspectorTruth(
  saturnManifest.assetId,
  assetManifest,
  saturnManifest,
  saturnComponents,
)
const saturnComponentIds = new Set(saturnComponents.map((component) => component.id))
const componentsById = new Map(
  mission.vehicle.components.map((component) => [component.id, component]),
)
type SaturnComponent = (typeof saturnComponents)[number]
interface SaturnTreeNode {
  component: SaturnComponent
  children: SaturnTreeNode[]
}

function nearestSaturnParentId(component: SaturnComponent): string | null {
  let parentId = component.initialState.parentId
  const visited = new Set<string>()
  while (parentId && !visited.has(parentId)) {
    if (saturnComponentIds.has(parentId)) return parentId
    visited.add(parentId)
    parentId = componentsById.get(parentId)?.initialState.parentId ?? null
  }
  return null
}
const treeNodes = new Map(
  saturnComponents.map((component) => [
    component.id,
    { component, children: [] } as SaturnTreeNode,
  ]),
)
const saturnTree: SaturnTreeNode[] = []
for (const component of saturnComponents) {
  const node = treeNodes.get(component.id)!
  const parentId = nearestSaturnParentId(component)
  const parent = parentId ? treeNodes.get(parentId) : undefined
  if (parent) parent.children.push(node)
  else saturnTree.push(node)
}
const componentOrdinal = new Map(
  saturnComponents.map((component, index) => [component.id, String(index + 1).padStart(2, '0')]),
)
const qualities: ModelQuality[] = ['high', 'medium', 'low', 'fallback']

function SaturnComponentTree({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: readonly SaturnTreeNode[]
  selectedId: string
  onSelect: (componentId: string) => void
}) {
  return (
    <ul>
      {nodes.map(({ component, children }) => (
        <li key={component.id}>
          <button
            type="button"
            className={selectedId === component.id ? 'is-active' : undefined}
            aria-pressed={selectedId === component.id}
            onClick={() => onSelect(component.id)}
          >
            <span>{componentOrdinal.get(component.id)}</span>
            <b>{component.label}</b>
            <small>
              {component.initialState.parentId
                ? `↳ ${componentsById.get(component.initialState.parentId)?.label ?? component.initialState.parentId}`
                : 'ROOT ASSEMBLY'}
            </small>
          </button>
          {children.length > 0 && (
            <SaturnComponentTree nodes={children} selectedId={selectedId} onSelect={onSelect} />
          )}
        </li>
      ))}
    </ul>
  )
}

export function SaturnVInspector() {
  const [manualSelection, setManualSelection] = useState(saturnComponents[0].id)
  const quality = useMissionStore((state) => state.quality)
  const sceneAvailability = useMissionStore((state) => state.sceneAvailability)
  const interaction = useMissionStore((state) => state.interaction)
  const cameraCommand = useMissionStore((state) => state.cameraCommand)
  const setQuality = useMissionStore((state) => state.setQuality)
  const enterFreeLook = useMissionStore((state) => state.enterFreeLook)
  const returnToGuided = useMissionStore((state) => state.returnToGuided)
  const requestCameraCommand = useMissionStore((state) => state.requestCameraCommand)
  const inspectComponent = useMissionStore((state) => state.inspectComponent)
  const selectedId = manualSelection
  const selected = saturnComponents.find((component) => component.id === selectedId)!
  const initialState = stateAtMet(mission, inspectorMet).components[selected.id]
  const sceneInteractive = quality !== 'fallback' && sceneAvailability === 'ready'

  useEffect(() => {
    const store = useMissionStore.getState()
    // Convert any playback-resuming inspection inherited from Control into the
    // normal explicit-resume transaction before this reference route loads.
    store.pauseForModeSwitch()
    store.setSceneRuntime('loading')
    return () => {
      useMissionStore.getState().closeInspection()
    }
  }, [])

  useEffect(() => {
    if (interaction.mode === 'inspect' && saturnComponentIds.has(interaction.componentId)) {
      setManualSelection(interaction.componentId)
    }
  }, [interaction])

  useEffect(() => {
    if (sceneAvailability !== 'ready') return
    const frame = requestAnimationFrame(() => {
      useMissionStore.getState().inspectComponent(manualSelection)
    })
    return () => cancelAnimationFrame(frame)
  }, [manualSelection, sceneAvailability])

  const command = (kind: CameraCommandKind) => {
    requestCameraCommand(kind)
    playInterfaceTone('action')
  }

  const select = (componentId: string) => {
    setManualSelection(componentId)
    if (sceneInteractive) inspectComponent(componentId)
    playInterfaceTone('action')
  }

  return (
    <main id="main-content" className="saturn-inspector" tabIndex={-1}>
      <header className="saturn-inspector__header">
        <div>
          <span>CONTROL / STRUCTURE WORKSPACE</span>
          <h1>SATURN V STRUCTURE INSPECTOR</h1>
          <p>
            A bounded model-reading surface for rotation, scale and semantic component focus. This
            is not a flight dynamics simulation.
          </p>
        </div>
        <Link to="/archive#saturn-v">RETURN TO ARCHIVE / SATURN V</Link>
      </header>

      <section className="saturn-inspector__truth" aria-label="Model truth statement">
        <div>
          <span>MODEL SOURCE</span>
          <b>{inspectorTruth.sourceIds.join(' · ')}</b>
        </div>
        <div>
          <span>GEOMETRY STATUS</span>
          <b>{inspectorTruth.truthLabel}</b>
        </div>
        <div>
          <span>SEMANTIC STRUCTURE</span>
          <b>EVIDENCE / {inspectorTruth.evidenceClasses.join(' · ').toUpperCase()}</b>
        </div>
      </section>

      <div className="saturn-inspector__workspace">
        <aside className="saturn-inspector__index" aria-label="Saturn V component index">
          <div className="saturn-inspector__section-label">
            <span>01</span>
            COMPONENT REGISTER
          </div>
          <SaturnComponentTree nodes={saturnTree} selectedId={selected.id} onSelect={select} />
        </aside>

        <section className="saturn-inspector__viewport" aria-label="Interactive Saturn V model">
          <div className="saturn-inspector__tools">
            <div>
              <span>MODEL VIEW</span>
              <b>{sceneInteractive ? 'INTERACTIVE' : 'STATIC FALLBACK AVAILABLE'}</b>
            </div>
            <label>
              QUALITY
              <select
                value={quality}
                onChange={(event) => setQuality(event.target.value as ModelQuality)}
              >
                {qualities.map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="saturn-inspector__camera" aria-label="Inspector camera controls">
            <button
              type="button"
              disabled={!sceneInteractive}
              onClick={() => command('rotate-left')}
            >
              ROTATE −
            </button>
            <button
              type="button"
              disabled={!sceneInteractive}
              onClick={() => command('rotate-right')}
            >
              ROTATE +
            </button>
            <button type="button" disabled={!sceneInteractive} onClick={() => command('zoom-in')}>
              ZOOM +
            </button>
            <button type="button" disabled={!sceneInteractive} onClick={() => command('zoom-out')}>
              ZOOM −
            </button>
            <button type="button" disabled={!sceneInteractive} onClick={() => command('reset')}>
              RESET
            </button>
            {interaction.mode !== 'guided' && (
              <button className="is-primary" type="button" onClick={returnToGuided}>
                {interaction.mode === 'inspect' ? 'REFOCUS' : 'GUIDED VIEW'}
              </button>
            )}
          </div>
          <div
            className="saturn-inspector__scene"
            tabIndex={sceneInteractive ? 0 : -1}
            aria-disabled={!sceneInteractive}
            onWheel={sceneInteractive ? enterFreeLook : undefined}
            onKeyDown={(event) => {
              const kind =
                event.key === 'ArrowLeft'
                  ? 'rotate-left'
                  : event.key === 'ArrowRight'
                    ? 'rotate-right'
                    : event.key === '+' || event.key === '='
                      ? 'zoom-in'
                      : event.key === '-'
                        ? 'zoom-out'
                        : event.key === 'Home'
                          ? 'reset'
                          : undefined
              if (!kind || !sceneInteractive) return
              event.preventDefault()
              command(kind)
            }}
          >
            <Suspense fallback={<div className="scene-loading outside">INITIALIZING 3D VIEW</div>}>
              <MissionScene
                met={inspectorMet}
                storyTimeMs={inspectorStoryTime}
                visualTimeMs={0}
                transitionAnchors={{}}
                suppressedGuidedCameraTransitionEventIds={[]}
                speed={100}
                interaction={interaction}
                cameraCommand={cameraCommand}
                quality={quality}
              />
            </Suspense>
            <div className="saturn-inspector__legend">
              <span>ROTATE / DRAG · ZOOM / PINCH OR WHEEL</span>
              <span>STRUCTURAL PRESENTATION / SCHEMATIC</span>
            </div>
          </div>
        </section>

        <aside className="saturn-inspector__dossier" aria-labelledby="saturn-component-title">
          <div className="saturn-inspector__section-label">
            <span>02</span>
            COMPONENT DOSSIER
          </div>
          <h2 id="saturn-component-title">{selected.label}</h2>
          <dl>
            <div>
              <dt>REFERENCE CONFIGURATION / PRELAUNCH</dt>
              <dd>{initialState.lifecycle.toUpperCase()}</dd>
            </div>
            <div>
              <dt>PARENT ASSEMBLY</dt>
              <dd>{selected.initialState.parentId?.toUpperCase() ?? 'ROOT ASSEMBLY'}</dd>
            </div>
            <div>
              <dt>EVIDENCE CLASS</dt>
              <dd>{(selected.evidence ?? 'reconstructed').toUpperCase()}</dd>
            </div>
            <div>
              <dt>SOURCE IDS</dt>
              <dd>{selected.sourceIds?.join(' · ')}</dd>
            </div>
          </dl>
          <p>{selected.method}</p>
          <small>{inspectorTruth.geometryTruth}</small>
        </aside>
      </div>

      <InterfaceToneControl />
    </main>
  )
}
