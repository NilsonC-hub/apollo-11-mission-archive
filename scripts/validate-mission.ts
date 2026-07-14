// Phase 2 mission-pack exit validator.
// Keeps the earlier prerequisite gates, validates the task-neutral core fixture,
// validates the Apollo 11 pack, and enforces the core dependency/identity boundary.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateMissionDefinitionCandidate } from '../src/mission-core/index.ts'
import { apollo11MissionPack } from '../src/missions/apollo11/mission.ts'
import { minimalMission } from '../tests/fixtures/minimal-mission.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

const phase0Required = [
  'src/missions/apollo11/source-manifest.json',
  'src/missions/apollo11/asset-manifest.json',
  'docs/audit/PHASE-0-REPORT.md',
  'docs/audit/EVENT-VERIFICATION.md',
  'docs/audit/EVENT-VERIFICATION-A3.md',
  'docs/audit/MODEL-INSPECTION-REPORT.md',
  'docs/audit/RISK-LOG.md',
  'docs/audit/ARTEMIS-REUSE-MAP.md',
  'docs/audit/CSM-RECONSTRUCTION-PLAN.md',
  'docs/audit/CELESTIAL-TEXTURE-CANDIDATES.md',
  'docs/audit/DECISIONS.md',
  'docs/audit/SP4029-extraction.txt',
  'docs/audit/STL-INSPECTION.txt',
  'docs/audit/SATV-FE-SEPARATION-VERIFICATION.txt',
  'assets/raw/NASA-MODEL-SATV.inspection.json',
  'assets/raw/NASA-MODEL-LM.inspection.json',
  'assets/raw/NASA-A11-POSTTRAJ.pdf',
  'assets/raw/NASA-A11-SATV-FE.pdf',
  'assets/raw/NASA-MODEL-SATV-STL-extracted',
  'scripts/inspect-stls.ts',
  'scripts/hydrate-assets.ts',
]

const phase1Required = [
  'src/mission-core/index.ts',
  'src/mission-core/clock/met.ts',
  'src/mission-core/narrative/mapping.ts',
  'src/mission-core/state-machine/stateAtMet.ts',
  'src/mission-core/provenance',
  'src/mission-core/telemetry/sampleAtMet.ts',
  'src/mission-core/validation/missionDefinition.ts',
  'src/mission-core/validation/schema.ts',
  'tests/fixtures/minimal-mission.ts',
]

const phase2Required = [
  'src/missions/apollo11/mission.ts',
  'src/missions/apollo11/meta.ts',
  'src/missions/apollo11/epochs.ts',
  'src/missions/apollo11/eventSeeds.ts',
  'src/missions/apollo11/facts.ts',
  'src/missions/apollo11/events.ts',
  'src/missions/apollo11/phases.ts',
  'src/missions/apollo11/narrative.ts',
  'src/missions/apollo11/vehicle.ts',
  'src/missions/apollo11/telemetry.ts',
  'src/missions/apollo11/pendingEvents.ts',
  'src/missions/apollo11/media.ts',
  'src/missions/apollo11/archive/chapters.ts',
  'tests/unit/apollo11-mission-pack.test.ts',
]

function checkRequired(label: string, required: readonly string[]): number {
  let missing = 0
  console.log(`=== ${label} ===`)
  for (const relativePath of required) {
    const ok = existsSync(resolve(ROOT, relativePath))
    console.log(`${ok ? 'OK  ' : 'MISS'} ${relativePath}`)
    if (!ok) missing++
  }
  return missing
}

function filesUnder(path: string): string[] {
  return readdirSync(path).flatMap((entry) => {
    const absolute = resolve(path, entry)
    return statSync(absolute).isDirectory() ? filesUnder(absolute) : [absolute]
  })
}

function validateCoreBoundary(): string[] {
  const violations: string[] = []
  const forbiddenTokens = ['apollo11', 'saturn-v', 'columbia', 'eagle']
  const forbiddenImports = [
    /from\s+['"]react(?:\/|['"])/,
    /from\s+['"]three(?:\/|['"])/,
    /from\s+['"]@react-three\//,
    /from\s+['"]zustand(?:\/|['"])/,
    /from\s+['"]node:/,
  ]

  for (const file of filesUnder(resolve(ROOT, 'src', 'mission-core'))) {
    const content = readFileSync(file, 'utf8')
    const lower = content.toLowerCase()
    for (const token of forbiddenTokens) {
      if (lower.includes(token)) violations.push(`${file}: task-specific token ${token}`)
    }
    for (const pattern of forbiddenImports) {
      if (pattern.test(content)) violations.push(`${file}: forbidden import ${pattern}`)
    }
  }
  return violations
}

let failures = 0
failures += checkRequired('Phase 0 prerequisites', phase0Required)
console.log()
failures += checkRequired('Phase 1 mission-core files', phase1Required)
console.log()
failures += checkRequired('Phase 2 Apollo 11 mission-pack files', phase2Required)

console.log('\n=== Minimal mission definition ===')
const definitionIssues = validateMissionDefinitionCandidate(minimalMission)
for (const item of definitionIssues) {
  console.log(`${item.severity.toUpperCase()} ${item.code} ${item.path}: ${item.message}`)
  if (item.severity === 'error') failures++
}
if (definitionIssues.length === 0) console.log('OK   task-neutral fixture is valid')

console.log('\n=== Apollo 11 mission definition ===')
const apollo11Issues = validateMissionDefinitionCandidate(apollo11MissionPack.definition)
for (const item of apollo11Issues) {
  console.log(`${item.severity.toUpperCase()} ${item.code} ${item.path}: ${item.message}`)
  if (item.severity === 'error') failures++
}
if (apollo11Issues.length === 0) {
  console.log(
    `OK   ${apollo11MissionPack.definition.events.length} published events; ` +
      `${apollo11MissionPack.definition.facts.length} facts; ` +
      `${apollo11MissionPack.unavailable.preciseEvents.length} unverified event times remain missing`,
  )
}

const publishedEventIds = new Set(apollo11MissionPack.definition.events.map((event) => event.id))
const publishedFacts = new Map(apollo11MissionPack.definition.facts.map((fact) => [fact.id, fact]))
for (const event of apollo11MissionPack.definition.events) {
  const metFact = event.metFactId ? publishedFacts.get(event.metFactId) : undefined
  if (!metFact || metFact.kind !== 'value' || metFact.value !== event.metSeconds) {
    console.log(`FAIL ${event.id}: published event lacks a matching MET Fact ID`)
    failures++
  }
}
for (const pending of apollo11MissionPack.unavailable.preciseEvents) {
  if (pending.met.kind !== 'missing' || publishedEventIds.has(pending.id)) {
    console.log(`FAIL ${pending.id}: unverified timing entered the published event stream`)
    failures++
  }
}

console.log('\n=== mission-core dependency boundary ===')
const boundaryViolations = validateCoreBoundary()
for (const violation of boundaryViolations) console.log(`FAIL ${violation}`)
if (boundaryViolations.length === 0) console.log('OK   no task identity or UI/runtime imports')
failures += boundaryViolations.length

if (failures > 0) {
  console.log(`\nFAIL: ${failures} Phase 1 validation error(s)`)
  process.exit(1)
}

console.log('\nPASS: Phase 0 prerequisites, Phase 1 core, and Phase 2 mission pack validated')
