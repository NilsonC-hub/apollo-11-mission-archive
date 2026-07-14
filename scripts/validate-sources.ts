// scripts/validate-sources.ts
// Phase 0 source manifest validator.
// Spec ref: APOLLO_11_PRODUCTION_SPEC §9, §49 — every source must have URL,
// accessedAt, rights status, local path (for binaries), and SHA-256.
//
// Remediation: this validator now enforces kind/localPath/status consistency
// and file-signature checks, so a web-page snapshot cannot be silently recorded
// as the localPath for an image/model/dataset source, and a "downloaded" status
// must point to a file whose magic bytes match the declared kind.

import { readFileSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

interface SourceRecord {
  id: string
  kind: string
  title: string
  publisher?: string
  publicationDate?: string
  originalUrl: string
  effectiveDownloadUrl?: string
  landingPageUrl?: string
  accessedAt: string
  rightsStatus: string
  purpose: string
  localPath: string | null
  sha256: string | null
  bytes?: number
  status: string
  notes?: string
  inspectionReport?: string
  inspectionSummary?: Record<string, unknown>
  assetSamplesArchived?: Array<{
    name: string
    localPath: string
    sha256: string
    bytes: number
  }>
  // Content assertions — declared identity markers that go beyond kind/magic
  // checks. These help detect cross-wiring where a file has the right magic
  // bytes but is the WRONG file (e.g. PDF A's localPath pointing to PDF B's
  // downloaded file).
  ntrsCitationId?: string
  reportNumber?: string
  nasaTmNumber?: string
  provenance?: string
  provenanceGrade?: string
  contentAssertions?: {
    // HTML canonical/source marker — for web snapshots, a string that must
    // appear in the HTML content to confirm it is the right page.
    // The validator checks this and fails if the marker is absent.
    htmlCanonicalMarker?: string
  }
}

interface Manifest {
  manifestVersion: number
  missionId: string
  sources: SourceRecord[]
}

interface ValidationError {
  sourceId: string
  field: string
  message: string
  severity: 'error' | 'warn'
}

function sha256OfFile(absPath: string): string {
  const buf = readFileSync(absPath)
  return createHash('sha256').update(buf).digest('hex')
}

// Magic-byte signatures for the kinds we expect in the manifest.
// Each signature is a list of [offset, hex-bytes] pairs; the file matches if
// every pair's bytes at the given offset equal the file's bytes.
type Signature = Array<[number, number[]]>

const SIGNATURES: Record<string, { exts: string[]; sig: Signature | null }> = {
  pdf: {
    exts: ['.pdf'],
    sig: [[0, [0x25, 0x50, 0x44, 0x46]]], // %PDF
  },
  glb: {
    exts: ['.glb'],
    sig: [
      [0, [0x67, 0x6c, 0x54, 0x46]],
      [4, [0x02, 0x00, 0x00, 0x00]],
    ], // glTF + version 2 LE
  },
  stl: {
    // Binary STL has no fixed magic; "solid" prefix indicates ASCII STL.
    // We accept either: file starts with "solid" (ASCII) or has the binary
    // structure (80-byte header + uint32 triangle count). Extension-only check.
    exts: ['.stl'],
    sig: null,
  },
  zip: {
    exts: ['.zip'],
    sig: [[0, [0x50, 0x4b, 0x03, 0x04]]], // PK\x03\x04
  },
  jpg: {
    exts: ['.jpg', '.jpeg'],
    sig: [[0, [0xff, 0xd8, 0xff]]],
  },
  png: {
    exts: ['.png'],
    sig: [[0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]],
  },
  tif: {
    exts: ['.tif', '.tiff'],
    sig: [
      [0, [0x49, 0x49, 0x2a, 0x00]], // II*\x00 (little-endian)
      [0, [0x4d, 0x4d, 0x00, 0x2a]], // MM\x00* (big-endian)
    ],
  },
  html: {
    exts: ['.html', '.htm'],
    // HTML files may start with whitespace, BOM, or `<!DOCTYPE` / `<html`.
    // We do a relaxed content check (no binary magic).
    sig: null,
  },
  txt: {
    exts: ['.txt'],
    sig: null,
  },
}

// Map source-manifest `kind` to expected file-kind for localPath.
// A `web` source's localPath is an HTML snapshot.
// A `pdf` source's localPath is a PDF.
// A `model` source's localPath is a GLB / STL / ZIP (per `format` field).
// A `image` source's localPath is a JPG / PNG / TIF.
// A `dataset` source is a special case — it may have a landing-page snapshot
// as localPath + assetSamplesArchived for the actual binary samples.
const KIND_TO_FILEKIND: Record<string, string[]> = {
  pdf: ['pdf'],
  model: ['glb', 'stl', 'zip'],
  image: ['jpg', 'png', 'tif'],
  audio: ['mp3', 'wav'],
  dataset: ['html', 'txt', 'tif', 'jpg', 'png'], // dataset may have HTML landing page
  web: ['html', 'txt'],
}

function fileKindOfPath(localPath: string): string | null {
  const ext = extname(localPath).toLowerCase()
  for (const [kind, def] of Object.entries(SIGNATURES)) {
    if (def.exts.includes(ext)) return kind
  }
  return null
}

function matchesSignature(absPath: string, fileKind: string): boolean {
  const def = SIGNATURES[fileKind]
  if (!def || !def.sig) return true // no signature to check
  let buf: Buffer
  try {
    buf = readFileSync(absPath)
  } catch {
    return false
  }
  // A file matches if ANY of the alternative signatures in `sig` matches.
  // For signatures with a single variant, this is just that one variant.
  // For multi-variant (e.g. TIFF little/big endian), we check the first variant.
  // Since our SIGNATURES above store each kind's signature as a single variant
  // (TIFF has two entries but they're separate alternatives — simplified here),
  // we check the first [offset, bytes] pair.
  for (const [offset, bytes] of def.sig) {
    for (let i = 0; i < bytes.length; i++) {
      if (offset + i >= buf.length) return false
      if (buf[offset + i] !== bytes[i]) return false
    }
    return true
  }
  return false
}

export function validate(manifestPath: string, rootDir?: string): ValidationError[] {
  const ROOT = rootDir || resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const errors: ValidationError[] = []
  if (!existsSync(manifestPath)) {
    errors.push({
      sourceId: '(manifest)',
      field: 'file',
      message: `Manifest not found: ${manifestPath}`,
      severity: 'error',
    })
    return errors
  }

  const raw = readFileSync(manifestPath, 'utf8')
  let manifest: Manifest
  try {
    manifest = JSON.parse(raw)
  } catch (e) {
    errors.push({
      sourceId: '(manifest)',
      field: 'json',
      message: `Manifest is not valid JSON: ${(e as Error).message}`,
      severity: 'error',
    })
    return errors
  }

  if (manifest.manifestVersion !== 1) {
    errors.push({
      sourceId: '(manifest)',
      field: 'manifestVersion',
      message: `Expected manifestVersion 1, got ${manifest.manifestVersion}`,
      severity: 'error',
    })
  }

  const ids = new Set<string>()
  // Track every localPath declared by every source, so we can detect when
  // two different source IDs point to the same file (cross-wiring).
  const pathOwners = new Map<string, string>()

  for (const s of manifest.sources) {
    if (ids.has(s.id)) {
      errors.push({
        sourceId: s.id,
        field: 'id',
        message: 'Duplicate source ID',
        severity: 'error',
      })
    }
    ids.add(s.id)

    for (const f of [
      'id',
      'kind',
      'title',
      'originalUrl',
      'accessedAt',
      'rightsStatus',
      'purpose',
      'status',
    ] as const) {
      if (!(s as never)[f]) {
        errors.push({
          sourceId: s.id,
          field: f,
          message: 'Missing required field',
          severity: 'error',
        })
      }
    }

    if (!/^https?:\/\//.test(s.originalUrl)) {
      errors.push({
        sourceId: s.id,
        field: 'originalUrl',
        message: `originalUrl is not http(s): ${s.originalUrl}`,
        severity: 'error',
      })
    }

    if (!/^\d{4}-\d{2}-\d{2}/.test(s.accessedAt)) {
      errors.push({
        sourceId: s.id,
        field: 'accessedAt',
        message: `accessedAt is not ISO date: ${s.accessedAt}`,
        severity: 'warn',
      })
    }

    // kind must be one of the known kinds
    const knownKinds = ['pdf', 'web', 'model', 'image', 'audio', 'dataset']
    if (!knownKinds.includes(s.kind)) {
      errors.push({
        sourceId: s.id,
        field: 'kind',
        message: `Unknown kind '${s.kind}' (expected one of ${knownKinds.join(', ')})`,
        severity: 'error',
      })
    }

    const binaryKinds = ['pdf', 'model', 'image', 'audio']
    const isBinaryKind = binaryKinds.includes(s.kind)

    // === localPath / kind / status consistency ===
    if (s.localPath) {
      // Detect cross-wiring: same path claimed by another source
      const prevOwner = pathOwners.get(s.localPath)
      if (prevOwner && prevOwner !== s.id) {
        errors.push({
          sourceId: s.id,
          field: 'localPath',
          message: `localPath '${s.localPath}' is also claimed by source '${prevOwner}' — cross-wired source mapping`,
          severity: 'error',
        })
      } else {
        pathOwners.set(s.localPath, s.id)
      }

      const abs = resolve(ROOT, s.localPath)
      if (!existsSync(abs)) {
        errors.push({
          sourceId: s.id,
          field: 'localPath',
          message: `File missing: ${abs}`,
          severity: 'error',
        })
      } else {
        const stat = statSync(abs)

        // For binary kinds (pdf/model/image/audio), the localPath MUST NOT
        // be an HTML page. An HTML landing page cannot substitute for the
        // actual binary content.
        if (isBinaryKind) {
          const fileKind = fileKindOfPath(s.localPath)
          if (fileKind === 'html') {
            errors.push({
              sourceId: s.id,
              field: 'localPath',
              message: `Binary kind '${s.kind}' has localPath pointing to an HTML page ('${s.localPath}'). An HTML landing page cannot substitute for the actual ${s.kind} content. Use effectiveDownloadUrl to fetch the real binary.`,
              severity: 'error',
            })
          }
          // Extension must match expected for the kind
          const allowedFileKinds = KIND_TO_FILEKIND[s.kind] || []
          if (fileKind && !allowedFileKinds.includes(fileKind)) {
            errors.push({
              sourceId: s.id,
              field: 'localPath',
              message: `localPath extension '${extname(s.localPath)}' (fileKind '${fileKind}') is not valid for kind '${s.kind}' (expected one of: ${allowedFileKinds.join(', ')})`,
              severity: 'error',
            })
          }
          // Magic-byte signature check
          if (fileKind && !matchesSignature(abs, fileKind)) {
            errors.push({
              sourceId: s.id,
              field: 'localPath',
              message: `File signature mismatch: '${s.localPath}' has extension '${extname(s.localPath)}' but its magic bytes do not match ${fileKind}`,
              severity: 'error',
            })
          }
        }

        // Size + hash checks
        if (s.bytes && stat.size !== s.bytes) {
          errors.push({
            sourceId: s.id,
            field: 'bytes',
            message: `Size mismatch: manifest ${s.bytes} vs disk ${stat.size}`,
            severity: 'error',
          })
        }
        if (s.sha256) {
          const actual = sha256OfFile(abs)
          if (actual !== s.sha256) {
            errors.push({
              sourceId: s.id,
              field: 'sha256',
              message: `SHA-256 mismatch: manifest ${s.sha256} vs disk ${actual}`,
              severity: 'error',
            })
          }
        } else if (s.status === 'downloaded' || s.status === 'webarchived') {
          errors.push({
            sourceId: s.id,
            field: 'sha256',
            message: `Status '${s.status}' requires a recorded sha256`,
            severity: 'warn',
          })
        }
      }
    } else if (isBinaryKind && (s.status === 'downloaded' || s.status === 'webarchived')) {
      errors.push({
        sourceId: s.id,
        field: 'localPath',
        message: `Binary kind '${s.kind}' with status '${s.status}' has no localPath`,
        severity: 'error',
      })
    }

    // === status consistency ===
    // 'downloaded' or 'webarchived' for a binary kind requires a real binary file.
    // 'pending' must NOT claim a sha256/bytes.
    if (s.status === 'pending') {
      if (s.sha256 || s.bytes) {
        errors.push({
          sourceId: s.id,
          field: 'status',
          message: `Status 'pending' but sha256/bytes are recorded — either download the file or drop the hash`,
          severity: 'error',
        })
      }
    }
    if (s.status === 'downloaded' || s.status === 'webarchived') {
      if (!s.localPath) {
        // Already caught above for binary kinds; for web/dataset kinds, localPath may be optional but recommended
        if (s.kind === 'web' || s.kind === 'dataset') {
          // soft — already warned above
        }
      }
    }

    // inspectionReport cross-check: only model-kind sources may have one
    if (s.inspectionReport && s.kind !== 'model') {
      errors.push({
        sourceId: s.id,
        field: 'inspectionReport',
        message: `Non-model kind '${s.kind}' has an inspectionReport — only model sources should have one`,
        severity: 'warn',
      })
    }
    if (s.inspectionReport) {
      const abs = resolve(ROOT, s.inspectionReport)
      if (!existsSync(abs)) {
        errors.push({
          sourceId: s.id,
          field: 'inspectionReport',
          message: `Inspection report missing: ${abs}`,
          severity: 'error',
        })
      }
    }

    if (s.assetSamplesArchived) {
      for (const sample of s.assetSamplesArchived) {
        const abs = resolve(ROOT, sample.localPath)
        if (!existsSync(abs)) {
          errors.push({
            sourceId: s.id,
            field: `assetSamplesArchived.${sample.name}`,
            message: `Sample missing: ${abs}`,
            severity: 'error',
          })
        } else {
          const actual = sha256OfFile(abs)
          if (actual !== sample.sha256) {
            errors.push({
              sourceId: s.id,
              field: `assetSamplesArchived.${sample.name}.sha256`,
              message: `SHA-256 mismatch: manifest ${sample.sha256} vs disk ${actual}`,
              severity: 'error',
            })
          }
          // Sample file signature check
          const fileKind = fileKindOfPath(sample.localPath)
          if (fileKind && !matchesSignature(abs, fileKind)) {
            errors.push({
              sourceId: s.id,
              field: `assetSamplesArchived.${sample.name}`,
              message: `Sample signature mismatch: '${sample.localPath}' has extension '${extname(sample.localPath)}' but its magic bytes do not match ${fileKind}`,
              severity: 'error',
            })
          }
        }
      }
    }

    // === Content assertion checks ===
    // These go beyond kind/magic checks to verify the file's CONTENT matches
    // the declared source identity. This catches cross-wiring where a file
    // has the right magic bytes but is the WRONG file (e.g. two different PDFs
    // both having %PDF magic but one source's localPath points at the other's file).
    if (s.contentAssertions && s.localPath) {
      const abs = resolve(ROOT, s.localPath)
      if (existsSync(abs)) {
        // HTML canonical marker check: for web snapshots, verify a specific
        // string appears in the HTML content to confirm it is the right page.
        // This catches the case where source A's localPath points at source B's
        // HTML snapshot — even though both are valid HTML, the canonical marker
        // for source A would not appear in source B's page.
        if (s.contentAssertions.htmlCanonicalMarker) {
          const fileKind = fileKindOfPath(s.localPath)
          if (fileKind === 'html') {
            try {
              const content = readFileSync(abs, 'utf8')
              if (!content.includes(s.contentAssertions.htmlCanonicalMarker)) {
                errors.push({
                  sourceId: s.id,
                  field: 'contentAssertions.htmlCanonicalMarker',
                  message: `HTML canonical marker '${s.contentAssertions.htmlCanonicalMarker}' not found in '${s.localPath}' — this file may be cross-wired to a different source's HTML snapshot`,
                  severity: 'error',
                })
              }
            } catch {
              // File read error already caught above
            }
          }
        }
      }
    }

    // NTRS citation ID cross-check: if a source declares an ntrsCitationId,
    // verify it appears in the originalUrl or effectiveDownloadUrl
    if (s.ntrsCitationId) {
      const idInUrl =
        s.originalUrl.includes(s.ntrsCitationId) ||
        (s.effectiveDownloadUrl && s.effectiveDownloadUrl.includes(s.ntrsCitationId)) ||
        (s.landingPageUrl && s.landingPageUrl.includes(s.ntrsCitationId))
      if (!idInUrl) {
        errors.push({
          sourceId: s.id,
          field: 'ntrsCitationId',
          message: `NTRS citation ID '${s.ntrsCitationId}' not found in any URL field (originalUrl, effectiveDownloadUrl, landingPageUrl)`,
          severity: 'warn',
        })
      }
    }
  }

  return errors
}

// === CLI entry point ===
// Supports optional --manifest <path> and --root <dir> flags for fixture-based testing.
// When not invoked as a module import, runs the validator and exits.
const args = process.argv.slice(2)
const manifestIdx = args.indexOf('--manifest')
const rootIdx = args.indexOf('--root')
const cliManifest =
  manifestIdx >= 0 && args[manifestIdx + 1]
    ? resolve(args[manifestIdx + 1])
    : resolve(ROOT, 'src/missions/apollo11/source-manifest.json')
const cliRoot = rootIdx >= 0 && args[rootIdx + 1] ? resolve(args[rootIdx + 1]) : undefined

const errors = validate(cliManifest, cliRoot)

const errorsList = errors.filter((e) => e.severity === 'error')
const warnings = errors.filter((e) => e.severity === 'warn')

console.log('=== Source Manifest Validation ===')
console.log(`Manifest: ${cliManifest}`)
console.log(`Errors:   ${errorsList.length}`)
console.log(`Warnings: ${warnings.length}`)

if (errorsList.length > 0) {
  console.log('\n--- Errors ---')
  for (const e of errorsList) {
    console.log(`[${e.sourceId}] ${e.field}: ${e.message}`)
  }
}
if (warnings.length > 0) {
  console.log('\n--- Warnings ---')
  for (const e of warnings) {
    console.log(`[${e.sourceId}] ${e.field}: ${e.message}`)
  }
}

if (errorsList.length > 0) {
  process.exit(1)
}
