document.addEventListener('DOMContentLoaded', () => {

    // ===== アコーディオン =====
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const panel = btn.nextElementSibling;
            panel.style.maxHeight = panel.style.maxHeight ? null : panel.scrollHeight + 'px';
        });
    });

    // ===== Interval管理 =====
    const intervals = { message: [], vote: [], thread: [] };
    const startInterval = (type, fn, interval) => interval > 0 ? intervals[type].push(setInterval(fn, interval)) : fn();
    const stopInterval = type => { intervals[type].forEach(i => clearInterval(i)); intervals[type] = []; };

    // ===== ログ =====
    function log(msg) {
        const logDiv = document.getElementById('log');
        logDiv.innerHTML += msg + '<br>';
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    // ===== API共通取得 =====
    async function fetchGuildData(url, tokens, guildIds) {
        let results = [];
        for (const guildId of guildIds) {
            for (const token of tokens) {
                try {
                    const res = await fetch(url.replace('{guildId}', guildId), { headers: { 'Authorization': `Bot ${token}` } });
                    const data = await res.json();
                    results.push(...data);
                    log(`取得成功: ${guildId}`);
                } catch (e) {
                    log(`取得失敗: ${guildId}`);
                }
            }
        }
        return results;
    }

    // ===== チャンネル取得 =====
    document.getElementById('fetchChannelsBtn').addEventListener('click', async () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const channelSelect = document.getElementById('channelSelect');
        const threadChannel = document.getElementById('threadChannel');
        channelSelect.innerHTML = '';
        threadChannel.innerHTML = '';

        for (const guildId of guildIds) {
            const channels = await fetchGuildData(`https://discord.com/api/v9/guilds/{guildId}/channels`, tokens, [guildId]);
            channels.forEach(c => {
                const option = document.createElement('option');
                option.value = c.id;
                option.textContent = `#${c.name}`;
                channelSelect.appendChild(option);
                threadChannel.appendChild(option.cloneNode(true));
            });
        }
    });

    // ===== ユーザー取得 =====
    document.getElementById('fetchAllUsersBtn').addEventListener('click', async () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const allUsers = document.getElementById('allUsersMentions');
        let users = [];

        for (const guildId of guildIds) {
            const members = await fetchGuildData(`https://discord.com/api/v9/guilds/{guildId}/members?limit=1000`, tokens, [guildId]);
            users.push(...members.map(m => m.user.id));
        }
        allUsers.value = users.join('\n');
        log(`ユーザー取得完了: ${users.length}人`);
    });

    // ===== メッセージ作成 =====
    function createMessage(msg, mentionCount, users, appendRandomStr) {
        let finalMsg = msg;
        if (appendRandomStr) finalMsg += ' ' + Math.random().toString(36).substring(2, 12);
        if (users.length > 0 && mentionCount > 0) {
            const mentions = Array.from({ length: mentionCount }, () => `<@${users[Math.floor(Math.random() * users.length)]}>`);
            finalMsg += ' ' + mentions.join(' ');
        }
        return finalMsg;
    }

    // ===== メッセージ送信 =====
    function sendMessage(token, channelId, content) {
        fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        }).then(() => log(`送信: ${content.substring(0,30)}...`))
          .catch(e => log(`送信失敗: ${e}`));
    }

    document.getElementById('startBtn').addEventListener('click', async () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const channelIds = document.getElementById('channelIdNumber').value.split('\n').filter(c => c);
        const msg = document.getElementById('messageContent').value;
        const mentionCount = parseInt(document.getElementById('randomMentionCount').value) || 0;
        const appendRandomStr = document.getElementById('appendRandomStr').checked;
        const interval = parseInt(document.getElementById('interval').value) || 0;
        const maxCount = parseInt(document.getElementById('maxCount').value) || 0;

        const users = document.getElementById('allUsersMentions').value.split('\n').filter(u => u);

        for (const gid of guildIds) {
            for (const token of tokens) {
                for (const channelId of channelIds) {
                    let count = 0;
                    const send = () => {
                        if (maxCount > 0 && count >= maxCount) return;
                        sendMessage(token, channelId, createMessage(msg, mentionCount, users, appendRandomStr));
                        count++;
                    };
                    startInterval('message', send, interval);
                }
            }
        }
    });

    document.getElementById('stopBtn').addEventListener('click', () => stopInterval('message'));

    // ===== 投票送信 =====
    document.getElementById('startVoteBtn').addEventListener('click', () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const channelIds = document.getElementById('channelIdNumber').value.split('\n').filter(c => c);
        const title = document.getElementById('voteTitle').value;
        const options = document.getElementById('voteOptions').value.split('\n').filter(o => o);
        const duration = document.getElementById('voteDuration').value;
        const endNow = document.getElementById('voteEndNow').checked;
        const interval = parseInt(document.getElementById('voteInterval').value) || 0;

        for (const gid of guildIds) {
            for (const token of tokens) {
                for (const channelId of channelIds) {
                    const send = () => sendMessage(token, channelId, title + '\n' + options.join('\n') + '\n' + (endNow ? 'Vote ends now' : 'Vote ends in ' + duration + ' minutes'));
                    startInterval('vote', send, interval);
                }
            }
        }
    });
    document.getElementById('stopVoteBtn').addEventListener('click', () => stopInterval('vote'));

    // ===== スレッド送信 =====
    document.getElementById('startThreadBtn').addEventListener('click', () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const channelIds = document.getElementById('channelIdNumber').value.split('\n').filter(c => c);
        const threadName = document.getElementById('threadName').value;
        const mention = document.getElementById('mentionContent').value;
        const interval = parseInt(document.getElementById('threadInterval').value) || 0;

        for (const gid of guildIds) {
            for (const token of tokens) {
                for (const channelId of channelIds) {
                    const send = () => sendMessage(token, channelId, mention + '\n' + threadName);
                    startInterval('thread', send, interval);
                }
            }
        }
    });
    document.getElementById('stopThreadBtn').addEventListener('click', () => stopInterval('thread'));

});
