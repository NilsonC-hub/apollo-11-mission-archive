[CmdletBinding()]
param(
  [ValidateRange(1024, 65535)]
  [int]$Port = 4173,

  [switch]$NoBrowser,

  [switch]$SkipBuild,

  [switch]$ExitAfterReady
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = "http://127.0.0.1:$Port/archive"
$serverProcess = $null

function Get-PreviewResponse {
  try {
    return Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 1
  } catch {
    return $null
  }
}

function Invoke-Pnpm {
  param([Parameter(Mandatory)][string[]]$CommandArguments)

  & $script:pnpmPath @CommandArguments
  if ($LASTEXITCODE -ne 0) {
    throw "pnpm $($CommandArguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

Set-Location -LiteralPath $repoRoot

$existingPreview = Get-PreviewResponse
if ($null -ne $existingPreview) {
  if ($existingPreview.Content -notmatch '<title>Apollo 11 Mission Archive</title>') {
    throw "Port $Port is already serving another application. Close it or run scripts/open-preview.ps1 with -Port <number>."
  }

  if (-not $NoBrowser) {
    Start-Process $previewUrl
  }
  Write-Host "Apollo 11 preview is already running at $previewUrl" -ForegroundColor Green
  exit 0
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeCommand) {
  throw 'Node.js 22 or newer is required. Install Node.js, then run this launcher again.'
}

$nodeVersionText = (& $nodeCommand.Source --version).Trim().TrimStart('v')
$nodeMajorVersion = [int]($nodeVersionText.Split('.')[0])
if ($nodeMajorVersion -lt 22) {
  throw "Node.js 22 or newer is required; found v$nodeVersionText."
}

$pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if ($null -eq $pnpmCommand) {
  $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
}
if ($null -eq $pnpmCommand) {
  throw 'pnpm 9 or newer is required. Install pnpm, then run this launcher again.'
}
$script:pnpmPath = $pnpmCommand.Source

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'node_modules'))) {
  Write-Host 'Dependencies are missing; installing the locked dependency set...' -ForegroundColor Cyan
  Invoke-Pnpm @('install', '--frozen-lockfile')
}

if (-not $SkipBuild) {
  Write-Host 'Building the current Apollo 11 production preview...' -ForegroundColor Cyan
  Invoke-Pnpm @('build')
} elseif (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'dist/index.html'))) {
  throw 'Cannot use -SkipBuild because dist/index.html does not exist.'
}

Write-Host "Starting Apollo 11 at $previewUrl" -ForegroundColor Green

try {
  $viteCli = Join-Path $repoRoot 'node_modules/vite/bin/vite.js'
  if (-not (Test-Path -LiteralPath $viteCli)) {
    throw "Vite preview entry point is missing: $viteCli"
  }

  $serverProcess = Start-Process `
    -FilePath $nodeCommand.Source `
    -ArgumentList @($viteCli, 'preview', '--host', '127.0.0.1', '--port', $Port, '--strictPort') `
    -WorkingDirectory $repoRoot `
    -NoNewWindow `
    -PassThru

  $deadline = (Get-Date).AddSeconds(45)
  $readyResponse = $null
  while ((Get-Date) -lt $deadline -and -not $serverProcess.HasExited) {
    $readyResponse = Get-PreviewResponse
    if ($null -ne $readyResponse) {
      break
    }
    Start-Sleep -Milliseconds 250
    $serverProcess.Refresh()
  }

  if ($serverProcess.HasExited) {
    throw "Preview server stopped during startup with exit code $($serverProcess.ExitCode)."
  }
  if ($null -eq $readyResponse) {
    throw "Preview did not become ready within 45 seconds: $previewUrl"
  }
  if ($readyResponse.Content -notmatch '<title>Apollo 11 Mission Archive</title>') {
    throw "Preview returned unexpected content at $previewUrl"
  }

  if (-not $NoBrowser) {
    Start-Process $previewUrl
  }

  Write-Host "Apollo 11 preview is ready at $previewUrl" -ForegroundColor Green
  if ($ExitAfterReady) {
    return
  }

  Write-Host 'Keep this window open while previewing. Press Ctrl+C or close it to stop.'
  Wait-Process -Id $serverProcess.Id
  $serverProcess.Refresh()
  if ($serverProcess.ExitCode -ne 0) {
    throw "Preview server stopped with exit code $($serverProcess.ExitCode)."
  }
} finally {
  if ($null -ne $serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    $null = $serverProcess.WaitForExit(5000)
  }
}
