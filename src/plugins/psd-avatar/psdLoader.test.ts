import { describe, it, expect } from 'vitest'
import { parseName } from './psdLoader'

describe('parseName', () => {
  it.each([
    ['通常', '通常', '通常', false, false, false, false],
    ['!固定', '固定', '固定', true, false, false, false],
    ['*選択', '選択', '選択', false, true, false, false],
    ['*腕:flipx', '腕', '腕:flipx', false, true, true, false],
    ['腕:flipy', '腕', '腕:flipy', false, false, false, true],
    ['腕:flipxy', '腕', '腕:flipxy', false, false, true, true],
  ])('%s', (raw, name, pathName, forceVisible, isRadio, flipX, flipY) => {
    expect(parseName(raw)).toEqual({ name, pathName, forceVisible, isRadio, flipX, flipY })
  })
})
