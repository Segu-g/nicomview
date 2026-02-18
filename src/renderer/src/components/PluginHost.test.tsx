import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PluginHost from './PluginHost'
import type { PluginPreferences } from '../../../shared/types'
import { ALL_EVENT_TYPES } from '../../../shared/types'

const defaultPreferences: PluginPreferences = {
  activeRendererPlugin: null,
  activeOverlayPlugin: 'nico-scroll',
  enabledEvents: [...ALL_EVENT_TYPES]
}

beforeEach(() => {
  window.commentViewerAPI = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    onStateChange: vi.fn().mockReturnValue(() => {}),
    onCommentEvent: vi.fn().mockReturnValue(() => {}),
    getOverlayUrl: vi.fn().mockReturnValue('http://localhost:3939'),
    getPlugins: vi.fn().mockResolvedValue([]),
    getPluginPreferences: vi.fn().mockResolvedValue(defaultPreferences),
    setPluginPreferences: vi.fn().mockResolvedValue(undefined)
  } as any
})

describe('PluginHost', () => {
  it('プラグイン未選択時にメッセージを表示する', () => {
    render(<PluginHost activePluginId={null} preferences={defaultPreferences} />)
    expect(screen.getByText('レンダラープラグインが選択されていません')).toBeInTheDocument()
  })

  it('ビルトインプラグイン選択時にコメントイベントを購読する', () => {
    render(
      <PluginHost
        activePluginId="md3-comment-list"
        preferences={{ ...defaultPreferences, activeRendererPlugin: 'md3-comment-list' }}
      />
    )
    expect(window.commentViewerAPI.onCommentEvent).toHaveBeenCalled()
  })

  it('プラグイン切替時にコンテナをリセットする', () => {
    const { rerender } = render(
      <PluginHost activePluginId="md3-comment-list" preferences={defaultPreferences} />
    )
    rerender(<PluginHost activePluginId={null} preferences={defaultPreferences} />)
    expect(screen.getByText('レンダラープラグインが選択されていません')).toBeInTheDocument()
  })
})
