import type { MissionEpochs } from '../types/time.ts'
import type { MissionEvent } from '../types/events.ts'

const MET_PATTERN = /^([+-])?(\d+):([0-5]\d):([0-5]\d(?:\.\d+)?)$/

export interface FormatMetOptions {
  fractionDigits?: number
  minimumHourDigits?: number
  showPositiveSign?: boolean
}

export function parseMet(value: string): number {
  const match = MET_PATTERN.exec(value.trim())
  if (!match) throw new TypeError(`Invalid MET string: ${value}`)

  const [, signToken, hoursToken, minutesToken, secondsToken] = match
  const sign = signToken === '-' ? -1 : 1
  const hours = Number(hoursToken)
  const minutes = Number(minutesToken)
  const seconds = Number(secondsToken)
  return sign * (hours * 3600 + minutes * 60 + seconds)
}

export function formatMet(metSeconds: number, options: FormatMetOptions = {}): string {
  if (!Number.isFinite(metSeconds)) throw new TypeError('MET must be finite')

  const fractionDigits = options.fractionDigits ?? 0
  const minimumHourDigits = options.minimumHourDigits ?? 3
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 3) {
    throw new RangeError('fractionDigits must be an integer from 0 to 3')
  }

  const factor = 10 ** fractionDigits
  const rounded = Math.round(Math.abs(metSeconds) * factor) / factor
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded - hours * 3600) / 60)
  const seconds = rounded - hours * 3600 - minutes * 60
  const secondsWidth = fractionDigits === 0 ? 2 : 3 + fractionDigits
  const sign = metSeconds < 0 ? '-' : options.showPositiveSign ? '+' : ''

  return `${sign}${String(hours).padStart(minimumHourDigits, '0')}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(fractionDigits).padStart(secondsWidth, '0')}`
}

export function formatEventMet(
  event: Pick<MissionEvent, 'metSeconds' | 'precision' | 'displayFractionDigits'>,
): string {
  return formatMet(event.metSeconds, {
    fractionDigits: event.displayFractionDigits ?? (event.precision === 'tenth-second' ? 1 : 0),
  })
}

export function rangeZeroUtcMs(epochs: MissionEpochs): number {
  if (!epochs.rangeZeroUtc.endsWith('Z')) {
    throw new TypeError('rangeZeroUtc must be an explicit UTC ISO string ending in Z')
  }
  const parsed = Date.parse(epochs.rangeZeroUtc)
  if (!Number.isFinite(parsed)) throw new TypeError(`Invalid rangeZeroUtc: ${epochs.rangeZeroUtc}`)
  return parsed
}

export function metSecondsToUtcMs(epochs: MissionEpochs, metSeconds: number): number {
  if (!Number.isFinite(metSeconds)) throw new TypeError('MET must be finite')
  return rangeZeroUtcMs(epochs) + metSeconds * 1000
}

export function utcMsToMetSeconds(epochs: MissionEpochs, utcMs: number): number {
  if (!Number.isFinite(utcMs)) throw new TypeError('UTC milliseconds must be finite')
  return (utcMs - rangeZeroUtcMs(epochs)) / 1000
}

export function metSecondsToUtcIso(epochs: MissionEpochs, metSeconds: number): string {
  return new Date(metSecondsToUtcMs(epochs, metSeconds)).toISOString()
}
