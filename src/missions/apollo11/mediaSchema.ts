export type ArchiveMediaFormat = 'jpeg' | 'png' | 'webp'

export interface ArchiveMediaSourceBinding {
  sourceId: string
  landingPageUrl: string
  originalUrl: string
  effectiveDownloadUrl: string
  accessedAt: string
}

export interface ArchiveMediaFile {
  localPath: string
  sha256: string
  bytes: number
  width: number
  height: number
  format: ArchiveMediaFormat
}

export interface ArchiveMediaDeliveryVariant extends ArchiveMediaFile {
  publicPath: string
}

export interface HistoricalImageRecord {
  kind: 'historical-image'
  id: string
  source: ArchiveMediaSourceBinding
  nasaImageId: string
  caption: string
  alt: string
  subjectTags: readonly string[]
  capturedAt?: string
  metSeconds?: number
  camera?: string
  raw: ArchiveMediaFile
  delivery: readonly ArchiveMediaDeliveryVariant[]
  evidence: 'actual'
  rightsStatus: string
  processingNote: string
}

export interface DocumentPlateRecord {
  kind: 'document-plate'
  id: string
  source: ArchiveMediaSourceBinding
  documentId: string
  locator: {
    pdfPage: number
    printedPage?: string
    label: string
  }
  caption: string
  alt: string
  subjectTags: readonly string[]
  sourceDocument: {
    localPath: string
    sha256: string
    bytes: number
  }
  renderedPage: ArchiveMediaFile
  delivery: readonly ArchiveMediaDeliveryVariant[]
  evidence: 'actual' | 'planned'
  rightsStatus: string
  processingNote: string
}

export type ArchiveMediaRecord = HistoricalImageRecord | DocumentPlateRecord

export interface ArchiveMediaValidationIssue {
  id: string
  field: string
  message: string
}

const SHA256 = /^[a-f0-9]{64}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function add(
  issues: ArchiveMediaValidationIssue[],
  record: ArchiveMediaRecord,
  field: string,
  condition: boolean,
  message: string,
) {
  if (!condition) issues.push({ id: record.id, field, message })
}

function isOfficialNasaUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host === 'nasa.gov' || host.endsWith('.nasa.gov')
  } catch {
    return false
  }
}

function validateFile(
  issues: ArchiveMediaValidationIssue[],
  record: ArchiveMediaRecord,
  field: string,
  file: ArchiveMediaFile,
) {
  add(issues, record, `${field}.localPath`, file.localPath.length > 0, 'localPath is required')
  add(issues, record, `${field}.sha256`, SHA256.test(file.sha256), 'sha256 must be lowercase hex')
  add(issues, record, `${field}.bytes`, file.bytes > 0, 'bytes must be positive')
  add(issues, record, `${field}.width`, file.width > 0, 'width must be positive')
  add(issues, record, `${field}.height`, file.height > 0, 'height must be positive')
}

function validateDelivery(
  issues: ArchiveMediaValidationIssue[],
  record: ArchiveMediaRecord,
  source: ArchiveMediaFile,
) {
  const widths = new Set(record.delivery.map((variant) => variant.width))
  const formats = new Set(record.delivery.map((variant) => variant.format))
  add(
    issues,
    record,
    'delivery',
    record.delivery.length >= 3 && widths.size >= 2,
    'delivery requires at least two responsive widths plus a fallback',
  )
  add(issues, record, 'delivery', formats.has('webp'), 'delivery requires WebP variants')
  add(
    issues,
    record,
    'delivery',
    formats.has('jpeg') || formats.has('png'),
    'delivery requires a JPEG or PNG fallback',
  )

  const sourceRatio = source.width / source.height
  record.delivery.forEach((variant, index) => {
    validateFile(issues, record, `delivery.${index}`, variant)
    add(
      issues,
      record,
      `delivery.${index}.publicPath`,
      variant.publicPath.startsWith('/missions/apollo11/images/'),
      'publicPath must use the local Apollo 11 image root',
    )
    add(
      issues,
      record,
      `delivery.${index}.localPath`,
      variant.localPath.startsWith('public/missions/apollo11/images/'),
      'delivery localPath must remain local and publishable',
    )
    const variantRatio = variant.width / variant.height
    add(
      issues,
      record,
      `delivery.${index}.dimensions`,
      Math.abs(variantRatio - sourceRatio) / sourceRatio <= 0.015,
      'delivery dimensions must preserve the source aspect ratio',
    )
  })
}

export function validateArchiveMediaRecords(
  records: readonly ArchiveMediaRecord[],
): ArchiveMediaValidationIssue[] {
  const issues: ArchiveMediaValidationIssue[] = []
  const ids = new Set<string>()
  const nasaImageIds = new Set<string>()

  for (const record of records) {
    add(issues, record, 'id', record.id.length > 0 && !ids.has(record.id), 'id must be unique')
    ids.add(record.id)
    add(
      issues,
      record,
      'source.sourceId',
      record.source.sourceId.length > 0,
      'sourceId is required',
    )
    add(
      issues,
      record,
      'source.landingPageUrl',
      isOfficialNasaUrl(record.source.landingPageUrl),
      'landing page must be an official NASA URL',
    )
    add(
      issues,
      record,
      'source.originalUrl',
      isOfficialNasaUrl(record.source.originalUrl),
      'original URL must be an official NASA URL',
    )
    add(
      issues,
      record,
      'source.effectiveDownloadUrl',
      isOfficialNasaUrl(record.source.effectiveDownloadUrl),
      'download URL must be an official NASA URL',
    )
    add(
      issues,
      record,
      'source.accessedAt',
      ISO_DATE.test(record.source.accessedAt),
      'accessedAt must be YYYY-MM-DD',
    )
    add(issues, record, 'caption', record.caption.trim().length > 0, 'caption is required')
    add(issues, record, 'alt', record.alt.trim().length > 0, 'alt text is required')
    add(issues, record, 'subjectTags', record.subjectTags.length > 0, 'subject tags are required')
    add(
      issues,
      record,
      'rightsStatus',
      record.rightsStatus.trim().length > 0,
      'rights status is required',
    )
    add(
      issues,
      record,
      'processingNote',
      /crop/i.test(record.processingNote) && /(color|tonal)/i.test(record.processingNote),
      'processing note must explicitly disclose crop and color/tonal treatment',
    )

    if (record.kind === 'historical-image') {
      add(
        issues,
        record,
        'nasaImageId',
        record.nasaImageId.length > 0 && !nasaImageIds.has(record.nasaImageId),
        'NASA image ID must be present and unique',
      )
      nasaImageIds.add(record.nasaImageId)
      validateFile(issues, record, 'raw', record.raw)
      validateDelivery(issues, record, record.raw)
    } else {
      add(issues, record, 'documentId', record.documentId.length > 0, 'document ID is required')
      add(issues, record, 'locator.pdfPage', record.locator.pdfPage > 0, 'PDF page is 1-based')
      add(
        issues,
        record,
        'locator.label',
        record.locator.label.length > 0,
        'locator label is required',
      )
      add(
        issues,
        record,
        'sourceDocument.sha256',
        SHA256.test(record.sourceDocument.sha256),
        'source document sha256 must be lowercase hex',
      )
      add(
        issues,
        record,
        'sourceDocument.bytes',
        record.sourceDocument.bytes > 0,
        'source document bytes must be positive',
      )
      validateFile(issues, record, 'renderedPage', record.renderedPage)
      validateDelivery(issues, record, record.renderedPage)
    }
  }

  return issues
}
