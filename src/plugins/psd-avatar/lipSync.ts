type LipSyncState = 'closed' | 'opening' | 'open' | 'closing'

export class LipSync {
  private analyser: AnalyserNode
  private dataArray: Uint8Array
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
    opts: { threshold?: number; holdFrames?: number; transitionFrames?: number } = {}
  ) {
    this.threshold = opts.threshold ?? 0.15
    this.holdFrames = opts.holdFrames ?? 8
    this.step = 4 / (opts.transitionFrames ?? 4)

    this.analyser = audioContext.createAnalyser()
    this.analyser.fftSize = 256
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
        const v = (this.dataArray[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / this.dataArray.length)
      const speaking = rms > this.threshold

      switch (this.state) {
        case 'closed':
          if (speaking) this.state = 'opening'
          break

        case 'opening':
          this._level = Math.min(4, this._level + this.step)
          if (this._level >= 4) {
            this._level = 4
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
