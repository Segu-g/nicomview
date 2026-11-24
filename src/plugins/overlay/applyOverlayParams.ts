import { EVENTS_KEY, parseEvents } from '../../shared/eventFilter'
import type { CommentEventType } from '../../shared/types'

/** コメント表示系オーバーレイ共通の URL パラメーターを反映する */
export function applyOverlayParams(params: URLSearchParams): { enabledEvents: CommentEventType[] } {
  const root = document.documentElement
  const fontSize = params.get('fontSize')
  if (fontSize) root.style.setProperty('--font-size', fontSize + 'px')
  for (const key of ['theme', 'direction']) {
    const value = params.get(key)
    if (value) root.dataset[key] = value
  }
  return { enabledEvents: parseEvents(params.get(EVENTS_KEY)) }
}
