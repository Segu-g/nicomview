import { createRoot } from 'react-dom/client'
import { CommentCards } from './CommentCards'
import { applyOverlayParams } from '../overlay/applyOverlayParams'

const params = new URLSearchParams(location.search)
const { enabledEvents } = applyOverlayParams(params)

const duration = params.get('duration')
if (duration) {
  document.documentElement.style.setProperty('--duration', duration + 's')
}

createRoot(document.getElementById('root')!).render(<CommentCards enabledEvents={enabledEvents} />)
