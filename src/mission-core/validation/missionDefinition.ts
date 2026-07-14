import { compileNarrative } from '../narrative/mapping.ts'
import { stateAtMet } from '../state-machine/stateAtMet.ts'
import type { MissionAction, MissionEvent } from '../types/events.ts'
import type { MissionDefinition, SourceRecord } from '../types/mission.ts'
import type { CitationRef, EvidenceValue, SourcedValue } from '../types/provenance.ts'
import { quantityForUnit } from '../types/units.ts'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  code: string
  path: string
  message: string
}

function issue(
  issues: ValidationIssue[],
  code: string,
  path: string,
  message: string,
  severity: ValidationIssue['severity'] = 'error',
): void {
  issues.push({ severity, code, path, message })
}

function duplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  }
  return [...duplicates]
}

function validateCitations(
  citations: readonly CitationRef[],
  path: string,
  sources: Map<string, SourceRecord>,
  issues: ValidationIssue[],
): void {
  for (const [index, citation] of citations.entries()) {
    const citationPath = `${path}.citations[${index}]`
    if (!sources.has(citation.sourceId)) {
      issue(issues, 'UNKNOWN_SOURCE', citationPath, `Unknown source ${citation.sourceId}`)
    }
    if (!citation.pages && !citation.locator) {
      issue(
        issues,
        'CITATION_WITHOUT_LOCATOR',
        citationPath,
        'Citation must include pages or locator',
      )
    }
  }
}

function requiresCitation(value: SourcedValue<number | string>): boolean {
  return value.evidence !== 'schematic'
}

function validateEvidenceValue(
  value: EvidenceValue<number | string>,
  path: string,
  sources: Map<string, SourceRecord>,
  values: Map<string, EvidenceValue<number | string>>,
  issues: ValidationIssue[],
): void {
  if (!value.id) issue(issues, 'MISSING_VALUE_ID', path, 'Evidence value must have an id')
  validateCitations(value.citations, path, sources, issues)

  if (value.kind === 'missing') return
  if (typeof value.value === 'number' && !Number.isFinite(value.value)) {
    issue(issues, 'NON_FINITE_VALUE', path, 'Numeric evidence value must be finite')
  }
  if (requiresCitation(value) && value.citations.length === 0) {
    issue(issues, 'MISSING_CITATION', path, `${value.evidence} value requires a citation`)
  }
  if ((value.evidence === 'schematic' || value.evidence === 'reconstructed') && !value.method) {
    issue(
      issues,
      'AUTHORED_VALUE_WITHOUT_METHOD',
      path,
      `${value.evidence} value requires a method note`,
    )
  }
  if (value.evidence === 'derived') {
    if (!value.derivation?.formula || value.derivation.inputFactIds.length === 0) {
      issue(issues, 'INVALID_DERIVATION', path, 'Derived value requires formula and input facts')
    } else {
      for (const inputId of value.derivation.inputFactIds) {
        const input = values.get(inputId)
        if (!input) issue(issues, 'UNKNOWN_DERIVATION_INPUT', path, `Unknown input ${inputId}`)
        else if (input.kind === 'missing') {
          issue(issues, 'MISSING_DERIVATION_INPUT', path, `Input ${inputId} is missing`)
        }
      }
    }
  }
  if (value.evidence === 'interpolated') {
    const interpolation = value.interpolation
    if (!interpolation || interpolation.metEnd <= interpolation.metStart) {
      issue(
        issues,
        'INVALID_INTERPOLATION',
        path,
        'Interpolated value requires ordered sample bounds',
      )
    } else {
      for (const inputId of [interpolation.beforeFactId, interpolation.afterFactId]) {
        const input = values.get(inputId)
        if (!input) issue(issues, 'UNKNOWN_INTERPOLATION_INPUT', path, `Unknown input ${inputId}`)
        else if (input.kind === 'missing') {
          issue(issues, 'MISSING_INTERPOLATION_INPUT', path, `Input ${inputId} is missing`)
        }
      }
    }
  }

  const citedSources = value.citations
    .map((citation) => sources.get(citation.sourceId))
    .filter((source): source is SourceRecord => source !== undefined)
  if (
    citedSources.length > 0 &&
    citedSources.every(
      (source) => source.allowedEvidence && !source.allowedEvidence.includes(value.evidence),
    )
  ) {
    issue(
      issues,
      'EVIDENCE_SOURCE_SCOPE',
      path,
      `No cited source permits evidence class ${value.evidence}`,
    )
  }
}

