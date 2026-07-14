import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Object3D } from 'three'

import { mission } from '../../src/app/mission.ts'
import {
  inspectableComponentIds,
  nodePathForComponent,
  resolveComponentNode,
} from '../../src/features/control/modelNodeLookup.ts'

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
