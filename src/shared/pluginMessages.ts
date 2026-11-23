/** 設定画面・プレビューとの postMessage 種別（外部プラグインとの公開プロトコル） */
export const PLUGIN_MESSAGE = {
  ready: 'nicomview:ready',
  settingsInit: 'nicomview:settings-init',
  settingsUpdate: 'nicomview:settings-update',
  testSpeak: 'nicomview:test-speak'
} as const
