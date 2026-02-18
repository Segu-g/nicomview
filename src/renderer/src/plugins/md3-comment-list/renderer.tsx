import React, { useState, useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
  Box
} from '@mui/material'
import {
  CardGiftcard as GiftIcon,
  Info as InfoIcon,
  Campaign as OperatorIcon,
  EmojiEmotions as EmotionIcon
} from '@mui/icons-material'
import type {
  CommentEvent,
  NicomViewPluginAPI,
  RendererPluginExports
} from '../../../../shared/types'

const MAX_COMMENTS = 200

interface CommentEntry {
  id: number
  event: CommentEvent
}

let nextId = 0

function CommentList({ api }: { api: NicomViewPluginAPI }): JSX.Element {
  const [comments, setComments] = useState<CommentEntry[]>([])
  const listEndRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = api.subscribe((event) => {
      setComments((prev) => {
        const next = [...prev, { id: nextId++, event }]
        return next.length > MAX_COMMENTS ? next.slice(next.length - MAX_COMMENTS) : next
      })
    })
    return unsubscribe
  }, [api])

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScrollRef.current && listEndRef.current && listEndRef.current.scrollIntoView) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  // Track scroll position for auto-scroll
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const threshold = 50
    autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        flex: 1,
        overflow: 'auto',
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'action.disabled', borderRadius: 3 }
      }}
    >
      <List dense disablePadding>
        {comments.map((entry) => (
          <CommentItem key={entry.id} entry={entry} />
        ))}
      </List>
      <div ref={listEndRef} />
    </Box>
  )
}

function CommentItem({ entry }: { entry: CommentEntry }): JSX.Element {
  const { event } = entry
  const data = event.data as Record<string, unknown>

  switch (event.type) {
    case 'comment':
      return (
        <ListItem sx={{ alignItems: 'flex-start', py: 0.5 }}>
          <ListItemText
            primary={
              <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 1 }}>
                {(data.userName as string) || (data.userId as string) || '匿名'}
              </Typography>
            }
            secondary={
              <Typography variant="body2" component="span" color="text.primary">
                {data.content as string}
              </Typography>
            }
          />
        </ListItem>
      )

    case 'gift':
      return (
        <ListItem sx={{ py: 0.5, bgcolor: 'rgba(255, 167, 38, 0.08)' }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <GiftIcon color="warning" fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {(data.userName as string) || '匿名'}
                </Typography>
                <Chip
                  label={`${data.itemName || 'ギフト'} ${data.point ? `${data.point}pt` : ''}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Box>
            }
          />
        </ListItem>
      )

    case 'notification':
      return (
        <ListItem sx={{ py: 0.5, bgcolor: 'rgba(33, 150, 243, 0.08)' }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <InfoIcon color="info" fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" color="info.main">
                {(data.message as string) || JSON.stringify(data)}
              </Typography>
            }
          />
        </ListItem>
      )

    case 'operatorComment':
      return (
        <ListItem sx={{ py: 0.5, bgcolor: 'rgba(156, 39, 176, 0.12)' }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <OperatorIcon color="secondary" fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" fontWeight="bold" color="secondary.main">
                {(data.content as string) || JSON.stringify(data)}
              </Typography>
            }
          />
        </ListItem>
      )

    case 'emotion':
      return (
        <ListItem sx={{ py: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <EmotionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" color="text.secondary">
                {(data.content as string) || (data.id as string) || 'エモーション'}
              </Typography>
            }
          />
        </ListItem>
      )

    default:
      return <></>
  }
}

let root: Root | null = null

const pluginExports: RendererPluginExports = {
  mount(container: HTMLElement, api: NicomViewPluginAPI): void {
    root = createRoot(container)
    root.render(
      <React.StrictMode>
        <CommentList api={api} />
      </React.StrictMode>
    )
  },

  unmount(): void {
    if (root) {
      root.unmount()
      root = null
    }
  }
}

export default pluginExports
