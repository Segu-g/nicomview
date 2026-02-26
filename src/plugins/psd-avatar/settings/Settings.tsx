import { useEffect, useState, useCallback, useMemo } from 'react'
import type { PluginSettings, PluginSettingsMessage } from '../../../shared/types'
import { loadPsd, type PsdData, type PsdLayer } from '../psdLoader'
import { fetchSpeakers, type VoicevoxSpeaker } from '../voicevoxClient'

const DEFAULTS: Record<string, string | number> = {
  psdFile: 'models/default.psd',
  voicevoxHost: 'http://localhost:50021',
  speaker: 0,
  speed: 1.0,
  volume: 1.0,
  threshold: 0.15,
  sensitivity: 3,
  blinkInterval: 3,
  blinkSpeed: 6,
  mouth0: '', mouth1: '', mouth2: '', mouth3: '', mouth4: '',
  eye0: '', eye1: '', eye2: '', eye3: '', eye4: '',
  layerVisibility: '{}',
}

const ROLE_OPTIONS = [
  { value: '', label: 'なし' },
  { value: 'mouth0', label: '口: 閉じ' },
  { value: 'mouth1', label: '口: ほぼ閉じ' },
  { value: 'mouth2', label: '口: 半開き' },
  { value: 'mouth3', label: '口: ほぼ開き' },
  { value: 'mouth4', label: '口: 開き' },
  { value: 'eye0', label: '目: 開き' },
  { value: 'eye1', label: '目: ほぼ開き' },
  { value: 'eye2', label: '目: 半開き' },
  { value: 'eye3', label: '目: ほぼ閉じ' },
  { value: 'eye4', label: '目: 閉じ' },
]

const OVERLAY_BASE = 'http://localhost:3939/plugins/psd-avatar/overlay/'

interface Props {
  pluginId: string
}

function parseVisibility(settings: Record<string, string | number>): Record<string, boolean> {
  try {
    const raw = settings.layerVisibility
    if (typeof raw === 'string' && raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function buildRoleMap(settings: Record<string, string | number>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const key of ['mouth0','mouth1','mouth2','mouth3','mouth4','eye0','eye1','eye2','eye3','eye4']) {
    const path = String(settings[key] ?? '')
    if (path) map[path] = key
  }
  return map
}

function buildPreviewUrl(settings: Record<string, string | number>, animate: boolean): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(settings)) {
    if (value !== '' && value != null) params.set(key, String(value))
  }
  if (!animate) params.set('preview', 'true')
  const qs = params.toString()
  return qs ? `${OVERLAY_BASE}?${qs}` : OVERLAY_BASE
}

