import assert from 'node:assert/strict'
import { test } from 'node:test'

import { assertMissionDefinition, validateMissionDefinition } from '../../src/mission-core/index.ts'
import type { MissionDefinition } from '../../src/mission-core/index.ts'
import { minimalMission } from '../fixtures/minimal-mission.ts'

function cloneMission(): MissionDefinition {
  return structuredClone(minimalMission)
}

function errorCodes(definition: MissionDefinition): string[] {
  return validateMissionDefinition(definition)
    .filter((item) => item.severity === 'error')
    .map((item) => item.code)
}

test('minimal mission fixture passes mission definition validation', () => {
  assert.deepEqual(validateMissionDefinition(minimalMission), [])
  assert.doesNotThrow(() => assertMissionDefinition(minimalMission))
})

test('planned-only source cannot silently support an actual fact', () => {
  const definition = cloneMission()
  const planned = definition.facts.find((fact) => fact.id === 'fixture-planned-label')
  assert.ok(planned && planned.kind === 'value')
  planned.evidence = 'actual'
  assert.ok(errorCodes(definition).includes('EVIDENCE_SOURCE_SCOPE'))
})

test('event evidence must be permitted by at least one cited source', () => {
  const definition = cloneMission()
  definition.events[0].evidence = 'planned'
  assert.ok(errorCodes(definition).includes('EVENT_SOURCE_SCOPE'))
})

test('derived value cannot depend on an unknown input', () => {
  const definition = cloneMission()
  const derived = definition.facts.find((fact) => fact.id === 'fixture-distance-total')
  assert.ok(derived && derived.kind === 'value' && derived.derivation)
  derived.derivation.inputFactIds = ['unknown-input']
  assert.ok(errorCodes(definition).includes('UNKNOWN_DERIVATION_INPUT'))
})

test('derived value cannot use a missing input', () => {
  const definition = cloneMission()
  const input = definition.facts.find((fact) => fact.id === 'fixture-distance-a')
  assert.ok(input)
  definition.facts[definition.facts.indexOf(input)] = {
    kind: 'missing',
    id: input.id,
    reason: 'not-available-in-source',
    unit: 'm',
    citations: [],
  }
  assert.ok(errorCodes(definition).includes('MISSING_DERIVATION_INPUT'))
})

test('unsorted events fail validation', () => {
  const definition = cloneMission()
  definition.events.reverse()
  assert.ok(errorCodes(definition).includes('UNSORTED_EVENTS'))
})

test('conflicting actions at the same MET fail validation', () => {
  const definition = cloneMission()
  definition.events.push({
    id: 'fixture-conflict',
    metSeconds: 30,
    label: 'CONFLICT',
    tier: 'detail',
    evidence: 'actual',
    citations: [{ sourceId: 'TEST-ACTUAL', locator: 'fixture table row 1' }],
    actions: [
      {
        type: 'set-component-lifecycle',
        componentId: 'fixture-payload',
        lifecycle: 'discarded',
      },
    ],
  })
  assert.ok(errorCodes(definition).includes('CONFLICTING_EVENT_ACTIONS'))
})

test('component parent cycles fail validation', () => {
  const definition = cloneMission()
  const carrier = definition.vehicle.components.find((item) => item.id === 'fixture-carrier')
  assert.ok(carrier)
  carrier.initialState.parentId = 'fixture-payload'
  assert.ok(errorCodes(definition).includes('COMPONENT_PARENT_CYCLE'))
})

test('event parent assignments cannot create a component cycle', () => {
  const definition = cloneMission()
  definition.events[0].actions.push({
    type: 'set-component-parent',
    componentId: 'fixture-carrier',
    parentId: 'fixture-payload',
  })
  assert.ok(errorCodes(definition).includes('EVENT_COMPONENT_PARENT_CYCLE'))
})

test('telemetry quantity and units must agree', () => {
  const definition = cloneMission()
  definition.telemetry[0].quantity = 'mass'
  assert.ok(errorCodes(definition).includes('TELEMETRY_UNIT_QUANTITY'))
})

test('assertMissionDefinition reports actionable error codes', () => {
  const definition = cloneMission()
  definition.initialPhaseId = 'unknown-phase'
  assert.throws(() => assertMissionDefinition(definition), /UNKNOWN_INITIAL_PHASE/)
})

test('event MET Fact ID must be a numeric SI-second value', () => {
  const definition = cloneMission()
  definition.events[0].metFactId = 'fixture-distance-a'
  assert.ok(errorCodes(definition).includes('INVALID_EVENT_MET_FACT'))
})

test('reconstructed semantic components require a method note', () => {
  const definition = cloneMission()
  definition.vehicle.components[0].evidence = 'reconstructed'
  assert.ok(errorCodes(definition).includes('COMPONENT_WITHOUT_METHOD'))
})

test('terminal component lifecycle cannot retain a burning engine', () => {
  const broken = structuredClone(minimalMission)
  broken.events
    .at(-1)!
    .actions.push(
      { type: 'set-component-lifecycle', componentId: 'fixture-carrier', lifecycle: 'discarded' },
      { type: 'set-engine-mode', componentId: 'fixture-carrier', engineMode: 'burning' },
    )

  const issues = validateMissionDefinition(broken)
  assert.ok(issues.some((item) => item.code === 'TERMINAL_COMPONENT_BURNING'))
})
