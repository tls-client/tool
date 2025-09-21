let messageInterval;
let threadInterval;

// 全チャンネル取得
document.getElementById('fetchChannelsBtn').addEventListener('click', () => {
  const channelSelect = document.getElementById('channelId');
  channelSelect.innerHTML = '';
  const channels = ['general','bot','random']; 
  channels.forEach(c=>{
    const opt=document.createElement('option'); opt.value=c; opt.text=c; channelSelect.add(opt);
  });
  alert('チャンネル取得完了');
});

// 全ユーザー取得 + ランダムメンション生成
document.getElementById('fetchUsersBtn').addEventListener('click', () => {
  const mentionContent = document.getElementById('mentionContent');
  const users = ['User1','User2','User3','User4','User5'];
  let mentions = users.map(u => `@${u}${randomString(10)}`);
  mentionContent.value = mentions.join(' ');
  alert('ユーザー取得・ランダムメンション生成完了');
});

// ランダム文字列生成
function randomString(length){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for(let i=0;i<length;i++){
    result += chars.charAt(Math.floor(Math.random()*chars.length));
  }
  return result;
}

// メッセージ送信開始
document.getElementById('startBtn').addEventListener('click', ()=>{
  const interval = parseInt(document.getElementById('interval').value)||1000;
  const maxCount = parseInt(document.getElementById('maxCount').value)||10;
  let count = 0;
  messageInterval = setInterval(()=>{
    if(count>=maxCount){ clearInterval(messageInterval); return; }
    console.log('メッセージ送信', document.getElementById('messageContent').value);
    count++;
  }, interval);
});

// メッセージ送信停止
document.getElementById('stopBtn').addEventListener('click', ()=>{
  clearInterval(messageInterval);
  alert('メッセージ送信停止');
});

// スレッド送信開始
document.getElementById('startThreadBtn').addEventListener('click', ()=>{
  threadInterval = setInterval(()=>{
    console.log('スレッド送信', document.getElementById('mentionContent').value);
  },1000);
});

// スレッド送信停止
document.getElementById('stopThreadBtn').addEventListener('click', ()=>{
  clearInterval(threadInterval);
  alert('スレッド送信停止');
});
