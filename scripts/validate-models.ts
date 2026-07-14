// scripts/validate-models.ts
// Phase 0: verify GLB inspection reports exist, required fields are present,
// AND the report corresponds to the actual GLB on disk (not a stale report).
// Re-parses each GLB to confirm key structural counts match the report.
//
// Spec ref: §30, §32 — NASA GLBs must be inspected; the inspection must be
// verifiable and not just trust a previously-written JSON file.

import { readFileSync as fsRead, existsSync as fsExists, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash as createHashSync } from 'node:crypto'
import { NodeIO, Document } from '@gltf-transform/core'
import {
  KHRMaterialsSpecular,
  EXTTextureWebP,
  KHRMaterialsUnlit,
  KHRMaterialsTransmission,
  KHRMaterialsVolume,
  KHRMaterialsIOR,
  KHRMaterialsSheen,
  KHRMaterialsClearcoat,
  KHRMaterialsEmissiveStrength,
  KHRMaterialsAnisotropy,
  KHRMaterialsDispersion,
  KHRTextureBasisu,
  KHRTextureTransform,
  KHRDracoMeshCompression,
  KHRMeshQuantization,
} from '@gltf-transform/extensions'
import draco3d from 'draco3d'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

interface InspFile {
  name: string
  bytes: number
  sha256?: string
}
interface InspSummary {
  scenes: number
  nodes: number
  meshes: number
  triangles: number
  vertices: number
  materials: number
  textures: number
}
interface InspNotes {
  heuristicUnits?: string
  hasSemanticSaturnStages?: boolean
  hasSemanticLMStages?: boolean
  rootNames?: string[]
}
interface Insp {
  file: InspFile
  summary: InspSummary
  sceneBounds: { min: number[]; max: number[]; size: number[] }
  notes: InspNotes
}

const targets = [
  {
    glb: 'assets/raw/NASA-MODEL-SATV.glb',
    report: 'assets/raw/NASA-MODEL-SATV.inspection.json',
    id: 'NASA-MODEL-SATV',
    // Saturn V GLB: spec §30.1 + §31 require semantic S-IC/S-II/S-IVB/IU/SLA/CSM/LES
    // separation. Per Phase 0 inspection, this GLB has NO semantic stage nodes —
    // the validator MUST confirm hasSemanticSaturnStages === false so downstream
    // phases cannot accidentally trust a positive that came from `saturnv_ca` matching
    // a loose regex.
    expectSemanticSaturnStages: false,
    expectSemanticLMStages: false,
  },
  {
    glb: 'assets/raw/NASA-MODEL-LM.glb',
    report: 'assets/raw/NASA-MODEL-LM.inspection.json',
    id: 'NASA-MODEL-LM',
    expectSemanticSaturnStages: false,
    expectSemanticLMStages: false,
  },
]

async function reparseGlbCounts(absGlb: string): Promise<{
  scenes: number
  meshes: number
  materials: number
  textures: number
  animations: number
}> {
  const io = new NodeIO()
    .registerExtensions([
      KHRMaterialsSpecular,
      EXTTextureWebP,
      KHRMaterialsUnlit,
      KHRMaterialsTransmission,
      KHRMaterialsVolume,
      KHRMaterialsIOR,
      KHRMaterialsSheen,
      KHRMaterialsClearcoat,
      KHRMaterialsEmissiveStrength,
      KHRMaterialsAnisotropy,
      KHRMaterialsDispersion,
      KHRTextureBasisu,
      KHRTextureTransform,
      KHRDracoMeshCompression,
      KHRMeshQuantization,
    ])
    .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() })
  const bytes = fsRead(absGlb)
  const doc: Document = await io.readBinary(bytes)
  const root = doc.getRoot()
  return {
    scenes: root.listScenes().length,
    meshes: root.listMeshes().length,
    materials: root.listMaterials().length,
    textures: root.listTextures().length,
    animations: root.listAnimations().length,
  }
}

interface DerivedLod {
  path: string
  bytes: number
  sha256: string
  triangles: number
}

interface DerivedAsset {
  assetId: string
  kind: 'model' | 'texture' | 'fallback'
  nodeManifest?: string
  lods?: Record<string, DerivedLod>
  variants?: Record<
    string,
    { path: string; bytes: number; sha256: string; width: number; height: number }
  >
  path?: string
  bytes?: number
  sha256?: string
}

interface GltfJson {
  scene?: number
  scenes?: Array<{ name?: string; nodes?: number[] }>
  nodes?: Array<{ name?: string; children?: number[] }>
  animations?: unknown[]
  extensionsRequired?: string[]
}

