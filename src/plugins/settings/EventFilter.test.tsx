import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventFilter } from './EventFilter'

describe('EventFilter', () => {
  it('選択中のイベントだけチェックされる', () => {
    render(<EventFilter value={['comment', 'gift']} onChange={vi.fn()} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(5)
    expect(screen.getByLabelText('ギフト')).toBeChecked()
    expect(screen.getByLabelText('通知')).not.toBeChecked()
  })

  it('追加と除外を通知する', async () => {
    const onChange = vi.fn()
    render(<EventFilter value={['comment', 'gift']} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('通知'))
    expect(onChange).toHaveBeenLastCalledWith(['comment', 'gift', 'notification'])
    await userEvent.click(screen.getByLabelText('ギフト'))
    expect(onChange).toHaveBeenLastCalledWith(['comment'])
  })
})
