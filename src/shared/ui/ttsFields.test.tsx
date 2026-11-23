import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerSelect } from './SpeakerSelect'
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
