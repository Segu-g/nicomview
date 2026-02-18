import { useState, useEffect, useCallback } from 'react'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Alert
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
import type {
  ConnectionState,
  PluginDescriptor,
  PluginPreferences
} from '../../shared/types'
import { ALL_EVENT_TYPES } from '../../shared/types'
import PluginSelector from './components/PluginSelector'
import EventFilter from './components/EventFilter'
import PluginHost from './components/PluginHost'

const theme = createTheme({
  colorSchemes: {
    dark: true
  },
  cssVariables: {
    colorSchemeSelector: 'class'
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", sans-serif'
  }
})

const stateLabels: Record<ConnectionState, string> = {
  disconnected: '未接続',
  connecting: '接続中...',
  connected: '接続済み',
  error: 'エラー'
}

const stateColors: Record<ConnectionState, 'default' | 'warning' | 'success' | 'error'> = {
  disconnected: 'default',
  connecting: 'warning',
  connected: 'success',
  error: 'error'
}

const defaultPreferences: PluginPreferences = {
  activeRendererPlugin: null,
  activeOverlayPlugin: null,
  enabledEvents: [...ALL_EVENT_TYPES]
}

function App(): JSX.Element {
  const [liveId, setLiveId] = useState('')
  const [cookies, setCookies] = useState('')
  const [showCookies, setShowCookies] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [copied, setCopied] = useState(false)
  const [plugins, setPlugins] = useState<PluginDescriptor[]>([])
  const [preferences, setPreferences] = useState<PluginPreferences>(defaultPreferences)
  const [pluginsLoaded, setPluginsLoaded] = useState(false)

  useEffect(() => {
    const unsubscribe = window.commentViewerAPI.onStateChange((state: ConnectionState) => {
      setConnectionState(state)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    Promise.all([
      window.commentViewerAPI.getPlugins(),
      window.commentViewerAPI.getPluginPreferences()
    ]).then(([loadedPlugins, loadedPrefs]) => {
      setPlugins(loadedPlugins)
      setPreferences(loadedPrefs)
      setPluginsLoaded(true)
    })
  }, [])

  const handleConnect = useCallback(async () => {
    if (!liveId.trim()) return
    await window.commentViewerAPI.connect(liveId.trim(), cookies || undefined)
  }, [liveId, cookies])

  const handleDisconnect = useCallback(async () => {
    await window.commentViewerAPI.disconnect()
  }, [])

  const handleCopy = useCallback(async () => {
    const url = window.commentViewerAPI.getOverlayUrl()
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handlePreferencesChange = useCallback(
    async (partial: Partial<PluginPreferences>) => {
      const updated = { ...preferences, ...partial }
      setPreferences(updated)
      await window.commentViewerAPI.setPluginPreferences(partial)
    },
    [preferences]
  )

  const isConnected = connectionState === 'connected'
  const isConnecting = connectionState === 'connecting'

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Container maxWidth="sm" sx={{ pt: 2, pb: 1, flexShrink: 0 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            NicomView
          </Typography>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  接続状態
                </Typography>
                <Chip
                  label={stateLabels[connectionState]}
                  color={stateColors[connectionState]}
                  size="small"
                />
              </Box>

              <TextField
                fullWidth
                label="放送ID"
                placeholder="lv123456789"
                value={liveId}
                onChange={(e) => setLiveId(e.target.value)}
                disabled={isConnected || isConnecting}
                size="small"
                sx={{ mb: 1.5 }}
              />

              <Box sx={{ mb: 1.5 }}>
                <Button
                  size="small"
                  onClick={() => setShowCookies(!showCookies)}
                  endIcon={showCookies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  Cookieオプション
                </Button>
                <Collapse in={showCookies}>
                  <TextField
                    fullWidth
                    label="Cookie（ログイン視聴用）"
                    placeholder="user_session=..."
                    value={cookies}
                    onChange={(e) => setCookies(e.target.value)}
                    disabled={isConnected || isConnecting}
                    multiline
                    rows={2}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Collapse>
              </Box>

              {isConnected ? (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleDisconnect}
                >
                  切断
                </Button>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? '接続中...' : '接続'}
                </Button>
              )}
            </CardContent>
          </Card>

          {connectionState === 'error' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              接続エラーが発生しました。放送IDを確認してください。
            </Alert>
          )}

          {pluginsLoaded && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  プラグイン設定
                </Typography>
                <PluginSelector
                  plugins={plugins}
                  preferences={preferences}
                  onPreferencesChange={handlePreferencesChange}
                />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>
                  表示イベント
                </Typography>
                <EventFilter
                  preferences={preferences}
                  onPreferencesChange={handlePreferencesChange}
                />
              </CardContent>
            </Card>
          )}

          {isConnected && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  OBSブラウザソース用URL
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      bgcolor: 'action.hover',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      flex: 1
                    }}
                  >
                    {window.commentViewerAPI.getOverlayUrl()}
                  </Typography>
                  <Tooltip title={copied ? 'コピーしました' : 'URLをコピー'}>
                    <IconButton onClick={handleCopy} size="small">
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          )}
        </Container>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', px: 2, pb: 2 }}>
          <PluginHost
            activePluginId={preferences.activeRendererPlugin}
            preferences={preferences}
          />
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
