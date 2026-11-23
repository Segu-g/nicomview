import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ConnectionState, CommentViewerAPI } from '../../shared/types'
import { DEFAULT_TTS_TEMPLATES } from '../../shared/types'
import App from './App'

let stateChangeCallback: ((state: ConnectionState) => void) | null = null

beforeEach(() => {
  stateChangeCallback = null
  window.commentViewerAPI = {
    connect: vi.fn<CommentViewerAPI['connect']>().mockResolvedValue(undefined),
    disconnect: vi.fn<CommentViewerAPI['disconnect']>().mockResolvedValue(undefined),
    onStateChange: vi.fn<CommentViewerAPI['onStateChange']>().mockImplementation((cb) => {
      stateChangeCallback = cb
      return () => {
        stateChangeCallback = null
      }
    }),
    getPlugins: vi.fn<CommentViewerAPI['getPlugins']>().mockResolvedValue([
      {
        id: 'comment-list',
        name: 'コメントリスト',
        version: '1.0.0',
        overlay: true,
        builtIn: true,
        basePath: '/plugins/comment-list',
        settings: true
      },
      {
        id: 'comment-cards',
        name: '通知カード',
        version: '1.0.0',
        overlay: true,
        builtIn: true,
        basePath: '/plugins/comment-cards',
        settings: true
      }
    ]),
    getPluginSettings: vi.fn<CommentViewerAPI['getPluginSettings']>().mockResolvedValue({}),
    setPluginSettings: vi.fn<CommentViewerAPI['setPluginSettings']>().mockResolvedValue(undefined),
    getTtsSettings: vi.fn<CommentViewerAPI['getTtsSettings']>().mockResolvedValue({
      enabled: false,
      adapterId: '',
      enabledEvents: ['comment', 'gift', 'emotion', 'notification', 'operatorComment'],
      speed: 1,
      volume: 1,
      adapterSettings: {},
      formatTemplates: { ...DEFAULT_TTS_TEMPLATES },
      speakerOverrides: {}
    }),
    setTtsSettings: vi.fn<CommentViewerAPI['setTtsSettings']>().mockResolvedValue(undefined),
    getTtsAdapters: vi.fn<CommentViewerAPI['getTtsAdapters']>().mockResolvedValue([
      { id: 'voicevox', name: 'VOICEVOX', defaultSettings: { host: 'localhost', port: 50021, speakerId: 0 } }
    ]),
    getTtsAdapterParams: vi.fn<CommentViewerAPI['getTtsAdapterParams']>().mockResolvedValue([]),
    openPluginFolder: vi.fn<CommentViewerAPI['openPluginFolder']>().mockResolvedValue(undefined)
  }
})

