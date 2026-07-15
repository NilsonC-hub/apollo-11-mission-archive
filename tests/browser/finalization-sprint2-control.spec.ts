import { expect, test } from '@playwright/test'

import { SATURN_V_INSPECTOR_PATH } from '../../src/app/controlDeepLink.ts'
import {
  assertNoRootOverflow,
  readRenderer,
  waitForInspectionCamera,
  waitForScene,
} from './helpers.ts'

function cameraPosition(value: string | null): number[] {
  expect(value).toBeTruthy()
  return value!.split(',').map(Number)
}

function cameraDistance(left: number[], right: number[]): number {
  return Math.hypot(...left.map((value, index) => value - right[index]))
}

function inspectorComponentButton(page: import('@playwright/test').Page, label: string) {
  return page.locator('.saturn-inspector__index button').filter({
    has: page.getByText(label, { exact: true }),
  })
}

test('bare Control entry still canonicalizes playback before reload', async ({ page }) => {
  await page.goto('/control')
  await waitForScene(page)
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await page.waitForTimeout(180)
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  await expect(page).toHaveURL(/\/control\/met\/s/)
  const canonicalUrl = page.url()

  await page.reload()
  await waitForScene(page)
  await expect(page).toHaveURL(canonicalUrl)
})

test('Inspector direct route and reload wait for runtime before semantic focus', async ({
  page,
}) => {
  await page.goto(SATURN_V_INSPECTOR_PATH)
  await expect(page.getByRole('heading', { name: 'SATURN V STRUCTURE INSPECTOR' })).toBeVisible()
  await waitForScene(page)
  await waitForInspectionCamera(page, 's-ic')
  await expect(page).toHaveURL(new RegExp(`${SATURN_V_INSPECTOR_PATH}$`))

  await page.reload()
  await waitForScene(page)
  await waitForInspectionCamera(page, 's-ic')
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect(page).toHaveURL(new RegExp(`${SATURN_V_INSPECTOR_PATH}$`))
})

test('Inspector exposes canonical hierarchy and keeps dossier navigation in fallback', async ({
  page,
}) => {
  await page.goto(SATURN_V_INSPECTOR_PATH)
  await waitForScene(page)

  const firstStage = inspectorComponentButton(page, 'S-IC FIRST STAGE')
  const secondStage = inspectorComponentButton(page, 'S-II SECOND STAGE')
  await expect(firstStage).toBeVisible()
  await expect(secondStage).toBeVisible()
  const parentLabel = await secondStage.evaluate((button) => {
    const parentList = button.closest('li')?.parentElement
    const parentItem = parentList?.closest('li')
    return parentItem?.querySelector(':scope > button b')?.textContent
  })
  expect(parentLabel).toBe('S-IC / S-II INTERSTAGE')

  await page.getByLabel('Interactive Saturn V model').getByLabel('QUALITY').selectOption('fallback')
  await expect(page.locator('html')).toHaveAttribute('data-control-scene', 'fallback')
  await secondStage.click()
  await expect(page.getByRole('heading', { name: 'S-II SECOND STAGE' })).toBeVisible()

  await page.getByLabel('Interactive Saturn V model').getByLabel('QUALITY').selectOption('medium')
  await waitForScene(page)
  await waitForInspectionCamera(page, 's-ii')
  await assertNoRootOverflow(page)
})