export function Settings({ pluginId }: Props) {
  const [settings, setSettings] = useState<Record<string, string | number>>(DEFAULTS)
  const [ready, setReady] = useState(false)
  const [psd, setPsd] = useState<PsdData | null>(null)
  const [psdError, setPsdError] = useState<string | null>(null)
  const [psdLoading, setPsdLoading] = useState(false)
  const [speakers, setSpeakers] = useState<VoicevoxSpeaker[]>([])
  const [speakersError, setSpeakersError] = useState<string | null>(null)
  const [previewAnimate, setPreviewAnimate] = useState(false)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as PluginSettingsMessage
      if (msg?.type === 'nicomview:settings-init') {
        const s = msg.settings
        const merged: Record<string, string | number> = { ...DEFAULTS }
        for (const [key, value] of Object.entries(s)) {
          if (value !== '' && value != null) {
            merged[key] = value as string | number
          }
        }
        setSettings(merged)
        setReady(true)
      }
    }
    window.addEventListener('message', handler)
    ;(window.opener || window.parent).postMessage({ type: 'nicomview:ready', pluginId }, '*')
    return () => window.removeEventListener('message', handler)
  }, [pluginId])

  const sendUpdate = useCallback(
    (updated: Record<string, string | number>) => {
      const ps: PluginSettings = {}
      for (const [key, value] of Object.entries(updated)) {
        ps[key] = value
      }
      ;(window.opener || window.parent).postMessage(
        { type: 'nicomview:settings-update', pluginId, settings: ps },
        '*'
      )
    },
    [pluginId]
  )

  const update = useCallback(
    (key: string, value: string | number) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        sendUpdate(next)
        return next
      })
    },
    [sendUpdate]
  )

  const updateMultiple = useCallback(
    (updates: Record<string, string | number>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates }
        sendUpdate(next)
        return next
      })
    },
    [sendUpdate]
  )

  const handleLoadPsd = useCallback(async () => {
    setPsdLoading(true)
    setPsdError(null)
    try {
      const psdFile = String(settings.psdFile)
      const url = `http://localhost:3939/plugins/psd-avatar/${psdFile}`
      const data = await loadPsd(url)
      setPsd(data)
    } catch (e) {
      setPsdError(String(e))
    }
    setPsdLoading(false)
  }, [settings.psdFile])

  const handleFetchSpeakers = useCallback(async () => {
    setSpeakersError(null)
    try {
      const host = String(settings.voicevoxHost)
      const list = await fetchSpeakers(host)
      setSpeakers(list)
    } catch (e) {
      setSpeakersError(String(e))
    }
  }, [settings.voicevoxHost])

  useEffect(() => {
    if (ready) handleFetchSpeakers()
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const visibility = useMemo(() => parseVisibility(settings), [settings.layerVisibility])
  const roleMap = useMemo(() => buildRoleMap(settings), [
    settings.mouth0, settings.mouth1, settings.mouth2, settings.mouth3, settings.mouth4,
    settings.eye0, settings.eye1, settings.eye2, settings.eye3, settings.eye4,
  ])
  const previewUrl = useMemo(() => buildPreviewUrl(settings, previewAnimate), [settings, previewAnimate])

  const handleVisibilityToggle = useCallback(
    (layer: PsdLayer) => {
      const current = layer.path in visibility ? visibility[layer.path] : !layer.hidden
      const next = { ...visibility, [layer.path]: !current }
      update('layerVisibility', JSON.stringify(next))
    },
    [visibility, update]
  )

  const handleRoleChange = useCallback(
    (layerPath: string, newRole: string) => {
      const oldRole = roleMap[layerPath] ?? ''
      const updates: Record<string, string | number> = {}

      // Clear old role for this layer
      if (oldRole) updates[oldRole] = ''

      // Clear the layer that previously had the new role
      if (newRole) {
        const prevPath = String(settings[newRole] ?? '')
        if (prevPath && prevPath !== layerPath) {
          // Another layer had this role — it gets cleared automatically
        }
        updates[newRole] = layerPath
      }

      updateMultiple(updates)
    },
    [roleMap, settings, updateMultiple]
  )

  if (!ready) return null

  const leafLayers = psd
    ? psd.layers.filter((l) => !l.isGroup && l.canvas !== null)
    : []

  const speakerOptions: { id: number; label: string }[] = []
  for (const s of speakers) {
    for (const style of s.styles) {
      speakerOptions.push({ id: style.id, label: `${s.name} (${style.name})` })
    }
  }

  return (
    <div className="settings-form">
      {/* PSD ファイル */}
      <div className="settings-section">
        <div className="settings-section-title">PSD ファイル</div>
        <div className="settings-row">
          <label className="settings-label">
            パス（プラグインディレクトリからの相対）
            <input
              type="text"
              value={settings.psdFile}
              onChange={(e) => update('psdFile', e.target.value)}
            />
          </label>
          <button
            className="settings-btn"
            onClick={handleLoadPsd}
            disabled={psdLoading}
          >
            {psdLoading ? '読込中...' : '読み込み'}
          </button>
        </div>
        {psdError && <div className="error-text">{psdError}</div>}
        {psd && <div className="success-text">{psd.width}x{psd.height} — {leafLayers.length} レイヤー</div>}
      </div>

      {/* レイヤーツリー + プレビュー */}
      {psd && (
        <div className="main-panes">
          <div className="pane-left">
            <div className="settings-section-title">レイヤー</div>
            <div className="layer-tree">
              {psd.layers.map((l) => {
                const depth = l.path.split('/').length - 1
                if (l.isGroup) {
                  return (
                    <div key={l.path} className="layer-item group" style={{ paddingLeft: depth * 16 }}>
                      {l.name}
                    </div>
                  )
                }
                if (!l.canvas) return null
                const isVisible = l.path in visibility ? visibility[l.path] : !l.hidden
                const role = roleMap[l.path] ?? ''
                return (
                  <div key={l.path} className="layer-item leaf" style={{ paddingLeft: depth * 16 }}>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleVisibilityToggle(l)}
                    />
                    <span className="layer-name">{l.name}</span>
                    <select
                      className="role-select"
                      value={role}
                      onChange={(e) => handleRoleChange(l.path, e.target.value)}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="pane-right">
            <div className="preview-header">
              <div className="settings-section-title">プレビュー</div>
              <label className="animate-toggle">
                <input
                  type="checkbox"
                  checked={previewAnimate}
                  onChange={(e) => setPreviewAnimate(e.target.checked)}
                />
                アニメーション
              </label>
            </div>
            <iframe
              className="preview-iframe"
              src={previewUrl}
              title="プレビュー"
            />
          </div>
        </div>
      )}

      {/* VOICEVOX 設定 */}
      <div className="settings-section">
        <div className="settings-section-title">VOICEVOX 設定</div>
        <div className="settings-row">
          <label className="settings-label">
            API ホスト
            <input
              type="text"
              value={settings.voicevoxHost}
              onChange={(e) => update('voicevoxHost', e.target.value)}
            />
          </label>
          <button className="settings-btn" onClick={handleFetchSpeakers}>
            話者取得
          </button>
        </div>
        {speakersError && <div className="error-text">{speakersError}</div>}
        <label className="settings-label">
          スピーカー
          <select
            value={settings.speaker}
            onChange={(e) => update('speaker', Number(e.target.value))}
          >
            {speakerOptions.length === 0 && (
              <option value={settings.speaker}>ID: {settings.speaker}</option>
            )}
            {speakerOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="settings-label">
          速度
          <input
            type="number"
            min={0.5}
            max={2.0}
            step={0.1}
            value={settings.speed}
            onChange={(e) => update('speed', Number(e.target.value))}
          />
        </label>
        <label className="settings-label">
          音量
          <input
            type="number"
            min={0}
            max={2.0}
            step={0.1}
            value={settings.volume}
            onChange={(e) => update('volume', Number(e.target.value))}
          />
        </label>
      </div>

      {/* 口パクパラメータ */}
      <div className="settings-section">
        <div className="settings-section-title">口パクパラメータ</div>
        <label className="settings-label">
          しきい値 (0〜1)
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={settings.threshold}
            onChange={(e) => update('threshold', Number(e.target.value))}
          />
        </label>
        <label className="settings-label">
          感度（移動平均フレーム数）
          <input
            type="number"
            min={1}
            max={30}
            step={1}
            value={settings.sensitivity}
            onChange={(e) => update('sensitivity', Number(e.target.value))}
          />
        </label>
      </div>

      {/* 目パチパラメータ */}
      <div className="settings-section">
        <div className="settings-section-title">目パチパラメータ</div>
        <label className="settings-label">
          目パチ間隔（秒）
          <input
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            value={settings.blinkInterval}
            onChange={(e) => update('blinkInterval', Number(e.target.value))}
          />
        </label>
        <label className="settings-label">
          目パチ速度（遷移フレーム数）
          <input
            type="number"
            min={1}
            max={30}
            step={1}
            value={settings.blinkSpeed}
            onChange={(e) => update('blinkSpeed', Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  )
}
