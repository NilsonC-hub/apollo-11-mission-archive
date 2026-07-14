import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const root = process.cwd()

async function copy(source: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(source, destination)
}

async function copyMatching(sourceDir: string, destinationDir: string, pattern: RegExp) {
  for (const file of await readdir(sourceDir)) {
    if (pattern.test(file)) await copy(join(sourceDir, file), join(destinationDir, file))
  }
}

await copyMatching(
  join(root, 'assets', 'derived', 'models'),
  join(root, 'public', 'missions', 'apollo11', 'models'),
  /\.glb$/,
)
await copyMatching(
  join(root, 'assets', 'derived', 'textures'),
  join(root, 'public', 'missions', 'apollo11', 'textures'),
  /\.ktx2$/,
)
await copyMatching(
  join(root, 'docs', 'media'),
  join(root, 'public', 'missions', 'apollo11', 'plates'),
  /\.png$/,
)
await copyMatching(
  join(root, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf'),
  join(root, 'public', 'missions', 'apollo11', 'decoders', 'three-draco'),
  /^(draco_decoder\.wasm|draco_wasm_wrapper\.js|draco_decoder\.js)$/,
)
await copyMatching(
  join(root, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'basis'),
  join(root, 'public', 'missions', 'apollo11', 'decoders', 'three-basis'),
  /^(basis_transcoder\.wasm|basis_transcoder\.js)$/,
)
