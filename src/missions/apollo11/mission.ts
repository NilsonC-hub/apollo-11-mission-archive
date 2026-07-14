import type { MissionDefinition } from '../../mission-core/index.ts'

import { apollo11ArchiveChapters } from './archive/chapters.ts'
import { apollo11Epochs } from './epochs.ts'
import { apollo11Events } from './events.ts'
import { apollo11Facts } from './facts.ts'
import {
  apollo11AudioCandidates,
  apollo11ImageRecords,
  apollo11TranscriptRecords,
} from './media.ts'
import { apollo11Meta } from './meta.ts'
import { apollo11Narrative } from './narrative.ts'
import { apollo11PendingEvents, apollo11ResolvedEventAliases } from './pendingEvents.ts'
import { apollo11Phases } from './phases.ts'
import { apollo11Sources } from './sources.ts'
import { apollo11Telemetry, unavailableTelemetryChannels } from './telemetry.ts'
import { apollo11Vehicle } from './vehicle.ts'

export const apollo11Mission = {
  id: 'apollo11',
  meta: apollo11Meta,
  epochs: apollo11Epochs,
  events: apollo11Events,
  phases: apollo11Phases,
  initialPhaseId: 'prelaunch',
  narrative: apollo11Narrative,
  vehicle: apollo11Vehicle,
  telemetry: apollo11Telemetry,
  facts: apollo11Facts,
  sources: apollo11Sources,
  assets: { assets: [] },
} satisfies MissionDefinition

export const apollo11MissionPack = {
  definition: apollo11Mission,
  archive: {
    chapters: apollo11ArchiveChapters,
  },
  media: {
    transcripts: apollo11TranscriptRecords,
    images: apollo11ImageRecords,
    audioCandidates: apollo11AudioCandidates,
  },
  unavailable: {
    preciseEvents: apollo11PendingEvents,
    telemetryChannels: unavailableTelemetryChannels,
  },
  aliases: {
    events: apollo11ResolvedEventAliases,
  },
}
