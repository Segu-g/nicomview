import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceSettings } from './VoiceSettings'
import { DEFAULTS } from '../config'

afterEach(() => vi.unstubAllGlobals())

const speakers = (name: string) => ({ ok: true, json: async () => [{ name, styles: [{ id: 3, name: 'n' }] }] })

describe('VoiceSettings', () => {
  it('既存の設定キーで話者を保存し、接続先の変更で取り直す', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => speakers(url.startsWith('http://b') ? 'B' : 'A')))
    const onChange = vi.fn()
    const { rerender } = render(<VoiceSettings settings={DEFAULTS} onChange={onChange} />)

    await userEvent.click(await screen.findByRole('combobox', { name: 'キャラクター' }))
    await userEvent.click(screen.getByRole('option', { name: 'A (n)' }))
    expect(onChange).toHaveBeenCalledWith('speaker', 3)

    rerender(<VoiceSettings settings={{ ...DEFAULTS, speaker: 3, voicevoxHost: 'http://b:1' }} onChange={onChange} />)
    await waitFor(() => expect(screen.getByText('B (n)')).toBeInTheDocument(), { timeout: 2000 })
  })

  it('古い接続先の遅い応答を反映しない', async () => {
    let resolveOld = (_: unknown): void => {}
    vi.stubGlobal('fetch', vi.fn((url: string) =>
      url.startsWith('http://b') ? Promise.resolve(speakers('B')) : new Promise((r) => { resolveOld = r })))
    const { rerender } = render(<VoiceSettings settings={{ ...DEFAULTS, speaker: 3 }} onChange={vi.fn()} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    rerender(<VoiceSettings settings={{ ...DEFAULTS, speaker: 3, voicevoxHost: 'http://b:1' }} onChange={vi.fn()} />)
    resolveOld(speakers('A'))
    await waitFor(() => expect(screen.getByText('B (n)')).toBeInTheDocument(), { timeout: 2000 })
    expect(screen.queryByText('A (n)')).toBeNull()
  })

  it('読み上げイベントとイベント別の話者を、既存の設定と別のキーで保存する', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => speakers('A')))
    const onChange = vi.fn()
    render(<VoiceSettings settings={DEFAULTS} onChange={onChange} />)
    // 話者一覧を取得できると、イベント別の話者欄が出る
    const commentSpeaker = await screen.findByRole('combobox', { name: 'コメントキャラクター' })

    // 既定はコメントのみ。既定の文面は値ではなく薄い表示
    expect(screen.getByRole('checkbox', { name: 'コメント' })).toBeChecked()
    expect(screen.getByLabelText('コメントテンプレート')).toHaveValue('')

    await userEvent.click(screen.getByRole('checkbox', { name: 'ギフト' }))
    expect(onChange).toHaveBeenLastCalledWith('ttsEvents', 'comment,gift')
    await userEvent.click(screen.getByRole('checkbox', { name: 'コメント' }))
    expect(onChange).toHaveBeenLastCalledWith('ttsEvents', 'none')

    await userEvent.click(commentSpeaker)
    await userEvent.click(screen.getByRole('option', { name: 'A (n)' }))
    expect(onChange).toHaveBeenLastCalledWith('commentSpeaker', 3)
  })
})
