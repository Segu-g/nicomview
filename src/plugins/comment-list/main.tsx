import { createRoot } from 'react-dom/client'
import { CommentList } from './CommentList'
import { applyOverlayParams } from '../overlay/applyOverlayParams'

const { enabledEvents } = applyOverlayParams(new URLSearchParams(location.search))

createRoot(document.getElementById('root')!).render(<CommentList enabledEvents={enabledEvents} />)
