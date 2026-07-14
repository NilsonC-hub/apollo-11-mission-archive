import type { CitationRef, MissingReason, MissingValue } from '../types/provenance.ts'
import type { SiUnitId } from '../types/units.ts'

export interface MissingValueInput {
  id: string
  reason: MissingReason
  unit?: SiUnitId
  citations?: CitationRef[]
  note?: string
}

export function createMissingValue(input: MissingValueInput): MissingValue {
  return {
    kind: 'missing',
    id: input.id,
    reason: input.reason,
    ...(input.unit ? { unit: input.unit } : {}),
    citations: input.citations?.map((citation) => ({ ...citation })) ?? [],
    ...(input.note ? { note: input.note } : {}),
  }
}
