/**
 * LiveGift Pro - 直播互動系統
 * Electron 主進程
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const express = require('express');
const http = require('http');
const firebase = require('./firebase');  // 世界榜 Firebase 服務

// ============ 調試設定 ============
const DEBUG_MODE = false;
const debugLog = (...args) => { if (DEBUG_MODE) console.log('[DEBUG]', ...args); };

// ============ GPU 硬體加速設定 ============
// 永遠停用硬體加速，避免某些電腦關閉時重開機的問題
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

// ============ 自動更新設定 (可選) ============
let autoUpdater = null;
try {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload = true;  // 自動下載更新
    autoUpdater.autoInstallOnAppQuit = true;
    // 繞過代理設定，直接連線
    autoUpdater.netSession = {
        resolveProxy: () => Promise.resolve('DIRECT')
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
    worldChampionGiftReady: {},  // 進場後送禮才觸發世界冠軍特效
    lastLeaderboardUpdate: 0,    // 排行榜最後更新時間（用於查詢冷卻）
    giftDedup: {},
    entryDedup: {},           // 進場去重 (userId -> {time, logged})
    pendingEntries: {},       // 待處理進場 (userId -> {nickname, uniqueId, level, time})
    entryHistory: [],         // 進場歷史記錄
    seenUsers: new Set(),
    highLevelUsers: {},
    currentTikTokAccount: '',
    chatDisplayEnabled: false,
    userNicknameCache: new Map(),  // 用戶暱稱快取 (userId -> {nickname, uniqueId, time})
    mainWindowFocusListenerAdded: false,  // 追蹤 focus 監聯器是否已添加
    duckCount: 0,             // 抓鴨子計數
    lastDuckVideo: null,      // 上次播放的鴨子影片
    duckPityCounter: 0,       // 保底計數器
    chainBattleActive: false, // 鎖鏈對抗是否進行中
    chainLockWindow: null,    // 鎖鏈對抗專用全螢幕視窗
    chainCount: 0,            // 目前鎖鏈數（主進程管理）
    chokingActive: false,     // 窒息挑戰是否進行中
    duckLeaderboard: {        // 抓鴨子排行榜
        totalRanking: [],     // 累計排行（每週重置）[{uniqueId, nickname, avatar, totalDucks}]
        singleHighest: [],    // 單次最高（每天重置）[{uniqueId, nickname, avatar, amount, date}]
        allTimeStats: [],     // 總體資料庫（永久）[{uniqueId, nickname, avatar, totalDucks}]
        worldRanking: [],     // 世界榜專用（每月重置）[{uniqueId, nickname, avatar, totalCaught}] - 只加不減
        lastWeeklyReset: null, // 上次週重置時間
        lastDailyReset: null,  // 上次日重置時間
        lastMonthlyReset: null // 上次月重置時間（世界榜）
    },
    duckCatchQueue: [],       // 抓鴨子隊列
    duckCatchProcessing: false, // 是否正在處理隊列
    // 重連機制
    reconnectEnabled: true,    // 是否啟用自動重連
    reconnectAttempts: 0,      // 當前重連嘗試次數
    reconnectMaxAttempts: 5,   // 最大重連嘗試次數
    reconnectDelay: 5000,      // 重連間隔（毫秒）
    reconnectTimer: null,      // 重連計時器
    manualDisconnect: false,    // 是否為手動斷線（手動斷線不重連）
    worldChampion: null,        // 當前世界冠軍（緩存）
    pendingWorldChampionCrown: null,  // 待播放的世界冠軍登頂特效
    entryEffectQueue: [],       // 進場特效隊列
    entryEffectPlaying: false,  // 是否正在播放進場特效
    // 自動備份
    autoBackupTimer: null,
    lastBackupTime: null,
    // 連擊 Combo
    duckComboState: {}          // { uniqueId: { count, lastTime } }
};

// ============ 路徑設定 ============
const isDev = process.argv.includes('--dev');
const DATA_DIR = isDev
    ? path.join(__dirname, '..')
    : app.getPath('userData');  // 使用 userData 目錄，更新時不會遺失設定
const OLD_DATA_DIR = isDev ? null : path.dirname(app.getPath('exe'));
const CONFIG_PATH = path.join(DATA_DIR, 'tiktok_config.json');
const HIGH_LEVEL_USERS_PATH = path.join(DATA_DIR, 'high_level_users.json');
const USER_CACHE_PATH = path.join(DATA_DIR, 'user_cache.json');
const LEADERBOARD_PATH = path.join(DATA_DIR, 'duck_leaderboard.json');
const DUCK_STATE_PATH = path.join(DATA_DIR, 'duck_state.json');

// 遷移舊設定檔到新位置
function migrateOldConfig() {
    if (isDev) return;

    const filesToMigrate = [
        'tiktok_config.json',
        'high_level_users.json',
        'user_cache.json',
        'duck_leaderboard.json',
        'duck_state.json',
        'entry_history.json'
    ];

    // 可能的舊 userData 目錄（如果 app name 曾經改變過）
    const appDataPath = process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Roaming');
    const possibleOldUserDataDirs = [
        path.join(appDataPath, 'tiktok-live'),
        path.join(appDataPath, 'TikTok-Live'),
        path.join(appDataPath, 'tiktok-live-electron'),
        path.join(appDataPath, 'TikTokLive-Electron'),
        path.join(appDataPath, 'LiveGift Pro'),
        OLD_DATA_DIR  // exe 目錄
    ].filter(Boolean);

    for (const file of filesToMigrate) {
        const newPath = path.join(DATA_DIR, file);

        // 如果新檔案已存在，跳過
        if (fs.existsSync(newPath)) continue;

        // 從各個可能的舊位置尋找並遷移
        for (const oldDir of possibleOldUserDataDirs) {
            if (!oldDir) continue;
            const oldPath = path.join(oldDir, file);
            if (fs.existsSync(oldPath)) {
                try {
                    fs.copyFileSync(oldPath, newPath);
                    console.log(`已從 ${oldDir} 遷移設定檔: ${file}`);
                    break;  // 找到就停止
                } catch (e) {
                    console.error(`遷移 ${file} 失敗:`, e);
                }
            }
        }
    }
}

// ============ 配置管理 ============
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            state.config = JSON.parse(data);
            // 遷移舊版 video_gifts 到場景系統
            migrateToSceneSystem();
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

// 遷移舊版 video_gifts 到場景系統
function migrateToSceneSystem() {
    let needSave = false;

    // 如果沒有 scenes，初始化
    if (!state.config.scenes) {
        state.config.scenes = [{
            id: 'default',
            name: '預設場景',
            video_gifts: []
        }];
        state.config.activeSceneId = 'default';
        needSave = true;
    }

    // 如果有舊版 video_gifts，遷移到預設場景
    if (state.config.video_gifts && state.config.video_gifts.length > 0) {
        const defaultScene = state.config.scenes.find(s => s.id === 'default');
        if (defaultScene) {
            defaultScene.video_gifts = state.config.video_gifts;
        }
        delete state.config.video_gifts;
        needSave = true;
        console.log('已遷移 video_gifts 到場景系統');
    }

    if (needSave) {
        saveConfig();
    }
}

function getDefaultConfig() {
    return {
        port: 10010,
        wheel_enabled: true,
        video_enabled: true,
        random_video_enabled: false,
        duck_catch_enabled: false,
        entry_enabled: false,
        giftbox_enabled: false,
        wheel_gifts: [],
        // 場景系統 - 每個場景有獨立的禮物觸發影片設定
        scenes: [
            {
                id: 'default',
                name: '預設場景',
                video_gifts: []
            }
        ],
        activeSceneId: 'default',
        random_video_list: [],
        duck_catch_config: {
            trigger_type: 'gift',
            trigger_gift: '',
            trigger_keyword: '',
            catch_rate: 50,
            video_speed: 1,
            video_volume: 100,
            video_seconds: 0,
            video_priority: 1,
            force_interrupt: false,
            quack_sound: '',
            caught_videos: [],  // [{path, weight, amount}]
            missed_videos: [],  // [{path, weight}]
            pity_enabled: false,      // 保底功能
            pity_threshold: 1000,     // 第一層保底次數
            pity_min_amount: 5000,    // 第一層保底最低鴨子數
            pity_threshold_jackpot: 2000,  // 第二層保底次數（終極保底）
            pity_jackpot_amount: 10000,    // 第二層保底鴨子數（大獎）
            soft_pity_enabled: false,      // 軟保底（漸進提升機率）
            soft_pity_start: 70,           // 軟保底起始百分比
            combo_enabled: false,          // 連擊機制
            combo_window: 30,              // 連擊時間窗口（秒）
            combo_multipliers: [1, 1.5, 2, 3]  // 連擊倍率
        },
        milestone_firework_video: '',  // 里程碑慶祝煙火影片路徑
        world_champion_gift_video: '', // 世界冠軍送禮特效影片路徑
        wheel_options: [],
        giftbox_gifts: [],
        giftbox_options: [],
        entry_list: [],
        api_key: '',
        tiktok_username: '',
        auto_open_green_screen: false,
        language: 'zh-TW',
        auto_backup_enabled: true,
        auto_backup_interval: 30,        // 自動備份間隔（分鐘）
        auto_backup_max_count: 5,        // 保留最近 N 組備份
        greenscreen_leaderboard_count: 5,
        greenscreen_leaderboard_rotate: true,
        greenscreen_leaderboard_rotate_interval: 5,  // 秒
        greenscreen_positions: {
            wheel: { width: 350, height: 350, left: 0, top: 150, visible: false },
            giftbox: { width: 200, height: 200, left: 465, top: 245, visible: false, autoHide: true },
            videoContainers: {},
            videoModuleVisible: true,
            duckCounter: { left: 50, top: 50, visible: true, fontSize: 48 },
            leaderboard: { left: 50, top: 150, width: 300, height: 400, visible: true },
            pityCounter: { left: 50, top: 570, visible: true, fontSize: 24 }
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

// ============ 場景管理 ============
// 取得當前場景
function getActiveScene() {
    const scenes = state.config.scenes || [];
    const activeId = state.config.activeSceneId || 'default';
    return scenes.find(s => s.id === activeId) || scenes[0] || { id: 'default', name: '預設場景', video_gifts: [] };
}

// 取得當前場景的禮物影片設定
function getActiveSceneVideoGifts() {
    const scene = getActiveScene();
    return scene.video_gifts || [];
}

// 切換場景
function switchScene(sceneId) {
    const scenes = state.config.scenes || [];
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
        state.config.activeSceneId = sceneId;
        saveConfig();
        // 通知所有視窗場景已切換
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('scene-changed', { sceneId, scene });
        }
        // 重新註冊影片快捷鍵
        registerVideoShortcuts();
        addLog(`🎬 已切換到場景: ${scene.name}`);
        return { success: true, scene };
    }
    return { success: false, error: '場景不存在' };
}

// 新增場景
function createScene(name) {
    const scenes = state.config.scenes || [];
    const id = 'scene_' + Date.now();
    const newScene = {
        id,
        name: name || `場景 ${scenes.length + 1}`,
        video_gifts: []
    };
    scenes.push(newScene);
    state.config.scenes = scenes;
    saveConfig();
    return { success: true, scene: newScene };
}

// 刪除場景
function deleteScene(sceneId) {
    if (sceneId === 'default') {
        return { success: false, error: '無法刪除預設場景' };
    }
    const scenes = state.config.scenes || [];
    const index = scenes.findIndex(s => s.id === sceneId);
    if (index === -1) {
        return { success: false, error: '場景不存在' };
    }
    scenes.splice(index, 1);
    state.config.scenes = scenes;
    // 如果刪除的是當前場景，切換到預設場景
    if (state.config.activeSceneId === sceneId) {
        state.config.activeSceneId = 'default';
    }
    saveConfig();
    return { success: true };
}

// 重新命名場景
function renameScene(sceneId, newName) {
    const scenes = state.config.scenes || [];
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
        scene.name = newName;
        saveConfig();
        return { success: true, scene };
    }
    return { success: false, error: '場景不存在' };
}

// 更新場景的禮物影片設定
function updateSceneVideoGifts(sceneId, videoGifts) {
    const scenes = state.config.scenes || [];
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
        scene.video_gifts = videoGifts;
        saveConfig();
        // 如果是當前場景，重新註冊快捷鍵
        if (sceneId === state.config.activeSceneId) {
            registerVideoShortcuts();
        }
        return { success: true, scene };
    }
    return { success: false, error: '場景不存在' };
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

// 記錄高等級用戶（從任何互動事件調用）
function recordHighLevelUser(userId, nickname, uniqueId, level) {
    if (!userId || !state.currentTikTokAccount) return;
    if (level < 20) return;  // 只記錄 Lv20+

    const account = state.currentTikTokAccount;
    if (!state.highLevelUsers[account]) {
        state.highLevelUsers[account] = {};
    }

    const existing = state.highLevelUsers[account][userId];
    if (existing) {
        // 更新暱稱（如果有更好的資訊）
        let updated = false;
        if (nickname && (!existing.nickname || existing.nickname.startsWith('Lv'))) {
            existing.nickname = nickname;
            updated = true;
        }
        if (uniqueId && !existing.uniqueId) {
            existing.uniqueId = uniqueId;
            updated = true;
        }
        if (level > existing.level) {
            existing.level = level;
            updated = true;
        }
        if (updated) {
            saveHighLevelUsers();
            console.log(`[HighLevelUser] 更新: userId=${userId} Lv${level} nickname="${nickname}"`);
        }
    } else {
        // 新增用戶
        state.highLevelUsers[account][userId] = {
            nickname: nickname || uniqueId || `Lv${level}用戶`,
            uniqueId: uniqueId || '',
            userId,
            level,
            first_seen: new Date().toLocaleString('zh-TW')
        };
        saveHighLevelUsers();
        console.log(`[HighLevelUser] 新增: userId=${userId} Lv${level} nickname="${nickname || '(無)'}"`);
    }
}

// ============ 日誌管理 ============
function addLog(message) {
    const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    const logEntry = `[${timestamp}] ${message}`;
    state.logs.push(logEntry);
    if (state.logs.length > 5000) {
        state.logs = state.logs.slice(-5000);
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

        // 代理設定 - 只傳代理 URL 給 server.js，不設全域 HTTP_PROXY（會干擾 Sign Server）
        if (state.config.proxy_enabled && state.config.proxy_url) {
            env.TIKTOK_PROXY = state.config.proxy_url;
            console.log(`[Proxy] 使用代理: ${state.config.proxy_url}`);
            addLog(`🌐 使用代理: ${state.config.proxy_url}`);
        }

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

    // 重置手動斷線標記（允許自動重連）
    state.manualDisconnect = false;
    cancelReconnect();

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

                // 如果不是手動斷線且啟用重連，則嘗試重連
                if (!state.manualDisconnect && state.reconnectEnabled) {
                    attemptReconnect();
                }
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
    // 標記為手動斷線，不觸發自動重連
    state.manualDisconnect = true;
    cancelReconnect();

    if (state.wsClient) {
        state.wsClient.close();
        state.wsClient = null;
    }
    stopNodeServer();
    state.connected = false;
    addLog('已斷開連接');
}

// 取消重連
function cancelReconnect() {
    if (state.reconnectTimer) {
        clearTimeout(state.reconnectTimer);
        state.reconnectTimer = null;
    }
    state.reconnectAttempts = 0;
}

// 嘗試重連
async function attemptReconnect() {
    // 如果已取消重連或已連接，則跳過
    if (state.manualDisconnect || state.connected) {
        return;
    }

    // 檢查重連次數
    if (state.reconnectAttempts >= state.reconnectMaxAttempts) {
        addLog(`❌ 已達最大重連次數 (${state.reconnectMaxAttempts})，停止重連`);
        state.reconnectAttempts = 0;
        // 通知前端連接失敗
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('connection-failed', {
                reason: '多次重連失敗',
                attempts: state.reconnectMaxAttempts
            });
        }
        return;
    }

    state.reconnectAttempts++;
    const delay = state.reconnectDelay * state.reconnectAttempts; // 遞增延遲

    addLog(`🔄 ${delay / 1000} 秒後嘗試重連... (${state.reconnectAttempts}/${state.reconnectMaxAttempts})`);

    // 通知前端正在重連
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
        state.mainWindow.webContents.send('reconnecting', {
            attempt: state.reconnectAttempts,
            maxAttempts: state.reconnectMaxAttempts,
            delay: delay
        });
    }

    state.reconnectTimer = setTimeout(async () => {
        if (state.manualDisconnect || state.connected) {
            return;
        }

        addLog(`🔄 正在重連... (${state.reconnectAttempts}/${state.reconnectMaxAttempts})`);

        try {
            const result = await connectTikTok();
            if (result.success) {
                addLog('✅ 重連成功！');
                state.reconnectAttempts = 0;
                state.manualDisconnect = false;
            } else {
                // 連接失敗，繼續嘗試
                attemptReconnect();
            }
        } catch (e) {
            console.error('重連錯誤:', e);
            attemptReconnect();
        }
    }, delay);
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

// ============ 排行榜管理 ============
let leaderboardLoadFailed = false;  // 標記載入是否失敗，防止覆蓋損壞的檔案

function loadLeaderboard() {
    try {
        if (fs.existsSync(LEADERBOARD_PATH)) {
            // 先備份原檔案
            const backupPath = LEADERBOARD_PATH + '.bak';
            fs.copyFileSync(LEADERBOARD_PATH, backupPath);

            const data = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, 'utf8'));
            state.duckLeaderboard = {
                totalRanking: data.totalRanking || [],
                singleHighest: data.singleHighest || [],
                allTimeStats: data.allTimeStats || [],
                worldRanking: data.worldRanking || [],  // 世界榜專用
                lastWeeklyReset: data.lastWeeklyReset || null,
                lastDailyReset: data.lastDailyReset || null,
                lastMonthlyReset: data.lastMonthlyReset || null  // 世界榜月重置
            };
            leaderboardLoadFailed = false;
            console.log(`[Leaderboard] 已載入排行榜: 累計${state.duckLeaderboard.totalRanking.length}人, 單次${state.duckLeaderboard.singleHighest.length}人, 總體${state.duckLeaderboard.allTimeStats.length}人, 世界榜${state.duckLeaderboard.worldRanking.length}人`);

            // 檢查是否需要自動重置
            checkLeaderboardReset();
        }
    } catch (e) {
        leaderboardLoadFailed = true;
        console.error('[Leaderboard] 載入失敗，已保留備份檔案 (.bak):', e.message);
        addLog(`⚠️ 排行榜載入失敗: ${e.message}，原檔案已備份為 .bak`);
    }
}

// 檢查並執行排行榜自動重置
function checkLeaderboardReset() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 取得本週日的日期（週日為一週的最後一天）
    const dayOfWeek = now.getDay(); // 0 = 週日
    const thisSunday = new Date(now);
    thisSunday.setDate(now.getDate() + (7 - dayOfWeek) % 7);
    const thisSundayStr = thisSunday.toISOString().split('T')[0];

    // 檢查每日重置（單次最高）
    if (state.duckLeaderboard.lastDailyReset !== today) {
        console.log('[Leaderboard] 執行每日重置（單次最高）');
        state.duckLeaderboard.singleHighest = [];
        state.duckLeaderboard.lastDailyReset = today;
        saveLeaderboard();
        addLog('🔄 單次最高排行榜已自動重置（每日）');
    }

    // 檢查每週重置（累計排行）- 週一 00:00 後重置
    const lastWeeklyReset = state.duckLeaderboard.lastWeeklyReset;
    if (dayOfWeek === 1) { // 今天是週一
        if (!lastWeeklyReset || lastWeeklyReset !== today) {
            console.log('[Leaderboard] 執行每週重置（累計排行）');
            state.duckLeaderboard.totalRanking = [];
            state.duckLeaderboard.lastWeeklyReset = today;
            saveLeaderboard();
            addLog('🔄 累計排行榜已自動重置（每週一）');
        }
    }

    // 檢查每月重置（世界榜）- 每月 1 日 00:00 後重置
    const dayOfMonth = now.getDate();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // 格式: 2024-01
    const lastMonthlyReset = state.duckLeaderboard.lastMonthlyReset;
    if (dayOfMonth === 1) { // 今天是月初
        if (!lastMonthlyReset || lastMonthlyReset !== currentMonth) {
            console.log('[Leaderboard] 執行每月重置（世界榜）');
            state.duckLeaderboard.worldRanking = [];
            state.duckLeaderboard.lastMonthlyReset = currentMonth;
            saveLeaderboard();
            addLog('🔄 世界榜專用排行已自動重置（每月初）');
        }
    }
}

// 設定排行榜自動重置定時器
function setupLeaderboardResetTimer() {
    // 每分鐘檢查一次是否需要重置
    setInterval(() => {
        checkLeaderboardReset();
    }, 60 * 1000); // 60秒

    // 計算到下一個午夜的時間，設定精確的重置
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
        checkLeaderboardReset();
        // 之後每24小時執行一次
        setInterval(() => {
            checkLeaderboardReset();
        }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    console.log(`[Leaderboard] 已設定自動重置定時器，距離下次午夜: ${Math.round(msUntilMidnight / 1000 / 60)}分鐘`);
}

function saveLeaderboard() {
    // 如果載入時失敗，不要覆蓋原檔案（防止資料遺失）
    if (leaderboardLoadFailed) {
        console.log('[Leaderboard] 跳過儲存（載入時失敗，保護原檔案）');
        return;
    }
    try {
        fs.writeFileSync(LEADERBOARD_PATH, JSON.stringify(state.duckLeaderboard, null, 2), 'utf8');
        console.log('[Leaderboard] 已儲存排行榜');
    } catch (e) {
        console.error('[Leaderboard] 儲存失敗:', e.message);
    }
}

// ============ 鴨子狀態管理（計數器和保底）============
function loadDuckState() {
    try {
        if (fs.existsSync(DUCK_STATE_PATH)) {
            const data = JSON.parse(fs.readFileSync(DUCK_STATE_PATH, 'utf8'));
            state.duckCount = data.duckCount || 0;
            state.duckPityCounter = data.duckPityCounter || 0;
            console.log(`[DuckState] 已載入: 鴨子數=${state.duckCount}, 保底=${state.duckPityCounter}`);
        }
    } catch (e) {
        console.error('[DuckState] 載入失敗:', e.message);
    }
}

function saveDuckState() {
    try {
        const data = {
            duckCount: state.duckCount,
            duckPityCounter: state.duckPityCounter,
            lastSaved: new Date().toISOString()
        };
        fs.writeFileSync(DUCK_STATE_PATH, JSON.stringify(data, null, 2), 'utf8');
        console.log(`[DuckState] 已儲存: 鴨子數=${state.duckCount}, 保底=${state.duckPityCounter}`);
    } catch (e) {
        console.error('[DuckState] 儲存失敗:', e.message);
    }
}

// ============ 自動備份 ============
function performBackup() {
    try {
        const backupDir = path.join(DATA_DIR, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (fs.existsSync(LEADERBOARD_PATH)) {
            fs.copyFileSync(LEADERBOARD_PATH, path.join(backupDir, `duck_leaderboard_${timestamp}.json`));
        }
        if (fs.existsSync(DUCK_STATE_PATH)) {
            fs.copyFileSync(DUCK_STATE_PATH, path.join(backupDir, `duck_state_${timestamp}.json`));
        }

        state.lastBackupTime = new Date().toISOString();
        cleanOldBackups(backupDir);
        console.log(`[Backup] 備份完成: ${timestamp}`);
        addLog(`💾 自動備份完成`);

        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('backup-completed', state.lastBackupTime);
        }
    } catch (e) {
        console.error('[Backup] 備份失敗:', e.message);
    }
}

function cleanOldBackups(backupDir) {
    try {
        const maxCount = state.config.auto_backup_max_count || 5;
        const files = fs.readdirSync(backupDir).filter(f => f.startsWith('duck_leaderboard_')).sort();
        while (files.length > maxCount) {
            const oldest = files.shift();
            const stateFile = oldest.replace('duck_leaderboard_', 'duck_state_');
            try { fs.unlinkSync(path.join(backupDir, oldest)); } catch (e) { /* ignore */ }
            try { fs.unlinkSync(path.join(backupDir, stateFile)); } catch (e) { /* ignore */ }
        }
    } catch (e) {
        console.error('[Backup] 清理舊備份失敗:', e.message);
    }
}