interface SemanticPathRecord {
  path: string
  required: boolean
}

interface NodeManifest {
  units: string
  coordinateSystem?: { up?: string }
  derived?: Record<string, { sha256: string }>
  nodes: Record<string, SemanticPathRecord>
  anchors: Record<string, SemanticPathRecord>
}

function sha256Of(abs: string): string {
  return createHashSync('sha256').update(fsRead(abs)).digest('hex')
}

function glbJson(abs: string): GltfJson {
  const bytes = fsRead(abs)
  if (bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error('missing glTF magic')
  const jsonLength = bytes.readUInt32LE(12)
  const jsonType = bytes.toString('ascii', 16, 20)
  if (jsonType !== 'JSON') throw new Error('first GLB chunk is not JSON')
  return JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).trimEnd()) as GltfJson
}

function nodePaths(json: GltfJson): Set<string> {
  const result = new Set<string>()
  const scene = json.scenes?.[json.scene ?? 0]
  const sceneName = scene?.name || 'Scene'
  const visit = (index: number, parent: string) => {
    const node = json.nodes?.[index]
    if (!node) return
    const path = `${parent}/${node.name || `<node-${index}>`}`
    result.add(path)
    for (const child of node.children || []) visit(child, path)
  }
  for (const root of scene?.nodes || []) visit(root, `/${sceneName}`)
  return result
}

async function derivedTriangleCount(abs: string): Promise<number> {
  const io = new NodeIO()
    .registerExtensions([
      KHRMaterialsSpecular,
      EXTTextureWebP,
      KHRMaterialsUnlit,
      KHRMaterialsTransmission,
      KHRMaterialsVolume,
      KHRMaterialsIOR,
      KHRMaterialsSheen,
      KHRMaterialsClearcoat,
      KHRMaterialsEmissiveStrength,
      KHRMaterialsAnisotropy,
      KHRMaterialsDispersion,
      KHRTextureBasisu,
      KHRTextureTransform,
      KHRDracoMeshCompression,
      KHRMeshQuantization,
    ])
    .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() })
  const doc = await io.readBinary(fsRead(abs))
  let triangles = 0
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const indices = primitive.getIndices()
      const position = primitive.getAttribute('POSITION')
      triangles += Math.floor((indices?.getCount() ?? position?.getCount() ?? 0) / 3)
    }
  }
  return triangles
}

