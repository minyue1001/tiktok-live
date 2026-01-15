/**
 * TikTok 直播互動系統 - Electron 主進程
 */

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const express = require('express');
const http = require('http');

// ============ 自動更新設定 (可選) ============
let autoUpdater = null;
try {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    // 私有 repo 需要 token
    autoUpdater.requestHeaders = {
        'Authorization': 'token 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'
    };
} catch (e) {
    console.log('electron-updater not installed, auto-update disabled');
}

// ============ 全域狀態 ============
const state = {
    config: {},
    logs: [],
    mainWindow: null,
    greenWindow: null,
    wsClient: null,
    nodeServer: null,
    mediaServer: null,
    mediaServerPort: 18888,
    connected: false,
    entryCooldowns: {},
    giftDedup: {},
    entryDedup: {},           // 進場去重 (userId -> {time, logged})
    pendingEntries: {},       // 待處理進場 (userId -> {nickname, uniqueId, level, time})
    entryHistory: [],         // 進場歷史記錄
    seenUsers: new Set(),
    highLevelUsers: {},
    currentTikTokAccount: '',
    chatDisplayEnabled: false,
    userNicknameCache: new Map(),  // 用戶暱稱快取 (userId -> {nickname, uniqueId, time})
    mainWindowFocusListenerAdded: false  // 追蹤 focus 監聽器是否已添加
};

// ============ 路徑設定 ============
const isDev = process.argv.includes('--dev');
const DATA_DIR = isDev
    ? path.join(__dirname, '..')
    : path.dirname(app.getPath('exe'));
const CONFIG_PATH = path.join(DATA_DIR, 'tiktok_config.json');
const HIGH_LEVEL_USERS_PATH = path.join(DATA_DIR, 'high_level_users.json');
const USER_CACHE_PATH = path.join(DATA_DIR, 'user_cache.json');

// ============ 配置管理 ============
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            state.config = JSON.parse(data);
        } else {
            state.config = getDefaultConfig();
            saveConfig();
        }
    } catch (e) {
        console.error('載入配置失敗:', e);
        state.config = getDefaultConfig();
    }
    return state.config;
}

function getDefaultConfig() {
    return {
        port: 10010,
        wheel_enabled: true,
        video_enabled: true,
        entry_enabled: false,
        giftbox_enabled: false,
        wheel_gifts: [],
        video_gifts: [],
        wheel_options: [],
        giftbox_gifts: [],
        giftbox_options: [],
        entry_list: [],
        api_key: '',
        tiktok_username: '',
        auto_open_green_screen: false,
        language: 'zh-TW',
        greenscreen_positions: {
            wheel: { width: 350, height: 350, left: 0, top: 150, visible: false },
            giftbox: { width: 200, height: 200, left: 465, top: 245, visible: false, autoHide: true },
            videoContainers: {},
            videoModuleVisible: true
        }
    };
}

function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(state.config, null, 2), 'utf8');
    } catch (e) {
        console.error('儲存配置失敗:', e);
    }
}

function updateConfig(updates) {
    state.config = { ...state.config, ...updates };
    saveConfig();

    // 通知所有視窗配置已更新（即時同步不需重開）
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
        state.mainWindow.webContents.send('config-updated', state.config);
    }
    if (state.greenWindow && !state.greenWindow.isDestroyed()) {
        state.greenWindow.webContents.send('config-updated', state.config);
    }
    return state.config;
}

// ============ 高等級用戶管理 ============
function loadHighLevelUsers() {
    try {
        if (fs.existsSync(HIGH_LEVEL_USERS_PATH)) {
            const data = fs.readFileSync(HIGH_LEVEL_USERS_PATH, 'utf8');
            state.highLevelUsers = JSON.parse(data);
        }
    } catch (e) {
        console.error('載入高等級用戶失敗:', e);
        state.highLevelUsers = {};
    }
}

function saveHighLevelUsers() {
    try {
        fs.writeFileSync(HIGH_LEVEL_USERS_PATH, JSON.stringify(state.highLevelUsers, null, 2), 'utf8');
    } catch (e) {
        console.error('儲存高等級用戶失敗:', e);
    }
}

// ============ 日誌管理 ============
function addLog(message) {
    const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    const logEntry = `[${timestamp}] ${message}`;
    state.logs.push(logEntry);
    if (state.logs.length > 500) {
        state.logs = state.logs.slice(-500);
    }

    // 通知主視窗
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
        state.mainWindow.webContents.send('log-update', state.logs);
    }
}

// ============ 媒體伺服器 ============
function startMediaServer() {
    const app = express();

    app.get('/media', (req, res) => {
        const filePath = req.query.path;
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        const stat = fs.statSync(filePath);
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            const chunkSize = end - start + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': getContentType(filePath),
                'Access-Control-Allow-Origin': '*'
            });

            fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': stat.size,
                'Content-Type': getContentType(filePath),
                'Access-Control-Allow-Origin': '*'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    });

    state.mediaServer = http.createServer(app);
    state.mediaServer.listen(state.mediaServerPort, () => {
        console.log(`媒體伺服器已啟動: http://127.0.0.1:${state.mediaServerPort}`);
    });
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4'
    };
    return types[ext] || 'application/octet-stream';
}

