// ========== 初期化 ==========
document.addEventListener('DOMContentLoaded', function() {
  // フォーム履歴の復元
  loadFormHistory();
  
  // 入力カウントの更新
  updateInputCounts();
  
  // トークンマスクの設定
  setupTokenMask();
  
  // スライダーの設定
  setupSliders();
  
  // ボタン状態の更新
  updateSubmitButton();
});

// ========== ユーティリティ関数 ==========
function parseIds(str) {
  return str.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
}

function log(msg, isError = false) {
  const logDiv = document.getElementById('log');
  const el = document.createElement('div');
  el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.style.color = isError ? '#ed4245' : '#3ba55c';
  logDiv.appendChild(el);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function randomStr(len = 16) {
  let s = '';
  while (s.length < len) s += Math.random().toString(36).slice(2);
  return s.slice(0, len);
}

// ========== 入力カウントの更新 ==========
function updateInputCounts() {
  const tokens = parseIds(document.getElementById('tokens').value);
  const channels = parseIds(document.getElementById('channelIds').value);
  const mentions = parseIds(document.getElementById('mentionIds').value);
  
  document.getElementById('tokenCount').textContent = tokens.length;
  document.getElementById('channelCount').textContent = channels.length;
  document.getElementById('mentionCount').textContent = mentions.length;
}

// 入力イベントリスナー
document.getElementById('tokens').addEventListener('input', updateInputCounts);
document.getElementById('channelIds').addEventListener('input', updateInputCounts);
document.getElementById('mentionIds').addEventListener('input', updateInputCounts);

// ========== トークンマスク機能 ==========
function setupTokenMask() {
  const tokensTextarea = document.getElementById('tokens');
  const maskBtn = document.getElementById('tokenMaskToggleBtn');
  const maskIcon = document.getElementById('tokenMaskIcon');
  
  // マスク状態の復元
  let masked = true;
  try {
    const data = JSON.parse(localStorage.getItem('freeze_tool_form') || '{}');
    if (typeof data.tokenMask === 'boolean') masked = data.tokenMask;
  } catch(e) {}
  
  function setTokenMask() {
    if (masked) {
      tokensTextarea.classList.add('token-masked');
      maskIcon.innerHTML = `
        <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-6 0-10-8-10-8a18.4 18.4 0 0 1 5.06-5.94"></path>
        <path d="M1 1l22 22"></path>
        <path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"></path>
        <path d="M12 4c6 0 10 8 10 8a18.4 18.4 0 0 1-5.06 5.94"></path>
      `;
    } else {
      tokensTextarea.classList.remove('token-masked');
      maskIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  }
  
  maskBtn.addEventListener('click', function() {
    masked = !masked;
    setTokenMask();
    saveFormHistory();
  });
  
  setTokenMask();
}

// ========== スライダー機能 ==========
function setupSliders() {
  const mentionLimit = document.getElementById('mentionLimit');
  const mentionLimitValue = document.getElementById('mentionLimitValue');
  
  if (mentionLimit && mentionLimitValue) {
    mentionLimitValue.textContent = mentionLimit.value;
    mentionLimit.addEventListener('input', function() {
      mentionLimitValue.textContent = mentionLimit.value;
      saveFormHistory();
    });
  }
}

// ========== フォーム履歴機能 ==========
const FORM_STORAGE_KEY = 'freeze_tool_form';
const formKeys = [
  'tokens', 'guildId', 'channelIds', 'messageText', 'allmention', 
  'randomize', 'delay', 'limit', 'mentionIds', 'mentionLimit', 
  'randomMention', 'pollTitle', 'pollAnswers', 'pollDuration', 
  'pollInstantEnd', 'pollEnabled', 'threadName', 'threadEnabled', 'tokenMask'
];

function saveFormHistory() {
  const data = {};
  
  for (const key of formKeys) {
    if (key === 'tokenMask') {
      // トークンマスク状態を取得
      const tokensTextarea = document.getElementById('tokens');
      data[key] = tokensTextarea.classList.contains('token-masked');
      continue;
    }
    
    const el = document.getElementById(key);
    if (!el) continue;
    
    if (el.type === 'checkbox') {
      data[key] = el.checked;
    } else {
      data[key] = el.value;
    }
  }
  
  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
}

function loadFormHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(FORM_STORAGE_KEY) || '{}');
    
    for (const key of formKeys) {
      if (key === 'tokenMask') continue;
      
      const el = document.getElementById(key);
      if (!el || data[key] === undefined) continue;
      
      if (el.type === 'checkbox') {
        el.checked = !!data[key];
      } else {
        el.value = data[key];
      }
    }
    
    // スライダー値の表示更新
    const mentionLimit = document.getElementById('mentionLimit');
    const mentionLimitValue = document.getElementById('mentionLimitValue');
    if (mentionLimit && mentionLimitValue && data.mentionLimit !== undefined) {
      mentionLimitValue.textContent = data.mentionLimit;
    }
  } catch (e) {
    console.error('履歴の読み込みに失敗しました:', e);
  }
}

