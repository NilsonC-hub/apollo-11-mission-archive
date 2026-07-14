import assert from 'node:assert/strict'
import { test } from 'node:test'

import { convertUnit, fromSi, quantityForUnit, toSi } from '../../src/mission-core/index.ts'

test('length display units convert through SI', () => {
  assert.equal(toSi(1, 'km'), 1000)
  assert.equal(fromSi(1852, 'nmi'), 1)
  assert.ok(Math.abs(convertUnit(1, 'ft', 'm') - 0.3048) < 1e-12)
})

test('angle conversion uses radians as SI', () => {
  assert.ok(Math.abs(convertUnit(180, 'deg', 'rad') - Math.PI) < 1e-12)
})

test('incompatible quantities cannot be converted', () => {
  assert.equal(quantityForUnit('kg'), 'mass')
  assert.throws(() => convertUnit(1, 'kg', 'm'), /incompatible unit/)
})