// ============ TikTok 連接 ============
function startNodeServer() {
    return new Promise((resolve, reject) => {
        const serverDir = isDev
            ? path.join(__dirname, '../tiktok-server')
            : path.join(process.resourcesPath, 'tiktok-server');
        const serverPath = path.join(serverDir, 'server.js');

        if (!fs.existsSync(serverPath)) {
            addLog('找不到 TikTok 伺服器');
            return reject(new Error('Server not found'));
        }

        const env = {
            ...process.env,
            EULER_API_KEY: state.config.api_key || '',
            WS_PORT: String(state.config.port || 10010)
        };

        // 打包後使用內建的 node.exe，開發模式用系統 node
        const nodePath = isDev
            ? 'node'
            : path.join(serverDir, 'node.exe');

        state.nodeServer = spawn(nodePath, [serverPath], {
            cwd: serverDir,
            env,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let serverReady = false;

        state.nodeServer.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('[Node]', output);

            // 檢測伺服器是否已啟動
            if (!serverReady && (output.includes('WebSocket') || output.includes('10010'))) {
                serverReady = true;
                setTimeout(resolve, 500); // 額外等待 500ms 確保完全就緒
            }
        });

        state.nodeServer.stderr.on('data', (data) => {
            console.error('[Node Error]', data.toString());
        });

        state.nodeServer.on('close', (code) => {
            console.log(`Node server exited with code ${code}`);
            state.nodeServer = null;
        });

        // 備用超時（如果沒有檢測到就緒訊息）
        setTimeout(() => {
            if (!serverReady) {
                serverReady = true;
                resolve();
            }
        }, 3000);
    });
}

function stopNodeServer() {
    if (state.nodeServer) {
        state.nodeServer.kill();
        state.nodeServer = null;
    }
}

async function connectTikTok() {
    const username = state.config.tiktok_username;
    if (!username) {
        return { success: false, message: '請先設定 TikTok 用戶名' };
    }

    // 先停止舊的連接和伺服器
    if (state.wsClient) {
        state.wsClient.close();
        state.wsClient = null;
    }
    stopNodeServer();

    // 等待舊進程完全關閉
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        await startNodeServer();

        const port = state.config.port || 10010;
        const wsUrl = `ws://127.0.0.1:${port}`;

        return new Promise((resolve, reject) => {
            state.wsClient = new WebSocket(wsUrl);

            state.wsClient.on('open', () => {
                addLog(`已連接到 WebSocket: ${wsUrl}`);

                // 發送連接請求
                state.wsClient.send(JSON.stringify({
                    type: 'connect',
                    username: username
                }));

                state.connected = true;
                state.currentTikTokAccount = username.toLowerCase();
                state.seenUsers = new Set();

                if (!state.highLevelUsers[state.currentTikTokAccount]) {
                    state.highLevelUsers[state.currentTikTokAccount] = {};
                }

                resolve({ success: true });
            });

            state.wsClient.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    handleTikTokMessage(msg);
                } catch (e) {
                    console.error('解析訊息失敗:', e);
                }
            });

            state.wsClient.on('close', () => {
                addLog('WebSocket 連接已關閉');
                state.connected = false;
            });

            state.wsClient.on('error', (err) => {
                addLog(`WebSocket 錯誤: ${err.message}`);
                reject(err);
            });

            // 超時處理
            setTimeout(() => {
                if (!state.connected) {
                    reject(new Error('連接超時'));
                }
            }, 10000);
        });

    } catch (e) {
        addLog(`連接失敗: ${e.message}`);
        return { success: false, message: e.message };
    }
}

function disconnectTikTok() {
    if (state.wsClient) {
        state.wsClient.close();
        state.wsClient = null;
    }
    stopNodeServer();
    state.connected = false;
    addLog('已斷開連接');
}

// ============ 用戶暱稱快取（持久化） ============
let userCacheDirty = false;  // 標記是否需要儲存

function loadUserCache() {
    try {
        if (fs.existsSync(USER_CACHE_PATH)) {
            const data = JSON.parse(fs.readFileSync(USER_CACHE_PATH, 'utf8'));
            const now = Date.now();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;

            // 載入並過濾過期記錄（保留 7 天內的）
            for (const [userId, info] of Object.entries(data)) {
                if (now - (info.time || 0) < sevenDays) {
                    state.userNicknameCache.set(userId, info);
                }
            }
            console.log(`[UserCache] 已載入 ${state.userNicknameCache.size} 筆用戶快取`);
        }
    } catch (e) {
        console.error('[UserCache] 載入失敗:', e.message);
    }
}

function saveUserCache() {
    if (!userCacheDirty) return;
    try {
        const data = {};
        for (const [userId, info] of state.userNicknameCache) {
            data[userId] = info;
        }
        fs.writeFileSync(USER_CACHE_PATH, JSON.stringify(data, null, 2), 'utf8');
        userCacheDirty = false;
        console.log(`[UserCache] 已儲存 ${state.userNicknameCache.size} 筆用戶快取`);
    } catch (e) {
        console.error('[UserCache] 儲存失敗:', e.message);
    }
}

function cacheUserNickname(userId, nickname, uniqueId) {
    if (!userId || (!nickname && !uniqueId)) return;

    // 只快取有效暱稱（非空、非亂碼）
    const cleanedNickname = cleanNickname(nickname);
    if (cleanedNickname || uniqueId) {
        const existing = state.userNicknameCache.get(userId);

        // 更新快取（保留已有的資訊）
        state.userNicknameCache.set(userId, {
            nickname: cleanedNickname || existing?.nickname || nickname || '',
            uniqueId: uniqueId || existing?.uniqueId || '',
            time: Date.now()
        });

        userCacheDirty = true;

        // 檢查是否有等待中的高等級進場需要更新
        checkPendingHighLevelEntry(userId, cleanedNickname || nickname, uniqueId);
    }
}

function checkPendingHighLevelEntry(userId, nickname, uniqueId) {
    // 檢查是否有等待暱稱的高等級進場
    const pending = state.pendingEntries[userId];
    if (pending && pending.waitingForNickname && nickname) {
        console.log(`[Entry] 補充暱稱: userId=${userId} -> ${nickname}`);
        pending.nickname = nickname;
        pending.uniqueId = uniqueId || pending.uniqueId;
        pending.waitingForNickname = false;
        // 立即處理
        finalizeEntry(userId);
    }
}

