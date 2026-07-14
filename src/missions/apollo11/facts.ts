import type { EvidenceValue } from '../../mission-core/index.ts'

import { apollo11EpochFacts } from './epochs.ts'
import { apollo11EventSeeds } from './eventSeeds.ts'
import { apollo11IdentityFacts } from './meta.ts'
import { apollo11TranscriptMetFacts } from './media.ts'
import { apollo11PendingEvents } from './pendingEvents.ts'

export const apollo11EventMetFacts = apollo11EventSeeds.map(
  (event) =>
    ({
      kind: 'value',
      id: `${event.id}-met`,
      value: event.metSeconds,
      unit: 's',
      evidence: 'actual',
      citations: event.citations,
    }) satisfies EvidenceValue<number>,
)

export const apollo11Facts: EvidenceValue<number | string>[] = [
  ...apollo11IdentityFacts,
  ...apollo11EpochFacts,
  ...apollo11EventMetFacts,
  ...apollo11TranscriptMetFacts,
  ...apollo11PendingEvents.map((event) => event.met),
]
