import { expect, test } from '@playwright/test'

import { assertNoRootOverflow, waitForScene } from './helpers.ts'

const labelSelector = [
  '.mission-status span',
  '.phase-rail button',
  '.phase-rail button span',
  '.panel-head h2',
  '.panel-head span',
  '.viewport-tools span',
  '.viewport-tools label',
  '.camera-tools button',
  '.scene-corner',
  '.event-readout span',
  '.event-readout summary',
  '.control-event-log time',
  '.control-event-log i',
  '.data-availability h3',
  '.data-availability dt',
  '.transport-controls button',
  '.speed-controls > span',
  '.speed-controls button',
  '.interface-audio-control span',
  '.interface-audio-control button',
].join(', ')

const primarySelector = [
  '.mission-status b',
  '.control-event-log button > span',
  '.viewport-tools b',
  '.viewport-tools select',
  '.event-readout b',
  '.systems-list .system-row > span',
  '.systems-list b',
  '.data-availability dd',
  '.interface-audio-control b',
].join(', ')

const bodySelector = [
  '.scene-corner.bottom-left',
  '.event-readout p',
  '.data-availability p',
  '.interface-audio-control > p',
].join(', ')

interface FontReading {
  fontSize: number
  selector: string
  text: string
}

async function visibleFontReadings(
  page: import('@playwright/test').Page,
  selector: string,
): Promise<FontReading[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => ({
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
        selector:
          element instanceof HTMLElement
            ? `${element.tagName.toLowerCase()}.${element.className}`
            : element.tagName.toLowerCase(),
        text: element.textContent?.trim().replace(/\s+/g, ' ') ?? '',
      })),
  )
}

test.describe('Control replay responsive type and touch contract at DPR 2', () => {
  test.use({ deviceScaleFactor: 2 })

  for (const viewport of [
    { width: 320, height: 568, bodyFloor: 16, primaryFloor: 16 },
    { width: 390, height: 844, bodyFloor: 16, primaryFloor: 16 },
    { width: 720, height: 450, bodyFloor: 16, primaryFloor: 16 },
    { width: 768, height: 512, bodyFloor: 16, primaryFloor: 16 },
    { width: 1440, height: 900, bodyFloor: 14, primaryFloor: 14 },
  ]) {
    test(`${viewport.width}×${viewport.height} preserves readable replay information`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('/control/event/a11-liftoff')
      await waitForScene(page)
      await page.locator('.event-readout details').evaluate((details) => {
        ;(details as HTMLDetailsElement).open = true
      })

      await assertNoRootOverflow(page)

      const labels = await visibleFontReadings(page, labelSelector)
      const primaryValues = await visibleFontReadings(page, primarySelector)
      const body = await visibleFontReadings(page, bodySelector)
      expect(labels.length).toBeGreaterThan(0)
      expect(primaryValues.length).toBeGreaterThan(0)
      expect(body.length).toBeGreaterThan(0)
      expect(labels.filter(({ fontSize }) => fontSize < 12)).toEqual([])
      expect(primaryValues.filter(({ fontSize }) => fontSize < viewport.primaryFloor)).toEqual([])
      expect(body.filter(({ fontSize }) => fontSize < viewport.bodyFloor)).toEqual([])

      const undersizedTargets = await page
        .locator('a, button, summary, input, select')
        .evaluateAll((elements) =>
          elements
            .filter((element) => {
              if (element.matches(':disabled')) return false
              const rectangle = element.getBoundingClientRect()
              const style = getComputedStyle(element)
              return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rectangle.width > 0 &&
                rectangle.height > 0 &&
                (rectangle.width < 44 || rectangle.height < 44)
              )
            })
            .map((element) => {
              const rectangle = element.getBoundingClientRect()
              return {
                height: rectangle.height,
                label: element.getAttribute('aria-label') ?? element.textContent?.trim(),
                tag: element.tagName,
                width: rectangle.width,
              }
            }),
        )
      expect(undersizedTargets).toEqual([])

      const playbackRegions = await page.evaluate(() => {
        const read = (selector: string) => {
          const rectangle = document.querySelector<HTMLElement>(selector)?.getBoundingClientRect()
          if (!rectangle) return undefined
          return {
            bottom: rectangle.bottom,
            left: rectangle.left,
            right: rectangle.right,
            top: rectangle.top,
          }
        }
        return {
          speed: read('.speed-controls'),
          timeline: read('.timeline-slider'),
          transport: read('.transport-controls'),
        }
      })
      const overlaps = (
        left: { bottom: number; left: number; right: number; top: number } | undefined,
        right: { bottom: number; left: number; right: number; top: number } | undefined,
      ) =>
        Boolean(
          left &&
          right &&
          Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1 &&
          Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1,
        )
      expect(playbackRegions.transport).toBeDefined()
      expect(playbackRegions.timeline).toBeDefined()
      expect(playbackRegions.speed).toBeDefined()
      expect(overlaps(playbackRegions.transport, playbackRegions.timeline)).toBe(false)
      expect(overlaps(playbackRegions.timeline, playbackRegions.speed)).toBe(false)
      expect(overlaps(playbackRegions.transport, playbackRegions.speed)).toBe(false)

      const textIntegrity = await page
        .locator(
          '.viewport-tools > div:first-child b, .scene-corner.bottom-left, .event-readout details p, .systems-list .system-row > span',
        )
        .evaluateAll((elements) =>
          elements
            .filter((element) => element.getClientRects().length > 0)
            .map((element) => {
              const htmlElement = element as HTMLElement
              const style = getComputedStyle(element)
              return {
                clippedHeight: htmlElement.scrollHeight > htmlElement.clientHeight + 1,
                clippedWidth: htmlElement.scrollWidth > htmlElement.clientWidth + 1,
                overflowWrap: style.overflowWrap,
                text: element.textContent?.trim().replace(/\s+/g, ' '),
                textOverflow: style.textOverflow,
                whiteSpace: style.whiteSpace,
              }
            }),
        )
      expect(textIntegrity.length).toBeGreaterThan(0)
      expect(
        textIntegrity.filter(
          ({ clippedHeight, clippedWidth, textOverflow, whiteSpace }) =>
            clippedHeight || clippedWidth || textOverflow === 'ellipsis' || whiteSpace === 'nowrap',
        ),
      ).toEqual([])

      await page.locator('.phase-rail button').filter({ hasText: 'SURFACE' }).click()
      const configurationChange = page.locator('.configuration-change')
      await expect(configurationChange).toBeVisible()
      expect(
        await configurationChange.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize),
        ),
      ).toBeGreaterThanOrEqual(viewport.bodyFloor)
      expect(
        await configurationChange
          .locator('span')
          .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
      ).toBeGreaterThanOrEqual(12)

      await page.getByLabel('QUALITY').selectOption('fallback')
      const fallbackTitle = page.locator('.static-vehicle-fallback b')
      await expect(fallbackTitle).toBeVisible()
      expect(
        await fallbackTitle.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize),
        ),
      ).toBeGreaterThanOrEqual(viewport.primaryFloor)
    })
  }
})
