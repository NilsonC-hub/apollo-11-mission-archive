import { parseMet } from '../mission-core/index.ts'
import { replayEvents } from './mission.ts'

export function metForControlPath(pathname: string): number | undefined {
  const eventMatch = /^\/control\/event\/([^/]+)\/?$/.exec(pathname)
  if (eventMatch) {
    const eventId = decodeURIComponent(eventMatch[1])
    return replayEvents.find((event) => event.id === eventId)?.metSeconds
  }

  const metMatch = /^\/control\/met\/([^/]+)\/?$/.exec(pathname)
  if (!metMatch) return undefined

  try {
    return parseMet(decodeURIComponent(metMatch[1]))
  } catch {
    return undefined
  }
}