function setupAutoBackup() {
    if (state.autoBackupTimer) clearInterval(state.autoBackupTimer);
    const interval = (state.config.auto_backup_interval || 30) * 60 * 1000;
    if (state.config.auto_backup_enabled !== false) {
        state.autoBackupTimer = setInterval(performBackup, interval);
    }
}

// 更新排行榜（當抓到鴨子時呼叫）
// isPity: 是否為保底觸發（保底不計入單次最高里程碑）
function updateLeaderboard(userInfo, duckAmount, isPity = false) {
    if (!userInfo || !duckAmount || duckAmount <= 0) return;

    const uniqueId = userInfo.uniqueId || userInfo.userId || '';
    const nickname = userInfo.nickname || uniqueId || '未知用戶';
    const avatar = userInfo.avatar || userInfo.profilePictureUrl || '';

    if (!uniqueId) return;

    // 記錄更新前的第一名（用於里程碑檢測）
    const prevTotalFirst = state.duckLeaderboard.totalRanking[0] || null;
    const prevSingleFirst = state.duckLeaderboard.singleHighest[0] || null;

    // 1. 更新累計排行（每週重置）
    let totalEntry = state.duckLeaderboard.totalRanking.find(e => e.uniqueId === uniqueId);
    if (totalEntry) {
        totalEntry.totalDucks += duckAmount;
        totalEntry.nickname = nickname || totalEntry.nickname;
        totalEntry.avatar = avatar || totalEntry.avatar;
    } else {
        state.duckLeaderboard.totalRanking.push({
            uniqueId,
            nickname,
            avatar,
            totalDucks: duckAmount
        });
    }
    // 排序並保留前 50 名
    state.duckLeaderboard.totalRanking.sort((a, b) => b.totalDucks - a.totalDucks);
    state.duckLeaderboard.totalRanking = state.duckLeaderboard.totalRanking.slice(0, 50);

    // 2. 更新總體資料庫（永久，不重置）
    let allTimeEntry = state.duckLeaderboard.allTimeStats.find(e => e.uniqueId === uniqueId);
    if (allTimeEntry) {
        allTimeEntry.totalDucks += duckAmount;
        allTimeEntry.nickname = nickname || allTimeEntry.nickname;
        allTimeEntry.avatar = avatar || allTimeEntry.avatar;
    } else {
        state.duckLeaderboard.allTimeStats.push({
            uniqueId,
            nickname,
            avatar,
            totalDucks: duckAmount
        });
    }
    // 排序（不限制數量，保留所有人）
    state.duckLeaderboard.allTimeStats.sort((a, b) => b.totalDucks - a.totalDucks);

    // 3. 更新世界榜專用排行（每月重置，只加不減）
    let worldEntry = state.duckLeaderboard.worldRanking.find(e => e.uniqueId === uniqueId);
    if (worldEntry) {
        worldEntry.totalCaught += duckAmount;
        worldEntry.nickname = nickname || worldEntry.nickname;
        worldEntry.avatar = avatar || worldEntry.avatar;
    } else {
        state.duckLeaderboard.worldRanking.push({
            uniqueId,
            nickname,
            avatar,
            totalCaught: duckAmount
        });
    }
    // 排序（不限制數量，保留所有人）
    state.duckLeaderboard.worldRanking.sort((a, b) => b.totalCaught - a.totalCaught);

    // 4. 更新單次最高排行（每天重置）
    let singleEntry = state.duckLeaderboard.singleHighest.find(e => e.uniqueId === uniqueId);
    let newSingleRecord = false;
    if (singleEntry) {
        if (duckAmount > singleEntry.amount) {
            singleEntry.amount = duckAmount;
            singleEntry.date = new Date().toISOString().split('T')[0];
            singleEntry.nickname = nickname || singleEntry.nickname;
            singleEntry.avatar = avatar || singleEntry.avatar;
            newSingleRecord = true;
        }
    } else {
        state.duckLeaderboard.singleHighest.push({
            uniqueId,
            nickname,
            avatar,
            amount: duckAmount,
            date: new Date().toISOString().split('T')[0]
        });
        newSingleRecord = true;
    }
    // 排序並保留前 50 名
    state.duckLeaderboard.singleHighest.sort((a, b) => b.amount - a.amount);
    state.duckLeaderboard.singleHighest = state.duckLeaderboard.singleHighest.slice(0, 50);

    // 儲存
    saveLeaderboard();
    state.lastLeaderboardUpdate = Date.now();

    // 通知前端更新
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
        state.mainWindow.webContents.send('leaderboard-updated', state.duckLeaderboard);
    }

    // 不直接通知綠幕 - 改為在 triggerDuckVideo 中傳遞排行榜資料
    // sendToGreenScreen('updateLeaderboard', state.duckLeaderboard);

    // === 同步到 Firebase 世界榜（使用 worldRanking，只加不減，每月重置）===
    const userWorldStats = state.duckLeaderboard.worldRanking.find(u => u.uniqueId === uniqueId);
    const WORLD_MILESTONE = 10000;

    if (userWorldStats && firebase.isConfigured()) {
        // 同步判斷：達到 1 萬且超越現任冠軍 → 立即設定登頂資料（不等 Firebase 回應）
        const currentChampionDucks = state.worldChampion?.totalDucks || 0;
        const isNewChampion = userWorldStats.totalCaught >= WORLD_MILESTONE &&
            userWorldStats.totalCaught > currentChampionDucks &&
            uniqueId !== state.worldChampion?.uniqueId;

        if (isNewChampion) {
            state.worldChampion = { uniqueId, nickname: userWorldStats.nickname, totalDucks: userWorldStats.totalCaught };
            addLog(`🏆 世界榜！${userWorldStats.nickname} 成為新的世界第一名！(${userWorldStats.totalCaught}🦆)`, 'success');
            // 立即設定，讓當下影片結束後播放（使用里程碑煙火影片）
            const crownVideo = state.config.milestone_firework_video || '';
            if (crownVideo && fs.existsSync(crownVideo)) {
                state.pendingWorldChampionCrown = {
                    nickname: userWorldStats.nickname,
                    avatar: userWorldStats.avatar || '',
                    totalDucks: userWorldStats.totalCaught,
                    videoPath: crownVideo
                };
            }
        }

        // Firebase 同步（背景執行）
        firebase.updateWorldLeaderboard(
            uniqueId,
            userWorldStats.nickname,
            userWorldStats.avatar,
            userWorldStats.totalCaught
        ).catch(err => {
            console.error('[世界榜] 同步失敗:', err);
        });
    }

    // === 里程碑檢測（返回里程碑資料，不直接觸發）===
    const newTotalFirst = state.duckLeaderboard.totalRanking[0] || null;
    const newSingleFirst = state.duckLeaderboard.singleHighest[0] || null;
    let milestoneData = null;

    // 取得里程碑影片路徑
    const fireworkVideo = state.config.milestone_firework_video || '';
    const hasFireworkVideo = fireworkVideo && fs.existsSync(fireworkVideo);

    // 里程碑 1: 累計第一名達到 10000+，或有人超越現任第一名
    const TOTAL_MILESTONE = 10000;
    if (newTotalFirst && newTotalFirst.totalDucks >= TOTAL_MILESTONE && hasFireworkVideo) {
        // 觸發條件：
        // 1. 之前沒有第一名
        // 2. 新的第一名是不同的人（有人超越了）
        // 3. 同一個人首次達到 10000
        const isNewChampion = !prevTotalFirst ||
            prevTotalFirst.uniqueId !== newTotalFirst.uniqueId ||
            (prevTotalFirst.totalDucks < TOTAL_MILESTONE && newTotalFirst.totalDucks >= TOTAL_MILESTONE);

        if (isNewChampion) {
            const reason = !prevTotalFirst ? '成為首位累計冠軍' :
                          (prevTotalFirst.uniqueId !== newTotalFirst.uniqueId ? '超越成為新的累計冠軍' : '首次突破一萬大關');
            addLog(`🎆 里程碑！${newTotalFirst.nickname} ${reason} (${newTotalFirst.totalDucks}🦆)！`);
            milestoneData = {
                type: 'total',
                nickname: newTotalFirst.nickname,
                avatar: newTotalFirst.avatar,
                amount: newTotalFirst.totalDucks,
                videoPath: fireworkVideo
            };
        }
    }

    // 里程碑 2: 單次最高達到 5000+（保底不計）
    const SINGLE_MILESTONE = 5000;
    if (!isPity && newSingleRecord && duckAmount >= SINGLE_MILESTONE) {
        if (newSingleFirst && newSingleFirst.uniqueId === uniqueId && newSingleFirst.amount === duckAmount && hasFireworkVideo) {
            addLog(`🎆 里程碑！${nickname} 創下單次最高紀錄 (${duckAmount}🦆)！`);
            milestoneData = {
                type: 'single',
                nickname: nickname,
                avatar: avatar,
                amount: duckAmount,
                videoPath: fireworkVideo
            };
        }
    }

    // 返回排行榜和里程碑資料
    return {
        leaderboard: state.duckLeaderboard,
        milestone: milestoneData
    };
}

