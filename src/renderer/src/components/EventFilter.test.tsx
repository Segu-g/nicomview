import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EventFilter from './EventFilter'
import type { PluginPreferences } from '../../../shared/types'
import { ALL_EVENT_TYPES } from '../../../shared/types'

const defaultPreferences: PluginPreferences = {
  activeRendererPlugin: 'md3-comment-list',
  activeOverlayPlugin: 'nico-scroll',
  enabledEvents: [...ALL_EVENT_TYPES]
}

describe('EventFilter', () => {
  it('5つのイベントタイプのチェックボックスを表示する', () => {
    render(<EventFilter preferences={defaultPreferences} onPreferencesChange={vi.fn()} />)

    expect(screen.getByLabelText('コメント')).toBeInTheDocument()
    expect(screen.getByLabelText('ギフト')).toBeInTheDocument()
    expect(screen.getByLabelText('エモーション')).toBeInTheDocument()
    expect(screen.getByLabelText('通知')).toBeInTheDocument()
    expect(screen.getByLabelText('運営コメント')).toBeInTheDocument()
  })

  it('全てのチェックボックスが初期状態でチェック済み', () => {
    render(<EventFilter preferences={defaultPreferences} onPreferencesChange={vi.fn()} />)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(5)
    checkboxes.forEach((cb) => {
      expect(cb).toBeChecked()
    })
  })

  it('チェックを外すとイベントタイプが除外される', async () => {
    const onChange = vi.fn()
    render(<EventFilter preferences={defaultPreferences} onPreferencesChange={onChange} />)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('ギフト'))

    expect(onChange).toHaveBeenCalledWith({
      enabledEvents: ['comment', 'emotion', 'notification', 'operatorComment']
    })
  })

  it('チェックを入れるとイベントタイプが追加される', async () => {
    const onChange = vi.fn()
    const prefs: PluginPreferences = {
      ...defaultPreferences,
      enabledEvents: ['comment', 'notification']
    }
    render(<EventFilter preferences={prefs} onPreferencesChange={onChange} />)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('ギフト'))

    expect(onChange).toHaveBeenCalledWith({
      enabledEvents: ['comment', 'notification', 'gift']
    })
  })
})
