import type { MissionDefinition } from '../types/mission.ts'
import { EVIDENCE_CLASSES, MISSING_REASONS } from '../types/provenance.ts'
import { SI_UNIT_IDS, UNIT_DEFINITIONS } from '../types/units.ts'
import { validateMissionDefinition, type ValidationIssue } from './missionDefinition.ts'

export const MISSION_DEFINITION_SCHEMA = {
  id: 'mission-definition',
  version: 1,
  required: [
    'id',
    'meta',
    'epochs',
    'events',
    'phases',
    'initialPhaseId',
    'narrative',
    'vehicle',
    'telemetry',
    'facts',
    'sources',
    'assets',
  ],
} as const

type RecordValue = Record<string, unknown>

function schemaIssue(issues: ValidationIssue[], path: string, message: string): void {
  issues.push({ severity: 'error', code: 'SCHEMA_TYPE', path, message })
}

function recordAt(value: unknown, path: string, issues: ValidationIssue[]): RecordValue | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    schemaIssue(issues, path, 'Expected object')
    return null
  }
  return value as RecordValue
}

function arrayAt(value: unknown, path: string, issues: ValidationIssue[]): unknown[] | null {
  if (!Array.isArray(value)) {
    schemaIssue(issues, path, 'Expected array')
    return null
  }
  return value
}

function stringAt(value: unknown, path: string, issues: ValidationIssue[]): value is string {
  if (typeof value !== 'string') {
    schemaIssue(issues, path, 'Expected string')
    return false
  }
  return true
}

function numberAt(value: unknown, path: string, issues: ValidationIssue[]): value is number {
  if (typeof value !== 'number') {
    schemaIssue(issues, path, 'Expected number')
    return false
  }
  return true
}

function booleanAt(value: unknown, path: string, issues: ValidationIssue[]): value is boolean {
  if (typeof value !== 'boolean') {
    schemaIssue(issues, path, 'Expected boolean')
    return false
  }
  return true
}

function enumAt(
  value: unknown,
  allowed: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    schemaIssue(issues, path, `Expected one of: ${allowed.join(', ')}`)
  }
}

function optionalString(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value !== undefined) stringAt(value, path, issues)
}

function validateStringArray(value: unknown, path: string, issues: ValidationIssue[]): void {
  const items = arrayAt(value, path, issues)
  if (!items) return
  for (const [index, item] of items.entries()) stringAt(item, `${path}[${index}]`, issues)
}

function validateCitations(value: unknown, path: string, issues: ValidationIssue[]): void {
  const citations = arrayAt(value, path, issues)
  if (!citations) return
  for (const [index, candidate] of citations.entries()) {
    const citationPath = `${path}[${index}]`
    const citation = recordAt(candidate, citationPath, issues)
    if (!citation) continue
    stringAt(citation.sourceId, `${citationPath}.sourceId`, issues)
    optionalString(citation.pages, `${citationPath}.pages`, issues)
    optionalString(citation.locator, `${citationPath}.locator`, issues)
    optionalString(citation.note, `${citationPath}.note`, issues)
  }
}

function validateEvidenceValue(value: unknown, path: string, issues: ValidationIssue[]): void {
  const candidate = recordAt(value, path, issues)
  if (!candidate) return
  enumAt(candidate.kind, ['value', 'missing'], `${path}.kind`, issues)
  stringAt(candidate.id, `${path}.id`, issues)
  validateCitations(candidate.citations, `${path}.citations`, issues)
  if (candidate.unit !== undefined) enumAt(candidate.unit, SI_UNIT_IDS, `${path}.unit`, issues)

  if (candidate.kind === 'missing') {
    enumAt(candidate.reason, MISSING_REASONS, `${path}.reason`, issues)
    optionalString(candidate.note, `${path}.note`, issues)
    return
  }
  if (candidate.kind !== 'value') return

  if (typeof candidate.value !== 'number' && typeof candidate.value !== 'string') {
    schemaIssue(issues, `${path}.value`, 'Expected number or string')
  }
  enumAt(candidate.evidence, EVIDENCE_CLASSES, `${path}.evidence`, issues)
  optionalString(candidate.method, `${path}.method`, issues)
  if (candidate.derivation !== undefined) {
    const derivation = recordAt(candidate.derivation, `${path}.derivation`, issues)
    if (derivation) {
      stringAt(derivation.formula, `${path}.derivation.formula`, issues)
      validateStringArray(derivation.inputFactIds, `${path}.derivation.inputFactIds`, issues)
    }
  }
  if (candidate.interpolation !== undefined) {
    const interpolation = recordAt(candidate.interpolation, `${path}.interpolation`, issues)
    if (interpolation) {
      enumAt(interpolation.method, ['linear'], `${path}.interpolation.method`, issues)
      stringAt(interpolation.beforeFactId, `${path}.interpolation.beforeFactId`, issues)
      stringAt(interpolation.afterFactId, `${path}.interpolation.afterFactId`, issues)
      numberAt(interpolation.metStart, `${path}.interpolation.metStart`, issues)
      numberAt(interpolation.metEnd, `${path}.interpolation.metEnd`, issues)
    }
  }
}

