import assert from 'node:assert/strict'
import test from 'node:test'

import { mission } from '../../src/app/mission.ts'
import { resolveSaturnVInspectorTruth } from '../../src/features/control/saturnVInspectorTruth.ts'
import assetManifest from '../../src/missions/apollo11/asset-manifest.json' with { type: 'json' }
import saturnManifest from '../../src/missions/apollo11/node-manifests/apollo11-saturn-v.json' with { type: 'json' }

const saturnComponents = mission.vehicle.components.filter(
  (component) => component.nodeBinding?.assetId === saturnManifest.assetId,
)

test('Inspector truth is derived exactly from the canonical asset, node and component records', () => {
  const truth = resolveSaturnVInspectorTruth(
    saturnManifest.assetId,
    assetManifest,
    saturnManifest,
    saturnComponents,
  )
  const asset = assetManifest.assets.find(
    (candidate) => candidate.assetId === saturnManifest.assetId,
  )!
  assert.deepEqual(truth.sourceIds, saturnManifest.sourceIds)
  assert.equal(truth.truthLabel, asset.truthLabel)
  assert.equal(truth.geometryTruth, saturnManifest.geometryTruth)
  assert.deepEqual(truth.evidenceClasses, ['reconstructed'])
})

test('Inspector truth fails closed when asset and node sources disagree', () => {
  assert.throws(() =>
    resolveSaturnVInspectorTruth(
      saturnManifest.assetId,
      assetManifest,
      { ...saturnManifest, sourceIds: ['NASA-MODEL-SATV'] },
      saturnComponents,
    ),
  )
})

test('Inspector truth fails closed when the canonical truth label is missing', () => {
  const malformed = {
    ...assetManifest,
    assets: assetManifest.assets.map((asset) =>
      asset.assetId === saturnManifest.assetId ? { ...asset, truthLabel: '' } : asset,
    ),
  }
  assert.throws(() =>
    resolveSaturnVInspectorTruth(
      saturnManifest.assetId,
      malformed,
      saturnManifest,
      saturnComponents,
    ),
  )
})

test('Inspector truth fails closed when no component binding exists', () => {
  assert.throws(() =>
    resolveSaturnVInspectorTruth(saturnManifest.assetId, assetManifest, saturnManifest, []),
  )
})