describe('App', () => {
  describe('初期状態', () => {
    it('接続ボタンが表示されている', async () => {
      render(<App />)
      await screen.findByText('コメントリスト')
      expect(screen.getByRole('button', { name: '接続' })).toBeInTheDocument()
    })

    it('放送ID入力フィールドが空である', async () => {
      render(<App />)
      await screen.findByText('コメントリスト')
      expect(screen.getByPlaceholderText('lv123456789')).toHaveValue('')
    })

    it('表示プラグインセクションが表示されている', async () => {
      render(<App />)
      await screen.findByText('コメントリスト')
      expect(screen.getByText('表示プラグイン')).toBeInTheDocument()
    })

    it('プラグインURLがロード後に表示される', async () => {
      render(<App />)
      expect(
        await screen.findByText('http://localhost:3939/plugins/comment-list/overlay/')
      ).toBeInTheDocument()
      expect(
        screen.getByText('http://localhost:3939/plugins/comment-cards/overlay/')
      ).toBeInTheDocument()
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

  describe('プラグイン設定', () => {
    it('設定ボタンが表示される', async () => {
      render(<App />)
      await screen.findByText('コメントリスト')
      expect(screen.getByTestId('settings-toggle-comment-list')).toBeInTheDocument()
      expect(screen.getByTestId('settings-toggle-comment-cards')).toBeInTheDocument()
    })

    it('設定ボタンをクリックするとiframeが表示される', async () => {
      render(<App />)
      const user = userEvent.setup()
      await screen.findByText('コメントリスト')
      await user.click(screen.getByTestId('settings-toggle-comment-list'))
      expect(screen.getByTestId('settings-iframe-comment-list')).toBeInTheDocument()
    })

    it('settings:falseのプラグインには設定ボタンが表示されない', async () => {
      window.commentViewerAPI.getPlugins = vi.fn().mockResolvedValue([
        {
          id: 'no-settings',
          name: 'No Settings Plugin',
          version: '1.0.0',
          overlay: true,
          builtIn: true,
          basePath: '/plugins/no-settings'
        }
      ])
      render(<App />)
      await screen.findByText('No Settings Plugin')
      expect(screen.queryByTestId('settings-toggle-no-settings')).not.toBeInTheDocument()
    })

    it('postMessageでsettings-updateを受信するとURLが更新される', async () => {
      render(<App />)
      await screen.findByText('コメントリスト')

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'nicomview:settings-update',
              pluginId: 'comment-list',
              settings: { fontSize: 32, theme: 'light' }
            }
          })
        )
      })

      expect(
        screen.getByText('http://localhost:3939/plugins/comment-list/overlay/?fontSize=32&theme=light')
      ).toBeInTheDocument()
    })

    it('settings-update時にsetPluginSettingsが呼ばれる', async () => {
      render(<App />)
      await screen.findByText('コメントリスト')

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'nicomview:settings-update',
              pluginId: 'comment-list',
              settings: { fontSize: 32 }
            }
          })
        )
      })

      expect(window.commentViewerAPI.setPluginSettings).toHaveBeenCalledWith(
        'comment-list',
        { fontSize: 32 }
      )
    })

    it('起動時にgetPluginSettingsが全プラグインに対して呼ばれる', async () => {
      render(<App />)
      await screen.findByText('コメントリスト')
      expect(window.commentViewerAPI.getPluginSettings).toHaveBeenCalledWith('comment-list')
      expect(window.commentViewerAPI.getPluginSettings).toHaveBeenCalledWith('comment-cards')
    })

    it('保存済み設定がURLに反映される', async () => {
      window.commentViewerAPI.getPluginSettings = vi.fn().mockImplementation((id: string) => {
        if (id === 'comment-list') return Promise.resolve({ fontSize: 24, theme: 'light' })
        return Promise.resolve({})
      })

      render(<App />)
      expect(
        await screen.findByText('http://localhost:3939/plugins/comment-list/overlay/?fontSize=24&theme=light')
      ).toBeInTheDocument()
    })
  })

  describe('読み上げエンジンの切替', () => {
    const voicevoxParams = [
      { key: 'port', label: 'ポート', type: 'number' as const, defaultValue: 50021 },
      { key: 'speakerId', role: 'speaker' as const, label: 'キャラクター', type: 'select' as const, defaultValue: 0, options: [{ value: 0, label: 'A' }] }
    ]
    const bouyomiParams = [
      { key: 'port', label: 'ポート', type: 'number' as const, defaultValue: 50080 },
      { key: 'voice', role: 'speaker' as const, label: '声質', type: 'select' as const, defaultValue: 0, options: [{ value: 1, label: '女性1' }] }
    ]

    it('エンジンごとの値を表示・保存し、role で話者欄を出す', async () => {
      const base = await window.commentViewerAPI.getTtsSettings()
      const api = window.commentViewerAPI
      api.getTtsSettings = vi.fn().mockResolvedValue({
        ...base, adapterId: 'voicevox', adapterSettings: { voicevox: { port: 1234 } }
      })
      api.getTtsAdapters = vi.fn().mockResolvedValue([
        { id: 'voicevox', name: 'VOICEVOX', defaultSettings: {} },
        { id: 'bouyomichan', name: '棒読みちゃん', defaultSettings: {} }
      ])
      api.getTtsAdapterParams = vi.fn(async (id: string) => (id === 'voicevox' ? voicevoxParams : bouyomiParams))

      render(<App />)
      expect(await screen.findByLabelText('ポート')).toHaveValue(1234)
      expect(screen.getByText('コメントキャラクター')).toBeInTheDocument()

      await userEvent.click(screen.getByText('VOICEVOX'))
      await userEvent.click(await screen.findByRole('option', { name: '棒読みちゃん' }))

      expect(await screen.findByText('コメント声質')).toBeInTheDocument()
      const port = screen.getByLabelText('ポート')
      expect(port).toHaveValue(50080)

      await userEvent.type(port, '1')
      expect(api.setTtsSettings).toHaveBeenLastCalledWith({
        adapterSettings: { voicevox: { port: 1234 }, bouyomichan: { port: 500801 } }
      })
    })

    it('切替の保存に失敗したら元のエンジンの項目に戻す', async () => {
      const base = await window.commentViewerAPI.getTtsSettings()
      const api = window.commentViewerAPI
      api.getTtsSettings = vi.fn().mockResolvedValue({ ...base, adapterId: 'voicevox' })
      api.getTtsAdapters = vi.fn().mockResolvedValue([
        { id: 'voicevox', name: 'VOICEVOX', defaultSettings: {} },
        { id: 'bouyomichan', name: '棒読みちゃん', defaultSettings: {} }
      ])
      api.getTtsAdapterParams = vi.fn().mockResolvedValue(voicevoxParams)
      api.setTtsSettings = vi.fn().mockRejectedValue(new Error('fail'))

      render(<App />)
      await screen.findByLabelText('ポート')
      await userEvent.click(screen.getByText('VOICEVOX'))
      await userEvent.click(await screen.findByRole('option', { name: '棒読みちゃん' }))

      expect(await screen.findByText('読み上げ設定の保存に失敗しました')).toBeInTheDocument()
      expect(screen.getByLabelText('ポート')).toHaveValue(50021)
      expect(screen.getByText('コメントキャラクター')).toBeInTheDocument()
    })
  })
})
