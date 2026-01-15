/**
 * TikTok Live WebSocket Server
 * 直接連接 TikTok 直播，透過 WebSocket 轉發訊息
 */

const { WebcastPushConnection, SignConfig } = require('tiktok-live-connector');
const WebSocket = require('ws');

// 設定 Eulerstream API Key（從環境變數或命令行參數讀取）
// https://www.eulerstream.com
const apiKey = process.env.EULER_API_KEY || process.argv[3] || '';
if (apiKey) {
    SignConfig.apiKey = apiKey;
    console.log('[Server] 已設定 Eulerstream API Key');
} else {
    console.log('[Server] 警告: 未設定 API Key，連接可能不穩定');
}

// 配置
const CONFIG = {
    port: parseInt(process.env.WS_PORT) || 10010,
    tiktokUsername: process.argv[2] || '',
};

// WebSocket 服務器
let wss = null;
let tiktokConnection = null;
let isConnected = false;

// 所有連接的客戶端
const clients = new Set();

// 用戶緩存 (userId -> {nickname, uniqueId})
const userCache = new Map();

// 禮物防重複緩存 (key -> timestamp)
const giftDedup = new Map();

// 進場防重複緩存 (userId -> timestamp)
const memberDedup = new Map();

// 啟動 WebSocket 服務器
function startWebSocketServer() {
    wss = new WebSocket.Server({ port: CONFIG.port });
    console.log(`[Server] WebSocket 服務器已啟動: ws://127.0.0.1:${CONFIG.port}`);

    wss.on('connection', (ws) => {
        console.log('[Server] 客戶端已連接');
        clients.add(ws);

        ws.send(JSON.stringify({
            type: 'status',
            connected: isConnected,
            username: CONFIG.tiktokUsername
        }));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleClientMessage(data, ws);
            } catch (e) {
                console.error('[Server] 解析客戶端訊息失敗:', e);
            }
        });

        ws.on('close', () => {
            console.log('[Server] 客戶端已斷開');
            clients.delete(ws);
        });

        ws.on('error', (err) => {
            console.error('[Server] WebSocket 錯誤:', err);
            clients.delete(ws);
        });
    });
}

// 處理客戶端訊息
function handleClientMessage(data, ws) {
    if (data.type === 'connect' && data.username) {
        console.log(`[Server] 收到連接請求: ${data.username}`);
        connectToTikTok(data.username);
    } else if (data.type === 'disconnect') {
        console.log('[Server] 收到斷開請求');
        disconnectFromTikTok();
    }
}

