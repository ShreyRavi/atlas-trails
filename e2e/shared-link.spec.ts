import { expect, test } from '@playwright/test'
import LZ from 'lz-string'

const trip = {
  v: 2,
  t: 'E2E loop',
  s: [
    { name: 'Lisbon', country: 'PT', lat: 38.7169, lng: -9.139, nt: 'Tram 28 at dawn.', d1: '2026-03-02', d2: '2026-03-05' },
    { name: 'Porto', country: 'PT', lat: 41.1496, lng: -8.611, u: 'https://example.com/porto' },
    { name: 'Madrid', country: 'ES', lat: 40.4165, lng: -3.7026, d1: '2026-03-08' },
  ],
}
const payload = LZ.compressToEncodedURIComponent(JSON.stringify(trip))

test('a shared link plays stop by stop and ends on the finale', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto(`/?speed=fast#t=${payload}`)
  await expect(page.getByRole('heading', { name: 'E2E loop' })).toBeVisible()

  // Autoplay starts once the globe is ready; the card announces each stop.
  const live = page.locator('[aria-live="polite"]')
  await expect(live).toHaveText(/Stop 1 of 3, Lisbon, Portugal, 3 nights/, { timeout: 30_000 })
  await expect(page.getByRole('region', { name: 'Current stop' })).toContainText('Tram 28 at dawn.')

  // Pause shows Resume and the Paused chip; resume carries on.
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()

  await expect(live).toHaveText(/Stop 2 of 3, Porto/)
  await expect(page.getByRole('link', { name: /example\.com/ })).toBeVisible()
  await expect(live).toHaveText(/Stop 3 of 3, Madrid, Spain, Day trip/)

  // Finale: the full bar returns with the next actions.
  await expect(page.getByRole('button', { name: 'Replay' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create your own' })).toBeVisible()
  expect(errors).toEqual([])
})
