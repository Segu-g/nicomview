import { describe, it, expect, vi } from 'vitest'

vi.mock('../../shared/tts/voicevox', () => ({
  synthesize: vi.fn().mockRejectedValue(new Error('再生はしない')),
}))
import { synthesize } from '../../shared/tts/voicevox'
import { TtsQueue } from './ttsQueue'

describe('TtsQueue', () => {
  it('話者の指定がない項目は既定の話者で合成する', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const queue = new TtsQueue({
      host: 'http://h', speaker: 1, speed: 1, volume: 1,
      threshold: 0, sensitivity: 1, mouthTransitionFrames: 1, onLipLevel: () => {},
    })
    queue.enqueue('既定', undefined)
    queue.enqueue('上書き', 0)
    await vi.waitFor(() => expect(synthesize).toHaveBeenCalledTimes(2))
    expect(vi.mocked(synthesize).mock.calls.map((c) => [c[0], c[1]])).toEqual([['既定', 1], ['上書き', 0]])
  })
})
