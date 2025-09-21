let messageInterval;

// 共通：入力値取得
const getGuildIds = () => {
  return document.getElementById('guildId').value
    .split(/\r?\n/)
    .map(g => g.trim())
    .filter(g => g.length > 0);
};
const getTokens = () => {
  return document.getElementById('token').value
    .split(/\r?\n/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
};

// ランダム文字列生成
function randomString(length = 10){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for(let i=0;i<length;i++){
    result += chars.charAt(Math.floor(Math.random()*chars.length));
  }
  return result;
}

// 全チャンネル取得
document.getElementById('fetchChannelsBtn').addEventListener('click', () => {
  const tokens = getTokens();
  const guildIds = getGuildIds();
  const channelSelect = document.getElementById('channelId');
  const threadSelect = document.getElementById('threadChannel');
  channelSelect.innerHTML = '';
  threadSelect.innerHTML = '';

  if(guildIds.length === 0){ alert("サーバーIDを入力してください"); return; }

  guildIds.forEach(guildId => {
    tokens.forEach(token => {
      fetch(`https://discord.com/api/v9/guilds/${guildId}/channels`, {
        headers: { 'Authorization': `Bot ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if(!Array.isArray(data)) return;
        data.forEach(c => {
          const option = document.createElement('option');
          option.value = c.id;
          option.textContent = `#${c.name}`;
          channelSelect.appendChild(option);
          threadSelect.appendChild(option.cloneNode(true));
        });
      }).catch(e => console.error(e));
    });
  });
  alert("チャンネル取得完了");
});

// 全ユーザー取得 + ランダムメンション生成
document.getElementById('fetchUsersBtn').addEventListener('click', () => {
  const tokens = getTokens();
  const guildIds = getGuildIds();
  const mentionArea = document.getElementById('mentionContent');
  let mentions = [];

  guildIds.forEach(guildId => {
    tokens.forEach(token => {
      fetch(`https://discord.com/api/v9/guilds/${guildId}/members?limit=1000`, {
        headers: { 'Authorization': `Bot ${token}` }
      })
      .then(res => res.json())
      .then(members => {
        if(!Array.isArray(members)) return;
        const count = Math.floor(Math.random() * 6) + 3; // 3～8人
        const shuffled = members.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        selected.forEach(m => {
          let mention = `<@${m.user.id}>`;
          if(document.getElementById('addRandomSuffix').checked){
            mention += randomString(10);
          }
          mentions.push(mention);
        });
        mentionArea.value = mentions.join(' ');
      }).catch(e => console.error(e));
    });
  });
  alert("ランダムメンション生成完了");
});

// メッセージ送信開始
document.getElementById('startBtn').addEventListener('click', ()=>{
  const tokens = getTokens();
  const channelOptions = [...document.getElementById('channelId').options];
  const channels = channelOptions.map(opt => opt.value);
  const message = document.getElementById('messageContent').value;
  const interval = parseInt(document.getElementById('interval').value) || 1000;
  const maxCount = parseInt(document.getElementById('maxCount').value) || 10;
  let count = 0;
  let tokenIndex = 0;
  let channelIndex = 0;

  messageInterval = setInterval(()=>{
    if(count >= maxCount){ clearInterval(messageInterval); return; }
    const token = tokens[tokenIndex % tokens.length];
    const channelId = channels[channelIndex % channels.length];
    let content = message + " " + document.getElementById('mentionContent').value;

    fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({content})
    }).catch(e=>console.error(e));

    count++;
    tokenIndex++;
    channelIndex++;
  }, interval);
});

// メッセージ送信停止
document.getElementById('stopBtn').addEventListener('click', ()=>{
  clearInterval(messageInterval);
});

// スレッド作成
document.getElementById('createThreadBtn').addEventListener('click', ()=>{
  const tokens = getTokens();
  const channelId = document.getElementById('threadChannel').value;
  const threadName = document.getElementById('threadName').value;
  if(!channelId || !threadName){ alert("チャンネルとスレッド名を入力"); return; }

  tokens.forEach(token=>{
    fetch(`https://discord.com/api/v9/channels/${channelId}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: threadName, type: 11 }) // type:11 → public thread
    }).catch(e=>console.error(e));
  });
});
