import { useEffect, useRef } from 'react'

type MessageHandler = (event: string, data: unknown) => void

const RECONNECT_INTERVAL = 5000

export function useWebSocket(url: string, onMessage: MessageHandler): void {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    let ws: WebSocket | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let unmounted = false

    function connect() {
      ws = new WebSocket(url)

      ws.addEventListener('open', () => {
        console.log('[NicomView] WebSocket connected')
      })

      ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data)
          onMessageRef.current(msg.event, msg.data)
        } catch (e) {
          console.error('[NicomView] Failed to parse message:', e)
        }
      })

      ws.addEventListener('close', () => {
        ws = null
        if (!unmounted) {
          timer = setTimeout(connect, RECONNECT_INTERVAL)
        }
      })

      ws.addEventListener('error', () => {
        ws?.close()
      })
    }

    connect()

    return () => {
      unmounted = true
      if (timer) clearTimeout(timer)
      ws?.close()
    }
  }, [url])
}
