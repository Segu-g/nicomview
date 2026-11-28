import { describe, it, expect } from 'vitest'
import { DEFAULTS, parseConfig, parseLayerPaths, parseLayerVisibility } from './config'
import { pluginOverlayUrl } from '../../shared/constants'
import { DEFAULT_TTS_TEMPLATES } from '../../shared/types'

const parse = (qs: string) => parseConfig(new URLSearchParams(qs))

describe('parseConfig', () => {
  it('未指定・空・不正値は既定値になる', () => {
    expect(parse('')).toEqual({
      psdFile: 'models/default.psd',
      voicevoxHost: 'http://localhost:50021',
      speaker: 0, speed: 1, volume: 1,
      ttsEvents: ['comment'], templates: DEFAULT_TTS_TEMPLATES, speakerOverrides: {},
      mouth: [[], [], [], [], []], eye: [[], [], [], [], []],
      threshold: 0.15, sensitivity: 8, mouthTransitionFrames: 4,
      blinkInterval: 3, blinkSpeed: 6,
      layerVisibility: {}, flipX: false, flipY: false, preview: false,
    })
    expect(parse('volume=&threshold=abc')).toMatchObject({ volume: 1, threshold: 0.15 })
  })

  it('音量0・しきい値0を維持する', () => {
    expect(parse('volume=0&threshold=0')).toMatchObject({ volume: 0, threshold: 0 })
  })

  it('0 を許容しない項目の 0 は既定値になる', () => {
    expect(parse('speed=0&sensitivity=0&mouthTransitionFrames=0&blinkInterval=0&blinkSpeed=0'))
      .toMatchObject({ speed: 1, sensitivity: 8, mouthTransitionFrames: 4, blinkInterval: 3, blinkSpeed: 6 })
  })

  it('既存の OBS URL のキーを解釈する', () => {
    const config = parse('voicevoxHost=http%3A%2F%2F10.0.0.1%3A50021&speaker=3&mouth0=a%2Fb&eye4=%5B%22x%22%2C%22y%22%5D&flipX=1&preview=true')
    expect(config).toMatchObject({ voicevoxHost: 'http://10.0.0.1:50021', speaker: 3, flipX: true, preview: true })
    expect(config.mouth[0]).toEqual(['a/b'])
    expect(config.eye[4]).toEqual(['x', 'y'])
  })

  it('読み上げイベント・テンプレート・イベント別話者を解釈する', () => {
    const config = parse('ttsEvents=comment%2Cgift&commentTemplate=%7BuserName%7D%E3%80%81%7Bcontent%7D&giftSpeaker=8&commentSpeaker=&emotionSpeaker=abc')
    expect(config.ttsEvents).toEqual(['comment', 'gift'])
    expect(config.templates).toEqual({ ...DEFAULT_TTS_TEMPLATES, comment: '{userName}、{content}' })
    expect(config.speakerOverrides).toEqual({ gift: 8 })
    expect(parse('ttsEvents=none').ttsEvents).toEqual([])
  })

  it('設定画面の既定値から生成した URL は既定の構成と一致する', () => {
    const url = new URL(pluginOverlayUrl('psd-avatar', DEFAULTS))
    expect(parseConfig(url.searchParams)).toEqual(parse(''))
  })
})

describe('レイヤー設定のパース', () => {
  it('不正な JSON でも例外にならない', () => {
    expect(parseLayerPaths('[broken')).toEqual(['[broken'])
    expect(parseLayerVisibility('{broken')).toEqual({})
    expect(parseLayerVisibility('[]')).toEqual({})
    expect(parseLayerVisibility('{"a":false}')).toEqual({ a: false })
  })
})
