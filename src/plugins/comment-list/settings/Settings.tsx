import type { SettingsProps } from '../../settings/mountSettings'
import { OverlaySettings } from '../../settings/OverlaySettings'

const DEFAULTS = { fontSize: 28, theme: 'dark', direction: 'bottom' }

export function Settings({ pluginId }: SettingsProps) {
  return <OverlaySettings pluginId={pluginId} defaults={DEFAULTS} />
}
