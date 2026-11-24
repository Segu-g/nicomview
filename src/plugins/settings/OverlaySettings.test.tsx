import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverlaySettings } from './OverlaySettings'

const DEFAULTS = { fontSize: 28, theme: 'dark', direction: 'bottom' }
let post: ReturnType<typeof vi.spyOn>

beforeEach(() => { post = vi.spyOn(window, 'postMessage').mockImplementation(() => {}) })
afterEach(() => vi.restoreAllMocks())

function setup(settings: Record<string, string | number>) {
  render(<OverlaySettings pluginId="p" defaults={DEFAULTS} />)
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'nicomview:settings-init', settings } }))
  })
}

describe('OverlaySettings', () => {
  it('準備完了を通知し、保存値を復元する', () => {
    setup({ fontSize: 20, events: 'gift' })
    expect(post).toHaveBeenCalledWith({ type: 'nicomview:ready', pluginId: 'p' }, '*')
    expect(screen.getByLabelText('フォントサイズ (px)')).toHaveValue(20)
    expect(screen.getByLabelText('ギフト')).toBeChecked()
    expect(screen.getByLabelText('通知')).not.toBeChecked()
  })

  it('連続した変更で他の項目を失わない', async () => {
    setup({ fontSize: 20 })
    await userEvent.selectOptions(screen.getByLabelText('テーマ'), 'light')
    await userEvent.click(screen.getByLabelText('通知'))
    expect(post).toHaveBeenLastCalledWith({
      type: 'nicomview:settings-update', pluginId: 'p',
      settings: { fontSize: 20, theme: 'light', direction: 'bottom', events: 'comment,gift,emotion,operatorComment' }
    }, '*')
  })

  it('すべて外した状態を保存できる', async () => {
    setup({ events: 'gift' })
    await userEvent.click(screen.getByLabelText('ギフト'))
    expect(post).toHaveBeenLastCalledWith(expect.objectContaining({ settings: expect.objectContaining({ events: 'none' }) }), '*')
  })

  it('数値を空欄にすると未指定になる', async () => {
    setup({})
    await userEvent.clear(screen.getByLabelText('フォントサイズ (px)'))
    expect(post).toHaveBeenLastCalledWith(expect.objectContaining({ settings: expect.objectContaining({ fontSize: '' }) }), '*')
  })
})
