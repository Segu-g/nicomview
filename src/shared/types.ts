import type { PLUGIN_MESSAGE } from './pluginMessages'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export type CommentEventType = 'comment' | 'gift' | 'emotion' | 'notification' | 'operatorComment'

export const ALL_EVENT_TYPES: CommentEventType[] = [
  'comment',
  'gift',
  'emotion',
  'notification',
  'operatorComment'
]

export function isValidEventType(t: unknown): t is CommentEventType {
  return typeof t === 'string' && ALL_EVENT_TYPES.includes(t as CommentEventType)
}

export const DEFAULT_TTS_TEMPLATES: Record<CommentEventType, string> = {
  comment: '{content}',
  gift: '{userName}さんが{itemName}を贈りました',
  emotion: '{content}',
  notification: '{message}',
  operatorComment: '放送者コメント: {content}'
}

export type PluginSettings = Record<string, string | number | boolean>

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  overlay: boolean
  defaultFontSize?: number
  settings?: boolean
  settingsPopup?: boolean
}

export interface PluginDescriptor extends PluginManifest {
  builtIn: boolean
  basePath: string
}

export interface PluginPreferences {
  enabledEvents: CommentEventType[]
}

export type PluginSettingsMessage =
  | { type: typeof PLUGIN_MESSAGE.ready; pluginId: string }
  | { type: typeof PLUGIN_MESSAGE.settingsUpdate; pluginId: string; settings: PluginSettings }
  | { type: typeof PLUGIN_MESSAGE.settingsInit; settings: PluginSettings }

export interface PluginTestSpeakMessage {
  type: typeof PLUGIN_MESSAGE.testSpeak
  text: string
}

export type TtsAdapterSettings = Record<string, string | number | boolean>
export type TtsSpeakerOverrides = Partial<Record<CommentEventType, number | string>>

export interface TtsSettings {
  enabled: boolean
  adapterId: string
  enabledEvents: CommentEventType[]
  speed: number
  volume: number
  /** エンジン ID ごとの固有設定 */
  adapterSettings: Record<string, TtsAdapterSettings>
  formatTemplates: Record<CommentEventType, string>
  /** エンジン ID ごとのイベント別話者 */
  speakerOverrides: Record<string, TtsSpeakerOverrides>
}

export interface TtsAdapterInfo {
  id: string
  name: string
  defaultSettings: TtsAdapterSettings
}

export interface TtsAdapterParamOption {
  value: string | number
  label: string
}

export interface TtsAdapterParamDef {
  key: string
  label: string
  type: 'string' | 'number' | 'select'
  defaultValue: string | number
  min?: number
  max?: number
  step?: number
  options?: TtsAdapterParamOption[]
  /** 'speaker' のパラメーターはイベント別に上書きできる */
  role?: 'speaker'
}

export interface CommentViewerAPI {
  connect(liveId: string, cookies?: string): Promise<void>
  disconnect(): Promise<void>
  onStateChange(callback: (state: ConnectionState) => void): () => void
  getPlugins(): Promise<PluginDescriptor[]>
  getPluginPreferences(): Promise<PluginPreferences>
  setPluginPreferences(prefs: Partial<PluginPreferences>): Promise<void>
  getPluginSettings(pluginId: string): Promise<PluginSettings>
  setPluginSettings(pluginId: string, settings: PluginSettings): Promise<void>
  getTtsSettings(): Promise<TtsSettings>
  setTtsSettings(settings: Partial<TtsSettings>): Promise<void>
  getTtsAdapters(): Promise<TtsAdapterInfo[]>
  getTtsAdapterParams(adapterId: string): Promise<TtsAdapterParamDef[]>
  openPluginFolder(): Promise<void>
}
