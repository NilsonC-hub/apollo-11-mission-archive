import type { MissionAction, MissionEvent } from '../types/events.ts'
import type { MissionDefinition, MissionState } from '../types/mission.ts'
import type { VehicleComponentState } from '../types/vehicle.ts'

function copyComponents(
  components: Record<string, VehicleComponentState>,
): Record<string, VehicleComponentState> {
  return Object.fromEntries(
    Object.entries(components).map(([id, component]) => [id, { ...component }]),
  )
}

export function initialMissionState(definition: MissionDefinition): MissionState {
  return {
    metSeconds: definition.narrative[0]?.metStart ?? 0,
    phaseId: definition.initialPhaseId,
    components: Object.fromEntries(
      definition.vehicle.components.map((component) => [
        component.id,
        { ...component.initialState },
      ]),
    ),
    appliedEventIds: [],
  }
}

export function applyMissionAction(state: MissionState, action: MissionAction): MissionState {
  if (action.type === 'set-phase') return { ...state, phaseId: action.phaseId }

  const component = state.components[action.componentId]
  if (!component) throw new RangeError(`Unknown component: ${action.componentId}`)
  const components = copyComponents(state.components)

  switch (action.type) {
    case 'set-component-lifecycle': {
      components[action.componentId].lifecycle = action.lifecycle
      if (
        (action.lifecycle === 'discarded' || action.lifecycle === 'landed') &&
        components[action.componentId].engineMode !== undefined
      ) {
        const previousMode = components[action.componentId].engineMode
        if (previousMode !== 'unknown') {
          components[action.componentId].lastKnownEngineMode = previousMode
        }
        components[action.componentId].engineMode = undefined
        components[action.componentId].engineStateBasis = 'terminal'
      }
      break
    }
    case 'set-component-parent':
      components[action.componentId].parentId = action.parentId
      break
    case 'set-component-visibility':
      components[action.componentId].visible = action.visible
      break
    case 'set-engine-mode':
      components[action.componentId].engineMode = action.engineMode
      components[action.componentId].engineStateBasis = 'known'
      components[action.componentId].lastKnownEngineMode = action.engineMode
      break
    case 'record-engine-ignition': {
      const previousMode = components[action.componentId].engineMode
      if (previousMode && previousMode !== 'unknown') {
        components[action.componentId].lastKnownEngineMode = previousMode
      }
      components[action.componentId].engineMode = 'unknown'
      components[action.componentId].engineStateBasis = 'point-event'
      break
    }
  }
  return { ...state, components }
}

function orderedEvents(events: readonly MissionEvent[]): MissionEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort(
      (left, right) => left.event.metSeconds - right.event.metSeconds || left.index - right.index,
    )
    .map(({ event }) => event)
}

export function stateAtMet(definition: MissionDefinition, metSeconds: number): MissionState {
  if (!Number.isFinite(metSeconds)) throw new TypeError('MET must be finite')
  let state = initialMissionState(definition)

  for (const event of orderedEvents(definition.events)) {
    if (event.metSeconds > metSeconds) break
    for (const action of event.actions) state = applyMissionAction(state, action)
    state = { ...state, appliedEventIds: [...state.appliedEventIds, event.id] }
  }
  return { ...state, metSeconds }
}
