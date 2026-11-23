import type { ReactNode } from 'react'
import { EVENTS_KEY, parseEvents, serializeEvents } from '../../shared/eventFilter'
import { EventFilter } from './EventFilter'
import { NumberField, SelectField } from './fields'
import { usePluginSettings, type SettingValues } from './usePluginSettings'

const THEMES = [
  { value: 'dark', label: 'ダーク' },
  { value: 'light', label: 'ライト' },
]
const DIRECTIONS = [
  { value: 'top', label: '上から' },
  { value: 'bottom', label: '下から' },
]

interface Props {
  pluginId: string
  defaults: SettingValues & { fontSize: number; theme: string; direction: string }
  /** プラグイン固有の項目 */
  renderExtra?: (settings: SettingValues, update: (key: string, value: string | number) => void) => ReactNode
}

/** コメント表示系オーバーレイの共通設定フォーム */
export function OverlaySettings({ pluginId, defaults, renderExtra }: Props): JSX.Element | null {
  const { settings, ready, update } = usePluginSettings(pluginId, defaults)
  if (!ready) return null

  // 既定の方向を先頭に出す
  const directions = [...DIRECTIONS]
    .sort((a, b) => Number(b.value === defaults.direction) - Number(a.value === defaults.direction))
    .map((d) => (d.value === defaults.direction ? { ...d, label: `${d.label}（デフォルト）` } : d))

  return (
    <div className="settings-form">
      <NumberField label="フォントサイズ (px)" min={1} value={settings.fontSize} onChange={(v) => update('fontSize', v)} />
      <SelectField label="テーマ" options={THEMES} value={settings.theme} onChange={(v) => update('theme', v)} />
      {renderExtra?.(settings, update)}
      <SelectField label="表示方向" options={directions} value={settings.direction} onChange={(v) => update('direction', v)} />
      <EventFilter
        value={parseEvents(settings[EVENTS_KEY])}
        onChange={(events) => update(EVENTS_KEY, serializeEvents(events))}
      />
    </div>
  )
}
