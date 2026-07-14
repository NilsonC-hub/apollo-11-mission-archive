import { expect, test } from '@playwright/test'

import { getEvent, replayEndMet } from '../../src/app/mission.ts'
import { formatEventMet, parseMet } from '../../src/mission-core/index.ts'
import {
  appendixEventIds,
  assertNoRootOverflow,
  waitForInspectionCamera,
  waitForScene,
} from './helpers.ts'

async function displayedMetSeconds(page: import('@playwright/test').Page): Promise<number> {
  const value = await page.locator('.met-display').textContent()
  return parseMet(value ?? '')
}

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
    const expectedMet = formatEventMet(getEvent(eventId))
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

test('guided storyTime playback crosses ordinary phase boundaries continuously', async ({
  page,
}) => {
  await page.goto('/control/event/a11-sivb-first-ignition')
  await waitForScene(page)
  await page.getByRole('button', { name: '10×', exact: true }).click()
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()

  await expect(page.getByText('EVENT PAUSE — EDITORIAL')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'PAUSE', exact: true })).toBeVisible()
  await expect.poll(() => page.getByText('EARTH ORBIT', { exact: true }).count()).toBeGreaterThan(0)
  await expect(page.getByText('EVENT PAUSE — EDITORIAL')).toHaveCount(0)
})

test('mode changes pause replay and require an explicit resume', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
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

test('a ready WebGL scene does not mount or announce fallback content', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await expect(page.locator('html')).toHaveAttribute('data-control-scene', 'ready')
  await expect(page.getByRole('img', { name: 'Static vehicle structure fallback' })).toHaveCount(0)
  await expect(page.getByText('WEBGL OR MODEL DECODER UNAVAILABLE')).toHaveCount(0)
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

test('guided camera yields to user input and exposes keyboard camera alternatives', async ({
  page,
}) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await expect(page.locator('.camera-mode b')).toHaveText('GUIDED VIEW')

  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2 + 10)
  await page.mouse.up()

  await expect(page.locator('.camera-mode b')).toHaveText('FREE LOOK')
  await page.getByRole('button', { name: 'RESET VIEW', exact: true }).click()
  await expect(page.locator('.camera-mode b')).toHaveText('FREE LOOK')
  await page.getByRole('button', { name: 'RETURN TO GUIDED VIEW', exact: true }).click()
  await expect(page.locator('.camera-mode b')).toHaveText('GUIDED VIEW')

  await page.getByLabel(/Interactive vehicle camera/).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.camera-mode b')).toHaveText('FREE LOOK')
  await expect(page.locator('html')).toHaveAttribute('data-camera-command', 'rotate-left')
})

test('a model drag above the shared threshold never opens inspection', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  const frame = page.locator('.scene-frame')
  const box = await frame.boundingBox()
  expect(box).not.toBeNull()
  const x = box!.x + box!.width * 0.5
  const y = box!.y + box!.height * 0.7
  await page.mouse.click(x, y)
  await expect(page.locator('#component-inspection-title')).toHaveText('S-IC FIRST STAGE')
  await page.getByRole('button', { name: 'CLOSE DOSSIER' }).click()

  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 5, y)
  await page.mouse.up()

  await expect(page.locator('.camera-mode b')).toHaveText('FREE LOOK')
  await expect(page.getByText('COMPONENT INSPECTION · REPLAY PAUSED')).toHaveCount(0)
})

test('component inspection pauses, focuses, and resumes exactly once', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await page.getByRole('button', { name: 'Inspect S-IC FIRST STAGE' }).click()

  await expect(page.getByText('COMPONENT INSPECTION · REPLAY PAUSED')).toBeVisible()
  await waitForInspectionCamera(page, 's-ic')
  await expect(page.locator('.camera-mode b')).toHaveText('INSPECT')
  const frozen = await page.locator('.met-display').textContent()
  await page.waitForTimeout(250)
  await expect(page.locator('.met-display')).toHaveText(frozen ?? '')

  await page.getByRole('button', { name: 'CLOSE DOSSIER', exact: true }).click()
  await expect(page.getByText('COMPONENT INSPECTION · REPLAY PAUSED')).toHaveCount(0)
  await expect.poll(() => page.locator('.met-display').textContent()).not.toBe(frozen)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'PAUSE', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  await page.getByRole('button', { name: 'Inspect S-IC FIRST STAGE' }).click()
  await page.getByRole('button', { name: 'CLOSE DOSSIER', exact: true }).click()
  await expect(page.getByRole('button', { name: 'PLAY', exact: true })).toBeVisible()
})

