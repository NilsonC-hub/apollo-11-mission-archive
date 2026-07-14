import type { MissionDefinition } from '../../src/mission-core/index.ts'

const actualCitation = {
  sourceId: 'TEST-ACTUAL',
  locator: 'fixture table row 1',
} as const

export const minimalMission = {
  id: 'fixture-mission',
  meta: {
    id: 'fixture-mission',
    name: 'Minimal Fixture Mission',
  },
  epochs: {
    rangeZeroUtc: '2000-01-01T00:00:00.000Z',
    liftoffMetSeconds: 10,
    displayPrecision: 'source-preserved',
  },
  events: [
    {
      id: 'fixture-start',
      metSeconds: 10,
      label: 'START',
      tier: 'major',
      evidence: 'actual',
      citations: [actualCitation],
      actions: [
        { type: 'set-phase', phaseId: 'fixture-flight' },
        { type: 'set-engine-mode', componentId: 'fixture-carrier', engineMode: 'burning' },
      ],
      precision: 'second',
    },
    {
      id: 'fixture-separate',
      metSeconds: 20,
      label: 'SEPARATE',
      tier: 'major',
      evidence: 'actual',
      citations: [actualCitation],
      actions: [
        {
          type: 'set-component-lifecycle',
          componentId: 'fixture-payload',
          lifecycle: 'separating',
        },
        { type: 'set-component-parent', componentId: 'fixture-payload', parentId: null },
        { type: 'set-engine-mode', componentId: 'fixture-carrier', engineMode: 'cutoff' },
      ],
      precision: 'second',
    },
    {
      id: 'fixture-free-flight',
      metSeconds: 30,
      label: 'FREE FLIGHT',
      tier: 'minor',
      evidence: 'actual',
      citations: [actualCitation],
      actions: [
        {
          type: 'set-component-lifecycle',
          componentId: 'fixture-payload',
          lifecycle: 'free',
        },
      ],
      precision: 'second',
    },
  ],
  phases: [
    { id: 'fixture-ground', label: 'GROUND', endEventId: 'fixture-start' },
    { id: 'fixture-flight', label: 'FLIGHT', startEventId: 'fixture-start' },
  ],
  initialPhaseId: 'fixture-ground',
  narrative: [
    {
      id: 'fixture-segment-a',
      metStart: 0,
      metEnd: 20,
      storyDurationMs: 2000,
      presentationPauseMs: 250,
      easing: 'linear',
    },
    {
      id: 'fixture-segment-b',
      metStart: 20,
      metEnd: 40,
      storyDurationMs: 1000,
      easing: 'linear',
    },
  ],
  vehicle: {
    rootComponentIds: ['fixture-carrier'],
    components: [
      {
        id: 'fixture-carrier',
        label: 'Carrier',
        initialState: {
          lifecycle: 'attached',
          parentId: null,
          visible: true,
          engineMode: 'off',
        },
      },
      {
        id: 'fixture-payload',
        label: 'Payload',
        initialState: {
          lifecycle: 'attached',
          parentId: 'fixture-carrier',
          visible: true,
        },
      },
    ],
  },
  telemetry: [
    {
      id: 'fixture-distance-channel',
      label: 'Distance',
      quantity: 'length',
      unit: 'm',
      interpolation: 'linear',
      samples: [
        {
          metSeconds: 0,
          reading: {
            kind: 'value',
            id: 'fixture-distance-sample-a',
            value: 0,
            unit: 'm',
            evidence: 'actual',
            citations: [actualCitation],
          },
        },
        {
          metSeconds: 10,
          reading: {
            kind: 'value',
            id: 'fixture-distance-sample-b',
            value: 100,
            unit: 'm',
            evidence: 'actual',
            citations: [actualCitation],
          },
        },
      ],
    },
  ],
  facts: [
    {
      kind: 'value',
      id: 'fixture-distance-a',
      value: 10,
      unit: 'm',
      evidence: 'actual',
      citations: [actualCitation],
    },
    {
      kind: 'value',
      id: 'fixture-distance-b',
      value: 20,
      unit: 'm',
      evidence: 'actual',
      citations: [actualCitation],
    },
    {
      kind: 'value',
      id: 'fixture-distance-total',
      value: 30,
      unit: 'm',
      evidence: 'derived',
      citations: [actualCitation],
      derivation: {
        formula: 'fixture-distance-a + fixture-distance-b',
        inputFactIds: ['fixture-distance-a', 'fixture-distance-b'],
      },
    },
    {
      kind: 'value',
      id: 'fixture-planned-label',
      value: 'PLANNED FIXTURE',
      evidence: 'planned',
      citations: [{ sourceId: 'TEST-PLAN', locator: 'fixture plan item 1' }],
    },
    {
      kind: 'value',
      id: 'fixture-schematic-label',
      value: 'SCHEMATIC FIXTURE',
      evidence: 'schematic',
      citations: [],
      method: 'Authored only to exercise schematic validation.',
    },
  ],
  sources: {
    sources: [
      {
        id: 'TEST-ACTUAL',
        kind: 'dataset',
        title: 'Fixture Actual Source',
        publisher: 'Test Suite',
        originalUrl: 'https://example.invalid/fixture-actual',
        accessedAt: '2000-01-01',
        rightsStatus: 'Test fixture only',
        allowedEvidence: ['actual', 'derived', 'interpolated', 'reconstructed'],
      },
      {
        id: 'TEST-PLAN',
        kind: 'dataset',
        title: 'Fixture Planned Source',
        publisher: 'Test Suite',
        originalUrl: 'https://example.invalid/fixture-plan',
        accessedAt: '2000-01-01',
        rightsStatus: 'Test fixture only',
        allowedEvidence: ['planned'],
      },
    ],
  },
  assets: { assets: [] },
} satisfies MissionDefinition
