import type { TtsAdapterParamDef } from '../../../shared/types'
import { PORT_RANGE } from '../../../shared/constants'
import type { TtsAdapter } from '../types'

/** 共通の速度・音量 1.0 に対応する棒読みちゃん側の値 */
const SPEED_SCALE = 100
const VOLUME_SCALE = 50

export class BouyomichanAdapter implements TtsAdapter {
  readonly id = 'bouyomichan'
  readonly name = '棒読みちゃん'
  readonly defaultSettings = { host: 'localhost', port: 50080, voice: 0, tone: -1 }

  private host: string
  private port: number
  private voice: number
  private tone: number

  constructor(settings?: Record<string, string | number | boolean>) {
    this.host = String(settings?.host ?? this.defaultSettings.host)
    this.port = Number(settings?.port ?? this.defaultSettings.port)
    this.voice = Number(settings?.voice ?? this.defaultSettings.voice)
    this.tone = Number(settings?.tone ?? this.defaultSettings.tone)
  }

  updateSettings(settings: Record<string, string | number | boolean>): void {
    if (settings.host !== undefined) this.host = String(settings.host)
    if (settings.port !== undefined) this.port = Number(settings.port)
    if (settings.voice !== undefined) this.voice = Number(settings.voice)
    if (settings.tone !== undefined) this.tone = Number(settings.tone)
  }

  async getParamDefs(): Promise<TtsAdapterParamDef[]> {
    return [
      {
        key: 'host',
        label: 'ホスト',
        type: 'string',
        defaultValue: this.defaultSettings.host
      },
      {
        key: 'port',
        label: 'ポート',
        type: 'number',
        defaultValue: this.defaultSettings.port,
        ...PORT_RANGE
      },
      {
        key: 'voice',
        role: 'speaker',
        label: '声質',
        type: 'select',
        defaultValue: this.defaultSettings.voice,
        options: [
          { value: 0, label: 'デフォルト' },
          { value: 1, label: '女性1' },
          { value: 2, label: '女性2' },
          { value: 3, label: '男性1' },
          { value: 4, label: '男性2' },
          { value: 5, label: '中性' },
          { value: 6, label: 'ロボット' },
          { value: 7, label: '機械1' },
          { value: 8, label: '機械2' }
        ]
      },
      {
        key: 'tone',
        label: '声の高さ',
        type: 'number',
        defaultValue: this.defaultSettings.tone,
        min: -1,
        max: 200,
        step: 1
      }
    ]
  }

  async speak(text: string, speed: number, volume: number, speakerOverride?: number | string): Promise<void> {
    const voice = speakerOverride !== undefined ? Number(speakerOverride) : this.voice
    const bouyomiSpeed = Math.round(speed * SPEED_SCALE)
    const bouyomiVolume = Math.round(volume * VOLUME_SCALE)

    const url = new URL(`http://${this.host}:${this.port}/Talk`)
    url.searchParams.set('text', text)
    url.searchParams.set('voice', String(voice))
    url.searchParams.set('speed', String(bouyomiSpeed))
    url.searchParams.set('volume', String(bouyomiVolume))
    url.searchParams.set('tone', String(this.tone))

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error(`BouyomiChan Talk failed: ${res.status}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`http://${this.host}:${this.port}/Talk?text=`)
      return res.ok
    } catch {
      return false
    }
  }

  dispose(): void {
    // No resources to clean up
  }
}
