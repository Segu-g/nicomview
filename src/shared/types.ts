export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export type CommentEventType = 'comment' | 'gift' | 'emotion' | 'notification' | 'operatorComment'

export const ALL_EVENT_TYPES: CommentEventType[] = [
  'comment',
  'gift',
  'emotion',
  'notification',
  'operatorComment'
]

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  overlay: boolean
}

export interface PluginDescriptor extends PluginManifest {
  builtIn: boolean
  basePath: string
}

export interface PluginPreferences {
  enabledEvents: CommentEventType[]
}
