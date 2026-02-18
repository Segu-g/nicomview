import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import type { CommentEvent, NicomViewPluginAPI } from '../../../../shared/types'
import { ALL_EVENT_TYPES } from '../../../../shared/types'
import pluginExports from './renderer'

let container: HTMLDivElement
let api: NicomViewPluginAPI
let subscribers: Set<(event: CommentEvent) => void>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  subscribers = new Set()
  api = {
    subscribe(callback) {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },
    getConfig() {
      return { enabledEvents: [...ALL_EVENT_TYPES] }
    }
  }
})

afterEach(() => {
  act(() => {
    pluginExports.unmount()
  })
  container.remove()
})

function emitEvent(event: CommentEvent) {
  act(() => {
    for (const cb of subscribers) {
      cb(event)
    }
  })
}

describe('md3-comment-list plugin', () => {
  it('mount でコンテナにコンポーネントをレンダリングする', () => {
    act(() => {
      pluginExports.mount(container, api)
    })
    expect(container.querySelector('ul')).not.toBeNull()
  })

  it('unmount でコンテナをクリーンアップする', () => {
    act(() => {
      pluginExports.mount(container, api)
    })
    act(() => {
      pluginExports.unmount()
    })
    expect(container.innerHTML).toBe('')
  })

  it('コメントイベントを表示する', () => {
    act(() => {
      pluginExports.mount(container, api)
    })

    emitEvent({
      type: 'comment',
      data: { content: 'テストコメント', userName: 'ユーザー1' },
      timestamp: Date.now()
    })

    expect(container.textContent).toContain('テストコメント')
    expect(container.textContent).toContain('ユーザー1')
  })

  it('ギフトイベントをアイコン付きで表示する', () => {
    act(() => {
      pluginExports.mount(container, api)
    })

    emitEvent({
      type: 'gift',
      data: { itemName: 'スター', point: 500, userName: '送り主' },
      timestamp: Date.now()
    })

    expect(container.textContent).toContain('送り主')
    expect(container.textContent).toContain('スター')
    expect(container.textContent).toContain('500pt')
  })

  it('通知イベントを表示する', () => {
    act(() => {
      pluginExports.mount(container, api)
    })

    emitEvent({
      type: 'notification',
      data: { message: 'お知らせテスト' },
      timestamp: Date.now()
    })

    expect(container.textContent).toContain('お知らせテスト')
  })

  it('運営コメントをハイライト表示する', () => {
    act(() => {
      pluginExports.mount(container, api)
    })

    emitEvent({
      type: 'operatorComment',
      data: { content: '運営からのメッセージ' },
      timestamp: Date.now()
    })

    expect(container.textContent).toContain('運営からのメッセージ')
  })

  it('エモーションイベントを表示する', () => {
    act(() => {
      pluginExports.mount(container, api)
    })

    emitEvent({
      type: 'emotion',
      data: { id: 'emo1', content: '笑い' },
      timestamp: Date.now()
    })

    expect(container.textContent).toContain('笑い')
  })

  it('200件を超えるコメントは古いものから削除する', () => {
    act(() => {
      pluginExports.mount(container, api)
    })

    for (let i = 0; i < 210; i++) {
      emitEvent({
        type: 'comment',
        data: { content: `コメント${i}`, userName: `user${i}` },
        timestamp: Date.now()
      })
    }

    // First 10 should be removed (use userName which is unique: user0, user1, ...)
    // "user0" won't match user10, user100, etc. because it's followed by "コメント"
    expect(container.textContent).not.toContain('user0コメント0')
    expect(container.textContent).not.toContain('user9コメント9')
    // Later comments should exist
    expect(container.textContent).toContain('コメント209')
    expect(container.textContent).toContain('user10')
  })
})