// 入力イベントで履歴を保存
document.querySelectorAll('input, textarea, select').forEach(el => {
  el.addEventListener('input', saveFormHistory);
  if (el.type === 'checkbox') {
    el.addEventListener('change', saveFormHistory);
  }
});

// ========== ボタン状態の更新 ==========
function updateSubmitButton() {
  const tokens = parseIds(document.getElementById('tokens').value);
  const channels = parseIds(document.getElementById('channelIds').value);
  const messageText = document.getElementById('messageText').value.trim();
  const submitBtn = document.getElementById('submitBtn');
  
  submitBtn.disabled = !(tokens.length && channels.length && messageText);
}

document.querySelectorAll('#tokens, #channelIds, #messageText').forEach(el => {
  el.addEventListener('input', updateSubmitButton);
});

// ========== 自動取得機能 ==========
document.getElementById('autoFillChannels').addEventListener('click', async function() {
  const tokens = parseIds(document.getElementById('tokens').value);
  const guildId = document.getElementById('guildId').value.trim();
  
  if (!tokens.length || !guildId) {
    log('トークンとサーバーIDを入力してください', true);
    return;
  }
  
  const btn = this;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '取得中...';
  
  try {
    for (const token of tokens) {
      try {
        const response = await axios.get(`https://discord.com/api/v9/guilds/${guildId}/channels`, {
          headers: { Authorization: token }
        });
        
        if (response.status === 200) {
          const channels = response.data.filter(ch => [0, 2, 5].includes(ch.type));
          const channelIds = channels.map(ch => ch.id);
          
          if (channelIds.length) {
            document.getElementById('channelIds').value = channelIds.join('\n');
            updateInputCounts();
            updateSubmitButton();
            saveFormHistory();
            log(`チャンネルIDを ${channelIds.length}件 取得しました`);
            break;
          }
        }
      } catch (error) {
        // 次のトークンで試す
        continue;
      }
    }
  } catch (error) {
    log('チャンネルIDの取得に失敗しました', true);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

document.getElementById('fetchMentions').addEventListener('click', async function() {
  const tokens = parseIds(document.getElementById('tokens').value);
  const channelIds = parseIds(document.getElementById('channelIds').value);
  
  if (!tokens.length || !channelIds.length) {
    log('トークンとチャンネルIDを入力してください', true);
    return;
  }
  
  const btn = this;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '取得中...';
  
  try {
    const userSet = new Set();
    
    for (const channelId of channelIds.slice(0, 5)) { // 最大5チャンネルまで
      try {
        const response = await axios.get(`https://discord.com/api/v10/channels/${channelId}/messages?limit=50`, {
          headers: { Authorization: tokens[0] }
        });
        
        if (response.status === 200) {
          response.data.forEach(msg => {
            if (msg.author && msg.author.id) {
              userSet.add(msg.author.id);
            }
          });
        }
      } catch (error) {
        // エラーは無視して続行
      }
    }
    
    const userIds = Array.from(userSet);
    document.getElementById('mentionIds').value = userIds.join('\n');
    updateInputCounts();
    saveFormHistory();
    log(`ユーザーIDを ${userIds.length}件 取得しました`);
  } catch (error) {
    log('ユーザーIDの取得に失敗しました', true);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ========== 送信機能 ==========
let isRunning = false;
let abortController = null;

document.getElementById('submitBtn').addEventListener('click', async function() {
  if (isRunning) return;
  
  const tokens = parseIds(document.getElementById('tokens').value);
  const guildId = document.getElementById('guildId').value.trim();
  const channelIds = parseIds(document.getElementById('channelIds').value);
  const messageText = document.getElementById('messageText').value.trim();
  
  if (!tokens.length || !channelIds.length || !messageText) {
    log('必須項目を入力してください', true);
    return;
  }
  
  isRunning = true;
  abortController = new AbortController();
  
  const submitBtn = document.getElementById('submitBtn');
  const stopBtn = document.getElementById('stopSpam');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  
  btnText.style.display = 'none';
  btnLoading.style.display = 'flex';
  submitBtn.disabled = true;
  stopBtn.disabled = false;
  
  // パラメータの取得
  const delay = parseFloat(document.getElementById('delay').value) || 1.0;
  const limit = parseInt(document.getElementById('limit').value) || 0;
  const allmention = document.getElementById('allmention').checked;
  const randomize = document.getElementById('randomize').checked;
  const mentionIds = parseIds(document.getElementById('mentionIds').value);
  const mentionLimit = parseInt(document.getElementById('mentionLimit').value) || 1;
  const randomMention = document.getElementById('randomMention').checked;
  const pollEnabled = document.getElementById('pollEnabled').checked;
  const pollTitle = document.getElementById('pollTitle').value.trim();
  const pollAnswers = parseIds(document.getElementById('pollAnswers').value);
  const pollDuration = parseInt(document.getElementById('pollDuration').value) || 24;
  const pollInstantEnd = document.getElementById('pollInstantEnd').checked;
  const threadEnabled = document.getElementById('threadEnabled').checked;
  const threadName = document.getElementById('threadName').value.trim();
  
  let count = 0;
  const pollSendHistory = [];
  
  try {
    outer: for (let i = 0; ; i++) {
      if (abortController.signal.aborted) break;
      if (limit > 0 && count >= limit) break;
      
      for (const channelId of channelIds) {
        if (abortController.signal.aborted) break outer;
        if (limit > 0 && count >= limit) break outer;
        
        let content = messageText;
        
        // メンション処理
        if (allmention) content += ' @everyone';
        if (mentionIds.length > 0 && randomMention) {
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
        
        const token = tokens[i % tokens.length];
        let success = false;
        let retryCount = 0;
        
        while (!success && retryCount < 3) {
          if (abortController.signal.aborted) break outer;
          
          try {
            if (pollEnabled && pollTitle && pollAnswers.length >= 2) {
              // 投票送信
              const pollData = {
                content: content,
                poll: {
                  question: { text: pollTitle },
                  answers: pollAnswers.map(a => ({ poll_media: { text: a } })),
                  duration: pollDuration
                },
                flags: 0
              };
              
              const response = await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, pollData, {
                headers: { 
                  Authorization: token,
                  'Content-Type': 'application/json'
                },
                signal: abortController.signal
              });
              
              if (response.status === 200) {
                log(`投票送信: ${channelId}`);
                
                if (pollInstantEnd) {
                  const pollId = response.data.id;
                  if (pollId) {
                    // 即時終了処理（非同期）
                    expirePoll(channelId, pollId, token);
                  }
                }
                
                success = true;
                count++;
              }
            } else if (threadEnabled && threadName) {
              // スレッド作成
              const threadData = {
                name: threadName,
                auto_archive_duration: 60,
                type: 11 // パブリックスレッド
              };
              
              const threadResponse = await axios.post(`https://discord.com/api/v10/channels/${channelId}/threads`, threadData, {
                headers: { 
                  Authorization: token,
                  'Content-Type': 'application/json'
                },
                signal: abortController.signal
              });
              
              if (threadResponse.status === 200) {
                const threadId = threadResponse.data.id;
                
                // スレッドにメッセージ送信
                await axios.post(`https://discord.com/api/v10/channels/${threadId}/messages`, { content }, {
                  headers: { 
                    Authorization: token,
                    'Content-Type': 'application/json'
                  },
                  signal: abortController.signal
                });
                
                log(`スレッド作成 & 送信: ${channelId}`);
                success = true;
                count++;
              }
            } else {
              // 通常メッセージ送信
              const response = await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, { content }, {
                headers: { 
                  Authorization: token,
                  'Content-Type': 'application/json'
                },
                signal: abortController.signal
              });
              
              if (response.status === 200) {
                log(`送信成功: ${channelId}`);
                success = true;
                count++;
              }
            }
          } catch (error) {
            if (error.response) {
              if (error.response.status === 429) {
                // レートリミット
                const retryAfter = error.response.data.retry_after || 2;
                log(`レートリミット: ${retryAfter}秒待機`, true);
                
                await new Promise(resolve => {
                  const interval = setInterval(() => {
                    if (abortController.signal.aborted) {
                      clearInterval(interval);
                      resolve();
                    }
                  }, 100);
                  
                  setTimeout(() => {
                    clearInterval(interval);
                    resolve();
                  }, retryAfter * 1000);
                });
                
                retryCount++;
              } else {
                log(`送信失敗: ${error.response.status}`, true);
                break;
              }
            } else if (error.name === 'AbortError') {
              break outer;
            } else {
              log(`エラー: ${error.message}`, true);
              break;
            }
          }
        }
        
        if (abortController.signal.aborted) break outer;
        if (limit > 0 && count >= limit) break outer;
        
        // 遅延処理
        if (delay > 0) {
          await new Promise(resolve => {
            const interval = setInterval(() => {
              if (abortController.signal.aborted) {
                clearInterval(interval);
                resolve();
              }
            }, 100);
            
            setTimeout(() => {
              clearInterval(interval);
              resolve();
            }, delay * 1000);
          });
        }
        
        if (abortController.signal.aborted) break outer;
      }
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      log(`予期せぬエラー: ${error.message}`, true);
    }
  } finally {
    isRunning = false;
    btnText.style.display = 'flex';
    btnLoading.style.display = 'none';
    submitBtn.disabled = false;
    stopBtn.disabled = true;
    log('送信を停止しました');
  }
});

// 投票即時終了関数
async function expirePoll(channelId, pollId, token) {
  try {
    await axios.post(`https://discord.com/api/v9/channels/${channelId}/polls/${pollId}/expire`, {}, {
      headers: { 
        Authorization: token,
        'Content-Type': 'application/json'
      }
    });
    log(`投票即時終了: ${channelId}`);
  } catch (error) {
    log(`投票即時終了失敗: ${channelId}`, true);
  }
}

// ========== 停止機能 ==========
document.getElementById('stopSpam').addEventListener('click', function() {
  if (isRunning && abortController) {
    abortController.abort();
    log('停止信号を送信しました');
  }
});

// ========== サーバー退出機能 ==========
document.getElementById('leaveBtn').addEventListener('click', async function() {
  const tokens = parseIds(document.getElementById('tokens').value);
  const guildId = document.getElementById('guildId').value.trim();
  
  if (!tokens.length || !guildId) {
    log('トークンとサーバーIDを入力してください', true);
    return;
  }
  
  const btn = this;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '退出中...';
  
  try {
    let success = false;
    
    for (const token of tokens) {
      try {
        const response = await axios.delete(`https://discord.com/api/v9/users/@me/guilds/${guildId}`, {
          headers: { Authorization: token }
        });
        
        if (response.status === 204) {
          success = true;
          break;
        }
      } catch (error) {
        // 次のトークンで試す
        continue;
      }
    }
    
    if (success) {
      log('サーバー退出リクエストを送信しました');
    } else {
      log('サーバー退出に失敗しました', true);
    }
  } catch (error) {
    log('サーバー退出中にエラーが発生しました', true);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ========== ログクリア機能 ==========
document.getElementById('clearLog').addEventListener('click', function() {
  document.getElementById('log').innerHTML = '';
});
