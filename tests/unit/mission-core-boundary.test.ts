import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const CORE = resolve(import.meta.dirname, '..', '..', 'src', 'mission-core')

function filesUnder(path: string): string[] {
  return readdirSync(path).flatMap((entry) => {
    const absolute = resolve(path, entry)
    return statSync(absolute).isDirectory() ? filesUnder(absolute) : [absolute]
  })
}

test('mission-core contains no task-specific identity constants', () => {
  const forbidden = ['apollo11', 'saturn-v', 'columbia', 'eagle']
  for (const file of filesUnder(CORE)) {
    const content = readFileSync(file, 'utf8').toLowerCase()
    for (const token of forbidden) {
      assert.equal(content.includes(token), false, `${file} must not contain ${token}`)
    }
  }
})

test('mission-core has no React, Three, R3F, Zustand, DOM, or Node imports', () => {
  const forbiddenImports = [
    /from\s+['"]react(?:\/|['"])/,
    /from\s+['"]three(?:\/|['"])/,
    /from\s+['"]@react-three\//,
    /from\s+['"]zustand(?:\/|['"])/,
    /from\s+['"]node:/,
  ]
  for (const file of filesUnder(CORE)) {
    const content = readFileSync(file, 'utf8')
    for (const pattern of forbiddenImports) {
      assert.equal(pattern.test(content), false, `${file} must not match ${pattern}`)
    }
  }
})
