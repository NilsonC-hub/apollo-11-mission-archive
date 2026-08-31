import assert from 'node:assert/strict'
import test from 'node:test'

import { applicationPathname, deploymentPath } from '../../src/app/deploymentPath.ts'

const pagesBase = '/apollo-11-mission-archive/'

test('GitHub Pages deployment paths preserve application routes and assets', () => {
  assert.equal(
    deploymentPath('/control/event/a11-liftoff', pagesBase),
    '/apollo-11-mission-archive/control/event/a11-liftoff',
  )
  assert.equal(
    deploymentPath('/missions/apollo11/models/apollo11-saturn-v-low.glb', pagesBase),
    '/apollo-11-mission-archive/missions/apollo11/models/apollo11-saturn-v-low.glb',
  )
  assert.equal(deploymentPath('/', pagesBase), '/apollo-11-mission-archive/')
})

test('GitHub Pages browser pathnames reduce to canonical application paths', () => {
  assert.equal(
    applicationPathname('/apollo-11-mission-archive/control/met/s0.6', pagesBase),
    '/control/met/s0.6',
  )
  assert.equal(applicationPathname('/apollo-11-mission-archive/', pagesBase), '/')
  assert.equal(applicationPathname('/outside/control', pagesBase), '/outside/control')
})

test('local root deployment remains unchanged', () => {
  assert.equal(deploymentPath('/archive#saturn-v', '/'), '/archive#saturn-v')
  assert.equal(applicationPathname('/control/inspect/saturn-v', '/'), '/control/inspect/saturn-v')
})
