import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import './styles.css'

const WS_URL = 'ws://localhost:3940'

interface CardData {
  id: number
  username: string
  content: string
  iconUrl?: string
  type: 'comment' | 'operator'
  exiting: boolean
}

let nextId = 0

export function CommentCards() {
  const [cards, setCards] = useState<CardData[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const getDuration = () => {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--duration').trim()
    return parseFloat(val) * 1000 || 60000
  }

  const markExiting = useCallback((cardId: number) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, exiting: true } : c)))
  }, [])

  const removeCard = useCallback((cardId: number) => {
    timersRef.current.delete(cardId)
    setCards((prev) => prev.filter((c) => c.id !== cardId))
  }, [])

  const scheduleExit = useCallback(
    (cardId: number, delay: number) => {
      const timer = setTimeout(() => markExiting(cardId), delay)
      timersRef.current.set(cardId, timer)
    },
    [markExiting],
  )

  const handleMessage = useCallback(
    (event: string, data: unknown) => {
      if (event !== 'comment' && event !== 'operatorComment') return

      const d = data as {
        content?: string
        userName?: string
        userIcon?: string
        isHistory?: boolean
      }

      if (d.isHistory) return

      const id = nextId++
      const card: CardData = {
        id,
        username: d.userName || '匿名',
        content: d.content || '',
        iconUrl: d.userIcon,
        type: event === 'operatorComment' ? 'operator' : 'comment',
        exiting: false,
      }

      setCards((prev) => [card, ...prev])
      scheduleExit(id, getDuration())
    },
    [scheduleExit],
  )

  useWebSocket(WS_URL, handleMessage)

  // Overflow detection: after each render, check if container overflows
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Keep removing oldest visible card until no overflow
    if (el.scrollHeight > el.clientHeight) {
      setCards((prev) => {
        const visibleCards = prev.filter((c) => !c.exiting)
        if (visibleCards.length === 0) return prev

        const oldest = visibleCards[visibleCards.length - 1]
        // Clear its timer since we're forcing exit
        const timer = timersRef.current.get(oldest.id)
        if (timer) {
          clearTimeout(timer)
          timersRef.current.delete(oldest.id)
        }

        return prev.map((c) => (c.id === oldest.id ? { ...c, exiting: true } : c))
      })
    }
  }, [cards])

  const handleAnimationEnd = useCallback(
    (cardId: number, e: React.AnimationEvent) => {
      // Only remove after the exit animation completes
      if (e.animationName === 'slideOut') {
        removeCard(cardId)
      }
    },
    [removeCard],
  )

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return (
    <div className="card-container" ref={containerRef}>
      {cards.map((card) => (
        <div
          key={card.id}
          className={`card ${card.type === 'operator' ? 'operator' : ''}${card.exiting ? ' exiting' : ''}`}
          onAnimationEnd={(e) => handleAnimationEnd(card.id, e)}
        >
          {card.iconUrl ? (
            <img className="avatar" src={card.iconUrl} alt="" />
          ) : (
            <div className="avatar placeholder" />
          )}
          <div className="card-body">
            <div className="username">{card.username}</div>
            <div className="content">{card.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
