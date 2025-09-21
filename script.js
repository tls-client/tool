document.addEventListener('DOMContentLoaded', function() {
    // Accordion
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const panel = btn.nextElementSibling;
            panel.style.maxHeight = panel.style.maxHeight ? null : panel.scrollHeight + "px";
        });
    });

    let messageIntervals = [];
    let voteIntervals = [];
    let threadIntervals = [];

    const fetchChannelsBtn = document.getElementById('fetchChannelsBtn');
    const channelIdSelect = document.getElementById('channelId');
    const fetchUsersBtn = document.getElementById('fetchUsersBtn');
    const threadChannelSelect = document.getElementById('threadChannel');

    // ===== ログ関数 =====
    function log(msg, type='info') {
        const logDiv = document.getElementById('log');
        const p = document.createElement('p');
        p.textContent = msg;
        switch(type){
            case 'success': p.style.color = '#43b581'; break;
            case 'error': p.style.color = '#f04747'; break;
            case 'warn': p.style.color = '#faa61a'; break;
            case 'message': p.style.color = '#7289da'; break;
            case 'vote': p.style.color = '#f6e58d'; break;
            case 'thread': p.style.color = '#9b59b6'; break;
            default: p.style.color = '#00ffcc';
        }
        logDiv.appendChild(p);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    // ===== チャンネル取得 =====
    fetchChannelsBtn.addEventListener('click', () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t=>t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g=>g);
        channelIdSelect.innerHTML = '';
        threadChannelSelect.innerHTML = '';
        guildIds.forEach(gid => {
            tokens.forEach(token => {
                fetch(`https://discord.com/api/v9/guilds/${gid}/channels`, {
                    headers:{'Authorization':`Bot ${token}`}
                }).then(res=>res.json()).then(data=>{
                    data.forEach(c=>{
                        const option = document.createElement('option');
                        option.value = c.id;
                        option.textContent = `#${c.name}`;
                        channelIdSelect.appendChild(option);
                        threadChannelSelect.appendChild(option.cloneNode(true));
                    });
                    log(`#${gid} のチャンネル取得完了`, 'success');
                }).catch(e=>log(`チャンネル取得失敗: ${e}`, 'error'));
            });
        });
    });

    // ===== ユーザー取得 =====
    fetchUsersBtn.addEventListener('click', () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t=>t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g=>g);
        guildIds.forEach(gid=>{
            tokens.forEach(token=>{
                fetch(`https://discord.com/api/v9/guilds/${gid}/members`, {
                    headers:{'Authorization':`Bot ${token}`}
                }).then(res=>res.json()).then(data=>{
                    document.getElementById('mentionContent').value = data.map(m=>`<@${m.user.id}>`).join(' ');
                    log(`#${gid} のユーザー取得完了`, 'success');
                }).catch(e=>log(`ユーザー取得失敗: ${e}`, 'error'));
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
                            }).then(res=>{
                                if(res.ok) log(`#${cid} にメッセージ送信成功`, 'message');
                                else log(`#${cid} 送信失敗: ${res.status}`, 'error');
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

    document.getElementById('stopBtn').addEventListener('click', ()=>{
        messageIntervals.forEach(i=>clearInterval(i));
        messageIntervals=[];
        log('メッセージ送信停止', 'warn');
    });

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
                    }).then(res=>{
                        if(res.ok) log(`投票 "${title}" 送信成功`, 'vote');
                        else log(`投票送信失敗: ${res.status}`, 'error');
                    });
                };
                if(interval>0) voteIntervals.push(setInterval(send, interval));
                else send();
            });
        });
    });

    document.getElementById('stopVoteBtn').addEventListener('click', ()=>{
        voteIntervals.forEach(i=>clearInterval(i));
        voteIntervals=[];
        log('投票送信停止', 'warn');
    });

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
                    }).then(res=>{
                        if(res.ok) log(`スレッド "${threadName}" 作成成功`, 'thread');
                        else log(`スレッド作成失敗: ${res.status}`, 'error');
                    });
                };
                if(interval>0) threadIntervals.push(setInterval(send, interval));
                else send();
            });
        });
    });

    document.getElementById('stopThreadBtn').addEventListener('click', ()=>{
        threadIntervals.forEach(i=>clearInterval(i));
        threadIntervals=[];
        log('スレッド送信停止', 'warn');
    });
});
