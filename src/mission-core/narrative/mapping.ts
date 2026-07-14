import type {
  CompiledNarrativeSegment,
  NarrativePosition,
  NarrativeSegment,
} from '../types/time.ts'

const EPSILON = 1e-9

export function compileNarrative(
  segments: readonly NarrativeSegment[],
): CompiledNarrativeSegment[] {
  if (segments.length === 0) throw new RangeError('Narrative must contain at least one segment')

  let cursor = 0
  return segments.map((segment, index) => {
    if (!segment.id) throw new TypeError(`Narrative segment ${index} has no id`)
    if (!Number.isFinite(segment.metStart) || !Number.isFinite(segment.metEnd)) {
      throw new TypeError(`Narrative segment ${segment.id} has non-finite MET bounds`)
    }
    if (segment.metEnd <= segment.metStart) {
      throw new RangeError(`Narrative segment ${segment.id} must advance MET`)
    }
    if (!Number.isFinite(segment.storyDurationMs) || segment.storyDurationMs <= 0) {
      throw new RangeError(`Narrative segment ${segment.id} must have positive storyDurationMs`)
    }
    if (segment.easing !== 'linear') {
      throw new TypeError(`Narrative segment ${segment.id} must use linear easing`)
    }

    const pause = segment.presentationPauseMs ?? 0
    if (!Number.isFinite(pause) || pause < 0) {
      throw new RangeError(`Narrative segment ${segment.id} has invalid presentationPauseMs`)
    }
    const previous = index > 0 ? segments[index - 1] : undefined
    if (previous && Math.abs(previous.metEnd - segment.metStart) > EPSILON) {
      throw new RangeError(
        `Narrative segment ${segment.id} must start at the previous segment MET end`,
      )
    }

    const compiled: CompiledNarrativeSegment = {
      ...segment,
      storyStartMs: cursor,
      motionEndMs: cursor + segment.storyDurationMs,
      storyEndMs: cursor + segment.storyDurationMs + pause,
    }
    cursor = compiled.storyEndMs
    return compiled
  })
}

export function narrativePositionAtStoryTime(
  segments: readonly NarrativeSegment[],
  storyTimeMs: number,
): NarrativePosition {
  if (!Number.isFinite(storyTimeMs)) throw new TypeError('storyTime must be finite')
  const compiled = compileNarrative(segments)
  const first = compiled[0]
  const last = compiled[compiled.length - 1]
  const clamped = Math.min(Math.max(storyTimeMs, first.storyStartMs), last.storyEndMs)
  const segment = compiled.find((candidate) => clamped <= candidate.storyEndMs + EPSILON) ?? last

  if (clamped > segment.motionEndMs + EPSILON) {
    return {
      segmentId: segment.id,
      kind: 'presentation-pause',
      metSeconds: segment.metEnd,
      storyTimeMs: clamped,
      progress: 1,
    }
  }

  const progress = Math.min(
    1,
    Math.max(0, (clamped - segment.storyStartMs) / segment.storyDurationMs),
  )
  return {
    segmentId: segment.id,
    kind: 'motion',
    metSeconds: segment.metStart + (segment.metEnd - segment.metStart) * progress,
    storyTimeMs: clamped,
    progress,
  }
}

export function metAtStoryTime(segments: readonly NarrativeSegment[], storyTimeMs: number): number {
  return narrativePositionAtStoryTime(segments, storyTimeMs).metSeconds
}

export function storyTimeAtMet(segments: readonly NarrativeSegment[], metSeconds: number): number {
  if (!Number.isFinite(metSeconds)) throw new TypeError('MET must be finite')
  const compiled = compileNarrative(segments)
  const first = compiled[0]
  const last = compiled[compiled.length - 1]
  const clamped = Math.min(Math.max(metSeconds, first.metStart), last.metEnd)
  const segment = compiled.find((candidate) => clamped <= candidate.metEnd + EPSILON) ?? last
  const progress = (clamped - segment.metStart) / (segment.metEnd - segment.metStart)
  return segment.storyStartMs + Math.min(1, Math.max(0, progress)) * segment.storyDurationMs
}
