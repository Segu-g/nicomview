import { useCallback } from 'react'
import type { CommentEventType } from '../../shared/types'
import { WS_URL } from '../../shared/constants'
import { useWebSocket } from './useWebSocket'

// --- Event data types ---

export interface CommentData {
  content?: string
  userName?: string
  userId?: string
  userIcon?: string
  isHistory?: boolean
}

export interface GiftData {
  userName?: string
  userIcon?: string
  itemName?: string
  point?: number
  isHistory?: boolean
}

export interface NotificationData {
  message?: string
  isHistory?: boolean
}

export interface OperatorCommentData {
  content?: string
  name?: string
  iconUrl?: string
  isHistory?: boolean
}

export interface EmotionData {
  content?: string
  id?: string
  isHistory?: boolean
}

// --- Handler map type ---

export interface CommentEventHandlers {
  onComment?: (data: CommentData) => void
  onGift?: (data: GiftData) => void
  onNotification?: (data: NotificationData) => void
  onOperatorComment?: (data: OperatorCommentData) => void
  onEmotion?: (data: EmotionData) => void
  onClear?: () => void
}

const EVENT_TO_HANDLER: Record<CommentEventType, keyof CommentEventHandlers> = {
  comment: 'onComment',
  gift: 'onGift',
  notification: 'onNotification',
  operatorComment: 'onOperatorComment',
  emotion: 'onEmotion',
}

/** すべてのイベントを 1 つの関数で受け取るハンドラーを作る */
export function eventHandlers(handle: (eventType: CommentEventType, data: unknown) => void): CommentEventHandlers {
  return Object.fromEntries(
    Object.entries(EVENT_TO_HANDLER).map(([eventType, key]) => [key, (data: unknown) => handle(eventType as CommentEventType, data)]),
  ) as CommentEventHandlers
}

export function useCommentEvents(
  handlers: CommentEventHandlers,
  /** 受け取るイベント。未指定ならすべて */
  enabledEvents?: CommentEventType[],
): void {
  const handleMessage = useCallback(
    (event: string, data: unknown) => {
      if (event === 'clear') {
        handlers.onClear?.()
        return
      }
      if (enabledEvents && !enabledEvents.includes(event as CommentEventType)) return
      const handlerKey = EVENT_TO_HANDLER[event as CommentEventType]
      if (!handlerKey) return
      const handler = handlers[handlerKey] as ((data: unknown) => void) | undefined
      handler?.(data)
    },
    [handlers.onComment, handlers.onGift, handlers.onNotification, handlers.onOperatorComment, handlers.onEmotion, handlers.onClear, enabledEvents],
  )

  useWebSocket(WS_URL, handleMessage)
}
