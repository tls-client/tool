// ページ読み込み時にすべてのパネルを閉じる
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('open');
  });
});

// パネル開閉機能
document.querySelectorAll('.panel-header').forEach(header => {
  header.addEventListener('click', () => {
    header.parentElement.classList.toggle('open');
  });
});

// ユーティリティ関数
function parseIds(str) {
  return str.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
}

function log(msg, isError = false) {
  const logDiv = document.getElementById('log');
  const el = document.createElement('div');
  el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.style.color = isError ? '#ff4444' : '#0f0';
  logDiv.appendChild(el);
  logDiv.scrollTop = logDiv.scrollHeight;
}

// 自動取得機能
document.getElementById('autoFillChannels').addEventListener('click', async function() {
  const tokens = parseIds(document.getElementById('tokens').value);
  const guildId = document.getElementById('guildId').value.trim();
  
  if (!tokens.length || !guildId) {
    log('トークンとサーバーIDを入力してください', true);
    return;
  }

  for (const token of tokens) {
    try {
      const response = await fetch(`https://discord.com/api/v9/guilds/${guildId}/channels`, {
        headers: { Authorization: token }
      });
      
      if (response.ok) {
        const channels = await response.json();
        const textChannelIds = channels
          .filter(ch => [0, 2, 5].includes(ch.type))
          .map(ch => ch.id);
        
        document.getElementById('channelIds').value = textChannelIds.join('\n');
        log(`チャンネルIDを ${textChannelIds.length}件 取得しました`);
        return;
      }
    } catch (error) {
      continue;
    }
  }
  log('チャンネル取得に失敗しました', true);
});

document.getElementById('fetchMentions').addEventListener('click', async function() {
  const tokens = parseIds(document.getElementById('tokens').value);
  const channelIds = parseIds(document.getElementById('channelIds').value);
  
  if (!tokens.length || !channelIds.length) {
    log('トークンとチャンネルIDを入力してください', true);
    return;
  }

  const userSet = new Set();
  
  for (const channelId of channelIds.slice(0, 3)) {
    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=50`, {
        headers: { Authorization: tokens[0] }
      });
      
      if (response.ok) {
        const messages = await response.json();
        messages.forEach(msg => {
          if (msg.author && msg.author.id) {
            userSet.add(msg.author.id);
          }
        });
      }
    } catch (error) {
      // エラーは無視
    }
  }
  
  const userIds = Array.from(userSet);
  document.getElementById('mentionIds').value = userIds.join('\n');
  log(`ユーザーIDを ${userIds.length}件 取得しました`);
});

// 送信機能
let isRunning = false;
let abortController = new AbortController();

document.getElementById('submitBtn').addEventListener('click', async function() {
  if (isRunning) return;
  
  const tokens = parseIds(document.getElementById('tokens').value);
  const channelIds = parseIds(document.getElementById('channelIds').value);
  const messageText = document.getElementById('messageText').value.trim();
  
  if (!tokens.length || !channelIds.length || !messageText) {
    log('必須項目を入力してください', true);
    return;
  }

  isRunning = true;
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('stopSpam').disabled = false;
  abortController = new AbortController();
  
  const delay = parseInt(document.getElementById('delay').value) || 1000;
  const limit = parseInt(document.getElementById('limit').value) || 0;
  const allmention = document.getElementById('allmention').checked;
  const randomize = document.getElementById('randomize').checked;
  const mentionIds = parseIds(document.getElementById('mentionIds').value);
  const mentionLimit = parseInt(document.getElementById('mentionLimit').value) || 1;

  let count = 0;
  
  while (!abortController.signal.aborted && (limit === 0 || count < limit)) {
    for (const channelId of channelIds) {
      if (abortController.signal.aborted) break;
      
      let content = messageText;
      
      // メンション処理
      if (allmention) content += ' @everyone';
      if (mentionIds.length > 0) {
        const shuffled = [...mentionIds].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(mentionLimit, shuffled.length));
        content += ' ' + selected.map(id => `<@${id}>`).join(' ');
      }
      
      // ランダム文字追加
      if (randomize) {
        const randomLength = Math.floor(Math.random() * 6) + 5; // 5-10文字
        const randomChars = Math.random().toString(36).substring(2, 2 + randomLength);
        content += ' ' + randomChars;
      }

      try {
        const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': tokens[count % tokens.length],
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content }),
          signal: abortController.signal
        });

        if (response.ok) {
          log(`送信成功: ${channelId}`);
          count++;
        } else if (response.status === 429) {
          const data = await response.json();
          const waitTime = data.retry_after * 1000;
          log(`レートリミット: ${waitTime}ms待機`, true);
          await new Promise(r => setTimeout(r, waitTime));
        } else {
          log(`送信失敗: ${response.status}`, true);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          log(`エラー: ${error.message}`, true);
        }
        break;
      }

      if (abortController.signal.aborted) break;
      if (limit > 0 && count >= limit) break;
      
      await new Promise(r => setTimeout(r, delay));
    }
  }

  isRunning = false;
  document.getElementById('submitBtn').disabled = false;
  document.getElementById('stopSpam').disabled = true;
  log('送信を停止しました');
});

document.getElementById('stopSpam').addEventListener('click', function() {
  if (isRunning) {
    abortController.abort();
    log('停止信号を送信しました');
  }
});
