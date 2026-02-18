import { test, expect } from '../fixtures/electron'

test.describe('Settings UI', () => {
  test('can type a live ID', async ({ mainPage }) => {
    const input = mainPage.getByLabel('放送ID')
    await input.fill('lv123456789')
    await expect(input).toHaveValue('lv123456789')
  })

  test('connect button does nothing with empty input', async ({ mainPage }) => {
    const button = mainPage.getByRole('button', { name: '接続' })
    await button.click()
    // Should stay disconnected — no state change
    const chip = mainPage.locator('.MuiChip-root', { hasText: '未接続' })
    await expect(chip).toBeVisible()
  })

  test('cookie section is collapsed by default', async ({ mainPage }) => {
    const cookieInput = mainPage.getByLabel('Cookie（ログイン視聴用）')
    await expect(cookieInput).not.toBeVisible()
  })

  test('cookie section expands when clicked', async ({ mainPage }) => {
    const toggle = mainPage.getByRole('button', { name: 'Cookieオプション' })
    await toggle.click()
    const cookieInput = mainPage.getByLabel('Cookie（ログイン視聴用）')
    await expect(cookieInput).toBeVisible()
  })

  test('connecting with invalid ID shows error state', async ({ mainPage }) => {
    const input = mainPage.getByLabel('放送ID')
    await input.fill('invalid-id')

    const connectBtn = mainPage.getByRole('button', { name: '接続' })
    await connectBtn.click()

    // Wait for error state (nicomget will fail)
    const errorAlert = mainPage.locator('.MuiAlert-standardError')
    await expect(errorAlert).toBeVisible({ timeout: 15_000 })
  })
})
