export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export type CommentEventType = 'comment' | 'gift' | 'emotion' | 'notification' | 'operatorComment'

export const ALL_EVENT_TYPES: CommentEventType[] = [
  'comment',
  'gift',
  'emotion',
  'notification',
  'operatorComment'
]

export interface CommentEvent {
  type: CommentEventType
  data: unknown
  timestamp: number
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  renderer: boolean
  overlay: boolean
}

export interface PluginDescriptor extends PluginManifest {
  builtIn: boolean
  basePath: string
}

export interface PluginPreferences {
  activeRendererPlugin: string | null
  activeOverlayPlugin: string | null
  enabledEvents: CommentEventType[]
}

export interface NicomViewPluginAPI {
  subscribe(callback: (event: CommentEvent) => void): () => void
  getConfig(): { enabledEvents: CommentEventType[] }
}

export interface RendererPluginExports {
  mount(container: HTMLElement, api: NicomViewPluginAPI): void
  unmount(): void
}
