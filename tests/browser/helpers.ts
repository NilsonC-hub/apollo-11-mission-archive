import { expect, type Page } from '@playwright/test'

export const appendixEventIds = [
  'a11-tli-ignition',
  'a11-loi-ignition',
  'a11-undocking',
  'a11-pdi-ignition',
  'a11-touchdown',
  'a11-first-step',
  'a11-lunar-liftoff',
  'a11-tei-ignition',
  'a11-entry-interface',
  'a11-splashdown',
] as const

export async function waitForScene(page: Page): Promise<void> {
  await page.locator('canvas, .static-vehicle-fallback').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  const canvas = page.locator('canvas')
  if (await canvas.count()) {
    await expect(page.locator('html')).toHaveAttribute('data-control-scene', 'ready')
  }
}

export async function waitForInspectionCamera(page: Page, componentId: string): Promise<void> {
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-inspect-target', componentId)
  await expect(html).toHaveAttribute('data-inspect-target-count', '1')
  await expect(html).toHaveAttribute('data-camera-settled', componentId)
}

export async function assertNoRootOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

export interface RendererReading {
  calls: number
  canvasCount: number
  frames: number
  geometries: number
  materials: number
  programs: number
  textures: number
  triangles: number
}

export async function readRenderer(page: Page): Promise<RendererReading> {
  await page.evaluate(() => window.dispatchEvent(new Event('apollo11:renderer-audit')))
  await page.waitForTimeout(20)
  return page.evaluate(() => ({
    calls: Number(document.documentElement.dataset.rendererCalls),
    canvasCount: document.querySelectorAll('canvas').length,
    frames: Number(document.documentElement.dataset.rendererFrames),
    geometries: Number(document.documentElement.dataset.rendererGeometries),
    materials: Number(document.documentElement.dataset.rendererMaterials),
    programs: Number(document.documentElement.dataset.rendererPrograms),
    textures: Number(document.documentElement.dataset.rendererTextures),
    triangles: Number(document.documentElement.dataset.rendererTriangles),
  }))
}
