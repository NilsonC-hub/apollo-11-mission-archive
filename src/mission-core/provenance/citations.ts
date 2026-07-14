import type { CitationRef } from '../types/provenance.ts'

function citationKey(citation: CitationRef): string {
  return [
    citation.sourceId,
    citation.pages ?? '',
    citation.locator ?? '',
    citation.note ?? '',
  ].join('\u001f')
}

export function mergeCitations(...groups: readonly CitationRef[][]): CitationRef[] {
  const seen = new Set<string>()
  const merged: CitationRef[] = []
  for (const citations of groups) {
    for (const citation of citations) {
      const key = citationKey(citation)
      if (!seen.has(key)) {
        seen.add(key)
        merged.push({ ...citation })
      }
    }
  }
  return merged
}

export function hasCitationLocator(citation: CitationRef): boolean {
  return Boolean(citation.pages || citation.locator)
}