async function validatePhase3Assets(): Promise<number> {
  let errors = 0
  const fail = (message: string) => {
    console.log(`[FAIL]  Phase 3: ${message}`)
    errors++
  }
  const ok = (message: string) => console.log(`[OK]    Phase 3: ${message}`)
  const manifestPath = resolve(ROOT, 'src/missions/apollo11/asset-manifest.json')
  if (!fsExists(manifestPath)) {
    fail('asset-manifest.json missing')
    return errors
  }
  const manifest = JSON.parse(fsRead(manifestPath, 'utf8')) as {
    manifestVersion: number
    status: string
    assets: DerivedAsset[]
    offlineDecoders: Array<{ id: string; path: string; bytes: number; sha256: string }>
  }
  if (manifest.manifestVersion !== 1 || manifest.status !== 'phase3-complete') {
    fail('asset manifest is not the version 1 Phase 3 manifest')
  }

  for (const asset of manifest.assets) {
    if (asset.kind === 'model') {
      if (!asset.lods || !asset.nodeManifest) {
        fail(`${asset.assetId}: model lacks LODs or Node Manifest`)
        continue
      }
      const nodeManifestAbs = resolve(ROOT, asset.nodeManifest)
      if (!fsExists(nodeManifestAbs)) {
        fail(`${asset.assetId}: Node Manifest missing`)
        continue
      }
      const nodes = JSON.parse(fsRead(nodeManifestAbs, 'utf8')) as NodeManifest
      if (nodes.units !== 'meter' || nodes.coordinateSystem?.up !== '+Y') {
        fail(`${asset.assetId}: Node Manifest is not meter / +Y normalized`)
      }
      let highPaths: Set<string> | undefined
      for (const lodName of ['high', 'medium', 'low']) {
        const lod = asset.lods[lodName]
        if (!lod) {
          fail(`${asset.assetId}: missing ${lodName} LOD`)
          continue
        }
        const abs = resolve(ROOT, lod.path)
        if (!fsExists(abs)) {
          fail(`${asset.assetId}/${lodName}: file missing`)
          continue
        }
        if (statSync(abs).size !== lod.bytes || sha256Of(abs) !== lod.sha256) {
          fail(`${asset.assetId}/${lodName}: byte length or SHA-256 mismatch`)
          continue
        }
        const json = glbJson(abs)
        if (!(json.extensionsRequired || []).includes('KHR_draco_mesh_compression')) {
          fail(`${asset.assetId}/${lodName}: Draco is not required by the GLB`)
        }
        if ((json.animations || []).length !== 0) {
          fail(`${asset.assetId}/${lodName}: source animation tracks were not stripped`)
        }
        const actualTriangles = await derivedTriangleCount(abs)
        if (actualTriangles !== lod.triangles) {
          fail(
            `${asset.assetId}/${lodName}: triangles ${actualTriangles} != manifest ${lod.triangles}`,
          )
        }
        if (nodes.derived?.[lodName]?.sha256 !== lod.sha256) {
          fail(`${asset.assetId}/${lodName}: Node Manifest derived hash mismatch`)
        }
        if (lodName === 'high') highPaths = nodePaths(json)
      }
      if (highPaths) {
        for (const [id, record] of Object.entries({ ...nodes.nodes, ...nodes.anchors })) {
          if (record.required && !highPaths.has(record.path)) {
            fail(`${asset.assetId}: required semantic path '${id}' missing: ${record.path}`)
          }
        }
      }
      const highTris = asset.lods.high?.triangles ?? Infinity
      const lowTris = asset.lods.low?.triangles ?? Infinity
      if (highTris > 400_000 || lowTris > 120_000)
        fail(`${asset.assetId}: LOD triangle budget exceeded`)
      else ok(`${asset.assetId}: 3 LODs, hashes, Draco and required semantic paths verified`)
    } else if (asset.kind === 'texture') {
      for (const level of ['1k', '2k', '4k']) {
        const variant = asset.variants?.[level]
        if (!variant) {
          fail(`${asset.assetId}: missing ${level} texture variant`)
          continue
        }
        const abs = resolve(ROOT, variant.path)
        if (!fsExists(abs)) {
          fail(`${asset.assetId}/${level}: texture missing`)
          continue
        }
        const magic = fsRead(abs).subarray(0, 12).toString('hex')
        if (magic !== 'ab4b5458203230bb0d0a1a0a')
          fail(`${asset.assetId}/${level}: invalid KTX2 magic`)
        if (statSync(abs).size !== variant.bytes || sha256Of(abs) !== variant.sha256) {
          fail(`${asset.assetId}/${level}: byte length or SHA-256 mismatch`)
        }
      }
      ok(`${asset.assetId}: 1K/2K/4K KTX2 variants verified`)
    } else if (asset.kind === 'fallback' && asset.path && asset.sha256 && asset.bytes) {
      const abs = resolve(ROOT, asset.path)
      if (!fsExists(abs) || statSync(abs).size !== asset.bytes || sha256Of(abs) !== asset.sha256) {
        fail(`${asset.assetId}: fallback missing or hash mismatch`)
      } else ok(`${asset.assetId}: static fallback verified`)
    }
  }

  for (const decoder of manifest.offlineDecoders || []) {
    const abs = resolve(ROOT, decoder.path)
    if (
      !fsExists(abs) ||
      statSync(abs).size !== decoder.bytes ||
      sha256Of(abs) !== decoder.sha256
    ) {
      fail(`${decoder.id}: offline decoder missing or hash mismatch`)
    }
  }
  if (manifest.offlineDecoders?.length === 4) ok('four pinned local decoder artifacts verified')
  else fail('offline decoder manifest must contain four artifacts')
  return errors
}

