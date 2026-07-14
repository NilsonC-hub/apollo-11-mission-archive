import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TOKTX = resolve(ROOT, '.tools/ktx-4.4.2/bin/toktx.exe')
const WORK = resolve(ROOT, '.tools/texture-work')
const OUTPUT = resolve(ROOT, 'assets/derived/textures')

if (!existsSync(TOKTX)) {
  throw new Error('Pinned toktx is missing. Run pnpm bootstrap:ktx first.')
}
mkdirSync(WORK, { recursive: true })
mkdirSync(OUTPUT, { recursive: true })

const inputs = [
  {
    assetId: 'earth-blue-marble',
    sourceId: 'NASA-EARTH-BLUE-MARBLE-SVS',
    source: resolve(ROOT, 'assets/raw/NASA-EARTH-BLUE-MARBLE-8k.tif'),
    truthLabel: 'NASA IMAGERY-BASED TEXTURE — MODERN COMPOSITE',
  },
  {
    assetId: 'moon-lro-color',
    sourceId: 'NASA-MOON-CGI-COLOR-8K',
    source: resolve(ROOT, 'assets/raw/NASA-MOON-CGI-8k.tif'),
    truthLabel: 'NASA IMAGERY-BASED TEXTURE — MODERN LRO PRODUCT',
  },
] as const

const levels = [
  { lod: '1k', width: 1024, height: 512 },
  { lod: '2k', width: 2048, height: 1024 },
  { lod: '4k', width: 4096, height: 2048 },
] as const

const report: {
  recipeVersion: number
  tool: string
  encoder: Record<string, string | number | boolean>
  assets: Array<Record<string, unknown>>
} = {
  recipeVersion: 1,
  tool: 'Khronos toktx 4.4.2',
  encoder: {
    format: 'KTX2 ETC1S',
    qlevel: 180,
    clevel: 2,
    mipmaps: true,
    filter: 'lanczos4',
    threads: 1,
    transferFunction: 'sRGB',
  },
  assets: [],
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

for (const input of inputs) {
  if (!existsSync(input.source)) throw new Error(`Missing raw texture: ${input.source}`)
  const png = resolve(WORK, `${input.assetId}-source.png`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input.source, '-frames:v', '1', png], {
    stdio: 'inherit',
    timeout: 5 * 60 * 1000,
  })
  for (const level of levels) {
    const output = resolve(OUTPUT, `${input.assetId}-${level.lod}.ktx2`)
    execFileSync(
      TOKTX,
      [
        '--t2',
        '--encode',
        'etc1s',
        '--qlevel',
        '180',
        '--clevel',
        '2',
        '--threads',
        '1',
        '--genmipmap',
        '--filter',
        'lanczos4',
        '--resize',
        `${level.width}x${level.height}`,
        '--assign_oetf',
        'srgb',
        '--',
        output,
        png,
      ],
      { stdio: 'inherit', timeout: 10 * 60 * 1000 },
    )
    report.assets.push({
      assetId: input.assetId,
      sourceId: input.sourceId,
      truthLabel: input.truthLabel,
      projection: 'equirectangular',
      colorSpace: 'sRGB',
      lod: level.lod,
      width: level.width,
      height: level.height,
      path: output.slice(ROOT.length + 1).replaceAll('\\', '/'),
      bytes: readFileSync(output).byteLength,
      sha256: sha256(output),
    })
  }
}

writeFileSync(
  resolve(ROOT, 'docs/audit/PHASE-3-TEXTURE-PROCESSING.json'),
  `${JSON.stringify(report, null, 2)}\n`,
)
console.log(JSON.stringify(report, null, 2))
