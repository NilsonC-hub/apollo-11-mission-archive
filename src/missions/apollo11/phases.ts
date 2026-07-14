import type { MissionPhase } from '../../mission-core/index.ts'

export const apollo11Phases = [
  { id: 'prelaunch', label: 'PRELAUNCH', endEventId: 'a11-liftoff' },
  {
    id: 'ascent',
    label: 'ASCENT',
    startEventId: 'a11-liftoff',
    endEventId: 'a11-sivb-first-cutoff',
  },
  {
    id: 'earth-orbit',
    label: 'EARTH ORBIT',
    startEventId: 'a11-sivb-first-cutoff',
    endEventId: 'a11-tli-ignition',
  },
  {
    id: 'tli-extraction',
    label: 'TLI / EXTRACTION',
    startEventId: 'a11-tli-ignition',
    endEventId: 'a11-spacecraft-ejection',
  },
  {
    id: 'translunar',
    label: 'TRANSLUNAR COAST',
    startEventId: 'a11-spacecraft-ejection',
    endEventId: 'a11-loi-ignition',
  },
  {
    id: 'lunar-orbit',
    label: 'LUNAR ORBIT',
    startEventId: 'a11-loi-ignition',
    endEventId: 'a11-undocking',
  },
  {
    id: 'descent',
    label: 'POWERED DESCENT',
    startEventId: 'a11-undocking',
    endEventId: 'a11-touchdown',
  },
  {
    id: 'surface',
    label: 'LUNAR SURFACE OPS',
    startEventId: 'a11-touchdown',
    endEventId: 'a11-lunar-liftoff',
  },
  {
    id: 'ascent-rendezvous',
    label: 'ASCENT / RENDEZVOUS',
    startEventId: 'a11-lunar-liftoff',
    endEventId: 'a11-ascent-stage-jettison',
  },
  {
    id: 'lunar-orbit-return',
    label: 'LUNAR ORBIT / TEI PREP',
    startEventId: 'a11-ascent-stage-jettison',
    endEventId: 'a11-tei-ignition',
  },
  {
    id: 'transearth',
    label: 'TRANSEARTH COAST',
    startEventId: 'a11-tei-ignition',
    endEventId: 'a11-entry-interface',
  },
  {
    id: 'entry',
    label: 'ENTRY',
    startEventId: 'a11-entry-interface',
    endEventId: 'a11-splashdown',
  },
  { id: 'recovery', label: 'RECOVERY', startEventId: 'a11-splashdown' },
] satisfies MissionPhase[]
