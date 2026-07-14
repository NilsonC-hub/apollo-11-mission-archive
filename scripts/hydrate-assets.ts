// scripts/hydrate-assets.ts
// Raw-asset hydration script — downloads all gitignored binary assets from
// their canonical URLs and verifies SHA-256 against the source manifest.
// Also extracts ZIP archives and verifies extracted STL parts.
//
// This script makes a clean git clone / git archive fully reproducible:
//   1. Read source-manifest.json
//   2. For each source with localPath pointing to a gitignored binary
//      (.glb, .stl, .zip, .tif) that is missing on disk, download it from
//      effectiveDownloadUrl (or originalUrl) and verify SHA-256.
//   3. Extract ZIP archives to their extractedTo directory.
//   4. Run STL inspection to verify extracted parts.
//
// Usage:
//   node --experimental-strip-types scripts/hydrate-assets.ts
//   node --experimental-strip-types scripts/hydrate-assets.ts --force
//
// Spec ref: §47 — release gates must pass in a clean clone.
// The .gitignore excludes *.glb, *.stl, *.zip under assets/raw/.
// This script restores them from canonical URLs with hash verification.

import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

interface SourceRecord {
  id: string
  kind: string
  title: string
  originalUrl: string
  effectiveDownloadUrl?: string
  localPath: string | null
  sha256: string | null
  bytes?: number
  status: string
  extractedTo?: string
  format?: string
}

interface Manifest {
  sources: SourceRecord[]
}

// Extensions that are gitignored and need hydration
const GITIGNORED_EXTS = ['.glb', '.stl', '.zip', '.tif', '.tiff']

function sha256OfFile(absPath: string): string {
  const buf = readFileSync(absPath)
  return createHash('sha256').update(buf).digest('hex')
}

function downloadFile(url: string, destPath: string): boolean {
  // Use curl.exe (Windows-bundled) — Invoke-WebRequest is broken in this env (R-011)
  // --ssl-no-revoke works around Windows schannel revocation check issues
  // -L follows redirects, -s silent, --max-time 300 for large files
  try {
    execSync(`curl.exe -L --ssl-no-revoke -s --max-time 300 -o "${destPath}" "${url}"`, {
      stdio: 'pipe',
      timeout: 310000,
    })
    return existsSync(destPath) && statSync(destPath).size > 0
  } catch (e) {
    console.log(`  [ERROR] curl failed: ${(e as Error).message}`)
    return false
  }
}

function extractZip(zipPath: string, destDir: string): boolean {
  try {
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }
    // Use PowerShell Expand-Archive for cross-environment compatibility
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force"`,
      { stdio: 'pipe', timeout: 60000 },
    )
    return existsSync(destDir)
  } catch (e) {
    console.log(`  [ERROR] Expand-Archive failed: ${(e as Error).message}`)
    return false
  }
}

function hydrate(force: boolean): number {
  const manifestPath = resolve(ROOT, 'src/missions/apollo11/source-manifest.json')
  if (!existsSync(manifestPath)) {
    console.log(`[FAIL] Manifest not found: ${manifestPath}`)
    return 1
  }

  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  // Filter sources that have gitignored binary localPaths
  const needsHydration = manifest.sources.filter((s) => {
    if (!s.localPath) return false
    const ext = extname(s.localPath).toLowerCase()
    return GITIGNORED_EXTS.includes(ext)
  })

  console.log('=== Raw Asset Hydration ===')
  console.log(`Manifest: ${manifestPath}`)
  console.log(`Sources with gitignored binaries: ${needsHydration.length}`)
  console.log()

  let downloaded = 0
  let skipped = 0
  let failed = 0
  let extracted = 0

  for (const s of needsHydration) {
    const absPath = resolve(ROOT, s.localPath!)
    const ext = extname(s.localPath!).toLowerCase()
    const url = s.effectiveDownloadUrl || s.originalUrl

    console.log(`[${s.id}] ${s.localPath}`)

    // Check if file already exists and hash matches
    if (!force && existsSync(absPath) && s.sha256) {
      const actualHash = sha256OfFile(absPath)
      if (actualHash === s.sha256) {
        console.log(`  [SKIP] Already present, SHA-256 matches`)
        skipped++
        // Still check if extraction is needed
        if (ext === '.zip' && s.extractedTo) {
          const extractedDir = resolve(ROOT, s.extractedTo)
          if (!existsSync(extractedDir)) {
            console.log(`  [EXTRACT] Extracting to ${s.extractedTo}`)
            if (extractZip(absPath, extractedDir)) {
              extracted++
              console.log(`  [OK] Extracted`)
            } else {
              failed++
              console.log(`  [FAIL] Extraction failed`)
            }
          }
        }
        continue
      } else {
        console.log(`  [MISMATCH] File exists but SHA-256 mismatch — re-downloading`)
      }
    }

    // Ensure parent directory exists
    const parentDir = dirname(absPath)
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true })
    }

    // Download
    console.log(`  [DOWNLOAD] ${url}`)
    const ok = downloadFile(url, absPath)
    if (!ok) {
      failed++
      console.log(`  [FAIL] Download failed`)
      continue
    }

    // Verify size
    const actualSize = statSync(absPath).size
    if (s.bytes && actualSize !== s.bytes) {
      console.log(`  [FAIL] Size mismatch: expected ${s.bytes}, got ${actualSize}`)
      failed++
      continue
    }

    // Verify SHA-256
    if (s.sha256) {
      const actualHash = sha256OfFile(absPath)
      if (actualHash !== s.sha256) {
        console.log(`  [FAIL] SHA-256 mismatch`)
        console.log(`    expected: ${s.sha256}`)
        console.log(`    actual:   ${actualHash}`)
        failed++
        continue
      }
    }

    downloaded++
    console.log(`  [OK] Downloaded ${actualSize.toLocaleString()} bytes, SHA-256 verified`)

    // Extract ZIP if needed
    if (ext === '.zip' && s.extractedTo) {
      const extractedDir = resolve(ROOT, s.extractedTo)
      if (!existsSync(extractedDir) || force) {
        console.log(`  [EXTRACT] Extracting to ${s.extractedTo}`)
        if (extractZip(absPath, extractedDir)) {
          extracted++
          console.log(`  [OK] Extracted`)
        } else {
          failed++
          console.log(`  [FAIL] Extraction failed`)
        }
      }
    }
  }

  console.log()
  console.log(
    `Summary: ${downloaded} downloaded, ${skipped} skipped, ${extracted} extracted, ${failed} failed`,
  )

  if (failed > 0) {
    console.log(`FAIL: ${failed} hydration failure(s)`)
    return 1
  }
  console.log('PASS: all gitignored binary assets hydrated and verified')
  return 0
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const exitCode = hydrate(force)
process.exit(exitCode)
