import type { Object3D } from 'three'

import { mission } from '../../app/mission.ts'
import csmManifest from '../../missions/apollo11/node-manifests/apollo11-command-service-module.json' with { type: 'json' }
import lunarModuleManifest from '../../missions/apollo11/node-manifests/apollo11-lunar-module.json' with { type: 'json' }
import saturnManifest from '../../missions/apollo11/node-manifests/apollo11-saturn-v.json' with { type: 'json' }

interface RuntimeNodeManifest {
  assetId: string
  nodes: Record<string, { path: string; required: boolean }>
}

const manifests = new Map<string, RuntimeNodeManifest>(
  [saturnManifest, lunarModuleManifest, csmManifest].map((manifest) => [
    manifest.assetId,
    manifest,
  ]),
)

export function nodePathForComponent(componentId: string): string {
  const component = mission.vehicle.components.find((candidate) => candidate.id === componentId)
  if (!component?.nodeBinding) {
    throw new RangeError(`Component has no runtime node binding: ${componentId}`)
  }
  return nodePathForSemanticId(component.nodeBinding.assetId, component.nodeBinding.semanticNodeId)
}

export function nodePathForSemanticId(assetId: string, semanticNodeId: string): string {
  const manifest = manifests.get(assetId)
  if (!manifest) throw new RangeError(`Unknown node manifest: ${assetId}`)
  const node = manifest.nodes[semanticNodeId]
  if (!node) {
    throw new RangeError(`Unknown semantic node ${semanticNodeId} in ${manifest.assetId}`)
  }
  return node.path
}

export function resolveComponentNode(root: Object3D, componentId: string): Object3D {
  return resolveManifestNode(root, nodePathForComponent(componentId), componentId)
}

export function resolveSemanticNode(
  root: Object3D,
  assetId: string,
  semanticNodeId: string,
): Object3D {
  return resolveManifestNode(root, nodePathForSemanticId(assetId, semanticNodeId), semanticNodeId)
}

function resolveManifestNode(root: Object3D, path: string, label: string): Object3D {
  const parts = path.split('/').filter(Boolean)
  let current = root
  if (parts[0] === current.name) parts.shift()

  for (const part of parts) {
    const child = current.children.find((candidate) => candidate.name === part)
    if (!child) {
      throw new RangeError(`Node Manifest path for ${label} is missing at ${part}`)
    }
    current = child
  }
  return current
}

export function inspectableComponentIds(): string[] {
  return mission.vehicle.components
    .filter((component) => component.nodeBinding)
    .map((component) => component.id)
}