function validateAction(value: unknown, path: string, issues: ValidationIssue[]): void {
  const action = recordAt(value, path, issues)
  if (!action) return
  enumAt(
    action.type,
    [
      'set-phase',
      'set-component-lifecycle',
      'set-component-parent',
      'set-component-visibility',
      'set-engine-mode',
      'record-engine-ignition',
    ],
    `${path}.type`,
    issues,
  )
  if (action.type === 'set-phase') {
    stringAt(action.phaseId, `${path}.phaseId`, issues)
    return
  }
  stringAt(action.componentId, `${path}.componentId`, issues)
  if (action.type === 'set-component-lifecycle') {
    enumAt(
      action.lifecycle,
      ['attached', 'separating', 'free', 'discarded', 'landed'],
      `${path}.lifecycle`,
      issues,
    )
  } else if (action.type === 'set-component-parent') {
    if (action.parentId !== null) stringAt(action.parentId, `${path}.parentId`, issues)
  } else if (action.type === 'set-component-visibility') {
    booleanAt(action.visible, `${path}.visible`, issues)
  } else if (action.type === 'set-engine-mode') {
    enumAt(action.engineMode, ['off', 'burning', 'cutoff'], `${path}.engineMode`, issues)
  }
}

function validateEvents(value: unknown, path: string, issues: ValidationIssue[]): void {
  const events = arrayAt(value, path, issues)
  if (!events) return
  for (const [index, value] of events.entries()) {
    const eventPath = `${path}[${index}]`
    const event = recordAt(value, eventPath, issues)
    if (!event) continue
    stringAt(event.id, `${eventPath}.id`, issues)
    optionalString(event.metFactId, `${eventPath}.metFactId`, issues)
    numberAt(event.metSeconds, `${eventPath}.metSeconds`, issues)
    optionalString(event.utc, `${eventPath}.utc`, issues)
    stringAt(event.label, `${eventPath}.label`, issues)
    enumAt(event.tier, ['major', 'minor', 'detail'], `${eventPath}.tier`, issues)
    enumAt(event.evidence, EVIDENCE_CLASSES, `${eventPath}.evidence`, issues)
    validateCitations(event.citations, `${eventPath}.citations`, issues)
    const actions = arrayAt(event.actions, `${eventPath}.actions`, issues)
    actions?.forEach((action, actionIndex) =>
      validateAction(action, `${eventPath}.actions[${actionIndex}]`, issues),
    )
    if (event.precision !== undefined) {
      enumAt(
        event.precision,
        ['second', 'tenth-second', 'source-rounded'],
        `${eventPath}.precision`,
        issues,
      )
    }
    if (event.displayFractionDigits !== undefined) {
      const path = `${eventPath}.displayFractionDigits`
      if (
        numberAt(event.displayFractionDigits, path, issues) &&
        (!Number.isInteger(event.displayFractionDigits) ||
          event.displayFractionDigits < 0 ||
          event.displayFractionDigits > 3)
      ) {
        schemaIssue(issues, path, 'Expected an integer from 0 to 3')
      }
    }
  }
}

