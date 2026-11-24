import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'

export interface SettingsProps {
  pluginId: string
}

export function mountSettings(defaultPluginId: string, Settings: ComponentType<SettingsProps>): void {
  const pluginId = new URLSearchParams(location.search).get('pluginId') ?? defaultPluginId
  createRoot(document.getElementById('root')!).render(<Settings pluginId={pluginId} />)
}
