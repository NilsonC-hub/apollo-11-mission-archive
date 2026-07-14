import type { MissionEvent } from '../types/events.ts'

export function eventAtOrBefore(
  events: readonly MissionEvent[],
  metSeconds: number,
): MissionEvent | undefined {
  let selected: MissionEvent | undefined
  for (const event of events) {
    if (event.metSeconds > metSeconds) break
    selected = event
  }
  return selected
}

export function nextEventAfter(
  events: readonly MissionEvent[],
  metSeconds: number,
): MissionEvent | undefined {
  return events.find((event) => event.metSeconds > metSeconds)
}
