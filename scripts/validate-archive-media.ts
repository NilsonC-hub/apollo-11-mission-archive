import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apollo11ArchiveMediaRecords } from '../src/missions/apollo11/archiveMedia.ts'
import type {
  ArchiveMediaFile,
  ArchiveMediaFormat,
  ArchiveMediaRecord,
} from '../src/missions/apollo11/mediaSchema.ts'
import { validateArchiveMediaRecords } from '../src/missions/apollo11/mediaSchema.ts'
import sourceManifestJson from '../src/missions/apollo11/source-manifest.json' with { type: 'json' }

export interface ArchiveMediaDiskIssue {
  id: string
  field: string
  message: string
}

interface ManifestSource {
  id: string
  originalUrl: string
  effectiveDownloadUrl?: string
  landingPageUrl?: string
  accessedAt: string
  localPath?: string | null
  sha256?: string | null
  bytes?: number
}

function hash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function readUint24LE(buffer: Buffer, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
}

function jpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ])
  let offset = 2
  while (offset + 8 < buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xff) offset += 1
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1
    if (offset >= buffer.length) break
    const marker = buffer[offset]
    offset += 1
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 1 >= buffer.length) break
    const segmentLength = buffer.readUInt16BE(offset)
    if (startOfFrameMarkers.has(marker) && offset + 6 < buffer.length) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) }
    }
    if (segmentLength < 2) break
    offset += segmentLength
  }
  return null
}

function pngDimensions(buffer: Buffer): { width: number; height: number } | null {
  const signature = '89504e470d0a1a0a'
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function webpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (
    buffer.length < 30 ||
    buffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    buffer.subarray(8, 12).toString('ascii') !== 'WEBP'
  ) {
    return null
  }
  let offset = 12
  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString('ascii')
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const data = offset + 8
    if (type === 'VP8X' && data + 10 <= buffer.length) {
      return {
        width: readUint24LE(buffer, data + 4) + 1,
        height: readUint24LE(buffer, data + 7) + 1,
      }
    }
    if (type === 'VP8L' && data + 5 <= buffer.length && buffer[data] === 0x2f) {
      const b1 = buffer[data + 1]
      const b2 = buffer[data + 2]
      const b3 = buffer[data + 3]
      const b4 = buffer[data + 4]
      return {
        width: 1 + (b1 | ((b2 & 0x3f) << 8)),
        height: 1 + ((b2 >> 6) | (b3 << 2) | ((b4 & 0x0f) << 10)),
      }
    }
    if (
      type === 'VP8 ' &&
      data + 10 <= buffer.length &&
      buffer[data + 3] === 0x9d &&
      buffer[data + 4] === 0x01 &&
      buffer[data + 5] === 0x2a
    ) {
      return {
        width: buffer.readUInt16LE(data + 6) & 0x3fff,
        height: buffer.readUInt16LE(data + 8) & 0x3fff,
      }
    }
    offset = data + chunkSize + (chunkSize % 2)
  }
  return null
}

function dimensions(
  buffer: Buffer,
  format: ArchiveMediaFormat,
): { width: number; height: number } | null {
  if (format === 'jpeg') return jpegDimensions(buffer)
  if (format === 'png') return pngDimensions(buffer)
  return webpDimensions(buffer)
}

function validateDiskFile(
  issues: ArchiveMediaDiskIssue[],
  record: ArchiveMediaRecord,
  field: string,
  file: ArchiveMediaFile,
  rootDir: string,
) {
  const absolutePath = resolve(rootDir, file.localPath)
  if (!existsSync(absolutePath)) {
    issues.push({ id: record.id, field, message: `missing file: ${file.localPath}` })
    return
  }
  const stat = statSync(absolutePath)
  const buffer = readFileSync(absolutePath)
  if (stat.size !== file.bytes) {
    issues.push({ id: record.id, field: `${field}.bytes`, message: 'on-disk byte count mismatch' })
  }
  if (hash(buffer) !== file.sha256) {
    issues.push({ id: record.id, field: `${field}.sha256`, message: 'on-disk hash mismatch' })
  }
  const actualDimensions = dimensions(buffer, file.format)
  if (!actualDimensions) {
    issues.push({ id: record.id, field: `${field}.format`, message: 'image signature is invalid' })
  } else if (actualDimensions.width !== file.width || actualDimensions.height !== file.height) {
    issues.push({
      id: record.id,
      field: `${field}.dimensions`,
      message: `on-disk dimensions ${actualDimensions.width}×${actualDimensions.height} do not match record`,
    })
  }
}

