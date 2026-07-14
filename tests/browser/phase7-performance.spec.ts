import { expect, test, type Page } from '@playwright/test'

import { readRenderer, waitForScene, type RendererReading } from './helpers.ts'

interface FrameAudit {
  averageFps: number
  elapsedMs: number
  monotonic: boolean
  p50Fps: number
  p50FrameMs: number
  p95FrameMs: number
  p95FrameTimeFps: number
  rendererFrames: number
  sampleCount: number
}

async function measureRendererFrames(
  page: Page,
  viewport: { width: number; height: number },
): Promise<FrameAudit> {
  await page.setViewportSize(viewport)
  await page.goto('/control/met/000:01:00')
  await waitForScene(page)
  await page.getByRole('button', { name: '1×', exact: true }).click()
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await page.waitForTimeout(200)

  const audit = await page.evaluate(
    () =>
      new Promise<FrameAudit>((resolve) => {
        const samples: Array<{ frame: number; timestamp: number }> = []
        let previousFrame = -1
        let rafCount = 0

        const tick = (timestamp: number) => {
          window.dispatchEvent(new Event('apollo11:renderer-audit'))
          const frame = Number(document.documentElement.dataset.rendererFrames ?? -1)
          if (frame !== previousFrame && frame >= 0) {
            samples.push({ frame, timestamp })
            previousFrame = frame
          }
          rafCount += 1

          if (samples.length >= 120 || rafCount >= 480) {
            const intervals: number[] = []
            let monotonic = true
            for (let index = 1; index < samples.length; index += 1) {
              const frameDelta = samples[index].frame - samples[index - 1].frame
              if (frameDelta <= 0) monotonic = false
              if (frameDelta > 0) {
                intervals.push(
                  (samples[index].timestamp - samples[index - 1].timestamp) / frameDelta,
                )
              }
            }
            intervals.sort((left, right) => left - right)
            const percentile = (fraction: number) =>
              intervals[
                Math.min(intervals.length - 1, Math.floor((intervals.length - 1) * fraction))
              ]
            const first = samples[0]
            const last = samples.at(-1)!
            const elapsedMs = last.timestamp - first.timestamp
            const rendererFrames = last.frame - first.frame
            const p50FrameMs = percentile(0.5)
            const p95FrameMs = percentile(0.95)
            resolve({
              averageFps: (rendererFrames * 1000) / elapsedMs,
              elapsedMs,
              monotonic,
              p50Fps: 1000 / p50FrameMs,
              p50FrameMs,
              p95FrameMs,
              p95FrameTimeFps: 1000 / p95FrameMs,
              rendererFrames,
              sampleCount: samples.length,
            })
            return
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )

  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  return audit
}

test('Archive cold-start transfer stays below the JS budget and remains 3D-isolated', async ({
  page,
}) => {
  const shellStart = Date.now()
  await page.goto('/archive')
  await page.getByRole('heading', { name: 'APOLLO 11', exact: true }).waitFor()
  const shellReadableMs = Date.now() - shellStart
  await page.waitForLoadState('networkidle')

  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((entry) => {
      const resource = entry as PerformanceResourceTiming
      return {
        encodedBodySize: resource.encodedBodySize,
        name: resource.name,
        transferSize: resource.transferSize,
      }
    }),
  )
  const jsBytes = resources
    .filter((resource) => /\.js(?:\?|$)/.test(resource.name))
    .reduce((sum, resource) => sum + resource.encodedBodySize, 0)
  const cssBytes = resources
    .filter((resource) => /\.css(?:\?|$)/.test(resource.name))
    .reduce((sum, resource) => sum + resource.encodedBodySize, 0)
  const totalTransferBytes = resources.reduce((sum, resource) => sum + resource.transferSize, 0)
  const forbidden = resources.filter((resource) =>
    /MissionScene|three|react-three|\.(?:glb|ktx2)(?:\?|$)|draco|basis_transcoder/i.test(
      resource.name,
    ),
  )

  const result = { cssBytes, jsBytes, shellReadableMs, totalTransferBytes }
  console.log(`PHASE7_ARCHIVE_PERF ${JSON.stringify(result)}`)
  expect(jsBytes).toBeLessThanOrEqual(350 * 1024)
  expect(forbidden).toEqual([])
})

test('Control shell, deep link, and model become readable from a cold route', async ({ page }) => {
  const session = await page.context().newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.setCacheDisabled', { cacheDisabled: true })
  const start = Date.now()

  await page.goto('/control/event/a11-pdi-ignition', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.met-display')).toHaveText('102:33:05.2')
  const deepLinkReadableMs = Date.now() - start
  await expect(page.getByRole('button', { name: 'PLAY', exact: true })).toBeEnabled()
  const interactiveShellMs = Date.now() - start
  await page.locator('canvas').waitFor()
  await expect
    .poll(async () => {
      await page.evaluate(() => window.dispatchEvent(new Event('apollo11:renderer-audit')))
      return Number(
        await page.evaluate(() => document.documentElement.dataset.rendererGeometries ?? 0),
      )
    })
    .toBeGreaterThan(5)
  const modelVisibleMs = Date.now() - start
  await page.waitForLoadState('networkidle')
  const totalTransferBytes = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry as PerformanceResourceTiming)
      .reduce((sum, entry) => sum + entry.transferSize, 0),
  )

  console.log(
    `PHASE7_CONTROL_COLD ${JSON.stringify({
      deepLinkReadableMs,
      interactiveShellMs,
      modelVisibleMs,
      totalTransferBytes,
    })}`,
  )
})

test('low, medium, and high scene qualities stay within geometry, draw-call, and transfer budgets', async ({
  page,
}) => {
  const qualities = [
    {
      quality: 'low',
      triangleBudget: 120_000,
      drawCallBudget: 100,
      transferBudget: 7 * 1024 * 1024,
    },
    {
      quality: 'medium',
      triangleBudget: 400_000,
      drawCallBudget: 200,
      transferBudget: 12 * 1024 * 1024,
    },
    {
      quality: 'high',
      triangleBudget: 400_000,
      drawCallBudget: 200,
      transferBudget: 30 * 1024 * 1024,
    },
  ] as const

  for (const budget of qualities) {
    await page.setViewportSize(
      budget.quality === 'low' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    )
    await page.goto('/control/event/a11-liftoff')
    await waitForScene(page)
    const qualitySelect = page.getByLabel('QUALITY')
    if (budget.quality === 'high') {
      await qualitySelect.selectOption(budget.quality)
    } else {
      await expect(qualitySelect).toHaveValue(budget.quality)
    }
    await page.waitForLoadState('networkidle')

    const readings: RendererReading[] = []
    const phaseButtons = page.locator('.phase-rail button')
    for (let index = 0; index < (await phaseButtons.count()); index += 1) {
      await phaseButtons.nth(index).click()
      await page.waitForTimeout(220)
      readings.push(await readRenderer(page))
    }

    const maxTriangles = Math.max(...readings.map((reading) => reading.triangles))
    const maxDrawCalls = Math.max(...readings.map((reading) => reading.calls))
    const maxTextures = Math.max(...readings.map((reading) => reading.textures))
    const modelTransferBytes = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry as PerformanceResourceTiming)
        .filter((entry) => /\.(?:glb|ktx2)(?:\?|$)/.test(entry.name))
        .reduce((sum, entry) => sum + entry.encodedBodySize, 0),
    )
    const rgbaTextureUpperBound = 2 * 1024 * 512 * 4 * (4 / 3)
    const gpuUpperBoundBytes = (maxTriangles * 108 + rgbaTextureUpperBound) * 1.2
    const result = {
      gpuUpperBoundBytes,
      maxDrawCalls,
      maxTextures,
      maxTriangles,
      modelTransferBytes,
      quality: budget.quality,
    }
    console.log(`PHASE7_QUALITY_PERF ${JSON.stringify(result)}`)

    expect(maxTriangles).toBeLessThanOrEqual(budget.triangleBudget)
    expect(maxDrawCalls).toBeLessThanOrEqual(budget.drawCallBudget)
    expect(modelTransferBytes).toBeLessThanOrEqual(budget.transferBudget)
    expect(gpuUpperBoundBytes).toBeLessThanOrEqual(
      (budget.quality === 'low' ? 128 : 256) * 1024 * 1024,
    )
  }
})

