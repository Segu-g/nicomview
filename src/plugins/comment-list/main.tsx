import { createRoot } from 'react-dom/client'
import { CommentList } from './CommentList'

const params = new URLSearchParams(location.search)

const fontSize = params.get('fontSize')
if (fontSize) {
  document.documentElement.style.setProperty('--font-size', fontSize + 'px')
}

const theme = params.get('theme')
if (theme) {
  document.documentElement.dataset.theme = theme
}

createRoot(document.getElementById('root')!).render(<CommentList />)
