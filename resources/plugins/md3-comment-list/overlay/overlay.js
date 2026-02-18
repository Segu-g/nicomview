;(function () {
  'use strict'

  const WS_URL = 'ws://localhost:3940'
  const RECONNECT_INTERVAL = 5000
  const MAX_COMMENTS = 200

  const listEl = document.getElementById('comment-list')
  let ws = null
  let autoScroll = true

  listEl.addEventListener('scroll', function () {
    var threshold = 50
    autoScroll = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < threshold
  })

  function connect() {
    ws = new WebSocket(WS_URL)

    ws.addEventListener('open', function () {
      console.log('[NicomView] WebSocket connected')
    })

    ws.addEventListener('message', function (event) {
      try {
        var msg = JSON.parse(event.data)
        addComment(msg.event, msg.data)
      } catch (e) {
        console.error('[NicomView] Failed to parse message:', e)
      }
    })

    ws.addEventListener('close', function () {
      console.log('[NicomView] Disconnected, reconnecting...')
      ws = null
      setTimeout(connect, RECONNECT_INTERVAL)
    })

    ws.addEventListener('error', function () {
      if (ws) ws.close()
    })
  }

  function addComment(eventType, data) {
    var el = document.createElement('div')
    el.className = 'comment-item'

    switch (eventType) {
      case 'comment':
        var name = data.userName || data.userId || '匿名'
        el.innerHTML =
          '<span class="username">' + escapeHtml(name) + '</span>' +
          '<span class="content">' + escapeHtml(data.content || '') + '</span>'
        break

      case 'gift':
        el.className += ' gift'
        var giftName = data.userName || '匿名'
        var label = (data.itemName || 'ギフト') + (data.point ? ' ' + data.point + 'pt' : '')
        el.innerHTML =
          '<span class="icon">🎁</span>' +
          '<span class="content">' + escapeHtml(giftName) + '</span>' +
          '<span class="chip">' + escapeHtml(label) + '</span>'
        break

      case 'notification':
        el.className += ' notification'
        el.innerHTML =
          '<span class="icon">ℹ️</span>' +
          '<span class="content">' + escapeHtml(data.message || JSON.stringify(data)) + '</span>'
        break

      case 'operatorComment':
        el.className += ' operator'
        el.innerHTML =
          '<span class="icon">📢</span>' +
          '<span class="content">' + escapeHtml(data.content || JSON.stringify(data)) + '</span>'
        break

      case 'emotion':
        el.className += ' emotion'
        el.innerHTML =
          '<span class="icon">😄</span>' +
          '<span class="content">' + escapeHtml(data.content || data.id || 'エモーション') + '</span>'
        break

      default:
        return
    }

    listEl.appendChild(el)

    // 上限超えたら古いものを削除
    while (listEl.childElementCount > MAX_COMMENTS) {
      listEl.removeChild(listEl.firstElementChild)
    }

    if (autoScroll) {
      listEl.scrollTop = listEl.scrollHeight
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  connect()
})()
