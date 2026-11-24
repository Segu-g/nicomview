import { useCallback, useEffect, useRef, useState } from 'react'
import { PLUGIN_MESSAGE } from '../../shared/pluginMessages'
import type { PluginSettingsMessage } from '../../shared/types'

export type SettingValues = Record<string, string | number>

function postToHost(message: PluginSettingsMessage): void {
  // ポップアップなら opener、iframe なら parent が本体
  ;(window.opener || window.parent).postMessage(message, '*')
}

/** 設定画面と本体の間の初期化・保存を担う */
export function usePluginSettings(pluginId: string, defaults: SettingValues) {
  const [settings, setSettings] = useState<SettingValues>(defaults)
  const [ready, setReady] = useState(false)
  const latestRef = useRef(settings)
  const defaultsRef = useRef(defaults)

  const apply = useCallback((next: SettingValues) => {
    latestRef.current = next
    setSettings(next)
  }, [])

  useEffect(() => {
    const handler = (e: MessageEvent): void => {
      const msg = e.data as PluginSettingsMessage
      if (msg?.type !== PLUGIN_MESSAGE.settingsInit) return
      const merged = { ...defaultsRef.current }
      for (const [key, value] of Object.entries(msg.settings)) {
        if (value !== '' && value != null) merged[key] = value as string | number
      }
      apply(merged)
      setReady(true)
    }
    window.addEventListener('message', handler)
    postToHost({ type: PLUGIN_MESSAGE.ready, pluginId })
    return () => window.removeEventListener('message', handler)
  }, [pluginId, apply])

  const update = useCallback(
    (key: string, value: string | number) => {
      const next = { ...latestRef.current, [key]: value }
      apply(next)
      postToHost({ type: PLUGIN_MESSAGE.settingsUpdate, pluginId, settings: next })
    },
    [pluginId, apply]
  )

  return { settings, ready, update }
}
