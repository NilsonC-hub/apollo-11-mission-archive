import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const blender = 'D:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe'
const recipe = resolve(ROOT, 'scripts/blender/process_apollo11_assets.py')

if (!existsSync(blender)) {
  throw new Error(`Pinned Blender 4.3 executable not found: ${blender}`)
}

execFileSync(
  blender,
  ['--background', '--python-exit-code', '1', '--python', recipe, '--', '--root', ROOT],
  {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: 20 * 60 * 1000,
  },
)
