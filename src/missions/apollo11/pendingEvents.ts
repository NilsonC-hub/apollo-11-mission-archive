import type { MissingValue } from '../../mission-core/index.ts'

export interface PendingApollo11Event {
  id: string
  label: string
  met: MissingValue
  candidateSourceIds: string[]
  publicationPolicy: 'archive-only-no-precise-animation'
  note: string
}

function pendingEvent(
  id: string,
  label: string,
  candidateSourceIds: string[],
  note: string,
): PendingApollo11Event {
  return {
    id,
    label,
    met: {
      kind: 'missing',
      id: `${id}-met`,
      reason: 'source-not-yet-reviewed',
      unit: 's',
      citations: [],
      note,
    },
    candidateSourceIds,
    publicationPolicy: 'archive-only-no-precise-animation',
    note,
  }
}

export const apollo11PendingEvents = [
  pendingEvent(
    'a11-sla-panel-jettison',
    'SLA PANEL JETTISON',
    ['NASA-A11-MR', 'NASA-CSM-NR'],
    'Panel-by-panel timing is not verified.',
  ),
  pendingEvent(
    'a11-lm-extraction-complete',
    'LM EXTRACTION COMPLETE',
    ['NASA-A11-MR'],
    'The verified Spacecraft Ejection row does not independently establish extraction-complete timing.',
  ),
  pendingEvent(
    'a11-pdi-braking-phase',
    'PDI BRAKING PHASE',
    ['NASA-A11-MR', 'NASA-A11-LANDING'],
    'Sub-phase boundary is not verified.',
  ),
  pendingEvent(
    'a11-pdi-approach-phase',
    'PDI APPROACH PHASE',
    ['NASA-A11-MR', 'NASA-A11-LANDING'],
    'Sub-phase boundary is not verified.',
  ),
  pendingEvent(
    'a11-pdi-landing-phase',
    'PDI LANDING PHASE',
    ['NASA-A11-MR', 'NASA-A11-LANDING'],
    'Sub-phase boundary is not verified.',
  ),
  pendingEvent(
    'a11-agc-1202-alarm',
    'AGC 1202 ALARM',
    ['NASA-A11-MR', 'NASA-A11-LANDING', 'NASA-A11-TTEC-WEB'],
    'Approximate Phase 0 locator is insufficient for an ACTUAL event boundary.',
  ),
  pendingEvent(
    'a11-agc-1201-alarm',
    'AGC 1201 ALARM',
    ['NASA-A11-MR', 'NASA-A11-LANDING', 'NASA-A11-TTEC-WEB'],
    'Approximate Phase 0 locator is insufficient for an ACTUAL event boundary.',
  ),
  pendingEvent(
    'a11-armstrong-egress',
    'ARMSTRONG EGRESS',
    ['NASA-A11-TTEC-WEB', 'NASA-A11-SCIENCE-PRELIM'],
    'Precise MET has not passed cross-source verification.',
  ),
  pendingEvent(
    'a11-aldrin-egress',
    'ALDRIN EGRESS',
    ['NASA-A11-TTEC-WEB', 'NASA-A11-SCIENCE-PRELIM'],
    'Precise MET has not passed cross-source verification.',
  ),
  pendingEvent(
    'a11-aldrin-first-step',
    'ALDRIN FIRST STEP',
    ['NASA-A11-TTEC-WEB', 'NASA-A11-SCIENCE-PRELIM'],
    'Precise MET has not passed cross-source verification.',
  ),
  pendingEvent(
    'a11-eva-flag-deploy',
    'FLAG DEPLOYMENT',
    ['NASA-A11-SCIENCE-PRELIM'],
    'Precise MET has not passed cross-source verification.',
  ),
  pendingEvent(
    'a11-eva-easep-deploy',
    'EASEP DEPLOYMENT',
    ['NASA-A11-SCIENCE-PRELIM'],
    'Precise MET has not passed cross-source verification.',
  ),
  pendingEvent(
    'a11-eva-sample-collection',
    'SAMPLE COLLECTION',
    ['NASA-A11-SCIENCE-PRELIM'],
    'Activity is sourced; a precise event boundary is not.',
  ),
  pendingEvent(
    'a11-eva-photography',
    'EVA PHOTOGRAPHY',
    ['NASA-A11-SCIENCE-PRELIM', 'NASA-A11-IMAGES'],
    'Activity is sourced; a precise event boundary is not.',
  ),
  pendingEvent(
    'a11-eva-magazine-jettison',
    'EVA MAGAZINE JETTISON',
    ['NASA-A11-SCIENCE-PRELIM'],
    'Precise MET has not passed cross-source verification.',
  ),
  pendingEvent(
    'a11-ascent-staging',
    'LM ASCENT STAGING',
    ['NASA-A11-MR', 'NASA-LM-HB'],
    'The physical/visual staging definition is not independently timed.',
  ),
  pendingEvent(
    'a11-aps-cutoff',
    'APS CUTOFF',
    ['NASA-A11-MR', 'NASA-LM-HB'],
    'Precise cutoff MET has not passed verification.',
  ),
  pendingEvent(
    'a11-drogue-deployment',
    'DROGUE DEPLOYMENT',
    ['NASA-A11-MR', 'NASA-A11-OVERVIEW'],
    'Separate drogue timing is not verified.',
  ),
  pendingEvent(
    'a11-main-parachute-deployment',
    'MAIN PARACHUTE DEPLOYMENT',
    ['NASA-A11-MR', 'NASA-A11-OVERVIEW'],
    'Separate main deployment timing is not verified.',
  ),
  pendingEvent(
    'a11-main-inflation',
    'MAIN PARACHUTE INFLATION',
    ['NASA-A11-MR'],
    'Main inflation timing is not verified.',
  ),
  pendingEvent(
    'a11-splashdown-flotation',
    'SPLASHDOWN FLOTATION',
    ['NASA-A11-MR'],
    'Post-splashdown timing is not verified.',
  ),
  pendingEvent(
    'a11-splashdown-hatch-open',
    'SPLASHDOWN HATCH OPEN',
    ['NASA-A11-MR'],
    'Post-splashdown timing is not verified.',
  ),
  pendingEvent(
    'a11-crew-recovery',
    'CREW RECOVERY',
    ['NASA-A11-MR'],
    'Post-splashdown timing is not verified.',
  ),
  pendingEvent(
    'a11-crew-aboard-hornet',
    'CREW ABOARD USS HORNET',
    ['NASA-A11-MR'],
    'Post-splashdown timing is not verified.',
  ),
]

export const apollo11ResolvedEventAliases = [
  {
    id: 'a11-aps-ignition',
    resolvedByEventId: 'a11-lunar-liftoff',
    note: 'Mission Report identifies lunar liftoff by APS engine ignition time.',
  },
] as const
