// scripts/inspect-stls.ts
// STL inspection script — verifies all stlParts in the source manifest.
// Reads binary STL files, computes triangle count, bounds, SHA-256, and
// checks them against the manifest's stlParts entries.
//
// Spec ref: §30, §43 — model assets must be inspected and verified.
// This script validates the Saturn V Printing Kit STL parts listed in
// the source manifest under NASA-MODEL-SATV-STL.stlParts.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

interface StlPart {
  name: string
  bytes: number
  sha256: string
  triangles: number
  bounds: { min: number[]; max: number[] }
  units: string
  csmRelevance: string
}

interface ManifestSource {
  id: string
  kind: string
  localPath?: string
  extractedTo?: string
  stlParts?: StlPart[]
}

interface Manifest {
  sources: ManifestSource[]
}

interface StlHeader {
  header: string // 80-byte header
  triangleCount: number // uint32 LE at offset 80
}

function readStlHeader(buf: Buffer): StlHeader {
  if (buf.length < 84) {
    throw new Error(`File too small for STL header: ${buf.length} bytes (need >= 84)`)
  }
  const header = buf.subarray(0, 80).toString('latin1').replace(/\0/g, '').trim()
  const triangleCount = buf.readUInt32LE(80)
  return { header, triangleCount }
}

function computeStlBounds(buf: Buffer, triangleCount: number): { min: number[]; max: number[] } {
  // Each triangle: 50 bytes (12 bytes normal + 3 * 12 bytes vertices + 2 bytes attribute)
  // Vertices start at offset 84 + 12 (normal) = 96, then every 50 bytes
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  const triangleOffset = 84 // start of first triangle
  const triangleSize = 50 // bytes per triangle

  for (let i = 0; i < triangleCount; i++) {
    const base = triangleOffset + i * triangleSize + 12 // skip normal (12 bytes)
    for (let v = 0; v < 3; v++) {
      const vbase = base + v * 12
      const x = buf.readFloatLE(vbase)
      const y = buf.readFloatLE(vbase + 4)
      const z = buf.readFloatLE(vbase + 8)
      if (x < min[0]) min[0] = x
      if (y < min[1]) min[1] = y
      if (z < min[2]) min[2] = z
      if (x > max[0]) max[0] = x
      if (y > max[1]) max[1] = y
      if (z > max[2]) max[2] = z
    }
  }
  return { min, max }
}

function validateStlParts(): number {
  const manifestPath = resolve(ROOT, 'src/missions/apollo11/source-manifest.json')
  if (!existsSync(manifestPath)) {
    console.log(`[FAIL] Manifest not found: ${manifestPath}`)
    return 1
  }

  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const stlSource = manifest.sources.find((s) => s.id === 'NASA-MODEL-SATV-STL')
  if (!stlSource) {
    console.log('[FAIL] NASA-MODEL-SATV-STL source not found in manifest')
    return 1
  }

  if (!stlSource.stlParts || stlSource.stlParts.length === 0) {
    console.log('[FAIL] NASA-MODEL-SATV-STL has no stlParts in manifest')
    return 1
  }

  const extractedDir = stlSource.extractedTo
    ? resolve(ROOT, stlSource.extractedTo)
    : resolve(ROOT, 'assets/raw/NASA-MODEL-SATV-STL-extracted')

  if (!existsSync(extractedDir)) {
    console.log(`[FAIL] Extracted directory not found: ${extractedDir}`)
    return 1
  }

  let errors = 0
  const manifestFileNames = new Set<string>()
  const diskFileNames = new Set<string>()

  console.log('=== STL Inspection — Saturn V Printing Kit ===')
  console.log(`Manifest: ${manifestPath}`)
  console.log(`Extracted dir: ${extractedDir}`)
  console.log(`Manifest stlParts count: ${stlSource.stlParts.length}`)
  console.log()

  // Check each manifest stlPart against disk
  for (const part of stlSource.stlParts) {
    const absPath = join(extractedDir, part.name)
    manifestFileNames.add(part.name)

    if (!existsSync(absPath)) {
      console.log(`[FAIL] ${part.name}: file missing at ${absPath}`)
      errors++
      continue
    }

    const stat = statSync(absPath)
    const buf = readFileSync(absPath)

    // Check file size
    if (stat.size !== part.bytes) {
      console.log(
        `[FAIL] ${part.name}: size mismatch — manifest ${part.bytes} vs disk ${stat.size}`,
      )
      errors++
      continue
    }

    // Check SHA-256
    const actualHash = createHash('sha256').update(buf).digest('hex')
    if (actualHash !== part.sha256) {
      console.log(
        `[FAIL] ${part.name}: SHA-256 mismatch — manifest ${part.sha256} vs disk ${actualHash}`,
      )
      errors++
      continue
    }

    // Read STL header and triangle count
    let header: StlHeader
    try {
      header = readStlHeader(buf)
    } catch (e) {
      console.log(`[FAIL] ${part.name}: cannot read STL header — ${(e as Error).message}`)
      errors++
      continue
    }

    // Check triangle count
    if (header.triangleCount !== part.triangles) {
      console.log(
        `[FAIL] ${part.name}: triangle count mismatch — manifest ${part.triangles} vs disk ${header.triangleCount}`,
      )
      errors++
      continue
    }

    // Compute bounds and check against manifest
    const bounds = computeStlBounds(buf, header.triangleCount)
    for (let i = 0; i < 3; i++) {
      if (Math.abs(bounds.min[i] - part.bounds.min[i]) > 0.01) {
        console.log(
          `[FAIL] ${part.name}: bounds.min[${i}] mismatch — manifest ${part.bounds.min[i]} vs disk ${bounds.min[i]}`,
        )
        errors++
      }
      if (Math.abs(bounds.max[i] - part.bounds.max[i]) > 0.01) {
        console.log(
          `[FAIL] ${part.name}: bounds.max[${i}] mismatch — manifest ${part.bounds.max[i]} vs disk ${bounds.max[i]}`,
        )
        errors++
      }
    }

    // Expected file size: 84 + 50 * triangleCount
    const expectedSize = 84 + 50 * part.triangles
    if (stat.size !== expectedSize) {
      console.log(
        `[WARN] ${part.name}: file size ${stat.size} != expected ${expectedSize} (84 + 50 * ${part.triangles})`,
      )
    }

    console.log(
      `[OK]   ${part.name}: tris=${part.triangles.toLocaleString()} size=${stat.size.toLocaleString()} bounds=[${bounds.min.map((n) => n.toFixed(2)).join(', ')}] to [${bounds.max.map((n) => n.toFixed(2)).join(', ')}] csm=${part.csmRelevance}`,
    )
  }

  // Check for files on disk not in manifest
  const diskFiles = readdirSync(extractedDir).filter((f) => f.toLowerCase().endsWith('.stl'))
  for (const f of diskFiles) {
    diskFileNames.add(f)
    if (!manifestFileNames.has(f)) {
      console.log(`[FAIL] ${f}: file on disk but not in manifest stlParts`)
      errors++
    }
  }

  // Check for manifest entries not on disk
  for (const name of manifestFileNames) {
    if (!diskFileNames.has(name)) {
      console.log(`[FAIL] ${name}: in manifest but not on disk`)
      errors++
    }
  }

  console.log()
  if (errors > 0) {
    console.log(`FAIL: ${errors} problem(s)`)
    return 1
  }
  console.log(
    `PASS: all ${stlSource.stlParts.length} stlParts verified (size, SHA-256, triangle count, bounds)`,
  )
  return 0
}

const exitCode = validateStlParts()
process.exit(exitCode)
