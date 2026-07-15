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
import processingReportJson from '../docs/audit/SPRINT-2-ARCHIVE-MEDIA-PROCESSING.json' with { type: 'json' }

export interface ArchiveMediaDiskIssue {
  id: string
  field: string
  message: string
}

interface ManifestSource {
  id: string
  kind: string
  originalUrl: string
  effectiveDownloadUrl?: string
  landingPageUrl?: string
  accessedAt: string
  localPath?: string | null
  sha256?: string | null
  bytes?: number
  rightsStatus: string
  nasaImageId?: string
  publicationDate: string
  width?: number
  height?: number
  format?: string
}

interface ProcessingReportFile extends ArchiveMediaFile {
  publicPath?: string
}

interface ProcessingReportDocumentFile extends ProcessingReportFile {
  sourceDocument: string
  sourceDocumentSha256: string
  pdfPage: number
  printedPage: string
}

interface ProcessingReportItem {
  id: string
  raw?: ProcessingReportFile
  renderedPage?: ProcessingReportDocumentFile
  delivery: ProcessingReportFile[]
}

export interface ArchiveMediaProcessingReport {
  schemaVersion: number
  policy: {
    crop: string
    colorOrTonalAdjustment: string
    resize: string
    delivery: string
  }
  items: ProcessingReportItem[]
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

function normalizeManifestFormat(format: string | undefined): string | undefined {
  return format === 'jpg' ? 'jpeg' : format
}

function compareProcessingFile(
  issues: ArchiveMediaDiskIssue[],
  record: ArchiveMediaRecord,
  field: string,
  reportFile: ProcessingReportFile | undefined,
  recordFile: ArchiveMediaFile & { publicPath?: string },
) {
  if (!reportFile) {
    issues.push({ id: record.id, field, message: 'processing report file record is missing' })
    return
  }
  const fields = ['localPath', 'sha256', 'bytes', 'width', 'height', 'format'] as const
  for (const key of fields) {
    if (!valuesMatch(reportFile[key], recordFile[key])) {
      issues.push({
        id: record.id,
        field: `${field}.${key}`,
        message: 'processing report does not match media record',
      })
    }
  }
  if (recordFile.publicPath !== undefined && reportFile.publicPath !== recordFile.publicPath) {
    issues.push({
      id: record.id,
      field: `${field}.publicPath`,
      message: 'processing report does not match media record',
    })
  }
}

function validateProcessingReport(
  issues: ArchiveMediaDiskIssue[],
  records: readonly ArchiveMediaRecord[],
  report: ArchiveMediaProcessingReport,
) {
  const expectedPolicy = {
    crop: 'none; full source frame/full PDF page retained',
    colorOrTonalAdjustment: 'none',
    resize: 'Lanczos downsample only; no upscaling',
    delivery: 'responsive WebP plus local JPEG fallback',
  } as const
  if (report.schemaVersion !== 1) {
    issues.push({
      id: 'processing-report',
      field: 'processingReport.schemaVersion',
      message: 'processing report schema version must be 1',
    })
  }
  for (const [key, expected] of Object.entries(expectedPolicy)) {
    if (report.policy[key as keyof typeof expectedPolicy] !== expected) {
      issues.push({
        id: 'processing-report',
        field: `processingReport.policy.${key}`,
        message: 'processing recipe policy drifted from the pinned checkpoint recipe',
      })
    }
  }

  const reportIds = new Set<string>()
  for (const item of report.items) {
    if (reportIds.has(item.id)) {
      issues.push({
        id: item.id,
        field: 'processingReport.items.id',
        message: 'processing report record ID is duplicated',
      })
    }
    reportIds.add(item.id)
  }
  const reportById = new Map(report.items.map((item) => [item.id, item]))

  for (const record of records) {
    const item = reportById.get(record.id)
    if (!item) {
      issues.push({
        id: record.id,
        field: 'processingReport.items.id',
        message: 'media record is missing from processing report',
      })
      continue
    }

    if (record.kind === 'historical-image') {
      compareProcessingFile(issues, record, 'processingReport.raw', item.raw, record.raw)
      if (item.renderedPage) {
        issues.push({
          id: record.id,
          field: 'processingReport.renderedPage',
          message: 'historical image cannot use a document rendered-page input',
        })
      }
    } else {
      compareProcessingFile(
        issues,
        record,
        'processingReport.renderedPage',
        item.renderedPage,
        record.renderedPage,
      )
      if (!item.renderedPage) {
        // The generic missing-file issue above is sufficient.
      } else {
        const documentChecks = [
          ['sourceDocument', item.renderedPage.sourceDocument, record.sourceDocument.localPath],
          [
            'sourceDocumentSha256',
            item.renderedPage.sourceDocumentSha256,
            record.sourceDocument.sha256,
          ],
          ['pdfPage', item.renderedPage.pdfPage, record.locator.pdfPage],
          ['printedPage', item.renderedPage.printedPage, record.locator.printedPage],
        ] as const
        for (const [key, actual, expected] of documentChecks) {
          if (!valuesMatch(actual, expected)) {
            issues.push({
              id: record.id,
              field: `processingReport.renderedPage.${key}`,
              message: 'processing report document input does not match media record',
            })
          }
        }
      }
      if (item.raw) {
        issues.push({
          id: record.id,
          field: 'processingReport.raw',
          message: 'document record cannot use a historical-image raw input',
        })
      }
    }

    if (item.delivery.length !== record.delivery.length) {
      issues.push({
        id: record.id,
        field: 'processingReport.delivery',
        message: 'processing report delivery count does not match media record',
      })
    }
    const deliveryByPath = new Map(item.delivery.map((variant) => [variant.localPath, variant]))
    record.delivery.forEach((variant, index) =>
      compareProcessingFile(
        issues,
        record,
        `processingReport.delivery.${index}`,
        deliveryByPath.get(variant.localPath),
        variant,
      ),
    )

    const noteChecks = [
      ['crop', /no crop/i],
      ['colorOrTonalAdjustment', /no color or tonal adjustment/i],
      ['resize', /Lanczos/i],
      ['delivery', /WebP\/JPEG/i],
    ] as const
    for (const [key, pattern] of noteChecks) {
      if (!pattern.test(record.processingNote)) {
        issues.push({
          id: record.id,
          field: `processingReport.recipe.${key}`,
          message: 'media processing note does not disclose the pinned recipe',
        })
      }
    }
  }

  for (const item of report.items) {
    if (!records.some((record) => record.id === item.id)) {
      issues.push({
        id: item.id,
        field: 'processingReport.items.id',
        message: 'processing report contains an unknown media record',
      })
    }
  }
}

export function validateApollo11ArchiveMedia(
  records: readonly ArchiveMediaRecord[] = apollo11ArchiveMediaRecords,
  rootDir = resolve(fileURLToPath(new URL('..', import.meta.url))),
  processingReport: ArchiveMediaProcessingReport = processingReportJson as ArchiveMediaProcessingReport,
): ArchiveMediaDiskIssue[] {
  const issues: ArchiveMediaDiskIssue[] = validateArchiveMediaRecords(records)
  validateProcessingReport(issues, records, processingReport)
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
      ['source.publicationDate', record.source.publicationDate, source.publicationDate],
      ['rightsStatus', record.rightsStatus, source.rightsStatus],
    ] as const
    for (const [field, actual, expected] of sourceChecks) {
      if (!valuesMatch(actual, expected)) {
        issues.push({ id: record.id, field, message: 'does not match canonical source manifest' })
      }
    }

    const expectedSourceKind = record.kind === 'historical-image' ? 'image' : 'pdf'
    if (source.kind !== expectedSourceKind) {
      issues.push({
        id: record.id,
        field: 'source.kind',
        message: 'does not match canonical source manifest',
      })
    }

    if (record.kind === 'historical-image') {
      const imageChecks = [
        ['nasaImageId', record.nasaImageId, source.nasaImageId],
        ['capturedAt', record.capturedAt, source.publicationDate],
        ['raw.width', record.raw.width, source.width],
        ['raw.height', record.raw.height, source.height],
        ['raw.format', record.raw.format, normalizeManifestFormat(source.format)],
      ] as const
      for (const [field, actual, expected] of imageChecks) {
        if (!valuesMatch(actual, expected)) {
          issues.push({ id: record.id, field, message: 'does not match canonical source manifest' })
        }
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
