import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { build } from 'vite'

interface MemoryChunk {
  type: 'chunk'
  fileName: string
  facadeModuleId: string | null
  imports: string[]
  dynamicImports: string[]
  moduleIds: string[]
  viteMetadata?: {
    importedAssets: Set<string>
  }
}

interface MemoryBuildOutput {
  output: Array<MemoryChunk | { type: 'asset' }>
}

function isChunk(output: MemoryChunk | { type: 'asset' }): output is MemoryChunk {
  return output.type === 'chunk'
}

function normalized(value: string): string {
  return value.replaceAll('\\', '/')
}

test('Archive production bundle closure contains no Control 3D runtime or decoder assets', async () => {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const result = await build({
    root,
    logLevel: 'silent',
    build: {
      minify: false,
      write: false,
    },
  })
  const builds = (Array.isArray(result) ? result : [result]) as MemoryBuildOutput[]
  const chunks = builds.flatMap((item) => item.output).filter(isChunk)
  const archive = chunks.find((chunk) =>
    normalized(chunk.facadeModuleId ?? '').endsWith('/src/features/archive/ArchiveRoute.tsx'),
  )
  assert.ok(archive, 'Vite must emit a dedicated ArchiveRoute production chunk')

  const chunksByFileName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const closure = new Map<string, MemoryChunk>()
  const queue = [archive]
  while (queue.length > 0) {
    const chunk = queue.shift()!
    if (closure.has(chunk.fileName)) continue
    closure.set(chunk.fileName, chunk)
    for (const importedFile of chunk.imports) {
      const importedChunk = chunksByFileName.get(importedFile)
      assert.ok(
        importedChunk,
        `Archive static import must resolve to an emitted chunk: ${importedFile}`,
      )
      queue.push(importedChunk)
    }
  }

  const forbiddenModules = [...closure.values()]
    .flatMap((chunk) => chunk.moduleIds)
    .map(normalized)
    .filter((moduleId) =>
      /\/node_modules\/(?:three|@react-three)\/|\/src\/features\/control\/|MissionScene/i.test(
        moduleId,
      ),
    )
  assert.deepEqual(forbiddenModules, [], 'Archive static module closure must remain 3D-free')

  const dynamicImports = [...closure.values()].flatMap((chunk) =>
    chunk.dynamicImports.map((importedFile) => `${chunk.fileName} -> ${importedFile}`),
  )
  assert.deepEqual(dynamicImports, [], 'Archive static closure must not hide a dynamic 3D import')

  const forbiddenAssets = [...closure.values()]
    .flatMap((chunk) => [...(chunk.viteMetadata?.importedAssets ?? [])])
    .filter((asset) => /\.(?:glb|ktx2|wasm)(?:\?|$)|draco|basis/i.test(asset))
  assert.deepEqual(
    forbiddenAssets,
    [],
    'Archive static closure must not import models, compressed textures, or decoder assets',
  )
})
