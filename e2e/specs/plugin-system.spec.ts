import { test, expect } from '../fixtures/electron'

test.describe('Plugin system', () => {
  test('main window shows plugin URLs', async ({ mainPage }) => {
    await mainPage.waitForLoadState('networkidle')

    await expect(mainPage.locator('text=表示プラグイン')).toBeVisible()
    for (const name of ['コメントリスト', '通知カード', 'PSD アバター']) {
      await expect(mainPage.getByText(name, { exact: true })).toBeVisible()
    }
  })

  test('plugin serves static files via HTTP', async ({ electronApp }) => {
    await electronApp.firstWindow()

    const resp = await fetch('http://localhost:3939/plugins/comment-list/plugin.json')
    expect(resp.status).toBe(200)
    const manifest = await resp.json()
    expect(manifest.id).toBe('comment-list')
    expect(manifest.overlay).toBe(true)
  })

  test('psd-avatar overlay starts', async ({ electronApp }) => {
    await electronApp.firstWindow()
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = new BrowserWindow({ width: 400, height: 400 })
      await win.loadURL('http://localhost:3939/plugins/psd-avatar/overlay/?volume=0&layerVisibility={broken')
    })
    const overlay = electronApp.windows().find((p) => p.url().includes('psd-avatar'))
    expect(overlay).toBeDefined()
    // PSD は同梱されないため、React の起動後は読み込みエラー表示になる
    await expect(overlay!.getByText('PSD読み込みエラー')).toBeVisible()
  })

  test('psd-avatar settings popup receives initial settings', async ({ electronApp, mainPage }) => {
    const popupPromise = electronApp.waitForEvent('window')
    await mainPage.getByTestId('settings-toggle-psd-avatar').click()
    const popup = await popupPromise
    await expect(popup.getByLabel('API ホスト')).toHaveValue('http://localhost:50021')
    await expect(popup.getByLabel('音量')).toHaveValue('1')
  })

  test('event filter is saved per plugin and applied to its overlay', async ({ electronApp, mainPage }) => {
    await mainPage.getByTestId('settings-toggle-comment-list').click()
    const settings = mainPage.frameLocator('[data-testid="settings-iframe-comment-list"]')
    for (const name of ['コメント', 'エモーション', '通知', '放送者コメント']) {
      await settings.getByRole('checkbox', { name, exact: true }).uncheck()
    }
    const listUrl = await mainPage.getByText(/comment-list\/overlay/).textContent()
    expect(new URL(listUrl!).searchParams.get('events')).toBe('gift')
    await expect(mainPage.getByText(/comment-cards\/overlay/)).not.toContainText('events=')

    await electronApp.evaluate(async ({ BrowserWindow }, url) => {
      const win = new BrowserWindow({ width: 400, height: 400 })
      await win.loadURL(url)
    }, listUrl!)
    const overlay = electronApp.windows().find((p) => p.url().includes('comment-list/overlay'))!
    await overlay.waitForTimeout(1000)
    await electronApp.evaluate(async () => {
      const server = (global as any).__testServer
      server.broadcast('comment', { content: '隠すコメント' })
      server.broadcast('gift', { userName: '贈り主', itemName: '花' })
    })
    await expect(overlay.getByText('贈り主')).toBeVisible()
    await expect(overlay.getByText('隠すコメント')).toHaveCount(0)
  })
})
