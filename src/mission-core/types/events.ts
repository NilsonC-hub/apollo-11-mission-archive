import type { CitationRef, EvidenceClass } from './provenance.ts'
import type { ComponentLifecycle, KnownEngineMode } from './vehicle.ts'

export type MissionAction =
  | { type: 'set-phase'; phaseId: string }
  | { type: 'set-component-lifecycle'; componentId: string; lifecycle: ComponentLifecycle }
  | { type: 'set-component-parent'; componentId: string; parentId: string | null }
  | { type: 'set-component-visibility'; componentId: string; visible: boolean }
  | { type: 'set-engine-mode'; componentId: string; engineMode: KnownEngineMode }
  | { type: 'record-engine-ignition'; componentId: string }

export interface MissionEvent {
  id: string
  metFactId?: string
  metSeconds: number
  utc?: string
  label: string
  tier: 'major' | 'minor' | 'detail'
  evidence: EvidenceClass
  citations: CitationRef[]
  actions: MissionAction[]
  precision?: 'second' | 'tenth-second' | 'source-rounded'
  displayFractionDigits?: 0 | 1 | 2 | 3
}
