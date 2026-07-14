import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Group, Object3D } from 'three'

import { mission } from '../../src/app/mission.ts'
import {
  findInspectableComponentNodes,
  inspectableComponentIds,
  nodePathForComponent,
  resolveComponentNode,
} from '../../src/features/control/modelNodeLookup.ts'
import { stateAtMet } from '../../src/mission-core/index.ts'

test('inspectable components resolve through semantic Node Manifest bindings', () => {
  const inspectable = new Set(inspectableComponentIds())
  for (const component of mission.vehicle.components) {
    if (!component.nodeBinding) continue
    assert.ok(inspectable.has(component.id), component.id)
    assert.match(nodePathForComponent(component.id), /^\/Scene\//)
  }
})

test('runtime lookup walks the complete manifest path instead of matching array position', () => {
  const path = nodePathForComponent('s-ic')
  const names = path.split('/').filter(Boolean)
  const root = new Object3D()
  root.name = names.shift()!
  let current = root
  for (const name of names) {
    const child = new Object3D()
    child.name = name
    current.add(child)
    current = child
  }

  assert.equal(resolveComponentNode(root, 's-ic'), current)
})

test('missing required manifest paths fail explicitly', () => {
  const root = new Object3D()
  root.name = 'Scene'
  assert.throws(() => resolveComponentNode(root, 's-ic'), /Node Manifest path/)
})

test('runtime inspection selects one currently visible vehicle-state target', () => {
  const root = new Group()
  const visible = new Group()
  visible.userData.semanticComponentId = 'lm-ascent-stage'
  const hiddenDuplicate = new Group()
  hiddenDuplicate.userData.semanticComponentId = 'lm-ascent-stage'
  hiddenDuplicate.visible = false
  root.add(visible, hiddenDuplicate)

  const state = stateAtMet(
    mission,
    mission.events.find((event) => event.id === 'a11-lunar-liftoff')!.metSeconds,
  )
  assert.deepEqual(findInspectableComponentNodes(root, 'lm-ascent-stage', state), [visible])

  visible.visible = false
  assert.deepEqual(findInspectableComponentNodes(root, 'lm-ascent-stage', state), [])
})

test('discarded or source-hidden components cannot become inspection targets', () => {
  const root = new Group()
  const node = new Group()
  node.userData.semanticComponentId = 's-ic'
  root.add(node)
  const discarded = stateAtMet(
    mission,
    mission.events.find((event) => event.id === 'a11-sic-sii-separation')!.metSeconds,
  )
  assert.deepEqual(findInspectableComponentNodes(root, 's-ic', discarded), [])
})
