// scripts/inspect-glb.ts
// Phase 0 GLB inspection: node tree, bounds, triangle count, materials, textures.
// Usage: node --experimental-strip-types scripts/inspect-glb.ts <path-to-glb>
//
// Spec ref: APOLLO_11_PRODUCTION_SPEC §30, §32 — every NASA GLB must be inspected
// for nodes, units, bounds, materials, and detachability before adoption.

import { readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { NodeIO, Document, Node, Primitive } from '@gltf-transform/core'
import { getBounds, getMeshVertexCount, VertexCountMethod } from '@gltf-transform/functions'
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

interface NodeReport {
  name: string
  path: string
  depth: number
  hasMesh: boolean
  hasTransform: boolean
  worldBounds?: { min: number[]; max: number[] }
  triangleCount?: number
  vertexCount?: number
  primitiveCount?: number
  materialNames?: string[]
  isRoot: boolean
  childCount: number
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`
  return `${(n / 1024 / 1024).toFixed(2)} MiB`
}

function vec3ToString(v: number[] | undefined): string {
  if (!v) return 'n/a'
  return `[${v.map((n) => n.toFixed(4)).join(', ')}]`
}

function nodeHasTransform(n: Node): boolean {
  const t = n.getTranslation()
  const r = n.getRotation()
  const s = n.getScale()
  return (
    t.some((v) => Math.abs(v) > 1e-7) ||
    r.some((v, i) => Math.abs(v - [0, 0, 0, 1][i]) > 1e-7) ||
    s.some((v) => Math.abs(v - 1) > 1e-7)
  )
}

function primitiveTriangleCount(p: Primitive): number {
  const indices = p.getIndices()
  const pos = p.getAttribute('POSITION')
  if (indices) return Math.floor(indices.getCount() / 3)
  if (pos) return Math.floor(pos.getCount() / 3)
  return 0
}

function walkNode(node: Node, depth: number, path: string, reports: NodeReport[]) {
  const mesh = node.getMesh()
  const report: NodeReport = {
    name: node.getName() ?? '<anonymous>',
    path,
    depth,
    hasMesh: !!mesh,
    hasTransform: nodeHasTransform(node),
    isRoot: depth === 0,
    childCount: node.listChildren().length,
  }

  if (mesh) {
    const prims = mesh.listPrimitives()
    let triCount = 0
    let vertCount = 0
    const matNames: string[] = []
    for (const p of prims) {
      triCount += primitiveTriangleCount(p)
      const pos = p.getAttribute('POSITION')
      if (pos) vertCount += pos.getCount()
      const mat = p.getMaterial()
      if (mat) {
        const mn = mat.getName() ?? '<unnamed>'
        if (!matNames.includes(mn)) matNames.push(mn)
      }
    }
    report.triangleCount = triCount
    report.vertexCount = vertCount
    report.primitiveCount = prims.length
    report.materialNames = matNames
    try {
      const bounds = getBounds(node)
      report.worldBounds = {
        min: Array.from(bounds.min),
        max: Array.from(bounds.max),
      }
    } catch {
      // bounds may fail on incomplete meshes
    }
  }

  reports.push(report)

  const children = node.listChildren()
  for (let i = 0; i < children.length; i++) {
    const c = children[i]
    const cname = c.getName() ?? `<child-${i}>`
    walkNode(c, depth + 1, `${path}/${cname}`, reports)
  }
}

async function inspectGlb(filePath: string): Promise<void> {
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
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
    })
  const bytes = readFileSync(filePath)
  const doc: Document = await io.readBinary(bytes)

  const root = doc.getRoot()
  const scenes = root.listScenes()
  const meshes = root.listMeshes()
  const materials = root.listMaterials()
  const textures = root.listTextures()
  const skins = root.listSkins()
  const animations = root.listAnimations()
  const cameras = root.listCameras()

  let totalTris = 0
  let totalVerts = 0
  let totalPrims = 0
  for (const m of meshes) {
    for (const p of m.listPrimitives()) {
      totalTris += primitiveTriangleCount(p)
      totalPrims++
    }
    totalVerts += getMeshVertexCount(m, VertexCountMethod.RENDER)
  }

  const sceneBoundsMin = [Infinity, Infinity, Infinity]
  const sceneBoundsMax = [-Infinity, -Infinity, -Infinity]
  for (const s of scenes) {
    for (const root of s.listChildren()) {
      try {
        const b = getBounds(root)
        for (let i = 0; i < 3; i++) {
          if (b.min[i] < sceneBoundsMin[i]) sceneBoundsMin[i] = b.min[i]
          if (b.max[i] > sceneBoundsMax[i]) sceneBoundsMax[i] = b.max[i]
        }
      } catch {
        // ignore
      }
    }
  }
  if (!isFinite(sceneBoundsMin[0])) {
    sceneBoundsMin[0] = sceneBoundsMin[1] = sceneBoundsMin[2] = 0
    sceneBoundsMax[0] = sceneBoundsMax[1] = sceneBoundsMax[2] = 0
  }

  const sceneBounds = {
    min: sceneBoundsMin,
    max: sceneBoundsMax,
    size: [
      sceneBoundsMax[0] - sceneBoundsMin[0],
      sceneBoundsMax[1] - sceneBoundsMin[1],
      sceneBoundsMax[2] - sceneBoundsMin[2],
    ],
  }

  const nodeReports: NodeReport[] = []
  for (let si = 0; si < scenes.length; si++) {
    const scene = scenes[si]
    const sceneName = scene.getName() ?? `<scene-${si}>`
    const roots = scene.listChildren()
    for (let ri = 0; ri < roots.length; ri++) {
      const r = roots[ri]
      const rname = r.getName() ?? `<root-${ri}>`
      walkNode(r, 0, `/${sceneName}/${rname}`, nodeReports)
    }
  }

  const matReports = materials.map((m) => ({
    name: m.getName() ?? '<unnamed>',
    alphaMode: m.getAlphaMode(),
    doubleSided: m.getDoubleSided(),
    hasBaseColorTexture: !!m.getBaseColorTexture(),
    hasNormalTexture: !!m.getNormalTexture(),
    hasMetalRoughTexture: !!m.getMetallicRoughnessTexture(),
    hasEmissiveTexture: !!m.getEmissiveTexture(),
    baseColorFactor: m.getBaseColorFactor(),
    metallicFactor: m.getMetallicFactor(),
    roughnessFactor: m.getRoughnessFactor(),
  }))

  const texReports = textures.map((t) => {
    const image = t.getImage()
    return {
      name: t.getName() ?? '<unnamed>',
      mimeType: t.getMimeType(),
      hasImage: !!image,
      uri: t.getURI() ?? '(embedded)',
      byteLength: image ? image.byteLength : 0,
    }
  })

  const animReports = animations.map((a) => ({
    name: a.getName() ?? '<unnamed>',
    channelCount: a.listChannels().length,
  }))

  const report = {
    file: {
      name: basename(filePath),
      bytes: bytes.byteLength,
      bytesHuman: formatBytes(bytes.byteLength),
      ext: extname(filePath),
      // SHA-256 of the source GLB bytes — lets validate-models verify the
      // inspection report corresponds to the actual file on disk, not a stale
      // report from a different GLB version.
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
    summary: {
      scenes: scenes.length,
      nodes: nodeReports.length,
      meshes: meshes.length,
      primitives: totalPrims,
      triangles: totalTris,
      vertices: totalVerts,
      materials: materials.length,
      textures: textures.length,
      skins: skins.length,
      animations: animations.length,
      cameras: cameras.length,
    },
    sceneBounds,
    nodes: nodeReports,
    materials: matReports,
    textures: texReports,
    animations: animReports,
    notes: {
      heuristicUnits:
        sceneBounds.size[1] > 50
          ? 'likely-meters (Saturn V height ~110m)'
          : sceneBounds.size[1] > 1 && sceneBounds.size[1] < 20
            ? 'maybe-meters-or-scaled'
            : 'unknown-or-small-scale',
      // Strict semantic-stage detection: require whole-word match of stage identifiers,
      // not substring. Previous regex /saturn/i matched `saturnv_ca` (a Maya cam/assembly
      // name) and /lunar/i would match `lunarlander` if present — both false positives.
      // A real semantic stage node must be named e.g. "S-IC", "S-II", "S-IVB", "ascent",
      // "descent" as a distinct token, not as part of a longer identifier.
      hasSemanticSaturnStages: nodeReports.some((n) => {
        // Match S-IC / S-II / S-IVB / IU / SLA / CSM / LES / launch-escape as standalone
        // tokens (case-insensitive), surrounded by word boundaries or start/end of name.
        // Reject partial matches like "saturnv_ca", "saturnv", "apollo11".
        const name = n.name.toLowerCase()
        const tokens = name.split(/[\s_\-/.]+/).filter(Boolean)
        return tokens.some((tok) =>
          /^(s-?ic|s-?ii|s-?ivb|iu|sla|csm|les|launch-escape|escape-system)$/.test(tok),
        )
      }),
      hasSemanticLMStages: nodeReports.some((n) => {
        const name = n.name.toLowerCase()
        const tokens = name.split(/[\s_\-/.]+/).filter(Boolean)
        return tokens.some((tok) => /^(ascent|descent|stage|eagle|lunar-module)$/.test(tok))
      }),
      monotoneRoot: nodeReports.filter((n) => n.depth === 0).length,
      maxDepth: Math.max(...nodeReports.map((n) => n.depth)),
      nonIdentityTransformCount: nodeReports.filter((n) => n.hasTransform).length,
      // Record the root node name explicitly for downstream validation
      rootNames: nodeReports.filter((n) => n.depth === 0).map((n) => n.name),
    },
  }

  const outPath = resolve(
    dirname(filePath),
    basename(filePath, extname(filePath)) + '.inspection.json',
  )
  writeFileSync(outPath, JSON.stringify(report, null, 2))

  console.log('===')
  console.log(`GLB: ${report.file.name} (${report.file.bytesHuman})`)
  console.log(
    `Scenes: ${report.summary.scenes} | Nodes: ${report.summary.nodes} | Meshes: ${report.summary.meshes}`,
  )
  console.log(
    `Triangles: ${report.summary.triangles.toLocaleString()} | Vertices: ${report.summary.vertices.toLocaleString()} | Primitives: ${report.summary.primitives}`,
  )
  console.log(
    `Materials: ${report.summary.materials} | Textures: ${report.summary.textures} | Animations: ${report.summary.animations}`,
  )
  console.log(
    `Scene bounds min: ${vec3ToString(report.sceneBounds.min)} max: ${vec3ToString(report.sceneBounds.max)}`,
  )
  console.log(
    `Scene size (W x H x D): ${report.sceneBounds.size.map((n) => n.toFixed(3)).join(' x ')}`,
  )
  console.log(`Heuristic units: ${report.notes.heuristicUnits}`)
  console.log(
    `Saturn-stage-name match: ${report.notes.hasSemanticSaturnStages} | LM-stage-name match: ${report.notes.hasSemanticLMStages}`,
  )
  console.log(
    `Roots: ${report.notes.monotoneRoot} | Max depth: ${report.notes.maxDepth} | Non-identity transforms: ${report.notes.nonIdentityTransformCount}`,
  )
  console.log(`Wrote: ${outPath}`)
  console.log('===')
}

const target = process.argv[2]
if (!target) {
  console.error('Usage: node --experimental-strip-types scripts/inspect-glb.ts <glb-path>')
  process.exit(2)
}
inspectGlb(resolve(target)).catch((e) => {
  console.error(e)
  process.exit(1)
})
