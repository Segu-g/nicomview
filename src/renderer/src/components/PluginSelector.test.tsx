import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PluginSelector from './PluginSelector'
import type { PluginDescriptor, PluginPreferences } from '../../../shared/types'
import { ALL_EVENT_TYPES } from '../../../shared/types'

const mockPlugins: PluginDescriptor[] = [
  {
    id: 'md3-comment-list',
    name: 'MD3 コメントリスト',
    version: '1.0.0',
    renderer: true,
    overlay: false,
    builtIn: true,
    basePath: '/plugins/md3-comment-list'
  },
  {
    id: 'nico-scroll',
    name: 'ニコニコ風スクロール',
    version: '1.0.0',
    renderer: false,
    overlay: true,
    builtIn: true,
    basePath: '/plugins/nico-scroll'
  }
]

const defaultPreferences: PluginPreferences = {
  activeRendererPlugin: 'md3-comment-list',
  activeOverlayPlugin: 'nico-scroll',
  enabledEvents: [...ALL_EVENT_TYPES]
}

describe('PluginSelector', () => {
  it('レンダラーとオーバーレイの選択UIを表示する', () => {
    render(
      <PluginSelector
        plugins={mockPlugins}
        preferences={defaultPreferences}
        onPreferencesChange={vi.fn()}
      />
    )

    // MUI Select renders as combobox roles
    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes).toHaveLength(2)
  })

  it('選択済みのプラグイン名が表示される', () => {
    render(
      <PluginSelector
        plugins={mockPlugins}
        preferences={defaultPreferences}
        onPreferencesChange={vi.fn()}
      />
    )

    expect(screen.getByText('MD3 コメントリスト')).toBeInTheDocument()
    expect(screen.getByText('ニコニコ風スクロール')).toBeInTheDocument()
  })

  it('レンダラープラグイン変更時にコールバックが呼ばれる', async () => {
    const onChange = vi.fn()
    render(
      <PluginSelector
        plugins={mockPlugins}
        preferences={defaultPreferences}
        onPreferencesChange={onChange}
      />
    )

    const user = userEvent.setup()
    const comboboxes = screen.getAllByRole('combobox')
    await user.click(comboboxes[0])

    const listbox = within(screen.getByRole('listbox'))
    await user.click(listbox.getByText('なし'))

    expect(onChange).toHaveBeenCalledWith({ activeRendererPlugin: null })
  })
})
