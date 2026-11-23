import { NumberField } from '../../settings/fields'
import type { SettingsProps } from '../../settings/mountSettings'
import { OverlaySettings } from '../../settings/OverlaySettings'

const DEFAULTS = { fontSize: 28, theme: 'dark', duration: 60, direction: 'top' }

export function Settings({ pluginId }: SettingsProps) {
  return (
    <OverlaySettings
      pluginId={pluginId}
      defaults={DEFAULTS}
      renderExtra={(settings, update) => (
        <NumberField label="表示時間 (秒)" min={1} value={settings.duration} onChange={(v) => update('duration', v)} />
      )}
    />
  )
}