// ============ 訊息處理 ============
function handleTikTokMessage(msg) {
    const msgType = (msg.type || '').toLowerCase();
    const data = msg.data || msg;

    // 禮物消息
    if (['gift', 'giftmessage', 'webcastgiftmessage'].includes(msgType)) {
        const username = data.nickname || data.uniqueId || data.user?.nickname || '未知用戶';
        const uniqueId = data.uniqueId || data.user?.uniqueId || '';
        const userId = data.userId || data.user?.userId || '';
        const giftName = data.giftName || data.gift_name || data.gift?.name || '';
        const count = parseInt(data.repeatCount || data.giftCount || data.count || 1);

        // 快取用戶暱稱
        if (userId) cacheUserNickname(userId, data.nickname, uniqueId);

        checkFirstInteraction(username, uniqueId, userId);

        // 防重複
        const giftKey = `${username}_${giftName}_${count}`;
        const now = Date.now();
        if (now - (state.giftDedup[giftKey] || 0) < 2000) return;
        state.giftDedup[giftKey] = now;

        addLog(`🎁 ${username} 送出 ${giftName} x${count}`);
        triggerEffects('gift', username, giftName, count);
    }

    // 聊天消息
    else if (['chat', 'chatmessage', 'webcastchatmessage'].includes(msgType)) {
        const username = data.nickname || data.uniqueId || data.user?.nickname || '未知用戶';
        const uniqueId = data.uniqueId || data.user?.uniqueId || '';
        const userId = data.userId || data.user?.userId || '';
        const comment = data.comment || data.content || data.text || '';

        // 快取用戶暱稱
        if (userId) cacheUserNickname(userId, data.nickname, uniqueId);

        addLog(`💬 ${username}: ${comment}`);
        checkFirstInteraction(username, uniqueId, userId);
        triggerEffects('chat', username, comment, 1);

        // 透過聊天回推進場：如果用戶是高等級且最近沒有進場記錄，觸發進場
        if (userId) {
            checkChatBasedEntry(userId, username, uniqueId);
        }
    }

    // 點讚消息
    else if (['like', 'likemessage', 'webcastlikemessage'].includes(msgType)) {
        const username = data.nickname || data.uniqueId || '未知用戶';
        const count = parseInt(data.likeCount || data.count || 1);
        addLog(`❤️ ${username} 點了 ${count} 個讚`);
        triggerEffects('like', username, '', count);
    }

    // 進場消息
    else if (['member', 'membermessage', 'webcastmemberjoinevent'].includes(msgType)) {
        const nickname = data.nickname || data.user?.nickname || '';
        const uniqueId = data.uniqueId || data.user?.uniqueId || '';
        const userId = data.userId || data.user?.userId || '';

        // 除錯：輸出原始資料
        console.log('[Entry Raw]', JSON.stringify({
            nickname, uniqueId, userId, level: data.level
        }));

        // 快取用戶暱稱
        if (userId) cacheUserNickname(userId, nickname, uniqueId);

        processEntry({
            nickname,
            uniqueId,
            userId,
            level: data.level || 0
        });
    }

    // 高等級進場（來自 rawBarrage，只有等級資訊）
    else if (msgType === 'highlevelentry') {
        const userId = data.userId || '';
        const level = parseInt(data.level) || 0;
        if (!userId || level < 20) return;

        console.log(`[HighLevelEntry] userId=${userId} Lv${level} nickname="${data.nickname || ''}"`);

        // 更新待處理進場的等級
        if (state.pendingEntries[userId]) {
            state.pendingEntries[userId].level = Math.max(state.pendingEntries[userId].level || 0, level);
        } else {
            // 嘗試從本地快取獲取暱稱
            let nickname = data.nickname || '';
            let uniqueId = data.uniqueId || '';

            const cached = state.userNicknameCache.get(userId);
            if (cached) {
                nickname = cached.nickname || nickname;
                uniqueId = cached.uniqueId || uniqueId;
                console.log(`[HighLevelEntry] 從快取獲取: ${nickname}`);
            }

            // 如果還沒收到 member 事件，先暫存
            const hasNickname = nickname && nickname.trim().length > 0;
            state.pendingEntries[userId] = {
                nickname: nickname,
                uniqueId: uniqueId,
                userId: userId,  // 確保包含 userId
                level: level,
                time: Date.now(),
                waitingForNickname: !hasNickname  // 標記是否等待暱稱
            };

            // 如果沒有暱稱，等待更久（1.5秒）讓其他事件補充
            // 如果有暱稱，正常等待（0.3秒）
            const delay = hasNickname ? 300 : 1500;
            setTimeout(() => finalizeEntry(userId), delay);
        }
    }
}

// ============ 進場處理 ============
function processEntry(data) {
    const nickname = cleanNickname(data.nickname);
    const uniqueId = data.uniqueId || '';
    const userId = data.userId || '';
    const level = parseInt(data.level) || 0;

    // 除錯：顯示清理後的暱稱
    if (data.nickname && !nickname) {
        console.log('[Entry Filtered]', `原始: "${data.nickname}" -> 被過濾`);
    }

    // 必須有識別資訊
    if (!nickname && !uniqueId && !userId) {
        console.log('[Entry Skip] 無識別資訊');
        return;
    }

    const entryKey = userId || uniqueId || nickname;
    const now = Date.now();

    // 清理舊記錄
    cleanupEntryDedup(now);

    // 檢查是否已處理過（0.5秒內）
    const existing = state.entryDedup[entryKey];
    if (existing && now - existing.time < 500) {
        // 更新等級（如果新的更高）
        if (level > (existing.level || 0)) {
            existing.level = level;
        }
        return;
    }

    // 記錄到 entryDedup
    state.entryDedup[entryKey] = { time: now, level, logged: false };

    // 加入待處理佇列
    state.pendingEntries[entryKey] = {
        nickname,
        uniqueId,
        userId,
        level,
        time: now
    };

    // 延遲處理（等待可能的 HighLevelEntry 更新等級）
    setTimeout(() => finalizeEntry(entryKey), 300);
}

