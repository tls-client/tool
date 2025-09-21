// =========================
// グローバル変数
// =========================
let intervalId = null;

// =========================
// ログ追加関数
// =========================
function addLog(text) {
    console.log(text);
    let textarea = document.getElementById("log");
    textarea.value = `${text}\n${textarea.value}`;
}

// =========================
// ユーザー取得用関数
// =========================
async function fetchAllUsers(token, guildId) {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
            headers: { "Authorization": token }
        });
        if (!response.ok) {
            addLog(`ユーザー取得失敗: ${guildId}`);
            return [];
        }
        const data = await response.json();
        return data.map(u => `<@${u.user.id}>`);
    } catch (err) {
        addLog(`エラー: ${err}`);
        return [];
    }
}

// =========================
// 全チャンネル自動取得
// =========================
async function autoFetchChannels() {
    const tokens = document.getElementById("token-input").value.split("\n").filter(t => t.trim());
    const serverId = document.getElementById("server-input").value;
    if (!tokens.length || !serverId) { addLog("TokenまたはサーバーIDが未入力です"); return; }

    let allChannels = [];
    for (let token of tokens) {
        try {
            const res = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
                headers: { "Authorization": token }
            });
            if (!res.ok) continue;
            const data = await res.json();
            allChannels.push(...data.map(c => c.id));
        } catch (err) {
            addLog(`チャンネル取得失敗: ${err}`);
        }
    }

    document.getElementById("channel-input").value = allChannels.join("\n");
    addLog(`全チャンネル自動入力完了 (${allChannels.length}件)`);
}

// =========================
// 全ユーザー自動取得
// =========================
document.getElementById("auto-mention").addEventListener("click", async () => {
    const tokens = document.getElementById("token-input").value.split("\n").filter(t => t.trim());
    const servers = document.getElementById("server-input").value.split("\n").filter(s => s.trim());
    if (!tokens.length || !servers.length) { 
        addLog("Token とサーバーIDを入力してください"); 
        return; 
    }

    let allUsers = [];
    for (let token of tokens) {
        for (let server of servers) {
            const users = await fetchAllUsers(token, server);
            allUsers.push(...users);
        }
    }

    document.getElementById("mention-content").value = allUsers.join(" ");
    addLog(`メンション内容に全ユーザーを自動入力しました (${allUsers.length}件)`);
});

// =========================
// メッセージ送信関数
// =========================
async function sendMessage(token, channelId, content) {
    try {
        const body = { content };
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            addLog(`送信成功: ${content}`);
        } else {
            addLog(`送信失敗: ${content}`);
        }
    } catch (err) {
        addLog(`送信エラー: ${err}`);
    }
}

// =========================
// 自動送信開始/停止
// =========================
function startAutoSend() {
    if (intervalId !== null) return;
    intervalId = setInterval(async () => {
        const tokens = document.getElementById("token-input").value.split("\n").filter(t => t.trim());
        const channels = document.getElementById("channel-input").value.split("\n").filter(c => c.trim());
        const message = document.getElementById("message-content").value;
        const mention = document.getElementById("mention-content").value;
        const interval = parseInt(document.getElementById("interval-ms").value) || 1000;
        const limit = parseInt(document.getElementById("limit-count").value) || 1;

        for (let token of tokens) {
            for (let channel of channels) {
                for (let i = 0; i < limit; i++) {
                    let content = `${mention} ${message} ${Math.random().toString(36).substring(2, 12)}`;
                    await sendMessage(token, channel, content);
                }
            }
        }
    }, parseInt(document.getElementById("interval-ms").value) || 1000);
}

function stopAutoSend() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
        addLog("自動送信停止");
    }
}
