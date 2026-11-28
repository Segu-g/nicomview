import { useState, useEffect, useCallback, useRef } from 'react'
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
  Alert,
  List,
  ListItem,
  ListItemText,
  Switch,
  Select,
  MenuItem,
  FormGroup,
  Snackbar
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material'
import type {
  ConnectionState,
  PluginDescriptor,
  PluginSettings,
  PluginSettingsMessage,
  TtsSettings,
  TtsAdapterInfo,
  TtsAdapterParamDef
} from '../../shared/types'
import { DEFAULT_TTS_TEMPLATES } from '../../shared/types'
import { ENGINE_RELOAD_DELAY_MS, pluginOverlayUrl, pluginSettingsUrl } from '../../shared/constants'
import { PLUGIN_MESSAGE } from '../../shared/pluginMessages'
import { SpeedVolumeFields } from '../../shared/ui/SpeedVolumeFields'
import { TtsEventFields } from '../../shared/ui/TtsEventFields'
import { TtsParamFields } from '../../shared/ui/TtsParamFields'

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

/** 設定項目が最も多い通知カードが収まる高さ */
const SETTINGS_IFRAME_HEIGHT = 350

function App(): JSX.Element {
  const [liveId, setLiveId] = useState('')
  const [cookies, setCookies] = useState('')
  const [showCookies, setShowCookies] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [plugins, setPlugins] = useState<PluginDescriptor[]>([])
  const [pluginSettings, setPluginSettings] = useState<Record<string, PluginSettings>>({})
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null)
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})
  const [ttsSettings, setTtsSettings] = useState<TtsSettings | null>(null)
  const [ttsAdapters, setTtsAdapters] = useState<TtsAdapterInfo[]>([])
  const [ttsParamDefs, setTtsParamDefs] = useState<TtsAdapterParamDef[]>([])
  const paramsRequestRef = useRef(0)
  const paramsTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showEngineSettings, setShowEngineSettings] = useState(true)
  const [showEventSettings, setShowEventSettings] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)

  useEffect(() => {
    const unsubscribe = window.commentViewerAPI.onStateChange((state: ConnectionState) => {
      setConnectionState(state)
    })
    return unsubscribe
  }, [])

  /** 最後の要求の結果だけを反映する */
  const loadTtsParams = useCallback(async (id: string) => {
    clearTimeout(paramsTimerRef.current)
    const request = ++paramsRequestRef.current
    const defs = await window.commentViewerAPI.getTtsAdapterParams(id)
    if (request === paramsRequestRef.current) setTtsParamDefs(defs)
  }, [])

  useEffect(() => () => clearTimeout(paramsTimerRef.current), [])

  useEffect(() => {
    Promise.all([
      window.commentViewerAPI.getPlugins(),
      window.commentViewerAPI.getTtsSettings(),
      window.commentViewerAPI.getTtsAdapters()
    ]).then(async ([loadedPlugins, loadedTts, loadedAdapters]) => {
      setPlugins(loadedPlugins)
      setTtsSettings(loadedTts)
      setTtsAdapters(loadedAdapters)

      const settings: Record<string, PluginSettings> = {}
      for (const p of loadedPlugins) {
        settings[p.id] = await window.commentViewerAPI.getPluginSettings(p.id)
      }
      setPluginSettings(settings)

      // 保存済みアダプターのパラメーター定義を読み込む
      if (loadedTts.adapterId) {
        loadTtsParams(loadedTts.adapterId).catch(() => {})
      }
    })
  }, [])

  // postMessage listener
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as PluginSettingsMessage
      if (!msg?.type) return

      if (msg.type === PLUGIN_MESSAGE.ready) {
        const { pluginId } = msg
        const settings = pluginSettings[pluginId] ?? {}
        const source = e.source as Window | null
        source?.postMessage(
          { type: PLUGIN_MESSAGE.settingsInit, settings } satisfies PluginSettingsMessage,
          '*'
        )
      }

      if (msg.type === PLUGIN_MESSAGE.settingsUpdate) {
        const { pluginId, settings } = msg
        setPluginSettings((prev) => ({ ...prev, [pluginId]: settings }))
        window.commentViewerAPI.setPluginSettings(pluginId, settings).catch(() => {
          setSaveError('プラグイン設定の保存に失敗しました')
        })
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [pluginSettings])

  const handleConnect = useCallback(async () => {
    if (!liveId.trim()) return
    await window.commentViewerAPI.connect(liveId.trim(), cookies || undefined)
  }, [liveId, cookies])

  const handleDisconnect = useCallback(async () => {
    await window.commentViewerAPI.disconnect()
  }, [])

  const buildPluginUrl = useCallback((pluginId: string) => {
    return pluginOverlayUrl(pluginId, pluginSettings[pluginId])
  }, [pluginSettings])

  const handleCopyUrl = useCallback(async (pluginId: string) => {
    await navigator.clipboard.writeText(buildPluginUrl(pluginId))
    setCopiedId(pluginId)
    setTimeout(() => setCopiedId(null), 2000)
  }, [buildPluginUrl])

  const handleTtsChange = useCallback(
    async (partial: Partial<TtsSettings>) => {
      if (!ttsSettings) return
      const prev = ttsSettings
      const prevParamDefs = ttsParamDefs
      const updated = { ...ttsSettings, ...partial }
      setTtsSettings(updated)
      // 旧エンジンの項目を新エンジンの設定として編集させない
      if (partial.adapterId !== undefined) {
        clearTimeout(paramsTimerRef.current)
        paramsRequestRef.current++
        setTtsParamDefs([])
      }
      try {
        await window.commentViewerAPI.setTtsSettings(partial)
        if (partial.adapterId) {
          await loadTtsParams(partial.adapterId)
        }
      } catch {
        setTtsSettings(prev)
        if (partial.adapterId !== undefined) {
          setTtsParamDefs(prevParamDefs)
        }
        setSaveError('読み上げ設定の保存に失敗しました')
      }
    },
    [ttsSettings, ttsParamDefs, loadTtsParams]
  )

  const toggleExpanded = useCallback((pluginId: string) => {
    setExpandedPlugin((prev) => (prev === pluginId ? null : pluginId))
  }, [])

  const speakerParam = ttsParamDefs.find((p) => p.role === 'speaker')
  const speakerOptions = speakerParam?.options ?? []
  const adapterId = ttsSettings?.adapterId ?? ''
  const adapterSettings = ttsSettings?.adapterSettings[adapterId] ?? {}
  const speakerOverrides = ttsSettings?.speakerOverrides[adapterId] ?? {}

  const handleAdapterSettingChange = (param: TtsAdapterParamDef, value: string | number): void => {
    if (!ttsSettings) return
    handleTtsChange({
      adapterSettings: { ...ttsSettings.adapterSettings, [adapterId]: { ...adapterSettings, [param.key]: value } }
    })
    // 接続先などが変わると選択肢も変わりうる
    if (param.type !== 'select') {
      clearTimeout(paramsTimerRef.current)
      paramsTimerRef.current = setTimeout(() => { loadTtsParams(adapterId).catch(() => {}) }, ENGINE_RELOAD_DELAY_MS)
    }
  }

  const isConnected = connectionState === 'connected'
  const isConnecting = connectionState === 'connecting'

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          NicomView
        </Typography>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
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
          <Alert severity="error" sx={{ mb: 3 }}>
            接続エラーが発生しました。放送IDを確認してください。
          </Alert>
        )}

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                表示プラグイン
              </Typography>
              <Tooltip title="プラグインフォルダを開く">
                <IconButton size="small" onClick={() => window.commentViewerAPI.openPluginFolder()}>
                  <FolderOpenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              以下のURLをOBSブラウザソースやブラウザで開くとコメントが表示されます
            </Typography>
            <List dense disablePadding>
              {plugins.filter((p) => p.overlay).map((plugin) => (
                <ListItem key={plugin.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ListItemText
                      primary={plugin.name}
                      secondary={buildPluginUrl(plugin.id)}
                      secondaryTypographyProps={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {plugin.settings && (
                        <Tooltip title="設定">
                          <IconButton
                            onClick={() => {
                              if (plugin.settingsPopup) {
                                window.open(
                                  pluginSettingsUrl(plugin.id),
                                  `nicomview-settings-${plugin.id}`
                                )
                              } else {
                                toggleExpanded(plugin.id)
                              }
                            }}
                            size="small"
                            data-testid={`settings-toggle-${plugin.id}`}
                          >
                            <SettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={copiedId === plugin.id ? 'コピーしました' : 'URLをコピー'}>
                        <IconButton onClick={() => handleCopyUrl(plugin.id)} size="small">
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  {plugin.settings && !plugin.settingsPopup && (
                    <Collapse in={expandedPlugin === plugin.id}>
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <iframe
                          ref={(el) => { iframeRefs.current[plugin.id] = el }}
                          src={pluginSettingsUrl(plugin.id)}
                          title={`${plugin.name} 設定`}
                          data-testid={`settings-iframe-${plugin.id}`}
                          style={{
                            width: '100%',
                            height: SETTINGS_IFRAME_HEIGHT,
                            border: 'none',
                            borderRadius: 8,
                            background: '#1e1e1e'
                          }}
                        />
                      </Box>
                    </Collapse>
                  )}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {ttsSettings && (
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  読み上げ設定
                </Typography>
                <Switch
                  size="small"
                  checked={ttsSettings.enabled}
                  onChange={(e) => handleTtsChange({ enabled: e.target.checked })}
                  inputProps={{ 'aria-label': '読み上げ有効' }}
                />
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 0.5 }}
                onClick={() => setShowEngineSettings(!showEngineSettings)}
              >
                <Typography variant="caption" color="text.secondary">
                  エンジン設定
                </Typography>
                {showEngineSettings ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              <Collapse in={showEngineSettings}>
              {ttsAdapters.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    読み上げエンジン
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={ttsSettings.adapterId}
                    onChange={(e) => handleTtsChange({ adapterId: e.target.value })}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      選択してください
                    </MenuItem>
                    {ttsAdapters.map((adapter) => (
                      <MenuItem key={adapter.id} value={adapter.id}>
                        {adapter.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}

              {ttsParamDefs.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <TtsParamFields
                    params={ttsParamDefs}
                    values={adapterSettings}
                    onChange={handleAdapterSettingChange}
                    onRefresh={() => { loadTtsParams(adapterId).catch(() => {}) }}
                  />
                </Box>
              )}
              </Collapse>

              <Box
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 0.5 }}
                onClick={() => setShowEventSettings(!showEventSettings)}
              >
                <Typography variant="caption" color="text.secondary">
                  イベント設定
                </Typography>
                {showEventSettings ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              <Collapse in={showEventSettings}>
              <Box sx={{ mb: 2 }}>
                <TtsEventFields
                  enabledEvents={ttsSettings.enabledEvents}
                  onEnabledEventsChange={(enabledEvents) => handleTtsChange({ enabledEvents })}
                  templates={{ ...DEFAULT_TTS_TEMPLATES, ...ttsSettings.formatTemplates }}
                  onTemplateChange={(eventType, template) =>
                    handleTtsChange({ formatTemplates: { ...ttsSettings.formatTemplates, [eventType]: template } })
                  }
                  speakerOverrides={speakerOverrides}
                  onSpeakerOverrideChange={(eventType, value) => {
                    const next = { ...speakerOverrides }
                    if (value === '') {
                      delete next[eventType]
                    } else {
                      next[eventType] = value
                    }
                    handleTtsChange({ speakerOverrides: { ...ttsSettings.speakerOverrides, [adapterId]: next } })
                  }}
                  speakerOptions={speakerOptions}
                  speakerLabel={speakerParam?.label ?? ''}
                />
              </Box>
              </Collapse>

              <Box
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 0.5 }}
                onClick={() => setShowAudioSettings(!showAudioSettings)}
              >
                <Typography variant="caption" color="text.secondary">
                  音声調整
                </Typography>
                {showAudioSettings ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              <Collapse in={showAudioSettings}>
              <SpeedVolumeFields
                speed={ttsSettings.speed}
                volume={ttsSettings.volume}
                onSpeedChange={(speed) => handleTtsChange({ speed })}
                onVolumeChange={(volume) => handleTtsChange({ volume })}
              />
              </Collapse>
            </CardContent>
          </Card>
        )}
      </Container>
      <Snackbar
        open={saveError !== null}
        autoHideDuration={4000}
        onClose={() => setSaveError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}

export default App
