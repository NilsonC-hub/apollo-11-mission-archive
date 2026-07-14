import type {
  EvidenceClass,
  VehicleComponentDefinition,
  VehicleDefinition,
} from '../../mission-core/index.ts'

function component(
  id: string,
  label: string,
  parentId: string | null,
  sourceIds: string[],
  method: string,
  options: {
    detachable?: boolean
    engine?: boolean
    evidence?: EvidenceClass
  } = {},
): VehicleComponentDefinition {
  return {
    id,
    label,
    detachable: options.detachable ?? true,
    sourceIds,
    evidence: options.evidence ?? 'reconstructed',
    method,
    initialState: {
      lifecycle: 'attached',
      parentId,
      visible: true,
      ...(options.engine ? { engineMode: 'off' as const } : {}),
    },
  }
}

const saturnMethod =
  'Semantic identity follows the mission architecture and NASA references; Phase 3 must bind it to stable processed-model nodes.'
const spacecraftMethod =
  'Semantic identity follows NASA spacecraft references. This table is not geometry and does not claim flight-CAD fidelity.'

export const apollo11Vehicle: VehicleDefinition = {
  rootComponentIds: ['s-ic'],
  components: [
    component(
      's-ic',
      'S-IC FIRST STAGE',
      null,
      ['NASA-MODEL-SATV', 'NASA-A11-SATV-FE'],
      saturnMethod,
      { engine: true },
    ),
    component(
      's-ic-s-ii-interstage',
      'S-IC / S-II INTERSTAGE',
      's-ic',
      ['NASA-MODEL-SATV', 'NASA-A11-SATV-FE'],
      saturnMethod,
    ),
    component(
      's-ii',
      'S-II SECOND STAGE',
      's-ic-s-ii-interstage',
      ['NASA-MODEL-SATV', 'NASA-A11-SATV-FE'],
      saturnMethod,
      { engine: true },
    ),
    component(
      's-ii-s-ivb-interstage',
      'S-II / S-IVB INTERSTAGE',
      's-ii',
      ['NASA-MODEL-SATV', 'NASA-A11-SATV-FE'],
      saturnMethod,
    ),
    component(
      's-ivb',
      'S-IVB THIRD STAGE',
      's-ii-s-ivb-interstage',
      ['NASA-MODEL-SATV', 'NASA-A11-SATV-FE'],
      saturnMethod,
      { engine: true },
    ),
    component(
      'instrument-unit',
      'INSTRUMENT UNIT',
      's-ivb',
      ['NASA-MODEL-SATV', 'NASA-A11-SATV-FE'],
      saturnMethod,
      { detachable: false },
    ),
    component(
      'spacecraft-lm-adapter',
      'SPACECRAFT–LM ADAPTER',
      'instrument-unit',
      ['NASA-MODEL-SATV', 'NASA-CSM-NR'],
      spacecraftMethod,
    ),
    component(
      'sla-panel-1',
      'SLA PANEL 1',
      'spacecraft-lm-adapter',
      ['NASA-MODEL-SATV', 'NASA-CSM-NR'],
      spacecraftMethod,
    ),
    component(
      'sla-panel-2',
      'SLA PANEL 2',
      'spacecraft-lm-adapter',
      ['NASA-MODEL-SATV', 'NASA-CSM-NR'],
      spacecraftMethod,
    ),
    component(
      'sla-panel-3',
      'SLA PANEL 3',
      'spacecraft-lm-adapter',
      ['NASA-MODEL-SATV', 'NASA-CSM-NR'],
      spacecraftMethod,
    ),
    component(
      'sla-panel-4',
      'SLA PANEL 4',
      'spacecraft-lm-adapter',
      ['NASA-MODEL-SATV', 'NASA-CSM-NR'],
      spacecraftMethod,
    ),
    component(
      'lm-descent-stage',
      'LM DESCENT STAGE',
      'spacecraft-lm-adapter',
      ['NASA-MODEL-LM', 'NASA-LM-HB'],
      spacecraftMethod,
      { engine: true },
    ),
    component(
      'lm-ascent-stage',
      'LM ASCENT STAGE',
      'lm-descent-stage',
      ['NASA-MODEL-LM', 'NASA-LM-HB'],
      spacecraftMethod,
      { engine: true },
    ),
    component(
      'service-module',
      'SERVICE MODULE',
      'spacecraft-lm-adapter',
      ['NASA-MODEL-SATV-STL', 'NASA-CSM-NR'],
      spacecraftMethod,
      { engine: true },
    ),
    component(
      'command-module',
      'COMMAND MODULE',
      'service-module',
      ['NASA-MODEL-SATV-STL', 'NASA-CSM-NR'],
      spacecraftMethod,
    ),
    component(
      'launch-escape-system',
      'LAUNCH ESCAPE SYSTEM',
      'command-module',
      ['NASA-MODEL-SATV', 'NASA-MODEL-SATV-STL'],
      spacecraftMethod,
    ),
  ],
}