test('desktop and mobile playback meet renderer-frame p95 targets', async ({ page }) => {
  const desktop = await measureRendererFrames(page, { width: 1440, height: 900 })
  const mobile = await measureRendererFrames(page, { width: 390, height: 844 })
  console.log(`PHASE7_FPS ${JSON.stringify({ desktop, mobile })}`)

  expect(desktop.monotonic).toBe(true)
  expect(mobile.monotonic).toBe(true)
  expect(desktop.p95FrameTimeFps).toBeGreaterThanOrEqual(50)
  expect(mobile.p95FrameTimeFps).toBeGreaterThanOrEqual(30)
})

test('10 complete phase traversals do not grow renderer resources or lose context', async ({
  page,
}) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await page.evaluate(() => {
    window.__apollo11ContextLosses = 0
    document.querySelector('canvas')?.addEventListener('webglcontextlost', () => {
      window.__apollo11ContextLosses += 1
    })
  })

  const phaseButtons = page.locator('.phase-rail button')
  const traverse = async () => {
    for (let index = 0; index < (await phaseButtons.count()); index += 1) {
      await phaseButtons.nth(index).click()
      await page.waitForTimeout(120)
    }
  }

  await traverse()
  const cycles: RendererReading[] = []
  for (let cycle = 0; cycle < 10; cycle += 1) {
    await traverse()
    cycles.push(await readRenderer(page))
  }
  const contextLosses = await page.evaluate(() => window.__apollo11ContextLosses)
  const resources = cycles.map(({ geometries, materials, programs, textures }) => ({
    geometries,
    materials,
    programs,
    textures,
  }))
  console.log(`PHASE7_RENDERER_MEMORY ${JSON.stringify({ contextLosses, resources })}`)

  expect(new Set(resources.map((resource) => JSON.stringify(resource))).size).toBe(1)
  expect(new Set(cycles.map((reading) => reading.canvasCount))).toEqual(new Set([1]))
  expect(contextLosses).toBe(0)
})

declare global {
  interface Window {
    __apollo11ContextLosses: number
  }
}