function valuesMatch(actual: unknown, expected: unknown): boolean {
  return actual === expected
}

export function validateApollo11ArchiveMedia(
  records: readonly ArchiveMediaRecord[] = apollo11ArchiveMediaRecords,
  rootDir = resolve(fileURLToPath(new URL('..', import.meta.url))),
): ArchiveMediaDiskIssue[] {
  const issues: ArchiveMediaDiskIssue[] = validateArchiveMediaRecords(records)
  const manifestById = new Map(
    (sourceManifestJson.sources as ManifestSource[]).map((source) => [source.id, source]),
  )

  for (const record of records) {
    const source = manifestById.get(record.source.sourceId)
    if (!source) {
      issues.push({
        id: record.id,
        field: 'source.sourceId',
        message: 'sourceId does not resolve in the canonical Apollo 11 source manifest',
      })
      continue
    }

    const sourceChecks = [
      ['source.originalUrl', record.source.originalUrl, source.originalUrl],
      [
        'source.effectiveDownloadUrl',
        record.source.effectiveDownloadUrl,
        source.effectiveDownloadUrl ?? source.originalUrl,
      ],
      [
        'source.landingPageUrl',
        record.source.landingPageUrl,
        source.landingPageUrl ?? source.originalUrl,
      ],
      ['source.accessedAt', record.source.accessedAt, source.accessedAt],
    ] as const
    for (const [field, actual, expected] of sourceChecks) {
      if (!valuesMatch(actual, expected)) {
        issues.push({ id: record.id, field, message: 'does not match canonical source manifest' })
      }
    }

    const archivedSource = record.kind === 'historical-image' ? record.raw : record.sourceDocument
    const archiveChecks = [
      ['localPath', archivedSource.localPath, source.localPath],
      ['sha256', archivedSource.sha256, source.sha256],
      ['bytes', archivedSource.bytes, source.bytes],
    ] as const
    for (const [field, actual, expected] of archiveChecks) {
      if (!valuesMatch(actual, expected)) {
        issues.push({
          id: record.id,
          field: record.kind === 'historical-image' ? `raw.${field}` : `sourceDocument.${field}`,
          message: 'does not match canonical source manifest',
        })
      }
    }

    if (record.kind === 'historical-image') {
      validateDiskFile(issues, record, 'raw', record.raw, rootDir)
    } else {
      const sourceDocumentPath = resolve(rootDir, record.sourceDocument.localPath)
      if (!existsSync(sourceDocumentPath)) {
        issues.push({
          id: record.id,
          field: 'sourceDocument',
          message: `missing file: ${record.sourceDocument.localPath}`,
        })
      } else {
        const buffer = readFileSync(sourceDocumentPath)
        if (buffer.length !== record.sourceDocument.bytes) {
          issues.push({
            id: record.id,
            field: 'sourceDocument.bytes',
            message: 'on-disk byte count mismatch',
          })
        }
        if (hash(buffer) !== record.sourceDocument.sha256) {
          issues.push({
            id: record.id,
            field: 'sourceDocument.sha256',
            message: 'on-disk hash mismatch',
          })
        }
      }
      validateDiskFile(issues, record, 'renderedPage', record.renderedPage, rootDir)
    }

    record.delivery.forEach((file, index) =>
      validateDiskFile(issues, record, `delivery.${index}`, file, rootDir),
    )
  }

  return issues
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const issues = validateApollo11ArchiveMedia()
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`[${issue.id}] ${issue.field}: ${issue.message}`)
    }
    process.exitCode = 1
  } else {
    console.log(`Archive media validation passed (${apollo11ArchiveMediaRecords.length} records).`)
  }
}
