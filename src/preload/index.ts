import { contextBridge, ipcRenderer } from 'electron'
import type {
  ConnectionState,
  PluginDescriptor,
  PluginSettings,
  TtsSettings,
  TtsAdapterInfo,
  TtsAdapterParamDef,
  CommentViewerAPI
} from '../shared/types'
import { IPC } from '../shared/ipc'

const api: CommentViewerAPI = {
  connect(liveId: string, cookies?: string): Promise<void> {
    return ipcRenderer.invoke(IPC.connect, liveId, cookies)
  },

  disconnect(): Promise<void> {
    return ipcRenderer.invoke(IPC.disconnect)
  },

  onStateChange(callback: (state: ConnectionState) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, state: ConnectionState) => {
      callback(state)
    }
    ipcRenderer.on(IPC.stateChange, handler)
    return () => {
      ipcRenderer.removeListener(IPC.stateChange, handler)
    }
  },

  getPlugins(): Promise<PluginDescriptor[]> {
    return ipcRenderer.invoke(IPC.getPlugins)
  },

  getPluginSettings(pluginId: string): Promise<PluginSettings> {
    return ipcRenderer.invoke(IPC.getPluginSettings, pluginId)
  },

  setPluginSettings(pluginId: string, settings: PluginSettings): Promise<void> {
    return ipcRenderer.invoke(IPC.setPluginSettings, pluginId, settings)
  },

  getTtsSettings(): Promise<TtsSettings> {
    return ipcRenderer.invoke(IPC.getTtsSettings)
  },

  setTtsSettings(settings: Partial<TtsSettings>): Promise<void> {
    return ipcRenderer.invoke(IPC.setTtsSettings, settings)
  },

  getTtsAdapters(): Promise<TtsAdapterInfo[]> {
    return ipcRenderer.invoke(IPC.getTtsAdapters)
  },

  getTtsAdapterParams(adapterId: string): Promise<TtsAdapterParamDef[]> {
    return ipcRenderer.invoke(IPC.getTtsAdapterParams, adapterId)
  },

  openPluginFolder(): Promise<void> {
    return ipcRenderer.invoke(IPC.openPluginFolder)
  }
}

contextBridge.exposeInMainWorld('commentViewerAPI', api)
