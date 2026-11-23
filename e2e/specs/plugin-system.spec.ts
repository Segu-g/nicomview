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

  test('event filter checkboxes are visible', async ({ mainPage }) => {
    await mainPage.waitForLoadState('networkidle')

    await expect(mainPage.locator('text=表示イベント')).toBeVisible()
    // 読み上げ側の同名チェックボックスは折りたたみ中で role ツリーに現れない
    for (const name of ['コメント', 'ギフト']) {
      await expect(mainPage.getByRole('checkbox', { name, exact: true })).toBeVisible()
    }
  })
})