function actionTarget(action: MissionAction): string {
  if (action.type === 'set-phase') return 'phase'
  if (action.type === 'set-component-lifecycle') return `${action.componentId}:lifecycle`
  if (action.type === 'set-component-parent') return `${action.componentId}:parent`
  if (action.type === 'set-component-visibility') return `${action.componentId}:visibility`
  return `${action.componentId}:engine`
}

function validateEventConflicts(events: readonly MissionEvent[], issues: ValidationIssue[]): void {
  const assignments = new Map<string, string>()
  for (const [eventIndex, event] of events.entries()) {
    for (const [actionIndex, action] of event.actions.entries()) {
      const key = `${event.metSeconds}:${actionTarget(action)}`
      const serialized = JSON.stringify(action)
      const previous = assignments.get(key)
      if (previous && previous !== serialized) {
        issue(
          issues,
          'CONFLICTING_EVENT_ACTIONS',
          `events[${eventIndex}].actions[${actionIndex}]`,
          `Conflicting actions target ${actionTarget(action)} at the same MET`,
        )
      }
      assignments.set(key, serialized)
    }
  }
}

function parentCycleFrom(
  componentId: string,
  parents: ReadonlyMap<string, string | null>,
): string | null {
  const visited = new Set<string>([componentId])
  let cursor = parents.get(componentId) ?? null
  while (cursor !== null) {
    if (visited.has(cursor)) return cursor
    visited.add(cursor)
    cursor = parents.get(cursor) ?? null
  }
  return null
}

function validateEventParentCycles(
  definition: MissionDefinition,
  componentIds: ReadonlySet<string>,
  issues: ValidationIssue[],
): void {
  const parents = new Map(
    definition.vehicle.components.map((component) => [
      component.id,
      component.initialState.parentId,
    ]),
  )

  for (const [eventIndex, event] of definition.events.entries()) {
    for (const [actionIndex, action] of event.actions.entries()) {
      if (
        action.type !== 'set-component-parent' ||
        !componentIds.has(action.componentId) ||
        (action.parentId !== null && !componentIds.has(action.parentId))
      ) {
        continue
      }
      parents.set(action.componentId, action.parentId)
      const cycleAt = parentCycleFrom(action.componentId, parents)
      if (cycleAt !== null) {
        issue(
          issues,
          'EVENT_COMPONENT_PARENT_CYCLE',
          `events[${eventIndex}].actions[${actionIndex}]`,
          `Parent assignment creates a cycle including ${cycleAt}`,
        )
      }
    }
  }
}