function finalizeEntry(entryKey) {
    const entry = state.pendingEntries[entryKey];
    if (!entry) return;

    const dedupRecord = state.entryDedup[entryKey];
    if (dedupRecord && dedupRecord.logged) {
        delete state.pendingEntries[entryKey];
        return;
    }

    let { nickname, uniqueId, userId, level, waitingForNickname } = entry;

    // 如果仍在等待暱稱，最後再試一次從快取獲取
    if (waitingForNickname && userId) {
        const cached = state.userNicknameCache.get(userId);
        if (cached && cached.nickname) {
            nickname = cached.nickname;
            uniqueId = cached.uniqueId || uniqueId;
            console.log(`[Entry Final] 從快取補充暱稱: ${nickname}`);
        }
    }

    const displayName = nickname || uniqueId || '';

    // 除錯：顯示進場資訊
    console.log(`[finalizeEntry] userId=${userId} level=${level} account=${state.currentTikTokAccount} nickname="${nickname}"`);

    // 即使沒有暱稱，也要記錄高等級用戶（用 userId 作為 key）
    if (level >= 20 && state.currentTikTokAccount && userId) {
        try {
            const userKey = userId;
            if (!state.highLevelUsers[state.currentTikTokAccount]?.[userKey]) {
                if (!state.highLevelUsers[state.currentTikTokAccount]) {
                    state.highLevelUsers[state.currentTikTokAccount] = {};
                }
                state.highLevelUsers[state.currentTikTokAccount][userKey] = {
                    nickname: nickname || uniqueId || `Lv${level}用戶`,
                    uniqueId: uniqueId || '',
                    userId,
                    level,
                    first_seen: new Date().toLocaleString('zh-TW')
                };
                saveHighLevelUsers();
                console.log(`[HighLevelUser] 記錄: userId=${userId} Lv${level} nickname=${nickname || '(無)'}`);
            }
        } catch (e) {
            console.error('[HighLevelUser] 記錄失敗:', e.message);
        }
    }

    if (!displayName) {
        // 沒有暱稱，不顯示進場但已記錄高等級用戶
        console.log(`[Entry Skip] 高等級用戶無暱稱: userId=${userId} Lv${level}`);
        delete state.pendingEntries[entryKey];
        return;
    }

    // 標記為已記錄
    if (dedupRecord) dedupRecord.logged = true;

    // 組合顯示內容
    const displayParts = [];
    if (nickname) displayParts.push(nickname);
    if (uniqueId && uniqueId !== nickname) displayParts.push(`@${uniqueId}`);
    if (level > 0) displayParts.push(`Lv${level}`);

    // 記錄日誌
    addLog(`👋 ${displayParts.join(' ')} 進入直播間`);

    // 儲存進場記錄
    saveEntryHistory({
        nickname,
        uniqueId,
        userId,
        level,
        time: new Date().toISOString()
    });

    // 更新高等級用戶暱稱（如果之前用 placeholder 記錄的話）
    if (level >= 20 && state.currentTikTokAccount && userId && nickname) {
        const existing = state.highLevelUsers[state.currentTikTokAccount]?.[userId];
        if (existing && existing.nickname.startsWith('Lv') && existing.nickname.endsWith('用戶')) {
            existing.nickname = nickname;
            existing.uniqueId = uniqueId || existing.uniqueId;
            saveHighLevelUsers();
            console.log(`[HighLevelUser] 更新暱稱: userId=${userId} -> ${nickname}`);
        }
    }

    // 觸發進場效果
    triggerEntryEffect(displayName, uniqueId, userId, level);

    // 清理
    delete state.pendingEntries[entryKey];
}

function cleanNickname(nickname) {
    if (!nickname) return '';

    // 排除明顯亂碼
    if (nickname.includes('�')) return '';
    // 排除控制字符
    if (/[\x00-\x1F\x7F]/.test(nickname)) return '';
    // 排除 fallback 名稱
    if (/^Lv\d+用戶$/i.test(nickname)) return '';

    // 移除零寬字符和不可見字符（這些會造成"隱形名字"）
    // 包括：零寬空格、零寬連接符、零寬非連接符、組合用字符等
    const cleaned = nickname.replace(/[\u200B-\u200F\u2060-\u206F\u034F\uFEFF\u00AD\u115F\u1160\u17B4\u17B5\u180E\u2000-\u200A\u202F\u205F\u3000\u2800\u3164]/g, '').trim();

    // 如果清理後變成空字符串，返回空（讓系統改用 uniqueId）
    if (!cleaned || cleaned.length === 0) {
        console.log(`[cleanNickname] 隱形名字被清理: "${nickname}" -> 使用 uniqueId`);
        return '';
    }

    // 只檢查是否全部都是罕見字（更寬鬆的檢查）
    // 0x9000 以上才算真正罕見（0x8000-0x9000 有很多常用字如「論」「閔」等）
    let veryRareCount = 0, totalCJK = 0;
    for (const char of cleaned) {
        const code = char.charCodeAt(0);
        if (code >= 0x4E00 && code <= 0x9FFF) {
            totalCJK++;
            // 只有 0x9800 以上才算非常罕見
            if (code >= 0x9800) veryRareCount++;
        }
    }
    // 只有當所有字都是非常罕見字時才過濾
    if (totalCJK > 0 && veryRareCount === totalCJK) return '';

    return cleaned;
}