function validateMissionShape(candidate: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const definition = recordAt(candidate, '$', issues)
  if (!definition) return issues

  stringAt(definition.id, '$.id', issues)
  stringAt(definition.initialPhaseId, '$.initialPhaseId', issues)

  const meta = recordAt(definition.meta, '$.meta', issues)
  if (meta) {
    stringAt(meta.id, '$.meta.id', issues)
    stringAt(meta.name, '$.meta.name', issues)
    optionalString(meta.description, '$.meta.description', issues)
    if (meta.factIds !== undefined) validateStringArray(meta.factIds, '$.meta.factIds', issues)
  }
  const epochs = recordAt(definition.epochs, '$.epochs', issues)
  if (epochs) {
    stringAt(epochs.rangeZeroUtc, '$.epochs.rangeZeroUtc', issues)
    numberAt(epochs.liftoffMetSeconds, '$.epochs.liftoffMetSeconds', issues)
    enumAt(epochs.displayPrecision, ['source-preserved'], '$.epochs.displayPrecision', issues)
  }

  validateEvents(definition.events, '$.events', issues)

  const phases = arrayAt(definition.phases, '$.phases', issues)
  phases?.forEach((value, index) => {
    const path = `$.phases[${index}]`
    const phase = recordAt(value, path, issues)
    if (!phase) return
    stringAt(phase.id, `${path}.id`, issues)
    stringAt(phase.label, `${path}.label`, issues)
    optionalString(phase.startEventId, `${path}.startEventId`, issues)
    optionalString(phase.endEventId, `${path}.endEventId`, issues)
  })

  const narrative = arrayAt(definition.narrative, '$.narrative', issues)
  narrative?.forEach((value, index) => {
    const path = `$.narrative[${index}]`
    const segment = recordAt(value, path, issues)
    if (!segment) return
    stringAt(segment.id, `${path}.id`, issues)
    numberAt(segment.metStart, `${path}.metStart`, issues)
    numberAt(segment.metEnd, `${path}.metEnd`, issues)
    numberAt(segment.storyDurationMs, `${path}.storyDurationMs`, issues)
    enumAt(segment.easing, ['linear'], `${path}.easing`, issues)
    if (segment.presentationPauseMs !== undefined) {
      numberAt(segment.presentationPauseMs, `${path}.presentationPauseMs`, issues)
    }
  })

  const vehicle = recordAt(definition.vehicle, '$.vehicle', issues)
  if (vehicle) {
    validateStringArray(vehicle.rootComponentIds, '$.vehicle.rootComponentIds', issues)
    const components = arrayAt(vehicle.components, '$.vehicle.components', issues)
    components?.forEach((value, index) => {
      const path = `$.vehicle.components[${index}]`
      const component = recordAt(value, path, issues)
      if (!component) return
      stringAt(component.id, `${path}.id`, issues)
      stringAt(component.label, `${path}.label`, issues)
      if (component.detachable !== undefined) {
        booleanAt(component.detachable, `${path}.detachable`, issues)
      }
      if (component.sourceIds !== undefined) {
        validateStringArray(component.sourceIds, `${path}.sourceIds`, issues)
      }
      if (component.evidence !== undefined) {
        enumAt(component.evidence, EVIDENCE_CLASSES, `${path}.evidence`, issues)
      }
      optionalString(component.method, `${path}.method`, issues)
      const state = recordAt(component.initialState, `${path}.initialState`, issues)
      if (!state) return
      enumAt(
        state.lifecycle,
        ['attached', 'separating', 'free', 'discarded', 'landed'],
        `${path}.initialState.lifecycle`,
        issues,
      )
      if (state.parentId !== null) {
        stringAt(state.parentId, `${path}.initialState.parentId`, issues)
      }
      booleanAt(state.visible, `${path}.initialState.visible`, issues)
      if (state.engineMode !== undefined) {
        enumAt(
          state.engineMode,
          ['off', 'burning', 'cutoff', 'unknown'],
          `${path}.initialState.engineMode`,
          issues,
        )
      }
      if (state.engineStateBasis !== undefined) {
        enumAt(
          state.engineStateBasis,
          ['known', 'point-event', 'terminal'],
          `${path}.initialState.engineStateBasis`,
          issues,
        )
      }
      if (state.lastKnownEngineMode !== undefined) {
        enumAt(
          state.lastKnownEngineMode,
          ['off', 'burning', 'cutoff'],
          `${path}.initialState.lastKnownEngineMode`,
          issues,
        )
      }
    })
  }

  const telemetry = arrayAt(definition.telemetry, '$.telemetry', issues)
  telemetry?.forEach((value, channelIndex) => {
    const path = `$.telemetry[${channelIndex}]`
    const channel = recordAt(value, path, issues)
    if (!channel) return
    stringAt(channel.id, `${path}.id`, issues)
    stringAt(channel.label, `${path}.label`, issues)
    enumAt(
      channel.quantity,
      [...new Set(Object.values(UNIT_DEFINITIONS).map((u) => u.quantity))],
      `${path}.quantity`,
      issues,
    )
    enumAt(channel.unit, SI_UNIT_IDS, `${path}.unit`, issues)
    enumAt(channel.interpolation, ['none', 'linear'], `${path}.interpolation`, issues)
    const samples = arrayAt(channel.samples, `${path}.samples`, issues)
    samples?.forEach((value, sampleIndex) => {
      const samplePath = `${path}.samples[${sampleIndex}]`
      const sample = recordAt(value, samplePath, issues)
      if (!sample) return
      numberAt(sample.metSeconds, `${samplePath}.metSeconds`, issues)
      validateEvidenceValue(sample.reading, `${samplePath}.reading`, issues)
    })
  })

  const facts = arrayAt(definition.facts, '$.facts', issues)
  facts?.forEach((value, index) => validateEvidenceValue(value, `$.facts[${index}]`, issues))

  const sources = recordAt(definition.sources, '$.sources', issues)
  if (sources) {
    const records = arrayAt(sources.sources, '$.sources.sources', issues)
    records?.forEach((value, index) => {
      const path = `$.sources.sources[${index}]`
      const source = recordAt(value, path, issues)
      if (!source) return
      stringAt(source.id, `${path}.id`, issues)
      enumAt(
        source.kind,
        ['pdf', 'web', 'image', 'audio', 'model', 'dataset'],
        `${path}.kind`,
        issues,
      )
      stringAt(source.title, `${path}.title`, issues)
      stringAt(source.publisher, `${path}.publisher`, issues)
      stringAt(source.originalUrl, `${path}.originalUrl`, issues)
      stringAt(source.accessedAt, `${path}.accessedAt`, issues)
      stringAt(source.rightsStatus, `${path}.rightsStatus`, issues)
      if (source.allowedEvidence !== undefined) {
        const values = arrayAt(source.allowedEvidence, `${path}.allowedEvidence`, issues)
        values?.forEach((item, itemIndex) =>
          enumAt(item, EVIDENCE_CLASSES, `${path}.allowedEvidence[${itemIndex}]`, issues),
        )
      }
    })
  }

  const assets = recordAt(definition.assets, '$.assets', issues)
  if (assets) {
    const records = arrayAt(assets.assets, '$.assets.assets', issues)
    records?.forEach((value, index) => {
      const path = `$.assets.assets[${index}]`
      const asset = recordAt(value, path, issues)
      if (!asset) return
      stringAt(asset.id, `${path}.id`, issues)
      stringAt(asset.sourceId, `${path}.sourceId`, issues)
      enumAt(asset.kind, ['image', 'audio', 'model', 'texture', 'fallback'], `${path}.kind`, issues)
      enumAt(asset.evidence, EVIDENCE_CLASSES, `${path}.evidence`, issues)
    })
  }

  return issues
}

export function validateMissionDefinitionCandidate(candidate: unknown): ValidationIssue[] {
  const schemaIssues = validateMissionShape(candidate)
  if (schemaIssues.length > 0) return schemaIssues
  return validateMissionDefinition(candidate as MissionDefinition)
}

export function assertMissionDefinitionCandidate(
  candidate: unknown,
): asserts candidate is MissionDefinition {
  const errors = validateMissionDefinitionCandidate(candidate).filter(
    (issue) => issue.severity === 'error',
  )
  if (errors.length > 0) {
    throw new TypeError(
      errors.map((issue) => `${issue.code} ${issue.path}: ${issue.message}`).join('\n'),
    )
  }
}
