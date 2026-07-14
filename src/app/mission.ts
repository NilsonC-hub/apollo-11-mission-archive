import { eventAtOrBefore, type CitationRef, type MissionEvent } from '../mission-core/index.ts'
import { apollo11MissionPack } from '../missions/apollo11/mission.ts'

export const mission = apollo11MissionPack.definition
export const missionPack = apollo11MissionPack

export const PHASE4_EVENT_IDS = [
  'a11-liftoff',
  'a11-sic-outboard-cutoff',
  'a11-sic-sii-separation',
  'a11-sii-ignition-command',
  'a11-les-jettison',
  'a11-sii-cutoff',
  'a11-sii-sivb-separation',
  'a11-sivb-first-ignition',
  'a11-sivb-first-cutoff',
  'a11-tli-ignition',
  'a11-csm-sivb-separation',
  'a11-first-docking',
  'a11-spacecraft-ejection',
] as const

const phase4Ids = new Set<string>(PHASE4_EVENT_IDS)

export const phase4Events = mission.events.filter((event) => phase4Ids.has(event.id))
export const phase4StartMet = 0
export const phase4EndMet = phase4Events.at(-1)!.metSeconds

export const replayEvents = mission.events
export const replayStartMet = 0
export const replayEndMet = getEvent('a11-splashdown').metSeconds

export const factsById = new Map(mission.facts.map((fact) => [fact.id, fact]))
export const sourcesById = new Map(mission.sources.sources.map((source) => [source.id, source]))
export const phasesById = new Map(mission.phases.map((phase) => [phase.id, phase]))

export function getEvent(id: string): MissionEvent {
  const event = mission.events.find((candidate) => candidate.id === id)
  if (!event) throw new TypeError(`Unknown Apollo 11 event ${id}`)
  return event
}

export function currentPhase4Event(metSeconds: number): MissionEvent | undefined {
  return eventAtOrBefore(phase4Events, metSeconds)
}

export function currentReplayEvent(metSeconds: number): MissionEvent | undefined {
  return eventAtOrBefore(replayEvents, metSeconds)
}

export function eventsForPhase(phaseId: string): MissionEvent[] {
  const phase = phasesById.get(phaseId)
  if (!phase) return []
  const startMet = phase.startEventId ? getEvent(phase.startEventId).metSeconds : replayStartMet
  const endMet = phase.endEventId ? getEvent(phase.endEventId).metSeconds : replayEndMet
  return replayEvents.filter((event) => event.metSeconds >= startMet && event.metSeconds <= endMet)
}

export function formatCitation(citation: CitationRef): string {
  const source = sourcesById.get(citation.sourceId)
  return [source?.title ?? citation.sourceId, citation.pages, citation.locator]
    .filter(Boolean)
    .join(' · ')
}
