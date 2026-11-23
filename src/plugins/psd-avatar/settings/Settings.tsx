import { useState, useCallback, useMemo, useRef } from 'react'
import Checkbox from '@mui/material/Checkbox'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import type { PluginTestSpeakMessage } from '../../../shared/types'
import { pluginFileUrl, pluginOverlayUrl } from '../../../shared/constants'
import { PLUGIN_MESSAGE } from '../../../shared/pluginMessages'
import { loadPsd, type PsdData, type PsdLayer } from '../psdLoader'
import type { SettingsProps } from '../../settings/mountSettings'
import { usePluginSettings } from '../../settings/usePluginSettings'
import { VoiceSettings } from './VoiceSettings'
import {
  ALL_ROLE_KEYS, DEFAULTS, PLUGIN_ID, RANGES,
  parseLayerPaths, parseLayerVisibility, type RawSettings,
} from '../config'

const ROLE_LABELS: Record<string, string> = {
  mouth0: '口: 閉じ',
  mouth1: '口: ほぼ閉じ',
  mouth2: '口: 半開き',
  mouth3: '口: ほぼ開き',
  mouth4: '口: 開き',
  eye0: '目: 開き',
  eye1: '目: ほぼ開き',
  eye2: '目: 半開き',
  eye3: '目: ほぼ閉じ',
  eye4: '目: 閉じ',
}

function isAncestorHiddenByVis(path: string, visibility: Record<string, boolean>): boolean {
  const parts = path.split('/')
  for (let i = 1; i < parts.length; i++) {
    if (visibility[parts.slice(0, i).join('/')] === false) return true
  }
  return false
}

function isAncestorCollapsed(path: string, collapsed: Set<string>): boolean {
  const parts = path.split('/')
  for (let i = 1; i < parts.length; i++) {
    if (collapsed.has(parts.slice(0, i).join('/'))) return true
  }
  return false
}

function buildRoleMap(settings: RawSettings): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const key of ALL_ROLE_KEYS) {
    for (const path of parseLayerPaths(settings[key] ?? '')) {
      if (!map[path]) map[path] = []
      map[path].push(key)
    }
  }
  return map
}

function buildPreviewUrl(settings: RawSettings, animate: boolean): string {
  return pluginOverlayUrl(PLUGIN_ID, animate ? settings : { ...settings, preview: 'true' })
}

