/** メインプロセスとレンダラー間の IPC チャンネル名 */
export const IPC = {
  connect: 'connect',
  disconnect: 'disconnect',
  stateChange: 'state-change',
  getPlugins: 'get-plugins',
  getPluginPreferences: 'get-plugin-preferences',
  setPluginPreferences: 'set-plugin-preferences',
  getPluginSettings: 'get-plugin-settings',
  setPluginSettings: 'set-plugin-settings',
  getTtsSettings: 'get-tts-settings',
  setTtsSettings: 'set-tts-settings',
  getTtsAdapters: 'get-tts-adapters',
  getTtsAdapterParams: 'get-tts-adapter-params',
  openPluginFolder: 'open-plugin-folder'
} as const
