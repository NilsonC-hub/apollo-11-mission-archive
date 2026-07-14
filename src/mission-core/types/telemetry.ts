import type { EvidenceValue } from './provenance.ts'
import type { QuantityKind, SiUnitId } from './units.ts'

export interface TelemetrySample {
  metSeconds: number
  reading: EvidenceValue<number>
}

export interface TelemetryChannel {
  id: string
  label: string
  quantity: QuantityKind
  unit: SiUnitId
  interpolation: 'none' | 'linear'
  samples: TelemetrySample[]
}
