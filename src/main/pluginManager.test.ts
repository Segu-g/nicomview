import fs from 'fs'
import path from 'path'
import os from 'os'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PluginManager } from './pluginManager'

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nicomview-test-'))
}

function writePluginManifest(
  dir: string,
  pluginId: string,
  manifest: Record<string, unknown>
): void {
  const pluginDir = path.join(dir, pluginId)
  fs.mkdirSync(pluginDir, { recursive: true })
  fs.writeFileSync(path.join(pluginDir, 'plugin.json'), JSON.stringify(manifest))
}

describe('PluginManager', () => {
  let builtInDir: string
  let externalDir: string
  let userDataDir: string

  beforeEach(() => {
    builtInDir = createTempDir()
    externalDir = createTempDir()
    userDataDir = createTempDir()
  })

  afterEach(() => {
    fs.rmSync(builtInDir, { recursive: true, force: true })
    fs.rmSync(externalDir, { recursive: true, force: true })
    fs.rmSync(userDataDir, { recursive: true, force: true })
  })

  describe('discover', () => {
    it('ビルトインプラグインを検出する', () => {
      writePluginManifest(builtInDir, 'test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        renderer: true,
        overlay: false
      })

      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      const plugins = manager.getPlugins()
      expect(plugins).toHaveLength(1)
      expect(plugins[0].id).toBe('test-plugin')
      expect(plugins[0].builtIn).toBe(true)
      expect(plugins[0].basePath).toBe('/plugins/test-plugin')
    })

    it('外部プラグインを検出する', () => {
      writePluginManifest(externalDir, 'external-plugin', {
        id: 'external-plugin',
        name: 'External Plugin',
        version: '0.1.0',
        renderer: false,
        overlay: true
      })

      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      const plugins = manager.getPlugins()
      expect(plugins).toHaveLength(1)
      expect(plugins[0].id).toBe('external-plugin')
      expect(plugins[0].builtIn).toBe(false)
    })

    it('ビルトインと外部プラグインの両方を検出する', () => {
      writePluginManifest(builtInDir, 'builtin', {
        id: 'builtin',
        name: 'Built-in',
        version: '1.0.0',
        renderer: true,
        overlay: false
      })
      writePluginManifest(externalDir, 'external', {
        id: 'external',
        name: 'External',
        version: '1.0.0',
        renderer: false,
        overlay: true
      })

      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      expect(manager.getPlugins()).toHaveLength(2)
    })

    it('存在しないディレクトリでもエラーにならない', () => {
      const manager = new PluginManager('/nonexistent/path', '/also/nonexistent', userDataDir)
      expect(() => manager.discover()).not.toThrow()
      expect(manager.getPlugins()).toHaveLength(0)
    })

    it('不正なマニフェストをスキップする', () => {
      // Missing required fields
      writePluginManifest(builtInDir, 'bad-plugin', {
        id: 'bad-plugin',
        name: 'Bad'
        // missing version, renderer, overlay
      })
      writePluginManifest(builtInDir, 'good-plugin', {
        id: 'good-plugin',
        name: 'Good',
        version: '1.0.0',
        renderer: true,
        overlay: false
      })

      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      const plugins = manager.getPlugins()
      expect(plugins).toHaveLength(1)
      expect(plugins[0].id).toBe('good-plugin')
    })

    it('plugin.json がないディレクトリをスキップする', () => {
      fs.mkdirSync(path.join(builtInDir, 'no-manifest'), { recursive: true })

      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      expect(manager.getPlugins()).toHaveLength(0)
    })
  })

  describe('getPlugin', () => {
    it('IDで特定のプラグインを取得できる', () => {
      writePluginManifest(builtInDir, 'my-plugin', {
        id: 'my-plugin',
        name: 'My Plugin',
        version: '1.0.0',
        renderer: true,
        overlay: false
      })

      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      const plugin = manager.getPlugin('my-plugin')
      expect(plugin).toBeDefined()
      expect(plugin?.name).toBe('My Plugin')
    })

    it('存在しないIDではundefinedを返す', () => {
      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      expect(manager.getPlugin('nonexistent')).toBeUndefined()
    })
  })

  describe('preferences', () => {
    it('デフォルト設定を返す', () => {
      const manager = new PluginManager(builtInDir, externalDir, userDataDir)

      const prefs = manager.getPreferences()
      expect(prefs.activeRendererPlugin).toBe('md3-comment-list')
      expect(prefs.activeOverlayPlugin).toBe('nico-scroll')
      expect(prefs.enabledEvents).toEqual([
        'comment',
        'gift',
        'emotion',
        'notification',
        'operatorComment'
      ])
    })

    it('設定を保存・読み込みできる', () => {
      const manager1 = new PluginManager(builtInDir, externalDir, userDataDir)
      manager1.setPreferences({
        activeRendererPlugin: 'custom-renderer',
        enabledEvents: ['comment', 'gift']
      })

      // New instance reads from file
      const manager2 = new PluginManager(builtInDir, externalDir, userDataDir)
      const prefs = manager2.getPreferences()
      expect(prefs.activeRendererPlugin).toBe('custom-renderer')
      expect(prefs.activeOverlayPlugin).toBe('nico-scroll') // unchanged
      expect(prefs.enabledEvents).toEqual(['comment', 'gift'])
    })

    it('nullの activeRendererPlugin を保存できる', () => {
      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.setPreferences({ activeRendererPlugin: null })

      const prefs = manager.getPreferences()
      expect(prefs.activeRendererPlugin).toBeNull()
    })

    it('不正なイベントタイプをフィルタする', () => {
      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.setPreferences({
        enabledEvents: ['comment', 'invalid' as any, 'gift']
      })

      const prefs = manager.getPreferences()
      expect(prefs.enabledEvents).toEqual(['comment', 'gift'])
    })
  })

  describe('getPluginFsPath', () => {
    it('ビルトインプラグインのファイルシステムパスを返す', () => {
      writePluginManifest(builtInDir, 'test-plugin', {
        id: 'test-plugin',
        name: 'Test',
        version: '1.0.0',
        renderer: true,
        overlay: false
      })

      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      expect(manager.getPluginFsPath('test-plugin')).toBe(
        path.join(builtInDir, 'test-plugin')
      )
    })

    it('存在しないプラグインにはundefinedを返す', () => {
      const manager = new PluginManager(builtInDir, externalDir, userDataDir)
      manager.discover()

      expect(manager.getPluginFsPath('nonexistent')).toBeUndefined()
    })
  })
})
