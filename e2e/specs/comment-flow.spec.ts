import { test, expect } from '../fixtures/electron'

test.describe('Comment flow', () => {
  test('broadcast comment appears in overlay DOM', async ({ electronApp }) => {
    // Wait for the main window and server to be ready
    await electronApp.firstWindow()

    // Open the overlay in a new Electron BrowserWindow via the main process
    const overlayPage = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { contextIsolation: false, nodeIntegration: false }
      })
      await win.loadURL('http://localhost:3939/plugins/nico-scroll/overlay/')
      return win.id
    })

    // Get the overlay page from Playwright
    const pages = electronApp.windows()
    const overlay = pages.find((p) => p.url().includes('localhost:3939'))
    expect(overlay).toBeDefined()

    // Wait for WebSocket connection to establish
    await overlay!.waitForLoadState('networkidle')
    await overlay!.waitForTimeout(1000)

    // Broadcast a comment via __testServer
    await electronApp.evaluate(async () => {
      const server = (global as any).__testServer
      if (server) {
        server.broadcast('comment', { content: 'テストコメント' })
      }
    })

    // Verify the comment element appears in the overlay DOM
    const commentEl = overlay!.locator('.comment', { hasText: 'テストコメント' })
    await expect(commentEl).toBeVisible({ timeout: 5_000 })
    await expect(commentEl).toHaveText('テストコメント')
  })

  test('comment event reaches renderer window', async ({ electronApp, mainPage }) => {
    // Wait for the app to be fully loaded
    await mainPage.waitForLoadState('networkidle')

    // Verify the plugin host renders (md3-comment-list is default)
    // The plugin should mount and create a list element
    await mainPage.waitForTimeout(1000)

    // Broadcast a comment via __testServer
    await electronApp.evaluate(async () => {
      const server = (global as any).__testServer
      if (server) {
        server.broadcast('comment', { content: 'レンダラーテスト' })
      }
    })

    // Verify comment appears in the renderer's comment list
    const commentText = mainPage.locator('text=レンダラーテスト')
    await expect(commentText).toBeVisible({ timeout: 5_000 })
  })
})
