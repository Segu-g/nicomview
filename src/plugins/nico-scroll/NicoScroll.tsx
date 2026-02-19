import { useCallback, useRef, useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import './styles.css'

const WS_URL = 'ws://localhost:3940'
const LANE_COUNT = 10

interface ScrollComment {
  id: number
  content: string
  lane: number
}

export function NicoScroll() {
  const [comments, setComments] = useState<ScrollComment[]>([])
  const nextId = useRef(0)
  const lanes = useRef(new Array(LANE_COUNT).fill(0))

  const getFreeLane = useCallback(() => {
    const now = Date.now()
    let bestLane = 0
    let bestTime = lanes.current[0]
    for (let i = 0; i < LANE_COUNT; i++) {
      if (lanes.current[i] <= now) {
        return i
      }
      if (lanes.current[i] < bestTime) {
        bestTime = lanes.current[i]
        bestLane = i
      }
    }
    return bestLane
  }, [])

  const handleMessage = useCallback(
    (event: string, data: unknown) => {
      if (event !== 'comment') return
      const { content } = data as { content?: string }
      const lane = getFreeLane()
      const speed =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--comment-speed')
        ) || 5
      lanes.current[lane] = Date.now() + speed * 1000
      const id = nextId.current++
      setComments((prev) => [...prev, { id, content: content || '', lane }])
    },
    [getFreeLane]
  )

  useWebSocket(WS_URL, handleMessage)

  const handleAnimationEnd = useCallback((id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const laneHeight = typeof window !== 'undefined' ? window.innerHeight / LANE_COUNT : 0

  return (
    <>
      {comments.map((c) => (
        <div
          key={c.id}
          className="comment"
          style={{ top: c.lane * laneHeight }}
          onAnimationEnd={() => handleAnimationEnd(c.id)}
        >
          {c.content}
        </div>
      ))}
    </>
  )
}
