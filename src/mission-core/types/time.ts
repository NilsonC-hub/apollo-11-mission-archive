export interface MissionEpochs {
  rangeZeroUtc: string
  liftoffMetSeconds: number
  displayPrecision: 'source-preserved'
}

export interface NarrativeSegment {
  id: string
  metStart: number
  metEnd: number
  storyDurationMs: number
  easing: 'linear'
  presentationPauseMs?: number
}

export interface CompiledNarrativeSegment extends NarrativeSegment {
  storyStartMs: number
  motionEndMs: number
  storyEndMs: number
}

export interface NarrativePosition {
  segmentId: string
  kind: 'motion' | 'presentation-pause'
  metSeconds: number
  storyTimeMs: number
  progress: number
}
