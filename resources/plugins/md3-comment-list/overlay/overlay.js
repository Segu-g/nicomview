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

  function buildIconHtml(data) {
    if (data.userIcon) {
      return '<img class="user-icon" src="' + escapeAttr(data.userIcon) + '" alt="" />'
    }
    return ''
  }

  function addComment(eventType, data) {
    var el = document.createElement('div')
    el.className = 'comment-item'
    var iconHtml = buildIconHtml(data)

    switch (eventType) {
      case 'comment':
        var name = data.userName || data.userId || '匿名'
        el.innerHTML =
          iconHtml +
          '<div class="comment-body">' +
          '<span class="username">' + escapeHtml(name) + '</span>' +
          '<span class="content">' + escapeHtml(data.content || '') + '</span>' +
          '</div>'
        break

      case 'gift':
        el.className += ' gift'
        var giftName = data.userName || '匿名'
        var label = (data.itemName || 'ギフト') + (data.point ? ' ' + data.point + 'pt' : '')
        el.innerHTML =
          iconHtml +
          '<div class="comment-body">' +
          '<span class="icon">🎁</span>' +
          '<span class="content">' + escapeHtml(giftName) + '</span>' +
          '<span class="chip">' + escapeHtml(label) + '</span>' +
          '</div>'
        break

      case 'notification':
        el.className += ' notification'
        el.innerHTML =
          '<div class="comment-body">' +
          '<span class="icon">ℹ️</span>' +
          '<span class="content">' + escapeHtml(data.message || JSON.stringify(data)) + '</span>' +
          '</div>'
        break

      case 'operatorComment':
        el.className += ' operator'
        el.innerHTML =
          '<div class="comment-body">' +
          '<span class="icon">📢</span>' +
          '<span class="content">' + escapeHtml(data.content || JSON.stringify(data)) + '</span>' +
          '</div>'
        break

      case 'emotion':
        el.className += ' emotion'
        el.innerHTML =
          '<div class="comment-body">' +
          '<span class="icon">😄</span>' +
          '<span class="content">' + escapeHtml(data.content || data.id || 'エモーション') + '</span>' +
          '</div>'
        break

      default:
        return
    }

    if (data.isHistory) {
      el.className += ' history'
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

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  connect()
})()
