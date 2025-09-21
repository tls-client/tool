document.addEventListener('DOMContentLoaded', function() {
    const fetchChannelsBtn = document.getElementById('fetchChannelsBtn');
    const channelIdSelect = document.getElementById('channelId');
    const fetchUsersBtn = document.getElementById('fetchUsersBtn');
    const threadChannelSelect = document.getElementById('threadChannel');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const startVoteBtn = document.getElementById('startVoteBtn');
    const stopVoteBtn = document.getElementById('stopVoteBtn');
    const startThreadBtn = document.getElementById('startThreadBtn');
    const stopThreadBtn = document.getElementById('stopThreadBtn');

    fetchChannelsBtn.addEventListener('click', function() {
        const token = document.getElementById('token').value;
        const guildId = document.getElementById('guildId').value;
        fetch(`https://discord.com/api/v9/guilds/${guildId}/channels`, {
            headers: {
                'Authorization': `Bot ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            channelIdSelect.innerHTML = '';
            data.forEach(channel => {
                const option = document.createElement('option');
                option.value = channel.id;
                option.textContent = `#${channel.name}`;
                channelIdSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching channels:', error));
    });

    fetchUsersBtn.addEventListener('click', function() {
        const token = document.getElementById('token').value;
        const guildId = document.getElementById('guildId').value;
        fetch(`https://discord.com/api/v9/guilds/${guildId}/members`, {
            headers: {
                'Authorization': `Bot ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const mentionContent = document.getElementById('mentionContent');
            mentionContent.value = data.map(member => `<@${member.user.id}>`).join(' ');
        })
        .catch(error => console.error('Error fetching users:', error));
    });

    startBtn.addEventListener('click', function() {
        const token = document.getElementById('token').value;
        const guildId = document.getElementById('guildId').value;
        const channelId = channelIdSelect.value;
        const messageContent = document.getElementById('messageContent').value;
        const randomMentionCount = document.getElementById('randomMentionCount').value;
        const appendRandomStr = document.getElementById('appendRandomStr').checked;
        const interval = document.getElementById('interval').value;
        const maxCount = document.getElementById('maxCount').value;

        let mentionUsers = [];
        fetch(`https://discord.com/api/v9/guilds/${guildId}/members`, {
            headers: {
                'Authorization': `Bot ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            mentionUsers = data.map(member => member.user.id);
            sendMessages(token, channelId, messageContent, randomMentionCount, appendRandomStr, interval, maxCount, mentionUsers);
        })
        .catch(error => console.error('Error fetching users:', error));
    });

    stopBtn.addEventListener('click', function() {
        clearInterval(messageInterval);
    });

    startVoteBtn.addEventListener('click', function() {
        const token = document.getElementById('token').value;
        const guildId = document.getElementById('guildId').value;
        const channelId = channelIdSelect.value;
        const voteTitle = document.getElementById('voteTitle').value;
        const voteOptions = document.getElementById('voteOptions').value.split('\n');
        const voteDuration = document.getElementById('voteDuration').value;
        const voteEndNow = document.getElementById('voteEndNow').checked;

        fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: voteTitle,
                embeds: [{
                    title: voteTitle,
                    description: voteOptions.join('\n'),
                    fields: [{
                        name: 'Duration',
                        value: voteDuration + ' minutes',
                        inline: true
                    }],
                    footer: {
                        text: voteEndNow ? 'Vote ends now' : 'Vote ends in ' + voteDuration + ' minutes'
                    }
                }]
            })
        })
        .then(response => response.json())
        .then(data => console.log('Vote created:', data))
        .catch(error => console.error('Error creating vote:', error));
    });

    stopVoteBtn.addEventListener('click', function() {
        // Implement vote stop functionality
    });

    startThreadBtn.addEventListener('click', function() {
        const token = document.getElementById('token').value;
        const guildId = document.getElementById('guildId').value;
        const channelId = threadChannelSelect.value;
        const threadName = document.getElementById('threadName').value;
        const mentionContent = document.getElementById('mentionContent').value;

        fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: mentionContent,
                embeds: [{
                    title: threadName,
                    description: mentionContent
                }]
            })
        })
        .then(response => response.json())
        .then(data => console.log('Thread created:', data))
        .catch(error => console.error('Error creating thread:', error));
    });

    stopThreadBtn.addEventListener('click', function() {
        // Implement thread stop functionality
    });

    function sendMessages(token, channelId, messageContent, randomMentionCount, appendRandomStr, interval, maxCount, mentionUsers) {
        let count = 0;
        const messageInterval = setInterval(() => {
            if (count >= maxCount) {
                clearInterval(messageInterval);
                return;
            }

            const randomMentions = Array.from({ length: randomMentionCount }, () => mentionUsers[Math.floor(Math.random() * mentionUsers.length)]);
            let finalMessage = messageContent;
            if (appendRandomStr) {
                finalMessage += ' ' + Math.random().toString(36).substring(2, 7);
            }
            if (randomMentions.length > 0) {
                finalMessage += ' ' + randomMentions.map(id => `<@${id}>`).join(' ');
            }

            fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: finalMessage
                })
            })
            .then(response => response.json())
            .then(data => console.log('Message sent:', data))
            .catch(error => console.error('Error sending message:', error));

            count++;
        }, interval);
    }
});
