import { useCallback, useEffect, useRef, useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { ENGINE_RELOAD_DELAY_MS } from '../../../shared/constants'
import { fetchSpeakerOptions } from '../../../shared/tts/voicevox'
import type { TtsAdapterParamDef, TtsAdapterParamOption } from '../../../shared/types'
import { SpeedVolumeFields } from '../../../shared/ui/SpeedVolumeFields'
import { TtsParamFields } from '../../../shared/ui/TtsParamFields'
import { TtsEventFields } from '../../../shared/ui/TtsEventFields'
import { parseEvents, serializeEvents } from '../../../shared/eventFilter'
import { ALL_EVENT_TYPES, DEFAULT_TTS_TEMPLATES } from '../../../shared/types'
import { DEFAULTS, DEFAULT_TTS_EVENTS, TTS_EVENTS_KEY, speakerKey, templateKey, type RawSettings } from '../config'

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

  const speakerParam: TtsAdapterParamDef = { key: 'speaker', role: 'speaker', label: 'キャラクター', type: 'select', defaultValue: DEFAULTS.speaker, options }
  const params: TtsAdapterParamDef[] = [
    { key: 'voicevoxHost', label: 'API ホスト', type: 'string', defaultValue: DEFAULTS.voicevoxHost },
    speakerParam,
  ]
  // イベント別の設定は、イベント種別ごとに別のキーで保存している
  const templates = Object.fromEntries(ALL_EVENT_TYPES.map((type) => [type, String(settings[templateKey(type)] ?? '')]))
  const speakerOverrides = Object.fromEntries(ALL_EVENT_TYPES.map((type) => [type, settings[speakerKey(type)] ?? '']))

  return (
    <ThemeProvider theme={theme}>
      <div className="settings-section">
        <div className="settings-section-title">読み上げ設定（VOICEVOX）</div>
        <div className="settings-note">
          話者・速度・音量・読み上げるイベントは、本体の読み上げとは別に設定されます。本体の読み上げも有効な場合、同じイベントは両方で読み上げられます。
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
        <div className="settings-note">
          テンプレートが空欄のときは、薄く表示されている既定の文面で読み上げます。
        </div>
        <TtsEventFields
          enabledEvents={parseEvents(settings[TTS_EVENTS_KEY], DEFAULT_TTS_EVENTS)}
          onEnabledEventsChange={(events) => onChange(TTS_EVENTS_KEY, serializeEvents(events, DEFAULT_TTS_EVENTS))}
          templates={templates}
          templatePlaceholders={DEFAULT_TTS_TEMPLATES}
          onTemplateChange={(type, template) => onChange(templateKey(type), template)}
          speakerOverrides={speakerOverrides}
          onSpeakerOverrideChange={(type, value) => onChange(speakerKey(type), value)}
          speakerOptions={options}
          speakerLabel={speakerParam.label}
        />
      </div>
    </ThemeProvider>
  )
}
