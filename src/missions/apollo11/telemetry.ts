import type { TelemetryChannel } from '../../mission-core/index.ts'

export const apollo11Telemetry = [
  {
    id: 'a11-touchdown-vertical-speed',
    label: 'ESTIMATED LANDING VERTICAL SPEED — DOWN',
    quantity: 'speed',
    unit: 'm/s',
    interpolation: 'none',
    samples: [
      {
        metSeconds: 369939.9,
        reading: {
          kind: 'value',
          id: 'a11-touchdown-vertical-speed-sample',
          value: 0.3048,
          unit: 'm/s',
          evidence: 'actual',
          citations: [
            {
              sourceId: 'NASA-A11-MR',
              pages: 'PDF 38',
              locator: 'Landing narrative, estimated landing conditions: 1 ft/sec down',
            },
          ],
          method: 'Source value normalized from 1 ft/s to SI using exact factor 0.3048.',
        },
      },
    ],
  },
] satisfies TelemetryChannel[]

export interface UnavailableTelemetryChannel {
  id: string
  label: string
  status: 'not-available-in-source'
  candidateSourceIds: string[]
  displayPolicy: 'hidden-with-explanation'
  note: string
}

export const unavailableTelemetryChannels: UnavailableTelemetryChannel[] = [
  {
    id: 'a11-continuous-cabin-pressure',
    label: 'CONTINUOUS CABIN PRESSURE',
    status: 'not-available-in-source',
    candidateSourceIds: ['NASA-A11-MR', 'NASA-A11-TTEC'],
    displayPolicy: 'hidden-with-explanation',
    note: 'No validated continuous as-flown sample series is present in the Phase 0 source set.',
  },
  {
    id: 'a11-continuous-propellant-percent',
    label: 'CONTINUOUS PROPELLANT PERCENT',
    status: 'not-available-in-source',
    candidateSourceIds: ['NASA-A11-MR', 'NASA-A11-TTEC'],
    displayPolicy: 'hidden-with-explanation',
    note: 'No validated continuous as-flown sample series is present in the Phase 0 source set.',
  },
  {
    id: 'a11-continuous-biomedical',
    label: 'CONTINUOUS CREW BIOMEDICAL DATA',
    status: 'not-available-in-source',
    candidateSourceIds: ['NASA-A11-MR'],
    displayPolicy: 'hidden-with-explanation',
    note: 'No validated channel is available; no heart-rate or suit-pressure values may be generated.',
  },
]
