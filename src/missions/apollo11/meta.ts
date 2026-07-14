import type { EvidenceValue, MissionMeta } from '../../mission-core/index.ts'

const overviewCitation = {
  sourceId: 'NASA-A11-OVERVIEW',
  locator: 'Mission Overview — Payload and Launch sections',
} as const

export const apollo11Meta: MissionMeta = {
  id: 'apollo11',
  name: 'Apollo 11 Mission Archive',
  description: 'AS-FLOWN RECORD · HISTORICAL REPLAY',
  factIds: [
    'a11-mission-name',
    'a11-launch-vehicle-designation',
    'a11-csm-designation',
    'a11-lm-designation',
  ],
}

export const apollo11IdentityFacts = [
  {
    kind: 'value',
    id: 'a11-mission-name',
    value: 'APOLLO 11',
    evidence: 'actual',
    citations: [overviewCitation],
  },
  {
    kind: 'value',
    id: 'a11-launch-vehicle-designation',
    value: 'SATURN V AS-506',
    evidence: 'actual',
    citations: [
      {
        sourceId: 'NASA-A11-OVERVIEW',
        locator: 'Launch Information — Saturn-V AS-506',
      },
    ],
  },
  {
    kind: 'value',
    id: 'a11-csm-designation',
    value: 'COLUMBIA · CSM-107',
    evidence: 'actual',
    citations: [overviewCitation],
  },
  {
    kind: 'value',
    id: 'a11-lm-designation',
    value: 'EAGLE · LM-5',
    evidence: 'actual',
    citations: [overviewCitation],
  },
] satisfies EvidenceValue<string>[]
