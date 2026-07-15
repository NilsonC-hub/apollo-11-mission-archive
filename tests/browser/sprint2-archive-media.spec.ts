import { expect, test, type Locator } from '@playwright/test'

import { assertNoRootOverflow } from './helpers.ts'

async function expectVisibleFocusOutline(control: Locator) {
  await control.focus()
  await expect(control).toBeFocused()
  const outline = await control.evaluate((element) => {
    const style = getComputedStyle(element)
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) }
  })
  expect(outline.style).toBe('solid')
  expect(outline.width).toBeGreaterThanOrEqual(2)
}

test('Archive Saturn V evidence plates expose complete keyboard-accessible records', async ({
  page,
}) => {
  await page.goto('/archive#saturn-v')
  const section = page.locator('#saturn')
  await expect(section.getByRole('heading', { name: 'LAUNCH VEHICLE DOSSIER' })).toBeVisible()
  const inspectorLink = page.getByRole('link', { name: 'OPEN SATURN V INSPECTOR' })
  await expect(inspectorLink).toHaveAttribute('href', '/control/inspect/saturn-v')
  await expectVisibleFocusOutline(inspectorLink)

  const towerPlate = section.locator('figure').filter({ hasText: 'TOWER-CAMERA PERSPECTIVE' })
  const towerImage = towerPlate.getByRole('img')
  await towerImage.scrollIntoViewIfNeeded()
  await expect(towerImage).toBeVisible()
  const ratioError = await towerImage.evaluate((image: HTMLImageElement) => {
    const rectangle = image.getBoundingClientRect()
    return Math.abs(rectangle.width / rectangle.height - image.naturalWidth / image.naturalHeight)
  })
  expect(ratioError).toBeLessThan(0.002)

  const imageDetails = towerPlate.locator('details')
  const imageSummary = imageDetails.locator('summary')
  await expectVisibleFocusOutline(imageSummary)
  await page.keyboard.press('Enter')
  await expect(imageDetails).toHaveAttribute('open', '')
  await expect(imageDetails.getByText('PROJECT RECORD')).toBeVisible()
  await expect(imageDetails.getByText('SUBJECT TAGS')).toBeVisible()
  await expect(imageDetails.getByText('ORIGINAL URL')).toBeVisible()
  await expect(imageDetails.getByText('EFFECTIVE DOWNLOAD URL')).toBeVisible()
  await expect(imageDetails.getByText('CAMERA CONTEXT')).toBeVisible()
  await expect(imageDetails.getByText('RAW BYTES')).toBeVisible()
  await expect(imageDetails.getByText('RAW FORMAT')).toBeVisible()
  await expect(imageDetails.getByText('RAW SHA-256')).toBeVisible()
  await expect(imageDetails.getByText('DELIVERY 480 WEBP')).toBeVisible()
  await expect(imageDetails.getByText('DELIVERY 1440 JPEG')).toBeVisible()
  const nasaRecordLink = imageDetails.getByRole('link', { name: 'NASA RECORD ↗' })
  await expect(nasaRecordLink).toHaveAttribute('href', 'https://images.nasa.gov/details/S69-39961')
  await expectVisibleFocusOutline(nasaRecordLink)

  const documentPlate = section
    .locator('figure')
    .filter({ hasText: 'MISSION REPORT / VEHICLE CONFIGURATION' })
  await documentPlate.scrollIntoViewIfNeeded()
  await documentPlate.locator('summary').click()
  await expect(documentPlate.getByText('PDF P.334 · PRINTED P.A-10')).toBeVisible()
  await expect(documentPlate.getByText('SOURCE PDF BYTES')).toBeVisible()
  await expect(documentPlate.getByText('SOURCE PDF FORMAT')).toBeVisible()
  await expect(documentPlate.getByText('SOURCE PDF SHA-256')).toBeVisible()
  await expect(documentPlate.getByText('RENDERED PAGE BYTES')).toBeVisible()
  await expect(documentPlate.getByText('RENDERED PAGE FORMAT')).toBeVisible()
  await expect(documentPlate.getByText('DELIVERY 960 JPEG')).toBeVisible()
  await expect(
    section.getByText('source-bound component identity · reconstructed model geometry').first(),
  ).toBeVisible()
  await assertNoRootOverflow(page)
})

