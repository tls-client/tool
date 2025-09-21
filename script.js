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

    // ===== 共通API取得 =====
    async function fetchGuildData(url, tokens, guildIds) {
        let results = [];
        for (const guildId of guildIds) {
            for (const token of tokens) {
                const res = await fetch(`${url}/${guildId}`, { headers: { 'Authorization': `Bot ${token}` } });
                const data = await res.json();
                results.push(...data);
            }
        }
        return results;
    }

    // ===== チャンネル取得 =====
    document.getElementById('fetchChannelsBtn').addEventListener('click', async () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const channelIdSelect = document.getElementById('channelId');
        const threadChannelSelect = document.getElementById('threadChannel');
        channelIdSelect.innerHTML = '';
        threadChannelSelect.innerHTML = '';

        const channels = await fetchGuildData('https://discord.com/api/v9/guilds/{guildId}/channels'.replace('{guildId}', ''), tokens, guildIds);
        channels.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = `#${c.name}`;
            channelIdSelect.appendChild(option);
            threadChannelSelect.appendChild(option.cloneNode(true));
        });
    });

    // ===== ユーザー取得 =====
    document.getElementById('fetchUsersBtn').addEventListener('click', async () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const mentionArea = document.getElementById('mentionContent');

        const members = await fetchGuildData('https://discord.com/api/v9/guilds/{guildId}/members'.replace('{guildId}', ''), tokens, guildIds);
        mentionArea.value = members.map(m => `<@${m.user.id}>`).join(' ');
    });

    // ===== メッセージ送信 =====
    function createMessage(msg, mentionCount, users, appendRandomStr) {
        let finalMsg = msg;
        if (appendRandomStr) finalMsg += ' ' + Math.random().toString(36).substring(2, 12);
        if (mentionCount > 0) {
            const mentions = Array.from({ length: mentionCount }, () => users[Math.floor(Math.random() * users.length)]);
            finalMsg += ' ' + mentions.map(id => `<@${id}>`).join(' ');
        }
        return finalMsg;
    }

    function sendMessage(token, channelId, content) {
        fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
    }

    document.getElementById('startBtn').addEventListener('click', async () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const channelId = document.getElementById('channelId').value;
        const msg = document.getElementById('messageContent').value;
        const mentionCount = parseInt(document.getElementById('randomMentionCount').value) || 0;
        const appendRandomStr = document.getElementById('appendRandomStr').checked;
        const interval = parseInt(document.getElementById('interval').value) || 0;
        const maxCount = parseInt(document.getElementById('maxCount').value) || 0;

        for (const gid of guildIds) {
            for (const token of tokens) {
                const members = await fetchGuildData(`https://discord.com/api/v9/guilds/${gid}/members`, [token], [gid]);
                const users = members.map(u => u.user.id);
                let count = 0;

                const send = () => {
                    if (maxCount > 0 && count >= maxCount) return;
                    sendMessage(token, channelId, createMessage(msg, mentionCount, users, appendRandomStr));
                    count++;
                };
                startInterval('message', send, interval);
            }
        }
    });

    document.getElementById('stopBtn').addEventListener('click', () => stopInterval('message'));

    // ===== 投票送信 =====
    document.getElementById('startVoteBtn').addEventListener('click', () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const channelId = document.getElementById('channelId').value;
        const title = document.getElementById('voteTitle').value;
        const options = document.getElementById('voteOptions').value.split('\n').filter(o => o);
        const duration = document.getElementById('voteDuration').value;
        const endNow = document.getElementById('voteEndNow').checked;
        const interval = parseInt(document.getElementById('voteInterval').value) || 0;

        for (const gid of guildIds) {
            for (const token of tokens) {
                const send = () => sendMessage(token, channelId, title + '\n' + options.join('\n') + '\n' + (endNow ? 'Vote ends now' : 'Vote ends in ' + duration + ' minutes'));
                startInterval('vote', send, interval);
            }
        }
    });
    document.getElementById('stopVoteBtn').addEventListener('click', () => stopInterval('vote'));

    // ===== スレッド送信 =====
    document.getElementById('startThreadBtn').addEventListener('click', () => {
        const tokens = document.getElementById('token').value.split('\n').filter(t => t);
        const guildIds = document.getElementById('guildId').value.split('\n').filter(g => g);
        const channelId = document.getElementById('threadChannel').value;
        const threadName = document.getElementById('threadName').value;
        const mention = document.getElementById('mentionContent').value;
        const interval = parseInt(document.getElementById('threadInterval').value) || 0;

        for (const gid of guildIds) {
            for (const token of tokens) {
                const send = () => sendMessage(token, channelId, mention + '\n' + threadName);
                startInterval('thread', send, interval);
            }
        }
    });
    document.getElementById('stopThreadBtn').addEventListener('click', () => stopInterval('thread'));

});
