import { useCallback, useEffect, useRef, useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { ENGINE_RELOAD_DELAY_MS } from '../../../shared/constants'
import { fetchSpeakerOptions } from '../../../shared/tts/voicevox'
import type { TtsAdapterParamDef, TtsAdapterParamOption } from '../../../shared/types'
import { SpeedVolumeFields } from '../../../shared/ui/SpeedVolumeFields'
import { TtsParamFields } from '../../../shared/ui/TtsParamFields'
import { DEFAULTS, type RawSettings } from '../config'

const theme = createTheme({ palette: { mode: 'dark', primary: { main: '#90caf9' } } })

interface Props {
  settings: RawSettings
  onChange: (key: string, value: string | number) => void
}

export function VoiceSettings({ settings, onChange }: Props): JSX.Element {
  const host = String(settings.voicevoxHost)
  const [options, setOptions] = useState<TtsAdapterParamOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)
  const firstLoadRef = useRef(true)

  const load = useCallback(async () => {
    const request = ++requestRef.current
    setError(null)
    try {
      const loaded = await fetchSpeakerOptions(host)
      if (request === requestRef.current) setOptions(loaded)
    } catch (e) {
      if (request !== requestRef.current) return
      setOptions([])
      setError(String(e))
    }
  }, [host])

  // 接続先の入力が落ち着いてから取得する
  useEffect(() => {
    const timer = setTimeout(load, firstLoadRef.current ? 0 : ENGINE_RELOAD_DELAY_MS)
    firstLoadRef.current = false
    return () => {
      clearTimeout(timer)
      requestRef.current++
    }
  }, [load])

  const params: TtsAdapterParamDef[] = [
    { key: 'voicevoxHost', label: 'API ホスト', type: 'string', defaultValue: DEFAULTS.voicevoxHost },
    { key: 'speaker', role: 'speaker', label: 'キャラクター', type: 'select', defaultValue: DEFAULTS.speaker, options },
  ]

  return (
    <ThemeProvider theme={theme}>
      <div className="settings-section">
        <div className="settings-section-title">読み上げ設定（VOICEVOX）</div>
        <div className="settings-note">
          話者・速度・音量は本体の読み上げとは別に設定されます。本体の読み上げも有効な場合、コメントは両方で読み上げられます。
        </div>
        <TtsParamFields
          params={params}
          values={settings}
          onChange={(param, value) => onChange(param.key, value)}
          onRefresh={load}
        />
        {error && <div className="error-text">{error}</div>}
        <SpeedVolumeFields
          speed={Number(settings.speed)}
          volume={Number(settings.volume)}
          onSpeedChange={(v) => onChange('speed', v)}
          onVolumeChange={(v) => onChange('volume', v)}
        />
      </div>
    </ThemeProvider>
  )
}
