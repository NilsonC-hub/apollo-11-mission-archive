import type { MissionEvent } from './events.ts'
import type { EvidenceClass, EvidenceValue } from './provenance.ts'
import type { TelemetryChannel } from './telemetry.ts'
import type { MissionEpochs, NarrativeSegment } from './time.ts'
import type { VehicleComponentState, VehicleDefinition } from './vehicle.ts'

export interface MissionMeta {
  id: string
  name: string
  description?: string
  factIds?: string[]
}

export interface MissionPhase {
  id: string
  label: string
  startEventId?: string
  endEventId?: string
}

export interface SourceRecord {
  id: string
  kind: 'pdf' | 'web' | 'image' | 'audio' | 'model' | 'dataset'
  title: string
  publisher: string
  publicationDate?: string
  originalUrl: string
  localPath?: string
  accessedAt: string
  sha256?: string
  rightsStatus: string
  notes?: string
  allowedEvidence?: EvidenceClass[]
}

export interface SourceManifest {
  sources: SourceRecord[]
}

export interface AssetRecord {
  id: string
  sourceId: string
  kind: 'image' | 'audio' | 'model' | 'texture' | 'fallback'
  evidence: EvidenceClass
}

export interface AssetManifest {
  assets: AssetRecord[]
}

export interface MissionDefinition {
  id: string
  meta: MissionMeta
  epochs: MissionEpochs
  events: MissionEvent[]
  phases: MissionPhase[]
  initialPhaseId: string
  narrative: NarrativeSegment[]
  vehicle: VehicleDefinition
  telemetry: TelemetryChannel[]
  facts: EvidenceValue<number | string>[]
  sources: SourceManifest
  assets: AssetManifest
}

export interface MissionState {
  metSeconds: number
  phaseId: string
  components: Record<string, VehicleComponentState>
  appliedEventIds: string[]
}
