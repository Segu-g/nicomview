import { test, expect } from '../fixtures/electron'

test.describe('Plugin system', () => {
  test('main window shows plugin settings UI', async ({ mainPage }) => {
    await mainPage.waitForLoadState('networkidle')

    // Plugin settings section should be visible
    await expect(mainPage.locator('text=プラグイン設定')).toBeVisible()

    // Event filter checkboxes should be present
    await expect(mainPage.locator('text=コメント')).toBeVisible()
    await expect(mainPage.locator('text=ギフト')).toBeVisible()
  })

  test('md3-comment-list plugin mounts by default', async ({ mainPage }) => {
    await mainPage.waitForLoadState('networkidle')
    await mainPage.waitForTimeout(1000)

    // The plugin should render a list element
    const list = mainPage.locator('ul')
    await expect(list).toBeVisible({ timeout: 5_000 })
  })

  test('plugin serves static files via HTTP', async ({ electronApp }) => {
    await electronApp.firstWindow()

    // md3-comment-list plugin.json should be accessible
    const resp = await fetch('http://localhost:3939/plugins/md3-comment-list/plugin.json')
    expect(resp.status).toBe(200)
    const manifest = await resp.json()
    expect(manifest.id).toBe('md3-comment-list')
    expect(manifest.renderer).toBe(true)
  })
})
