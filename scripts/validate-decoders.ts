import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import {
  EXTTextureWebP,
  KHRDracoMeshCompression,
  KHRMaterialsSpecular,
} from '@gltf-transform/extensions'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const createDecoderModule = require('draco3dgltf/draco_decoder_gltf_nodejs.js')
const dracoWasm = readFileSync(
  resolve(ROOT, 'public/missions/apollo11/decoders/draco/draco_decoder_gltf.wasm'),
)
const basisWasm = readFileSync(
  resolve(ROOT, 'public/missions/apollo11/decoders/ktx2/msc_basis_transcoder.wasm'),
)
const wasm = (
  globalThis as typeof globalThis & {
    WebAssembly: { compile(bytes: Uint8Array): Promise<unknown> }
  }
).WebAssembly

await wasm.compile(dracoWasm)
await wasm.compile(basisWasm)
const decoder = await createDecoderModule({ wasmBinary: dracoWasm })
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression, KHRMaterialsSpecular, EXTTextureWebP])
  .registerDependencies({ 'draco3d.decoder': decoder })

const modelDir = resolve(ROOT, 'assets/derived/models')
for (const name of readdirSync(modelDir).filter((name) => name.endsWith('.glb'))) {
  await io.readBinary(readFileSync(resolve(modelDir, name)))
  console.log(`[OK] Draco offline decode: ${name}`)
}

const ktx = resolve(ROOT, '.tools/ktx-4.4.2/bin/ktx.exe')
const textureDir = resolve(ROOT, 'assets/derived/textures')
for (const name of readdirSync(textureDir).filter((name) => name.endsWith('.ktx2'))) {
  execFileSync(ktx, ['validate', resolve(textureDir, name)], { stdio: 'pipe' })
  console.log(`[OK] KTX2 validation: ${basename(name)}`)
}

console.log(
  '[PASS] Pinned offline decoder WASM compiles; all derived Draco GLBs decode; all KTX2 files validate',
)
