import { ALL_EVENT_TYPES, isValidEventType, type CommentEventType } from './types'

/** プラグイン設定・オーバーレイ URL のキー */
export const EVENTS_KEY = 'events'

/** 空の値は URL に載らないため、「1 つも表示しない」を表す値 */
const NONE = 'none'

/** 未指定・解釈できない値はすべて表示とみなす */
export function parseEvents(value: unknown): CommentEventType[] {
  if (value === NONE) return []
  const events = typeof value === 'string' ? value.split(',').filter(isValidEventType) : []
  return events.length > 0 ? events : [...ALL_EVENT_TYPES]
}

/** すべて選択時は空文字（URL に載せない）。将来増えたイベントも表示対象になる */
export function serializeEvents(events: CommentEventType[]): string {
  const selected = ALL_EVENT_TYPES.filter((type) => events.includes(type))
  if (selected.length === ALL_EVENT_TYPES.length) return ''
  return selected.length === 0 ? NONE : selected.join(',')
}

export function toggleEvent(events: CommentEventType[], type: CommentEventType, enabled: boolean): CommentEventType[] {
  const others = events.filter((t) => t !== type)
  return enabled ? [...others, type] : others
}
