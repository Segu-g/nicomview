import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerSelect } from './SpeakerSelect'
import { TtsEventFields } from './TtsEventFields'
import { TtsParamFields } from './TtsParamFields'
import type { TtsAdapterParamDef } from '../types'

const options = [{ value: 0, label: 'A' }, { value: 3, label: 'B' }]

describe('SpeakerSelect', () => {
  it('ID 0 を含む選択肢を数値で通知する', async () => {
    const onChange = vi.fn()
    render(<SpeakerSelect label="話者" value={3} options={options} onChange={onChange} />)
    await userEvent.click(screen.getByRole('combobox', { name: /話者/ }))
    await userEvent.click(screen.getByRole('option', { name: 'A' }))
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('一覧にない保存値を失わない', () => {
    render(<SpeakerSelect label="話者" value={99} options={options} onChange={vi.fn()} />)
    expect(screen.getByText('ID: 99')).toBeInTheDocument()
  })

  it('未選択を表示する', () => {
    render(<SpeakerSelect label="話者" value="" options={options} emptyLabel="デフォルト" onChange={vi.fn()} />)
    expect(screen.getByText('デフォルト')).toBeInTheDocument()
  })
})

describe('TtsParamFields', () => {
  it('任意のキーで動作し、取得できないときは再取得できる', async () => {
    const params: TtsAdapterParamDef[] = [
      { key: 'voicevoxHost', label: 'API ホスト', type: 'string', defaultValue: '' },
      { key: 'speaker', label: 'キャラクター', type: 'select', defaultValue: 0, options: [] }
    ]
    const onChange = vi.fn()
    const onRefresh = vi.fn()
    render(<TtsParamFields params={params} values={{ voicevoxHost: 'x', speaker: 5 }} onChange={onChange} onRefresh={onRefresh} />)
    await userEvent.type(screen.getByLabelText('API ホスト'), 'y')
    expect(onChange).toHaveBeenCalledWith(params[0], 'xy')
    expect(screen.getByText(/ID: 5/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '再取得' }))
    expect(onRefresh).toHaveBeenCalled()
  })
})

describe('TtsEventFields', () => {
  const props = {
    enabledEvents: ['comment' as const],
    onEnabledEventsChange: vi.fn(),
    templates: {},
    onTemplateChange: vi.fn(),
    speakerOverrides: { comment: 3 },
    onSpeakerOverrideChange: vi.fn(),
    speakerOptions: options,
    speakerLabel: '話者',
  }

  it('選択中のイベントだけにテンプレートと話者を出し、空欄には既定の文面を薄く出す', () => {
    render(<TtsEventFields {...props} templatePlaceholders={{ comment: '{content}' }} />)
    expect(screen.getByLabelText('コメントテンプレート')).toHaveAttribute('placeholder', '{content}')
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.queryByLabelText('ギフトテンプレート')).toBeNull()
  })

  it('イベントの追加と、話者を既定に戻す操作を通知する', async () => {
    const onEnabledEventsChange = vi.fn()
    const onSpeakerOverrideChange = vi.fn()
    render(<TtsEventFields {...props} onEnabledEventsChange={onEnabledEventsChange} onSpeakerOverrideChange={onSpeakerOverrideChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'ギフト' }))
    expect(onEnabledEventsChange).toHaveBeenCalledWith(['comment', 'gift'])
    await userEvent.click(screen.getByRole('combobox', { name: /コメント話者/ }))
    await userEvent.click(screen.getByRole('option', { name: 'デフォルト' }))
    expect(onSpeakerOverrideChange).toHaveBeenCalledWith('comment', '')
  })

  it('話者の選択肢がなければ話者欄を出さない', () => {
    render(<TtsEventFields {...props} speakerOptions={[]} />)
    expect(screen.queryByText('コメント話者')).toBeNull()
  })
})
