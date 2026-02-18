import { test, expect } from '../fixtures/electron'

test.describe('App launch', () => {
  test('window is visible with correct title', async ({ mainPage }) => {
    const title = await mainPage.title()
    expect(title).toBe('NicomView')
  })

  test('window has expected minimum size', async ({ mainPage }) => {
    const size = await mainPage.evaluate(() => ({
      width: globalThis.innerWidth,
      height: globalThis.innerHeight
    }))
    expect(size.width).toBeGreaterThanOrEqual(400)
    expect(size.height).toBeGreaterThanOrEqual(500)
  })

  test('shows NicomView heading', async ({ mainPage }) => {
    const heading = mainPage.locator('h4', { hasText: 'NicomView' })
    await expect(heading).toBeVisible()
  })

  test('shows live ID input field', async ({ mainPage }) => {
    const input = mainPage.getByLabel('放送ID')
    await expect(input).toBeVisible()
  })

  test('shows connect button', async ({ mainPage }) => {
    const button = mainPage.getByRole('button', { name: '接続' })
    await expect(button).toBeVisible()
  })

  test('shows disconnected state by default', async ({ mainPage }) => {
    const chip = mainPage.locator('.MuiChip-root', { hasText: '未接続' })
    await expect(chip).toBeVisible()
  })
})