async function main() {
  let errors = 0
  console.log('=== Model Inspection Validation ===')

  for (const t of targets) {
    const glbAbs = resolve(ROOT, t.glb)
    const reportAbs = resolve(ROOT, t.report)

    // 1. GLB exists on disk
    if (!fsExists(glbAbs)) {
      console.log(`[FAIL]  ${t.id}: GLB missing at ${t.glb}`)
      errors++
      continue
    }
    // 2. Inspection report exists
    if (!fsExists(reportAbs)) {
      console.log(`[FAIL]  ${t.id}: inspection report missing at ${t.report}`)
      errors++
      continue
    }
    // 3. Parse report JSON
    let data: Insp
    try {
      data = JSON.parse(fsRead(reportAbs, 'utf8'))
    } catch (e) {
      console.log(`[FAIL]  ${t.id}: inspection report is invalid JSON — ${(e as Error).message}`)
      errors++
      continue
    }
    // 4. Required fields present
    const fieldChecks: Array<[string, boolean]> = [
      ['file.name', typeof data.file?.name === 'string'],
      ['file.bytes', typeof data.file?.bytes === 'number'],
      ['file.sha256', typeof data.file?.sha256 === 'string'],
      ['summary.scenes', typeof data.summary?.scenes === 'number'],
      ['summary.triangles', typeof data.summary?.triangles === 'number'],
      ['summary.materials', typeof data.summary?.materials === 'number'],
      [
        'sceneBounds.size',
        Array.isArray(data.sceneBounds?.size) && data.sceneBounds.size.length === 3,
      ],
      ['notes.heuristicUnits', typeof data.notes?.heuristicUnits === 'string'],
      ['notes.hasSemanticSaturnStages', typeof data.notes?.hasSemanticSaturnStages === 'boolean'],
      ['notes.hasSemanticLMStages', typeof data.notes?.hasSemanticLMStages === 'boolean'],
    ]
    let fieldOk = true
    for (const [name, pass] of fieldChecks) {
      if (!pass) {
        console.log(`[FAIL]  ${t.id}: missing/invalid ${name}`)
        fieldOk = false
        errors++
      }
    }
    if (!fieldOk) continue

    // 5. File on disk matches reported size
    const diskSize = statSync(glbAbs).size
    if (diskSize !== data.file.bytes) {
      console.log(
        `[FAIL]  ${t.id}: GLB size mismatch — report ${data.file.bytes} vs disk ${diskSize}`,
      )
      errors++
      continue
    }

    // 6. SHA-256 of GLB on disk matches report's file.sha256
    const diskBytes = fsRead(glbAbs)
    const diskHash = createHashSync('sha256').update(diskBytes).digest('hex')
    if (diskHash !== data.file.sha256) {
      console.log(
        `[FAIL]  ${t.id}: GLB hash mismatch — report ${data.file.sha256} vs disk ${diskHash}`,
      )
      errors++
      continue
    }

    // 7. Re-parse GLB and confirm structural counts match report
    let reparsed: {
      scenes: number
      meshes: number
      materials: number
      textures: number
      animations: number
    }
    try {
      reparsed = await reparseGlbCounts(glbAbs)
    } catch (e) {
      console.log(`[FAIL]  ${t.id}: GLB re-parse failed — ${(e as Error).message}`)
      errors++
      continue
    }
    const countChecks: Array<[string, number, number]> = [
      ['scenes', reparsed.scenes, data.summary.scenes],
      ['meshes', reparsed.meshes, data.summary.meshes],
      ['materials', reparsed.materials, data.summary.materials],
      ['textures', reparsed.textures, data.summary.textures],
    ]
    let countOk = true
    for (const [label, actual, reported] of countChecks) {
      if (actual !== reported) {
        console.log(
          `[FAIL]  ${t.id}: ${label} count mismatch — re-parsed ${actual} vs report ${reported}`,
        )
        countOk = false
        errors++
      }
    }
    if (!countOk) continue

    // 8. Semantic-stage expectation check
    // SATV and LM GLBs are known to have NO semantic stage naming (R-003 / R-004).
    // If the report claims hasSemanticSaturnStages === true, the inspection script
    // has a false positive (e.g. matching `saturnv_ca` via a loose regex) and the
    // report is invalid.
    if (t.expectSemanticSaturnStages === false && data.notes.hasSemanticSaturnStages === true) {
      console.log(
        `[FAIL]  ${t.id}: report claims hasSemanticSaturnStages=true but this GLB has no semantic stage nodes (false positive). Root names: ${(data.notes.rootNames || []).join(', ')}`,
      )
      errors++
      continue
    }
    if (t.expectSemanticLMStages === false && data.notes.hasSemanticLMStages === true) {
      console.log(
        `[FAIL]  ${t.id}: report claims hasSemanticLMStages=true but this GLB has no semantic stage nodes (false positive). Root names: ${(data.notes.rootNames || []).join(', ')}`,
      )
      errors++
      continue
    }

    // 9. Print PASS summary
    console.log(
      `[OK]    ${t.id}: hash=${data.file.sha256.slice(0, 12)}… tris=${data.summary.triangles.toLocaleString()} verts=${data.summary.vertices.toLocaleString()} mats=${data.summary.materials} size=${data.sceneBounds.size.map((n) => n.toFixed(2)).join('x')} units=${data.notes.heuristicUnits} semSat=${data.notes.hasSemanticSaturnStages} semLM=${data.notes.hasSemanticLMStages}`,
    )
  }

  errors += await validatePhase3Assets()

  if (errors > 0) {
    console.log(`\nFAIL: ${errors} problem(s)`)
    process.exit(1)
  }
  console.log('\nPASS: GLB inspection reports valid and correspond to disk files')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
