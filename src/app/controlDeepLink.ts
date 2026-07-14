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

export function controlMetPath(metSeconds: number): string {
  if (!Number.isFinite(metSeconds)) throw new TypeError('Control MET must be finite')

  const sign = metSeconds < 0 ? '-' : ''
  const decimal = expandDecimal(Math.abs(metSeconds).toString())
  const wholeSeconds = BigInt(decimal.whole)
  const hours = wholeSeconds / 3600n
  const remainder = wholeSeconds % 3600n
  const minutes = remainder / 60n
  const seconds = remainder % 60n
  const fraction = decimal.fraction ? `.${decimal.fraction}` : ''
  const formatted = `${sign}${hours.toString().padStart(3, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}${fraction}`
  return `/control/met/${encodeURIComponent(formatted)}`
}

function expandDecimal(value: string): { whole: string; fraction: string } {
  const [coefficient, exponentToken] = value.toLowerCase().split('e')
  const exponent = exponentToken ? Number(exponentToken) : 0
  const point = coefficient.indexOf('.')
  const digits = coefficient.replace('.', '')
  const decimalIndex = (point === -1 ? coefficient.length : point) + exponent

  if (decimalIndex <= 0) {
    return { whole: '0', fraction: `${'0'.repeat(-decimalIndex)}${digits}` }
  }
  if (decimalIndex >= digits.length) {
    return { whole: `${digits}${'0'.repeat(decimalIndex - digits.length)}`, fraction: '' }
  }
  return {
    whole: digits.slice(0, decimalIndex),
    fraction: digits.slice(decimalIndex),
  }
}

export function controlEventPath(eventId: string): string {
  return `/control/event/${encodeURIComponent(eventId)}`
}
