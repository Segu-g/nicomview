import type { CommentEventType } from '../types'

export function formatTtsText(
  template: string,
  data: Record<string, unknown>
): string | null {
  const result = template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = data[key]
    return value != null ? String(value) : ''
  })

  // All placeholders resolved to empty → treat as nothing to say
  if (!result.trim()) return null

  return result
}

/** テンプレートで使えるプレースホルダー（画面の案内用） */
export const TEMPLATE_PLACEHOLDERS: Record<CommentEventType, string> = {
  comment: '{userName}, {content}',
  gift: '{userName}, {itemName}, {point}',
  emotion: '{content}',
  notification: '{message}',
  operatorComment: '{content}, {name}'
}
