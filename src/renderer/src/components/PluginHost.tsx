import { useEffect, useRef, useCallback } from 'react'
import { Box, Typography } from '@mui/material'
import type {
  CommentEvent,
  PluginPreferences,
  NicomViewPluginAPI,
  RendererPluginExports
} from '../../../shared/types'

// Built-in plugin registry (static imports compiled with the app)
const builtInPlugins: Record<string, () => Promise<RendererPluginExports>> = {
  'md3-comment-list': () =>
    import('../plugins/md3-comment-list/renderer').then((m) => m.default)
}

interface PluginHostProps {
  activePluginId: string | null
  preferences: PluginPreferences
}

export default function PluginHost({
  activePluginId,
  preferences
}: PluginHostProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<RendererPluginExports | null>(null)
  const subscribersRef = useRef<Set<(event: CommentEvent) => void>>(new Set())
  const preferencesRef = useRef(preferences)

  // Keep preferences ref in sync
  preferencesRef.current = preferences

  const handleCommentEvent = useCallback((event: CommentEvent) => {
    // Filter by enabled events
    if (!preferencesRef.current.enabledEvents.includes(event.type)) return
    for (const cb of subscribersRef.current) {
      cb(event)
    }
  }, [])

  // Subscribe to comment events from main process
  useEffect(() => {
    const unsubscribe = window.commentViewerAPI.onCommentEvent(handleCommentEvent)
    return unsubscribe
  }, [handleCommentEvent])

  // Mount/unmount plugin when activePluginId changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    async function loadPlugin() {
      // Unmount previous plugin
      if (pluginRef.current) {
        try {
          pluginRef.current.unmount()
        } catch {
          // ignore unmount errors
        }
        pluginRef.current = null
      }
      subscribersRef.current.clear()

      // Clear container
      container!.innerHTML = ''

      if (!activePluginId) return

      // Create plugin API
      const api: NicomViewPluginAPI = {
        subscribe(callback: (event: CommentEvent) => void): () => void {
          subscribersRef.current.add(callback)
          return () => {
            subscribersRef.current.delete(callback)
          }
        },
        getConfig() {
          return { enabledEvents: preferencesRef.current.enabledEvents }
        }
      }

      try {
        let pluginExports: RendererPluginExports

        if (builtInPlugins[activePluginId]) {
          // Built-in plugin: static import
          pluginExports = await builtInPlugins[activePluginId]()
        } else {
          // External plugin: load via script tag
          const scriptUrl = `http://localhost:3939/plugins/${activePluginId}/renderer.js`
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = scriptUrl
            script.onload = () => resolve()
            script.onerror = () => reject(new Error(`Failed to load plugin: ${activePluginId}`))
            document.head.appendChild(script)
          })
          pluginExports = (window as any).__nicomviewPlugin
          delete (window as any).__nicomviewPlugin
        }

        if (cancelled) return

        pluginExports.mount(container!, api)
        pluginRef.current = pluginExports
      } catch (err) {
        if (cancelled) return
        container!.innerHTML = ''
        const errorDiv = document.createElement('div')
        errorDiv.style.cssText = 'padding: 16px; color: #f44336;'
        errorDiv.textContent = `プラグイン読み込みエラー: ${err instanceof Error ? err.message : String(err)}`
        container!.appendChild(errorDiv)
      }
    }

    loadPlugin()

    return () => {
      cancelled = true
      if (pluginRef.current) {
        try {
          pluginRef.current.unmount()
        } catch {
          // ignore
        }
        pluginRef.current = null
      }
      subscribersRef.current.clear()
    }
  }, [activePluginId])

  if (!activePluginId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}
      >
        <Typography variant="body2">レンダラープラグインが選択されていません</Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    />
  )
}
