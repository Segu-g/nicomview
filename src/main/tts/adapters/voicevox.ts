import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { fetchSpeakerOptions, synthesize } from '../../../shared/tts/voicevox'
import type { TtsAdapterParamDef } from '../../../shared/types'
import { PORT_RANGE, VOICEVOX_DEFAULTS } from '../../../shared/constants'
import type { TtsAdapter } from '../types'

export class VoicevoxAdapter implements TtsAdapter {
  readonly id = 'voicevox'
  readonly name = 'VOICEVOX'
  readonly defaultSettings = { ...VOICEVOX_DEFAULTS }

  private host: string
  private port: number
  private speakerId: number

  constructor(settings?: Record<string, string | number | boolean>) {
    this.host = String(settings?.host ?? this.defaultSettings.host)
    this.port = Number(settings?.port ?? this.defaultSettings.port)
    this.speakerId = Number(settings?.speakerId ?? this.defaultSettings.speakerId)
  }

  updateSettings(settings: Record<string, string | number | boolean>): void {
    if (settings.host !== undefined) this.host = String(settings.host)
    if (settings.port !== undefined) this.port = Number(settings.port)
    if (settings.speakerId !== undefined) this.speakerId = Number(settings.speakerId)
  }

  private get baseUrl(): string {
    return `http://${this.host}:${this.port}`
  }

  async getParamDefs(): Promise<TtsAdapterParamDef[]> {
    const defs: TtsAdapterParamDef[] = [
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
      }
    ]

    // キャラクター（話者）一覧を動的に取得
    const speakerDef: TtsAdapterParamDef = {
      key: 'speakerId',
      role: 'speaker',
      label: 'キャラクター',
      type: 'select',
      defaultValue: this.defaultSettings.speakerId,
      options: []
    }

    try {
      speakerDef.options = await fetchSpeakerOptions(this.baseUrl)
    } catch {
      // VOICEVOX未起動時は空のオプションで返す
    }

    defs.push(speakerDef)
    return defs
  }

  async speak(text: string, speed: number, volume: number, speakerOverride?: number | string): Promise<void> {
    const speaker = speakerOverride !== undefined ? Number(speakerOverride) : this.speakerId
    const wavBuffer = Buffer.from(await synthesize(text, speaker, speed, volume, this.baseUrl))

    // Write to temp file and play
    const tmpFile = path.join(os.tmpdir(), `nicomview-tts-${Date.now()}.wav`)
    fs.writeFileSync(tmpFile, wavBuffer)

    try {
      await this.playWav(tmpFile)
    } finally {
      try {
        fs.unlinkSync(tmpFile)
      } catch {
        // ignore cleanup errors
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/version`)
      return res.ok
    } catch {
      return false
    }
  }

  dispose(): void {
    // No resources to clean up
  }

  private playWav(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const platform = process.platform
      let cmd: string
      let args: string[]

      if (platform === 'linux') {
        cmd = 'aplay'
        args = [filePath]
      } else if (platform === 'darwin') {
        cmd = 'afplay'
        args = [filePath]
      } else if (platform === 'win32') {
        cmd = 'powershell'
        args = ['-c', `(New-Object Media.SoundPlayer '${filePath}').PlaySync()`]
      } else {
        reject(new Error(`Unsupported platform: ${platform}`))
        return
      }

      execFile(cmd, args, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}