function cleanupEntryDedup(now) {
    for (const key in state.entryDedup) {
        if (now - state.entryDedup[key].time > 10000) {
            delete state.entryDedup[key];
        }
    }
    for (const key in state.pendingEntries) {
        if (now - state.pendingEntries[key].time > 10000) {
            delete state.pendingEntries[key];
        }
    }
    // 用戶快取已持久化，記憶體中保留 1 小時
    const oneHour = 60 * 60 * 1000;
    for (const [userId, data] of state.userNicknameCache) {
        if (now - data.time > oneHour) {
            state.userNicknameCache.delete(userId);
            userCacheDirty = true;  // 標記需要儲存
        }
    }
}

// 透過聊天訊息回推進場（用於高等級用戶或有專屬進場設定的用戶）
// 用於記錄透過聊天回推的進場，避免短時間內重複觸發
const chatBasedEntryDedup = new Map();

function checkChatBasedEntry(userId, nickname, uniqueId) {
    if (!userId) return;

    const now = Date.now();
    const account = state.currentTikTokAccount;
    if (!account) return;

    // 1. 檢查是否在最近 60 秒內已有進場記錄（避免重複）
    const existingDedup = state.entryDedup[userId];
    if (existingDedup && now - existingDedup.time < 60000) {
        return; // 已有進場記錄，跳過
    }

    // 2. 檢查是否在最近 5 分鐘內透過聊天回推過（避免每條聊天都觸發）
    const lastChatEntry = chatBasedEntryDedup.get(userId);
    if (lastChatEntry && now - lastChatEntry < 300000) {
        return; // 5 分鐘內已回推過
    }

    // 3. 檢查是否有專屬進場設定（用 userId 或 uniqueId 匹配）
    const entryList = state.config.entry_list || [];
    let hasSpecificEntry = false;
    for (const entry of entryList) {
        if (entry.enabled === false) continue;
        const entryUsername = (entry.username || '').toLowerCase();
        const entryUserId = entry.user_id || '';

        if ((entryUserId && entryUserId === userId) ||
            (entryUsername && uniqueId && entryUsername === uniqueId.toLowerCase()) ||
            (entryUsername && /^7\d{18}$/.test(entry.username) && entry.username === userId)) {
            hasSpecificEntry = true;
            break;
        }
    }

    // 4. 檢查是否為高等級用戶
    const accountUsers = state.highLevelUsers[account] || {};
    const userInfo = accountUsers[userId];
    const level = userInfo?.level || 0;
    const isHighLevel = level >= 20;

    // 必須是高等級用戶或有專屬進場設定
    if (!isHighLevel && !hasSpecificEntry) {
        return;
    }

    // 5. 記錄回推時間
    chatBasedEntryDedup.set(userId, now);

    // 6. 使用儲存的資訊觸發進場
    const entryNickname = nickname || userInfo?.nickname || '';
    const entryUniqueId = uniqueId || userInfo?.uniqueId || '';

    const reason = hasSpecificEntry ? '專屬進場' : `Lv${level}`;
    console.log(`[ChatBasedEntry] 透過聊天回推進場: userId=${userId} ${reason} nickname="${entryNickname}"`);
    addLog(`💬➡️👋 透過聊天回推 ${entryNickname || entryUniqueId} ${reason} 進場`);

    // 6. 呼叫 processEntry 觸發進場效果
    processEntry({
        nickname: entryNickname,
        uniqueId: entryUniqueId,
        userId: userId,
        level: level
    });
}

function saveEntryHistory(entry) {
    try {
        // 保留最近 1000 筆
        state.entryHistory.push(entry);
        if (state.entryHistory.length > 1000) {
            state.entryHistory = state.entryHistory.slice(-1000);
        }

        // 儲存到檔案
        const historyPath = path.join(DATA_DIR, 'entry_history.json');
        fs.writeFileSync(historyPath, JSON.stringify(state.entryHistory, null, 2), 'utf8');
    } catch (e) {
        console.error('儲存進場記錄失敗:', e.message);
    }
}

function loadEntryHistory() {
    try {
        const historyPath = path.join(DATA_DIR, 'entry_history.json');
        if (fs.existsSync(historyPath)) {
            state.entryHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        }
    } catch (e) {
        state.entryHistory = [];
    }
}

// ============ 效果觸發 ============
function triggerEffects(type, username, value, count) {
    // 轉盤觸發
    if (type === 'gift' && state.config.wheel_enabled) {
        const wheelGifts = state.config.wheel_gifts || [];
        const matched = wheelGifts.find(g =>
            g.name.toLowerCase() === value.toLowerCase()
        );
        if (matched) {
            const spins = (matched.spins || 1) * count;
            addLog(`🎡 觸發轉盤: ${username} x${spins}`);
            sendToGreenScreen('triggerWheel', { username, spins });
        }
    }

    // 盲盒觸發
    if (type === 'gift' && state.config.giftbox_enabled) {
        const giftboxGifts = state.config.giftbox_gifts || [];
        const matched = giftboxGifts.find(g =>
            g.name.toLowerCase() === value.toLowerCase()
        );
        if (matched) {
            const opens = (matched.count || 1) * count;
            addLog(`🎁 觸發盲盒: ${username} x${opens}`);
            sendToGreenScreen('triggerGiftbox', { username, opens });
        }
    }

    // 影片觸發
    if (state.config.video_enabled) {
        const videoGifts = state.config.video_gifts || [];
        for (const gift of videoGifts) {
            if (gift.enabled === false) continue;

            let matched = false;
            if (gift.trigger_type === 'gift' && type === 'gift') {
                matched = gift.name.toLowerCase() === value.toLowerCase();
            } else if (gift.trigger_type === 'chat' && type === 'chat') {
                matched = value.includes(gift.trigger_keyword);
            } else if (gift.trigger_type === 'like' && type === 'like') {
                matched = true;
            }

            if (matched) {
                addLog(`🎬 觸發影片: ${gift.name}`);
                sendToGreenScreen('triggerVideo', {
                    username,
                    path: gift.video_path,
                    speed: gift.video_speed || 1,
                    volume: gift.video_volume || 100,
                    seconds: gift.video_seconds || 0,
                    repeat: gift.video_repeat || 1,
                    priority: gift.video_priority || 1,
                    force_interrupt: gift.force_interrupt || false
                });
                break;
            }
        }
    }
}

