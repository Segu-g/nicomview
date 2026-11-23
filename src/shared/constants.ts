/** オーバーレイ配信サーバー */
export const HTTP_PORT = 3939
export const WS_PORT = 3940
export const HTTP_BASE_URL = `http://localhost:${HTTP_PORT}`
export const WS_URL = `ws://localhost:${WS_PORT}`

export function pluginPath(pluginId: string): string {
  return `/plugins/${pluginId}`
}

export function pluginOverlayPath(pluginId: string): string {
  return `${pluginPath(pluginId)}/overlay/`
}

export function pluginFileUrl(pluginId: string, file: string): string {
  return `${HTTP_BASE_URL}${pluginPath(pluginId)}/${file}`
}

export function pluginSettingsUrl(pluginId: string): string {
  return `${HTTP_BASE_URL}${pluginPath(pluginId)}/settings/?pluginId=${pluginId}`
}

/** 空の値を除いた設定をクエリに載せたオーバーレイ URL を返す */
export function pluginOverlayUrl(
  pluginId: string,
  settings: Record<string, string | number | boolean> = {}
): string {
  const base = `${HTTP_BASE_URL}${pluginOverlayPath(pluginId)}`
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(settings)) {
    if (value !== '' && value != null) params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

/** 読み上げ */
export interface NumberRange {
  min: number
  max: number
  step: number
}

export const TTS_SPEED_RANGE: NumberRange = { min: 0.5, max: 2.0, step: 0.1 }
export const TTS_VOLUME_RANGE: NumberRange = { min: 0, max: 2.0, step: 0.1 }
/** 接続先の変更後、話者一覧を再取得するまでの待ち時間 */
export const ENGINE_RELOAD_DELAY_MS = 500
export const TTS_MAX_QUEUE_SIZE = 30
export const PORT_RANGE: NumberRange = { min: 1, max: 65535, step: 1 }

export const VOICEVOX_DEFAULTS = { host: 'localhost', port: 50021, speakerId: 0 }
