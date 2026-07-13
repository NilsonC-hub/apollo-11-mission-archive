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
