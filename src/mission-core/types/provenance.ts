import type { SiUnitId } from './units.ts'

export const EVIDENCE_CLASSES = [
  'actual',
  'derived',
  'interpolated',
  'planned',
  'reconstructed',
  'schematic',
] as const

export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number]

export const MISSING_REASONS = [
  'not-available-in-source',
  'not-applicable',
  'source-not-yet-reviewed',
] as const

export type MissingReason = (typeof MISSING_REASONS)[number]

export interface CitationRef {
  sourceId: string
  pages?: string
  locator?: string
  note?: string
}

export interface DerivationRecord {
  formula: string
  inputFactIds: string[]
}

export interface InterpolationRecord {
  method: 'linear'
  beforeFactId: string
  afterFactId: string
  metStart: number
  metEnd: number
}

export interface SourcedValue<T extends number | string> {
  kind: 'value'
  id: string
  value: T
  unit?: SiUnitId
  evidence: EvidenceClass
  citations: CitationRef[]
  derivation?: DerivationRecord
  interpolation?: InterpolationRecord
  method?: string
}

export interface MissingValue {
  kind: 'missing'
  id: string
  reason: MissingReason
  unit?: SiUnitId
  citations: CitationRef[]
  note?: string
}

export type EvidenceValue<T extends number | string> = SourcedValue<T> | MissingValue

export function isMissingValue<T extends number | string>(
  value: EvidenceValue<T>,
): value is MissingValue {
  return value.kind === 'missing'
}
