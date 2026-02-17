import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

declare global {
  interface Window {
    commentViewerAPI: {
      connect: ReturnType<typeof vi.fn>
      disconnect: ReturnType<typeof vi.fn>
      onStateChange: ReturnType<typeof vi.fn>
      getOverlayUrl: ReturnType<typeof vi.fn>
    }
  }
}

let stateChangeCallback: ((state: ConnectionState) => void) | null = null

beforeEach(() => {
  stateChangeCallback = null
  window.commentViewerAPI = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    onStateChange: vi.fn().mockImplementation((cb: (state: ConnectionState) => void) => {
      stateChangeCallback = cb
      return () => {
        stateChangeCallback = null
      }
    }),
    getOverlayUrl: vi.fn().mockReturnValue('http://localhost:3939')
  }
})

describe('App', () => {
  describe('初期状態', () => {
    it('接続ボタンが表示されている', () => {
      render(<App />)
      expect(screen.getByRole('button', { name: '接続' })).toBeInTheDocument()
    })

    it('放送ID入力フィールドが空である', () => {
      render(<App />)
      expect(screen.getByPlaceholderText('lv123456789')).toHaveValue('')
    })

    it('OBS用URLはまだ表示されていない（未接続時）', () => {
      render(<App />)
      expect(screen.queryByText('http://localhost:3939')).not.toBeInTheDocument()
    })
  })

  describe('接続操作', () => {
    it('放送IDを入力して接続ボタンを押すと connect が呼ばれる', async () => {
      render(<App />)
      const user = userEvent.setup()
      await user.type(screen.getByPlaceholderText('lv123456789'), 'lv123456789')
      await user.click(screen.getByRole('button', { name: '接続' }))
      expect(window.commentViewerAPI.connect).toHaveBeenCalledWith('lv123456789', undefined)
    })

    it('放送IDが空のとき接続ボタンを押してもconnectが呼ばれない', async () => {
      render(<App />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '接続' }))
      expect(window.commentViewerAPI.connect).not.toHaveBeenCalled()
    })
  })

  describe('接続状態の表示', () => {
    it('connected になるとOBS用URLが表示される', async () => {
      render(<App />)
      await act(() => {
        stateChangeCallback?.('connected')
      })
      expect(screen.getByText('http://localhost:3939')).toBeInTheDocument()
    })

    it('error になるとエラーメッセージが表示される', async () => {
      render(<App />)
      await act(() => {
        stateChangeCallback?.('error')
      })
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('connecting 中は接続ボタンが無効になる', async () => {
      render(<App />)
      await act(() => {
        stateChangeCallback?.('connecting')
      })
      expect(screen.getByRole('button', { name: /接続/ })).toBeDisabled()
    })

    it('connected 状態で切断ボタンが表示される', async () => {
      render(<App />)
      await act(() => {
        stateChangeCallback?.('connected')
      })
      expect(screen.getByRole('button', { name: '切断' })).toBeInTheDocument()
    })

    it('切断ボタンを押すと disconnect が呼ばれる', async () => {
      render(<App />)
      const user = userEvent.setup()
      await act(() => {
        stateChangeCallback?.('connected')
      })
      await user.click(screen.getByRole('button', { name: '切断' }))
      expect(window.commentViewerAPI.disconnect).toHaveBeenCalled()
    })
  })
})
