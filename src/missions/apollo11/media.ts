import type { CitationRef } from '../../mission-core/index.ts'

export interface TranscriptRecord {
  id: string
  metFactId: string
  speaker: string
  channel: string
  metSeconds: number
  text: string
  citation: CitationRef
  rightsStatus: string
}

export const apollo11TranscriptRecords = [
  {
    id: 'a11-transcript-contact-light',
    metFactId: 'a11-transcript-contact-light-met',
    speaker: 'LMP (EAGLE)',
    channel: 'AIR-TO-GROUND',
    metSeconds: 369940,
    text: 'CONTACT LIGHT.',
    citation: {
      sourceId: 'NASA-A11-TTEC-WEB',
      locator: '04 06 45 40, LMP (EAGLE)',
    },
    rightsStatus: 'U.S. government transcript record, public domain.',
  },
  {
    id: 'a11-transcript-eagle-landed',
    metFactId: 'a11-transcript-eagle-landed-met',
    speaker: 'CDR (TRANQ)',
    channel: 'AIR-TO-GROUND',
    metSeconds: 369964,
    text: 'THE EAGLE HAS LANDED.',
    citation: {
      sourceId: 'NASA-A11-TTEC-WEB',
      locator: '04 06 46 04, CDR (TRANQ)',
    },
    rightsStatus: 'U.S. government transcript record, public domain.',
  },
  {
    id: 'a11-transcript-first-step',
    metFactId: 'a11-transcript-first-step-met',
    speaker: 'CDR (TRANQ)',
    channel: 'AIR-TO-GROUND',
    metSeconds: 393888,
    text: "THAT'S ONE SMALL STEP FOR (A) MAN, ONE GIANT LEAP FOR MANKIND.",
    citation: {
      sourceId: 'NASA-A11-TTEC-WEB',
      locator: '04 13 24 48, CDR (TRANQ)',
    },
    rightsStatus: 'U.S. government transcript record, public domain.',
  },
] satisfies TranscriptRecord[]

export const apollo11TranscriptMetFacts = apollo11TranscriptRecords.map((record) => ({
  kind: 'value' as const,
  id: record.metFactId,
  value: record.metSeconds,
  unit: 's' as const,
  evidence: 'actual' as const,
  citations: [record.citation],
}))

export interface ImageRecord {
  id: string
  sourceId: string
  nasaImageId: string
  localPath: string
  sha256: string
  width: number
  height: number
  evidence: 'actual'
  rightsStatus: string
  processingNote: string
}

export const apollo11ImageRecords = [
  {
    id: 'a11-image-as11-44-6665',
    sourceId: 'NASA-A11-MOON-VIEW',
    nasaImageId: 'AS11-44-6665',
    localPath: 'assets/raw/NASA-A11-MOON-VIEW.jpg',
    sha256: '1318334a5089fb186d39996f60677b5f5b42cde74158ceff97b3e2283bfd41d4',
    width: 1913,
    height: 1911,
    evidence: 'actual',
    rightsStatus: 'NASA photograph — U.S. government work, public domain.',
    processingNote: 'Raw archived JPEG; no crop, color treatment, or AI expansion applied.',
  },
] satisfies ImageRecord[]

export interface AudioCandidateRecord {
  id: string
  sourceId: string
  originalFilename: string
  sourceUrl: string
  status: 'source-not-yet-archived'
  playbackPolicy: 'unavailable'
  note: string
}

export const apollo11AudioCandidates = [
  {
    id: 'a11-audio-landing-lm-onboard-candidate',
    sourceId: 'NASA-A11-AUDIO',
    originalFilename: 'ap11_07a__landing_dsea.mp3',
    sourceUrl:
      'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/ap11_07a__landing_dsea.mp3',
    status: 'source-not-yet-archived',
    playbackPolicy: 'unavailable',
    note: 'The archived NASA index names this file, but no verified local bytes, hash, channel alignment, or clip boundaries exist yet. Do not render audio playback.',
  },
] satisfies AudioCandidateRecord[]
