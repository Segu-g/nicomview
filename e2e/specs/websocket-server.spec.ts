import { test, expect } from '../fixtures/electron'
import WebSocket from 'ws'

test.describe('WebSocket server', () => {
  test('accepts connection on :3940', async ({ electronApp }) => {
    await electronApp.firstWindow()

    const connected = await new Promise<boolean>((resolve) => {
      const ws = new WebSocket('ws://localhost:3940')
      ws.on('open', () => {
        ws.close()
        resolve(true)
      })
      ws.on('error', () => resolve(false))
      setTimeout(() => {
        ws.close()
        resolve(false)
      }, 5000)
    })
    expect(connected).toBe(true)
  })

  test('broadcasts messages to connected clients', async ({ electronApp }) => {
    await electronApp.firstWindow()

    const ws = new WebSocket('ws://localhost:3940')

    const messagePromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => {
        resolve(JSON.parse(data.toString()))
      })
      setTimeout(() => resolve(null), 5000)
    })

    await new Promise<void>((resolve) => {
      ws.on('open', () => resolve())
    })

    // Use electronApp.evaluate to call broadcast from the main process
    await electronApp.evaluate(async () => {
      const server = (global as any).__testServer
      if (server) {
        server.broadcast('comment', { content: 'test message' })
      }
    })

    const received = await messagePromise
    ws.close()

    expect(received).not.toBeNull()
    expect(received.event).toBe('comment')
    expect(received.data.content).toBe('test message')
  })
})
