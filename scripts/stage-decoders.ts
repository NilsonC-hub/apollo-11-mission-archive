import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dracoOutput = resolve(ROOT, 'public/missions/apollo11/decoders/draco')
const ktxOutput = resolve(ROOT, 'public/missions/apollo11/decoders/ktx2')
const ktxSource = resolve(ROOT, '.tools/ktx-web-4.4.2')

if (!existsSync(ktxSource))
  throw new Error('KTX web decoder missing. Run pnpm bootstrap:ktx first.')
mkdirSync(dracoOutput, { recursive: true })
mkdirSync(ktxOutput, { recursive: true })

copyFileSync(
  resolve(ROOT, 'node_modules/draco3dgltf/draco_decoder_gltf_nodejs.js'),
  resolve(dracoOutput, 'draco_decoder_gltf.js'),
)
copyFileSync(
  resolve(ROOT, 'node_modules/draco3dgltf/draco_decoder_gltf.wasm'),
  resolve(dracoOutput, 'draco_decoder_gltf.wasm'),
)
for (const entry of readdirSync(ktxSource, { withFileTypes: true })) {
  cpSync(resolve(ktxSource, entry.name), resolve(ktxOutput, entry.name), { recursive: true })
}
console.log(`[OK] Draco decoder staged at ${dracoOutput}`)
console.log(`[OK] KTX2 transcoder staged at ${ktxOutput}`)
