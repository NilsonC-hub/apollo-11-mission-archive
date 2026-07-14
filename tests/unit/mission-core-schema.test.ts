import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  assertMissionDefinitionCandidate,
  MISSION_DEFINITION_SCHEMA,
  validateMissionDefinitionCandidate,
} from '../../src/mission-core/index.ts'
import { minimalMission } from '../fixtures/minimal-mission.ts'

test('mission definition schema is explicitly versioned', () => {
  assert.equal(MISSION_DEFINITION_SCHEMA.version, 1)
  assert.ok(MISSION_DEFINITION_SCHEMA.required.includes('events'))
})

test('candidate validation accepts the task-neutral fixture', () => {
  assert.deepEqual(validateMissionDefinitionCandidate(minimalMission), [])
  assert.doesNotThrow(() => assertMissionDefinitionCandidate(minimalMission))
})

test('candidate validation reports malformed unknown input without throwing', () => {
  const malformed: unknown = {
    id: 'malformed',
    meta: null,
    events: [{ id: 42 }],
  }
  assert.doesNotThrow(() => validateMissionDefinitionCandidate(malformed))
  const issues = validateMissionDefinitionCandidate(malformed)
  assert.ok(issues.length > 0)
  assert.ok(issues.every((issue) => issue.code === 'SCHEMA_TYPE'))
  assert.ok(issues.some((issue) => issue.path === '$.meta'))
  assert.ok(issues.some((issue) => issue.path === '$.events[0].id'))
})

test('candidate validation rejects invalid enums before semantic validation', () => {
  const candidate = structuredClone(minimalMission) as unknown as Record<string, unknown>
  const telemetry = candidate.telemetry as Array<Record<string, unknown>>
  telemetry[0].unit = 'furlong'
  const issues = validateMissionDefinitionCandidate(candidate)
  assert.ok(
    issues.some((issue) => issue.code === 'SCHEMA_TYPE' && issue.path === '$.telemetry[0].unit'),
  )
})

test('candidate validation rejects ignition as a persistent engine state', () => {
  const candidate = structuredClone(minimalMission) as unknown as Record<string, unknown>
  const vehicle = candidate.vehicle as {
    components: Array<{ initialState: { engineMode: string } }>
  }
  vehicle.components[0].initialState.engineMode = 'ignition'
  const issues = validateMissionDefinitionCandidate(candidate)
  assert.ok(
    issues.some(
      (issue) =>
        issue.code === 'SCHEMA_TYPE' &&
        issue.path === '$.vehicle.components[0].initialState.engineMode',
    ),
  )
})

test('candidate event actions reject set-engine-mode ignition directly', () => {
  const candidate = structuredClone(minimalMission) as unknown as Record<string, unknown>
  const events = candidate.events as Array<{ actions: Array<Record<string, unknown>> }>
  events[0].actions[0] = {
    type: 'set-engine-mode',
    componentId: 'fixture-carrier',
    engineMode: 'ignition',
  }
  const issues = validateMissionDefinitionCandidate(candidate)
  assert.ok(
    issues.some(
      (issue) => issue.code === 'SCHEMA_TYPE' && issue.path === '$.events[0].actions[0].engineMode',
    ),
  )
})
