import { describe, it, expect } from 'vitest'
import { pluginFileUrl, pluginOverlayUrl, pluginSettingsUrl } from './constants'

describe('プラグイン URL', () => {
  it('公開 URL の形を維持する', () => {
    expect(pluginOverlayUrl('p')).toBe('http://localhost:3939/plugins/p/overlay/')
    expect(pluginSettingsUrl('p')).toBe('http://localhost:3939/plugins/p/settings/?pluginId=p')
    expect(pluginFileUrl('p', 'models/a.psd')).toBe('http://localhost:3939/plugins/p/models/a.psd')
  })

  it('空文字だけを除き 0 は残す', () => {
    expect(pluginOverlayUrl('p', { a: '', b: 0, c: 'x' })).toBe('http://localhost:3939/plugins/p/overlay/?b=0&c=x')
  })
})
