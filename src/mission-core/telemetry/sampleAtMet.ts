import { mergeCitations } from '../provenance/citations.ts'
import { createMissingValue } from '../provenance/values.ts'
import type { EvidenceValue, MissingValue } from '../types/provenance.ts'
import type { TelemetryChannel } from '../types/telemetry.ts'

function missing(channel: TelemetryChannel, metSeconds: number, note: string): MissingValue {
  return createMissingValue({
    id: `${channel.id}:missing:${metSeconds}`,
    reason: 'not-available-in-source',
    unit: channel.unit,
    note,
  })
}

export function sampleTelemetryAtMet(
  channel: TelemetryChannel,
  metSeconds: number,
): EvidenceValue<number> {
  if (!Number.isFinite(metSeconds)) throw new TypeError('MET must be finite')
  const samples = [...channel.samples].sort((left, right) => left.metSeconds - right.metSeconds)
  const exact = samples.find((sample) => sample.metSeconds === metSeconds)
  if (exact) return exact.reading

  const before = [...samples].reverse().find((sample) => sample.metSeconds < metSeconds)
  const after = samples.find((sample) => sample.metSeconds > metSeconds)
  if (!before || !after) return missing(channel, metSeconds, 'Outside cited sample bounds')
  if (channel.interpolation === 'none') {
    return missing(channel, metSeconds, 'Channel does not permit interpolation')
  }
  if (before.reading.kind === 'missing' || after.reading.kind === 'missing') {
    return missing(channel, metSeconds, 'Interpolation boundary is missing')
  }

  const progress = (metSeconds - before.metSeconds) / (after.metSeconds - before.metSeconds)
  return {
    kind: 'value',
    id: `${channel.id}:interpolated:${metSeconds}`,
    value: before.reading.value + (after.reading.value - before.reading.value) * progress,
    unit: channel.unit,
    evidence: 'interpolated',
    citations: mergeCitations(before.reading.citations, after.reading.citations),
    interpolation: {
      method: 'linear',
      beforeFactId: before.reading.id,
      afterFactId: after.reading.id,
      metStart: before.metSeconds,
      metEnd: after.metSeconds,
    },
  }
}
