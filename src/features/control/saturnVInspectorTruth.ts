import type { EvidenceClass, VehicleComponentDefinition } from '../../mission-core/index.ts'

interface AssetManifestRecord {
  assetId: string
  kind: string
  sourceIds?: string[]
  truthLabel?: string
}

interface AssetManifestLike {
  assets: AssetManifestRecord[]
}

interface NodeManifestLike {
  assetId: string
  sourceIds: string[]
  geometryTruth: string
}

export interface SaturnVInspectorTruth {
  sourceIds: readonly string[]
  truthLabel: string
  geometryTruth: string
  evidenceClasses: readonly EvidenceClass[]
}

function requireNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid Saturn V inspector truth record at ${path}`)
  }
  return value
}

function requireSourceIds(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Invalid Saturn V inspector truth record at ${path}`)
  }
  const sourceIds = value.map((entry, index) => requireNonEmptyString(entry, `${path}[${index}]`))
  if (new Set(sourceIds).size !== sourceIds.length) {
    throw new Error(`Duplicate Saturn V source id at ${path}`)
  }
  return sourceIds
}

/**
 * Resolves the inspector labels from the same versioned records that drive the
 * rendered asset and component dossiers. A manifest mismatch fails closed.
 */
export function resolveSaturnVInspectorTruth(
  assetId: string,
  assetManifest: AssetManifestLike,
  nodeManifest: NodeManifestLike,
  components: readonly VehicleComponentDefinition[],
): SaturnVInspectorTruth {
  const matchingAssets = assetManifest.assets.filter((asset) => asset.assetId === assetId)
  if (matchingAssets.length !== 1 || matchingAssets[0].kind !== 'model') {
    throw new Error(`Expected one model asset record for ${assetId}`)
  }
  if (nodeManifest.assetId !== assetId) {
    throw new Error(`Node manifest asset id does not match ${assetId}`)
  }

  const asset = matchingAssets[0]
  const assetSourceIds = requireSourceIds(asset.sourceIds, `${assetId}.asset.sourceIds`)
  const nodeSourceIds = requireSourceIds(nodeManifest.sourceIds, `${assetId}.node.sourceIds`)
  if (
    assetSourceIds.length !== nodeSourceIds.length ||
    assetSourceIds.some((sourceId, index) => sourceId !== nodeSourceIds[index])
  ) {
    throw new Error(`Asset and node source records disagree for ${assetId}`)
  }

  if (components.length === 0) throw new Error(`No component records bind to ${assetId}`)
  const componentSourceIds = new Set(components.flatMap((component) => component.sourceIds ?? []))
  for (const sourceId of nodeSourceIds) {
    if (!componentSourceIds.has(sourceId)) {
      throw new Error(`Component records do not cite ${sourceId} for ${assetId}`)
    }
  }
  const evidenceClasses = [...new Set(components.map((component) => component.evidence))].sort()
  if (evidenceClasses.some((evidence) => evidence === undefined)) {
    throw new Error(`Component evidence is incomplete for ${assetId}`)
  }

  return {
    sourceIds: nodeSourceIds,
    truthLabel: requireNonEmptyString(asset.truthLabel, `${assetId}.asset.truthLabel`),
    geometryTruth: requireNonEmptyString(
      nodeManifest.geometryTruth,
      `${assetId}.node.geometryTruth`,
    ),
    evidenceClasses: evidenceClasses as EvidenceClass[],
  }
}
