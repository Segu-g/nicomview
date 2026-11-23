import {
  TTS_SPEED_RANGE,
  TTS_VOLUME_RANGE,
  VOICEVOX_DEFAULTS,
  type NumberRange,
} from '../../shared/constants'

export const PLUGIN_ID = 'psd-avatar'

/** 口・目それぞれのフレーム数 */
export const FRAME_COUNT = 5
export const MAX_FRAME = FRAME_COUNT - 1

const frameKeys = (prefix: 'mouth' | 'eye'): string[] =>
  Array.from({ length: FRAME_COUNT }, (_, i) => `${prefix}${i}`)

export const MOUTH_KEYS = frameKeys('mouth')
export const EYE_KEYS = frameKeys('eye')
export const ALL_ROLE_KEYS = [...MOUTH_KEYS, ...EYE_KEYS]

export const RANGES = {
  speed: TTS_SPEED_RANGE,
  volume: TTS_VOLUME_RANGE,
  threshold: { min: 0, max: 1, step: 0.01 },
  sensitivity: { min: 1, max: 60, step: 1 },
  mouthTransitionFrames: { min: 1, max: 30, step: 1 },
  blinkInterval: { min: 0.5, max: 10, step: 0.5 },
  blinkSpeed: { min: 1, max: 30, step: 1 },
} satisfies Record<string, NumberRange>

const NUMBER_DEFAULTS = {
  speaker: VOICEVOX_DEFAULTS.speakerId,
  speed: 1.0,
  volume: 1.0,
  threshold: 0.15,
  sensitivity: 8,
  mouthTransitionFrames: 4,
  blinkInterval: 3,
  blinkSpeed: 6,
}

const STRING_DEFAULTS = {
  psdFile: 'models/default.psd',
  voicevoxHost: `http://${VOICEVOX_DEFAULTS.host}:${VOICEVOX_DEFAULTS.port}`,
}

export const DEFAULTS = {
  ...STRING_DEFAULTS,
  ...NUMBER_DEFAULTS,
  ...Object.fromEntries(ALL_ROLE_KEYS.map((key) => [key, ''])),
  layerVisibility: '{}',
  flipX: 0,
  flipY: 0,
}

export type RawSettings = Record<string, string | number>

export interface PsdAvatarConfig {
  psdFile: string
  voicevoxHost: string
  speaker: number
  speed: number
  volume: number
  mouth: string[][]
  eye: string[][]
  threshold: number
  sensitivity: number
  mouthTransitionFrames: number
  blinkInterval: number
  blinkSpeed: number
  layerVisibility: Record<string, boolean>
  flipX: boolean
  flipY: boolean
  preview: boolean
}

export function parseLayerPaths(value: string | number | null | undefined): string[] {
  const str = String(value ?? '')
  if (!str) return []
  if (str.startsWith('[')) {
    try { return JSON.parse(str) as string[] } catch { /* fall through */ }
  }
  return [str] // backward compat: plain path string
}

export function parseLayerVisibility(value: unknown): Record<string, boolean> {
  try {
    if (typeof value === 'string' && value) {
      const parsed: unknown = JSON.parse(value)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, boolean>
      }
    }
  } catch { /* ignore */ }
  return {}
}

export function parseConfig(params: URLSearchParams): PsdAvatarConfig {
  const num = (key: keyof typeof NUMBER_DEFAULTS): number => {
    const fallback = NUMBER_DEFAULTS[key]
    const raw = params.get(key)
    if (raw === null || raw.trim() === '') return fallback
    const value = Number(raw)
    if (!Number.isFinite(value)) return fallback
    // 0 を許容しない項目（除数・間隔など）の 0 は未指定として扱う
    const range: NumberRange | undefined = key === 'speaker' ? undefined : RANGES[key]
    return value === 0 && range && range.min > 0 ? fallback : value
  }
  const str = (key: keyof typeof STRING_DEFAULTS): string => params.get(key) || STRING_DEFAULTS[key]
  const frames = (keys: string[]): string[][] => keys.map((key) => parseLayerPaths(params.get(key)))

  return {
    psdFile: str('psdFile'),
    voicevoxHost: str('voicevoxHost'),
    speaker: num('speaker'),
    speed: num('speed'),
    volume: num('volume'),
    mouth: frames(MOUTH_KEYS),
    eye: frames(EYE_KEYS),
    threshold: num('threshold'),
    sensitivity: num('sensitivity'),
    mouthTransitionFrames: num('mouthTransitionFrames'),
    blinkInterval: num('blinkInterval'),
    blinkSpeed: num('blinkSpeed'),
    layerVisibility: parseLayerVisibility(params.get('layerVisibility')),
    flipX: params.get('flipX') === '1',
    flipY: params.get('flipY') === '1',
    preview: params.get('preview') === 'true',
  }
}