test('a pointer tap preserves the pre-inspection mode and Escape works from controls', async ({
  page,
}) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  const frame = page.locator('.scene-frame')
  const box = await frame.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box!.x + 8, box!.y + 8)
  await expect(page.locator('.camera-mode b')).toHaveText('GUIDED VIEW')

  await page.mouse.click(box!.x + box!.width * 0.5, box!.y + box!.height * 0.7)
  await expect(page.getByText('COMPONENT INSPECTION · REPLAY PAUSED')).toBeVisible()
  const close = page.getByRole('button', { name: 'CLOSE DOSSIER', exact: true })
  await close.focus()
  await page.keyboard.press('Escape')
  await expect(close).toHaveCount(0)
  await expect(page.locator('.camera-mode b')).toHaveText('GUIDED VIEW')
})

test('fallback exposes explicit non-interactive camera and inspection controls', async ({
  page,
}) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await page.getByLabel('QUALITY').selectOption('fallback')
  await expect(page.getByRole('img', { name: 'Static vehicle structure fallback' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ROTATE −', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: /Inspect S-IC FIRST STAGE/ })).toBeDisabled()
  await expect(page.locator('.scene-frame')).toHaveAttribute('aria-disabled', 'true')
})

test('inspection status names include the visible component state and use one runtime target', async ({
  page,
}) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  const inspect = page.getByRole('button', { name: /Inspect S-IC FIRST STAGE BURNING/ })
  await inspect.click()
  await waitForInspectionCamera(page, 's-ic')
})

test('changing inspected components refocuses while preserving the original return mode', async ({
  page,
}) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await page.getByRole('button', { name: /Inspect S-IC FIRST STAGE/ }).click()
  await waitForInspectionCamera(page, 's-ic')

  const frame = page.locator('.scene-frame')
  const box = await frame.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + 20, box!.y + 20)
  await page.mouse.down()
  await page.mouse.move(box!.x + 50, box!.y + 25)
  await page.mouse.up()
  await expect(page.getByRole('button', { name: 'REFOCUS COMPONENT' })).toBeVisible()

  await page.getByRole('button', { name: /Inspect S-II SECOND STAGE/ }).click()
  await waitForInspectionCamera(page, 's-ii')
  await expect(page.locator('#component-inspection-title')).toHaveText('S-II SECOND STAGE')
  await page.getByRole('button', { name: 'CLOSE DOSSIER' }).click()
  await expect(page.locator('.camera-mode b')).toHaveText('GUIDED VIEW')

  await page.getByRole('button', { name: 'ROTATE −', exact: true }).click()
  await page.getByRole('button', { name: /Inspect S-IC FIRST STAGE/ }).click()
  await page.getByRole('button', { name: 'CLOSE DOSSIER' }).click()
  await expect(page.locator('.camera-mode b')).toHaveText('FREE LOOK')
})

test('lunar liftoff exposes unique ascent and descent runtime inspection targets', async ({
  page,
}) => {
  await page.goto('/control/event/a11-lunar-liftoff')
  await waitForScene(page)
  await page.getByRole('button', { name: /Inspect LM ASCENT STAGE/ }).click()
  await waitForInspectionCamera(page, 'lm-ascent-stage')
  await page.getByRole('button', { name: 'CLOSE DOSSIER' }).click()
  await page.getByRole('button', { name: /Inspect LM DESCENT STAGE/ }).click()
  await waitForInspectionCamera(page, 'lm-descent-stage')
})

