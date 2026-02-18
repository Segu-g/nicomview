import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalSetup: './global-setup.ts',
  reporter: [['list'], ['html', { open: 'never' }]]
})
