let messageInterval;
let threadInterval;

async function discordRequest(method, url, token, body) {
  return fetch(url, {
    method: method,
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : null
  });
}

// 全チャンネル取得（複数サーバー対応）
document.getElementById('fetchChannelsBtn').addEventListener('click', async () => {
  const token = document.getElementById('token').value.split('\n')[0].trim();
  const guildIds = document.getElementById('guildId').value.split('\n').map(g=>g.trim()).filter(g=>g);
  const select = document.getElementById('channelId');
  select.innerHTML = '';
  
  for (const guildId of guildIds) {
    try {
      const res = await discordRequest('GET', `https://discord.com/api/v9/guilds/${guildId}/channels`, token);
      const channels = await res.json();
      channels.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.text = `[${guildId}] ${c.name}`;
        select.add(opt);
      });
    } catch(e) { console.log(`Guild ${guildId}取得失敗`, e); }
  }
  alert('全チャンネル取得完了');
});

// 全ユーザー取得 + ランダムメンション（3～8人）
document.getElementById('fetchUsersBtn').addEventListener('click', async () => {
  const token = document.getElementById('token').value.split('\n')[0].trim();
  const guildIds = document.getElementById('guildId').value.split('\n').map(g=>g.trim()).filter(g=>g);
  const mentionArea = document.getElementById('mentionContent');
  let mentions = [];

  for (const guildId of guildIds) {
    try {
      const res = await discordRequest('GET', `https://discord.com/api/v9/guilds/${guildId}/members?limit=1000`, token);
      const members = await res.json();
      
      const count = Math.floor(Math.random() * 6) + 3; // 3～8人
      const shuffled = members.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(count, members.length));
      
      mentions = mentions.concat(selected.map(m => `<@${m.user.id}>${randomString(10)}`));
    } catch(e) { console.log(`Guild ${guildId}ユーザー取得失敗`, e); }
  }

  mentionArea.value = mentions.join(' ');
  alert('ランダムメンション生成完了');
});

function randomString(length){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for(let i=0;i<length;i++){
    result += chars.charAt(Math.floor(Math.random()*chars.length));
  }
  return result;
}

// メッセージ送信開始（マルチトークン + 複数チャンネル対応）
document.getElementById('startBtn').addEventListener('click', ()=>{
  const tokens = document.getElementById('token').value.split('\n').map(t=>t.trim()).filter(t=>t);
  const channelOptions = [...document.getElementById('channelId').options];
  const channels = channelOptions.map(opt => opt.value);
  const message = document.getElementById('messageContent').value;
  const interval = parseInt(document.getElementById('interval').value) || 1000;
  const maxCount = parseInt(document.getElementById('maxCount').value) || 10;

  let count = 0;
  let tokenIndex = 0;
  let channelIndex = 0;

  messageInterval = setInterval(async ()=>{
    if(count >= maxCount){ clearInterval(messageInterval); return; }
    const token = tokens[tokenIndex % tokens.length];
    const channelId = channels[channelIndex % channels.length];
    try
