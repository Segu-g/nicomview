import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron'
import path from 'path'
import { mkdirSync, readdirSync, cpSync, existsSync } from 'fs'

function getPluginsPath(): string {
  return path.join(app.getPath('userData'), 'plugins')
}
import { NiconicoProvider } from 'nicomget'
import { createServer, type CommentServer } from './server'
import { CommentManager } from './commentManager'
import { PluginManager } from './pluginManager'
import { TtsManager } from './tts/ttsManager'
import { VoicevoxAdapter } from './tts/adapters/voicevox'
import { BouyomichanAdapter } from './tts/adapters/bouyomichan'
import type { CommentEventType, PluginSettings, TtsSettings } from '../shared/types'
import { HTTP_PORT, WS_PORT } from '../shared/constants'
import { IPC } from '../shared/ipc'

let mainWindow: BrowserWindow | null = null
let server: CommentServer | null = null
let commentManager: CommentManager | null = null
let pluginManager: PluginManager | null = null
let ttsManager: TtsManager | null = null

function getBuiltInPluginsPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'plugins')
  }
  return path.join(__dirname, '../../resources/plugins')
}

/** ビルトインプラグインを userData/plugins/ へ同期コピーする */
function syncBuiltInPlugins(): void {
  const src = getBuiltInPluginsPath()
  const dest = getPluginsPath()
  mkdirSync(dest, { recursive: true })
  if (!existsSync(src)) return
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    cpSync(path.join(src, entry.name), path.join(dest, entry.name), { recursive: true })
  }
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

  // ビルトインプラグインを userData/plugins/ へ同期してから探索
  syncBuiltInPlugins()
  pluginManager = new PluginManager(getPluginsPath(), app.getPath('userData'))
  pluginManager.discover()

  // Express + WebSocket サーバー起動
  try {
    server = await createServer({
      httpPort: HTTP_PORT,
      wsPort: WS_PORT
    })

    // プラグインルート登録
    for (const plugin of pluginManager.getPlugins()) {
      const fsPath = pluginManager.getPluginFsPath(plugin.id)
      if (fsPath) {
        server.registerPluginRoute(plugin.id, fsPath)
      }
    }
  } catch (err) {
    console.error('Failed to start server:', err)
  }

  if (process.env.NODE_ENV === 'test') {
    ;(global as any).__testServer = server
  }

  // TtsManager 初期化
  ttsManager = new TtsManager(app.getPath('userData'))
  ttsManager.registerAdapter(new VoicevoxAdapter())
  ttsManager.registerAdapter(new BouyomichanAdapter())

  // CommentManager 初期化
  commentManager = new CommentManager(
    (options) => new NiconicoProvider(options),
    (event, data) => {
      console.log(`[${event}]`, JSON.stringify(data))
      server?.broadcast(event, data)
      ttsManager?.handleEvent(event as CommentEventType, data)
    },
    (state) => mainWindow?.webContents.send(IPC.stateChange, state)
  )

  // IPC ハンドラ
  ipcMain.handle(IPC.connect, async (_event, liveId: string, cookies?: string) => {
    server?.clearHistory()
    await commentManager?.connect(liveId, cookies)
  })

  ipcMain.handle(IPC.disconnect, async () => {
    commentManager?.disconnect()
  })

  ipcMain.handle(IPC.getPlugins, () => {
    return pluginManager?.getPlugins() ?? []
  })

  ipcMain.handle(IPC.getPluginSettings, (_event, pluginId: string) => {
    return pluginManager?.getPluginSettings(pluginId) ?? {}
  })

  ipcMain.handle(IPC.setPluginSettings, (_event, pluginId: string, settings: PluginSettings) => {
    pluginManager?.setPluginSettings(pluginId, settings)
  })

  ipcMain.handle(IPC.getTtsSettings, () => {
    return ttsManager?.getSettings() ?? null
  })

  ipcMain.handle(IPC.setTtsSettings, (_event, settings: Partial<TtsSettings>) => {
    ttsManager?.setSettings(settings)
  })

  ipcMain.handle(IPC.getTtsAdapters, () => {
    return ttsManager?.getAdapterInfos() ?? []
  })

  ipcMain.handle(IPC.getTtsAdapterParams, async (_event, adapterId: string) => {
    return (await ttsManager?.getAdapterParams(adapterId)) ?? []
  })

  ipcMain.handle(IPC.openPluginFolder, () => {
    shell.openPath(getPluginsPath())
  })

  // レンダラーのコンソールログをメインプロセスに転送（デバッグ用）
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const prefix = ['LOG', 'WARN', 'ERROR'][level] || 'LOG'
    console.log(`[Renderer ${prefix}] ${message} (${sourceId}:${line})`)
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

const DOCS_URL = 'https://segu-g.github.io/nicomview/'

function setupMenu(): void {
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: '編集',
      submenu: [
        { role: 'cut', label: 'カット' },
        { role: 'copy', label: 'コピー' },
        { role: 'paste', label: 'ペースト' },
        { role: 'selectAll', label: 'すべて選択' }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'ドキュメントを開く',
          click: () => shell.openExternal(DOCS_URL)
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.name,
      submenu: [
        { role: 'hide', label: `${app.name}を隠す` },
        { role: 'hideOthers', label: '他を隠す' },
        { type: 'separator' },
        { role: 'quit', label: '終了' }
      ]
    })
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
}

app.whenReady().then(() => {
  setupMenu()
  createWindow()
})

app.on('window-all-closed', () => {
  commentManager?.disconnect()
  ttsManager?.dispose()
  const cleanup = server ? server.close() : Promise.resolve()
  cleanup.finally(() => app.quit())
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