test('non-fallback LOD changes republish ready controls and unique targets', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  const quality = page.getByLabel('QUALITY')
  for (const option of ['high', 'low']) {
    await quality.selectOption(option)
    await expect(page.locator('html')).toHaveAttribute('data-control-scene', 'ready')
    const inspect = page.getByRole('button', { name: /Inspect S-IC FIRST STAGE/ })
    await expect(inspect).toBeEnabled()
    await inspect.click()
    await waitForInspectionCamera(page, 's-ic')
    await page.getByRole('button', { name: 'CLOSE DOSSIER' }).click()
  }
})

test('real browser focus loss flushes URL and pauses without applying hidden time', async ({
  page,
  context,
}) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  const historyBefore = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: '1000×', exact: true }).click()
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await expect.poll(() => displayedMetSeconds(page)).toBeGreaterThan(30)
  const beforeBlur = page.url()
  await page.bringToFront()
  await expect.poll(() => page.evaluate(() => document.hasFocus())).toBe(true)
  const session = await context.newCDPSession(page)
  await session.send('Emulation.setFocusEmulationEnabled', { enabled: false })
  await page.evaluate(() => {
    window.addEventListener(
      'blur',
      () => {
        document.documentElement.dataset.testBlur = 'observed'
      },
      { once: true },
    )
  })
  const other = await context.newPage()
  await other.goto('about:blank')
  await other.bringToFront()
  await other.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
  const blurState = await session.send('Runtime.evaluate', {
    expression: 'document.documentElement.dataset.testBlur',
    returnByValue: true,
  })
  expect(blurState.result.value).toBe('observed')

  await expect(page.getByText('REPLAY PAUSED SAFELY')).toBeVisible()
  expect(page.url()).not.toBe(beforeBlur)
  expect(await page.evaluate(() => history.length)).toBe(historyBefore)
  const frozen = await page.locator('.met-display').textContent()
  await expect.poll(() => page.locator('.met-display').textContent()).toBe(frozen)
  await expect(page.locator('.met-display')).toHaveText(frozen ?? '')

  await session.send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await other.close()
  await page.bringToFront()
  await page.getByRole('button', { name: 'RESUME REPLAY', exact: true }).click()
  await expect.poll(() => page.locator('.met-display').textContent()).not.toBe(frozen)
})

test('real reload and Archive route Back preserve the final played position', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  const historyBefore = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: '1000×', exact: true }).click()
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await expect.poll(() => displayedMetSeconds(page)).toBeGreaterThan(120)
  const beforeReload = await displayedMetSeconds(page)

  await page.reload()
  await waitForScene(page)
  expect(await displayedMetSeconds(page)).toBeGreaterThanOrEqual(beforeReload)
  await expect(page).toHaveURL(/\/control\/met\/s/)
  expect(await page.evaluate(() => history.length)).toBe(historyBefore)

  await page.getByRole('button', { name: '1000×', exact: true }).click()
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await expect.poll(() => displayedMetSeconds(page)).toBeGreaterThan(beforeReload + 30)
  const beforeArchive = await displayedMetSeconds(page)
  await page.getByRole('link', { name: '01 ARCHIVE', exact: true }).click()
  await page.goBack()
  await waitForScene(page)
  expect(await displayedMetSeconds(page)).toBeGreaterThanOrEqual(beforeArchive)
  await expect(page).toHaveURL(/\/control\/met\/s/)
})

test('natural replay completion flushes the terminal URL before reload', async ({ page }) => {
  await page.goto(`/control/met/${encodeURIComponent('195:18:34')}`)
  await waitForScene(page)
  const historyBefore = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: '1000×', exact: true }).click()
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await expect(page.getByText('MISSION COMPLETE')).toBeVisible()
  await expect(page).toHaveURL(/\/control\/met\/s/)
  expect(await page.evaluate(() => history.length)).toBe(historyBefore)
  expect(await displayedMetSeconds(page)).toBe(replayEndMet)
  const terminalUrl = page.url()
  await page.reload()
  await waitForScene(page)
  expect(page.url()).toBe(terminalUrl)
  expect(await displayedMetSeconds(page)).toBe(replayEndMet)
})

