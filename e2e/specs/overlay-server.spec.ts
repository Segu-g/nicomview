import { test, expect } from '../fixtures/electron'

test.describe('Overlay HTTP server', () => {
  test('redirects / to active overlay plugin', async ({ electronApp }) => {
    await electronApp.firstWindow()

    const resp = await fetch('http://localhost:3939/', { redirect: 'manual' })
    expect(resp.status).toBe(302)
    expect(resp.headers.get('location')).toBe('/plugins/nico-scroll/overlay/')
  })

  test('serves overlay HTML at /plugins/nico-scroll/overlay/', async ({ electronApp }) => {
    await electronApp.firstWindow()

    const resp = await fetch('http://localhost:3939/plugins/nico-scroll/overlay/')
    const html = await resp.text()
    expect(resp.status).toBe(200)
    expect(html).toContain('NicomView Overlay')
    expect(html).toContain('overlay.js')
  })

  test('serves overlay.js at /plugins/nico-scroll/overlay/overlay.js', async ({ electronApp }) => {
    await electronApp.firstWindow()

    const resp = await fetch('http://localhost:3939/plugins/nico-scroll/overlay/overlay.js')
    const js = await resp.text()
    expect(resp.status).toBe(200)
    expect(js).toContain('WebSocket')
    expect(js).toContain('showComment')
  })
})
