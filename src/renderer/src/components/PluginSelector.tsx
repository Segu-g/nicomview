import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material'
import type { PluginDescriptor, PluginPreferences } from '../../../shared/types'

interface PluginSelectorProps {
  plugins: PluginDescriptor[]
  preferences: PluginPreferences
  onPreferencesChange: (prefs: Partial<PluginPreferences>) => void
}

export default function PluginSelector({
  plugins,
  preferences,
  onPreferencesChange
}: PluginSelectorProps): JSX.Element {
  const rendererPlugins = plugins.filter((p) => p.renderer)
  const overlayPlugins = plugins.filter((p) => p.overlay)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel>レンダラープラグイン</InputLabel>
        <Select
          value={preferences.activeRendererPlugin ?? ''}
          label="レンダラープラグイン"
          onChange={(e) =>
            onPreferencesChange({
              activeRendererPlugin: e.target.value || null
            })
          }
        >
          <MenuItem value="">
            <em>なし</em>
          </MenuItem>
          {rendererPlugins.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>オーバーレイプラグイン</InputLabel>
        <Select
          value={preferences.activeOverlayPlugin ?? ''}
          label="オーバーレイプラグイン"
          onChange={(e) =>
            onPreferencesChange({
              activeOverlayPlugin: e.target.value || null
            })
          }
        >
          <MenuItem value="">
            <em>なし</em>
          </MenuItem>
          {overlayPlugins.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}