function checkFirstInteraction(nickname, uniqueId, userId) {
    if (!userId || state.seenUsers.has(userId)) return;

    state.seenUsers.add(userId);

    const entryList = state.config.entry_list || [];
    for (const entry of entryList) {
        if (!entry.first_interaction) continue;

        const entryUserId = entry.user_id || '';
        const entryUsername = entry.username || '';

        if ((userId && entryUserId && entryUserId === userId) ||
            (userId && entryUsername === userId) ||
            (uniqueId && entryUsername.toLowerCase() === uniqueId.toLowerCase())) {
            addLog(`🎯 首次互動偵測: ${nickname || uniqueId}`);
            triggerEntryEffect(nickname, uniqueId, userId);
            return;
        }
    }
}

function triggerEntryEffect(nickname, uniqueId, userId, level = 0) {
    if (!state.config.entry_enabled) return;

    const entryList = state.config.entry_list || [];
    const entryConfig = state.config.entry_config || {};
    const displayName = nickname || uniqueId || '';

    // 1. 先檢查是否有特定用戶的進場效果
    let specificEntry = null;
    for (const entry of entryList) {
        if (entry.enabled === false) continue;

        const entryUsername = (entry.username || '').toLowerCase();
        const entryUserId = entry.user_id || '';

        let matched = false;
        // 按 user_id 匹配
        if (entryUserId && userId && entryUserId === userId) matched = true;
        // 按暱稱匹配
        else if (entryUsername && nickname && entryUsername === nickname.toLowerCase()) matched = true;
        // 按 uniqueId 匹配
        else if (entryUsername && uniqueId && entryUsername === uniqueId.toLowerCase()) matched = true;
        // 如果 username 欄位填的是 userId（7開頭19位數字），也嘗試匹配
        else if (entryUsername && userId && /^7\d{18}$/.test(entry.username) && entry.username === userId) matched = true;

        if (matched) {
            specificEntry = entry;
            console.log(`[Entry Match] 匹配到專屬進場: ${entry.username} -> userId=${userId}`);
            break;
        }
    }

    // 2. 決定使用哪個設定（特定用戶優先，否則用全局設定）
    const globalEnabled = entryConfig.enabled !== false;  // 預設開啟
    const useGlobalEffect = !specificEntry && globalEnabled && entryConfig.media_path;
    const effectConfig = specificEntry || (useGlobalEffect ? entryConfig : null);

    console.log(`[Entry Effect] specificEntry=${!!specificEntry} effectConfig=${!!effectConfig} media_path=${effectConfig?.media_path || 'none'}`);

    if (!effectConfig || !effectConfig.media_path) {
        console.log(`[Entry Effect] 跳過: 無效果設定或無媒體路徑`);
        return;
    }

    // 3. 冷卻檢查
    const cooldownKey = specificEntry ? (specificEntry.username || uniqueId) : `global_${uniqueId || nickname}`;
    const now = Date.now();
    const lastTrigger = state.entryCooldowns[cooldownKey] || 0;
    const cooldown = (effectConfig.cooldown || 300) * 1000;

    console.log(`[Entry Effect] cooldownKey=${cooldownKey} lastTrigger=${lastTrigger} cooldown=${cooldown}ms elapsed=${now - lastTrigger}ms`);

    if (now - lastTrigger < cooldown) {
        console.log(`[Entry Effect] 跳過: 冷卻中，還需 ${Math.ceil((cooldown - (now - lastTrigger)) / 1000)} 秒`);
        return;
    }
    state.entryCooldowns[cooldownKey] = now;

    // 4. 觸發效果
    const logPrefix = specificEntry ? '🎯 專屬進場' : '👋 進場效果';
    addLog(`${logPrefix}: ${displayName}${level > 0 ? ` Lv${level}` : ''}`);

    const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(effectConfig.media_path);
    console.log(`[Entry Effect] 觸發進場效果: ${displayName} 媒體=${effectConfig.media_path} isAudio=${isAudio}`);
    sendToGreenScreen('triggerEntry', {
        username: displayName,
        level: level,
        path: effectConfig.media_path,
        volume: effectConfig.volume || 100,
        force_interrupt: effectConfig.force_interrupt !== false,
        is_audio: isAudio,
        show_text: effectConfig.show_text || false,
        text: effectConfig.text || '',
        text_size: effectConfig.text_size || 48,
        text_color: effectConfig.text_color || '#ffffff',
        text_duration: effectConfig.text_duration || 5,
        is_specific: !!specificEntry
    });
}

