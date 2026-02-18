import { contextBridge, ipcRenderer } from 'electron'
import type {
  ConnectionState,
  CommentEvent,
  PluginDescriptor,
  PluginPreferences
} from '../shared/types'

export interface CommentViewerAPI {
  connect(liveId: string, cookies?: string): Promise<void>
  disconnect(): Promise<void>
  onStateChange(callback: (state: ConnectionState) => void): () => void
  onCommentEvent(callback: (event: CommentEvent) => void): () => void
  getOverlayUrl(): string
  getPlugins(): Promise<PluginDescriptor[]>
  getPluginPreferences(): Promise<PluginPreferences>
  setPluginPreferences(prefs: Partial<PluginPreferences>): Promise<void>
}

const api: CommentViewerAPI = {
  connect(liveId: string, cookies?: string): Promise<void> {
    return ipcRenderer.invoke('connect', liveId, cookies)
  },

  disconnect(): Promise<void> {
    return ipcRenderer.invoke('disconnect')
  },

  onStateChange(callback: (state: ConnectionState) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, state: ConnectionState) => {
      callback(state)
    }
    ipcRenderer.on('state-change', handler)
    return () => {
      ipcRenderer.removeListener('state-change', handler)
    }
  },

  onCommentEvent(callback: (event: CommentEvent) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, commentEvent: CommentEvent) => {
      callback(commentEvent)
    }
    ipcRenderer.on('comment-event', handler)
    return () => {
      ipcRenderer.removeListener('comment-event', handler)
    }
  },

  getOverlayUrl(): string {
    return 'http://localhost:3939'
  },

  getPlugins(): Promise<PluginDescriptor[]> {
    return ipcRenderer.invoke('get-plugins')
  },

  getPluginPreferences(): Promise<PluginPreferences> {
    return ipcRenderer.invoke('get-plugin-preferences')
  },

  setPluginPreferences(prefs: Partial<PluginPreferences>): Promise<void> {
    return ipcRenderer.invoke('set-plugin-preferences', prefs)
  }
}

contextBridge.exposeInMainWorld('commentViewerAPI', api)
