import { test as base, type Page } from '@playwright/test'
import { _electron as electron, type ElectronApplication } from 'playwright'
import { mkdtempSync, rmSync } from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const projectRoot = path.resolve(__dirname, '../..')
const electronBin = require('electron') as unknown as string
const mainEntry = path.join(projectRoot, 'out/main/index.js')

type ElectronFixtures = {
  electronApp: ElectronApplication
  mainPage: Page
}

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    // 実ユーザーの設定・プラグインに触れないよう userData を隔離する
    const userDataDir = mkdtempSync(path.join(os.tmpdir(), 'nicomview-e2e-'))
    const app = await electron.launch({
      executablePath: electronBin,
      args: ['--no-sandbox', `--user-data-dir=${userDataDir}`, mainEntry],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    })
    try {
      // ウィンドウはサーバー起動前に作られるため、起動後に行われる画面ロードを待つ
      await (await app.firstWindow()).waitForURL(/renderer\/index\.html/)
      await use(app)
    } finally {
      await app.close()
      rmSync(userDataDir, { recursive: true, force: true })
    }
  },

  mainPage: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  }
})

export { expect } from '@playwright/test'