test('Archive preserves legacy Saturn links, supports the inspector return anchor, and guards bad hashes', async ({
  page,
}) => {
  for (const route of [
    '/archive/saturn',
    '/archive#saturn',
    '/archive#saturn-v',
    '/archive/saturn/#saturn',
    '/archive/saturn/#saturn-v',
  ]) {
    await page.goto(route)
    await expect(page.locator('#saturn')).toBeVisible()
    const target = route.endsWith('saturn-v') ? page.locator('#saturn-v') : page.locator('#saturn')
    await expect
      .poll(async () => Math.round((await target.boundingBox())?.y ?? -1))
      .toBeGreaterThanOrEqual(60)
    await expect
      .poll(async () => Math.round((await target.boundingBox())?.y ?? -1))
      .toBeLessThanOrEqual(84)
  }

  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))
  await page.goto('/archive#%E0%A4%A')
  await expect(page.locator('#main-content')).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('Archive Saturn V media records stay contained at 320, 390, and 640 CSS pixels', async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 640, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/archive#saturn-v')

    if (viewport.width <= 390) {
      const section = page.locator('#saturn')
      const records = [
        section
          .locator('figure')
          .filter({ hasText: 'TOWER-CAMERA PERSPECTIVE' })
          .locator('details'),
        section.locator('figure.archive-model-plate').locator('details'),
        section
          .locator('figure')
          .filter({ hasText: 'MISSION REPORT / VEHICLE CONFIGURATION' })
          .locator('details'),
      ]
      for (const record of records) {
        if (!(await record.evaluate((details: HTMLDetailsElement) => details.open))) {
          await record.locator('summary').click()
        }
        await expect(record).toHaveAttribute('open', '')
      }

      const containedMetadata = await section
        .locator('.archive-record-body code, .archive-record-links a')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const element = node as HTMLElement
            const rectangle = element.getBoundingClientRect()
            const parentRectangle = element.parentElement!.getBoundingClientRect()
            return {
              hasText: Boolean(element.textContent?.trim()),
              leftContained: rectangle.left >= parentRectangle.left - 1,
              rightContained: rectangle.right <= parentRectangle.right + 1,
              wrapsInternally: element.scrollWidth <= element.clientWidth + 1,
            }
          }),
        )
      expect(containedMetadata.length).toBeGreaterThanOrEqual(14)
      expect(
        containedMetadata.every(
          (item) =>
            item.hasText && item.leftContained && item.rightContained && item.wrapsInternally,
        ),
      ).toBe(true)
      await expect(section.getByText('RAW SHA-256').first()).toBeVisible()
      await expect(section.getByText('RUNTIME RECORD')).toBeVisible()
      await expect(section.getByText('SOURCE PDF SHA-256')).toBeVisible()
      await expect(section.getByRole('link', { name: 'NASA RECORD ↗' }).first()).toBeVisible()

      const typography = await section.evaluate(() => {
        const visibleSizes = (selector: string) =>
          [...document.querySelectorAll<HTMLElement>(selector)]
            .filter((element) => {
              const rectangle = element.getBoundingClientRect()
              const style = getComputedStyle(element)
              return (
                rectangle.width > 0 &&
                rectangle.height > 0 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden'
              )
            })
            .map((element) => Number.parseFloat(getComputedStyle(element).fontSize))
        return {
          body: visibleSizes(
            '.archive-media-lead p, .archive-evidence-plate figcaption > p, .archive-model-plate .archive-record-body p',
          ),
          metadata: visibleSizes(
            '.archive-inspector-link, .archive-evidence-heading, .archive-evidence-heading b, .archive-record-details > summary, .archive-record-body dt, .archive-record-body dd, .archive-record-body code, .archive-record-links a, .saturn-component-ledger span, .saturn-component-ledger small',
          ),
        }
      })
      expect(typography.body.length).toBeGreaterThan(0)
      expect(typography.metadata.length).toBeGreaterThan(0)
      expect(Math.min(...typography.body)).toBeGreaterThanOrEqual(16)
      expect(Math.min(...typography.metadata)).toBeGreaterThanOrEqual(12)
    }

    await assertNoRootOverflow(page)
    const controls = await page.locator('#saturn a, #saturn summary').evaluateAll((nodes) =>
      nodes
        .map((node) => {
          const rectangle = node.getBoundingClientRect()
          const style = getComputedStyle(node)
          return {
            height: rectangle.height,
            text: node.textContent?.trim(),
            visible:
              style.display !== 'none' && style.visibility !== 'hidden' && rectangle.height > 0,
          }
        })
        .filter((control) => control.visible),
    )
    expect(controls.every((control) => control.height >= 44)).toBe(true)
  }
})