// 觸發里程碑慶祝
function triggerMilestoneCelebration(type, data) {
    const config = state.config;
    const fireworkVideo = config.milestone_firework_video || '';

    if (!fireworkVideo || !fs.existsSync(fireworkVideo)) {
        addLog(`⚠️ 里程碑煙火影片未設定或不存在`);
        return;
    }

    addLog(`🎇 播放里程碑慶祝: ${type === 'total' ? '累計第一' : '單次最高'} - ${data.nickname}`);

    sendToGreenScreen('triggerMilestone', {
        type: type,  // 'total' 或 'single'
        nickname: data.nickname,
        avatar: data.avatar,
        amount: data.amount,
        videoPath: fireworkVideo
    });
}

function cacheUserNickname(userId, nickname, uniqueId, avatar = '') {
    if (!userId || (!nickname && !uniqueId)) return;

    // 只快取有效暱稱（非空、非亂碼）
    const cleanedNickname = cleanNickname(nickname);
    if (cleanedNickname || uniqueId) {
        const existing = state.userNicknameCache.get(userId);

        // 更新快取（保留已有的資訊，包含頭像）
        state.userNicknameCache.set(userId, {
            nickname: cleanedNickname || existing?.nickname || nickname || '',
            uniqueId: uniqueId || existing?.uniqueId || '',
            avatar: avatar || existing?.avatar || '',
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

    // 連接成功
    if (msgType === 'connected') {
        const roomId = msg.roomId || data.roomId || '';
        const username = msg.username || data.username || '';
        addLog(`✅ 已連接到 TikTok 直播間${roomId ? ` (roomId: ${roomId})` : ''}`);
        return;
    }

    // 錯誤訊息
    if (msgType === 'error') {
        // 嘗試提取錯誤訊息
        let errorMsg = msg.message || msg.error || msg.reason || msg.errorMessage ||
                       data.message || data.error || data.reason || data.errorMessage || '';

        // 清理錯誤訊息
        errorMsg = String(errorMsg).trim();

        // 如果沒有有效的錯誤訊息，不顯示（可能只是暫時性的連接問題）
        if (!errorMsg || errorMsg === '{}' || errorMsg === '{"type":"error"}') {
            // 空錯誤訊息不顯示，等待具體錯誤或成功
            return;
        }

        // 判斷是否為「用戶不在線」的錯誤
        const isOfflineError = errorMsg.toLowerCase().includes('not online') ||
                               errorMsg.toLowerCase().includes('offline') ||
                               errorMsg.includes('isn\'t online');

        // 避免重複顯示相同的錯誤
        if (!state.lastErrorMsg || state.lastErrorMsg !== errorMsg) {
            if (isOfflineError) {
                addLog(`❌ TikTok 連接錯誤: 主播目前不在線上`);
            } else {
                addLog(`❌ TikTok 連接錯誤: ${errorMsg}`);
            }
            state.lastErrorMsg = errorMsg;
            // 5 秒後清除，允許再次顯示相同錯誤
            setTimeout(() => { state.lastErrorMsg = ''; }, 5000);
        }

        state.connected = false;
        return;
    }

    // 狀態訊息
    if (msgType === 'status') {
        return; // 忽略狀態訊息
    }

    // 禮物消息
    if (['gift', 'giftmessage', 'webcastgiftmessage'].includes(msgType)) {
        const username = data.nickname || data.uniqueId || data.user?.nickname || '未知用戶';
        const uniqueId = data.uniqueId || data.user?.uniqueId || '';
        const userId = data.userId || data.user?.userId || '';
        const giftName = data.giftName || data.gift_name || data.gift?.name || '';
        const giftPictureUrl = data.giftPictureUrl || data.gift?.pictureUrl || '';
        const count = parseInt(data.repeatCount || data.giftCount || data.count || 1);
        const level = parseInt(data.level || data.user?.level || 0);
        const profilePictureUrl = data.profilePictureUrl || data.user?.profilePictureUrl || '';

        // 快取用戶暱稱（包含頭像）
        if (userId) cacheUserNickname(userId, data.nickname, uniqueId, profilePictureUrl);

        // 記錄高等級用戶
        if (userId && level >= 20) {
            recordHighLevelUser(userId, data.nickname, uniqueId, level);
        }

        checkFirstInteraction(username, uniqueId, userId);

        // TikTok API 每個禮物都是獨立訊息（repeatCount=1），不需要去重

        addLog(`🎁 ${username} 送出 ${giftName} x${count}`);

        // 傳遞用戶資訊用於排行榜
        const userInfo = { nickname: username, uniqueId, userId, avatar: profilePictureUrl };
        triggerEffects('gift', username, giftName, count, userInfo);

        // 檢查是否為世界榜第一名送禮 → 進場後首次送禮才觸發特效
        if (firebase.isConfigured()) {
            const championKey = userId || uniqueId;
            if (championKey && state.worldChampionGiftReady[championKey]) {
                firebase.getWorldChampion().then(champion => {
                    if (champion && (champion.uniqueId === uniqueId || champion.uniqueId === userId)) {
                        state.worldChampionGiftReady[championKey] = false;
                        addLog(`👑 世界第一 ${username} 送禮！`, 'success');
                        const giftVideo = state.config.world_champion_gift_video || '';
                        sendToGreenScreen('worldChampionEntry', {
                            nickname: username,
                            avatar: profilePictureUrl || '',
                            totalDucks: champion.totalDucks,
                            videoPath: giftVideo && fs.existsSync(giftVideo) ? giftVideo : ''
                        });
                    }
                }).catch(err => {
                    console.error('[世界榜] 獲取冠軍失敗:', err);
                });
            }
        }

        // 透過送禮回推進場
        if (userId) {
            checkChatBasedEntry(userId, username, uniqueId);
        }
    }

    // 聊天消息
    else if (['chat', 'chatmessage', 'webcastchatmessage'].includes(msgType)) {
        const username = data.nickname || data.uniqueId || data.user?.nickname || '未知用戶';
        const uniqueId = data.uniqueId || data.user?.uniqueId || '';
        const userId = data.userId || data.user?.userId || '';
        const comment = data.comment || data.content || data.text || '';
        const level = parseInt(data.level || data.user?.level || 0);
        const profilePictureUrl = data.profilePictureUrl || data.user?.profilePictureUrl || '';

        // 快取用戶暱稱（包含頭像）
        if (userId) cacheUserNickname(userId, data.nickname, uniqueId, profilePictureUrl);

        // 記錄高等級用戶
        if (userId && level >= 20) {
            recordHighLevelUser(userId, data.nickname, uniqueId, level);
        }

        addLog(`💬 ${username}: ${comment}`);
        checkFirstInteraction(username, uniqueId, userId);
        triggerEffects('chat', username, comment, 1);

        // 觀眾打查詢關鍵字查詢自己的鴨子數量（排行榜動畫期間不回應）
        const queryKeyword = state.config.duck_query_keyword || '查看';
        if (queryKeyword && comment.trim() === queryKeyword) {
            const timeSinceUpdate = Date.now() - state.lastLeaderboardUpdate;
            if (timeSinceUpdate < 5000) {
                addLog(`🔍 ${username} 查詢鴨子 - 排行榜更新中，暫不回應`);
            } else {
                const userStats = state.duckLeaderboard.allTimeStats.find(
                    u => u.uniqueId === uniqueId || u.uniqueId === userId
                );
                const duckCount = userStats ? userStats.totalDucks : 0;
                sendToGreenScreen('showDuckQuery', {
                    nickname: username,
                    avatar: profilePictureUrl || '',
                    totalDucks: duckCount,
                    config: state.config.duck_query_config || {}
                });
                addLog(`🔍 ${username} 查詢鴨子數量: ${duckCount}`);
            }
        }

        // 透過聊天回推進場：如果用戶是高等級且最近沒有進場記錄，觸發進場
        if (userId) {
            checkChatBasedEntry(userId, username, uniqueId);
        }
    }

    // 點讚消息
    else if (['like', 'likemessage', 'webcastlikemessage'].includes(msgType)) {
        const username = data.nickname || data.uniqueId || '未知用戶';
        const uniqueId = data.uniqueId || data.user?.uniqueId || '';
        const userId = data.userId || data.user?.userId || '';
        const count = parseInt(data.likeCount || data.count || 1);
        const level = parseInt(data.level || data.user?.level || 0);
        const profilePictureUrl = data.profilePictureUrl || data.user?.profilePictureUrl || '';

        // 快取用戶暱稱（包含頭像）
        if (userId) cacheUserNickname(userId, data.nickname, uniqueId, profilePictureUrl);

        // 記錄高等級用戶
        if (userId && level >= 20) {
            recordHighLevelUser(userId, data.nickname, uniqueId, level);
        }

        addLog(`❤️ ${username} 點了 ${count} 個讚`);
        triggerEffects('like', username, '', count);

        // 透過點讚回推進場
        if (userId) {
            checkChatBasedEntry(userId, username, uniqueId);
        }
    }

    // 進場消息
    else if (['member', 'membermessage', 'webcastmemberjoinevent'].includes(msgType)) {
        const nickname = data.nickname || data.user?.nickname || '';
        const uniqueId = data.uniqueId || data.user?.uniqueId || '';
        const userId = data.userId || data.user?.userId || '';
        const profilePictureUrl = data.profilePictureUrl || data.user?.profilePictureUrl || '';
        const level = parseInt(data.level || 0);

        // 除錯：輸出原始資料
        console.log('[Entry Raw]', JSON.stringify({
            nickname, uniqueId, userId, level
        }));

        // 快取用戶暱稱（包含頭像）
        if (userId) cacheUserNickname(userId, nickname, uniqueId, profilePictureUrl);

        // 檢查是否有專屬進場設定，若有則顯示在日誌
        const hasSpecific = checkHasSpecificEntry(userId, uniqueId, nickname);
        if (hasSpecific) {
            addLog(`👋 ${nickname || uniqueId} 進入直播間 (專屬進場)`);
        } else {
            addLog(`👋 ${nickname || uniqueId} 進入直播間${level >= 20 ? ` Lv${level}` : ''}`);
        }

        processEntry({
            nickname,
            uniqueId,
            userId,
            level
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

    // 進場時重置世界冠軍送禮旗標（允許下一次送禮觸發特效）
    const championKey = userId || uniqueId;
    if (championKey) {
        state.worldChampionGiftReady[championKey] = true;
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

// 檢查用戶是否有專屬進場設定
function checkHasSpecificEntry(userId, uniqueId, nickname) {
    const entryList = state.config.entry_list || [];
    if (entryList.length === 0) return false;

    const cleanedNick = cleanNickname(nickname || '').toLowerCase();

    for (const entry of entryList) {
        if (entry.enabled === false) continue;
        const entryUsername = (entry.username || '').toLowerCase().trim();
        const entryUserId = (entry.user_id || '').trim();

        // 匹配方式：user_id、uniqueId、暱稱、或 username 欄位存的 userId
        if ((entryUserId && entryUserId === userId) ||
            (entryUsername && uniqueId && entryUsername === uniqueId.toLowerCase()) ||
            (entryUsername && cleanedNick && entryUsername === cleanedNick) ||
            (entryUsername && /^7\d{18}$/.test(entry.username) && entry.username === userId)) {
            console.log(`[EntryMatch] 匹配成功: entry.username="${entry.username}" userId=${userId} uniqueId=${uniqueId} nickname="${nickname}"`);
            return true;
        }
    }
    return false;
}

function checkChatBasedEntry(userId, nickname, uniqueId) {
    if (!userId) return;

    const now = Date.now();
    const account = state.currentTikTokAccount;
    if (!account) return;

    // 調試：顯示檢查資訊
    debugLog(`[ChatBasedEntry] 檢查: userId=${userId} nickname="${nickname}" uniqueId=${uniqueId}`);

    // 1. 檢查是否在最近 60 秒內已有進場記錄（避免重複）
    const existingDedup = state.entryDedup[userId];
    if (existingDedup && now - existingDedup.time < 60000) {
        debugLog(`[ChatBasedEntry] 跳過: 60秒內已有進場記錄`);
        return; // 已有進場記錄，跳過
    }

    // 2. 檢查是否在最近內透過互動回推過（避免每條互動都觸發）
    // 專屬進場用戶的冷卻時間較短（30秒），一般用戶 60 秒
    const hasSpecificEntry = checkHasSpecificEntry(userId, uniqueId, nickname);
    const cooldownTime = hasSpecificEntry ? 30000 : 60000;

    const lastChatEntry = chatBasedEntryDedup.get(userId);
    if (lastChatEntry && now - lastChatEntry < cooldownTime) {
        debugLog(`[ChatBasedEntry] 跳過: ${cooldownTime/1000}秒內已回推過`);
        return;
    }

    // 3. 檢查是否為高等級用戶
    const accountUsers = state.highLevelUsers[account] || {};
    const userInfo = accountUsers[userId];
    const level = userInfo?.level || 0;
    const isHighLevel = level >= 20;

    // 必須是高等級用戶或有專屬進場設定
    if (!isHighLevel && !hasSpecificEntry) {
        debugLog(`[ChatBasedEntry] 跳過: 非高等級(Lv${level})且無專屬設定`);
        return;
    }

    // 4. 記錄回推時間
    chatBasedEntryDedup.set(userId, now);

    // 5. 使用儲存的資訊觸發進場
    const entryNickname = nickname || userInfo?.nickname || '';
    const entryUniqueId = uniqueId || userInfo?.uniqueId || '';

    const reason = hasSpecificEntry ? '專屬進場' : `Lv${level}`;
    console.log(`[ChatBasedEntry] 透過互動回推進場: userId=${userId} ${reason} nickname="${entryNickname}"`);
    addLog(`💬➡️👋 透過互動回推 ${entryNickname || entryUniqueId} ${reason} 進場`);

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
function triggerEffects(type, username, value, count, userInfo = null) {
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

    // 影片觸發（使用當前場景的設定）
    if (state.config.video_enabled) {
        const videoGifts = getActiveSceneVideoGifts();
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
                const displayName = gift.display_name || gift.name;
                addLog(`🎬 觸發影片: ${displayName} x${count} (${gift.name}) (每次重複: ${gift.video_repeat || 1}次)`);
                sendToGreenScreen('triggerVideo', {
                    username,
                    path: gift.video_path,
                    speed: gift.video_speed || 1,
                    volume: gift.video_volume || 100,
                    seconds: gift.video_seconds || 0,
                    repeat: gift.video_repeat || 1,
                    count: count,  // 禮物數量，送幾個就播幾次
                    priority: gift.video_priority || 1,
                    force_interrupt: gift.force_interrupt || false
                });
                break;
            }
        }
    }

    // 隨機影片觸發
    if (state.config.random_video_enabled) {
        const randomVideoList = state.config.random_video_list || [];
        for (const rv of randomVideoList) {
            if (rv.enabled === false) continue;

            let matched = false;
            if (rv.trigger_type === 'gift' && type === 'gift') {
                matched = rv.trigger_gift && rv.trigger_gift.toLowerCase() === value.toLowerCase();
            } else if (rv.trigger_type === 'chat' && type === 'chat') {
                matched = rv.trigger_keyword && value.includes(rv.trigger_keyword);
            } else if (rv.trigger_type === 'like' && type === 'like') {
                matched = true;
            }

            if (matched && rv.folder_path) {
                // 從資料夾隨機選擇影片
                const selectedVideo = selectRandomVideo(rv);
                if (selectedVideo) {
                    addLog(`🎲 觸發隨機影片: ${rv.name} x${count} -> ${path.basename(selectedVideo)}`);
                    sendToGreenScreen('triggerVideo', {
                        username,
                        path: selectedVideo,
                        speed: rv.video_speed || 1,
                        volume: rv.video_volume || 100,
                        seconds: rv.video_seconds || 0,
                        repeat: rv.video_repeat || 1,
                        count: count,  // 禮物數量
                        priority: rv.video_priority || 1,
                        force_interrupt: rv.force_interrupt || false
                    });
                    break;
                }
            }
        }
    }

    // 抓鴨子觸發
    if (state.config.duck_catch_enabled) {
        const cfg = state.config.duck_catch_config || {};
        let matched = false;

        // Debug: 記錄觸發條件
        if (type === 'gift') {
            console.log(`[DEBUG 抓鴨子] 收到禮物: "${value}", 設定觸發: "${cfg.trigger_gift}", 觸發類型: ${cfg.trigger_type}`);
        }

        if (cfg.trigger_type === 'gift' && type === 'gift') {
            matched = cfg.trigger_gift && cfg.trigger_gift.toLowerCase() === value.toLowerCase();
            console.log(`[DEBUG 抓鴨子] 比對結果: ${matched} (${cfg.trigger_gift?.toLowerCase()} vs ${value.toLowerCase()})`);
        } else if (cfg.trigger_type === 'chat' && type === 'chat') {
            matched = cfg.trigger_keyword && value.includes(cfg.trigger_keyword);
        } else if (cfg.trigger_type === 'like' && type === 'like') {
            matched = true;
        }

        if (matched) {
            // 根據禮物數量觸發多次
            const triggerCount = count || 1;
            const catchRate = cfg.catch_rate || 50;
            const pityEnabled = cfg.pity_enabled || false;
            const pityThreshold = cfg.pity_threshold || 1000;           // 第一層保底
            const pityMinAmount = cfg.pity_min_amount || 5000;          // 第一層保底金額
            const pityThresholdJackpot = cfg.pity_threshold_jackpot || 2000;  // 第二層保底（終極）
            const pityJackpotAmount = cfg.pity_jackpot_amount || 10000;       // 第二層保底金額

            // 軟保底設定
            const softPityEnabled = pityEnabled && (cfg.soft_pity_enabled || false);
            const softPityStart = cfg.soft_pity_start || 70;
            // 連擊設定
            const comboEnabled = cfg.combo_enabled || false;
            const comboWindow = (cfg.combo_window || 30) * 1000;
            const comboMultipliers = cfg.combo_multipliers || [1, 1.5, 2, 3];

            for (let i = 0; i < triggerCount; i++) {
                // 軟保底：漸進提升機率
                let effectiveCatchRate = catchRate;
                if (softPityEnabled && state.duckPityCounter > 0) {
                    const inSecondTierSP = state.duckPityCounter >= pityThreshold;
                    const currentTarget = inSecondTierSP ? pityThresholdJackpot : pityThreshold;
                    const softStart = Math.floor(currentTarget * softPityStart / 100);
                    if (state.duckPityCounter >= softStart) {
                        const progress = Math.min((state.duckPityCounter - softStart) / (currentTarget - softStart), 1);
                        effectiveCatchRate = catchRate + (100 - catchRate) * progress;
                    }
                }

                // 每次獨立計算是否抓到
                const caught = Math.random() * 100 < effectiveCatchRate;
                let videos = caught ? (cfg.caught_videos || []) : (cfg.missed_videos || []);
                let selectedVideo = null;
                let isPityTrigger = false;
                let pityLevel = 0;  // 0=無, 1=第一層, 2=第二層(終極)

                if (caught && videos.length > 0) {
                    // 檢查是否觸發保底
                    if (pityEnabled) {
                        if (state.duckPityCounter >= pityThresholdJackpot) {
                            // 第二層保底（終極）：強制 10000 只
                            const jackpotVideos = videos.filter(v => (v.amount || 0) >= pityJackpotAmount);
                            if (jackpotVideos.length > 0) {
                                selectedVideo = selectWeightedVideo(jackpotVideos);
                                isPityTrigger = true;
                                pityLevel = 2;
                                addLog(`🏆 終極保底觸發！(${state.duckPityCounter}/${pityThresholdJackpot}) - 保證 ${pityJackpotAmount}+ 只！`);
                            }
                        } else if (state.duckPityCounter >= pityThreshold) {
                            // 第一層保底：5000+ 只
                            const bigPrizeVideos = videos.filter(v => (v.amount || 0) >= pityMinAmount);
                            if (bigPrizeVideos.length > 0) {
                                selectedVideo = selectWeightedVideo(bigPrizeVideos);
                                isPityTrigger = true;
                                pityLevel = 1;
                                addLog(`🎉 保底觸發！(${state.duckPityCounter}/${pityThreshold}) - 保證 ${pityMinAmount}+ 只！`);
                            }
                        }
                    }

                    // 如果沒有保底，正常選擇
                    if (!selectedVideo) {
                        selectedVideo = selectWeightedVideo(videos);
                    }

                    // 更新保底計數器
                    if (selectedVideo) {
                        const duckAmount = selectedVideo.amount || 1;
                        const inSecondTier = state.duckPityCounter >= pityThreshold;

                        if (pityEnabled) {
                            if (inSecondTier) {
                                // 已在第二層：抽到 5000+ 就重置
                                if (duckAmount >= pityMinAmount) {
                                    addLog(`🎊 第二層大獎！重置保底計數器 (${state.duckPityCounter} -> 0)`);
                                    state.duckPityCounter = 0;
                                } else {
                                    state.duckPityCounter++;
                                }
                            } else {
                                // 還在第一層
                                if (duckAmount >= 8888) {
                                    // 抽到 8888+ → 重置歸零（留在第一層）
                                    addLog(`🏆 大獎！重置保底計數器 (${state.duckPityCounter} -> 0)`);
                                    state.duckPityCounter = 0;
                                } else {
                                    // 低於 8888 → 繼續累加（可能進入第二層）
                                    state.duckPityCounter++;
                                }
                            }
                        }
                    }
                } else if (!caught && videos.length > 0) {
                    // 沒抓到，正常選擇沒抓到影片
                    selectedVideo = selectWeightedVideo(videos);
                    // 沒抓到也計入保底（內部計數，UI 會在影片播完後更新）
                    if (pityEnabled) {
                        state.duckPityCounter++;
                    }
                }

                // 保底計數器變更後儲存
                saveDuckState();

                // 日誌 - 顯示兩層保底進度
                let pityInfo = '';
                if (pityEnabled) {
                    if (state.duckPityCounter >= pityThreshold) {
                        pityInfo = ` [保底: ${state.duckPityCounter}/${pityThresholdJackpot} 🔥]`;
                    } else {
                        pityInfo = ` [保底: ${state.duckPityCounter}/${pityThreshold}]`;
                    }
                }
                const rateDisplay = (effectiveCatchRate !== catchRate)
                    ? `${catchRate}%→${Math.round(effectiveCatchRate)}%`
                    : `${catchRate}%`;
                if (triggerCount > 1) {
                    addLog(`🦆 ${username} 觸發抓鴨子 (${i + 1}/${triggerCount}) - 機率${rateDisplay} - ${caught ? '抓到了！' : '沒抓到'}${pityInfo}`);
                } else {
                    addLog(`🦆 ${username} 觸發抓鴨子 - 機率${rateDisplay} - ${caught ? '抓到了！' : '沒抓到'}${pityInfo}`);
                }

                // 保底 UI 更新會在影片播完後一起發送

                if (selectedVideo && fs.existsSync(selectedVideo.path)) {
                    let duckAmount = caught ? (selectedVideo.amount || 1) : 0;

                    // 連擊 Combo 倍率
                    let comboCount = 0;
                    let comboMultiplier = 1;
                    if (comboEnabled && userInfo) {
                        const uid = userInfo.uniqueId || userInfo.userId || '';
                        const now = Date.now();
                        const prev = state.duckComboState[uid];
                        if (caught) {
                            if (prev && (now - prev.lastTime) <= comboWindow) {
                                comboCount = prev.count + 1;
                            } else {
                                comboCount = 1;
                            }
                            state.duckComboState[uid] = { count: comboCount, lastTime: now };
                            const mIdx = Math.min(comboCount - 1, comboMultipliers.length - 1);
                            comboMultiplier = comboMultipliers[mIdx] || 1;
                            if (comboMultiplier > 1) {
                                duckAmount = Math.round(duckAmount * comboMultiplier);
                                addLog(`🔥 ${username} COMBO x${comboCount}! 鴨子倍率 x${comboMultiplier} = ${duckAmount}`);
                            }
                        } else {
                            delete state.duckComboState[uid];
                        }
                    }

                    // 更新排行榜並取得排行榜資料和里程碑資料（抓到鴨子時）
                    let leaderboardResult = null;
                    if (caught && duckAmount > 0 && userInfo) {
                        leaderboardResult = updateLeaderboard(userInfo, duckAmount, isPityTrigger);
                    }

                    addLog(`🎬 播放鴨子影片: ${path.basename(selectedVideo.path)} (數量: ${duckAmount})${isPityTrigger ? ' ⭐保底' : ''}${comboCount > 1 ? ` COMBO x${comboCount}` : ''}`);

                    // 播放影片（鴨子計數、保底計數、排行榜、里程碑都在影片播完後更新）
                    sendToGreenScreen('triggerDuckVideo', {
                        username,
                        path: selectedVideo.path,
                        caught: caught,
                        duckAmount: duckAmount,
                        speed: cfg.video_speed || 1,
                        volume: cfg.video_volume || 100,
                        seconds: cfg.video_seconds || 0,
                        priority: cfg.video_priority || 1,
                        force_interrupt: cfg.force_interrupt || false,
                        // 傳遞保底資訊，影片播完後一起更新
                        pityEnabled: pityEnabled,
                        pityCounter: state.duckPityCounter,
                        pityThreshold: pityThreshold,
                        pityThresholdJackpot: pityThresholdJackpot,
                        // 軟保底資訊
                        effectiveCatchRate: Math.round(effectiveCatchRate),
                        softPityActive: effectiveCatchRate !== catchRate,
                        // 連擊資訊
                        comboCount: comboCount,
                        comboMultiplier: comboMultiplier,
                        // 傳遞排行榜資料，影片播完後更新
                        leaderboardData: leaderboardResult ? leaderboardResult.leaderboard : null,
                        // 傳遞里程碑資料，影片播完後觸發
                        milestoneData: leaderboardResult ? leaderboardResult.milestone : null
                    });
                } else if (selectedVideo) {
                    addLog(`❌ 影片檔案不存在: ${selectedVideo?.path}`);
                } else if (videos.length === 0) {
                    addLog(`❌ 沒有設定${caught ? '抓到' : '沒抓到'}影片`);
                } else {
                    addLog(`❌ 所有${caught ? '抓到' : '沒抓到'}影片檔案都不存在，請檢查路徑設定`);
                }
            }
        }
    }

    // 鎖鏈對抗觸發
    if (state.config.chain_battle_enabled && type === 'gift') {
        const cfg = state.config.chain_battle_config || {};
        const triggerGift = cfg.trigger_gift || '';
        const triggerAmount = cfg.trigger_amount || 10;
        const addGifts = cfg.add_gifts || [];

        // 檢查是否為啟動禮物
        const isTriggerGift = triggerGift && triggerGift.toLowerCase() === value.toLowerCase();

        // 檢查是否為增加禮物
        const matchedAddGift = addGifts.find(g =>
            g.name && g.name.toLowerCase() === value.toLowerCase()
        );

        if (isTriggerGift) {
            if (!state.chainBattleActive) {
                // 啟動禮物：啟動鎖鏈對抗（初始數量 = 設定值 × 禮物數量）
                const initialAmount = triggerAmount * count;
                state.chainBattleActive = true;
                state.chainCount = initialAmount;
                addLog(`⛓️ ${username} 啟動鎖鏈對抗！初始: ${state.chainCount} (${value})`);

                // 創建鎖定視窗
                lockScreenForChainBattle();

                // 發送開始事件
                sendToGreenScreen('startChainBattle', {
                    baseCount: state.chainCount,
                    amount: state.chainCount,
                    click_cooldown: cfg.click_cooldown ?? 100
                });
            } else {
                // 對抗進行中再送啟動禮物：增加（初始鎖鏈數 × 禮物數量）
                const addAmount = triggerAmount * count;
                state.chainCount += addAmount;
                addLog(`⛓️ ${username} 增加鎖鏈 +${addAmount} (${value} x${count})，目前: ${state.chainCount}`);
                sendToGreenScreen('syncChainCount', { count: state.chainCount, action: 'add', amount: addAmount });
            }
        } else if (state.chainBattleActive && matchedAddGift) {
            // 增減禮物：對抗進行中增加或減少數量
            const addAmount = (matchedAddGift.amount || 1) * count;
            state.chainCount = Math.max(0, state.chainCount + addAmount);
            const sign = addAmount >= 0 ? '+' : '';
            addLog(`⛓️ ${username} ${addAmount >= 0 ? '增加' : '減少'}鎖鏈 ${sign}${addAmount} (${value})，目前: ${state.chainCount}`);
            sendToGreenScreen('syncChainCount', { count: state.chainCount, action: addAmount >= 0 ? 'add' : 'subtract', amount: Math.abs(addAmount) });
        }
        // 其他禮物不影響鎖鏈對抗
    }

    // 窒息挑戰
    if (type === 'gift' && state.config.choking_enabled && !state.chainBattleActive) {
        const chokingCfg = state.config.choking_config || {};
        const triggerGift = chokingCfg.trigger_gift || '';
        const silentGift = chokingCfg.silent_gift || '';

        // 觸發禮物
        if (triggerGift && triggerGift.toLowerCase() === value.toLowerCase()) {
            if (!state.chokingActive) {
                // 首次觸發 - 啟動挑戰（秒數 * 數量）
                state.chokingActive = true;
                const baseSeconds = chokingCfg.initial_seconds || 30;
                const totalSeconds = baseSeconds * count;
                addLog(`🫁 ${username} 觸發窒息挑戰 x${count}！(${totalSeconds}秒)`);
                sendToGreenScreen('startChoking', {
                    initialSeconds: totalSeconds,
                    silentSeconds: chokingCfg.silent_seconds || 5,
                    drainRate: chokingCfg.drain_rate || 5,
                    recoverRate: chokingCfg.recover_rate || 8,
                    volumeThreshold: chokingCfg.volume_threshold || 30,
                    punishmentVideo: chokingCfg.punishment_video || '',
                    punishmentVolume: chokingCfg.punishment_volume ?? 100
                });
            } else {
                // 挑戰進行中 - 增加秒數
                const addSeconds = (chokingCfg.add_seconds || 5) * count;
                addLog(`🫁 ${username} 補送 ${value} x${count}，+${addSeconds} 秒！`);
                sendToGreenScreen('addChokingTime', { seconds: addSeconds });
            }
        }

        // 禁言禮物
        if (state.chokingActive && silentGift && silentGift.toLowerCase() === value.toLowerCase()) {
            const addSilent = (chokingCfg.silent_add_seconds || 3) * count;
            addLog(`🤫 ${username} 送出禁言禮物 x${count}，+${addSilent} 秒禁言！`);
            sendToGreenScreen('addChokingSilent', {
                seconds: addSilent,
                video: chokingCfg.silent_video || '',
                volume: chokingCfg.silent_volume ?? 100
            });
        }
    }
}

// 從資料夾隨機選擇影片（簡單版本，用於抓鴨子等模組）
function selectRandomVideoFromFolder(folderPath, avoidLast = true) {
    try {
        if (!folderPath || !fs.existsSync(folderPath)) {
            return null;
        }

        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        const files = fs.readdirSync(folderPath).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return videoExtensions.includes(ext);
        });

        if (files.length === 0) {
            return null;
        }

        // 避免連續重複
        let availableFiles = files;
        if (avoidLast && files.length > 1 && state.lastDuckVideo) {
            availableFiles = files.filter(f => path.join(folderPath, f) !== state.lastDuckVideo);
        }

        const randomIndex = Math.floor(Math.random() * availableFiles.length);
        const selectedFile = availableFiles[randomIndex];
        const fullPath = path.join(folderPath, selectedFile);
        state.lastDuckVideo = fullPath;

        return fullPath;
    } catch (e) {
        console.error('[selectRandomVideoFromFolder] 錯誤:', e);
        return null;
    }
}

// 根據權重從影片列表中隨機選擇
let lastWeightedVideo = null;
function selectWeightedVideo(videos, avoidLast = true) {
    if (!videos || videos.length === 0) return null;

    // 過濾掉不存在的檔案
    const validVideos = videos.filter(v => v.path && fs.existsSync(v.path));
    if (validVideos.length === 0) return null;

    // 避免連續重複
    let availableVideos = validVideos;
    if (avoidLast && validVideos.length > 1 && lastWeightedVideo) {
        availableVideos = validVideos.filter(v => v.path !== lastWeightedVideo);
        if (availableVideos.length === 0) availableVideos = validVideos;
    }

    // 計算總權重
    const totalWeight = availableVideos.reduce((sum, v) => sum + (v.weight || 1), 0);

    // 隨機選擇
    let random = Math.random() * totalWeight;
    for (const video of availableVideos) {
        random -= (video.weight || 1);
        if (random <= 0) {
            lastWeightedVideo = video.path;
            return video;
        }
    }

    // 備用：返回最後一個
    const selected = availableVideos[availableVideos.length - 1];
    lastWeightedVideo = selected.path;
    return selected;
}

// 從資料夾隨機選擇影片（支援權重和避免連續重複）
const lastPlayedVideos = new Map();  // 記錄每個隨機影片設定上次播放的檔案

function selectRandomVideo(rv) {
    try {
        const folderPath = rv.folder_path;
        if (!fs.existsSync(folderPath)) {
            console.log(`[RandomVideo] 資料夾不存在: ${folderPath}`);
            return null;
        }

        // 取得資料夾內所有影片檔案
        const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        const files = fs.readdirSync(folderPath).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return videoExtensions.includes(ext);
        });

        if (files.length === 0) {
            console.log(`[RandomVideo] 資料夾內無影片: ${folderPath}`);
            return null;
        }

        // 取得權重設定（預設每個檔案權重為1）
        const weights = rv.video_weights || {};

        // 避免連續重複（如果啟用且檔案數量 > 1）
        let availableFiles = files;
        if (rv.avoid_repeat && files.length > 1) {
            const lastPlayed = lastPlayedVideos.get(rv.name);
            if (lastPlayed) {
                availableFiles = files.filter(f => f !== lastPlayed);
            }
        }

        // 計算加權隨機
        let selectedFile;
        const totalWeight = availableFiles.reduce((sum, file) => {
            return sum + (weights[file] || 1);
        }, 0);

        if (totalWeight <= 0) {
            // 如果總權重為0，使用等機率隨機
            const randomIndex = Math.floor(Math.random() * availableFiles.length);
            selectedFile = availableFiles[randomIndex];
        } else {
            // 加權隨機選擇
            let random = Math.random() * totalWeight;
            for (const file of availableFiles) {
                const weight = weights[file] || 1;
                random -= weight;
                if (random <= 0) {
                    selectedFile = file;
                    break;
                }
            }
            // 防止浮點數誤差
            if (!selectedFile) {
                selectedFile = availableFiles[availableFiles.length - 1];
            }
        }

        // 記錄這次播放的檔案
        lastPlayedVideos.set(rv.name, selectedFile);

        console.log(`[RandomVideo] 選中: ${selectedFile} (權重: ${weights[selectedFile] || 1})`);
        return path.join(folderPath, selectedFile);
    } catch (e) {
        console.error('[RandomVideo] 選擇影片失敗:', e);
        return null;
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

    // 1. 先檢查是否有特定用戶的進場效果，同時記錄優先順序
    let specificEntry = null;
    let entryPriority = 9999;  // 全局效果優先順序最低
    const cleanedNick = cleanNickname(nickname).toLowerCase();

    for (let i = 0; i < entryList.length; i++) {
        const entry = entryList[i];
        if (entry.enabled === false) continue;

        const entryUsername = (entry.username || '').toLowerCase().trim();
        const entryUserId = (entry.user_id || '').trim();

        let matched = false;
        // 按 user_id 匹配
        if (entryUserId && userId && entryUserId === userId) matched = true;
        // 按清理後的暱稱匹配
        else if (entryUsername && cleanedNick && entryUsername === cleanedNick) matched = true;
        // 按原始暱稱匹配（fallback）
        else if (entryUsername && nickname && entryUsername === nickname.toLowerCase()) matched = true;
        // 按 uniqueId 匹配
        else if (entryUsername && uniqueId && entryUsername === uniqueId.toLowerCase()) matched = true;
        // 如果 username 欄位填的是 userId（7開頭19位數字），也嘗試匹配
        else if (entryUsername && userId && /^7\d{18}$/.test(entry.username) && entry.username === userId) matched = true;

        if (matched) {
            specificEntry = entry;
            entryPriority = i;  // 列表順序就是優先順序
            console.log(`[Entry Match] 匹配到專屬進場: ${entry.username} -> userId=${userId} nickname="${nickname}" 優先順序=${i + 1}`);
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

    // 4. 準備效果數據並加入隊列
    const logPrefix = specificEntry ? '🎯 專屬進場' : '👋 進場效果';
    const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(effectConfig.media_path);

    const effectData = {
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
        is_specific: !!specificEntry,
        priority: entryPriority,
        logPrefix: logPrefix
    };

    // 加入隊列並按優先順序排序
    state.entryEffectQueue.push(effectData);
    state.entryEffectQueue.sort((a, b) => a.priority - b.priority);

    console.log(`[Entry Queue] 加入隊列: ${displayName} 優先順序=${entryPriority + 1} 隊列長度=${state.entryEffectQueue.length}`);

    // 如果沒有正在播放的效果，開始處理隊列
    if (!state.entryEffectPlaying) {
        processEntryQueue();
    }
}

// 處理進場特效隊列
function processEntryQueue() {
    if (state.entryEffectQueue.length === 0) {
        state.entryEffectPlaying = false;
        console.log('[Entry Queue] 隊列已清空');
        return;
    }

    state.entryEffectPlaying = true;
    const effectData = state.entryEffectQueue.shift();

    addLog(`${effectData.logPrefix}: ${effectData.username}${effectData.level > 0 ? ` Lv${effectData.level}` : ''}`);
    console.log(`[Entry Queue] 播放效果: ${effectData.username} 優先順序=${effectData.priority + 1} 剩餘=${state.entryEffectQueue.length}`);

    sendToGreenScreen('triggerEntry', effectData);
}

// 進場特效播放完成回調
function onEntryEffectComplete() {
    console.log('[Entry Queue] 效果播放完成，處理下一個');
    processEntryQueue();
}

function sendToGreenScreen(event, data) {
    if (state.greenWindow && !state.greenWindow.isDestroyed()) {
        console.log(`[sendToGreenScreen] 發送事件: ${event}`);
        state.greenWindow.webContents.send('green-screen-event', { event, data });
    } else {
        addLog(`⚠️ 綠幕視窗未開啟，無法發送事件: ${event}`);
    }
    // 同步發送到鎖鏈對抗視窗
    if (state.chainLockWindow && !state.chainLockWindow.isDestroyed()) {
        state.chainLockWindow.webContents.send('green-screen-event', { event, data });
    }
}

// ============ 鎖鏈對抗視窗 ============
// 創建全螢幕鎖定視窗（同步顯示鎖鏈對抗）
function lockScreenForChainBattle() {
    // 如果已經有鎖定視窗，先關閉
    if (state.chainLockWindow && !state.chainLockWindow.isDestroyed()) {
        state.chainLockWindow.close();
    }

    // 創建全螢幕鎖定視窗
    state.chainLockWindow = new BrowserWindow({
        fullscreen: true,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        skipTaskbar: true,
        resizable: false,
        focusable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // 設定最高層級
    state.chainLockWindow.setAlwaysOnTop(true, 'screen-saver');

    // 載入專用鎖定頁面（空白背景，只有鎖鏈對抗）
    const chainLockPath = path.join(__dirname, '../web/chainlock.html');
    state.chainLockWindow.loadFile(chainLockPath);

    // 等待載入完成後啟動鎖鏈對抗
    state.chainLockWindow.webContents.once('did-finish-load', () => {
        // 鎖定視窗載入完成，發送鎖鏈對抗開始事件
        state.chainLockWindow.webContents.send('green-screen-event', {
            event: 'startChainBattle',
            data: { baseCount: state.chainCount, amount: state.chainCount }
        });
    });

    state.chainLockWindow.show();
    state.chainLockWindow.focus();

    addLog('🔒 已開啟全螢幕鎖定視窗');
}

// 關閉全螢幕鎖定視窗
function unlockScreenFromChainBattle() {
    if (state.chainLockWindow && !state.chainLockWindow.isDestroyed()) {
        state.chainLockWindow.close();
        state.chainLockWindow = null;
        addLog('🔓 已關閉全螢幕鎖定視窗');
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
        title: 'LiveGift Pro - 直播互動系統'
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
        // 關閉綠幕視窗（用 destroy 而不是 close 避免觸發額外事件）
        if (state.greenWindow && !state.greenWindow.isDestroyed()) {
            state.greenWindow.destroy();
            state.greenWindow = null;
        }
        // 不直接呼叫 app.quit()，讓 window-all-closed 事件處理
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

    // 轉發綠幕視窗的錯誤/警告到主進程（方便偵錯）
    state.greenWindow.webContents.on('console-message', (_, level, message) => {
        if (level >= 2) {
            console.log(`[GreenScreen ${level >= 3 ? 'ERROR' : 'WARN'}] ${message}`);
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

    // 場景管理
    ipcMain.handle('get-scenes', () => ({
        scenes: state.config.scenes || [],
        activeSceneId: state.config.activeSceneId || 'default'
    }));
    ipcMain.handle('get-active-scene', () => getActiveScene());
    ipcMain.handle('switch-scene', (_, sceneId) => switchScene(sceneId));
    ipcMain.handle('create-scene', (_, name) => createScene(name));
    ipcMain.handle('delete-scene', (_, sceneId) => deleteScene(sceneId));
    ipcMain.handle('rename-scene', (_, sceneId, newName) => renameScene(sceneId, newName));
    ipcMain.handle('update-scene-video-gifts', (_, sceneId, videoGifts) => updateSceneVideoGifts(sceneId, videoGifts));
    ipcMain.handle('get-scene-video-gifts', (_, sceneId) => {
        const scenes = state.config.scenes || [];
        const scene = scenes.find(s => s.id === sceneId);
        return scene ? scene.video_gifts || [] : [];
    });

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
        let filters;
        if (type === 'media') {
            filters = [{ name: '媒體檔案', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'ogg', 'm4a'] }];
        } else if (type === 'audio') {
            filters = [{ name: '音效檔案', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }];
        } else {
            filters = [{ name: '影片檔案', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm'] }];
        }

        const result = await dialog.showOpenDialog(state.mainWindow, {
            properties: ['openFile'],
            filters
        });

        return result.filePaths[0] || null;
    });

    // 多檔案選擇（批量）
    ipcMain.handle('select-files', async (_, type) => {
        let filters;
        if (type === 'media') {
            filters = [{ name: '媒體檔案', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'ogg', 'm4a'] }];
        } else if (type === 'audio') {
            filters = [{ name: '音效檔案', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }];
        } else {
            filters = [{ name: '影片檔案', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm'] }];
        }

        const result = await dialog.showOpenDialog(state.mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters
        });

        return result.filePaths || [];
    });

    // 資料夾選擇
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog(state.mainWindow, {
            properties: ['openDirectory']
        });
        return result.filePaths[0] || null;
    });

    // 取得資料夾內的影片數量
    ipcMain.handle('get-folder-video-count', (_, folderPath) => {
        try {
            if (!folderPath || !fs.existsSync(folderPath)) return 0;
            const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
            const files = fs.readdirSync(folderPath).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return videoExtensions.includes(ext);
            });
            return files.length;
        } catch (e) {
            return 0;
        }
    });

    // 模擬送禮
    ipcMain.handle('simulate-gift', (_, username, giftName, count) => {
        // 模擬完整的禮物訊息流程（跟真實送禮一樣）
        handleTikTokMessage({
            type: 'GiftMessage',
            nickname: username,
            uniqueId: username,
            userId: `simulate_${Date.now()}`,
            giftName: giftName,
            repeatCount: count,
            profilePictureUrl: ''
        });
    });

    // 模擬聊天訊息（測試用）
    ipcMain.handle('simulate-chat', (_, uniqueId, comment) => {
        handleTikTokMessage({
            type: 'chat',
            nickname: uniqueId,
            uniqueId: uniqueId,
            userId: uniqueId,
            comment: comment,
            profilePictureUrl: ''
        });
    });

    // 快捷補鴨子 (F6)
    ipcMain.handle('quick-add-gift', (_, type, userId, count) => {
        const duckCfg = state.config.duck_catch_config || {};
        const duckCount = (duckCfg.duck_count || 1) * count;
        state.duckCount += duckCount;
        addLog(`🦆 [F6] ${userId} 補鴨子 +${duckCount}，目前總數: ${state.duckCount}`);
        sendToGreenScreen('spawnDucks', {
            count: duckCount,
            username: userId,
            userId: userId
        });
        saveDuckState();
        if (state.mainWindow) {
            state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
        }
    });

    // 測試隨機影片
    ipcMain.handle('test-random-video', (_, rvConfig) => {
        const selectedVideo = selectRandomVideo(rvConfig);
        if (selectedVideo) {
            addLog(`🎲 測試隨機影片: ${rvConfig.name} -> ${path.basename(selectedVideo)}`);
            sendToGreenScreen('triggerVideo', {
                username: '測試用戶',
                path: selectedVideo,
                speed: rvConfig.video_speed || 1,
                volume: rvConfig.video_volume || 100,
                seconds: rvConfig.video_seconds || 0,
                repeat: rvConfig.video_repeat || 1,
                priority: rvConfig.video_priority || 1,
                force_interrupt: rvConfig.force_interrupt || false
            });
            return { success: true, video: path.basename(selectedVideo) };
        } else {
            addLog(`❌ 測試隨機影片失敗: ${rvConfig.name} - 資料夾內無影片`);
            return { success: false, error: '資料夾內無影片' };
        }
    });

    // ============ 抓鴨子模組 ============
    // 取得鴨子數量
    ipcMain.handle('get-duck-count', () => {
        return state.duckCount;
    });

    // 設定鴨子數量
    ipcMain.handle('set-duck-count', (_, count) => {
        state.duckCount = Math.max(0, count);
        sendToGreenScreen('updateDuckCount', { count: state.duckCount });
        saveDuckState();
        if (state.mainWindow) {
            state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
        }
        return state.duckCount;
    });

    // 補鴨子（單純加數量，不播影片）
    ipcMain.handle('add-duck-for-user', (_, uniqueId, amount) => {
        amount = Math.max(0, parseInt(amount) || 0);
        if (amount <= 0) {
            return { success: false, error: '數量必須大於0' };
        }

        // 增加總數
        state.duckCount += amount;
        sendToGreenScreen('updateDuckCount', { count: state.duckCount });

        // 如果有指定用戶，更新排行榜
        if (uniqueId && uniqueId.trim()) {
            const trimmedId = uniqueId.trim();
            const userInfo = {
                uniqueId: trimmedId,
                nickname: trimmedId,
                avatar: ''
            };
            // 優先從 allTimeStats（永久資料庫）查找用戶資訊
            const existingUser = state.duckLeaderboard.allTimeStats.find(e => e.uniqueId === trimmedId);
            if (existingUser) {
                userInfo.nickname = existingUser.nickname || trimmedId;
                userInfo.avatar = existingUser.avatar || '';
            }
            // 如果 allTimeStats 沒有，再從 userNicknameCache 取得
            else {
                const cached = state.userNicknameCache.get(trimmedId);
                if (cached) {
                    userInfo.nickname = cached.nickname || trimmedId;
                    userInfo.avatar = cached.avatar || '';
                }
            }
            updateLeaderboard(userInfo, amount, false);
            addLog(`🦆 補鴨子: 為 ${userInfo.nickname} 補 ${amount} 隻（總計: ${state.duckCount}）`);
        } else {
            addLog(`🦆 補鴨子: 補 ${amount} 隻（總計: ${state.duckCount}）`);
        }

        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
        }

        saveDuckState();
        return { success: true, totalDucks: state.duckCount };
    });

    // 處理單次抓鴨子（內部函數）
    function processSingleDuckCatch(userInfo) {
        const cfg = state.config.duck_catch_config || {};

        // 根據機率決定是否抓到
        const catchRate = cfg.catch_rate || 50;
        const caught = Math.random() * 100 < catchRate;

        const videos = caught ? (cfg.caught_videos || []) : (cfg.missed_videos || []);
        if (videos.length === 0) {
            addLog(`❌ 模擬抓鴨子失敗: 尚未設定${caught ? '抓到' : '沒抓到'}影片`);
            return { success: false, error: `尚未設定${caught ? '抓到' : '沒抓到'}影片` };
        }

        // 根據權重隨機選擇影片
        const selectedVideo = selectWeightedVideo(videos);
        if (!selectedVideo || !fs.existsSync(selectedVideo.path)) {
            addLog(`❌ 模擬抓鴨子失敗: ${caught ? '抓到' : '沒抓到'}影片檔案不存在，請檢查路徑`);
            return { success: false, error: '影片檔案不存在' };
        }

        // 計算抓到數量
        const duckAmount = caught ? (selectedVideo.amount || 1) : 0;

        // duckCount 由綠幕播完後 add_duck 統一處理，這裡不加
        // 排行榜也在 add_duck 裡更新，避免重複
        if (caught && duckAmount > 0 && userInfo.uniqueId) {
            updateLeaderboard(userInfo, duckAmount, false);
        }

        addLog(`🦆 模擬抓鴨子: ${userInfo.nickname} ${caught ? `抓到 ${duckAmount} 隻！` : '沒抓到'} -> ${path.basename(selectedVideo.path)} (速度: ${cfg.video_speed || 1}x)`);

        // 如果鎖鏈對抗進行中，暫停鎖鏈（等影片播完）
        if (state.chainBattleActive) {
            sendToGreenScreen('chainPause', {});
        }

        // 觸發影片播放
        sendToGreenScreen('triggerDuckVideo', {
            username: userInfo.nickname,
            path: selectedVideo.path,
            caught: caught,
            duckAmount: duckAmount,
            speed: cfg.video_speed || 1,
            volume: cfg.video_volume || 100,
            seconds: cfg.video_seconds || 0,
            priority: cfg.video_priority || 1,
            force_interrupt: cfg.force_interrupt || false
        });

        return { success: true, caught, duckAmount, totalDucks: state.duckCount };
    }

    // 處理隊列中的下一個抓鴨子
    function processNextDuckCatch() {
        if (state.duckCatchQueue.length === 0) {
            state.duckCatchProcessing = false;
            return;
        }

        state.duckCatchProcessing = true;
        const item = state.duckCatchQueue.shift();
        const result = processSingleDuckCatch(item.userInfo);

        // 如果影片沒有成功發送到綠幕（影片不存在等），直接處理下一個
        // 避免隊列卡死（正常情況下由 notify-duck-video-finished 觸發下一個）
        if (!result || !result.success) {
            setTimeout(() => processNextDuckCatch(), 100);
        }
    }

    // 鴨子影片播放完成通知
    ipcMain.handle('notify-duck-video-finished', () => {
        // 檢查是否有待播放的世界冠軍登頂特效
        if (state.pendingWorldChampionCrown) {
            sendToGreenScreen('worldChampionCrown', state.pendingWorldChampionCrown);
            state.pendingWorldChampionCrown = null;  // 清除，避免重複播放
        }

        // 延遲一下再處理下一個，避免影片切換太快
        setTimeout(() => {
            // 如果沒有更多鴨子隊列且鎖鏈對抗進行中，恢復鎖鏈
            if (state.duckCatchQueue.length === 0 && state.chainBattleActive) {
                sendToGreenScreen('chainResume', {});
            }
            processNextDuckCatch();
        }, 300);
        return { success: true };
    });

    // 進場特效播放完成通知
    ipcMain.handle('notify-entry-effect-finished', () => {
        onEntryEffectComplete();
        return { success: true };
    });

    // 模擬抓鴨子（觸發完整流程，可指定用戶和次數）
    ipcMain.handle('simulate-duck-catch', (_, uniqueId, times) => {
        times = Math.max(1, parseInt(times) || 1);

        // 準備用戶資訊
        const trimmedId = uniqueId ? uniqueId.trim() : '';
        const userInfo = {
            uniqueId: trimmedId,
            nickname: trimmedId || '模擬用戶',
            avatar: ''
        };

        // 優先從 allTimeStats（永久資料庫）查找用戶資訊
        if (trimmedId) {
            const existingUser = state.duckLeaderboard.allTimeStats.find(e => e.uniqueId === trimmedId);
            if (existingUser) {
                userInfo.nickname = existingUser.nickname || trimmedId;
                userInfo.avatar = existingUser.avatar || '';
            }
            // 如果 allTimeStats 沒有，再從 userNicknameCache 取得
            else {
                const cached = state.userNicknameCache.get(trimmedId);
                if (cached) {
                    userInfo.nickname = cached.nickname || trimmedId;
                    userInfo.avatar = cached.avatar || '';
                }
            }
        }

        // 將指定次數的抓鴨子加入隊列
        for (let i = 0; i < times; i++) {
            state.duckCatchQueue.push({ userInfo: { ...userInfo } });
        }

        addLog(`🎲 模擬抓鴨子: ${userInfo.nickname} 觸發 ${times} 次（隊列: ${state.duckCatchQueue.length}）`);

        // 如果沒有正在處理，開始處理隊列
        if (!state.duckCatchProcessing) {
            processNextDuckCatch();
        }

        return { success: true, queued: times, totalInQueue: state.duckCatchQueue.length };
    });

    // 增加鴨子數量
    ipcMain.handle('add-duck', (_, amount) => {
        state.duckCount += amount;
        addLog(`🦆 抓到 ${amount} 隻鴨子！目前總數: ${state.duckCount}`);
        sendToGreenScreen('updateDuckCount', { count: state.duckCount });
        saveDuckState();
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
        }

        // 如果鎖鏈對抗進行中且開啟抓鴨子增加鎖鏈，抓到鴨子也增加鎖鏈數
        const chainCfg = state.config.chain_battle_config || {};
        if (state.chainBattleActive && amount > 0 && chainCfg.duck_adds_chain !== false) {
            const duckChainAmount = chainCfg.duck_chain_amount || amount;
            state.chainCount += duckChainAmount;
            addLog(`⛓️ 抓到鴨子，鎖鏈 +${duckChainAmount}，目前: ${state.chainCount}`);
            sendToGreenScreen('syncChainCount', { count: state.chainCount, action: 'add', amount: duckChainAmount });
        }

        return state.duckCount;
    });

    // 減少鴨子數量
    ipcMain.handle('remove-duck', (_, amount = 1) => {
        state.duckCount = Math.max(0, state.duckCount - amount);
        addLog(`🦆 減少 ${amount} 隻鴨子，目前總數: ${state.duckCount}`);
        sendToGreenScreen('updateDuckCount', { count: state.duckCount });
        saveDuckState();
        if (state.mainWindow) {
            state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
        }
        return state.duckCount;
    });

    // 重置保底計數器
    ipcMain.handle('reset-pity-counter', () => {
        state.duckPityCounter = 0;
        addLog('🎯 已重置保底計數器');
        // 通知綠幕更新
        const cfg = state.config.duck_catch_config || {};
        sendToGreenScreen('updatePityCounter', {
            current: 0,
            threshold: cfg.pity_threshold || 1000,
            thresholdJackpot: cfg.pity_threshold_jackpot || 2000
        });
        saveDuckState();
        return { success: true };
    });

    // 設定保底計數器
    ipcMain.handle('set-pity-counter', (event, value) => {
        state.duckPityCounter = Math.max(0, parseInt(value) || 0);
        addLog(`🎯 保底計數器已設為 ${state.duckPityCounter}`);
        // 通知綠幕更新
        const cfg = state.config.duck_catch_config || {};
        sendToGreenScreen('updatePityCounter', {
            current: state.duckPityCounter,
            threshold: cfg.pity_threshold || 1000,
            thresholdJackpot: cfg.pity_threshold_jackpot || 2000
        });
        saveDuckState();
        return { success: true, value: state.duckPityCounter };
    });

    // 取得保底計數器
    ipcMain.handle('get-pity-counter', () => {
        const cfg = state.config.duck_catch_config || {};
        return {
            current: state.duckPityCounter,
            threshold: cfg.pity_threshold || 1000,
            thresholdJackpot: cfg.pity_threshold_jackpot || 2000
        };
    });

    // 通知主視窗更新保底計數（由綠幕呼叫）
    ipcMain.handle('notify-pity-update', () => {
        const cfg = state.config.duck_catch_config || {};
        if (cfg.pity_enabled && state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('pity-counter-updated', {
                current: state.duckPityCounter,
                threshold: cfg.pity_threshold || 1000,
                thresholdJackpot: cfg.pity_threshold_jackpot || 2000
            });
        }
        return { success: true };
    });

    // ========== 鎖鏈對抗 ==========

    // 手動啟動鎖鏈對抗
    ipcMain.handle('start-chain-battle', (_, data = {}) => {
        const cfg = state.config.chain_battle_config || {};
        const baseCount = data.baseCount || cfg.base_count || 20;
        state.chainBattleActive = true;
        state.chainCount = baseCount;  // 初始化計數

        // 鎖定螢幕（創建全螢幕鎖定視窗）
        lockScreenForChainBattle();

        addLog(`⛓️ 手動啟動鎖鏈對抗！基礎: ${baseCount}`);
        sendToGreenScreen('startChainBattle', {
            baseCount: baseCount,
            amount: baseCount,
            click_cooldown: cfg.click_cooldown ?? 100
        });
        return { success: true };
    });

    // 停止鎖鏈對抗
    ipcMain.handle('stop-chain-battle', () => {
        state.chainBattleActive = false;

        // 解鎖螢幕
        unlockScreenFromChainBattle();

        addLog('⛓️ 已停止鎖鏈對抗');
        sendToGreenScreen('stopChainBattle', {});
        return { success: true };
    });

    // 增加鎖鏈數（觀眾送禮）
    ipcMain.handle('add-chain-count', (_, amount = 1) => {
        if (!state.chainBattleActive) {
            return { success: false, error: '鎖鏈對抗未啟動' };
        }
        state.chainCount += amount;
        // 廣播新的計數到所有視窗
        sendToGreenScreen('syncChainCount', { count: state.chainCount, action: 'add', amount });
        return { success: true, count: state.chainCount };
    });

    // 減少鎖鏈數（主播按空白鍵）
    ipcMain.handle('remove-chain-count', (_, amount = 1) => {
        if (!state.chainBattleActive) {
            return { success: false, error: '鎖鏈對抗未啟動' };
        }
        state.chainCount = Math.max(0, state.chainCount - amount);
        // 廣播新的計數到所有視窗
        sendToGreenScreen('syncChainCount', { count: state.chainCount, action: 'remove', amount });

        // 檢查是否掙脫成功
        if (state.chainCount <= 0) {
            // 通知所有視窗播放勝利動畫
            sendToGreenScreen('chainVictory', {});
        }
        return { success: true, count: state.chainCount };
    });

    // 取得鎖鏈對抗狀態
    ipcMain.handle('get-chain-battle-status', () => {
        return {
            active: state.chainBattleActive,
            count: state.chainCount,
            config: state.config.chain_battle_config || {}
        };
    });

    // 鎖鏈對抗結束通知（由綠幕呼叫）
    ipcMain.handle('chain-battle-ended', (_, won) => {
        state.chainBattleActive = false;
        state.chainCount = 0;

        // 解鎖螢幕
        unlockScreenFromChainBattle();

        if (won) {
            addLog('⛓️ 主播掙脫成功！');
        }
        return { success: true };
    });

    // 窒息挑戰結束通知
    ipcMain.handle('choking-ended', (_, survived) => {
        state.chokingActive = false;
        addLog(`🫁 窒息挑戰結束 - ${survived ? '存活！' : '失敗，播放懲罰影片'}`);
        return { success: true };
    });

    // 取得排行榜
    ipcMain.handle('get-leaderboard', () => {
        return state.duckLeaderboard;
    });

    // 清除排行榜（保留總體資料庫）
    ipcMain.handle('clear-leaderboard', () => {
        state.duckLeaderboard.totalRanking = [];
        state.duckLeaderboard.singleHighest = [];
        state.duckLeaderboard.lastWeeklyReset = new Date().toISOString().split('T')[0];
        state.duckLeaderboard.lastDailyReset = new Date().toISOString().split('T')[0];
        saveLeaderboard();
        addLog('🏆 已清除排行榜（累計和單次最高）');
        return { success: true };
    });

    // 取得總體資料庫
    ipcMain.handle('get-alltime-stats', () => {
        return state.duckLeaderboard.allTimeStats || [];
    });

    // === 備份 / 匯出匯入 ===
    ipcMain.handle('get-last-backup-time', () => state.lastBackupTime);

    ipcMain.handle('trigger-backup', () => {
        performBackup();
        return { success: true };
    });

    ipcMain.handle('export-leaderboard', async () => {
        const result = await dialog.showSaveDialog(state.mainWindow, {
            defaultPath: `duck_data_export_${new Date().toISOString().split('T')[0]}.json`,
            filters: [{ name: 'JSON 檔案', extensions: ['json'] }]
        });
        if (result.canceled || !result.filePath) return { success: false };

        try {
            const exportData = {
                version: 1,
                exportDate: new Date().toISOString(),
                leaderboard: state.duckLeaderboard,
                duckState: { duckCount: state.duckCount, duckPityCounter: state.duckPityCounter }
            };
            fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf8');
            addLog(`📤 排行榜已匯出到: ${result.filePath}`);
            return { success: true, path: result.filePath };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('import-leaderboard', async (_, mode) => {
        const result = await dialog.showOpenDialog(state.mainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'JSON 檔案', extensions: ['json'] }]
        });
        if (result.canceled || !result.filePaths[0]) return { success: false };

        try {
            const raw = fs.readFileSync(result.filePaths[0], 'utf8');
            const importData = JSON.parse(raw);

            if (!importData.leaderboard || !importData.version) {
                return { success: false, error: '檔案格式不正確' };
            }

            performBackup(); // 匯入前先備份

            if (mode === 'overwrite') {
                state.duckLeaderboard = {
                    totalRanking: importData.leaderboard.totalRanking || [],
                    singleHighest: importData.leaderboard.singleHighest || [],
                    allTimeStats: importData.leaderboard.allTimeStats || [],
                    worldRanking: importData.leaderboard.worldRanking || [],
                    lastWeeklyReset: importData.leaderboard.lastWeeklyReset || null,
                    lastDailyReset: importData.leaderboard.lastDailyReset || null,
                    lastMonthlyReset: importData.leaderboard.lastMonthlyReset || null
                };
                if (importData.duckState) {
                    state.duckCount = importData.duckState.duckCount || 0;
                    state.duckPityCounter = importData.duckState.duckPityCounter || 0;
                    saveDuckState();
                }
            } else {
                // 合併模式
                const imported = importData.leaderboard;
                ['totalRanking', 'allTimeStats', 'worldRanking'].forEach(key => {
                    const valKey = key === 'worldRanking' ? 'totalCaught' : 'totalDucks';
                    (imported[key] || []).forEach(item => {
                        const existing = state.duckLeaderboard[key].find(e => e.uniqueId === item.uniqueId);
                        if (existing) {
                            if ((item[valKey] || 0) > (existing[valKey] || 0)) {
                                existing[valKey] = item[valKey];
                                existing.nickname = item.nickname || existing.nickname;
                                existing.avatar = item.avatar || existing.avatar;
                            }
                        } else {
                            state.duckLeaderboard[key].push({ ...item });
                        }
                    });
                    state.duckLeaderboard[key].sort((a, b) => (b[valKey] || 0) - (a[valKey] || 0));
                });
                // 單次最高
                (imported.singleHighest || []).forEach(item => {
                    const existing = state.duckLeaderboard.singleHighest.find(e => e.uniqueId === item.uniqueId);
                    if (existing) {
                        if ((item.amount || 0) > (existing.amount || 0)) {
                            existing.amount = item.amount;
                            existing.nickname = item.nickname || existing.nickname;
                            existing.avatar = item.avatar || existing.avatar;
                        }
                    } else {
                        state.duckLeaderboard.singleHighest.push({ ...item });
                    }
                });
                state.duckLeaderboard.singleHighest.sort((a, b) => (b.amount || 0) - (a.amount || 0));
            }

            saveLeaderboard();
            if (state.mainWindow && !state.mainWindow.isDestroyed()) {
                state.mainWindow.webContents.send('leaderboard-updated', state.duckLeaderboard);
            }
            sendToGreenScreen('updateLeaderboard', state.duckLeaderboard);
            addLog(`📥 排行榜已匯入 (${mode === 'overwrite' ? '覆蓋' : '合併'})`);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    // === 世界榜 API ===
    // 獲取世界榜
    ipcMain.handle('get-world-leaderboard', async () => {
        try {
            if (!firebase.isConfigured()) {
                return [];
            }
            return await firebase.getWorldLeaderboard(100);
        } catch (error) {
            console.error('[世界榜] 獲取失敗:', error);
            return [];
        }
    });

    // 獲取世界冠軍（包含頭像）
    ipcMain.handle('get-world-champion', async () => {
        try {
            if (!firebase.isConfigured()) {
                return null;
            }
            const champion = await firebase.getWorldChampion();
            // 如果冠軍沒有頭像，嘗試從世界榜列表中獲取
            if (champion && !champion.avatar) {
                const leaderboard = await firebase.getWorldLeaderboard(1);
                if (leaderboard && leaderboard.length > 0 && leaderboard[0].uniqueId === champion.uniqueId) {
                    champion.avatar = leaderboard[0].avatar || '';
                }
            }
            return champion;
        } catch (error) {
            console.error('[世界榜] 獲取冠軍失敗:', error);
            return null;
        }
    });

    // 同步世界冠軍（刪除後自動補上第二名）
    ipcMain.handle('sync-world-champion', async () => {
        try {
            if (!firebase.isConfigured()) {
                return null;
            }
            const newChampion = await firebase.syncWorldChampion();
            // 推送更新到綠幕
            if (newChampion) {
                sendToGreenScreen('updateWorldChampion', newChampion);
            }
            return newChampion;
        } catch (error) {
            console.error('[世界榜] 同步冠軍失敗:', error);
            return null;
        }
    });

    // 刷新綠幕世界榜顯示
    ipcMain.handle('refresh-greenscreen-world', async () => {
        try {
            if (!firebase.isConfigured()) {
                return false;
            }
            const champion = await firebase.getWorldChampion();
            // 補充頭像
            if (champion && !champion.avatar) {
                const leaderboard = await firebase.getWorldLeaderboard(1);
                if (leaderboard && leaderboard.length > 0 && leaderboard[0].uniqueId === champion.uniqueId) {
                    champion.avatar = leaderboard[0].avatar || '';
                }
            }
            sendToGreenScreen('updateWorldChampion', champion);
            return true;
        } catch (error) {
            console.error('[世界榜] 刷新綠幕失敗:', error);
            return false;
        }
    });

    // 調整用戶鴨子數量（總體資料庫）
    ipcMain.handle('adjust-user-ducks', (_, uniqueId, adjustment) => {
        if (!uniqueId) return { success: false, error: '無效的用戶ID' };

        let entry = state.duckLeaderboard.allTimeStats.find(e => e.uniqueId === uniqueId);
        if (entry) {
            entry.totalDucks = Math.max(0, entry.totalDucks + adjustment);
        } else if (adjustment > 0) {
            // 新增用戶
            state.duckLeaderboard.allTimeStats.push({
                uniqueId,
                nickname: uniqueId,
                avatar: '',
                totalDucks: adjustment
            });
        } else {
            return { success: false, error: '找不到該用戶' };
        }

        // 重新排序
        state.duckLeaderboard.allTimeStats.sort((a, b) => b.totalDucks - a.totalDucks);
        saveLeaderboard();
        addLog(`🦆 已調整 ${uniqueId} 的鴨子數量: ${adjustment > 0 ? '+' : ''}${adjustment}`);
        return { success: true, newTotal: entry ? entry.totalDucks : adjustment };
    });

    // 設定用戶鴨子數量（總體資料庫）
    ipcMain.handle('set-user-ducks', (_, uniqueId, amount, nickname) => {
        if (!uniqueId) return { success: false, error: '無效的用戶ID' };
        if (amount < 0) return { success: false, error: '數量不能為負數' };

        let entry = state.duckLeaderboard.allTimeStats.find(e => e.uniqueId === uniqueId);
        if (entry) {
            entry.totalDucks = amount;
            if (nickname) entry.nickname = nickname;
        } else {
            state.duckLeaderboard.allTimeStats.push({
                uniqueId,
                nickname: nickname || uniqueId,
                avatar: '',
                totalDucks: amount
            });
        }

        state.duckLeaderboard.allTimeStats.sort((a, b) => b.totalDucks - a.totalDucks);
        saveLeaderboard();
        addLog(`🦆 已設定 ${nickname || uniqueId} 的鴨子數量為 ${amount}`);
        return { success: true };
    });

    // 刪除用戶（從總體資料庫）
    ipcMain.handle('delete-user-from-alltime', (_, uniqueId) => {
        const idx = state.duckLeaderboard.allTimeStats.findIndex(e => e.uniqueId === uniqueId);
        if (idx >= 0) {
            const removed = state.duckLeaderboard.allTimeStats.splice(idx, 1)[0];
            saveLeaderboard();
            addLog(`🦆 已從總體資料庫刪除 ${removed.nickname || uniqueId}`);
            return { success: true };
        }
        return { success: false, error: '找不到該用戶' };
    });

    // 測試抓鴨子
    ipcMain.handle('test-duck-catch', (_, caught, duckAmount) => {
        const cfg = state.config.duck_catch_config || {};
        const videos = caught ? (cfg.caught_videos || []) : (cfg.missed_videos || []);

        if (videos.length === 0) {
            return { success: false, error: `尚未設定${caught ? '抓到' : '沒抓到'}影片` };
        }

        // 根據權重隨機選擇影片
        const selectedVideo = selectWeightedVideo(videos);
        if (!selectedVideo || !fs.existsSync(selectedVideo.path)) {
            return { success: false, error: '影片檔案不存在' };
        }

        // 如果抓到，使用影片設定的數量（如果有指定duckAmount則優先使用）
        const actualAmount = caught ? (duckAmount || selectedVideo.amount || 1) : 0;
        // duckCount 由綠幕播完後 add_duck 統一處理，這裡不加

        addLog(`🦆 測試抓鴨子: ${caught ? `抓到 ${actualAmount} 隻！` : '沒抓到'} -> ${path.basename(selectedVideo.path)}`);

        // 如果鎖鏈對抗進行中，暫停鎖鏈（等影片播完）
        if (state.chainBattleActive) {
            sendToGreenScreen('chainPause', {});
        }

        sendToGreenScreen('triggerDuckVideo', {
            username: '測試用戶',
            path: selectedVideo.path,
            caught: caught,
            duckAmount: actualAmount,
            speed: cfg.video_speed || 1,
            volume: cfg.video_volume || 100,
            seconds: cfg.video_seconds || 0,
            priority: cfg.video_priority || 1,
            force_interrupt: cfg.force_interrupt || false
        });

        return { success: true, caught, duckAmount: actualAmount, video: path.basename(selectedVideo.path), totalDucks: state.duckCount };
    });

    // 確認抓到鴨子並播放影片
    ipcMain.handle('confirm-duck-catch', (_, username, videoPath, duckAmount, config) => {
        // 增加鴨子數量
        state.duckCount += duckAmount;
        addLog(`🦆 ${username} 抓到 ${duckAmount} 隻鴨子！目前總數: ${state.duckCount}`);

        // 如果鎖鏈對抗進行中且開啟抓鴨子增加鎖鏈，抓到鴨子也增加鎖鏈數
        const chainCfg = state.config.chain_battle_config || {};
        if (state.chainBattleActive && duckAmount > 0 && chainCfg.duck_adds_chain !== false) {
            const duckChainAmount = chainCfg.duck_chain_amount || duckAmount;  // 預設用抓到的鴨子數
            state.chainCount += duckChainAmount;
            addLog(`⛓️ ${username} 抓到鴨子，鎖鏈 +${duckChainAmount}，目前: ${state.chainCount}`);
            sendToGreenScreen('syncChainCount', { count: state.chainCount, action: 'add', amount: duckChainAmount });
        }

        // 通知綠幕更新數量
        sendToGreenScreen('updateDuckCount', { count: state.duckCount });
        saveDuckState();

        // 如果鎖鏈對抗進行中，暫停鎖鏈（等影片播完）
        if (state.chainBattleActive) {
            sendToGreenScreen('chainPause', {});
        }

        // 播放影片
        sendToGreenScreen('triggerDuckVideo', {
            username,
            path: videoPath,
            caught: true,
            duckAmount: duckAmount,
            speed: config.video_speed || 1,
            volume: config.video_volume || 100,
            seconds: config.video_seconds || 0,
            priority: config.video_priority || 1,
            force_interrupt: config.force_interrupt || false
        });

        // 通知主視窗更新
        if (state.mainWindow) {
            state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
        }

        return { success: true, totalDucks: state.duckCount };
    });

    // 取得資料夾內的影片列表（含權重資訊）
    ipcMain.handle('get-folder-videos', (_, folderPath) => {
        try {
            if (!folderPath || !fs.existsSync(folderPath)) {
                return { success: false, videos: [], error: '資料夾不存在' };
            }

            const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
            const files = fs.readdirSync(folderPath).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return videoExtensions.includes(ext);
            });

            const videos = files.map(file => ({
                name: file,
                path: path.join(folderPath, file)
            }));

            return { success: true, videos };
        } catch (e) {
            console.error('[get-folder-videos] 錯誤:', e);
            return { success: false, videos: [], error: e.message };
        }
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
    // 自動授權麥克風權限（窒息挑戰需要）
    const { session } = require('electron');
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            callback(true);
        } else {
            callback(true);
        }
    });

    migrateOldConfig();  // 遷移舊設定檔
    loadConfig();
    loadHighLevelUsers();
    loadEntryHistory();
    loadUserCache();  // 載入用戶快取
    loadLeaderboard();  // 載入排行榜
    loadDuckState();    // 載入鴨子計數和保底
    setupLeaderboardResetTimer();  // 設定排行榜自動重置
    performBackup();               // 啟動時備份
    setupAutoBackup();             // 定時備份

    // 定期清理過期 combo
    setInterval(() => {
        const now = Date.now();
        const window = ((state.config.duck_catch_config || {}).combo_window || 30) * 1000 * 2;
        for (const uid of Object.keys(state.duckComboState)) {
            if (now - state.duckComboState[uid].lastTime > window) {
                delete state.duckComboState[uid];
            }
        }
    }, 60000);

    // 載入世界冠軍並監聽即時變化
    if (firebase.isConfigured()) {
        firebase.getWorldChampion().then(champion => {
            if (champion) {
                state.worldChampion = champion;
                console.log(`[世界榜] 已載入世界冠軍: ${champion.nickname} (${champion.totalDucks}🦆)`);
            }
        }).catch(err => {
            console.error('[世界榜] 載入冠軍失敗:', err);
        });

        // 即時監聽世界冠軍變化（跨實例同步）
        firebase.onWorldChampionChange((champion) => {
            const prev = state.worldChampion;
            state.worldChampion = champion;
            if (champion) {
                console.log(`[世界榜] 冠軍更新: ${champion.nickname} (${champion.totalDucks}🦆)`);
                // 推送到綠幕
                sendToGreenScreen('updateWorldChampion', champion);
                // 如果冠軍換人了，觸發登頂特效
                if (prev && prev.uniqueId !== champion.uniqueId) {
                    addLog(`👑 世界榜冠軍變更: ${champion.nickname} (${champion.totalDucks}🦆)`, 'success');
                    const crownVideo = state.config.world_champion_crown_video || '';
                    sendToGreenScreen('worldChampionCrown', {
                        nickname: champion.nickname,
                        avatar: champion.avatar || '',
                        totalDucks: champion.totalDucks,
                        videoPath: crownVideo && fs.existsSync(crownVideo) ? crownVideo : ''
                    });
                }
            } else if (prev) {
                // 冠軍被刪除，自動從排行榜替補第一名
                console.log('[世界榜] 冠軍已被刪除，嘗試替補...');
                firebase.syncWorldChampion().then(newChampion => {
                    if (newChampion) {
                        addLog(`👑 世界榜冠軍替補: ${newChampion.nickname} (${newChampion.totalDucks}🦆)`, 'success');
                    } else {
                        addLog('🌍 世界榜已無冠軍', 'warning');
                        sendToGreenScreen('updateWorldChampion', null);
                    }
                }).catch(err => {
                    console.error('[世界榜] 替補冠軍失敗:', err);
                });
            }
        });
    }

    startMediaServer();
    setupIPC();
    setupAutoUpdater();
    createMainWindow();

    // 註冊全域快捷鍵
    registerGlobalShortcuts();

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

// ============ 全域快捷鍵 ============
function registerGlobalShortcuts() {
    // F9: 減少一隻鴨子
    globalShortcut.register('F9', () => {
        if (state.duckCount > 0) {
            state.duckCount--;
            addLog(`🦆 快捷鍵減少鴨子，目前總數: ${state.duckCount}`);
            sendToGreenScreen('updateDuckCount', { count: state.duckCount });
            saveDuckState();
            if (state.mainWindow) {
                state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
                state.mainWindow.webContents.send('play-quack-sound');
            }
        }
    });

    // F10: 減少五隻鴨子
    globalShortcut.register('F10', () => {
        const oldCount = state.duckCount;
        state.duckCount = Math.max(0, state.duckCount - 5);
        addLog(`🦆 快捷鍵減少5隻鴨子，目前總數: ${state.duckCount}`);
        sendToGreenScreen('updateDuckCount', { count: state.duckCount });
        saveDuckState();
        if (state.mainWindow) {
            state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
            if (oldCount > 0) {
                state.mainWindow.webContents.send('play-quack-sound');
            }
        }
    });

    // F11: 重置鴨子數量為0
    globalShortcut.register('F11', () => {
        state.duckCount = 0;
        addLog(`🦆 快捷鍵重置鴨子數量為 0`);
        sendToGreenScreen('updateDuckCount', { count: state.duckCount });
        saveDuckState();
        if (state.mainWindow) {
            state.mainWindow.webContents.send('duck-count-updated', state.duckCount);
        }
    });

    // F8: 開啟快速模擬送禮視窗
    globalShortcut.register('F8', () => {
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('open-quick-simulate');
            // 確保視窗在前台
            if (state.mainWindow.isMinimized()) {
                state.mainWindow.restore();
            }
            state.mainWindow.focus();
        }
    });

    // F6: 快捷補禮物（鎖鏈/鴨子）
    globalShortcut.register('F6', () => {
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.send('open-quick-add');
            if (state.mainWindow.isMinimized()) {
                state.mainWindow.restore();
            }
            state.mainWindow.focus();
        }
    });

    // Ctrl+Shift+P: 強制停止鎖鏈對抗
    globalShortcut.register('CommandOrControl+Shift+P', () => {
        if (state.chainBattleActive) {
            state.chainBattleActive = false;
            unlockScreenFromChainBattle();
            addLog('⛓️ 快捷鍵強制停止鎖鏈對抗');
            sendToGreenScreen('stopChainBattle', {});
            if (state.mainWindow) {
                state.mainWindow.webContents.send('chain-battle-stopped');
            }
        }
    });

    // F12: 開啟開發者工具（調試模式）
    globalShortcut.register('F12', () => {
        if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            state.mainWindow.webContents.toggleDevTools();
        }
    });

    // Ctrl+Shift+F12: 開啟綠幕視窗的開發者工具
    globalShortcut.register('CommandOrControl+Shift+F12', () => {
        if (state.greenWindow && !state.greenWindow.isDestroyed()) {
            state.greenWindow.webContents.toggleDevTools();
        }
    });

    console.log('[Shortcuts] 已註冊全域快捷鍵: F6(補禮物), F8(模擬送禮), F9(減1), F10(減5), F11(重置), F12(調試), Ctrl+Shift+P(停止鎖鏈)');

    // 註冊影片快捷鍵
    registerVideoShortcuts();
}

// 影片快捷鍵註冊
let registeredVideoShortcuts = [];

function registerVideoShortcuts() {
    // 先取消已註冊的影片快捷鍵
    for (const shortcut of registeredVideoShortcuts) {
        try {
            globalShortcut.unregister(shortcut);
        } catch (e) {
            // 忽略取消失敗
        }
    }
    registeredVideoShortcuts = [];

    // 取得當前場景的影片設定
    const videoGifts = getActiveSceneVideoGifts();
    if (!videoGifts || videoGifts.length === 0) return;

    for (const gift of videoGifts) {
        // 只註冊觸發方式為快捷鍵的影片
        if (gift.trigger_type !== 'shortcut' || !gift.shortcut || gift.enabled === false) continue;

        try {
            const success = globalShortcut.register(gift.shortcut, () => {
                console.log(`[Shortcut] 觸發影片: ${gift.display_name || gift.name}`);
                triggerVideoByShortcut(gift);
            });

            if (success) {
                registeredVideoShortcuts.push(gift.shortcut);
                console.log(`[Shortcut] 已註冊影片快捷鍵: ${gift.shortcut} -> ${gift.display_name || gift.name}`);
            } else {
                console.log(`[Shortcut] 註冊失敗 (可能已被佔用): ${gift.shortcut}`);
            }
        } catch (e) {
            console.error(`[Shortcut] 註冊快捷鍵失敗: ${gift.shortcut}`, e);
        }
    }

    if (registeredVideoShortcuts.length > 0) {
        console.log(`[Shortcuts] 已註冊 ${registeredVideoShortcuts.length} 個影片快捷鍵`);
    }
}

// 通過快捷鍵觸發影片
function triggerVideoByShortcut(gift) {
    if (!gift.video_path) return;

    // 確保綠幕視窗開啟
    if (!state.greenWindow || state.greenWindow.isDestroyed()) {
        createGreenScreen();
        // 等待視窗載入完成
        setTimeout(() => {
            sendVideoToGreenScreen(gift);
        }, 1000);
    } else {
        sendVideoToGreenScreen(gift);
    }
}

function sendVideoToGreenScreen(gift) {
    sendToGreenScreen('triggerVideo', {
        username: '快捷鍵',
        path: gift.video_path,
        speed: gift.video_speed || 1,
        volume: gift.video_volume || 100,
        seconds: gift.video_seconds || 0,
        repeat: gift.video_repeat || 1,
        count: 1,
        priority: gift.video_priority || 1,
        force_interrupt: gift.force_interrupt || false
    });
    addLog(`🎬 快捷鍵觸發影片: ${gift.display_name || gift.name}`);
}

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
        addLog(`⚠️ 更新檢查失敗: ${err.message}`);
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

// 優雅關閉 - 確保所有資源都正確釋放
let isQuitting = false;

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', async () => {
    if (isQuitting) return;
    isQuitting = true;

    console.log('[關閉] 開始清理資源...');

    // 1. 先斷開網路連接
    try {
        disconnectTikTok();
    } catch (e) {
        console.error('[關閉] 斷開連接失敗:', e);
    }

    // 2. 儲存用戶快取
    try {
        saveUserCache();
    } catch (e) {
        console.error('[關閉] 儲存快取失敗:', e);
    }

    // 3. 清理定時器
    if (state.userCacheSaveInterval) {
        clearInterval(state.userCacheSaveInterval);
        state.userCacheSaveInterval = null;
    }

    // 4. 關閉媒體伺服器
    if (state.mediaServer) {
        try {
            state.mediaServer.close();
        } catch (e) {
            console.error('[關閉] 關閉媒體伺服器失敗:', e);
        }
    }

    // 5. 取消註冊全域快捷鍵
    try {
        globalShortcut.unregisterAll();
    } catch (e) {
        console.error('[關閉] 取消快捷鍵失敗:', e);
    }

    // 6. 確保綠幕視窗已關閉
    if (state.greenWindow && !state.greenWindow.isDestroyed()) {
        try {
            state.greenWindow.destroy();
        } catch (e) {
            console.error('[關閉] 關閉綠幕視窗失敗:', e);
        }
    }

    console.log('[關閉] 清理完成，退出應用');

    // 延遲一點再退出，確保清理完成
    setTimeout(() => {
        app.quit();
    }, 100);
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// 最終清理
app.on('will-quit', (event) => {
    console.log('[will-quit] 最終清理');
    // 確保所有快捷鍵都被取消
    globalShortcut.unregisterAll();
});