export function Settings({ pluginId }: SettingsProps) {
  const { settings, ready, update } = usePluginSettings(pluginId, DEFAULTS)
  const [psd, setPsd] = useState<PsdData | null>(null)
  const [psdError, setPsdError] = useState<string | null>(null)
  const [psdLoading, setPsdLoading] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [previewAnimate, setPreviewAnimate] = useState(false)
  const [testText, setTestText] = useState('こんにちは')
  const previewRef = useRef<HTMLIFrameElement>(null)

  const handleLoadPsd = useCallback(async () => {
    setPsdLoading(true)
    setPsdError(null)
    try {
      const psdFile = String(settings.psdFile)
      const url = pluginFileUrl(PLUGIN_ID, psdFile)
      const data = await loadPsd(url)
      setPsd(data)
    } catch (e) {
      setPsdError(String(e))
    }
    setPsdLoading(false)
  }, [settings.psdFile])

  const handleTestSpeak = useCallback(() => {
    if (!testText.trim()) return
    previewRef.current?.contentWindow?.postMessage(
      { type: PLUGIN_MESSAGE.testSpeak, text: testText.trim() } satisfies PluginTestSpeakMessage,
      '*'
    )
  }, [testText])

  const visibility = useMemo(() => parseLayerVisibility(settings.layerVisibility), [settings.layerVisibility])
  const roleMap = useMemo(() => buildRoleMap(settings), ALL_ROLE_KEYS.map((key) => settings[key]))
  const previewUrl = useMemo(() => buildPreviewUrl(settings, previewAnimate), [settings, previewAnimate])

  const handleVisibilityToggle = useCallback(
    (layer: PsdLayer) => {
      if (layer.forceVisible) return
      const current = layer.path in visibility ? visibility[layer.path] : !layer.hidden
      if (layer.isRadio && !current) {
        // Turning on a radio leaf: turn off sibling radio leaves in same parent group
        const next = { ...visibility, [layer.path]: true }
        for (const other of (psd?.layers ?? [])) {
          if (other.path === layer.path || other.isGroup || !other.isRadio) continue
          if (other.parentPath === layer.parentPath) next[other.path] = false
        }
        update('layerVisibility', JSON.stringify(next))
      } else {
        update('layerVisibility', JSON.stringify({ ...visibility, [layer.path]: !current }))
      }
    },
    [visibility, update, psd]
  )

  const handleGroupVisibilityToggle = useCallback(
    (layer: PsdLayer) => {
      if (layer.forceVisible) return
      const current = layer.path in visibility ? visibility[layer.path] : !layer.hidden
      if (layer.isRadio) {
        // Radio group: turning on deselects sibling radio groups
        const next = { ...visibility, [layer.path]: !current }
        if (!current) {
          for (const other of (psd?.layers ?? [])) {
            if (other.path === layer.path || !other.isGroup || !other.isRadio) continue
            if (other.parentPath === layer.parentPath) next[other.path] = false
          }
        }
        update('layerVisibility', JSON.stringify(next))
      } else {
        update('layerVisibility', JSON.stringify({ ...visibility, [layer.path]: !current }))
      }
    },
    [visibility, update, psd]
  )

  const handleGroupToggle = useCallback((path: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const handleRoleToggle = useCallback(
    (layerPath: string, roleKey: string) => {
      const current = parseLayerPaths(settings[roleKey] ?? '')
      const idx = current.indexOf(layerPath)
      const next = idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, layerPath]
      update(roleKey, JSON.stringify(next))
    },
    [settings, update]
  )

  if (!ready) return null

  const leafLayers = psd
    ? psd.layers.filter((l) => !l.isGroup && l.canvas !== null)
    : []

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
                if (isAncestorCollapsed(l.path, collapsedGroups)) return null
                const depth = l.path.split('/').length - 1

                if (l.isGroup) {
                  const collapsed = collapsedGroups.has(l.path)
                  const isVisible = l.path in visibility ? visibility[l.path] : !l.hidden
                  const ancestorHidden = isAncestorHiddenByVis(l.path, visibility)
                  return (
                    <div key={l.path} className={`layer-item group${ancestorHidden ? ' dimmed' : ''}`} style={{ paddingLeft: depth * 16 }}>
                      {l.forceVisible ? (
                        <input type="checkbox" checked readOnly disabled />
                      ) : l.isRadio ? (
                        <Checkbox
                          size="small"
                          checked={isVisible}
                          onChange={() => handleGroupVisibilityToggle(l)}
                          icon={<RadioButtonUncheckedIcon style={{ fontSize: 14 }} />}
                          checkedIcon={<RadioButtonCheckedIcon style={{ fontSize: 14 }} />}
                          disableRipple
                          sx={{ p: 0, color: '#666', '&.Mui-checked': { color: '#90caf9' } }}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => handleGroupVisibilityToggle(l)}
                        />
                      )}
                      <span className="group-toggle" onClick={() => handleGroupToggle(l.path)}>
                        {collapsed ? '▶' : '▼'}
                      </span>
                      <span className="layer-name" onClick={() => handleGroupToggle(l.path)}>{l.name}</span>
                      {(l.flipX || l.flipY) && (
                        <span className="flip-badge">flip{l.flipX && l.flipY ? 'xy' : l.flipX ? 'x' : 'y'}</span>
                      )}
                    </div>
                  )
                }
                if (!l.canvas) return null
                const isVisible = l.path in visibility ? visibility[l.path] : !l.hidden
                const roles = roleMap[l.path] ?? []
                const ancestorHidden = isAncestorHiddenByVis(l.path, visibility)
                return (
                  <div key={l.path} className={`layer-item leaf${ancestorHidden ? ' dimmed' : ''}`} style={{ paddingLeft: depth * 16 }}>
                    {l.forceVisible ? (
                      <input type="checkbox" checked readOnly disabled />
                    ) : l.isRadio ? (
                      <Checkbox
                        size="small"
                        checked={isVisible}
                        onChange={() => handleVisibilityToggle(l)}
                        icon={<RadioButtonUncheckedIcon style={{ fontSize: 14 }} />}
                        checkedIcon={<RadioButtonCheckedIcon style={{ fontSize: 14 }} />}
                        disableRipple
                        sx={{ p: 0, color: '#666', '&.Mui-checked': { color: '#90caf9' } }}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => handleVisibilityToggle(l)}
                      />
                    )}
                    <span className="layer-name">{l.name}</span>
                    {(l.flipX || l.flipY) && (
                      <span className="flip-badge">flip{l.flipX && l.flipY ? 'xy' : l.flipX ? 'x' : 'y'}</span>
                    )}
                    <div className="chip-select">
                      {roles.map((roleKey) => (
                        <span key={roleKey} className="chip">
                          {ROLE_LABELS[roleKey]}
                          <button
                            className="chip-remove"
                            onClick={() => handleRoleToggle(l.path, roleKey)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {roles.length < ALL_ROLE_KEYS.length && (
                        <select
                          className="chip-add-select"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) handleRoleToggle(l.path, e.target.value)
                          }}
                        >
                          <option value="">+</option>
                          {ALL_ROLE_KEYS.filter((k) => !roles.includes(k)).map((key) => (
                            <option key={key} value={key}>{ROLE_LABELS[key]}</option>
                          ))}
                        </select>
                      )}
                    </div>
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
              ref={previewRef}
              className="preview-iframe"
              src={previewUrl}
              title="プレビュー"
            />
            <div className="test-speak-row">
              <input
                type="text"
                className="test-speak-input"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="テスト発話テキスト"
                onKeyDown={(e) => { if (e.key === 'Enter') handleTestSpeak() }}
              />
              <button className="settings-btn" onClick={handleTestSpeak}>
                話す
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 読み上げ設定 */}
      <VoiceSettings settings={settings} onChange={update} />

      {/* 口パクパラメータ */}
      <div className="settings-section">
        <div className="settings-section-title">口パクパラメータ</div>
        <label className="settings-label">
          しきい値 (0〜1)
          <input
            type="number"
            {...RANGES.threshold}
            value={settings.threshold}
            onChange={(e) => update('threshold', Number(e.target.value))}
          />
        </label>
        <label className="settings-label">
          閉口遅延（フレーム数）
          <input
            type="number"
            {...RANGES.sensitivity}
            value={settings.sensitivity}
            onChange={(e) => update('sensitivity', Number(e.target.value))}
          />
        </label>
        <label className="settings-label">
          口パク速度（遷移フレーム数）
          <input
            type="number"
            {...RANGES.mouthTransitionFrames}
            value={settings.mouthTransitionFrames}
            onChange={(e) => update('mouthTransitionFrames', Number(e.target.value))}
          />
        </label>
      </div>

      {/* 反転設定 */}
      <div className="settings-section">
        <div className="settings-section-title">反転設定 (:flip レイヤー)</div>
        <label className="settings-label settings-label-row">
          <input
            type="checkbox"
            checked={Boolean(settings.flipX)}
            onChange={(e) => update('flipX', e.target.checked ? 1 : 0)}
          />
          左右反転 (:flipx レイヤーを表示)
        </label>
        <label className="settings-label settings-label-row">
          <input
            type="checkbox"
            checked={Boolean(settings.flipY)}
            onChange={(e) => update('flipY', e.target.checked ? 1 : 0)}
          />
          上下反転 (:flipy レイヤーを表示)
        </label>
      </div>

      {/* 目パチパラメータ */}
      <div className="settings-section">
        <div className="settings-section-title">目パチパラメータ</div>
        <label className="settings-label">
          目パチ間隔（秒）
          <input
            type="number"
            {...RANGES.blinkInterval}
            value={settings.blinkInterval}
            onChange={(e) => update('blinkInterval', Number(e.target.value))}
          />
        </label>
        <label className="settings-label">
          目パチ速度（遷移フレーム数）
          <input
            type="number"
            {...RANGES.blinkSpeed}
            value={settings.blinkSpeed}
            onChange={(e) => update('blinkSpeed', Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  )
}
