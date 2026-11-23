import { describe, it, expect } from 'vitest'
import { parseEvents, serializeEvents } from './eventFilter'
import { ALL_EVENT_TYPES } from './types'

describe('eventFilter', () => {
  it('未指定・不正値はすべて表示', () => {
    for (const value of [null, undefined, '', 'bogus']) expect(parseEvents(value)).toEqual(ALL_EVENT_TYPES)
    expect(parseEvents('gift,bogus')).toEqual(['gift'])
  })

  it('全選択・一部・0 件を往復できる', () => {
    expect(serializeEvents([...ALL_EVENT_TYPES])).toBe('')
    expect(serializeEvents(['gift', 'comment'])).toBe('comment,gift')
    expect(serializeEvents([])).toBe('none')
    for (const events of [[...ALL_EVENT_TYPES], ['comment' as const], []]) {
      expect(parseEvents(serializeEvents(events))).toEqual(events)
    }
  })
})
