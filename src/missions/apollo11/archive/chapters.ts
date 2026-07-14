import type { CitationRef, EvidenceClass } from '../../../mission-core/index.ts'

export interface ArchiveChapterSkeleton {
  id: string
  title: string
  auxiliaryTitleZhHans: string
  summary: string
  evidence: EvidenceClass
  method?: string
  citations: CitationRef[]
  factIds: string[]
  eventIds: string[]
  componentIds: string[]
}

const overview = {
  sourceId: 'NASA-A11-OVERVIEW',
  locator: 'Apollo 11 Mission Overview',
} as const
const missionReport = {
  sourceId: 'NASA-A11-MR',
  locator: 'Apollo 11 Mission Report',
} as const

export const apollo11ArchiveChapters = [
  {
    id: '00',
    title: 'Mission Index',
    auxiliaryTitleZhHans: '任务索引',
    summary:
      'Mission identity, vehicle designations, source status, and routes into the as-flown record.',
    evidence: 'actual',
    citations: [overview],
    factIds: [
      'a11-mission-name',
      'a11-launch-vehicle-designation',
      'a11-csm-designation',
      'a11-lm-designation',
    ],
    eventIds: ['a11-liftoff', 'a11-touchdown', 'a11-splashdown'],
    componentIds: [],
  },
  {
    id: '01',
    title: 'Mission Objectives',
    auxiliaryTitleZhHans: '任务目标',
    summary:
      'The planned national objective and the postflight mission outcome are presented as separate records.',
    evidence: 'actual',
    citations: [overview, missionReport],
    factIds: [],
    eventIds: ['a11-touchdown', 'a11-splashdown'],
    componentIds: [],
  },
  {
    id: '02',
    title: 'Crew & Flight Roles',
    auxiliaryTitleZhHans: '乘组与飞行职责',
    summary:
      'Crew assignments and vehicle responsibilities across command-module, lunar-module, and surface operations.',
    evidence: 'actual',
    citations: [overview],
    factIds: [],
    eventIds: ['a11-undocking', 'a11-lm-csm-docking'],
    componentIds: ['command-module', 'lm-ascent-stage', 'lm-descent-stage'],
  },
  {
    id: '03',
    title: 'As-Flown Timeline',
    auxiliaryTitleZhHans: '实际飞行时间线',
    summary:
      'Source-verified mission events ordered by Mission Elapsed Time, retaining source precision.',
    evidence: 'actual',
    citations: [{ sourceId: 'NASA-A11-MR', pages: '3-4–3-5', locator: 'Table 3-I' }],
    factIds: [],
    eventIds: [
      'a11-liftoff',
      'a11-tli-ignition',
      'a11-loi-ignition',
      'a11-touchdown',
      'a11-splashdown',
    ],
    componentIds: [],
  },
  {
    id: '04',
    title: 'Flight Architecture',
    auxiliaryTitleZhHans: '飞行架构',
    summary:
      'Earth departure, lunar-orbit operations, descent, ascent, return, and entry are linked through verified event anchors.',
    evidence: 'actual',
    citations: [missionReport],
    factIds: [],
    eventIds: [
      'a11-tli-ignition',
      'a11-loi-ignition',
      'a11-pdi-ignition',
      'a11-lunar-liftoff',
      'a11-tei-ignition',
      'a11-entry-interface',
    ],
    componentIds: [],
  },
  {
    id: '05',
    title: 'Saturn V / AS-506',
    auxiliaryTitleZhHans: '土星五号与 AS-506',
    summary:
      'Launch-vehicle stages, instrument unit, adapters, and verified separation-command records.',
    evidence: 'actual',
    citations: [{ sourceId: 'NASA-A11-SATV-FE', locator: 'AS-506 Flight Evaluation Report' }],
    factIds: ['a11-launch-vehicle-designation'],
    eventIds: ['a11-sic-sii-separation', 'a11-sii-sivb-separation', 'a11-sivb-first-cutoff'],
    componentIds: ['s-ic', 's-ii', 's-ivb', 'instrument-unit', 'spacecraft-lm-adapter'],
  },
  {
    id: '06',
    title: 'Columbia & Eagle',
    auxiliaryTitleZhHans: '哥伦比亚与鹰号',
    summary:
      'Command-service and lunar-module structures are related to their changing mission configuration.',
    evidence: 'reconstructed',
    method:
      'The semantic component relationship is authored from NASA CSM/LM references; no final browser geometry is asserted in Phase 2.',
    citations: [
      { sourceId: 'NASA-CSM-NR', locator: 'Command Module reference' },
      {
        sourceId: 'NASA-LM-HB',
        locator: 'LM system reference; generic LM, not LM-5-specific geometry',
      },
    ],
    factIds: ['a11-csm-designation', 'a11-lm-designation'],
    eventIds: ['a11-first-docking', 'a11-undocking', 'a11-lm-csm-docking'],
    componentIds: ['command-module', 'service-module', 'lm-ascent-stage', 'lm-descent-stage'],
  },
  {
    id: '07',
    title: 'Guidance & Computing',
    auxiliaryTitleZhHans: '制导与计算',
    summary:
      'Guidance, navigation, computer programs, radar, and alarm records are routed to primary documents before publication.',
    evidence: 'actual',
    citations: [
      missionReport,
      { sourceId: 'NASA-A11-LANDING', locator: 'Powered descent transcript and commentary' },
    ],
    factIds: [],
    eventIds: ['a11-pdi-ignition'],
    componentIds: ['instrument-unit', 'command-module', 'lm-ascent-stage'],
  },
  {
    id: '08',
    title: 'Mission Control & Network',
    auxiliaryTitleZhHans: '任务控制与通信网络',
    summary:
      'Air-to-ground transcript records remain distinct from editorial commentary and future audio clips.',
    evidence: 'actual',
    citations: [{ sourceId: 'NASA-A11-TTEC-WEB', locator: 'Technical air-to-ground transcript' }],
    factIds: [],
    eventIds: ['a11-touchdown', 'a11-first-step'],
    componentIds: [],
  },
  {
    id: '09',
    title: 'Powered Descent & Landing',
    auxiliaryTitleZhHans: '动力下降与着陆',
    summary:
      'Descent-orbit insertion, powered descent, landing transcript, and postflight landing conditions.',
    evidence: 'actual',
    citations: [
      missionReport,
      { sourceId: 'NASA-A11-LANDING', locator: '102:33:05 through landing confirmation' },
    ],
    factIds: ['a11-pdi-ignition-met', 'a11-touchdown-met'],
    eventIds: ['a11-doi-ignition', 'a11-pdi-ignition', 'a11-touchdown'],
    componentIds: ['lm-ascent-stage', 'lm-descent-stage'],
  },
  {
    id: '10',
    title: 'Lunar Surface Operations',
    auxiliaryTitleZhHans: '月面活动',
    summary:
      'Egress, first step, surface work, and ingress are separated by source confidence and timing precision.',
    evidence: 'actual',
    citations: [
      {
        sourceId: 'NASA-APOLLO-NUMBERS',
        pages: '104, 118',
        locator: 'Apollo 11 first-step records',
      },
      { sourceId: 'NASA-A11-SCIENCE-PRELIM', locator: 'Apollo 11 surface operations' },
    ],
    factIds: ['a11-first-step-met'],
    eventIds: ['a11-lm-hatch-open', 'a11-first-step', 'a11-lm-hatch-close'],
    componentIds: ['lm-ascent-stage', 'lm-descent-stage'],
  },
  {
    id: '11',
    title: 'Rendezvous, Return & Recovery',
    auxiliaryTitleZhHans: '交会、返航与回收',
    summary:
      'Lunar ascent, rendezvous, return injection, entry, splashdown, and recovery-source gaps are presented without invented telemetry.',
    evidence: 'actual',
    citations: [missionReport],
    factIds: [],
    eventIds: [
      'a11-lunar-liftoff',
      'a11-lm-csm-docking',
      'a11-tei-ignition',
      'a11-entry-interface',
      'a11-splashdown',
    ],
    componentIds: ['lm-ascent-stage', 'command-module', 'service-module'],
  },
  {
    id: '12',
    title: 'Media & Source Room',
    auxiliaryTitleZhHans: '媒体与来源室',
    summary:
      'Documents, transcript lines, imagery, model provenance, processing status, and rights notes remain inspectable.',
    evidence: 'actual',
    citations: [
      { sourceId: 'NASA-A11-IMAGES', locator: 'Apollo 11 image gallery' },
      { sourceId: 'NASA-A11-AUDIO', locator: 'Apollo 11 mission audio index' },
    ],
    factIds: [],
    eventIds: [],
    componentIds: [],
  },
] satisfies ArchiveChapterSkeleton[]
