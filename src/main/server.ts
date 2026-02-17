import path from 'path'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

export interface CommentServer {
  broadcast(event: string, data: unknown): void
  close(): Promise<void>
}

export interface ServerOptions {
  httpPort?: number
  wsPort?: number
  overlayPath?: string
}

export async function createServer(options: ServerOptions = {}): Promise<CommentServer> {
  const {
    httpPort = 3939,
    wsPort = 3940,
    overlayPath = path.join(__dirname, '../../resources/overlay')
  } = options

  const app = express()
  app.use(express.static(overlayPath))

  const httpServer = http.createServer(app)
  const wss = new WebSocketServer({ port: wsPort })

  await new Promise<void>((resolve) => {
    httpServer.listen(httpPort, resolve)
  })

  function broadcast(event: string, data: unknown): void {
    const message = JSON.stringify({ event, data })
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    }
  }

  async function close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      wss.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  return { broadcast, close }
}