test('event, phase, keyboard, scrub, refresh, Back, and Forward preserve URL state', async ({
  page,
}) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await page
    .locator('.control-event-log button')
    .filter({ hasText: 'S-IC OUTBOARD ENGINE CUTOFF' })
    .click()
  await expect(page).toHaveURL(/\/control\/event\/a11-sic-outboard-cutoff$/)
  await expect(page.locator('.met-display')).toHaveText('000:02:41.7')

  await page.getByRole('button', { name: /02.*EARTH \/ TLI/ }).click()
  await expect(page).toHaveURL(/\/control\/event\/a11-sivb-first-cutoff$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/control\/event\/a11-sic-outboard-cutoff$/)
  await expect(page.locator('.met-display')).toHaveText('000:02:41.7')
  await page.goForward()
  await expect(page.locator('.met-display')).toHaveText('000:11:39.3')

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('l')
  await expect(page).toHaveURL(/\/control\/met\//)
  await page.keyboard.press('j')
  await expect(page).toHaveURL(/\/control\/met\//)

  const slider = page.getByRole('slider', { name: 'Mission elapsed time' })
  const historyBefore = await page.evaluate(() => history.length)
  await slider.fill('360720')
  await slider.fill('360721')
  await slider.fill('360720')
  await expect(page).toHaveURL(/\/control\/met\/s360720$/)
  expect(await page.evaluate(() => history.length)).toBe(historyBefore)
  await expect(page.locator('.met-display')).toHaveText('100:12:00')
  await page.reload()
  await waitForScene(page)
  await expect(page.locator('.met-display')).toHaveText('100:12:00')
})

test('MET URLs are canonical and pause flushes without adding history', async ({ page }) => {
  await page.goto('/control/met/000%3A02%3A41.66')
  await waitForScene(page)
  await expect(page).toHaveURL(/000%3A02%3A41.66$/)
  const historyBefore = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await page.waitForTimeout(160)
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  const pausedUrl = page.url()
  expect(pausedUrl).not.toMatch(/000%3A02%3A41.66$/)
  expect(await page.evaluate(() => history.length)).toBe(historyBefore)
  await page.reload()
  await waitForScene(page)
  expect(page.url()).toBe(pausedUrl)
})

test('ignition-only records transition to an explicit unknown engine mode', async ({ page }) => {
  await page.goto('/control/event/a11-tli-ignition')
  await waitForScene(page)
  await expect(
    page.getByRole('button', { name: /S-IVB THIRD STAGE IGNITION EVENT · DURATION N\/A/ }),
  ).toBeVisible()
  await page.goto(`/control/met/s${getEvent('a11-tli-ignition').metSeconds + 0.1}`)
  await waitForScene(page)
  await expect(
    page.getByRole('button', { name: /S-IVB THIRD STAGE ENGINE MODE UNKNOWN · LAST KNOWN CUTOFF/ }),
  ).toBeVisible()
})

test('CM/SM separation renders command-only CSM before entry and survives refresh', async ({
  page,
}) => {
  await page.goto('/control/event/a11-cm-sm-separation')
  await waitForScene(page)
  await page.evaluate(() => window.dispatchEvent(new Event('apollo11:renderer-audit')))
  await expect(page.locator('html')).toHaveAttribute(
    'data-rendered-csm-configurations',
    'command-only',
  )
  await page.reload()
  await waitForScene(page)
  await page.evaluate(() => window.dispatchEvent(new Event('apollo11:renderer-audit')))
  await expect(page.locator('html')).toHaveAttribute(
    'data-rendered-csm-configurations',
    'command-only',
  )
})

test('event lists and readouts preserve recorded MET precision', async ({ page }) => {
  await page.goto('/control/event/a11-liftoff')
  await waitForScene(page)
  await expect(page.locator('.met-display')).toHaveText('000:00:00.6')
  await expect(page.locator('.control-event-log')).toContainText('000:02:43.0')

  await page.goto('/control/event/a11-undocking')
  await waitForScene(page)
  await expect(page.locator('.met-display')).toHaveText('100:12:00')
  await page.goto('/control/event/a11-first-step')
  await waitForScene(page)
  await expect(page.locator('.met-display')).toHaveText('109:24:15.00')
})
