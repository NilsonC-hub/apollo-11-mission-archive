import type { ReactNode } from 'react'

import type {
  ArchiveMediaDeliveryVariant,
  DocumentPlateRecord,
  HistoricalImageRecord,
} from '../../missions/apollo11/mediaSchema.ts'

interface ResponsiveArchiveImageProps {
  alt: string
  delivery: readonly ArchiveMediaDeliveryVariant[]
  priority?: boolean
  sizes: string
}

function fallbackVariant(
  delivery: readonly ArchiveMediaDeliveryVariant[],
): ArchiveMediaDeliveryVariant {
  const candidates = delivery
    .filter((variant) => variant.format !== 'webp')
    .sort((a, b) => b.width - a.width)
  const fallback = candidates[0]
  if (!fallback) throw new TypeError('Archive media record is missing its local fallback')
  return fallback
}

function ResponsiveArchiveImage({
  alt,
  delivery,
  priority = false,
  sizes,
}: ResponsiveArchiveImageProps) {
  const webp = delivery
    .filter((variant) => variant.format === 'webp')
    .sort((a, b) => a.width - b.width)
  const fallback = fallbackVariant(delivery)
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={webp.map((variant) => `${variant.publicPath} ${variant.width}w`).join(', ')}
        sizes={sizes}
      />
      <img
        src={fallback.publicPath}
        alt={alt}
        width={fallback.width}
        height={fallback.height}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  )
}

function MetadataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function SourceMetadataRows({ record }: { record: HistoricalImageRecord | DocumentPlateRecord }) {
  return (
    <>
      <MetadataRow label="PROJECT RECORD">
        <code>{record.id}</code>
      </MetadataRow>
      <MetadataRow label="SUBJECT TAGS">{record.subjectTags.join(' · ')}</MetadataRow>
      <MetadataRow label="SOURCE ID">{record.source.sourceId}</MetadataRow>
      <MetadataRow label="ACCESSED">{record.source.accessedAt}</MetadataRow>
      <MetadataRow label="ORIGINAL URL">
        <a href={record.source.originalUrl} target="_blank" rel="noreferrer">
          <code>{record.source.originalUrl}</code>
        </a>
      </MetadataRow>
      <MetadataRow label="EFFECTIVE DOWNLOAD URL">
        <a href={record.source.effectiveDownloadUrl} target="_blank" rel="noreferrer">
          <code>{record.source.effectiveDownloadUrl}</code>
        </a>
      </MetadataRow>
    </>
  )
}

function DeliveryMetadataRows({ delivery }: { delivery: readonly ArchiveMediaDeliveryVariant[] }) {
  return (
    <>
      {delivery.map((variant) => (
        <MetadataRow
          key={variant.localPath}
          label={`DELIVERY ${variant.width} ${variant.format.toUpperCase()}`}
        >
          <span className="archive-record-file">
            <code>LOCAL / {variant.localPath}</code>
            <code>PUBLIC / {variant.publicPath}</code>
            <span>
              {variant.width} × {variant.height} PX · {variant.bytes.toLocaleString('en-US')} BYTES
              · {variant.format.toUpperCase()}
            </span>
            <code>SHA-256 / {variant.sha256}</code>
          </span>
        </MetadataRow>
      ))}
    </>
  )
}

function SourceLinks({ record }: { record: HistoricalImageRecord | DocumentPlateRecord }) {
  const fallback = fallbackVariant(record.delivery)
  return (
    <div className="archive-record-links">
      <a href={record.source.landingPageUrl} target="_blank" rel="noreferrer">
        NASA RECORD ↗
      </a>
      <a href={record.source.effectiveDownloadUrl} target="_blank" rel="noreferrer">
        OFFICIAL SOURCE FILE ↗
      </a>
      <a href={fallback.publicPath} target="_blank" rel="noreferrer">
        OPEN LOCAL PLATE ↗
      </a>
    </div>
  )
}

function ImageRecordDetails({ record }: { record: HistoricalImageRecord }) {
  return (
    <details className="archive-record-details">
      <summary>
        IMAGE RECORD <span aria-hidden="true">+</span>
      </summary>
      <div className="archive-record-body">
        <dl>
          <SourceMetadataRows record={record} />
          <MetadataRow label="NASA IMAGE ID">{record.nasaImageId}</MetadataRow>
          <MetadataRow label="CAPTURE DATE">
            {record.capturedAt ? (
              <time dateTime={record.capturedAt}>{record.capturedAt}</time>
            ) : (
              'NOT RECORDED'
            )}
          </MetadataRow>
          {record.camera ? <MetadataRow label="CAMERA CONTEXT">{record.camera}</MetadataRow> : null}
          <MetadataRow label="RAW DIMENSIONS">
            {record.raw.width} × {record.raw.height} PX
          </MetadataRow>
          <MetadataRow label="RAW BYTES">{record.raw.bytes.toLocaleString('en-US')}</MetadataRow>
          <MetadataRow label="RAW FORMAT">{record.raw.format.toUpperCase()}</MetadataRow>
          <MetadataRow label="RAW LOCAL PATH">
            <code>{record.raw.localPath}</code>
          </MetadataRow>
          <MetadataRow label="RAW SHA-256">
            <code>{record.raw.sha256}</code>
          </MetadataRow>
          <MetadataRow label="ALT TEXT">{record.alt}</MetadataRow>
          <MetadataRow label="RIGHTS / CREDIT">{record.rightsStatus}</MetadataRow>
          <MetadataRow label="PROCESSING">{record.processingNote}</MetadataRow>
          <DeliveryMetadataRows delivery={record.delivery} />
        </dl>
        <SourceLinks record={record} />
      </div>
    </details>
  )
}