export function validateMissionDefinition(definition: MissionDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const sources = new Map(definition.sources.sources.map((source) => [source.id, source]))
  const evidenceValues: EvidenceValue<number | string>[] = [
    ...definition.facts,
    ...definition.telemetry.flatMap((channel) => channel.samples.map((sample) => sample.reading)),
  ]
  const values = new Map(evidenceValues.map((value) => [value.id, value]))
  const eventIds = new Set(definition.events.map((event) => event.id))
  const phaseIds = new Set(definition.phases.map((phase) => phase.id))
  const componentIds = new Set(definition.vehicle.components.map((component) => component.id))

  if (definition.id !== definition.meta.id) {
    issue(issues, 'MISSION_ID_MISMATCH', 'meta.id', 'Definition and metadata ids must match')
  }
  for (const [index, factId] of (definition.meta.factIds ?? []).entries()) {
    if (!values.has(factId)) {
      issue(issues, 'UNKNOWN_META_FACT', `meta.factIds[${index}]`, `Unknown fact ${factId}`)
    }
  }
  for (const id of duplicateIds(definition.sources.sources.map((source) => source.id))) {
    issue(issues, 'DUPLICATE_SOURCE_ID', 'sources', `Duplicate source id ${id}`)
  }
  for (const id of duplicateIds(evidenceValues.map((value) => value.id))) {
    issue(issues, 'DUPLICATE_VALUE_ID', 'facts', `Duplicate evidence value id ${id}`)
  }
  for (const id of duplicateIds(definition.events.map((event) => event.id))) {
    issue(issues, 'DUPLICATE_EVENT_ID', 'events', `Duplicate event id ${id}`)
  }
  for (const id of duplicateIds(definition.phases.map((phase) => phase.id))) {
    issue(issues, 'DUPLICATE_PHASE_ID', 'phases', `Duplicate phase id ${id}`)
  }
  for (const id of duplicateIds(definition.vehicle.components.map((component) => component.id))) {
    issue(issues, 'DUPLICATE_COMPONENT_ID', 'vehicle.components', `Duplicate component id ${id}`)
  }

  for (const [index, value] of evidenceValues.entries()) {
    validateEvidenceValue(value, `evidence[${index}]`, sources, values, issues)
  }

  for (const [index, event] of definition.events.entries()) {
    const path = `events[${index}]`
    if (!Number.isFinite(event.metSeconds)) {
      issue(issues, 'NON_FINITE_EVENT_MET', path, 'Event MET must be finite')
    }
    if (index > 0 && event.metSeconds < definition.events[index - 1].metSeconds) {
      issue(issues, 'UNSORTED_EVENTS', path, 'Events must be sorted by non-decreasing MET')
    }
    if (event.evidence !== 'schematic' && event.citations.length === 0) {
      issue(issues, 'EVENT_WITHOUT_CITATION', path, `${event.evidence} event requires citation`)
    }
    if (event.metFactId) {
      const metFact = values.get(event.metFactId)
      if (!metFact) {
        issue(issues, 'UNKNOWN_EVENT_MET_FACT', path, `Unknown MET fact ${event.metFactId}`)
      } else if (
        metFact.kind === 'missing' ||
        typeof metFact.value !== 'number' ||
        metFact.unit !== 's'
      ) {
        issue(
          issues,
          'INVALID_EVENT_MET_FACT',
          path,
          'Event MET fact must be a numeric SI-second value',
        )
      } else if (metFact.value !== event.metSeconds || metFact.evidence !== event.evidence) {
        issue(
          issues,
          'EVENT_MET_FACT_MISMATCH',
          path,
          'Event MET and evidence must match its bound Fact ID',
        )
      }
    }
    validateCitations(event.citations, path, sources, issues)
    const eventSources = event.citations
      .map((citation) => sources.get(citation.sourceId))
      .filter((source): source is SourceRecord => source !== undefined)
    if (
      eventSources.length > 0 &&
      eventSources.every(
        (source) => source.allowedEvidence && !source.allowedEvidence.includes(event.evidence),
      )
    ) {
      issue(
        issues,
        'EVENT_SOURCE_SCOPE',
        path,
        `No cited source permits event evidence class ${event.evidence}`,
      )
    }
    for (const [actionIndex, action] of event.actions.entries()) {
      const actionPath = `${path}.actions[${actionIndex}]`
      if (action.type === 'set-phase') {
        if (!phaseIds.has(action.phaseId)) {
          issue(issues, 'UNKNOWN_ACTION_PHASE', actionPath, `Unknown phase ${action.phaseId}`)
        }
      } else {
        if (!componentIds.has(action.componentId)) {
          issue(
            issues,
            'UNKNOWN_ACTION_COMPONENT',
            actionPath,
            `Unknown component ${action.componentId}`,
          )
        }
        if (
          action.type === 'set-component-parent' &&
          action.parentId !== null &&
          !componentIds.has(action.parentId)
        ) {
          issue(issues, 'UNKNOWN_ACTION_PARENT', actionPath, `Unknown parent ${action.parentId}`)
        }
      }
    }
  }
  validateEventConflicts(definition.events, issues)
  validateEventParentCycles(definition, componentIds, issues)

  if (!phaseIds.has(definition.initialPhaseId)) {
    issue(
      issues,
      'UNKNOWN_INITIAL_PHASE',
      'initialPhaseId',
      `Unknown phase ${definition.initialPhaseId}`,
    )
  }
  for (const [index, phase] of definition.phases.entries()) {
    for (const [field, eventId] of [
      ['startEventId', phase.startEventId],
      ['endEventId', phase.endEventId],
    ] as const) {
      if (eventId && !eventIds.has(eventId)) {
        issue(
          issues,
          'UNKNOWN_PHASE_EVENT',
          `phases[${index}].${field}`,
          `Unknown event ${eventId}`,
        )
      }
    }
  }

  try {
    const narrative = compileNarrative(definition.narrative)
    const start = narrative[0].metStart
    const end = narrative[narrative.length - 1].metEnd
    for (const [index, event] of definition.events.entries()) {
      if (event.metSeconds < start || event.metSeconds > end) {
        issue(
          issues,
          'EVENT_OUTSIDE_NARRATIVE',
          `events[${index}]`,
          `Event ${event.id} is outside narrative MET coverage`,
        )
      }
    }
  } catch (error) {
    issue(
      issues,
      'INVALID_NARRATIVE',
      'narrative',
      error instanceof Error ? error.message : String(error),
    )
  }

  for (const [index, component] of definition.vehicle.components.entries()) {
    const parentId = component.initialState.parentId
    if (parentId !== null && !componentIds.has(parentId)) {
      issue(
        issues,
        'UNKNOWN_INITIAL_PARENT',
        `vehicle.components[${index}]`,
        `Unknown parent ${parentId}`,
      )
    }
    for (const sourceId of component.sourceIds ?? []) {
      if (!sources.has(sourceId)) {
        issue(
          issues,
          'UNKNOWN_COMPONENT_SOURCE',
          `vehicle.components[${index}].sourceIds`,
          `Unknown source ${sourceId}`,
        )
      }
    }
    if (
      (component.evidence === 'schematic' || component.evidence === 'reconstructed') &&
      !component.method
    ) {
      issue(
        issues,
        'COMPONENT_WITHOUT_METHOD',
        `vehicle.components[${index}]`,
        `${component.evidence} component requires a method note`,
      )
    }
    const parents = new Map(
      definition.vehicle.components.map((candidate) => [
        candidate.id,
        candidate.initialState.parentId,
      ]),
    )
    const cycleAt = parentCycleFrom(component.id, parents)
    if (cycleAt !== null) {
      issue(
        issues,
        'COMPONENT_PARENT_CYCLE',
        `vehicle.components[${index}]`,
        `Parent cycle includes ${cycleAt}`,
      )
    }
  }
  for (const [index, rootId] of definition.vehicle.rootComponentIds.entries()) {
    if (!componentIds.has(rootId)) {
      issue(issues, 'UNKNOWN_ROOT_COMPONENT', `vehicle.rootComponentIds[${index}]`, rootId)
    }
  }

  for (const [eventIndex, event] of definition.events.entries()) {
    try {
      const eventState = stateAtMet(definition, event.metSeconds)
      for (const [componentId, component] of Object.entries(eventState.components)) {
        if (
          (component.lifecycle === 'discarded' || component.lifecycle === 'landed') &&
          component.engineMode === 'burning'
        ) {
          issue(
            issues,
            'TERMINAL_COMPONENT_BURNING',
            `events[${eventIndex}]`,
            `${componentId} is ${component.lifecycle} but remains burning after ${event.id}`,
          )
        }
      }
    } catch {
      // Earlier validation reports unknown components and invalid actions more precisely.
    }
  }

  for (const [channelIndex, channel] of definition.telemetry.entries()) {
    const path = `telemetry[${channelIndex}]`
    if (quantityForUnit(channel.unit) !== channel.quantity) {
      issue(issues, 'TELEMETRY_UNIT_QUANTITY', path, 'Channel unit and quantity do not match')
    }
    for (const [sampleIndex, sample] of channel.samples.entries()) {
      if (!Number.isFinite(sample.metSeconds)) {
        issue(
          issues,
          'NON_FINITE_TELEMETRY_MET',
          `${path}.samples[${sampleIndex}]`,
          'Telemetry sample MET must be finite',
        )
      }
      if (sampleIndex > 0 && sample.metSeconds <= channel.samples[sampleIndex - 1].metSeconds) {
        issue(
          issues,
          'UNSORTED_TELEMETRY',
          `${path}.samples[${sampleIndex}]`,
          'Telemetry samples must have strictly increasing MET',
        )
      }
      if (sample.reading.unit !== channel.unit) {
        issue(
          issues,
          'TELEMETRY_SAMPLE_UNIT',
          `${path}.samples[${sampleIndex}]`,
          'Sample unit must match channel unit',
        )
      }
    }
  }
  for (const id of duplicateIds(definition.telemetry.map((channel) => channel.id))) {
    issue(issues, 'DUPLICATE_TELEMETRY_ID', 'telemetry', `Duplicate channel id ${id}`)
  }

  for (const [index, asset] of definition.assets.assets.entries()) {
    if (!sources.has(asset.sourceId)) {
      issue(
        issues,
        'UNKNOWN_ASSET_SOURCE',
        `assets.assets[${index}]`,
        `Unknown source ${asset.sourceId}`,
      )
    }
  }

  return issues
}

export function assertMissionDefinition(definition: MissionDefinition): void {
  const errors = validateMissionDefinition(definition).filter((item) => item.severity === 'error')
  if (errors.length > 0) {
    throw new TypeError(
      errors.map((item) => `${item.code} ${item.path}: ${item.message}`).join('\n'),
    )
  }
}