test('Archive 1440x900 physical / 720x450 CSS / DPR2 reflow context stays readable', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    deviceScaleFactor: 2,
    viewport: { width: 720, height: 450 },
  })
  const page = await context.newPage()
  await page.goto('/archive#saturn-v')
  await assertNoRootOverflow(page)
  const measurements = await page.evaluate(() => {
    const summary = document.querySelector<HTMLElement>('#saturn .archive-record-details summary')!
    const caption = document.querySelector<HTMLElement>(
      '#saturn .archive-evidence-plate figcaption > p',
    )!
    return {
      captionFont: Number.parseFloat(getComputedStyle(caption).fontSize),
      summaryFont: Number.parseFloat(getComputedStyle(summary).fontSize),
      summaryHeight: summary.getBoundingClientRect().height,
    }
  })
  expect(measurements.captionFont).toBeGreaterThanOrEqual(14)
  expect(measurements.summaryFont).toBeGreaterThanOrEqual(12)
  expect(measurements.summaryHeight).toBeGreaterThanOrEqual(44)
  await context.close()
})

test('Archive cold route loads only its responsive hero media and remains 3D-isolated', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.addInitScript(() => {
    window.__archiveLcp = []
    window.__archiveCls = 0
    new PerformanceObserver((list) => {
      window.__archiveLcp.push(
        ...list.getEntries().map((entry) => {
          const lcp = entry as LargestContentfulPaint
          return { startTime: lcp.startTime, url: lcp.url }
        }),
      )
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShift[]) {
        if (!entry.hadRecentInput) window.__archiveCls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

  await page.goto('/archive')
  await expect(page.getByRole('heading', { name: 'APOLLO 11', exact: true })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    const hero = document.querySelector<HTMLImageElement>('.archive-evidence-plate--hero img')
    await hero?.decode().catch(() => undefined)
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
  })

  const forbidden = requests.filter((url) =>
    /MissionScene|three|react-three|\.(?:glb|ktx2)(?:\?|$)|draco|basis_transcoder/i.test(url),
  )
  expect(forbidden).toEqual([])
  expect(requests.filter((url) => /\/missions\/apollo11\/images\//.test(url))).toEqual([
    expect.stringContaining('/missions/apollo11/images/a11-s69-38660-'),
  ])

  const transfer = await page.evaluate(() => {
    const resources = performance
      .getEntriesByType('resource')
      .map((entry) => entry as PerformanceResourceTiming)
    return {
      heroBytes:
        resources.find((entry) => entry.name.includes('a11-s69-38660-'))?.encodedBodySize ?? -1,
      totalBytes: resources.reduce((sum, entry) => sum + entry.transferSize, 0),
    }
  })
  expect(transfer.heroBytes).toBeGreaterThan(0)
  expect(transfer.heroBytes).toBeLessThanOrEqual(150 * 1024)
  expect(transfer.totalBytes).toBeLessThanOrEqual(850 * 1024)
  await expect
    .poll(() => page.evaluate(() => window.__archiveLcp.at(-1) ?? null))
    .toMatchObject({ url: expect.stringContaining('a11-s69-38660-') })
  const lcp = await page.evaluate(() => window.__archiveLcp.at(-1)!)
  expect(lcp.startTime).toBeLessThan(2500)
  const cls = await page.evaluate(() => window.__archiveCls)
  expect(cls).toBeLessThanOrEqual(0.001)
  console.log('SPRINT2_ARCHIVE_COLD', JSON.stringify({ cls, lcp, transfer }))
})

declare global {
  interface LargestContentfulPaint extends PerformanceEntry {
    url: string
  }

  interface Window {
    __archiveLcp: Array<{ startTime: number; url: string }>
    __archiveCls: number
  }

  interface LayoutShift extends PerformanceEntry {
    hadRecentInput: boolean
    value: number
  }
}