test('Inspector Archive return and browser traversal preserve exact route identity', async ({
  page,
}) => {
  await page.goto(SATURN_V_INSPECTOR_PATH)
  await waitForScene(page)
  const returnLink = page.getByRole('link', { name: 'RETURN TO ARCHIVE / SATURN V' })
  await expect(returnLink).toHaveAttribute('href', '/archive#saturn-v')

  await returnLink.click()
  await expect(page).toHaveURL(/\/archive#saturn-v$/)
  await page.goBack()
  await expect(page).toHaveURL(new RegExp(`${SATURN_V_INSPECTOR_PATH}$`))
  await expect(page.getByRole('heading', { name: 'SATURN V STRUCTURE INSPECTOR' })).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(/\/archive#saturn-v$/)
})

test('audio status is truthful and Interface Tones are default-off', async ({ page }) => {
  await page.addInitScript(`
    (() => {
      const audit = window.__toneAudit = {
        constructed: 0, resumes: 0, suspends: 0, oscillatorStarts: 0,
        oscillatorStops: 0, oscillatorDisconnects: 0, gainDisconnects: 0,
        state: 'none'
      };
      class Param {
        setValueAtTime() {}
        exponentialRampToValueAtTime() {}
      }
      class Oscillator {
        constructor() { this.frequency = new Param(); this.onended = null; this.type = 'sine'; }
        connect() {}
        disconnect() { audit.oscillatorDisconnects += 1; }
        start() { audit.oscillatorStarts += 1; }
        stop() { audit.oscillatorStops += 1; }
      }
      class Gain {
        constructor() { this.gain = new Param(); }
        connect() {}
        disconnect() { audit.gainDisconnects += 1; }
      }
      class FakeAudioContext {
        constructor() { audit.constructed += 1; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; audit.state = this.state; }
        createOscillator() { return new Oscillator(); }
        createGain() { return new Gain(); }
        async resume() { audit.resumes += 1; this.state = 'running'; audit.state = this.state; }
        async suspend() { audit.suspends += 1; this.state = 'suspended'; audit.state = this.state; }
      }
      Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext });
    })();
  `)
  await page.goto(SATURN_V_INSPECTOR_PATH)
  await expect(page.getByText('HISTORICAL AUDIO', { exact: true })).toBeVisible()
  await expect(page.getByText('UNAVAILABLE', { exact: true })).toBeVisible()
  const toggle = page.getByRole('button', { name: 'OFF / ENABLE' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(await page.evaluate(() => window.__toneAudit.constructed)).toBe(0)

  await toggle.click()
  await expect(page.getByRole('button', { name: 'ON / DISABLE' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(
    await page.evaluate(() => ({
      constructed: window.__toneAudit.constructed,
      resumes: window.__toneAudit.resumes,
      starts: window.__toneAudit.oscillatorStarts,
      state: window.__toneAudit.state,
    })),
  ).toEqual({ constructed: 1, resumes: 1, starts: 1, state: 'running' })

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')))
  await expect(page.getByRole('button', { name: 'OFF / ENABLE' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect.poll(() => page.evaluate(() => window.__toneAudit.state)).toBe('suspended')
  const lifecycle = await page.evaluate(() => window.__toneAudit)
  expect(lifecycle.suspends).toBe(1)
  expect(lifecycle.oscillatorStops).toBeGreaterThanOrEqual(2)
  expect(lifecycle.oscillatorDisconnects).toBe(1)
  expect(lifecycle.gainDisconnects).toBe(1)
})

test('launch guided shot stays safe and continuous across start, midpoint and release', async ({
  page,
}) => {
  await page.goto('/control/met/s162.2')
  await waitForScene(page)
  await page.getByRole('button', { name: '1×', exact: true }).click()
  await page.waitForTimeout(160)
  const before = cameraPosition(await page.locator('html').getAttribute('data-camera-position'))
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()

  await page.waitForFunction(() => {
    const html = document.documentElement
    const progress = Number(html.dataset.cameraShotProgress)
    return (
      html.dataset.cameraShot === 'ascent-upper-reference' &&
      html.dataset.cameraGuidance === 'active' &&
      progress > 0 &&
      progress < 0.65
    )
  })
  const html = page.locator('html')
  expect(await html.getAttribute('data-camera-visibility')).toBe('safe')
  expect(await html.getAttribute('data-camera-visibility-guard')).toBe('authored-fit')
  expect(await html.getAttribute('data-camera-transition-origin')).toBe('persisted-safe-rest')
  const start = cameraPosition(await html.getAttribute('data-camera-position'))
  const startProgress = Number(await html.getAttribute('data-camera-shot-progress'))

  await page.waitForFunction(
    (minimum) => {
      const progress = Number(document.documentElement.dataset.cameraShotProgress)
      return progress >= minimum && progress < 0.98
    },
    Math.max(0.7, startProgress + 0.08),
  )
  await expect(html).toHaveAttribute('data-camera-visibility', 'safe')
  await expect(html).toHaveAttribute('data-camera-visibility-guard', 'authored-fit')
  const midpoint = cameraPosition(await html.getAttribute('data-camera-position'))

  await expect(html).toHaveAttribute('data-camera-guidance', 'released')
  await expect(html).toHaveAttribute('data-camera-visibility', 'safe')
  await expect(html).toHaveAttribute('data-camera-visibility-guard', 'authored-fit')
  const endpoint = cameraPosition(await html.getAttribute('data-camera-position'))
  const totalDistance = cameraDistance(before, endpoint)
  expect(cameraDistance(before, start)).toBeLessThanOrEqual(
    totalDistance * Math.min(1, startProgress + 0.15),
  )
  expect(cameraDistance(start, midpoint)).toBeGreaterThan(0.001)
  expect(cameraDistance(midpoint, endpoint)).toBeGreaterThan(0.001)
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
})

test('Earth-orbit union transition remains authored and safe at 10×', async ({ page }) => {
  await page.goto('/control/met/s699')
  await waitForScene(page)
  await page.getByRole('button', { name: '10×', exact: true }).click()
  const html = page.locator('html')
  const before = cameraPosition(await html.getAttribute('data-camera-position'))
  const beforeTarget = cameraPosition(await html.getAttribute('data-camera-target'))
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  const assertSafeFrame = async () => {
    await expect(html).toHaveAttribute('data-camera-visibility', 'safe')
    await expect(html).toHaveAttribute(
      'data-camera-destination-targets',
      'launch-vehicle-visual,launch-earth-reference',
    )
  }

  await page.waitForFunction(() => {
    const root = document.documentElement
    const progress = Number(root.dataset.cameraShotProgress)
    return (
      root.dataset.cameraShot === 'earth-orbit-reference' &&
      root.dataset.cameraGuidance === 'active' &&
      progress > 0 &&
      progress < 0.45
    )
  })
  await assertSafeFrame()
  expect(['transition-previous-fit', 'authored-fit']).toContain(
    await html.getAttribute('data-camera-visibility-guard'),
  )
  await expect(html).toHaveAttribute('data-camera-transition-origin', 'persisted-safe-rest')
  const start = cameraPosition(await html.getAttribute('data-camera-position'))
  const startTarget = cameraPosition(await html.getAttribute('data-camera-target'))
  const startProgress = Number(await html.getAttribute('data-camera-shot-progress'))

  await page.waitForFunction(() => {
    const progress = Number(document.documentElement.dataset.cameraShotProgress)
    return progress >= 0.45 && progress < 0.9
  })
  await assertSafeFrame()
  await expect(html).toHaveAttribute('data-camera-visibility-guard', 'authored-fit')
  await expect(html).toHaveAttribute(
    'data-camera-visibility-targets',
    'launch-vehicle-visual,launch-earth-reference',
  )
  const midpoint = cameraPosition(await html.getAttribute('data-camera-position'))

  await expect(html).toHaveAttribute('data-camera-guidance', 'released')
  await assertSafeFrame()
  await expect(html).toHaveAttribute('data-camera-visibility-guard', 'authored-fit')
  await expect(html).toHaveAttribute(
    'data-camera-visibility-targets',
    'launch-vehicle-visual,launch-earth-reference',
  )
  const endpoint = cameraPosition(await html.getAttribute('data-camera-position'))
  const endpointTarget = cameraPosition(await html.getAttribute('data-camera-target'))
  const totalDistance = cameraDistance(before, endpoint)
  const totalTargetDistance = cameraDistance(beforeTarget, endpointTarget)
  expect(cameraDistance(before, start)).toBeLessThanOrEqual(
    totalDistance * Math.min(1, startProgress + 0.15),
  )
  expect(cameraDistance(beforeTarget, startTarget)).toBeLessThanOrEqual(
    totalTargetDistance * Math.min(1, startProgress + 0.15),
  )
  expect(cameraDistance(start, midpoint)).toBeGreaterThan(0.001)
  expect(cameraDistance(midpoint, endpoint)).toBeGreaterThan(0.001)
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
})

test('stable Earth orbit frames the Earth and vehicle on desktop and mobile', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/control/event/a11-sivb-first-cutoff')
    await waitForScene(page)
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-camera-shot', 'earth-orbit-reference')
    await expect(html).toHaveAttribute('data-camera-guidance', 'released')
    await expect(html).toHaveAttribute('data-camera-visibility', 'safe')
    await expect(html).toHaveAttribute(
      'data-camera-visibility-targets',
      'launch-vehicle-visual,launch-earth-reference',
    )
    await expect(html).toHaveAttribute('data-camera-visibility-guard', 'authored-fit')
  }
})

test('10 Inspector select, focus, reset and refocus cycles keep renderer resources stable', async ({
  page,
}) => {
  await page.goto(SATURN_V_INSPECTOR_PATH)
  await waitForScene(page)
  await page.evaluate(() => {
    window.__apollo11Sprint2ContextLosses = 0
    document.querySelector('canvas')?.addEventListener('webglcontextlost', () => {
      window.__apollo11Sprint2ContextLosses += 1
    })
  })
  const selections = [
    { label: 'S-II SECOND STAGE', id: 's-ii' },
    { label: 'S-IC FIRST STAGE', id: 's-ic' },
  ]
  const cycle = async (index: number) => {
    const selection = selections[index % selections.length]
    await inspectorComponentButton(page, selection.label).click()
    await waitForInspectionCamera(page, selection.id)
    await page.getByRole('button', { name: 'RESET', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-camera-command', 'reset')
    await page.getByRole('button', { name: 'REFOCUS', exact: true }).click()
    await page.waitForTimeout(600)
    await waitForInspectionCamera(page, selection.id)
  }

  await cycle(0)
  const readings = []
  for (let index = 0; index < 10; index += 1) {
    await cycle(index + 1)
    readings.push(await readRenderer(page))
  }
  const resources = readings.map(({ geometries, materials, programs, textures }) => ({
    geometries,
    materials,
    programs,
    textures,
  }))
  expect(new Set(resources.map((reading) => JSON.stringify(reading))).size).toBe(1)
  expect(new Set(readings.map((reading) => reading.canvasCount))).toEqual(new Set([1]))
  expect(await page.evaluate(() => window.__apollo11Sprint2ContextLosses)).toBe(0)
})

test.describe('Inspector responsive contract at DPR 2', () => {
  test.use({ deviceScaleFactor: 2 })

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 720, height: 450 },
  ]) {
    test(`${viewport.width}×${viewport.height} keeps readable type and touch floors`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto(SATURN_V_INSPECTOR_PATH)
      await waitForScene(page)
      await assertNoRootOverflow(page)

      const metrics = await page.evaluate(() => {
        const px = (selector: string) =>
          [...document.querySelectorAll<HTMLElement>(selector)].map((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize),
          )
        const targets = [...document.querySelectorAll<HTMLElement>('a, button, select')]
          .filter((element) => element.getClientRects().length > 0)
          .map((element) => element.getBoundingClientRect().height)
        return {
          body: px('.saturn-inspector__header p, .saturn-inspector__dossier > p'),
          heading: px('.saturn-inspector__header h1'),
          labels: px(
            '.saturn-inspector__header span, .saturn-inspector__section-label, .saturn-inspector__truth span, .saturn-inspector__tools span, .saturn-inspector__dossier dt, .saturn-inspector__legend, .saturn-inspector__dossier > small, .interface-audio-control span, .interface-audio-control p, .interface-audio-control button',
          ),
          targetHeights: targets,
          values: px(
            '.saturn-inspector__truth b, .saturn-inspector__tools b, .saturn-inspector__dossier dd, .saturn-inspector__index button b, .interface-audio-control b',
          ),
        }
      })
      expect(Math.min(...metrics.labels)).toBeGreaterThanOrEqual(12)
      expect(Math.min(...metrics.values)).toBeGreaterThanOrEqual(14)
      expect(Math.min(...metrics.body)).toBeGreaterThanOrEqual(16)
      expect(Math.min(...metrics.heading)).toBeGreaterThanOrEqual(32)
      expect(Math.min(...metrics.targetHeights)).toBeGreaterThanOrEqual(44)
    })
  }
})

declare global {
  interface Window {
    __apollo11Sprint2ContextLosses: number
    __toneAudit: {
      constructed: number
      gainDisconnects: number
      oscillatorDisconnects: number
      oscillatorStarts: number
      oscillatorStops: number
      resumes: number
      state: string
      suspends: number
    }
  }
}
