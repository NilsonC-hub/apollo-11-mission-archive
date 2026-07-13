// scripts/validate-mission.ts
// Phase 0 stub — mission pack (events, epochs, narrative) is Phase 1 work.
// This script checks that the Phase 0 deliverables required by the mission pack
// exist (Source Manifest passes, GLB inspection reports exist) so Phase 1 can
// proceed. The actual event/fact validation logic is added in Phase 1.

import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

const required = [
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
  'assets/raw/NASA-MODEL-SATV.inspection.json',
  'assets/raw/NASA-MODEL-LM.inspection.json',
  'assets/raw/NASA-A11-POSTTRAJ.pdf',
  'assets/raw/NASA-MODEL-SATV-STL-extracted',
]

let missing = 0
console.log('=== Mission pack prerequisites (Phase 0 exit gate) ===')
for (const rel of required) {
  const abs = resolve(ROOT, rel)
  const ok = existsSync(abs)
  console.log(`${ok ? 'OK ' : 'MISS'}  ${rel}`)
  if (!ok) missing++
}

if (missing > 0) {
  console.log(`\nFAIL: ${missing} prerequisite(s) missing`)
  process.exit(1)
}
console.log('\nPASS: all Phase 0 prerequisites in place')