export interface EvidencePlateProps {
  label: string
  priority?: boolean
  record: HistoricalImageRecord
  sizes?: string
  variant?: 'hero' | 'standard'
}

export function EvidencePlate({
  label,
  priority = false,
  record,
  sizes = '(max-width: 900px) calc(100vw - 36px), 42vw',
  variant = 'standard',
}: EvidencePlateProps) {
  return (
    <figure className={`archive-evidence-plate archive-evidence-plate--${variant}`}>
      <div className="archive-evidence-visual">
        <ResponsiveArchiveImage
          alt={record.alt}
          delivery={record.delivery}
          priority={priority}
          sizes={sizes}
        />
      </div>
      <figcaption>
        <div className="archive-evidence-heading">
          <span>{label}</span>
          <b>
            {record.nasaImageId} · {record.evidence.toUpperCase()}
          </b>
        </div>
        <p>{record.caption}</p>
        <ImageRecordDetails record={record} />
      </figcaption>
    </figure>
  )
}

function DocumentRecordDetails({ record }: { record: DocumentPlateRecord }) {
  return (
    <details className="archive-record-details">
      <summary>
        DOCUMENT RECORD <span aria-hidden="true">+</span>
      </summary>
      <div className="archive-record-body">
        <dl>
          <SourceMetadataRows record={record} />
          <MetadataRow label="DOCUMENT ID">{record.documentId}</MetadataRow>
          <MetadataRow label="LOCATOR">
            PDF P.{record.locator.pdfPage} · PRINTED P.{record.locator.printedPage ?? 'N/A'} ·{' '}
            {record.locator.label}
          </MetadataRow>
          <MetadataRow label="SOURCE PDF">
            <code>{record.sourceDocument.localPath}</code>
          </MetadataRow>
          <MetadataRow label="SOURCE PDF BYTES">
            {record.sourceDocument.bytes.toLocaleString('en-US')}
          </MetadataRow>
          <MetadataRow label="SOURCE PDF FORMAT">PDF</MetadataRow>
          <MetadataRow label="SOURCE PDF SHA-256">
            <code>{record.sourceDocument.sha256}</code>
          </MetadataRow>
          <MetadataRow label="RENDERED PAGE">
            <code>{record.renderedPage.localPath}</code>
          </MetadataRow>
          <MetadataRow label="RENDERED PAGE SHA-256">
            <code>{record.renderedPage.sha256}</code>
          </MetadataRow>
          <MetadataRow label="RENDERED PAGE BYTES">
            {record.renderedPage.bytes.toLocaleString('en-US')}
          </MetadataRow>
          <MetadataRow label="RENDERED PAGE FORMAT">
            {record.renderedPage.format.toUpperCase()}
          </MetadataRow>
          <MetadataRow label="RENDERED DIMENSIONS">
            {record.renderedPage.width} × {record.renderedPage.height} PX
          </MetadataRow>
          <MetadataRow label="ALT TEXT">{record.alt}</MetadataRow>
          <MetadataRow label="RIGHTS / CREDIT">{record.rightsStatus}</MetadataRow>
          <MetadataRow label="PROCESSING">{record.processingNote}</MetadataRow>
          <DeliveryMetadataRows delivery={record.delivery} />
        </dl>
        <SourceLinks record={record} />
      </div>
    </details>
  )
}

export function DocumentPlate({
  label,
  record,
  sizes = '(max-width: 900px) calc(100vw - 36px), 42vw',
}: {
  label: string
  record: DocumentPlateRecord
  sizes?: string
}) {
  return (
    <figure className="archive-evidence-plate archive-document-plate">
      <div className="archive-evidence-visual">
        <ResponsiveArchiveImage alt={record.alt} delivery={record.delivery} sizes={sizes} />
      </div>
      <figcaption>
        <div className="archive-evidence-heading">
          <span>{label}</span>
          <b>
            PDF {record.locator.pdfPage} · {record.evidence.toUpperCase()} DOCUMENT
          </b>
        </div>
        <p>{record.caption}</p>
        <DocumentRecordDetails record={record} />
      </figcaption>
    </figure>
  )
}

export function EvidencePair({
  ariaLabel,
  children,
  className = '',
}: {
  ariaLabel: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`archive-evidence-pair ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}
