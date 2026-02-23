import { useEffect, useState, useCallback } from 'react'
import type { PluginSettings, PluginSettingsMessage } from '../../../shared/types'

const DEFAULTS = { fontSize: 28, theme: 'dark', duration: 60 }

interface Props {
  pluginId: string
}

export function Settings({ pluginId }: Props) {
  const [fontSize, setFontSize] = useState(String(DEFAULTS.fontSize))
  const [theme, setTheme] = useState(DEFAULTS.theme)
  const [duration, setDuration] = useState(String(DEFAULTS.duration))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as PluginSettingsMessage
      if (msg?.type === 'nicomview:settings-init') {
        const s = msg.settings
        setFontSize(String(s.fontSize ?? DEFAULTS.fontSize))
        setTheme(String(s.theme ?? DEFAULTS.theme))
        setDuration(String(s.duration ?? DEFAULTS.duration))
        setReady(true)
      }
    }
    window.addEventListener('message', handler)
    window.parent.postMessage({ type: 'nicomview:ready', pluginId }, '*')
    return () => window.removeEventListener('message', handler)
  }, [pluginId])

  const sendUpdate = useCallback(
    (settings: PluginSettings) => {
      window.parent.postMessage(
        { type: 'nicomview:settings-update', pluginId, settings },
        '*'
      )
    },
    [pluginId]
  )

  const handleFontSizeChange = (value: string) => {
    setFontSize(value)
    const settings: PluginSettings = { theme, duration: Number(duration) }
    if (value) settings.fontSize = Number(value)
    sendUpdate(settings)
  }

  const handleThemeChange = (value: string) => {
    setTheme(value)
    const settings: PluginSettings = { theme: value, duration: Number(duration) }
    if (fontSize) settings.fontSize = Number(fontSize)
    sendUpdate(settings)
  }

  const handleDurationChange = (value: string) => {
    setDuration(value)
    const settings: PluginSettings = { theme }
    if (fontSize) settings.fontSize = Number(fontSize)
    if (value) settings.duration = Number(value)
    sendUpdate(settings)
  }

  if (!ready) return null

  return (
    <div className="settings-form">
      <label className="settings-label">
        フォントサイズ (px)
        <input
          type="number"
          min={1}
          value={fontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
        />
      </label>
      <label className="settings-label">
        テーマ
        <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
          <option value="dark">ダーク</option>
          <option value="light">ライト</option>
        </select>
      </label>
      <label className="settings-label">
        表示時間 (秒)
        <input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => handleDurationChange(e.target.value)}
        />
      </label>
    </div>
  )
}
