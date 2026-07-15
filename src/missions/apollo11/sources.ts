import type { EvidenceClass, SourceRecord } from '../../mission-core/index.ts'

import sourceManifestJson from './source-manifest.json' with { type: 'json' }

const selectedSourcePolicies = {
  'NASA-A11-MR': ['actual', 'derived', 'interpolated'],
  'NASA-A11-SATV-FE': ['actual', 'derived', 'interpolated'],
  'NASA-APOLLO-NUMBERS': ['actual', 'derived'],
  'NASA-A11-SCIENCE-PRELIM': ['actual', 'derived'],
  'NASA-A11-OVERVIEW': ['actual'],
  'NASA-A11-TTEC': ['actual'],
  'NASA-A11-TTEC-WEB': ['actual'],
  'NASA-A11-AUDIO': ['actual'],
  'NASA-A11-IMAGES': ['actual'],
  'NASA-A11-S69-38660': ['actual'],
  'NASA-A11-S69-39525': ['actual'],
  'NASA-A11-S69-39961': ['actual'],
  'NASA-A11-MOON-VIEW': ['actual'],
  'NASA-A11-LANDING': ['actual'],
  'NASA-A11-FP1': ['planned'],
  'NASA-MODEL-SATV': ['reconstructed'],
  'NASA-MODEL-LM': ['reconstructed'],
  'NASA-MODEL-SATV-STL': ['reconstructed'],
  'NASA-CSM-NR': ['reconstructed'],
  'NASA-LM-HB': ['reconstructed'],
} as const satisfies Record<string, readonly EvidenceClass[]>

type SelectedSourceId = keyof typeof selectedSourcePolicies
type ManifestSource = (typeof sourceManifestJson.sources)[number]

function sourceById(id: SelectedSourceId): SourceRecord {
  const source = sourceManifestJson.sources.find((candidate) => candidate.id === id)
  if (!source) throw new TypeError(`Source Manifest is missing ${id}`)
  const typed = source as ManifestSource
  return {
    id: typed.id,
    kind: typed.kind as SourceRecord['kind'],
    title: typed.title,
    publisher: typed.publisher,
    publicationDate: typed.publicationDate,
    originalUrl: typed.originalUrl,
    localPath: 'localPath' in typed ? typed.localPath : undefined,
    accessedAt: typed.accessedAt,
    sha256: 'sha256' in typed ? typed.sha256 : undefined,
    rightsStatus: typed.rightsStatus,
    notes: 'notes' in typed ? typed.notes : undefined,
    allowedEvidence: [...selectedSourcePolicies[id]],
  }
}

export const apollo11Sources = {
  sources: (Object.keys(selectedSourcePolicies) as SelectedSourceId[]).map(sourceById),
}

export const apollo11SourceIds = new Set(apollo11Sources.sources.map((source) => source.id))
