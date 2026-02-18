import { test as base, type Page } from '@playwright/test'
import { _electron as electron, type ElectronApplication } from 'playwright'
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
    const app = await electron.launch({
      executablePath: electronBin,
      args: ['--no-sandbox', mainEntry],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    })
    await use(app)
    await app.close()
  },

  mainPage: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  }
})

export { expect } from '@playwright/test'
