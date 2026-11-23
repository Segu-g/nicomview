import { MAX_FRAME } from './config'

const FFT_SIZE = 256
/** getByteTimeDomainData の無音値（8bit の中央） */
const PCM_CENTER = 128

type LipSyncState = 'closed' | 'opening' | 'open' | 'closing'

export class LipSync {
  private analyser: AnalyserNode
  private dataArray: Uint8Array<ArrayBuffer>
  private threshold: number
  private holdFrames: number
  private step: number
  private animId: number | null = null
  private _level = 0
  private state: LipSyncState = 'closed'
  private silentCount = 0

  constructor(
    audioContext: AudioContext,
    source: AudioNode,
    opts: { threshold: number; holdFrames: number; transitionFrames: number }
  ) {
    this.threshold = opts.threshold
    this.holdFrames = opts.holdFrames
    this.step = MAX_FRAME / opts.transitionFrames

    this.analyser = audioContext.createAnalyser()
    this.analyser.fftSize = FFT_SIZE
    source.connect(this.analyser)

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
  }

  get level(): number {
    return Math.round(this._level)
  }

  start(): void {
    if (this.animId !== null) return

    const update = (): void => {
      this.analyser.getByteTimeDomainData(this.dataArray)

      let sum = 0
      for (let i = 0; i < this.dataArray.length; i++) {
        const v = (this.dataArray[i] - PCM_CENTER) / PCM_CENTER
        sum += v * v
      }
      const rms = Math.sqrt(sum / this.dataArray.length)
      const speaking = rms > this.threshold

      switch (this.state) {
        case 'closed':
          if (speaking) this.state = 'opening'
          break

        case 'opening':
          this._level = Math.min(MAX_FRAME, this._level + this.step)
          if (this._level >= MAX_FRAME) {
            this._level = MAX_FRAME
            this.state = 'open'
          }
          break

        case 'open':
          if (speaking) {
            this.silentCount = 0
          } else if (++this.silentCount > this.holdFrames) {
            this.state = 'closing'
            this.silentCount = 0
          }
          break

        case 'closing':
          this._level = Math.max(0, this._level - this.step)
          if (speaking) {
            this.state = 'opening'
          } else if (this._level <= 0) {
            this._level = 0
            this.state = 'closed'
          }
          break
      }

      this.animId = requestAnimationFrame(update)
    }
    this.animId = requestAnimationFrame(update)
  }

  stop(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId)
      this.animId = null
    }
    this._level = 0
    this.state = 'closed'
    this.silentCount = 0
  }

  destroy(): void {
    this.stop()
    this.analyser.disconnect()
  }
}
