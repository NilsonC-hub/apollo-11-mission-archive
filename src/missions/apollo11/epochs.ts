import type { EvidenceValue, MissionEpochs } from '../../mission-core/index.ts'

export const apollo11Epochs: MissionEpochs = {
  rangeZeroUtc: '1969-07-16T13:32:00.000Z',
  liftoffMetSeconds: 0.6,
  displayPrecision: 'source-preserved',
}

export const apollo11EpochFacts = [
  {
    kind: 'value',
    id: 'a11-range-zero-met',
    value: 0,
    unit: 's',
    evidence: 'actual',
    citations: [
      {
        sourceId: 'NASA-A11-MR',
        pages: '3-4',
        locator: 'Table 3-I range-zero line',
      },
    ],
  },
  {
    kind: 'value',
    id: 'a11-range-zero-utc',
    value: apollo11Epochs.rangeZeroUtc,
    evidence: 'actual',
    citations: [
      {
        sourceId: 'NASA-A11-MR',
        pages: '3-4',
        locator: 'Table 3-I range-zero line',
      },
    ],
  },
] satisfies EvidenceValue<number | string>[]
