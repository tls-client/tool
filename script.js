// アコーディオン開閉
document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const content = btn.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
});

// ユーザーID自動取得（サンプル）
document.getElementById('getAllUsersBtn').addEventListener('click', () => {
  const userList = ['123456', '234567', '345678']; // 実際はAPIで取得
  document.getElementById('userList').value = userList.join('\n');
  log('全ユーザーID自動取得完了');
});

// チャンネルID自動取得（サンプル）
document.getElementById('getAllChannelsBtn').addEventListener('click', () => {
  const channelList = ['111', '222', '333']; // 実際はAPIで取得
  document.getElementById('channelInput').value = channelList.join('\n');
  log('全チャンネルID自動取得完了');
});

// 詳細ログ関数
function log(msg) {
  const logArea = document.getElementById('logArea');
  const time = new Date().toLocaleTimeString();
  logArea.value += `[${time}] ${msg}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

// ランダム文字生成
function randomSuffix(min=5,max=10){
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const len = Math.floor(Math.random()*(max-min+1))+min;
  let str = '';
  for(let i=0;i<len;i++){
    str += chars.charAt(Math.floor(Math.random()*chars.length));
  }
  return str;
}

// 送信処理
let sendTimer = null;
document.getElementById('startBtn').addEventListener('click', () => {
  const interval = parseInt(document.getElementById('intervalInput').value);
  const limit = parseInt(document.getElementById('limitInput').value);
  const tokens = document.getElementById('tokenInput').value.split('\n').filter(Boolean);
  const channels = document.getElementById('channelInput').value.split('\n').filter(Boolean);
  const users = document.getElementById('userList').value.split('\n').filter(Boolean);
  const msgContent = document.getElementById('messageInput').value;
  const mentionCount = parseInt(document.getElementById('mentionCount').value);
  const useSuffix = document.getElementById('randomSuffix').checked;

  if(tokens.length===0 || channels.length===0 || users.length===0 || !msgContent){
    alert('必要な情報を入力してください');
    return;
  }

  let count = 0;
  sendTimer = setInterval(() => {
    if(count >= limit){
      clearInterval(sendTimer);
      log('送信完了');
      return;
    }

    // ランダムメンション生成
    let mentions = [];
    for(let i=0;i<mentionCount;i++){
      mentions.push(`<@${users[Math.floor(Math.random()*users.length)]}>`);
    }

    // メッセージ作成
    let finalMsg = msgContent + ' ' + mentions.join(' ');
    if(useSuffix){
      finalMsg += ' ' + randomSuffix();
    }

    // ここで実際の送信処理を呼ぶ（サンプルではログ出力）
    log(`送信(${count+1}): ${finalMsg}`);

    count++;
  }, interval);
});

document.getElementById('stopBtn').addEventListener('click', () => {
  if(sendTimer) {
    clearInterval(sendTimer);
    log('送信停止');
  }
});
