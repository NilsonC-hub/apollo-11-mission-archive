import type { EvidenceClass } from './provenance.ts'

export type ComponentLifecycle = 'attached' | 'separating' | 'free' | 'discarded' | 'landed'
export type KnownEngineMode = 'off' | 'burning' | 'cutoff'
export type EngineMode = KnownEngineMode | 'unknown'
export type EngineStateBasis = 'known' | 'point-event' | 'terminal'

export interface VehicleComponentState {
  lifecycle: ComponentLifecycle
  parentId: string | null
  visible: boolean
  engineMode?: EngineMode
  engineStateBasis?: EngineStateBasis
  lastKnownEngineMode?: KnownEngineMode
}

export interface VehicleNodeBinding {
  assetId: string
  semanticNodeId: string
}

export interface VehicleComponentDefinition {
  id: string
  label: string
  initialState: VehicleComponentState
  detachable?: boolean
  sourceIds?: string[]
  evidence?: EvidenceClass
  method?: string
  nodeBinding?: VehicleNodeBinding
}

export interface VehicleDefinition {
  rootComponentIds: string[]
  components: VehicleComponentDefinition[]
}
