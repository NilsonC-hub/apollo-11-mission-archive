// Reproducibly provision the pinned Khronos KTX command-line tools without a
// system-wide install. The official Windows installer is a self-extracting
// archive; 7-Zip extracts it into the gitignored project-local .tools folder.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION = '4.4.2'
const URL = `https://github.com/KhronosGroup/KTX-Software/releases/download/v${VERSION}/KTX-Software-${VERSION}-Windows-x64.exe`
const EXPECTED_BYTES = 6_417_024
const EXPECTED_SHA256 = '1f323b0fec19794f5e6c0425a61d4b1da396872a10be862d105f4f4b2d2957fe'
const installer = resolve(ROOT, `.tools/downloads/KTX-Software-${VERSION}-Windows-x64.exe`)
const installDir = resolve(ROOT, `.tools/ktx-${VERSION}`)
const webZip = resolve(
  ROOT,
  `.tools/downloads/KTX-Software-${VERSION}-Web-msc_basis_transcoder.zip`,
)
const webDir = resolve(ROOT, `.tools/ktx-web-${VERSION}`)
const WEB_URL = `https://github.com/KhronosGroup/KTX-Software/releases/download/v${VERSION}/KTX-Software-${VERSION}-Web-msc_basis_transcoder.zip`
const WEB_BYTES = 216_927
const WEB_SHA256 = '06db18bd0fbd1469c2bef37f723ca821cb8b56fa2f50f5210926860a45484fa4'

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function verifiedInstaller(): boolean {
  return (
    existsSync(installer) &&
    statSync(installer).size === EXPECTED_BYTES &&
    sha256(installer) === EXPECTED_SHA256
  )
}

mkdirSync(dirname(installer), { recursive: true })
if (!verifiedInstaller()) {
  console.log(`[DOWNLOAD] Khronos KTX-Software ${VERSION}`)
  execFileSync(
    'curl.exe',
    ['-L', '--fail', '--ssl-no-revoke', '--max-time', '300', '-o', installer, URL],
    { stdio: 'inherit' },
  )
}

if (!verifiedInstaller()) {
  throw new Error('KTX installer size or SHA-256 does not match the pinned official release')
}

const candidates = [
  resolve(installDir, 'bin/toktx.exe'),
  resolve(installDir, 'tools/toktx.exe'),
  resolve(installDir, 'toktx.exe'),
]

if (!candidates.some(existsSync)) {
  mkdirSync(installDir, { recursive: true })
  console.log(`[EXTRACT] ${installDir}`)
  execFileSync('7z.exe', ['x', '-y', `-o${installDir}`, installer], { stdio: 'inherit' })
}

const toktx = candidates.find(existsSync)
if (!toktx) {
  throw new Error(`toktx.exe was not found after extracting ${installer}`)
}

console.log(`[OK] installer sha256=${EXPECTED_SHA256}`)
console.log(`[OK] toktx=${toktx}`)
execFileSync(toktx, ['--version'], { stdio: 'inherit' })

if (!existsSync(webZip) || statSync(webZip).size !== WEB_BYTES || sha256(webZip) !== WEB_SHA256) {
  console.log(`[DOWNLOAD] Khronos Basis Universal web transcoder ${VERSION}`)
  execFileSync(
    'curl.exe',
    ['-L', '--fail', '--ssl-no-revoke', '--max-time', '300', '-o', webZip, WEB_URL],
    { stdio: 'inherit' },
  )
}
if (statSync(webZip).size !== WEB_BYTES || sha256(webZip) !== WEB_SHA256) {
  throw new Error('KTX web transcoder size or SHA-256 does not match the pinned official release')
}
if (!existsSync(webDir)) {
  mkdirSync(webDir, { recursive: true })
  execFileSync('7z.exe', ['x', '-y', `-o${webDir}`, webZip], { stdio: 'inherit' })
}
console.log(`[OK] web transcoder sha256=${WEB_SHA256}`)
console.log(`[OK] web transcoder=${webDir}`)
