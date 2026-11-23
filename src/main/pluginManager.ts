import fs from 'fs'
import path from 'path'
import { saveJson, loadJsonRaw } from './utils/jsonStore'
import { pluginPath } from '../shared/constants'
import type {
  PluginManifest,
  PluginDescriptor,
  PluginSettings
} from '../shared/types'

const SETTINGS_FILE = 'plugin-settings.json'

function isValidManifest(obj: unknown): obj is PluginManifest {
  if (typeof obj !== 'object' || obj === null) return false
  const m = obj as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    m.id.length > 0 &&
    typeof m.name === 'string' &&
    typeof m.version === 'string' &&
    typeof m.overlay === 'boolean'
  )
}

export class PluginManager {
  private plugins: Map<string, PluginDescriptor> = new Map()
  private settingsPath: string
  private allSettings: Record<string, PluginSettings>
  private pluginsDir: string

  constructor(pluginsDir: string, userDataDir: string) {
    this.pluginsDir = pluginsDir
    this.settingsPath = path.join(userDataDir, SETTINGS_FILE)
    this.allSettings = this.loadSettings()
  }

  discover(): void {
    this.plugins.clear()

    if (!fs.existsSync(this.pluginsDir)) return

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(this.pluginsDir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const manifestPath = path.join(this.pluginsDir, entry.name, 'plugin.json')
      if (!fs.existsSync(manifestPath)) continue

      try {
        const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        if (!isValidManifest(raw)) continue

        const descriptor: PluginDescriptor = {
          ...raw,
          builtIn: false,
          basePath: pluginPath(raw.id)
        }
        this.plugins.set(raw.id, descriptor)
      } catch {
        // Skip invalid manifests
      }
    }
  }

  getPlugins(): PluginDescriptor[] {
    return Array.from(this.plugins.values())
  }

  getPlugin(id: string): PluginDescriptor | undefined {
    return this.plugins.get(id)
  }

  getPluginSettings(id: string): PluginSettings {
    return { ...(this.allSettings[id] ?? {}) }
  }

  setPluginSettings(id: string, settings: PluginSettings): void {
    this.allSettings[id] = { ...settings }
    this.saveSettings()
  }

  getPluginFsPath(id: string): string | undefined {
    const plugin = this.plugins.get(id)
    if (!plugin) return undefined

    return path.join(this.pluginsDir, id)
  }

  private loadSettings(): Record<string, PluginSettings> {
    const raw = loadJsonRaw(this.settingsPath, 'PluginManager')
    if (typeof raw === 'object' && raw !== null) {
      return raw as Record<string, PluginSettings>
    }
    return {}
  }

  private saveSettings(): void {
    saveJson(this.settingsPath, this.allSettings)
  }
}
