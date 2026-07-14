import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const ROOT = resolve(import.meta.dirname, '../..')
interface LodRecord {
  path: string
  bytes: number
  sha256: string
  triangles: number
}
interface ModelAsset {
  assetId: string
  kind: 'model'
  sourceIds: string[]
  truthLabel: string
  nodeManifest: string
  lods: Record<'high' | 'medium' | 'low', LodRecord>
}
interface TextureVariant {
  path: string
  bytes: number
  sha256: string
  width: number
  height: number
}
interface TextureAsset {
  assetId: string
  kind: 'texture'
  sourceIds: string[]
  truthLabel: string
  variants: Record<'1k' | '2k' | '4k', TextureVariant>
}
interface FallbackAsset {
  assetId: string
  kind: 'fallback'
  sourceIds?: string[]
  path: string
  sha256: string
}
type Asset = ModelAsset | TextureAsset | FallbackAsset

const manifest = JSON.parse(
  readFileSync(resolve(ROOT, 'src/missions/apollo11/asset-manifest.json'), 'utf8'),
) as {
  manifestVersion: number
  status: string
  truthBoundary: string
  assets: Asset[]
  offlineDecoders: Array<{ path: string; sha256: string }>
}
const sources = JSON.parse(
  readFileSync(resolve(ROOT, 'src/missions/apollo11/source-manifest.json'), 'utf8'),
)
const sourceIds = new Set(sources.sources.map((source: { id: string }) => source.id))

function hash(path: string): string {
  return createHash('sha256')
    .update(readFileSync(resolve(ROOT, path)))
    .digest('hex')
}

test('Phase 3 asset manifest is versioned and truth-bounded', () => {
  assert.equal(manifest.manifestVersion, 1)
  assert.equal(manifest.status, 'phase3-complete')
  assert.match(manifest.truthBoundary, /not flight CAD/i)
  assert.match(manifest.truthBoundary, /modern imagery-based composites/i)
})

test('every Asset Manifest source ID resolves to the frozen Source Manifest', () => {
  for (const asset of manifest.assets) {
    for (const sourceId of asset.sourceIds ?? []) assert.ok(sourceIds.has(sourceId), sourceId)
  }
})

test('all three vehicle assets have monotone high/medium/low LODs', () => {
  for (const asset of manifest.assets.filter(
    (entry): entry is ModelAsset => entry.kind === 'model',
  )) {
    assert.ok(asset.lods.high.triangles > asset.lods.medium.triangles)
    assert.ok(asset.lods.medium.triangles > asset.lods.low.triangles)
    assert.ok(asset.lods.high.bytes > asset.lods.medium.bytes)
    assert.ok(asset.lods.medium.bytes > asset.lods.low.bytes)
  }
})

test('model LOD files match declared hashes and byte lengths', () => {
  for (const asset of manifest.assets.filter(
    (entry): entry is ModelAsset => entry.kind === 'model',
  )) {
    for (const lod of Object.values(asset.lods)) {
      assert.equal(statSync(resolve(ROOT, lod.path)).size, lod.bytes)
      assert.equal(hash(lod.path), lod.sha256)
    }
  }
})

test('Earth and Moon have 1K, 2K and 4K KTX2 variants', () => {
  for (const asset of manifest.assets.filter(
    (entry): entry is TextureAsset => entry.kind === 'texture',
  )) {
    assert.deepEqual(Object.keys(asset.variants), ['1k', '2k', '4k'])
    assert.deepEqual(
      Object.values(asset.variants).map((variant) => [variant.width, variant.height]),
      [
        [1024, 512],
        [2048, 1024],
        [4096, 2048],
      ],
    )
    assert.match(asset.truthLabel, /NASA IMAGERY-BASED TEXTURE/)
  }
})

test('CSM remains explicitly reconstructed and never claims NASA CAD', () => {
  const csm = manifest.assets.find(
    (asset): asset is ModelAsset => asset.assetId === 'apollo11-command-service-module',
  )!
  assert.match(csm.truthLabel, /RECONSTRUCTED FROM NASA REFERENCES/)
  assert.doesNotMatch(csm.truthLabel, /^NASA CAD$/)
  const nodes = JSON.parse(readFileSync(resolve(ROOT, csm.nodeManifest), 'utf8'))
  assert.match(nodes.geometryTruth, /NOT NASA CAD/)
  assert.ok(nodes.knownOmissions.length >= 4)
})

test('Node Manifests expose the required mission-level semantic components', () => {
  const required = new Set([
    'launchVehicle.sic',
    'launchVehicle.sii',
    'launchVehicle.sivb',
    'lunarModule.descentStage',
    'lunarModule.ascentStage',
    'spacecraft.commandModule',
    'spacecraft.serviceModule',
  ])
  for (const asset of manifest.assets.filter(
    (entry): entry is ModelAsset => entry.kind === 'model',
  )) {
    const nodes = JSON.parse(readFileSync(resolve(ROOT, asset.nodeManifest), 'utf8'))
    for (const id of Object.keys(nodes.nodes)) required.delete(id)
    assert.ok(
      Object.values(nodes.anchors as Record<string, { required: boolean }>).every(
        (anchor) => anchor.required === true,
      ),
    )
  }
  assert.deepEqual([...required], [])
})

test('offline decoder and static fallback artifacts are local and hash-verified', () => {
  for (const decoder of manifest.offlineDecoders) {
    assert.ok(existsSync(resolve(ROOT, decoder.path)))
    assert.equal(hash(decoder.path), decoder.sha256)
  }
  const fallback = manifest.assets.find(
    (asset): asset is FallbackAsset => asset.kind === 'fallback',
  )!
  assert.ok(existsSync(resolve(ROOT, fallback.path)))
  assert.equal(hash(fallback.path), fallback.sha256)
})
