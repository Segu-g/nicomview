import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { NiconicoProvider } from 'nicomget'
import { createServer, type CommentServer } from './server'
import { CommentManager } from './commentManager'

let mainWindow: BrowserWindow | null = null
let server: CommentServer | null = null
let commentManager: CommentManager | null = null

function getOverlayPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'overlay')
  }
  return path.join(__dirname, '../../resources/overlay')
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'NicomView'
  })

  // Express + WebSocket サーバー起動
  try {
    server = await createServer({
      httpPort: 3939,
      wsPort: 3940,
      overlayPath: getOverlayPath()
    })
  } catch (err) {
    console.error('Failed to start server:', err)
  }

  // CommentManager 初期化
  commentManager = new CommentManager(
    (options) => new NiconicoProvider(options),
    (event, data) => server?.broadcast(event, data),
    (state) => mainWindow?.webContents.send('state-change', state)
  )

  // IPC ハンドラ
  ipcMain.handle('connect', async (_event, liveId: string, cookies?: string) => {
    await commentManager?.connect(liveId, cookies)
  })

  ipcMain.handle('disconnect', async () => {
    commentManager?.disconnect()
  })

  // レンダラーのロード
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', async () => {
  commentManager?.disconnect()
  if (server) {
    await server.close()
  }
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
