import { beforeEach, describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCommentEvents } from './useCommentEvents'

let emit: (event: string, data: unknown) => void
vi.mock('./useWebSocket', () => ({
  useWebSocket: (_url: string, handler: typeof emit) => { emit = handler }
}))

describe('useCommentEvents', () => {
  const handlers = { onComment: vi.fn(), onGift: vi.fn(), onClear: vi.fn() }
  beforeEach(() => vi.clearAllMocks())

  it('指定したイベントだけを渡し、clear は常に渡す', () => {
    renderHook(() => useCommentEvents(handlers, ['gift']))
    emit('comment', { isHistory: true })
    emit('gift', {})
    emit('clear', {})
    expect(handlers.onComment).not.toHaveBeenCalled()
    expect(handlers.onGift).toHaveBeenCalledOnce()
    expect(handlers.onClear).toHaveBeenCalledOnce()
  })

  it('未指定ならすべて渡す', () => {
    renderHook(() => useCommentEvents(handlers))
    emit('comment', {})
    expect(handlers.onComment).toHaveBeenCalledOnce()
  })
})
