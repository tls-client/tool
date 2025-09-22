// アコーディオン開閉処理
document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const content = btn.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
});

// 投票パネル
document.getElementById('start-poll').addEventListener('click', () => {
  const question = document.getElementById('poll-question').value;
  const options = document.getElementById('poll-options').value.split('\n').filter(o => o);
  const duration = parseInt(document.getElementById('poll-duration').value) || 60;

  if (!question || options.length === 0) {
    alert('質問と選択肢を入力してください');
    return;
  }

  log(`投票開始: ${question} (${options.join(', ')}) 時間: ${duration}s`);
  // 実際の投票処理はここに組み込み可能
});

document.getElementById('stop-poll').addEventListener('click', () => {
  log('投票停止');
});

// スレッドパネル
document.getElementById('create-thread').addEventListener('click', () => {
  const threadName = document.getElementById('thread-name').value;
  const channels = document.getElementById('thread-channel').value.split('\n').filter(c => c);

  if (!threadName || channels.length === 0) {
    alert('スレッド名とチャンネルIDを入力してください');
    return;
  }

  log(`スレッド作成: ${threadName} チャンネル: ${channels.join(', ')}`);
  // 実際のスレッド作成処理はここに組み込み可能
});

document.getElementById('delete-thread').addEventListener('click', () => {
  const threadName = document.getElementById('thread-name').value;
  if (!threadName) {
    alert('削除するスレッド名を入力してください');
    return;
  }

  log(`スレッド削除: ${threadName}`);
  // 実際の削除処理はここに組み込み可能
});

// ログパネル
function log(message) {
  const logArea = document.getElementById('log-output');
  const time = new Date().toLocaleTimeString();
  logArea.value += `[${time}] ${message}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

document.getElementById('clear-log').addEventListener('click', () => {
  document.getElementById('log-output').value = '';
});

document.getElementById('export-log').addEventListener('click', () => {
  const logText = document.getElementById('log-output').value;
  const blob = new Blob([logText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'log.txt';
  a.click();
  URL.revokeObjectURL(url);
});