// 廣播訊息給所有客戶端
function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// 連接 TikTok 直播
async function connectToTikTok(username) {
    if (tiktokConnection) {
        await disconnectFromTikTok();
    }

    CONFIG.tiktokUsername = username;
    console.log(`[TikTok] 正在連接: @${username}`);

    tiktokConnection = new WebcastPushConnection(username, {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1000,
        sessionId: undefined,
        fetchRoomInfoOnConnect: true,
        clientParams: {
            "app_language": "zh-Hant",
            "device_platform": "web",
            "browser_language": "zh-TW",
            "browser_platform": "Win32",
            "browser_name": "Mozilla",
            "browser_version": "5.0"
        },
        requestHeaders: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    });

    // 連接成功
    tiktokConnection.on('connected', (state) => {
        console.log(`[TikTok] 已連接到直播間! roomId: ${state.roomId}`);
        isConnected = true;
        broadcast({
            type: 'connected',
            roomId: state.roomId,
            username: username
        });
    });

    tiktokConnection.on('websocketConnected', () => {
        console.log('[TikTok] WebSocket 已連接');
    });

    // 監聽原始數據 - 只解析高等級進場的等級資訊
    // 暱稱資訊完全依賴 member 事件，rawBarrage 只補充等級
    tiktokConnection.on('rawData', (messageTypeName, binary) => {
        if (messageTypeName === 'WebcastBarrageMessage') {
            try {
                const textContent = binary.toString('utf8');

                // 檢查是否為進場相關訊息
                const isEntry = textContent.includes('joined') ||
                                textContent.includes('join_animation') ||
                                textContent.includes('entrance') ||
                                textContent.includes('welcome');

                if (!isEntry) return;

                // 提取 userId（7開頭的19位數字，這是 TikTok userId 的格式）
                const userIdMatches = textContent.match(/7\d{18}/g) || [];
                const userId = userIdMatches.length > 0 ? userIdMatches[0] : '';
                if (!userId) return;

                // 提取等級 (多種格式)
                let level = 0;
                const levelPatterns = [
                    /grade_badge_lv(\d+)/i,
                    /grade[_]?(\d+)/i,
                    /level[_\-\s]?(\d+)/i,
                    /\blv(\d{1,2})\b/i,
                    /user_grade[^\d]*(\d+)/i
                ];
                for (const pattern of levelPatterns) {
                    const match = textContent.match(pattern);
                    if (match) {
                        level = Math.max(level, parseInt(match[1]) || 0);
                    }
                }

                // 只處理高等級用戶 (Lv20+)
                if (level < 20) return;

                // 防重複
                const now = Date.now();
                const dedupKey = `barrage_${userId}`;
                if (memberDedup.has(dedupKey) && now - memberDedup.get(dedupKey) < 2000) {
                    return;
                }
                memberDedup.set(dedupKey, now);

                // 從緩存獲取用戶資訊
                const cachedUser = userCache.get(userId);

                // 嘗試從原始數據提取暱稱（支援中文+符號組合）
                let extractedNickname = '';
                if (!cachedUser) {
                    // 匹配中文暱稱，可包含 - _ · 等符號
                    const nicknameMatches = textContent.match(/[\u4e00-\u9fff][\u4e00-\u9fff\-_·\s]{0,15}[\u4e00-\u9fff]/g) || [];
                    // 也嘗試純中文匹配（至少2字）
                    const pureChineseMatches = textContent.match(/[\u4e00-\u9fff]{2,10}/g) || [];
                    const allMatches = [...nicknameMatches, ...pureChineseMatches];

                    const validNicknames = allMatches.filter(s => {
                        if (s.length < 2 || s.length > 15) return false;
                        // 過濾掉常見的非暱稱字符
                        if (/已加入|直播|歡迎|進場|來了|等級|徽章|動畫|特效/.test(s)) return false;
                        return true;
                    });
                    // 優先選擇較長的（更完整的暱稱）
                    validNicknames.sort((a, b) => b.length - a.length);
                    extractedNickname = validNicknames.length > 0 ? validNicknames[0] : '';
                }

                const nickname = cachedUser?.nickname || extractedNickname;
                const uniqueId = cachedUser?.uniqueId || '';

                // 發送等級更新訊息（讓 main.js 合併處理）
                const entryData = {
                    type: 'HighLevelEntry',
                    userId: userId,
                    level: level,
                    nickname: nickname,
                    uniqueId: uniqueId
                };
                broadcast(entryData);

                console.log(`[高等級進場] userId=${userId} Lv${level} nickname="${nickname}" cached=${cachedUser ? 'yes' : 'no'} extracted=${extractedNickname ? 'yes' : 'no'}`);
            } catch (e) {
                // 忽略解析錯誤
            }
        }
    });

    // 高等級進場特效 (envelope)
    tiktokConnection.on('envelope', (msg) => {
        if (msg) {
            broadcast({ type: 'EnvelopeMessage', ...msg });
        }
    });

    // 社交消息
    tiktokConnection.on('social', (msg) => {
        broadcast({
            type: 'SocialMessage',
            nickname: msg.nickname,
            uniqueId: msg.uniqueId,
            userId: msg.userId,
            displayType: msg.displayType,
            label: msg.label
        });

        if (msg.displayType === 'pm_mt_join_message' || (msg.label && msg.label.includes('joined'))) {
            broadcast({
                type: 'MemberMessage',
                nickname: msg.nickname,
                uniqueId: msg.uniqueId,
                userId: msg.userId,
                fromSocial: true
            });
        }
    });

    // 高等級用戶進場 (VIP Barrage)
    tiktokConnection.on('barrage', (msg) => {
        const msgStr = JSON.stringify(msg);
        const user = msg.user || msg;
        const nickname = user.nickname || user.uniqueId || 'VIP用戶';
        const uniqueId = user.uniqueId || '';
        const userId = user.userId || user.uid || '';

        let level = 0;
        if (user.level) level = Math.max(level, parseInt(user.level) || 0);
        if (user.grade) level = Math.max(level, parseInt(user.grade) || 0);
        if (user.userBadges && Array.isArray(user.userBadges)) {
            for (const badge of user.userBadges) {
                if (badge.level) level = Math.max(level, parseInt(badge.level) || 0);
                const badgeStr = JSON.stringify(badge);
                const lvMatch = badgeStr.match(/lv(\d+)/i) || badgeStr.match(/level[_]?(\d+)/i);
                if (lvMatch) level = Math.max(level, parseInt(lvMatch[1]) || 0);
            }
        }
        const lvMatch = msgStr.match(/grade_badge_lv(\d+)/i) || msgStr.match(/"level"\s*:\s*(\d+)/i) || msgStr.match(/lv(\d+)/i);
        if (lvMatch) level = Math.max(level, parseInt(lvMatch[1]) || 0);

        if (userId && nickname && nickname !== 'VIP用戶') {
            userCache.set(userId, { nickname, uniqueId });
        }

        broadcast({
            type: 'BarrageMessage',
            nickname: nickname,
            uniqueId: uniqueId,
            userId: userId,
            level: level,
            isVIP: true
        });

        broadcast({
            type: 'MemberMessage',
            nickname: nickname,
            uniqueId: uniqueId,
            userId: userId,
            level: level,
            isVIP: true,
            fromBarrage: true
        });
    });

    // 超級粉絲進場
    tiktokConnection.on('superFan', (msg) => {
        const user = msg.user || msg;
        const nickname = user.nickname || user.uniqueId || '超級粉絲';
        const uniqueId = user.uniqueId || '';
        const userId = user.userId || '';

        broadcast({ type: 'SuperFanMessage', nickname, uniqueId, userId });
        broadcast({
            type: 'MemberMessage',
            nickname: nickname,
            uniqueId: uniqueId,
            userId: userId,
            isSuperFan: true,
            fromSuperFan: true
        });
    });

    // 連接斷開
    tiktokConnection.on('disconnected', () => {
        console.log('[TikTok] 連接已斷開');
        isConnected = false;
        broadcast({ type: 'disconnected' });
    });

    // 錯誤
    tiktokConnection.on('error', (err) => {
        console.error('[TikTok] 錯誤:', err.message);
        broadcast({ type: 'error', message: err.message });
    });

    // 直播結束
    tiktokConnection.on('streamEnd', (actionId) => {
        console.log('[TikTok] 直播已結束');
        isConnected = false;
        broadcast({ type: 'streamEnd', actionId: actionId });
    });

    // === 訊息事件 ===

    // 彈幕/聊天
    tiktokConnection.on('chat', (msg) => {
        if (msg.userId) {
            userCache.set(msg.userId, { nickname: msg.nickname, uniqueId: msg.uniqueId });
            console.log(`[UserCache] 快取: userId=${msg.userId} -> ${msg.nickname}/@${msg.uniqueId}`);
        }
        console.log(`[Chat] ${msg.nickname}: ${msg.comment}`);
        broadcast({
            type: 'ChatMessage',
            nickname: msg.nickname,
            uniqueId: msg.uniqueId,
            userId: msg.userId,
            comment: msg.comment,
            followRole: msg.followRole,
            userBadges: msg.userBadges
        });
    });

    // 禮物
    tiktokConnection.on('gift', (msg) => {
        if (msg.userId) {
            userCache.set(msg.userId, { nickname: msg.nickname, uniqueId: msg.uniqueId });
        }
        const giftCount = msg.repeatCount || 1;

        // 只在禮物結束時觸發（repeatEnd=true），或者非連續禮物（giftType !== 1）
        // giftType 1 = 連續禮物（需要等 repeatEnd）
        // giftType 2 = 一次性禮物（直接觸發）
        if (msg.giftType === 1 && !msg.repeatEnd) {
            // 連續禮物但還沒結束，先不觸發
            console.log(`[Gift] ${msg.nickname} 正在連送 ${msg.giftName}... (${giftCount})`);
            return;
        }

        // 防重複：同用戶同禮物 2 秒內只觸發一次
        const dedupKey = `${msg.userId}_${msg.giftId}_${giftCount}`;
        const now = Date.now();
        const lastTime = giftDedup.get(dedupKey) || 0;
        if (now - lastTime < 2000) {
            console.log(`[Gift] 重複禮物已忽略: ${dedupKey}`);
            return;
        }
        giftDedup.set(dedupKey, now);

        // 清理舊記錄（超過 10 秒的）
        for (const [key, time] of giftDedup.entries()) {
            if (now - time > 10000) {
                giftDedup.delete(key);
            }
        }

        console.log(`[Gift] ${msg.nickname} 送了 ${giftCount}x ${msg.giftName} (repeatEnd: ${msg.repeatEnd})`);
        broadcast({
            type: 'GiftMessage',
            nickname: msg.nickname,
            uniqueId: msg.uniqueId,
            userId: msg.userId,
            giftId: msg.giftId,
            giftName: msg.giftName,
            repeatCount: giftCount,
            diamondCount: msg.diamondCount,
            giftType: msg.giftType
        });
    });

    // 點讚
    tiktokConnection.on('like', (msg) => {
        broadcast({
            type: 'LikeMessage',
            nickname: msg.nickname,
            uniqueId: msg.uniqueId,
            userId: msg.userId,
            likeCount: msg.likeCount,
            totalLikeCount: msg.totalLikeCount
        });
    });

    // 進場 (member) - 這是主要的進場資料來源
    tiktokConnection.on('member', (msg) => {
        // 除錯：輸出所有進場
        console.log(`[Member] ${msg.nickname || msg.uniqueId} (userId: ${msg.userId})`);

        // 緩存用戶資訊（供 rawBarrage 使用）
        if (msg.userId) {
            userCache.set(msg.userId, { nickname: msg.nickname, uniqueId: msg.uniqueId });
        }

        // 清理舊的緩存記錄
        const now = Date.now();
        for (const [key, time] of memberDedup.entries()) {
            if (now - time > 10000) {
                memberDedup.delete(key);
            }
        }

        // 從 userBadges 提取等級
        let level = 0;
        if (msg.userBadges && Array.isArray(msg.userBadges)) {
            for (const badge of msg.userBadges) {
                if (badge.level) level = Math.max(level, parseInt(badge.level) || 0);
                if (badge.displayType && typeof badge.displayType === 'string') {
                    const lvMatch = badge.displayType.match(/lv(\d+)/i) || badge.displayType.match(/level[_]?(\d+)/i);
                    if (lvMatch) level = Math.max(level, parseInt(lvMatch[1]) || 0);
                }
                if (badge.url && typeof badge.url === 'string') {
                    const urlMatch = badge.url.match(/grade_badge_lv(\d+)/) || badge.url.match(/lv(\d+)/i);
                    if (urlMatch) level = Math.max(level, parseInt(urlMatch[1]) || 0);
                }
                if (badge.badgeSceneType === 1 && badge.imageInfo) {
                    const imgUrl = badge.imageInfo.url || '';
                    const imgMatch = imgUrl.match(/grade_badge_lv(\d+)/) || imgUrl.match(/lv(\d+)/i);
                    if (imgMatch) level = Math.max(level, parseInt(imgMatch[1]) || 0);
                }
                const badgeName = badge.name || badge.text || '';
                if (badgeName) {
                    const nameMatch = badgeName.match(/lv[_\-\s]?(\d+)/i) || badgeName.match(/level[_\-\s]?(\d+)/i);
                    if (nameMatch) level = Math.max(level, parseInt(nameMatch[1]) || 0);
                }
            }
        }

        // 除錯：顯示提取的等級
        if (level > 0) {
            console.log(`[Member Level] ${msg.nickname || msg.uniqueId} Lv${level}`);
        }

        // 廣播進場訊息
        broadcast({
            type: 'MemberMessage',
            nickname: msg.nickname || '',
            uniqueId: msg.uniqueId || '',
            userId: msg.userId || '',
            followRole: msg.followRole,
            level: level,
            isVIP: level >= 20,
            profilePictureUrl: msg.profilePictureUrl
        });
    });

    // 關注
    tiktokConnection.on('follow', (msg) => {
        console.log(`[Follow] ${msg.nickname} 關注了主播`);
        broadcast({
            type: 'FollowMessage',
            nickname: msg.nickname,
            uniqueId: msg.uniqueId,
            userId: msg.userId
        });
    });

    // 分享
    tiktokConnection.on('share', (msg) => {
        broadcast({
            type: 'ShareMessage',
            nickname: msg.nickname,
            uniqueId: msg.uniqueId,
            userId: msg.userId
        });
    });

    // 房間統計
    tiktokConnection.on('roomUser', (msg) => {
        broadcast({
            type: 'RoomUserMessage',
            viewerCount: msg.viewerCount,
            topViewers: msg.topViewers
        });
    });

    // 訂閱
    tiktokConnection.on('subscribe', (msg) => {
        console.log(`[Subscribe] ${msg.nickname} 訂閱了主播`);
        broadcast({
            type: 'SubscribeMessage',
            nickname: msg.nickname,
            uniqueId: msg.uniqueId,
            userId: msg.userId
        });
    });

    // 嘗試連接
    try {
        await tiktokConnection.connect();
    } catch (err) {
        console.error('[TikTok] 連接失敗:', err.message);
        broadcast({ type: 'error', message: `連接失敗: ${err.message}` });
    }
}

// 斷開 TikTok 連接
async function disconnectFromTikTok() {
    if (tiktokConnection) {
        try {
            tiktokConnection.disconnect();
        } catch (e) {
            // 忽略
        }
        tiktokConnection = null;
    }
    isConnected = false;
    console.log('[TikTok] 已斷開連接');
}

// 主程式
async function main() {
    console.log('='.repeat(50));
    console.log('TikTok Live WebSocket Server');
    console.log('='.repeat(50));

    startWebSocketServer();

    if (CONFIG.tiktokUsername) {
        console.log(`[Server] 自動連接: @${CONFIG.tiktokUsername}`);
        setTimeout(() => {
            connectToTikTok(CONFIG.tiktokUsername);
        }, 1000);
    } else {
        console.log('[Server] 等待客戶端連接...');
    }
}

process.on('SIGINT', async () => {
    console.log('\n[Server] 正在關閉...');
    await disconnectFromTikTok();
    if (wss) {
        wss.close();
    }
    process.exit(0);
});

main();
