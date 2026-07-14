export const UNIT_DEFINITIONS = {
  unitless: { quantity: 'dimensionless', toSiFactor: 1 },
  s: { quantity: 'time', toSiFactor: 1 },
  ms: { quantity: 'time', toSiFactor: 0.001 },
  m: { quantity: 'length', toSiFactor: 1 },
  km: { quantity: 'length', toSiFactor: 1000 },
  ft: { quantity: 'length', toSiFactor: 0.3048 },
  nmi: { quantity: 'length', toSiFactor: 1852 },
  'm/s': { quantity: 'speed', toSiFactor: 1 },
  'km/s': { quantity: 'speed', toSiFactor: 1000 },
  'ft/s': { quantity: 'speed', toSiFactor: 0.3048 },
  kg: { quantity: 'mass', toSiFactor: 1 },
  lb: { quantity: 'mass', toSiFactor: 0.45359237 },
  Pa: { quantity: 'pressure', toSiFactor: 1 },
  kPa: { quantity: 'pressure', toSiFactor: 1000 },
  psi: { quantity: 'pressure', toSiFactor: 6894.757293168 },
  rad: { quantity: 'angle', toSiFactor: 1 },
  deg: { quantity: 'angle', toSiFactor: Math.PI / 180 },
} as const

export type UnitId = keyof typeof UNIT_DEFINITIONS
export type QuantityKind = (typeof UNIT_DEFINITIONS)[UnitId]['quantity']

export const SI_UNIT_IDS = ['unitless', 's', 'm', 'm/s', 'kg', 'Pa', 'rad'] as const
export type SiUnitId = (typeof SI_UNIT_IDS)[number]

export function quantityForUnit(unit: UnitId): QuantityKind {
  return UNIT_DEFINITIONS[unit].quantity
}

export function toSi(value: number, unit: UnitId): number {
  return value * UNIT_DEFINITIONS[unit].toSiFactor
}

export function fromSi(value: number, unit: UnitId): number {
  return value / UNIT_DEFINITIONS[unit].toSiFactor
}

export function convertUnit(value: number, from: UnitId, to: UnitId): number {
  if (quantityForUnit(from) !== quantityForUnit(to)) {
    throw new TypeError(`Cannot convert ${from} to incompatible unit ${to}`)
  }
  return fromSi(toSi(value, from), to)
}
