import type { EvidenceClass } from './provenance.ts'

export type ComponentLifecycle = 'attached' | 'separating' | 'free' | 'discarded' | 'landed'
export type EngineMode = 'off' | 'ignition' | 'burning' | 'cutoff'

export interface VehicleComponentState {
  lifecycle: ComponentLifecycle
  parentId: string | null
  visible: boolean
  engineMode?: EngineMode
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
