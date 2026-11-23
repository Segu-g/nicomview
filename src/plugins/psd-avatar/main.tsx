import { createRoot } from 'react-dom/client'
import { PsdAvatar } from './PsdAvatar'
import { parseConfig } from './config'

const props = parseConfig(new URLSearchParams(location.search))

createRoot(document.getElementById('root')!).render(<PsdAvatar {...props} />)
