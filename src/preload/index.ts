import { contextBridge, ipcRenderer } from 'electron'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface CommentViewerAPI {
  connect(liveId: string, cookies?: string): Promise<void>
  disconnect(): Promise<void>
  onStateChange(callback: (state: ConnectionState) => void): () => void
  getOverlayUrl(): string
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

  getOverlayUrl(): string {
    return 'http://localhost:3939'
  }
}

contextBridge.exposeInMainWorld('commentViewerAPI', api)
