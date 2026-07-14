import { expect, test } from '@playwright/test'

import { formatMet } from '../../src/mission-core/index.ts'
import { getEvent } from '../../src/app/mission.ts'
import { appendixEventIds, assertNoRootOverflow, waitForScene } from './helpers.ts'

test('Archive cold route remains isolated from Three, R3F, models, textures, and decoders', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  await page.goto('/archive')
  await page.waitForLoadState('networkidle')

  const forbidden = requests.filter((url) =>
    /MissionScene|three|react-three|\.(?:glb|ktx2)(?:\?|$)|draco|basis_transcoder/i.test(url),
  )
  expect(forbidden).toEqual([])
  await expect(page.getByRole('heading', { name: 'APOLLO 11', exact: true })).toBeVisible()
  await assertNoRootOverflow(page)
})

test('all Appendix C.9 event deep links resolve to their verified MET', async ({ page }) => {
  for (const eventId of appendixEventIds) {
    await page.goto(`/control/event/${eventId}`)
    await waitForScene(page)
    const expectedMet = formatMet(getEvent(eventId).metSeconds, { fractionDigits: 1 })
    await expect(page.locator('.met-display')).toHaveText(expectedMet)
    await expect(page.getByText('STAR FIELD / SCHEMATIC · NOT NAVIGATION')).toBeVisible()
    await assertNoRootOverflow(page)
  }
})

test('responsive matrix has no root overflow and preserves truth labels', async ({ page }) => {
  const viewports = [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ]
  const routes = ['/archive', '/control/event/a11-pdi-ignition', '/control/event/a11-splashdown']

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    for (const route of routes) {
      await page.goto(route)
      if (route.startsWith('/control')) await waitForScene(page)
      await assertNoRootOverflow(page)
      if (route.includes('pdi')) {
        await expect(page.getByText(/NOT CERTIFIED LM-5/).first()).toBeVisible()
      }
    }
  }
})

test('storyTime playback stops for editorial review and resumes explicitly', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()

  await expect(page.getByText('EVENT PAUSE — EDITORIAL')).toBeVisible()
  await expect(page.getByText(/HISTORICAL AUDIO NOT AVAILABLE/)).toBeVisible()
  const frozen = await page.locator('.met-display').textContent()
  await page.waitForTimeout(250)
  await expect(page.locator('.met-display')).toHaveText(frozen ?? '')

  await page
    .getByLabel('EVENT PAUSE — EDITORIAL')
    .getByRole('button', { name: 'CONTINUE REPLAY', exact: true })
    .click()
  await expect(page.getByRole('button', { name: 'PAUSE', exact: true })).toBeVisible()
  await expect.poll(() => page.locator('.met-display').textContent()).not.toBe(frozen)
})

test('mode changes pause replay and require an explicit resume', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await page
    .getByLabel('EVENT PAUSE — EDITORIAL')
    .getByRole('button', { name: 'CONTINUE REPLAY', exact: true })
    .click()
  await page.waitForTimeout(150)

  await page.getByRole('link', { name: '01 ARCHIVE', exact: true }).click()
  await page.getByRole('link', { name: '02 MISSION CONTROL', exact: true }).click()
  await expect(page.getByText('REPLAY PAUSED ON MODE CHANGE')).toBeVisible()

  const pausedMet = await page.locator('.met-display').textContent()
  await page.waitForTimeout(250)
  await expect(page.locator('.met-display')).toHaveText(pausedMet ?? '')
  await page.getByRole('button', { name: 'RESUME REPLAY', exact: true }).click()
  await expect.poll(() => page.locator('.met-display').textContent()).not.toBe(pausedMet)
})

test('explicit and unavailable-WebGL fallbacks retain the readable mission shell', async ({
  page,
}) => {
  await page.goto('/control/event/a11-touchdown')
  await waitForScene(page)
  await page.getByLabel('QUALITY').selectOption('fallback')
  await expect(page.getByRole('img', { name: 'Static vehicle structure fallback' })).toBeVisible()
  await expect(page.getByText('WEBGL OR MODEL DECODER UNAVAILABLE')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.met-display')).toHaveText('102:45:39.9')
})

test('browser WebGL unavailability is detected before Canvas is created', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...arguments_) {
      if (type === 'webgl' || type === 'webgl2') return null
      return original.call(this, type, ...arguments_)
    } as typeof HTMLCanvasElement.prototype.getContext
  })
  await page.goto('/control/event/a11-touchdown')

  await expect(page.getByRole('img', { name: 'Static vehicle structure fallback' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.met-display')).toHaveText('102:45:39.9')
})

test('model or decoder request failure falls back without losing mission text', async ({
  page,
}) => {
  await page.route(/\/missions\/apollo11\/(?:models|textures|decoders)\//, (route) => route.abort())
  await page.goto('/control/event/a11-liftoff')

  await expect(page.getByRole('img', { name: 'Static vehicle structure fallback' })).toBeVisible()
  await expect(page.locator('.met-display')).toHaveText('000:00:00.6')
  await expect(page.getByText('STAR FIELD / SCHEMATIC · NOT NAVIGATION')).toBeVisible()
})

test('keyboard skip link, reduced motion, and mobile touch targets remain usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/archive')
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()

  const motion = await page.evaluate(() => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }))
  expect(motion).toEqual({ matches: true, scrollBehavior: 'auto' })

  for (const route of ['/archive', '/control/event/a11-touchdown']) {
    await page.goto(route)
    if (route.startsWith('/control')) await waitForScene(page)
    const undersized = await page
      .locator('a, button, summary, input, select')
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => {
            const rectangle = node.getBoundingClientRect()
            const style = getComputedStyle(node)
            return (
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              rectangle.width > 0 &&
              rectangle.height > 0 &&
              (rectangle.width < 44 || rectangle.height < 44)
            )
          })
          .map((node) => ({ text: node.textContent?.trim(), tag: node.tagName })),
      )
    expect(undersized).toEqual([])
  }
})

test('200% zoom equivalent keeps the 1440×900 physical viewport readable', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    deviceScaleFactor: 2,
    viewport: { width: 720, height: 450 },
  })
  const page = await context.newPage()
  await page.goto('/control/event/a11-touchdown')
  await waitForScene(page)
  await assertNoRootOverflow(page)
  await expect(page.getByText(/NOT CERTIFIED LM-5/).first()).toBeVisible()
  await context.close()
})
