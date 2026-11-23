import { afterEach, describe, it, expect, vi } from 'vitest'
import { fetchSpeakerOptions, synthesize } from './voicevox'

afterEach(() => vi.unstubAllGlobals())

describe('voicevoxClient', () => {
  it('話者・速度・音量を反映して合成する', async () => {
    const wav = new ArrayBuffer(4)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accent: 1 }) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => wav })
    vi.stubGlobal('fetch', fetchMock)

    expect(await synthesize('あ', 3, 1.2, 0, 'http://h:1')).toBe(wav)
    expect(fetchMock.mock.calls[0][0]).toBe('http://h:1/audio_query?text=%E3%81%82&speaker=3')
    expect(fetchMock.mock.calls[1][0]).toBe('http://h:1/synthesis?speaker=3')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ accent: 1, speedScale: 1.2, volumeScale: 0 })
  })

  it('話者とスタイルを選択肢に展開する', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => [{ name: 'A', styles: [{ id: 1, name: 'x' }, { id: 2, name: 'y' }] }]
    })
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchSpeakerOptions('https://h')).toEqual([{ value: 1, label: 'A (x)' }, { value: 2, label: 'A (y)' }])
    expect(fetchMock.mock.calls[0][0]).toBe('https://h/speakers')
  })

  it('HTTP エラーを通知する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchSpeakerOptions('http://h:1')).rejects.toThrow('speakers failed: 500')
    await expect(synthesize('a', 0, 1, 1, 'http://h:1')).rejects.toThrow('audio_query failed: 500')
  })
})
