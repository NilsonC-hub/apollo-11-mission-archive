import { expect, test, type Page } from '@playwright/test'

import { appendixEventIds, waitForScene } from './helpers.ts'

async function prepareArchive(
  page: Page,
  viewport: { width: number; height: number },
): Promise<void> {
  await page.setViewportSize(viewport)
  await page.goto('/archive')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
}

async function prepareControl(
  page: Page,
  eventId: string,
  viewport = { width: 1440, height: 900 },
): Promise<void> {
  await page.setViewportSize(viewport)
  await page.goto(`/control/event/${eventId}`)
  await waitForScene(page)
}

test('Archive Mission Index — desktop baseline', async ({ page }) => {
  await prepareArchive(page, { width: 1440, height: 900 })
  await expect(page).toHaveScreenshot('archive-index-desktop.png')
})

test('Archive Mission Index — 390 px baseline', async ({ page }) => {
  await prepareArchive(page, { width: 390, height: 844 })
  await expect(page).toHaveScreenshot('archive-index-mobile-390.png')
})

test('Archive Saturn V dossier baseline', async ({ page }) => {
  await prepareArchive(page, { width: 1440, height: 900 })
  await page.locator('#saturn').scrollIntoViewIfNeeded()
  await expect(page).toHaveScreenshot('archive-saturn-v.png')
})

test('Archive Columbia and Eagle dossier baseline', async ({ page }) => {
  await prepareArchive(page, { width: 1440, height: 900 })
  await page.locator('#spacecraft').scrollIntoViewIfNeeded()
  await expect(page).toHaveScreenshot('archive-spacecraft.png')
})

for (const eventId of appendixEventIds) {
  test(`Control direct event baseline — ${eventId}`, async ({ page }) => {
    await prepareControl(page, eventId)
    await expect(page).toHaveScreenshot(`control-${eventId}.png`)
  })
}

test('Control component inspection baseline', async ({ page }) => {
  await prepareControl(page, 'a11-liftoff')
  await page.getByRole('button', { name: 'Inspect S-IC FIRST STAGE' }).click()
  await expect(page.getByText('COMPONENT INSPECTION · REPLAY PAUSED')).toBeVisible()
  await page.waitForTimeout(700)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('control-inspection.png')
})

test('Mission Control WebGL fallback baseline', async ({ page }) => {
  await prepareControl(page, 'a11-touchdown')
  await page.getByLabel('QUALITY').selectOption('fallback')
  await expect(page.getByRole('img', { name: 'Static vehicle structure fallback' })).toBeVisible()
  await expect(page).toHaveScreenshot('control-webgl-fallback.png')
})

test('Mission Control Reduced Motion baseline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await prepareControl(page, 'a11-tli-ignition')
  await expect(page).toHaveScreenshot('control-reduced-motion.png')
})

test('390 px event jump and free-look baseline', async ({ page }) => {
  await prepareControl(page, 'a11-touchdown', { width: 390, height: 844 })
  await page.getByRole('button', { name: 'ROTATE −', exact: true }).click()
  await expect(page.locator('.camera-mode b')).toHaveText('FREE LOOK')
  await expect(page).toHaveScreenshot('control-mobile-390-free-look.png')
})
