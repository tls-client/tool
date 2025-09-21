document.addEventListener('DOMContentLoaded', function() {
    // Accordion
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.nextElementSibling;
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        });
    });

    let messageIntervals = [];
    let voteIntervals = [];
    let threadIntervals = [];

    const fetchChannelsBtn = document.getElementById('fetchChannelsBtn');
    const channelIdSelect = document.getElementById('channelId');
    const fetchUsersBtn = document.getElementById('fetchUsersBtn');
    const threadChannelSelect = document.getElementById('threadChannel');

    // ===== チャンネル取得 =====
    fetchChannelsBtn.addEventListener('click', () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t=>t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g=>g);
        channelIdSelect.innerHTML = '';
        threadChannelSelect.innerHTML = '';
        guildIds.forEach(guildId=>{
            tokens.forEach(token=>{
                fetch(`https://discord.com/api/v9/guilds/${guildId}/channels`, {
                    headers:{'Authorization':`Bot ${token}`}
                }).then(res=>res.json()).then(data=>{
                    data.forEach(c=>{
                        const option = document.createElement('option');
                        option.value = c.id;
                        option.textContent = `#${c.name}`;
                        channelIdSelect.appendChild(option);
                        threadChannelSelect.appendChild(option.cloneNode(true));
                    });
                });
            });
        });
    });

    // ===== ユーザー取得 =====
    fetchUsersBtn.addEventListener('click', () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t=>t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g=>g);
        guildIds.forEach(guildId=>{
            tokens.forEach(token=>{
                fetch(`https://discord.com/api/v9/guilds/${guildId}/members`, {
                    headers:{'Authorization':`Bot ${token}`}
                }).then(res=>res.json()).then(data=>{
                    document.getElementById('mentionContent').value = data.map(m=>`<@${m.user.id}>`).join(' ');
                });
            });
        });
    });

    // ===== メッセージ送信 =====
    document.getElementById('startBtn').addEventListener('click', ()=>{
        const tokens = document.getElementById('token').value.split('\n').filter(t=>t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g=>g);
        const channelIds = [document.getElementById('channelId').value];
        const msg = document.getElementById('messageContent').value;
        const mentionCount = parseInt(document.getElementById('randomMentionCount').value) || 0;
        const appendRandomStr = document.getElementById('appendRandomStr').checked;
        const interval = parseInt(document.getElementById('interval').value) || 0;
        const maxCount = parseInt(document.getElementById('maxCount').value) || 0;

        guildIds.forEach(gid=>{
            tokens.forEach(token=>{
                channelIds.forEach(cid=>{
                    fetch(`https://discord.com/api/v9/guilds/${gid}/members`, {headers:{'Authorization':`Bot ${token}`}})
                    .then(res=>res.json()).then(data=>{
                        const users = data.map(u=>u.user.id);
                        let count = 0;
                        const send = ()=>{
                            if(maxCount>0 && count>=maxCount) return;
                            let finalMsg = msg;
                            if(appendRandomStr) finalMsg += ' '+Math.random().toString(36).substring(2,12);
                            if(mentionCount>0){
                                const mentions = Array.from({length:mentionCount}, ()=>users[Math.floor(Math.random()*users.length)]);
                                finalMsg += ' '+mentions.map(id=>`<@${id}>`).join(' ');
                            }
                            fetch(`https://discord.com/api/v9/channels/${cid}/messages`, {
                                method:'POST',
                                headers:{'Authorization':`Bot ${token}`,'Content-Type':'application/json'},
                                body:JSON.stringify({content:finalMsg})
                            });
                            count++;
                        };
                        if(interval>0) messageIntervals.push(setInterval(send, interval));
                        else send();
                    });
                });
            });
        });
    });

    document.getElementById('stopBtn').addEventListener('click', ()=>{messageIntervals.forEach(i=>clearInterval(i)); messageIntervals=[];});

    // ===== 投票送信 =====
    document.getElementById('startVoteBtn').addEventListener('click', ()=>{
        const tokens = document.getElementById('token').value.split('\n').filter(t=>t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g=>g);
        const cid = document.getElementById('channelId').value;
        const title = document.getElementById('voteTitle').value;
        const options = document.getElementById('voteOptions').value.split('\n').filter(o=>o);
        const duration = document.getElementById('voteDuration').value;
        const endNow = document.getElementById('voteEndNow').checked;
        const interval = parseInt(document.getElementById('voteInterval').value) || 0;

        guildIds.forEach(gid=>{
            tokens.forEach(token=>{
                const send = ()=>{
                    fetch(`https://discord.com/api/v9/channels/${cid}/messages`, {
                        method:'POST',
                        headers:{'Authorization':`Bot ${token}`,'Content-Type':'application/json'},
                        body:JSON.stringify({content:title,embeds:[{title:title,description:options.join('\n'),footer:{text:endNow?'Vote ends now':'Vote ends in '+duration+' minutes'}}]})
                    });
                };
                if(interval>0) voteIntervals.push(setInterval(send, interval));
                else send();
            });
        });
    });

    document.getElementById('stopVoteBtn').addEventListener('click', ()=>{voteIntervals.forEach(i=>clearInterval(i)); voteIntervals=[];});

    // ===== スレッド送信 =====
    document.getElementById('startThreadBtn').addEventListener('click', ()=>{
        const tokens = document.getElementById('token').value.split('\n').filter(t=>t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g=>g);
        const cid = document.getElementById('threadChannel').value;
        const threadName = document.getElementById('threadName').value;
        const mention = document.getElementById('mentionContent').value;
        const interval = parseInt(document.getElementById('threadInterval').value) || 0;

        guildIds.forEach(gid=>{
            tokens.forEach(token=>{
                const send = ()=>{
                    fetch(`https://discord.com/api/v9/channels/${cid}/messages`, {
                        method:'POST',
                        headers:{'Authorization':`Bot ${token}`,'Content-Type':'application/json'},
                        body:JSON.stringify({content:mention,embeds:[{title:threadName,description:mention}]})
                    });
                };
                if(interval>0) threadIntervals.push(setInterval(send, interval));
                else send();
            });
        });
    });

    document.getElementById('stopThreadBtn').addEventListener('click', ()=>{threadIntervals.forEach(i=>clearInterval(i)); threadIntervals=[];});
});
