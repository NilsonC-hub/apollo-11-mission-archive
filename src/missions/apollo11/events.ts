import type { MissionAction, MissionEvent } from '../../mission-core/index.ts'

import { apollo11EventSeeds } from './eventSeeds.ts'

const actionsByEventId: Partial<Record<string, MissionAction[]>> = {
  'a11-liftoff': [
    { type: 'set-phase', phaseId: 'ascent' },
    { type: 'set-engine-mode', componentId: 's-ic', engineMode: 'burning' },
  ],
  'a11-sic-outboard-cutoff': [
    { type: 'set-engine-mode', componentId: 's-ic', engineMode: 'cutoff' },
  ],
  'a11-sic-sii-separation': [
    { type: 'set-component-parent', componentId: 's-ii', parentId: null },
    { type: 'set-component-lifecycle', componentId: 's-ic', lifecycle: 'discarded' },
    {
      type: 'set-component-parent',
      componentId: 's-ic-s-ii-interstage',
      parentId: null,
    },
    {
      type: 'set-component-lifecycle',
      componentId: 's-ic-s-ii-interstage',
      lifecycle: 'discarded',
    },
  ],
  'a11-sii-ignition-command': [
    { type: 'set-engine-mode', componentId: 's-ii', engineMode: 'burning' },
  ],
  'a11-les-jettison': [
    { type: 'set-component-parent', componentId: 'launch-escape-system', parentId: null },
    {
      type: 'set-component-lifecycle',
      componentId: 'launch-escape-system',
      lifecycle: 'discarded',
    },
  ],
  'a11-sii-cutoff': [{ type: 'set-engine-mode', componentId: 's-ii', engineMode: 'cutoff' }],
  'a11-sii-sivb-separation': [
    { type: 'set-component-parent', componentId: 's-ivb', parentId: null },
    { type: 'set-component-lifecycle', componentId: 's-ivb', lifecycle: 'free' },
    { type: 'set-component-lifecycle', componentId: 's-ii', lifecycle: 'discarded' },
    {
      type: 'set-component-parent',
      componentId: 's-ii-s-ivb-interstage',
      parentId: null,
    },
    {
      type: 'set-component-lifecycle',
      componentId: 's-ii-s-ivb-interstage',
      lifecycle: 'discarded',
    },
  ],
  'a11-sivb-first-ignition': [
    { type: 'set-engine-mode', componentId: 's-ivb', engineMode: 'burning' },
  ],
  'a11-sivb-first-cutoff': [
    { type: 'set-engine-mode', componentId: 's-ivb', engineMode: 'cutoff' },
    { type: 'set-phase', phaseId: 'earth-orbit' },
  ],
  'a11-tli-ignition': [
    { type: 'set-engine-mode', componentId: 's-ivb', engineMode: 'ignition' },
    { type: 'set-phase', phaseId: 'tli-extraction' },
  ],
  'a11-csm-sivb-separation': [
    { type: 'set-component-parent', componentId: 'service-module', parentId: null },
  ],
  'a11-first-docking': [
    {
      type: 'set-component-parent',
      componentId: 'service-module',
      parentId: 'lm-ascent-stage',
    },
  ],
  'a11-spacecraft-ejection': [
    { type: 'set-component-parent', componentId: 'lm-descent-stage', parentId: null },
    { type: 'set-component-lifecycle', componentId: 's-ivb', lifecycle: 'discarded' },
    { type: 'set-phase', phaseId: 'translunar' },
  ],
  'a11-mcc1-ignition': [
    { type: 'set-engine-mode', componentId: 'service-module', engineMode: 'ignition' },
  ],
  'a11-loi-ignition': [
    { type: 'set-engine-mode', componentId: 'service-module', engineMode: 'ignition' },
    { type: 'set-phase', phaseId: 'lunar-orbit' },
  ],
  'a11-lunar-orbit-circularization': [
    { type: 'set-engine-mode', componentId: 'service-module', engineMode: 'ignition' },
  ],
  'a11-undocking': [
    { type: 'set-component-parent', componentId: 'service-module', parentId: null },
    { type: 'set-phase', phaseId: 'descent' },
  ],
  'a11-lm-separation-maneuver': [
    { type: 'set-engine-mode', componentId: 'service-module', engineMode: 'ignition' },
  ],
  'a11-doi-ignition': [
    { type: 'set-engine-mode', componentId: 'lm-descent-stage', engineMode: 'ignition' },
  ],
  'a11-pdi-ignition': [
    { type: 'set-engine-mode', componentId: 'lm-descent-stage', engineMode: 'burning' },
  ],
  'a11-touchdown': [
    { type: 'set-engine-mode', componentId: 'lm-descent-stage', engineMode: 'cutoff' },
    { type: 'set-component-lifecycle', componentId: 'lm-descent-stage', lifecycle: 'landed' },
    { type: 'set-phase', phaseId: 'surface' },
  ],
  'a11-lunar-liftoff': [
    { type: 'set-component-parent', componentId: 'lm-ascent-stage', parentId: null },
    { type: 'set-component-lifecycle', componentId: 'lm-ascent-stage', lifecycle: 'free' },
    { type: 'set-engine-mode', componentId: 'lm-ascent-stage', engineMode: 'ignition' },
    { type: 'set-phase', phaseId: 'ascent-rendezvous' },
  ],
  'a11-csi-ignition': [
    { type: 'set-engine-mode', componentId: 'lm-ascent-stage', engineMode: 'ignition' },
  ],
  'a11-cdh-ignition': [
    { type: 'set-engine-mode', componentId: 'lm-ascent-stage', engineMode: 'ignition' },
  ],
  'a11-tpi-ignition': [
    { type: 'set-engine-mode', componentId: 'lm-ascent-stage', engineMode: 'ignition' },
  ],
  'a11-lm-csm-docking': [
    {
      type: 'set-component-parent',
      componentId: 'service-module',
      parentId: 'lm-ascent-stage',
    },
  ],
  'a11-ascent-stage-jettison': [
    { type: 'set-component-parent', componentId: 'service-module', parentId: null },
    { type: 'set-component-parent', componentId: 'lm-ascent-stage', parentId: null },
    {
      type: 'set-component-lifecycle',
      componentId: 'lm-ascent-stage',
      lifecycle: 'discarded',
    },
    { type: 'set-phase', phaseId: 'lunar-orbit-return' },
  ],
  'a11-ascent-stage-separation-maneuver': [
    { type: 'set-engine-mode', componentId: 'service-module', engineMode: 'ignition' },
  ],
  'a11-tei-ignition': [
    { type: 'set-engine-mode', componentId: 'service-module', engineMode: 'ignition' },
    { type: 'set-phase', phaseId: 'transearth' },
  ],
  'a11-mcc2-ignition': [
    { type: 'set-engine-mode', componentId: 'service-module', engineMode: 'ignition' },
  ],
  'a11-cm-sm-separation': [
    { type: 'set-component-parent', componentId: 'command-module', parentId: null },
    { type: 'set-component-lifecycle', componentId: 'service-module', lifecycle: 'discarded' },
  ],
  'a11-entry-interface': [{ type: 'set-phase', phaseId: 'entry' }],
  'a11-splashdown': [
    { type: 'set-component-lifecycle', componentId: 'command-module', lifecycle: 'landed' },
    { type: 'set-phase', phaseId: 'recovery' },
  ],
}

export const apollo11Events: MissionEvent[] = apollo11EventSeeds.map((event) => ({
  ...event,
  metFactId: `${event.id}-met`,
  evidence: 'actual',
  actions: actionsByEventId[event.id] ?? [],
}))