function sendToGreenScreen(event, data) {
    if (state.greenWindow && !state.greenWindow.isDestroyed()) {
        console.log(`[sendToGreenScreen] 發送事件: ${event}`);
        state.greenWindow.webContents.send('green-screen-event', { event, data });
    } else {
        console.log(`[sendToGreenScreen] 綠幕視窗未開啟，無法發送: ${event}`);
    }
}

// ============ 視窗管理 ============
function createMainWindow() {
    state.mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        title: 'TikTok 直播互動系統'
    });

    // 隱藏選單
    Menu.setApplicationMenu(null);

    const htmlPath = isDev
        ? path.join(__dirname, '../web/index.html')
        : path.join(__dirname, '../web/index.html');

    state.mainWindow.loadFile(htmlPath);

    if (isDev) {
        state.mainWindow.webContents.openDevTools();
    }

    state.mainWindow.on('closed', () => {
        state.mainWindow = null;
        if (state.greenWindow) {
            state.greenWindow.close();
        }
        app.quit();
    });
}

function createGreenScreen(orientation = 'landscape') {
    if (state.greenWindow && !state.greenWindow.isDestroyed()) {
        state.greenWindow.focus();
        return;
    }

    const isPortrait = orientation === 'portrait';

    state.greenWindow = new BrowserWindow({
        width: isPortrait ? 450 : 800,
        height: isPortrait ? 800 : 600,
        minWidth: isPortrait ? 450 : 200,
        minHeight: isPortrait ? 800 : 200,
        maxWidth: isPortrait ? 450 : undefined,
        maxHeight: isPortrait ? 800 : undefined,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        show: false, // 等待 ready-to-show 事件後再顯示
        resizable: !isPortrait, // 直向模式固定尺寸
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const greenHtmlPath = path.join(__dirname, '../web/greenscreen.html');
    state.greenWindow.loadFile(greenHtmlPath);

    // 視窗載入完成後確保焦點和層級正確
    state.greenWindow.once('ready-to-show', () => {
        state.greenWindow.show();
        state.greenWindow.focus();
        // 使用更高的層級確保視窗保持在最上層
        state.greenWindow.setAlwaysOnTop(true, 'screen-saver');
    });

    // 確保視窗載入後也設定層級
    state.greenWindow.webContents.once('did-finish-load', () => {
        if (state.greenWindow && !state.greenWindow.isDestroyed()) {
            state.greenWindow.setAlwaysOnTop(true, 'screen-saver');
        }
    });

    // 當綠幕視窗失去焦點時，確保它仍然在最上層
    state.greenWindow.on('blur', () => {
        if (state.greenWindow && !state.greenWindow.isDestroyed()) {
            state.greenWindow.setAlwaysOnTop(true, 'screen-saver');
        }
    });

    // 當主視窗獲得焦點時，確保綠幕仍在上層（只添加一次）
    if (state.mainWindow && !state.mainWindowFocusListenerAdded) {
        state.mainWindowFocusListenerAdded = true;
        state.mainWindow.on('focus', () => {
            if (state.greenWindow && !state.greenWindow.isDestroyed()) {
                state.greenWindow.setAlwaysOnTop(true, 'screen-saver');
            }
        });
    }

    state.greenWindow.on('closed', () => {
        state.greenWindow = null;
    });
}

// ============ IPC 處理 ============
function setupIPC() {
    // 配置
    ipcMain.handle('get-config', () => state.config);
    ipcMain.handle('update-config', (_, updates) => updateConfig(updates));

    // 連接
    ipcMain.handle('connect-tiktok', () => connectTikTok());
    ipcMain.handle('disconnect-tiktok', () => disconnectTikTok());
    ipcMain.handle('get-status', () => ({ connected: state.connected }));

    // 日誌
    ipcMain.handle('get-logs', () => state.logs);

    // 綠幕
    ipcMain.handle('open-green-screen', (_, orientation) => {
        createGreenScreen(orientation);
    });

    ipcMain.handle('trigger-green-screen', (_, event, data) => {
        sendToGreenScreen(event, data);
    });

    // 檔案選擇
    ipcMain.handle('select-file', async (_, type) => {
        const filters = type === 'media'
            ? [{ name: '媒體檔案', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'ogg', 'm4a'] }]
            : [{ name: '影片檔案', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm'] }];

        const result = await dialog.showOpenDialog(state.mainWindow, {
            properties: ['openFile'],
            filters
        });

        return result.filePaths[0] || null;
    });

    // 模擬送禮
    ipcMain.handle('simulate-gift', (_, username, giftName, count) => {
        addLog(`🎮 模擬: ${username} 送出 ${giftName} x${count}`);
        triggerEffects('gift', username, giftName, count);
    });

    // 高等級用戶
    ipcMain.handle('get-all-accounts', () => {
        const accounts = Object.keys(state.highLevelUsers).map(account => ({
            account,
            count: Object.keys(state.highLevelUsers[account] || {}).length
        }));
        return { accounts, current: state.currentTikTokAccount };
    });

    ipcMain.handle('search-high-level-users', (_, query, account) => {
        console.log(`[Search] query="${query}" account="${account}"`);
        console.log(`[Search] 所有帳號:`, Object.keys(state.highLevelUsers));
        const users = state.highLevelUsers[account] || {};
        console.log(`[Search] 該帳號用戶數:`, Object.keys(users).length);
        const results = Object.values(users).filter(u => {
            if (!query) return true;
            const q = query.toLowerCase();
            return (u.nickname || '').toLowerCase().includes(q) ||
                   (u.uniqueId || '').toLowerCase().includes(q);
        });
        console.log(`[Search] 搜尋結果:`, results.length);
        return { results: results.slice(0, 50), total: results.length, account };
    });

    ipcMain.handle('get-high-level-users-count', (_, account) => {
        const count = Object.keys(state.highLevelUsers[account] || {}).length;
        return { count, account };
    });

    ipcMain.handle('clear-high-level-users', (_, account) => {
        if (state.highLevelUsers[account]) {
            state.highLevelUsers[account] = {};
            saveHighLevelUsers();
        }
    });

    // 綠幕位置保存（靜默保存，不觸發配置更新廣播，避免縮圖刷新）
    ipcMain.handle('save-greenscreen-positions', (_, positions) => {
        state.config.greenscreen_positions = positions;
        saveConfig();  // 只保存，不廣播
    });

    // 綠幕相關 - 供 greenscreen.html 使用
    ipcMain.handle('get-greenscreen-positions', () => {
        return state.config.greenscreen_positions || {};
    });

    ipcMain.handle('get-wheel-options', () => {
        return state.config.wheel_options || [];
    });

    ipcMain.handle('get-giftbox-options', () => {
        return state.config.giftbox_options || [];
    });

    ipcMain.handle('get-module-status', () => {
        return {
            wheel: state.config.wheel_enabled,
            video: state.config.video_enabled,
            entry: state.config.entry_enabled,
            giftbox: state.config.giftbox_enabled
        };
    });

    // 媒體 URL
    ipcMain.handle('get-media-url', (_, filePath) => {
        return `http://127.0.0.1:${state.mediaServerPort}/media?path=${encodeURIComponent(filePath)}`;
    });

    // 彈幕顯示控制
    ipcMain.handle('toggle-chat-display', (_, enabled) => {
        state.chatDisplayEnabled = enabled;
        addLog(`彈幕顯示: ${enabled ? '開啟' : '關閉'}`);
        return { success: true, enabled };
    });

    ipcMain.handle('get-chat-display-status', () => {
        return { enabled: state.chatDisplayEnabled || false };
    });

    // 綠幕視窗控制
    ipcMain.handle('close-green-screen', () => {
        if (state.greenWindow && !state.greenWindow.isDestroyed()) {
            state.greenWindow.close();
        }
    });

    ipcMain.handle('minimize-green-screen', () => {
        if (state.greenWindow && !state.greenWindow.isDestroyed()) {
            state.greenWindow.minimize();
        }
    });

    ipcMain.handle('toggle-maximize-green-screen', () => {
        if (state.greenWindow && !state.greenWindow.isDestroyed()) {
            if (state.greenWindow.isMaximized()) {
                state.greenWindow.unmaximize();
            } else {
                state.greenWindow.maximize();
            }
        }
    });
}

// ============ 應用啟動 ============
app.whenReady().then(() => {
    loadConfig();
    loadHighLevelUsers();
    loadEntryHistory();
    loadUserCache();  // 載入用戶快取
    startMediaServer();
    setupIPC();
    setupAutoUpdater();
    createMainWindow();

    // 每 30 秒儲存用戶快取
    state.userCacheSaveInterval = setInterval(saveUserCache, 30000);

    addLog('系統已就緒，等待連接...');

    // 啟動後檢查更新
    if (autoUpdater) {
        setTimeout(() => {
            autoUpdater.checkForUpdates().catch(err => {
                console.log('檢查更新失敗:', err.message);
            });
        }, 3000);
    }
});

// ============ 自動更新 ============
function setupAutoUpdater() {
    if (!autoUpdater) {
        // 如果沒有 autoUpdater，仍註冊 IPC handlers 但返回錯誤
        ipcMain.handle('check-for-update', async () => ({ available: false, error: 'Auto-updater not installed' }));
        ipcMain.handle('download-update', async () => ({ success: false, error: 'Auto-updater not installed' }));
        ipcMain.handle('install-update', () => {});
        ipcMain.handle('get-app-version', () => app.getVersion());
        return;
    }

    autoUpdater.on('checking-for-update', () => {
        addLog('正在檢查更新...');
    });

    autoUpdater.on('update-available', (info) => {
        addLog(`發現新版本: ${info.version}`);
        // 通知前端有更新
        if (state.mainWindow) {
            state.mainWindow.webContents.send('update-available', info);
        }
    });

    autoUpdater.on('update-not-available', () => {
        addLog('已是最新版本');
    });

    autoUpdater.on('download-progress', (progress) => {
        const percent = Math.round(progress.percent);
        addLog(`下載進度: ${percent}%`);
        if (state.mainWindow) {
            state.mainWindow.webContents.send('update-progress', percent);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        addLog('更新已下載，將在重啟後安裝');
        if (state.mainWindow) {
            state.mainWindow.webContents.send('update-downloaded', info);
        }
        // 彈出提示
        dialog.showMessageBox(state.mainWindow, {
            type: 'info',
            title: '更新已就緒',
            message: `新版本 ${info.version} 已下載完成`,
            detail: '重啟應用程式以完成更新',
            buttons: ['立即重啟', '稍後'],
            defaultId: 0
        }).then(result => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on('error', (err) => {
        console.log('更新錯誤:', err.message);
    });

    // IPC 處理
    ipcMain.handle('check-for-update', async () => {
        try {
            const result = await autoUpdater.checkForUpdates();
            return { available: !!result.updateInfo };
        } catch (e) {
            return { available: false, error: e.message };
        }
    });

    ipcMain.handle('download-update', async () => {
        try {
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('install-update', () => {
        autoUpdater.quitAndInstall();
    });

    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });
}

app.on('window-all-closed', () => {
    disconnectTikTok();
    saveUserCache();  // 儲存用戶快取
    // 清理定時器
    if (state.userCacheSaveInterval) {
        clearInterval(state.userCacheSaveInterval);
        state.userCacheSaveInterval = null;
    }
    if (state.mediaServer) {
        state.mediaServer.close();
    }
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
