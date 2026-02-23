/**
 * LiveGift Pro - 直播互動系統
 * 主程式邏輯
 */

// ============ 調試設定 ============
const DEBUG_MODE = false;
const debugLog = (...args) => { if (DEBUG_MODE) console.log('[DEBUG]', ...args); };

// ============ 統一錯誤處理 ============
function handleError(error, userMessage = '操作失敗') {
    if (DEBUG_MODE) console.error('[錯誤]', error);
    showToast(userMessage, 'error');
}

// ============ 載入應用版本號 ============
async function loadAppVersion() {
    try {
        const version = await pywebview.api.get_app_version();
        const versionElement = document.getElementById('appVersion');
        if (versionElement && version) {
            versionElement.textContent = `LiveGift Pro v${version}`;
        }
    } catch (error) {
        console.log('[版本] 無法載入版本號:', error);
    }
}

// ============ Toast 通知系統 ============
function showToast(message, type = 'info', duration = 3000) {
    // 移除現有的 toast
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
        <span class="toast-message">${message}</span>
    `;
    document.body.appendChild(toast);

    // 動畫進入
    requestAnimationFrame(() => toast.classList.add('show'));

    // 自動消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============ 載入遮罩 ============
let loadingOverlay = null;

function showLoading(message = '載入中...') {
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        loadingOverlay.querySelector('.loading-text').textContent = message;
    }
    requestAnimationFrame(() => loadingOverlay.classList.add('active'));
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

// 暴露到全局
window.showToast = showToast;
window.handleError = handleError;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

// 語言翻譯
const i18n = {
    'zh-TW': {
        // 標題
        appTitle: 'LiveGift Pro',
        // 狀態
        connected: '已連接',
        disconnected: '未連接',
        // 模組
        wheelModule: '轉盤模組',
        wheelModuleDesc: '收到指定禮物時觸發轉盤抽獎',
        videoModule: '影片模組',
        videoModuleDesc: '收到禮物/彈幕/點讚時播放影片',
        clickToSettings: '點擊設定',
        // 按鈕
        connect: '連接 TikTok',
        disconnect: '斷開連接',
        openGreenScreen: '開啟綠幕',
        simulate: '模擬送禮',
        settings: '設定',
        save: '儲存',
        cancel: '取消',
        send: '送出',
        add: '+ 新增',
        edit: '編輯',
        delete: '刪除',
        // 設定
        settingsTitle: '系統設定',
        connectionSettings: '連接設定',
        wsPort: 'WebSocket 埠號',
        displaySettings: '顯示設定',
        autoOpenGreenScreen: '連接時自動開啟綠幕視窗',
        languageSettings: '語言設定',
        language: '介面語言',
        // 轉盤設定
        wheelSettings: '轉盤模組設定',
        triggerGifts: '觸發禮物',
        wheelOptions: '轉盤選項',
        weightHint: '💡 權重越大，中獎機率越高',
        testWheel: '🎯 測試轉盤',
        addWheelTrigger: '新增轉盤觸發',
        editWheelTrigger: '編輯轉盤觸發',
        giftName: '禮物名稱',
        spinsPerGift: '轉盤次數 (每個禮物)',
        addWheelOption: '新增轉盤選項',
        editWheelOption: '編輯轉盤選項',
        optionName: '選項名稱',
        color: '顏色',
        weight: '權重',
        // 影片設定
        videoSettings: '影片模組設定',
        triggerSettings: '觸發設定',
        testVideo: '▶️ 測試影片',
        addVideoTrigger: '新增影片觸發',
        editVideoTrigger: '編輯影片觸發',
        name: '名稱',
        triggerType: '觸發方式',
        triggerGift: '禮物',
        triggerChat: '彈幕關鍵字',
        triggerLike: '點讚',
        keyword: '彈幕關鍵字',
        videoPath: '影片路徑',
        browse: '瀏覽',
        priority: '優先級 (1-10)',
        repeatCount: '重複次數',
        playSeconds: '播放秒數 (0=完整)',
        playSpeed: '播放倍率',
        volume: '音量',
        forceInterrupt: '強制插隊 (中斷當前播放)',
        // 模擬
        simulateTitle: '模擬送禮',
        username: '用戶名稱',
        gift: '禮物',
        quantity: '數量',
        noGiftConfig: '(無禮物設定)',
        // 日誌
        systemReady: '系統已就緒，等待連接...',
        wheelModuleEnabled: '轉盤模組: 已啟用',
        wheelModuleDisabled: '轉盤模組: 已停用',
        videoModuleEnabled: '影片模組: 已啟用',
        videoModuleDisabled: '影片模組: 已停用',
        greenScreenOpened: '開啟綠幕視窗',
        settingsSaved: '設定已儲存',
        noSettings: '尚無設定'
    },
    'zh-CN': {
        // 标题
        appTitle: 'TikTok 直播互动系统',
        // 状态
        connected: '已连接',
        disconnected: '未连接',
        // 模块
        wheelModule: '转盘模块',
        wheelModuleDesc: '收到指定礼物时触发转盘抽奖',
        videoModule: '视频模块',
        videoModuleDesc: '收到礼物/弹幕/点赞时播放视频',
        clickToSettings: '点击设定',
        // 按钮
        connect: '连接 TikTok',
        disconnect: '断开连接',
        openGreenScreen: '打开绿幕',
        simulate: '模拟送礼',
        settings: '设定',
        save: '保存',
        cancel: '取消',
        send: '发送',
        add: '+ 新增',
        edit: '编辑',
        delete: '删除',
        // 设定
        settingsTitle: '系统设定',
        connectionSettings: '连接设定',
        wsPort: 'WebSocket 端口',
        displaySettings: '显示设定',
        autoOpenGreenScreen: '连接时自动打开绿幕窗口',
        languageSettings: '语言设定',
        language: '界面语言',
        // 转盘设定
        wheelSettings: '转盘模块设定',
        triggerGifts: '触发礼物',
        wheelOptions: '转盘选项',
        weightHint: '💡 权重越大，中奖几率越高',
        testWheel: '🎯 测试转盘',
        addWheelTrigger: '新增转盘触发',
        editWheelTrigger: '编辑转盘触发',
        giftName: '礼物名称',
        spinsPerGift: '转盘次数 (每个礼物)',
        addWheelOption: '新增转盘选项',
        editWheelOption: '编辑转盘选项',
        optionName: '选项名称',
        color: '颜色',
        weight: '权重',
        // 视频设定
        videoSettings: '视频模块设定',
        triggerSettings: '触发设定',
        testVideo: '▶️ 测试视频',
        addVideoTrigger: '新增视频触发',
        editVideoTrigger: '编辑视频触发',
        name: '名称',
        triggerType: '触发方式',
        triggerGift: '礼物',
        triggerChat: '弹幕关键字',
        triggerLike: '点赞',
        keyword: '弹幕关键字',
        videoPath: '视频路径',
        browse: '浏览',
        priority: '优先级 (1-10)',
        repeatCount: '重复次数',
        playSeconds: '播放秒数 (0=完整)',
        playSpeed: '播放倍率',
        volume: '音量',
        forceInterrupt: '强制插队 (中断当前播放)',
        // 模拟
        simulateTitle: '模拟送礼',
        username: '用户名称',
        gift: '礼物',
        quantity: '数量',
        noGiftConfig: '(无礼物设定)',
        // 日志
        systemReady: '系统已就绪，等待连接...',
        wheelModuleEnabled: '转盘模块: 已启用',
        wheelModuleDisabled: '转盘模块: 已停用',
        videoModuleEnabled: '视频模块: 已启用',
        videoModuleDisabled: '视频模块: 已停用',
        greenScreenOpened: '打开绿幕窗口',
        settingsSaved: '设定已保存',
        noSettings: '尚无设定'
    }
};

let currentLang = 'zh-TW';

// 全域變數
let config = {
    wheel_gifts: [],      // 轉盤觸發禮物
    video_gifts: [],      // 影片觸發設定
    wheel_options: [],    // 轉盤選項
    giftbox_gifts: [],    // 盲盒觸發禮物
    giftbox_options: [],  // 盲盒選項
    wheel_enabled: true,
    video_enabled: true,
    entry_enabled: false, // 進場模組
    giftbox_enabled: false, // 盲盒模組
    entry_list: [],       // 進場用戶列表
    port: 10010,
    auto_open_green_screen: false,
    language: 'zh-TW'
};
let connected = false;
let chatDisplayEnabled = false;  // 彈幕顯示狀態

// === 初始化 ===
document.addEventListener('DOMContentLoaded', async () => {
    await waitForPywebview();
    await loadAppVersion();  // 載入應用版本號
    await loadConfig();
    await loadScenes();  // 載入場景列表
    initVolumeSlider();
    initNavigation();  // 初始化側邊欄導航
    initLogFilters();  // 初始化日誌過濾器
    initConfigUpdateListener();  // 監聯配置更新（即時同步）
    initSceneChangeListener();  // 監聯場景切換
    initLogUpdateListener();  // 監聽日誌更新（IPC 推送）
    initDialogs();  // 初始化對話框事件
    initChainBattleCollapseState();  // 初始化鎖鏈對抗面板折疊狀態
    initBackupListener();  // 監聽備份完成通知
    loadLeaderboardDisplayConfig();  // 載入綠幕排行榜顯示設定
    await refreshAccountList();  // 載入帳號列表
    await updateChatDisplayStatus();  // 初始化彈幕顯示狀態
    await updateLogs();  // 初始載入日誌
    setInterval(updateStatus, 2000);

    // 檢查 Firebase 連接狀態
    checkFirebaseConnection();

    // 初始化卡密系統
    setupLicenseKeyInput();
    await initLicenseSystem();

    // 隱藏啟動畫面
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            setTimeout(() => splashScreen.remove(), 500);
        }, 500);
    }
});

// === 初始化對話框 ===
function initDialogs() {
    // 確保所有對話框點擊不會傳播到遮罩層
    document.querySelectorAll('.modal').forEach(dialog => {
        dialog.addEventListener('click', (e) => e.stopPropagation());
    });
}

// === 備份完成通知 ===
function initBackupListener() {
    if (window.electronAPI && window.electronAPI.onBackupCompleted) {
        window.electronAPI.onBackupCompleted((time) => {
            const el = document.getElementById('lastBackupTime');
            if (el) {
                const d = new Date(time);
                el.textContent = `💾 ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                el.title = `上次備份: ${d.toLocaleString()}`;
            }
        });
    }
}

// === 綠幕排行榜顯示設定 ===
function loadLeaderboardDisplayConfig() {
    document.getElementById('gsLeaderboardCount').value = config.greenscreen_leaderboard_count || 5;
    document.getElementById('gsLeaderboardRotate').checked = config.greenscreen_leaderboard_rotate !== false;
    document.getElementById('gsLeaderboardRotateInterval').value = config.greenscreen_leaderboard_rotate_interval || 5;
}

// === 配置更新監聯（即時同步不需重開）===
function initConfigUpdateListener() {
    if (window.electronAPI && window.electronAPI.onConfigUpdate) {
        window.electronAPI.onConfigUpdate(async (newConfig) => {
            console.log('[配置更新] 收到配置變更，即時同步...');
            config = newConfig;
            // 重新渲染所有列表
            renderVideoGiftList();
            renderRandomVideoList();
            renderWheelOptionList();
            renderWheelGiftList();
            renderGiftboxGiftList();
            renderGiftboxOptionList();
            renderEntryList();
            console.log('[配置更新] 同步完成');
        });
    }
}

// === 場景切換監聯 ===
function initSceneChangeListener() {
    if (pywebview && pywebview.api && pywebview.api.onSceneChanged) {
        pywebview.api.onSceneChanged((data) => {
            console.log('[場景切換] 收到場景變更:', data);
            currentSceneId = data.sceneId;
            renderSceneList();
            renderVideoGiftList();
            updateCurrentSceneBadge();
        });
    }
}

// === 日誌更新監聽（IPC 推送 + 備用輪詢）===
function initLogUpdateListener() {
    let ipcWorking = false;

    // 嘗試使用 IPC 推送（electronAPI.onLogUpdate）
    if (window.electronAPI && window.electronAPI.onLogUpdate) {
        window.electronAPI.onLogUpdate((logs) => {
            ipcWorking = true;
            renderLogs(logs);
        });
        console.log('[日誌] IPC 監聯器已註冊');
    }

    // 備用輪詢（每 2 秒檢查一次，以防 IPC 失效）
    setInterval(async () => {
        if (!ipcWorking) {
            try {
                const logs = await pywebview.api.get_logs();
                renderLogs(logs);
            } catch (e) {}
        }
    }, 2000);
}

// === 側邊欄導航 ===
function initNavigation() {
    const navItems = document.querySelectorAll('.menu-item[data-panel]');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // 如果點擊的是開關，不切換面板
            if (e.target.closest('.switch')) return;
            const panelId = item.getAttribute('data-panel');
            switchPanel(panelId);
        });
    });

    // 初始載入時渲染列表（轉盤+盲盒）
    renderWheelGiftList();
    renderWheelOptionList();
    renderGiftboxGiftList();
    renderGiftboxOptionList();
}

function switchPanel(panelId) {
    // 更新導航項目狀態
    document.querySelectorAll('.menu-item[data-panel]').forEach(nav => {
        nav.classList.remove('active');
    });
    const activeNav = document.querySelector(`.menu-item[data-panel="${panelId}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // 切換面板顯示
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`panel-${panelId}`);
    if (activePanel) {
        activePanel.classList.add('active');

        // 面板特定的初始化
        if (panelId === 'wheel') {
            renderWheelGiftList();
            renderWheelOptionList();
            renderGiftboxGiftList();
            renderGiftboxOptionList();
        } else if (panelId === 'video') {
            renderVideoGiftList();
            renderRandomVideoList();
        } else if (panelId === 'entry') {
            renderEntryList();
            updateHighLevelUserCount();
        } else if (panelId === 'settings') {
            // 載入設定值
            document.getElementById('tiktokUsernameInput').value = config.tiktok_username || '';
            document.getElementById('portInput').value = config.port || 10010;
            document.getElementById('autoOpenGreenScreen').checked = config.auto_open_green_screen || false;
            document.getElementById('languageSelect').value = config.language || 'zh-TW';
        }
    }
}

// === 影片模組子分頁切換 ===
function switchVideoSubTab(tabId) {
    const panel = document.getElementById('panel-video');
    if (!panel) return;

    // 更新子分頁按鈕狀態
    panel.querySelectorAll('.tab[data-subtab]').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = panel.querySelector(`.tab[data-subtab="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // 切換子面板顯示
    panel.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeSubPanel = document.getElementById(`subtab-${tabId}`);
    if (activeSubPanel) {
        activeSubPanel.classList.add('active');
    }
}

// === 轉盤/盲盒模組子分頁切換 ===
function switchWheelSubTab(tabId) {
    const panel = document.getElementById('panel-wheel');
    if (!panel) return;

    // 更新子分頁按鈕狀態
    panel.querySelectorAll('.tab[data-subtab]').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = panel.querySelector(`.tab[data-subtab="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // 切換子面板顯示
    panel.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeSubPanel = document.getElementById(`subtab-${tabId}`);
    if (activeSubPanel) {
        activeSubPanel.classList.add('active');
    }
}

// === 抓鴨子子標籤切換 ===
function switchDuckSubTab(tabId) {
    // 更新子標籤按鈕
    document.querySelectorAll('.duck-subtab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`.duck-subtab[data-ducktab="${tabId}"]`);
    if (activeTab) activeTab.classList.add('active');

    // 切換內容區塊
    document.querySelectorAll('.duck-subtab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeContent = document.getElementById(`ducktab-${tabId}`);
    if (activeContent) activeContent.classList.add('active');
}

// === 子面板狀態更新 ===
function updateSubtabStatus(module, enabled) {
    const statusEl = document.getElementById(`${module}Status`);
    if (statusEl) {
        statusEl.textContent = enabled ? '已啟用' : '已停用';
        statusEl.classList.toggle('enabled', enabled);
    }
}

function waitForPywebview() {
    return new Promise((resolve) => {
        // 已經準備好
        if (window.pywebview && window.pywebview.api) {
            resolve();
            return;
        }

        // 監聯事件
        const handler = () => {
            window.removeEventListener('pywebviewready', handler);
            resolve();
        };
        window.addEventListener('pywebviewready', handler);

        // 輪詢檢查（防止事件已觸發的競態條件）
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.pywebview && window.pywebview.api) {
                clearInterval(checkInterval);
                window.removeEventListener('pywebviewready', handler);
                resolve();
            } else if (attempts > 50) {
                clearInterval(checkInterval);
                console.warn('[waitForPywebview] 超時，嘗試繼續...');
                resolve();
            }
        }, 100);
    });
}

// === 配置管理 ===
async function loadConfig() {
    try {
        const loaded = await pywebview.api.get_config();
        if (loaded) {
            config = { ...config, ...loaded };
        }
        document.getElementById('wheelEnabled').checked = config.wheel_enabled;
        document.getElementById('videoEnabled').checked = config.video_enabled;
        document.getElementById('duckCatchEnabled').checked = config.duck_catch_enabled || false;
        document.getElementById('entryEnabled').checked = config.entry_enabled || false;
        document.getElementById('giftboxEnabled').checked = config.giftbox_enabled || false;
        document.getElementById('chainBattleEnabled').checked = config.chain_battle_enabled || false;
        document.getElementById('chokingEnabled').checked = config.choking_enabled || false;
        document.getElementById('portInput').value = config.port || 10010;

        // 更新子面板狀態顯示
        updateSubtabStatus('wheel', config.wheel_enabled);
        updateSubtabStatus('giftbox', config.giftbox_enabled || false);
        const rvEl = document.getElementById('randomVideoEnabled');
        if (rvEl) rvEl.checked = config.random_video_enabled || false;
        updateSubtabStatus('randomVideo', config.random_video_enabled || false);
        document.getElementById('autoOpenGreenScreen').checked = config.auto_open_green_screen || false;
        document.getElementById('languageSelect').value = config.language || 'zh-TW';

        // 代理設定
        document.getElementById('proxyEnabled').checked = config.proxy_enabled || false;
        document.getElementById('proxyUrl').value = config.proxy_url || '';

        // 載入抓鴨子設定
        loadDuckCatchConfig();
        initDuckCatchEvents();

        // 載入鎖鏈對抗設定
        loadChainBattleSettings();

        // 載入窒息挑戰設定
        loadChokingSettings();

        // 設定語言
        currentLang = config.language || 'zh-TW';
        applyLanguage();
    } catch (e) {
        console.error('載入配置失敗:', e);
    }
}

// === 語言系統 ===
function t(key) {
    return i18n[currentLang]?.[key] || i18n['zh-TW']?.[key] || key;
}

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[currentLang]?.[key]) {
            el.textContent = i18n[currentLang][key];
        }
    });

    // 更新動態內容
    updateConnectionStatus(connected);
}

function changeLanguage(lang) {
    currentLang = lang;
    applyLanguage();
}

// === 設定面板 ===
function openSettingsPanel() {
    switchPanel('settings');
}

async function saveSettings() {
    const tiktokUsername = document.getElementById('tiktokUsernameInput').value.trim();
    const port = parseInt(document.getElementById('portInput').value) || 10010;
    const autoOpen = document.getElementById('autoOpenGreenScreen').checked;
    const lang = document.getElementById('languageSelect').value;

    // 代理設定
    const proxyEnabled = document.getElementById('proxyEnabled').checked;
    const proxyUrl = document.getElementById('proxyUrl').value.trim();

    // 檢查 Port 或代理是否有變更
    const needRestart = (config.port !== port ||
                         config.proxy_enabled !== proxyEnabled || config.proxy_url !== proxyUrl);

    config.tiktok_username = tiktokUsername;
    config.port = port;
    config.auto_open_green_screen = autoOpen;
    config.language = lang;
    config.proxy_enabled = proxyEnabled;
    config.proxy_url = proxyUrl;
    currentLang = lang;

    await pywebview.api.update_config({
        tiktok_username: tiktokUsername,
        port: port,
        auto_open_green_screen: autoOpen,
        language: lang,
        proxy_enabled: proxyEnabled,
        proxy_url: proxyUrl
    });

    applyLanguage();
    addLogLocal(t('settingsSaved'));

    // 如果連接相關設定變更，提示需要重新連接
    if (needRestart) {
        addLogLocal('⚠️ 連接設定已變更，請重新連接以套用新設定');
    }
}

// === 模組開關 ===
document.getElementById('wheelEnabled')?.addEventListener('change', async (e) => {
    config.wheel_enabled = e.target.checked;
    await pywebview.api.update_config({ wheel_enabled: e.target.checked });
    addLogLocal(`轉盤模組: ${e.target.checked ? '已啟用' : '已停用'}`);
    updateSubtabStatus('wheel', e.target.checked);

    // 通知綠幕視窗
    try {
        await pywebview.api.trigger_green_screen('moduleStatusChanged', {
            module: 'wheel',
            enabled: e.target.checked
        });
    } catch (err) {}
});

document.getElementById('videoEnabled')?.addEventListener('change', async (e) => {
    config.video_enabled = e.target.checked;
    await pywebview.api.update_config({ video_enabled: e.target.checked });
    addLogLocal(`影片模組: ${e.target.checked ? '已啟用' : '已停用'}`);

    // 通知綠幕視窗
    try {
        await pywebview.api.trigger_green_screen('moduleStatusChanged', {
            module: 'video',
            enabled: e.target.checked
        });
    } catch (err) {}
});

document.getElementById('entryEnabled')?.addEventListener('change', async (e) => {
    config.entry_enabled = e.target.checked;
    await pywebview.api.update_config({ entry_enabled: e.target.checked });
    addLogLocal(`進場模組: ${e.target.checked ? '已啟用' : '已停用'}`);

    // 通知綠幕視窗
    try {
        await pywebview.api.trigger_green_screen('moduleStatusChanged', {
            module: 'entry',
            enabled: e.target.checked
        });
    } catch (err) {}
});

document.getElementById('giftboxEnabled')?.addEventListener('change', async (e) => {
    config.giftbox_enabled = e.target.checked;
    await pywebview.api.update_config({ giftbox_enabled: e.target.checked });
    addLogLocal(`盲盒模組: ${e.target.checked ? '已啟用' : '已停用'}`);
    updateSubtabStatus('giftbox', e.target.checked);

    // 通知綠幕視窗
    try {
        await pywebview.api.trigger_green_screen('moduleStatusChanged', {
            module: 'giftbox',
            enabled: e.target.checked
        });
    } catch (err) {}
});

document.getElementById('randomVideoEnabled')?.addEventListener('change', async (e) => {
    config.random_video_enabled = e.target.checked;
    await pywebview.api.update_config({ random_video_enabled: e.target.checked });
    addLogLocal(`隨機影片模組: ${e.target.checked ? '已啟用' : '已停用'}`);
    updateSubtabStatus('randomVideo', e.target.checked);

    // 通知綠幕視窗
    try {
        await pywebview.api.trigger_green_screen('moduleStatusChanged', {
            module: 'randomvideo',
            enabled: e.target.checked
        });
    } catch (err) {}
});

// 自動開啟綠幕設定 (立即儲存)
document.getElementById('autoOpenGreenScreen')?.addEventListener('change', async (e) => {
    config.auto_open_green_screen = e.target.checked;
    await pywebview.api.update_config({ auto_open_green_screen: e.target.checked });
    addLogLocal(`自動開啟綠幕: ${e.target.checked ? '開啟' : '關閉'}`);
});

// === 連接控制 ===
async function toggleConnection() {
    const btn = document.getElementById('connectBtn');

    if (connected) {
        await pywebview.api.disconnect_tiktok();
        btn.innerHTML = `<span class="btn-icon">🔌</span><span class="btn-text" data-i18n="connect">${t('connect')}</span>`;
        btn.classList.remove('connected');
        connected = false;
    } else {
        // 檢查是否設定了用戶名
        if (!config.tiktok_username || !config.tiktok_username.trim()) {
            addLogLocal('❌ 請先在設定中輸入 TikTok 用戶名');
            switchPanel('settings');  // 切換到設定面板
            return;
        }

        const port = config.port || 10010;
        await pywebview.api.update_config({ port: port });
        const result = await pywebview.api.connect_tiktok();

        if (result && result.success === false) {
            addLogLocal(`❌ 連接失敗: ${result.message || '未知錯誤'}`);
            return;
        }

        btn.innerHTML = `<span class="btn-icon">🔌</span><span class="btn-text" data-i18n="disconnect">${t('disconnect')}</span>`;
        btn.classList.add('connected');
        connected = true;

        // 重新整理帳號列表（新帳號會被加入）
        setTimeout(() => refreshAccountList(), 1000);

        // 自動開啟綠幕
        if (config.auto_open_green_screen) {
            setTimeout(() => openGreenScreen(), 500);
        }
    }
}

async function updateStatus() {
    try {
        const status = await pywebview.api.get_status();
        updateConnectionStatus(status.connected);
    } catch (e) {}
}

function updateConnectionStatus(isConnected) {
    connected = isConnected;
    const statusBadge = document.getElementById('statusBadge');
    const btn = document.getElementById('connectBtn');

    if (isConnected) {
        if (statusBadge) {
            statusBadge.classList.add('connected');
            const statusLabel = statusBadge.querySelector('.status-label');
            if (statusLabel) statusLabel.textContent = t('connected');
        }
        if (btn) {
            btn.innerHTML = `<span class="action-icon">⚡</span><span data-i18n="disconnect">${t('disconnect')}</span>`;
            btn.classList.add('connected');
        }
    } else {
        if (statusBadge) {
            statusBadge.classList.remove('connected');
            const statusLabel = statusBadge.querySelector('.status-label');
            if (statusLabel) statusLabel.textContent = t('disconnected');
        }
        if (btn) {
            btn.innerHTML = `<span class="action-icon">⚡</span><span data-i18n="connect">${t('connect')}</span>`;
            btn.classList.remove('connected');
        }
    }
}

// === 彈幕顯示控制 ===
async function toggleChatDisplay() {
    try {
        chatDisplayEnabled = !chatDisplayEnabled;
        await pywebview.api.toggle_chat_display(chatDisplayEnabled);
        updateChatDisplayButton();
    } catch (e) {
        console.error('切換彈幕顯示失敗:', e);
    }
}

async function updateChatDisplayStatus() {
    try {
        const status = await pywebview.api.get_chat_display_status();
        chatDisplayEnabled = status.enabled;
        updateChatDisplayButton();
    } catch (e) {
        console.error('取得彈幕顯示狀態失敗:', e);
    }
}

function updateChatDisplayButton() {
    const btn = document.getElementById('chatDisplayBtn');
    if (btn) {
        if (chatDisplayEnabled) {
            btn.classList.add('active');
            btn.title = '彈幕顯示 (開啟)';
        } else {
            btn.classList.remove('active');
            btn.title = '彈幕顯示 (關閉)';
        }
    }
}

// === 切換到設定面板 ===
function openWheelSettings() {
    switchPanel('wheel');
}

function openVideoSettings() {
    switchPanel('video');
}

function openGiftboxSettings() {
    switchPanel('wheel');
    switchWheelSubTab('giftbox');
}

// === 綠幕視窗 ===
async function openGreenScreen(orientation = null) {
    try {
        await pywebview.api.open_green_screen(orientation);
        const orientationText = orientation === 'portrait' ? '直向' : '橫向';
        addLogLocal(`開啟${orientationText}綠幕視窗`);
    } catch (e) {
        console.error('開啟綠幕失敗:', e);
        addLogLocal('開啟綠幕失敗: ' + e);
    }
}

// === 測試功能 ===
async function testWheel() {
    await openGreenScreen();
    setTimeout(async () => {
        try {
            await pywebview.api.trigger_green_screen('triggerWheel', {
                username: '測試用戶',
                spins: 1
            });
        } catch (e) {
            console.error('測試轉盤失敗:', e);
        }
    }, 800);
}

async function testGiftbox() {
    await openGreenScreen();
    setTimeout(async () => {
        try {
            await pywebview.api.trigger_green_screen('triggerGiftbox', {
                username: '測試用戶',
                opens: 1
            });
        } catch (e) {
            console.error('測試盲盒失敗:', e);
        }
    }, 800);
}

async function testVideo() {
    const gifts = getCurrentSceneVideoGifts();
    const gift = gifts.find(g => g.video_path);
    if (gift) {
        await openGreenScreen();
        setTimeout(async () => {
            try {
                await pywebview.api.trigger_green_screen('triggerVideo', {
                    username: '測試用戶',
                    path: gift.video_path,
                    speed: gift.video_speed || 1.0,
                    volume: gift.video_volume || 100,
                    seconds: gift.video_seconds || 0,
                    repeat: gift.video_repeat || 1
                });
            } catch (e) {
                console.error('測試影片失敗:', e);
            }
        }, 800);
    } else {
        alert('尚未設定任何影片觸發');
    }
}

// === 模擬送禮 ===
function showSimulateDialog() {
    const select = document.getElementById('simGift');
    select.innerHTML = '';

    // 收集所有禮物設定（只顯示已啟用模組的禮物）
    const giftOptions = [];  // [{value: 禮物名稱, text: 顯示文字}]
    const addedGifts = new Set();  // 避免重複

    // 影片禮物（使用當前場景）- 檢查是否啟用
    if (config.video_enabled) {
        const videoGifts = getCurrentSceneVideoGifts();
        videoGifts.forEach(g => {
            if (g.trigger_type === 'gift' && g.name && !addedGifts.has(g.name)) {
                addedGifts.add(g.name);
                const displayName = g.display_name || g.name;
                giftOptions.push({
                    value: g.name,
                    text: `${displayName} (${g.name})`
                });
            }
        });
    }

    // 轉盤禮物 - 檢查是否啟用
    if (config.wheel_enabled) {
        (config.wheel_gifts || []).forEach(g => {
            if (g.name && !addedGifts.has(g.name)) {
                addedGifts.add(g.name);
                giftOptions.push({
                    value: g.name,
                    text: `${g.name} [轉盤]`
                });
            }
        });
    }

    // 抓鴨子觸發禮物 - 檢查是否啟用
    if (config.duck_catch_enabled) {
        const duckCfg = config.duck_catch_config || {};
        if (duckCfg.trigger_type === 'gift' && duckCfg.trigger_gift && !addedGifts.has(duckCfg.trigger_gift)) {
            addedGifts.add(duckCfg.trigger_gift);
            giftOptions.push({
                value: duckCfg.trigger_gift,
                text: `${duckCfg.trigger_gift} [抓鴨子]`
            });
        }
    }

    // 盲盒禮物 - 檢查是否啟用
    if (config.giftbox_enabled) {
        (config.giftbox_gifts || []).forEach(g => {
            if (g.name && !addedGifts.has(g.name)) {
                addedGifts.add(g.name);
                giftOptions.push({
                    value: g.name,
                    text: `${g.name} [盲盒]`
                });
            }
        });
    }

    // 鎖鏈對抗禮物 - 檢查是否啟用
    if (config.chain_battle_enabled) {
        const chainCfg = config.chain_battle_config || {};
        // 啟動禮物
        if (chainCfg.trigger_gift && !addedGifts.has(chainCfg.trigger_gift)) {
            addedGifts.add(chainCfg.trigger_gift);
            giftOptions.push({
                value: chainCfg.trigger_gift,
                text: `${chainCfg.trigger_gift} [鎖鏈-啟動]`
            });
        }
        // 增加禮物
        (chainCfg.add_gifts || []).forEach(g => {
            if (g.name && !addedGifts.has(g.name)) {
                addedGifts.add(g.name);
                giftOptions.push({
                    value: g.name,
                    text: `${g.name} [鎖鏈+${g.amount || 1}]`
                });
            }
        });
    }

    // 窒息挑戰禮物 - 檢查是否啟用
    if (config.choking_enabled) {
        const chokingCfg = config.choking_config || {};
        // 觸發禮物
        if (chokingCfg.trigger_gift && !addedGifts.has(chokingCfg.trigger_gift)) {
            addedGifts.add(chokingCfg.trigger_gift);
            giftOptions.push({
                value: chokingCfg.trigger_gift,
                text: `${chokingCfg.trigger_gift} [窒息-觸發]`
            });
        }
        // 禁言禮物
        if (chokingCfg.silent_gift && !addedGifts.has(chokingCfg.silent_gift)) {
            addedGifts.add(chokingCfg.silent_gift);
            giftOptions.push({
                value: chokingCfg.silent_gift,
                text: `${chokingCfg.silent_gift} [窒息-禁言]`
            });
        }
    }

    if (giftOptions.length === 0) {
        const option = document.createElement('option');
        option.textContent = '(無禮物設定)';
        select.appendChild(option);
    } else {
        giftOptions.forEach(g => {
            const option = document.createElement('option');
            option.value = g.value;
            option.textContent = g.text;
            select.appendChild(option);
        });
    }

    openDialog('simulateDialog');
}

async function doSimulate() {
    const username = document.getElementById('simUsername').value || '測試用戶';
    const giftName = document.getElementById('simGift').value;
    const count = parseInt(document.getElementById('simCount').value) || 1;

    if (giftName && giftName !== '(無禮物設定)') {
        // 確保綠幕視窗已開啟並等待準備好
        await openGreenScreen();
        // 等待綠幕視窗準備好後再觸發
        setTimeout(async () => {
            await pywebview.api.simulate_gift(username, giftName, count);
        }, 500);
    }

    closeDialog('simulateDialog');
}

// === 轉盤禮物管理 ===
function renderWheelGiftList() {
    const container = document.getElementById('wheelGiftList');
    const gifts = config.wheel_gifts || [];

    if (gifts.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無設定</div>';
        return;
    }

    container.innerHTML = gifts.map((gift, index) => `
        <div class="list-item">
            <div class="list-item-content">
                <span class="list-item-icon">🎁</span>
                <span class="list-item-text">
                    ${gift.name}
                    <span style="color: var(--text-muted)"> x${gift.spins}</span>
                </span>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-secondary btn-sm" onclick="showEditWheelGiftDialog(${index})">編輯</button>
                <button class="btn btn-danger btn-sm" onclick="deleteWheelGift(${index})">刪除</button>
            </div>
        </div>
    `).join('');
}

function showAddWheelGiftDialog() {
    document.getElementById('wheelGiftDialogTitle').textContent = '新增轉盤觸發';
    document.getElementById('wheelGiftEditIndex').value = -1;
    document.getElementById('wheelGiftName').value = '';
    document.getElementById('wheelGiftSpins').value = 1;
    openDialog('wheelGiftDialog');
}

function showEditWheelGiftDialog(index) {
    const gift = config.wheel_gifts[index];
    if (!gift) return;

    document.getElementById('wheelGiftDialogTitle').textContent = '編輯轉盤觸發';
    document.getElementById('wheelGiftEditIndex').value = index;
    document.getElementById('wheelGiftName').value = gift.name || '';
    document.getElementById('wheelGiftSpins').value = gift.spins || 1;
    openDialog('wheelGiftDialog');
}

async function saveWheelGift() {
    const gift = {
        name: document.getElementById('wheelGiftName').value.trim(),
        spins: parseInt(document.getElementById('wheelGiftSpins').value) || 1
    };

    if (!gift.name) {
        alert('請輸入禮物名稱');
        return;
    }

    const editIndex = parseInt(document.getElementById('wheelGiftEditIndex').value);

    if (!config.wheel_gifts) config.wheel_gifts = [];

    if (editIndex >= 0) {
        config.wheel_gifts[editIndex] = gift;
    } else {
        config.wheel_gifts.push(gift);
    }

    await pywebview.api.update_config({ wheel_gifts: config.wheel_gifts });
    renderWheelGiftList();
    closeDialog('wheelGiftDialog');
    addLogLocal(`已儲存轉盤觸發: ${gift.name}`);
}

async function deleteWheelGift(index) {
    if (confirm('確定要刪除此設定嗎？')) {
        config.wheel_gifts.splice(index, 1);
        await pywebview.api.update_config({ wheel_gifts: config.wheel_gifts });
        renderWheelGiftList();
        addLogLocal('已刪除轉盤觸發');
    }
}

// === 轉盤選項管理 ===
function renderWheelOptionList() {
    const container = document.getElementById('wheelOptionList');
    const options = config.wheel_options || [];

    if (options.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無設定</div>';
        return;
    }

    container.innerHTML = options.map((opt, index) => `
        <div class="list-item">
            <div class="list-item-content">
                <span class="list-item-icon" style="color: ${opt.color}">●</span>
                <span class="list-item-text">
                    ${opt.name}
                    <span style="color: var(--text-muted)"> (權重: ${opt.weight})</span>
                </span>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-secondary btn-sm" onclick="showEditWheelOptionDialog(${index})">編輯</button>
                <button class="btn btn-danger btn-sm" onclick="deleteWheelOption(${index})">刪除</button>
            </div>
        </div>
    `).join('');
}

function showAddWheelOptionDialog() {
    document.getElementById('wheelOptionDialogTitle').textContent = '新增轉盤選項';
    document.getElementById('wheelOptionEditIndex').value = -1;
    document.getElementById('optionName').value = '';
    document.getElementById('optionColor').value = '#4ecca3';
    document.getElementById('optionWeight').value = 1;
    openDialog('wheelOptionDialog');
}

function showEditWheelOptionDialog(index) {
    const option = config.wheel_options[index];
    if (!option) return;

    document.getElementById('wheelOptionDialogTitle').textContent = '編輯轉盤選項';
    document.getElementById('wheelOptionEditIndex').value = index;
    document.getElementById('optionName').value = option.name || '';
    document.getElementById('optionColor').value = option.color || '#4ecca3';
    document.getElementById('optionWeight').value = option.weight || 1;
    openDialog('wheelOptionDialog');
}

async function saveWheelOption() {
    const option = {
        name: document.getElementById('optionName').value.trim(),
        color: document.getElementById('optionColor').value,
        weight: parseInt(document.getElementById('optionWeight').value) || 1
    };

    if (!option.name) {
        alert('請輸入選項名稱');
        return;
    }

    const editIndex = parseInt(document.getElementById('wheelOptionEditIndex').value);

    if (!config.wheel_options) config.wheel_options = [];

    if (editIndex >= 0) {
        config.wheel_options[editIndex] = option;
    } else {
        config.wheel_options.push(option);
    }

    await pywebview.api.update_config({ wheel_options: config.wheel_options });
    renderWheelOptionList();
    closeDialog('wheelOptionDialog');
    addLogLocal(`已儲存轉盤選項: ${option.name}`);
}

async function deleteWheelOption(index) {
    if (confirm('確定要刪除此選項嗎？')) {
        config.wheel_options.splice(index, 1);
        await pywebview.api.update_config({ wheel_options: config.wheel_options });
        renderWheelOptionList();
        addLogLocal('已刪除轉盤選項');
    }
}

// === 盲盒禮物管理 ===
function renderGiftboxGiftList() {
    const container = document.getElementById('giftboxGiftList');
    const gifts = config.giftbox_gifts || [];

    if (gifts.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無設定</div>';
        return;
    }

    container.innerHTML = gifts.map((gift, index) => `
        <div class="list-item">
            <div class="list-item-content">
                <span class="list-item-icon">🎁</span>
                <span class="list-item-text">
                    ${gift.name}
                    <span style="color: var(--text-muted)"> x${gift.count}</span>
                </span>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-secondary btn-sm" onclick="showEditGiftboxGiftDialog(${index})">編輯</button>
                <button class="btn btn-danger btn-sm" onclick="deleteGiftboxGift(${index})">刪除</button>
            </div>
        </div>
    `).join('');
}

function showAddGiftboxGiftDialog() {
    document.getElementById('giftboxGiftDialogTitle').textContent = '新增盲盒觸發';
    document.getElementById('giftboxGiftEditIndex').value = -1;
    document.getElementById('giftboxGiftName').value = '';
    document.getElementById('giftboxGiftCount').value = 1;
    openDialog('giftboxGiftDialog');
}

function showEditGiftboxGiftDialog(index) {
    const gift = config.giftbox_gifts[index];
    if (!gift) return;

    document.getElementById('giftboxGiftDialogTitle').textContent = '編輯盲盒觸發';
    document.getElementById('giftboxGiftEditIndex').value = index;
    document.getElementById('giftboxGiftName').value = gift.name || '';
    document.getElementById('giftboxGiftCount').value = gift.count || 1;
    openDialog('giftboxGiftDialog');
}

async function saveGiftboxGift() {
    const gift = {
        name: document.getElementById('giftboxGiftName').value.trim(),
        count: parseInt(document.getElementById('giftboxGiftCount').value) || 1
    };

    if (!gift.name) {
        alert('請輸入禮物名稱');
        return;
    }

    const editIndex = parseInt(document.getElementById('giftboxGiftEditIndex').value);

    if (!config.giftbox_gifts) config.giftbox_gifts = [];

    if (editIndex >= 0) {
        config.giftbox_gifts[editIndex] = gift;
    } else {
        config.giftbox_gifts.push(gift);
    }

    await pywebview.api.update_config({ giftbox_gifts: config.giftbox_gifts });
    renderGiftboxGiftList();
    closeDialog('giftboxGiftDialog');
    addLogLocal(`已儲存盲盒觸發: ${gift.name}`);
}

async function deleteGiftboxGift(index) {
    if (confirm('確定要刪除此設定嗎？')) {
        config.giftbox_gifts.splice(index, 1);
        await pywebview.api.update_config({ giftbox_gifts: config.giftbox_gifts });
        renderGiftboxGiftList();
        addLogLocal('已刪除盲盒觸發');
    }
}

// === 盲盒選項管理 ===
function renderGiftboxOptionList() {
    const container = document.getElementById('giftboxOptionList');
    const options = config.giftbox_options || [];

    if (options.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無設定</div>';
        return;
    }

    container.innerHTML = options.map((opt, index) => {
        const hasVideo = opt.video_path ? '🎬' : '';
        return `
            <div class="list-item">
                <div class="list-item-content">
                    <span class="list-item-icon" style="color: ${opt.color}">●</span>
                    <span class="list-item-text">
                        ${opt.name} ${hasVideo}
                        <span style="color: var(--text-muted)"> (權重: ${opt.weight})</span>
                    </span>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditGiftboxOptionDialog(${index})">編輯</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteGiftboxOption(${index})">刪除</button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddGiftboxOptionDialog() {
    document.getElementById('giftboxOptionDialogTitle').textContent = '新增盲盒選項';
    document.getElementById('giftboxOptionEditIndex').value = -1;
    document.getElementById('giftboxOptionName').value = '';
    document.getElementById('giftboxOptionColor').value = '#ffd93d';
    document.getElementById('giftboxOptionWeight').value = 1;
    document.getElementById('giftboxOptionVideoPath').value = '';
    document.getElementById('giftboxOptionVideoSeconds').value = 0;
    document.getElementById('giftboxOptionVideoVolume').value = 100;
    document.getElementById('giftboxVolumeValue').textContent = '100%';
    openDialog('giftboxOptionDialog');
}

function showEditGiftboxOptionDialog(index) {
    const option = config.giftbox_options[index];
    if (!option) return;

    document.getElementById('giftboxOptionDialogTitle').textContent = '編輯盲盒選項';
    document.getElementById('giftboxOptionEditIndex').value = index;
    document.getElementById('giftboxOptionName').value = option.name || '';
    document.getElementById('giftboxOptionColor').value = option.color || '#ffd93d';
    document.getElementById('giftboxOptionWeight').value = option.weight || 1;
    document.getElementById('giftboxOptionVideoPath').value = option.video_path || '';
    document.getElementById('giftboxOptionVideoSeconds').value = option.video_seconds || 0;
    const volume = option.video_volume !== undefined ? option.video_volume : 100;
    document.getElementById('giftboxOptionVideoVolume').value = volume;
    document.getElementById('giftboxVolumeValue').textContent = volume + '%';
    openDialog('giftboxOptionDialog');
}

async function saveGiftboxOption() {
    const option = {
        name: document.getElementById('giftboxOptionName').value.trim(),
        color: document.getElementById('giftboxOptionColor').value,
        weight: parseInt(document.getElementById('giftboxOptionWeight').value) || 1,
        video_path: document.getElementById('giftboxOptionVideoPath').value.trim(),
        video_seconds: parseFloat(document.getElementById('giftboxOptionVideoSeconds').value) || 0,
        video_volume: parseInt(document.getElementById('giftboxOptionVideoVolume').value) || 100
    };

    if (!option.name) {
        alert('請輸入選項名稱');
        return;
    }

    const editIndex = parseInt(document.getElementById('giftboxOptionEditIndex').value);

    if (!config.giftbox_options) config.giftbox_options = [];

    if (editIndex >= 0) {
        config.giftbox_options[editIndex] = option;
    } else {
        config.giftbox_options.push(option);
    }

    await pywebview.api.update_config({ giftbox_options: config.giftbox_options });
    renderGiftboxOptionList();
    closeDialog('giftboxOptionDialog');
    addLogLocal(`已儲存盲盒選項: ${option.name}`);
}

async function selectGiftboxVideoFile() {
    try {
        const path = await pywebview.api.select_file();
        if (path) {
            document.getElementById('giftboxOptionVideoPath').value = path;
        }
    } catch (e) {
        console.error('選擇檔案失敗:', e);
    }
}

async function deleteGiftboxOption(index) {
    if (confirm('確定要刪除此選項嗎？')) {
        config.giftbox_options.splice(index, 1);
        await pywebview.api.update_config({ giftbox_options: config.giftbox_options });
        renderGiftboxOptionList();
        addLogLocal('已刪除盲盒選項');
    }
}

// === 場景管理 ===
let currentSceneId = 'default';
let scenes = [];

// 載入場景列表
async function loadScenes() {
    try {
        const data = await pywebview.api.get_scenes();
        scenes = data.scenes || [];
        currentSceneId = data.activeSceneId || 'default';
        renderSceneList();
        updateCurrentSceneBadge();
    } catch (e) {
        console.error('載入場景失敗:', e);
    }
}

// 取得當前場景
function getCurrentScene() {
    return scenes.find(s => s.id === currentSceneId) || scenes[0] || { id: 'default', name: '預設場景', video_gifts: [] };
}

// 取得當前場景的影片設定
function getCurrentSceneVideoGifts() {
    const scene = getCurrentScene();
    return scene.video_gifts || [];
}

// 渲染場景列表
function renderSceneList() {
    const container = document.getElementById('sceneList');
    if (!container) return;

    if (scenes.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無場景</div>';
        return;
    }

    container.innerHTML = scenes.map(scene => {
        const isActive = scene.id === currentSceneId;
        const isDefault = scene.id === 'default';
        const giftCount = (scene.video_gifts || []).length;

        return `
            <div class="scene-item ${isActive ? 'active' : ''}" onclick="switchToScene('${scene.id}')">
                <span class="scene-name">${scene.name}</span>
                <span class="scene-count">${giftCount} 個觸發</span>
                <div class="scene-actions-inline">
                    <button class="scene-btn" onclick="event.stopPropagation(); renameScenePrompt('${scene.id}', '${scene.name}')" title="重新命名">✏️</button>
                    ${!isDefault ? `<button class="scene-btn delete" onclick="event.stopPropagation(); deleteSceneConfirm('${scene.id}')" title="刪除">🗑️</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 更新當前場景標籤
function updateCurrentSceneBadge() {
    const badge = document.getElementById('currentSceneBadge');
    if (badge) {
        const scene = getCurrentScene();
        badge.textContent = `(${scene.name})`;
    }
}

// 切換場景
async function switchToScene(sceneId) {
    try {
        const result = await pywebview.api.switch_scene(sceneId);
        if (result.success) {
            currentSceneId = sceneId;
            renderSceneList();
            renderVideoGiftList();
            updateCurrentSceneBadge();
        }
    } catch (e) {
        console.error('切換場景失敗:', e);
    }
}

// 新增場景 - 開啟對話框
function createNewScene() {
    document.getElementById('sceneNameDialogTitle').textContent = '新增場景';
    document.getElementById('sceneNameEditId').value = '';
    document.getElementById('sceneNameInput').value = '';
    openDialog('sceneNameDialog');
    setTimeout(() => document.getElementById('sceneNameInput').focus(), 100);
}

// 重新命名場景 - 開啟對話框
function renameScenePrompt(sceneId, currentName) {
    document.getElementById('sceneNameDialogTitle').textContent = '重新命名場景';
    document.getElementById('sceneNameEditId').value = sceneId;
    document.getElementById('sceneNameInput').value = currentName;
    openDialog('sceneNameDialog');
    setTimeout(() => {
        const input = document.getElementById('sceneNameInput');
        input.focus();
        input.select();
    }, 100);
}

// 確認場景名稱（新增或重新命名）
async function confirmSceneName() {
    const sceneId = document.getElementById('sceneNameEditId').value;
    const name = document.getElementById('sceneNameInput').value.trim();

    if (!name) {
        alert('請輸入場景名稱');
        return;
    }

    try {
        if (sceneId) {
            // 重新命名
            const result = await pywebview.api.rename_scene(sceneId, name);
            if (result.success) {
                const scene = scenes.find(s => s.id === sceneId);
                if (scene) scene.name = name;
                renderSceneList();
                updateCurrentSceneBadge();
                addLogLocal(`🎬 已重新命名場景: ${name}`);
            } else {
                alert('重新命名失敗: ' + (result.error || '未知錯誤'));
            }
        } else {
            // 新增
            const result = await pywebview.api.create_scene(name);
            if (result.success) {
                scenes.push(result.scene);
                renderSceneList();
                addLogLocal(`🎬 已新增場景: ${name}`);
            } else {
                alert('新增場景失敗: ' + (result.error || '未知錯誤'));
            }
        }
        closeDialog('sceneNameDialog');
    } catch (e) {
        console.error('場景操作失敗:', e);
        alert('操作失敗: ' + e.message);
    }
}

// 刪除場景
async function deleteSceneConfirm(sceneId) {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    if (!confirm(`確定要刪除場景「${scene.name}」嗎？\n此操作無法復原，場景內的所有觸發設定都會被刪除。`)) {
        return;
    }

    try {
        const result = await pywebview.api.delete_scene(sceneId);
        if (result.success) {
            scenes = scenes.filter(s => s.id !== sceneId);
            if (currentSceneId === sceneId) {
                currentSceneId = 'default';
            }
            renderSceneList();
            renderVideoGiftList();
            updateCurrentSceneBadge();
            addLogLocal(`🎬 已刪除場景: ${scene.name}`);
        }
    } catch (e) {
        console.error('刪除場景失敗:', e);
        alert('刪除場景失敗: ' + e.message);
    }
}

// 儲存當前場景的影片設定
async function saveCurrentSceneVideoGifts() {
    try {
        const scene = getCurrentScene();
        await pywebview.api.update_scene_video_gifts(currentSceneId, scene.video_gifts || []);
    } catch (e) {
        console.error('儲存場景設定失敗:', e);
    }
}

// === 影片觸發管理 ===
function renderVideoGiftList() {
    const container = document.getElementById('videoGiftList');
    const gifts = getCurrentSceneVideoGifts();

    if (gifts.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無設定</div>';
        return;
    }

    container.innerHTML = gifts.map((gift, index) => {
        const isEnabled = gift.enabled !== false;
        const displayName = gift.display_name || gift.name || '未命名';

        // 根據觸發類型顯示不同的觸發資訊
        let triggerInfo = '';
        if (gift.trigger_type === 'gift') {
            triggerInfo = `禮物: ${gift.name || '未設定'}`;
        } else if (gift.trigger_type === 'chat') {
            triggerInfo = `彈幕: ${gift.trigger_keyword || '未設定'}`;
        } else if (gift.trigger_type === 'like') {
            triggerInfo = '點讚';
        } else if (gift.trigger_type === 'shortcut') {
            triggerInfo = `快捷鍵: ${gift.shortcut || '未設定'}`;
        }

        return `
            <div class="list-item">
                <div class="list-item-content">
                    <label class="trigger-switch-sm" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleVideoGiftEnabled(${index})">
                        <span class="trigger-slider-sm"></span>
                    </label>
                    <span class="list-item-text" style="${isEnabled ? '' : 'opacity: 0.5;'}">
                        ${displayName}
                        <span style="color: var(--text-muted); font-size: 12px;"> (${triggerInfo})</span>
                    </span>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditVideoGiftDialog(${index})">編輯</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVideoGift(${index})">刪除</button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddVideoGiftDialog() {
    document.getElementById('videoGiftDialogTitle').textContent = '新增影片觸發';
    document.getElementById('videoGiftEditIndex').value = -1;
    document.getElementById('videoGiftDisplayName').value = '';
    document.getElementById('videoGiftName').value = '';
    document.getElementById('videoTriggerType').value = 'gift';
    document.getElementById('videoTriggerKeyword').value = '';
    document.getElementById('videoPath').value = '';
    document.getElementById('videoPriority').value = 1;
    document.getElementById('videoRepeat').value = 1;
    document.getElementById('videoSeconds').value = 0;
    document.getElementById('videoSpeed').value = 1.0;
    document.getElementById('videoVolume').value = 100;
    document.getElementById('volumeValue').textContent = '100%';
    document.getElementById('forceInterrupt').checked = false;
    document.getElementById('videoShortcut').value = '';
    toggleVideoTriggerOptions();
    openDialog('videoGiftDialog');
}

function showEditVideoGiftDialog(index) {
    const gifts = getCurrentSceneVideoGifts();
    const gift = gifts[index];
    if (!gift) return;

    document.getElementById('videoGiftDialogTitle').textContent = '編輯影片觸發';
    document.getElementById('videoGiftEditIndex').value = index;
    document.getElementById('videoGiftDisplayName').value = gift.display_name || gift.name || '';
    document.getElementById('videoGiftName').value = gift.name || '';
    document.getElementById('videoTriggerType').value = gift.trigger_type || 'gift';
    document.getElementById('videoTriggerKeyword').value = gift.trigger_keyword || '';
    document.getElementById('videoPath').value = gift.video_path || '';
    document.getElementById('videoPriority').value = gift.video_priority || 1;
    document.getElementById('videoRepeat').value = gift.video_repeat || 1;
    document.getElementById('videoSeconds').value = gift.video_seconds || 0;
    document.getElementById('videoSpeed').value = gift.video_speed || 1.0;
    document.getElementById('videoVolume').value = gift.video_volume || 100;
    document.getElementById('volumeValue').textContent = `${gift.video_volume || 100}%`;
    document.getElementById('forceInterrupt').checked = gift.force_interrupt || false;
    document.getElementById('videoShortcut').value = gift.shortcut || '';
    toggleVideoTriggerOptions();
    openDialog('videoGiftDialog');
}

// 快捷鍵輸入處理
let shortcutInputHandler = null;
function initShortcutInput() {
    const input = document.getElementById('videoShortcut');
    if (!input) return;

    // 移除舊的事件監聽器
    if (shortcutInputHandler) {
        input.removeEventListener('keydown', shortcutInputHandler);
    }

    shortcutInputHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 忽略單獨的修飾鍵
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            return;
        }

        // 組合快捷鍵字串
        let shortcut = '';
        if (e.ctrlKey) shortcut += 'Ctrl+';
        if (e.altKey) shortcut += 'Alt+';
        if (e.shiftKey) shortcut += 'Shift+';

        // 處理按鍵名稱
        let key = e.key;
        if (key === ' ') key = 'Space';
        else if (key.length === 1) key = key.toUpperCase();

        shortcut += key;
        input.value = shortcut;
    };

    input.addEventListener('keydown', shortcutInputHandler);
}

function clearVideoShortcut() {
    document.getElementById('videoShortcut').value = '';
}

function toggleVideoTriggerOptions() {
    const triggerType = document.getElementById('videoTriggerType').value;
    document.getElementById('videoGiftNameGroup').style.display = triggerType === 'gift' ? 'block' : 'none';
    document.getElementById('videoKeywordGroup').style.display = triggerType === 'chat' ? 'block' : 'none';
    document.getElementById('videoShortcutGroup').style.display = triggerType === 'shortcut' ? 'block' : 'none';

    // 如果是快捷鍵模式，初始化快捷鍵輸入
    if (triggerType === 'shortcut') {
        initShortcutInput();
    }
}

async function selectVideoFile() {
    try {
        const path = await pywebview.api.select_file();
        if (path) {
            document.getElementById('videoPath').value = path;
        }
    } catch (e) {
        console.error('選擇檔案失敗:', e);
    }
}

async function saveVideoGift() {
    const editIndex = parseInt(document.getElementById('videoGiftEditIndex').value);
    const scene = getCurrentScene();
    if (!scene.video_gifts) scene.video_gifts = [];

    // 保留原有的 enabled 狀態（編輯時），新增時預設為 true
    const existingEnabled = (editIndex >= 0 && scene.video_gifts[editIndex])
        ? scene.video_gifts[editIndex].enabled
        : true;

    const triggerType = document.getElementById('videoTriggerType').value;
    const displayName = document.getElementById('videoGiftDisplayName').value.trim();
    const giftName = document.getElementById('videoGiftName').value.trim();

    const gift = {
        display_name: displayName,
        name: giftName,  // 禮物名稱（用於觸發匹配）
        trigger_type: triggerType,
        trigger_keyword: document.getElementById('videoTriggerKeyword').value.trim(),
        video_path: document.getElementById('videoPath').value.trim(),
        video_priority: parseInt(document.getElementById('videoPriority').value) || 1,
        video_repeat: parseInt(document.getElementById('videoRepeat').value) || 1,
        video_seconds: parseFloat(document.getElementById('videoSeconds').value) || 0,
        video_speed: parseFloat(document.getElementById('videoSpeed').value) || 1.0,
        video_volume: parseInt(document.getElementById('videoVolume').value) || 100,
        force_interrupt: document.getElementById('forceInterrupt').checked,
        shortcut: document.getElementById('videoShortcut').value.trim(),
        enabled: existingEnabled !== false
    };

    if (!gift.display_name) {
        alert('請輸入顯示名稱');
        return;
    }

    if (triggerType === 'gift' && !gift.name) {
        alert('請輸入禮物名稱');
        return;
    }

    if (triggerType === 'chat' && !gift.trigger_keyword) {
        alert('請輸入彈幕關鍵字');
        return;
    }

    if (triggerType === 'shortcut' && !gift.shortcut) {
        alert('請設定快捷鍵');
        return;
    }

    if (!gift.video_path) {
        alert('請選擇影片檔案');
        return;
    }

    if (editIndex >= 0) {
        scene.video_gifts[editIndex] = gift;
    } else {
        scene.video_gifts.push(gift);
    }

    await saveCurrentSceneVideoGifts();
    renderVideoGiftList();
    renderSceneList();  // 更新場景列表顯示的觸發數量
    closeDialog('videoGiftDialog');
    addLogLocal(`已儲存影片觸發: ${gift.display_name} (場景: ${scene.name})`);
}

async function deleteVideoGift(index) {
    if (confirm('確定要刪除此設定嗎？')) {
        const scene = getCurrentScene();
        if (!scene.video_gifts) return;
        scene.video_gifts.splice(index, 1);
        await saveCurrentSceneVideoGifts();
        renderVideoGiftList();
        renderSceneList();  // 更新場景列表顯示的觸發數量
        addLogLocal('已刪除影片觸發');
    }
}

async function toggleVideoGiftEnabled(index) {
    const scene = getCurrentScene();
    if (!scene.video_gifts || !scene.video_gifts[index]) return;

    const gift = scene.video_gifts[index];
    gift.enabled = gift.enabled === false ? true : false;

    await saveCurrentSceneVideoGifts();
    renderVideoGiftList();
    addLogLocal(`${gift.name} 觸發已${gift.enabled ? '啟用' : '禁用'}`);
}

// === 隨機影片管理 ===
function renderRandomVideoList() {
    const container = document.getElementById('randomVideoList');
    const list = config.random_video_list || [];

    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無設定</div>';
        return;
    }

    const typeLabels = { gift: '禮物', chat: '彈幕', like: '點讚' };

    container.innerHTML = list.map((rv, index) => {
        const isEnabled = rv.enabled !== false;
        const triggerText = rv.trigger_type === 'gift' ? rv.trigger_gift :
                          rv.trigger_type === 'chat' ? `"${rv.trigger_keyword}"` : '';

        return `
            <div class="list-item">
                <div class="list-item-content">
                    <label class="trigger-switch-sm" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleRandomVideoEnabled(${index})">
                        <span class="trigger-slider-sm"></span>
                    </label>
                    <span class="list-item-text" style="${isEnabled ? '' : 'opacity: 0.5;'}">
                        ${rv.name}
                        <span style="color: var(--text-muted)"> (${typeLabels[rv.trigger_type] || '禮物'}${triggerText ? ': ' + triggerText : ''})</span>
                    </span>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditRandomVideoDialog(${index})">編輯</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRandomVideo(${index})">刪除</button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddRandomVideoDialog() {
    document.getElementById('randomVideoDialogTitle').textContent = '新增隨機影片';
    document.getElementById('randomVideoEditIndex').value = -1;
    document.getElementById('randomVideoName').value = '';
    document.getElementById('randomVideoTriggerType').value = 'gift';
    document.getElementById('randomVideoTriggerGift').value = '';
    document.getElementById('randomVideoTriggerKeyword').value = '';
    document.getElementById('randomVideoFolderPath').value = '';
    document.getElementById('randomVideoFolderInfo').textContent = '';
    document.getElementById('randomVideoPriority').value = 1;
    document.getElementById('randomVideoRepeat').value = 1;
    document.getElementById('randomVideoSeconds').value = 0;
    document.getElementById('randomVideoSpeed').value = 1.0;
    document.getElementById('randomVideoVolume').value = 100;
    document.getElementById('randomVideoVolumeValue').textContent = '100%';
    document.getElementById('randomVideoAvoidRepeat').checked = true;
    document.getElementById('randomVideoForceInterrupt').checked = false;
    // 清空權重列表
    document.getElementById('randomVideoWeightsGroup').style.display = 'none';
    document.getElementById('randomVideoWeightsList').innerHTML = '';
    window.currentVideoWeights = {};
    toggleRandomVideoTriggerOptions();
    openDialog('randomVideoDialog');
}

function showEditRandomVideoDialog(index) {
    const rv = config.random_video_list[index];
    if (!rv) return;

    document.getElementById('randomVideoDialogTitle').textContent = '編輯隨機影片';
    document.getElementById('randomVideoEditIndex').value = index;
    document.getElementById('randomVideoName').value = rv.name || '';
    document.getElementById('randomVideoTriggerType').value = rv.trigger_type || 'gift';
    document.getElementById('randomVideoTriggerGift').value = rv.trigger_gift || '';
    document.getElementById('randomVideoTriggerKeyword').value = rv.trigger_keyword || '';
    document.getElementById('randomVideoFolderPath').value = rv.folder_path || '';
    document.getElementById('randomVideoPriority').value = rv.video_priority || 1;
    document.getElementById('randomVideoRepeat').value = rv.video_repeat || 1;
    document.getElementById('randomVideoSeconds').value = rv.video_seconds || 0;
    document.getElementById('randomVideoSpeed').value = rv.video_speed || 1.0;
    document.getElementById('randomVideoVolume').value = rv.video_volume || 100;
    document.getElementById('randomVideoVolumeValue').textContent = `${rv.video_volume || 100}%`;
    document.getElementById('randomVideoAvoidRepeat').checked = rv.avoid_repeat !== false;
    document.getElementById('randomVideoForceInterrupt').checked = rv.force_interrupt || false;
    // 載入現有權重設定
    window.currentVideoWeights = rv.video_weights || {};
    toggleRandomVideoTriggerOptions();
    updateFolderInfo(rv.folder_path);
    openDialog('randomVideoDialog');
}

function toggleRandomVideoTriggerOptions() {
    const triggerType = document.getElementById('randomVideoTriggerType').value;
    document.getElementById('randomVideoGiftGroup').style.display = triggerType === 'gift' ? 'block' : 'none';
    document.getElementById('randomVideoKeywordGroup').style.display = triggerType === 'chat' ? 'block' : 'none';
}

async function selectRandomVideoFolder() {
    try {
        const folderPath = await pywebview.api.select_folder();
        if (folderPath) {
            document.getElementById('randomVideoFolderPath').value = folderPath;
            await updateFolderInfo(folderPath);
        }
    } catch (e) {
        console.error('選擇資料夾失敗:', e);
    }
}

async function updateFolderInfo(folderPath) {
    const infoEl = document.getElementById('randomVideoFolderInfo');
    const weightsGroup = document.getElementById('randomVideoWeightsGroup');
    const weightsList = document.getElementById('randomVideoWeightsList');

    if (!folderPath) {
        infoEl.textContent = '';
        weightsGroup.style.display = 'none';
        weightsList.innerHTML = '';
        return;
    }

    try {
        // 取得影片列表
        const result = await pywebview.api.get_folder_videos(folderPath);

        if (!result.success || result.videos.length === 0) {
            infoEl.textContent = result.error || '找不到影片檔案';
            infoEl.style.color = 'var(--danger)';
            weightsGroup.style.display = 'none';
            weightsList.innerHTML = '';
            return;
        }

        infoEl.textContent = `找到 ${result.videos.length} 個影片檔案`;
        infoEl.style.color = 'var(--success)';

        // 渲染權重列表
        renderVideoWeightsList(result.videos);
        weightsGroup.style.display = 'block';
    } catch (e) {
        infoEl.textContent = '無法讀取資料夾';
        infoEl.style.color = 'var(--danger)';
        weightsGroup.style.display = 'none';
        weightsList.innerHTML = '';
    }
}

// 渲染影片權重列表
function renderVideoWeightsList(videos) {
    const container = document.getElementById('randomVideoWeightsList');
    const weights = window.currentVideoWeights || {};

    if (!videos || videos.length === 0) {
        container.innerHTML = '<div class="video-weights-empty">沒有找到影片</div>';
        return;
    }

    // 計算總權重
    const totalWeight = videos.reduce((sum, v) => sum + (weights[v.name] || 1), 0);

    container.innerHTML = videos.map(video => {
        const weight = weights[video.name] || 1;
        const percent = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : 0;
        return `
            <div class="video-weight-item" data-filename="${video.name}">
                <span class="video-name" title="${video.name}">${video.name}</span>
                <input type="number" class="weight-input" value="${weight}" min="0" max="100" step="1"
                       onchange="updateVideoWeight('${video.name.replace(/'/g, "\\'")}', this.value)">
                <span class="weight-percent">${percent}%</span>
            </div>
        `;
    }).join('');
}

// 更新單一影片權重
function updateVideoWeight(filename, value) {
    const weight = Math.max(0, parseInt(value) || 0);
    if (!window.currentVideoWeights) {
        window.currentVideoWeights = {};
    }
    window.currentVideoWeights[filename] = weight;

    // 重新計算所有百分比
    updateWeightPercents();
}

// 更新所有權重百分比顯示
function updateWeightPercents() {
    const container = document.getElementById('randomVideoWeightsList');
    const items = container.querySelectorAll('.video-weight-item');
    const weights = window.currentVideoWeights || {};

    // 計算總權重
    let totalWeight = 0;
    items.forEach(item => {
        const filename = item.dataset.filename;
        totalWeight += (weights[filename] || 1);
    });

    // 更新百分比
    items.forEach(item => {
        const filename = item.dataset.filename;
        const weight = weights[filename] || 1;
        const percent = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : 0;
        const percentEl = item.querySelector('.weight-percent');
        if (percentEl) {
            percentEl.textContent = `${percent}%`;
        }
    });
}

async function saveRandomVideo() {
    const editIndex = parseInt(document.getElementById('randomVideoEditIndex').value);
    const existingEnabled = (editIndex >= 0 && config.random_video_list[editIndex])
        ? config.random_video_list[editIndex].enabled
        : true;

    const triggerType = document.getElementById('randomVideoTriggerType').value;

    // 收集權重設定（只保留非預設值的權重）
    const videoWeights = {};
    if (window.currentVideoWeights) {
        for (const [filename, weight] of Object.entries(window.currentVideoWeights)) {
            if (weight !== 1) {
                videoWeights[filename] = weight;
            }
        }
    }

    const rv = {
        name: document.getElementById('randomVideoName').value.trim(),
        trigger_type: triggerType,
        trigger_gift: triggerType === 'gift' ? document.getElementById('randomVideoTriggerGift').value.trim() : '',
        trigger_keyword: triggerType === 'chat' ? document.getElementById('randomVideoTriggerKeyword').value.trim() : '',
        folder_path: document.getElementById('randomVideoFolderPath').value.trim(),
        video_priority: parseInt(document.getElementById('randomVideoPriority').value) || 1,
        video_repeat: parseInt(document.getElementById('randomVideoRepeat').value) || 1,
        video_seconds: parseFloat(document.getElementById('randomVideoSeconds').value) || 0,
        video_speed: parseFloat(document.getElementById('randomVideoSpeed').value) || 1.0,
        video_volume: parseInt(document.getElementById('randomVideoVolume').value) || 100,
        avoid_repeat: document.getElementById('randomVideoAvoidRepeat').checked,
        force_interrupt: document.getElementById('randomVideoForceInterrupt').checked,
        video_weights: Object.keys(videoWeights).length > 0 ? videoWeights : undefined,
        enabled: existingEnabled
    };

    if (!rv.name) {
        alert('請輸入名稱');
        return;
    }
    if (!rv.folder_path) {
        alert('請選擇影片資料夾');
        return;
    }
    if (rv.trigger_type === 'gift' && !rv.trigger_gift) {
        alert('請輸入觸發禮物名稱');
        return;
    }
    if (rv.trigger_type === 'chat' && !rv.trigger_keyword) {
        alert('請輸入彈幕關鍵字');
        return;
    }

    if (!config.random_video_list) {
        config.random_video_list = [];
    }

    if (editIndex >= 0) {
        config.random_video_list[editIndex] = rv;
    } else {
        config.random_video_list.push(rv);
    }

    await pywebview.api.update_config({ random_video_list: config.random_video_list });
    renderRandomVideoList();
    closeDialog('randomVideoDialog');
    addLogLocal(`已儲存隨機影片: ${rv.name}`);
}

async function deleteRandomVideo(index) {
    if (confirm('確定要刪除此設定嗎？')) {
        config.random_video_list.splice(index, 1);
        await pywebview.api.update_config({ random_video_list: config.random_video_list });
        renderRandomVideoList();
        addLogLocal('已刪除隨機影片設定');
    }
}

async function toggleRandomVideoEnabled(index) {
    if (!config.random_video_list[index]) return;

    const rv = config.random_video_list[index];
    rv.enabled = rv.enabled === false ? true : false;

    await pywebview.api.update_config({ random_video_list: config.random_video_list });
    renderRandomVideoList();
    addLogLocal(`${rv.name} 已${rv.enabled ? '啟用' : '禁用'}`);
}

async function testRandomVideo() {
    const list = config.random_video_list || [];
    if (list.length === 0) {
        alert('請先新增隨機影片設定');
        return;
    }

    // 使用第一個啟用的設定來測試
    const enabledItem = list.find(rv => rv.enabled !== false);
    if (!enabledItem) {
        alert('沒有已啟用的隨機影片設定');
        return;
    }

    if (!enabledItem.folder_path) {
        alert('請先設定影片資料夾');
        return;
    }

    try {
        // 先開啟綠幕視窗
        await openGreenScreen();

        // 延遲一下確保綠幕視窗準備好
        setTimeout(async () => {
            try {
                const result = await pywebview.api.test_random_video({
                    name: enabledItem.name,
                    folder_path: enabledItem.folder_path,
                    video_speed: enabledItem.video_speed || 1,
                    video_volume: enabledItem.video_volume || 100,
                    video_seconds: enabledItem.video_seconds || 0,
                    video_repeat: enabledItem.video_repeat || 1,
                    video_priority: enabledItem.video_priority || 1,
                    force_interrupt: enabledItem.force_interrupt || false,
                    avoid_repeat: enabledItem.avoid_repeat !== false,
                    video_weights: enabledItem.video_weights || {}
                });

                if (result.success) {
                    addLogLocal(`🎲 測試隨機影片: ${enabledItem.name} -> ${result.video}`);
                } else {
                    addLogLocal(`❌ 測試失敗: ${result.error}`);
                }
            } catch (e) {
                console.error('測試失敗:', e);
                addLogLocal('❌ 測試失敗: ' + e.message);
            }
        }, 500);
    } catch (e) {
        console.error('開啟綠幕失敗:', e);
        addLogLocal('❌ 開啟綠幕失敗');
    }
}

// === 抓鴨子模組 ===
let pendingDuckCatch = null;  // 暫存待確認的抓鴨子資料

// 載入抓鴨子設定
function loadDuckCatchConfig() {
    const cfg = config.duck_catch_config || {};
    document.getElementById('duckTriggerType').value = cfg.trigger_type || 'gift';
    document.getElementById('duckTriggerGift').value = cfg.trigger_gift || '';
    document.getElementById('duckTriggerKeyword').value = cfg.trigger_keyword || '';
    document.getElementById('duckCatchRate').value = cfg.catch_rate || 50;
    document.getElementById('duckCatchRateValue').textContent = `${cfg.catch_rate || 50}%`;
    document.getElementById('duckVideoSeconds').value = cfg.video_seconds || 0;
    document.getElementById('duckVideoSpeed').value = cfg.video_speed || 1;
    document.getElementById('duckVideoVolume').value = cfg.video_volume || 100;
    document.getElementById('duckVolumeValue').textContent = `${cfg.video_volume || 100}%`;
    document.getElementById('duckForceInterrupt').checked = cfg.force_interrupt || false;
    document.getElementById('duckQuackSound').value = cfg.quack_sound || '';
    document.getElementById('duckCatchEnabled').checked = config.duck_catch_enabled || false;
    // 保底設定
    document.getElementById('duckPityEnabled').checked = cfg.pity_enabled || false;
    document.getElementById('duckPityThreshold').value = cfg.pity_threshold || 1000;
    document.getElementById('duckPityMinAmount').value = cfg.pity_min_amount || 5000;
    document.getElementById('duckPityThresholdJackpot').value = cfg.pity_threshold_jackpot || 2000;
    document.getElementById('duckPityJackpotAmount').value = cfg.pity_jackpot_amount || 10000;
    // 軟保底
    document.getElementById('duckSoftPityEnabled').checked = cfg.soft_pity_enabled || false;
    document.getElementById('duckSoftPityStart').value = cfg.soft_pity_start || 70;
    // 連擊
    document.getElementById('duckComboEnabled').checked = cfg.combo_enabled || false;
    document.getElementById('duckComboWindow').value = cfg.combo_window || 30;
    document.getElementById('duckComboMultipliers').value = (cfg.combo_multipliers || [1, 1.5, 2, 3]).join(', ');
    updatePityDisplay();
    // 里程碑煙火影片
    document.getElementById('milestoneFireworkVideo').value = config.milestone_firework_video || '';
    // 世界冠軍送禮特效影片
    document.getElementById('worldChampionGiftVideo').value = config.world_champion_gift_video || '';
    // 鴨子查詢設定
    const dqCfg = config.duck_query_config || {};
    document.getElementById('duckQueryKeyword').value = config.duck_query_keyword || dqCfg.keyword || '查看';
    document.getElementById('duckQueryDuration').value = dqCfg.duration || 5;
    document.getElementById('duckQuerySize').value = dqCfg.size || 'medium';
    document.getElementById('duckQueryPosition').value = dqCfg.position || 'center';
    document.getElementById('duckQueryBorderColor').value = dqCfg.borderColor || '#ffd700';
    document.getElementById('duckQueryTextColor').value = dqCfg.textColor || '#ffffff';
    document.getElementById('duckQueryNumberColor').value = dqCfg.numberColor || '#ffd700';
    document.getElementById('duckQueryBgColor').value = dqCfg.bgColor || '#000000';
    document.getElementById('duckQueryFontSize').value = dqCfg.fontSize || 48;
    document.getElementById('duckQueryFontSizeValue').textContent = `${dqCfg.fontSize || 48}px`;
    toggleDuckTriggerOptions();
    renderDuckCaughtVideoList();
    renderDuckMissedVideoList();
}

// 切換觸發選項顯示
function toggleDuckTriggerOptions() {
    const triggerType = document.getElementById('duckTriggerType').value;
    // 使用空字串恢復預設 display，避免與 CSS Grid 衝突
    document.getElementById('duckGiftGroup').style.display = triggerType === 'gift' ? '' : 'none';
    document.getElementById('duckKeywordGroup').style.display = triggerType === 'chat' ? '' : 'none';
}

// 顯示新增鴨子影片對話框
function showAddDuckVideoDialog(type) {
    document.getElementById('duckVideoType').value = type;
    document.getElementById('duckVideoEditIndex').value = -1;
    document.getElementById('duckVideoPath').value = '';
    document.getElementById('duckVideoWeight').value = 1;
    document.getElementById('duckVideoAmount').value = 1;

    // 抓到影片才顯示數量欄位
    document.getElementById('duckVideoAmountGroup').style.display = type === 'caught' ? 'block' : 'none';
    document.getElementById('duckVideoDialogTitle').textContent = type === 'caught' ? '新增抓到影片' : '新增沒抓到影片';

    openDialog('duckVideoDialog');
}

// 選擇鴨子影片
async function selectDuckVideo() {
    try {
        const filePath = await pywebview.api.select_file('video');
        if (filePath) {
            document.getElementById('duckVideoPath').value = filePath;
        }
    } catch (e) {
        console.error('選擇影片失敗:', e);
    }
}

// 儲存鴨子影片
function saveDuckVideo() {
    const type = document.getElementById('duckVideoType').value;
    const editIndex = parseInt(document.getElementById('duckVideoEditIndex').value);
    const path = document.getElementById('duckVideoPath').value;
    const weight = parseInt(document.getElementById('duckVideoWeight').value) || 1;
    const amount = parseInt(document.getElementById('duckVideoAmount').value) || 1;

    if (!path) {
        alert('請選擇影片檔案');
        return;
    }

    const video = { path, weight };
    if (type === 'caught') {
        video.amount = amount;
    }

    const cfg = config.duck_catch_config || {};
    const listKey = type === 'caught' ? 'caught_videos' : 'missed_videos';
    if (!cfg[listKey]) cfg[listKey] = [];

    if (editIndex >= 0) {
        cfg[listKey][editIndex] = video;
    } else {
        cfg[listKey].push(video);
    }

    config.duck_catch_config = cfg;
    closeDialog('duckVideoDialog');

    if (type === 'caught') {
        renderDuckCaughtVideoList();
    } else {
        renderDuckMissedVideoList();
    }
}

// 編輯鴨子影片
function editDuckVideo(type, index) {
    const cfg = config.duck_catch_config || {};
    const listKey = type === 'caught' ? 'caught_videos' : 'missed_videos';
    const video = cfg[listKey]?.[index];
    if (!video) return;

    document.getElementById('duckVideoType').value = type;
    document.getElementById('duckVideoEditIndex').value = index;
    document.getElementById('duckVideoPath').value = video.path;
    document.getElementById('duckVideoWeight').value = video.weight || 1;
    document.getElementById('duckVideoAmount').value = video.amount || 1;

    document.getElementById('duckVideoAmountGroup').style.display = type === 'caught' ? 'block' : 'none';
    document.getElementById('duckVideoDialogTitle').textContent = type === 'caught' ? '編輯抓到影片' : '編輯沒抓到影片';

    openDialog('duckVideoDialog');
}

// 刪除鴨子影片
function deleteDuckVideo(type, index) {
    if (!confirm('確定要刪除這個影片嗎？')) return;

    const cfg = config.duck_catch_config || {};
    const listKey = type === 'caught' ? 'caught_videos' : 'missed_videos';
    if (cfg[listKey]) {
        cfg[listKey].splice(index, 1);
    }
    config.duck_catch_config = cfg;

    if (type === 'caught') {
        renderDuckCaughtVideoList();
    } else {
        renderDuckMissedVideoList();
    }
}

// 批量添加鴨子影片
async function batchAddDuckVideos(type) {
    try {
        const filePaths = await pywebview.api.select_files('video');
        if (!filePaths || filePaths.length === 0) return;

        const cfg = config.duck_catch_config || {};
        const listKey = type === 'caught' ? 'caught_videos' : 'missed_videos';
        if (!cfg[listKey]) cfg[listKey] = [];

        // 為每個檔案創建預設設定
        for (const path of filePaths) {
            const video = { path, weight: 1 };
            if (type === 'caught') {
                video.amount = 1;  // 預設增加 1 隻
            }
            cfg[listKey].push(video);
        }

        config.duck_catch_config = cfg;
        addLogLocal(`🦆 批量添加了 ${filePaths.length} 個${type === 'caught' ? '抓到' : '沒抓到'}影片`);

        if (type === 'caught') {
            renderDuckCaughtVideoList();
        } else {
            renderDuckMissedVideoList();
        }
    } catch (e) {
        console.error('批量添加影片失敗:', e);
    }
}

// 從檔名解析鴨子數量
function parseDuckAmountFromFilename(filename) {
    // 匹配數字，例如 "抓1只", "抓100只", "抓到10000只"
    const match = filename.match(/(\d+)\s*只/);
    if (match) {
        return parseInt(match[1]);
    }
    // 備用：嘗試匹配任何數字
    const numMatch = filename.match(/(\d+)/);
    if (numMatch) {
        return parseInt(numMatch[1]);
    }
    return 1; // 預設1隻
}

// 根據鴨子數量計算權重
function calculateDuckWeight(amount) {
    if (amount >= 10000) return 0.05;      // 0.05% 傳說級
    if (amount >= 6666) return 0.1;        // 超稀有
    if (amount >= 3888) return 0.15;       // 超稀有
    if (amount >= 1888) return 0.2;        // 超稀有
    if (amount >= 1000) return 0.3;        // 極稀有
    if (amount >= 666) return 0.5;         // 很稀有
    if (amount >= 500) return 1;           // 稀有
    if (amount >= 200) return 2;           // 較稀有
    if (amount >= 100) return 3;           // 少見
    if (amount >= 66) return 5;            // 中等偏少
    if (amount >= 40) return 8;            // 中等
    if (amount >= 11) return 15;           // 較常見
    if (amount >= 5) return 25;            // 常見
    return 40;                              // 1-4隻 最常見
}

// 智能匯入鴨子影片（從資料夾自動解析）
async function smartImportDuckVideos(type) {
    try {
        const folderPath = await pywebview.api.select_folder();
        if (!folderPath) return;

        const result = await pywebview.api.get_folder_videos(folderPath);
        if (!result.success || !result.videos || result.videos.length === 0) {
            alert('資料夾內沒有影片檔案');
            return;
        }

        const cfg = config.duck_catch_config || {};
        const listKey = type === 'caught' ? 'caught_videos' : 'missed_videos';
        if (!cfg[listKey]) cfg[listKey] = [];

        let imported = 0;
        const results = [];

        for (const videoInfo of result.videos) {
            const filename = videoInfo.name;
            const videoPath = videoInfo.path;
            const amount = parseDuckAmountFromFilename(filename);
            // 抓到影片根據數量計算權重，沒抓到影片統一權重 1
            const weight = type === 'caught' ? calculateDuckWeight(amount) : 1;

            const video = { path: videoPath, weight };
            if (type === 'caught') {
                video.amount = amount;
            }

            cfg[listKey].push(video);
            imported++;
            results.push({ filename, amount, weight });
        }

        config.duck_catch_config = cfg;

        addLogLocal(`🦆 智能匯入了 ${imported} 個${type === 'caught' ? '抓到' : '沒抓到'}影片`);

        if (type === 'caught') {
            renderDuckCaughtVideoList();
        } else {
            renderDuckMissedVideoList();
        }

        // 顯示匯入摘要
        const summary = results.map(r => `${r.filename}: ${r.amount}隻, 權重${r.weight}`).join('\n');
        alert(`成功匯入 ${imported} 個影片！\n\n${summary.substring(0, 500)}${summary.length > 500 ? '\n...' : ''}`);

    } catch (e) {
        console.error('智能匯入失敗:', e);
        alert('匯入失敗: ' + e.message);
    }
}

// 渲染抓到影片列表
function renderDuckCaughtVideoList() {
    const container = document.getElementById('duckCaughtVideoList');
    const cfg = config.duck_catch_config || {};
    const videos = cfg.caught_videos || [];

    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無設定</div>';
        return;
    }

    container.innerHTML = videos.map((video, index) => {
        const fileName = video.path.split(/[/\\]/).pop();
        return `
            <div class="list-item" onclick="editDuckVideo('caught', ${index})">
                <div class="list-item-content">
                    <span class="list-item-icon">🎬</span>
                    <span class="list-item-text" title="${video.path}">${fileName}</span>
                </div>
                <div class="list-item-info">
                    <span class="badge">+${video.amount || 1}隻</span>
                    <span class="badge">權重 ${video.weight || 1}</span>
                </div>
                <button class="btn-icon btn-delete" onclick="event.stopPropagation(); deleteDuckVideo('caught', ${index})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

// 渲染沒抓到影片列表
function renderDuckMissedVideoList() {
    const container = document.getElementById('duckMissedVideoList');
    const cfg = config.duck_catch_config || {};
    const videos = cfg.missed_videos || [];

    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無設定</div>';
        return;
    }

    container.innerHTML = videos.map((video, index) => {
        const fileName = video.path.split(/[/\\]/).pop();
        return `
            <div class="list-item" onclick="editDuckVideo('missed', ${index})">
                <div class="list-item-content">
                    <span class="list-item-icon">🎬</span>
                    <span class="list-item-text" title="${video.path}">${fileName}</span>
                </div>
                <div class="list-item-info">
                    <span class="badge">權重 ${video.weight || 1}</span>
                </div>
                <button class="btn-icon btn-delete" onclick="event.stopPropagation(); deleteDuckVideo('missed', ${index})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

// 選擇嘎嘎音效
async function selectDuckQuackSound() {
    try {
        const filePath = await pywebview.api.select_file('audio');
        if (filePath) {
            document.getElementById('duckQuackSound').value = filePath;
        }
    } catch (e) {
        console.error('選擇音效失敗:', e);
    }
}

// 清除嘎嘎音效
function clearDuckQuackSound() {
    document.getElementById('duckQuackSound').value = '';
}

// 播放嘎嘎音效
let quackAudio = null;
async function playQuackSound() {
    const quackPath = config.duck_catch_config?.quack_sound;
    if (!quackPath) return;

    try {
        // 取得媒體 URL
        const mediaUrl = await pywebview.api.get_media_url(quackPath);
        if (!mediaUrl) return;

        // 停止之前的音效
        if (quackAudio) {
            quackAudio.pause();
            quackAudio = null;
        }

        // 播放新音效
        quackAudio = new Audio(mediaUrl);
        quackAudio.volume = (config.duck_catch_config?.video_volume || 100) / 100;
        quackAudio.play().catch(e => console.error('播放嘎嘎音效失敗:', e));
    } catch (e) {
        console.error('播放嘎嘎音效失敗:', e);
    }
}

// 儲存抓鴨子設定
async function saveDuckCatchConfig() {
    const existingCfg = config.duck_catch_config || {};
    const cfg = {
        trigger_type: document.getElementById('duckTriggerType').value,
        trigger_gift: document.getElementById('duckTriggerGift').value.trim(),
        trigger_keyword: document.getElementById('duckTriggerKeyword').value.trim(),
        catch_rate: parseInt(document.getElementById('duckCatchRate').value) || 50,
        video_seconds: parseFloat(document.getElementById('duckVideoSeconds').value) || 0,
        video_speed: parseFloat(document.getElementById('duckVideoSpeed').value) || 1,
        video_volume: parseInt(document.getElementById('duckVideoVolume').value) || 100,
        video_priority: 1,
        force_interrupt: document.getElementById('duckForceInterrupt').checked,
        quack_sound: document.getElementById('duckQuackSound').value || '',
        caught_videos: existingCfg.caught_videos || [],
        missed_videos: existingCfg.missed_videos || [],
        // 保底設定
        pity_enabled: document.getElementById('duckPityEnabled').checked,
        pity_threshold: parseInt(document.getElementById('duckPityThreshold').value) || 1000,
        pity_min_amount: parseInt(document.getElementById('duckPityMinAmount').value) || 5000,
        pity_threshold_jackpot: parseInt(document.getElementById('duckPityThresholdJackpot').value) || 2000,
        pity_jackpot_amount: parseInt(document.getElementById('duckPityJackpotAmount').value) || 10000,
        // 軟保底
        soft_pity_enabled: document.getElementById('duckSoftPityEnabled').checked,
        soft_pity_start: parseInt(document.getElementById('duckSoftPityStart').value) || 70,
        // 連擊
        combo_enabled: document.getElementById('duckComboEnabled').checked,
        combo_window: parseInt(document.getElementById('duckComboWindow').value) || 30,
        combo_multipliers: document.getElementById('duckComboMultipliers').value
            .split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0)
    };

    // 驗證
    if (cfg.trigger_type === 'gift' && !cfg.trigger_gift) {
        alert('請輸入觸發禮物名稱');
        return;
    }
    if (cfg.trigger_type === 'chat' && !cfg.trigger_keyword) {
        alert('請輸入彈幕關鍵字');
        return;
    }
    if (cfg.caught_videos.length === 0) {
        alert('請至少新增一個抓到影片');
        return;
    }
    if (cfg.missed_videos.length === 0) {
        alert('請至少新增一個沒抓到影片');
        return;
    }

    config.duck_catch_config = cfg;

    // 里程碑煙火影片
    const milestoneVideo = document.getElementById('milestoneFireworkVideo').value || '';
    config.milestone_firework_video = milestoneVideo;

    // 世界冠軍送禮特效影片
    const worldChampionGiftVideo = document.getElementById('worldChampionGiftVideo').value || '';
    config.world_champion_gift_video = worldChampionGiftVideo;

    // 鴨子查詢設定
    const duckQueryKeyword = document.getElementById('duckQueryKeyword').value.trim() || '查看';
    config.duck_query_keyword = duckQueryKeyword;
    const duckQueryConfig = {
        keyword: duckQueryKeyword,
        duration: parseInt(document.getElementById('duckQueryDuration').value) || 5,
        size: document.getElementById('duckQuerySize').value || 'medium',
        position: document.getElementById('duckQueryPosition').value || 'center',
        borderColor: document.getElementById('duckQueryBorderColor').value || '#ffd700',
        textColor: document.getElementById('duckQueryTextColor').value || '#ffffff',
        numberColor: document.getElementById('duckQueryNumberColor').value || '#ffd700',
        bgColor: document.getElementById('duckQueryBgColor').value || '#000000',
        fontSize: parseInt(document.getElementById('duckQueryFontSize').value) || 48
    };
    config.duck_query_config = duckQueryConfig;

    await pywebview.api.update_config({
        duck_catch_config: cfg,
        milestone_firework_video: milestoneVideo,
        world_champion_gift_video: worldChampionGiftVideo,
        duck_query_keyword: duckQueryKeyword,
        duck_query_config: duckQueryConfig
    });
    addLogLocal('🦆 已儲存抓鴨子設定');
}

// 測試抓鴨子（隨機根據機率決定）
async function testDuckCatchRandom() {
    try {
        const cfg = config.duck_catch_config || {};
        const catchRate = cfg.catch_rate || 50;
        // 根據機率隨機決定抓到或沒抓到
        const caught = Math.random() * 100 < catchRate;

        await openGreenScreen();
        setTimeout(async () => {
            const result = await pywebview.api.test_duck_catch(caught, 0);
            if (result.success) {
                document.getElementById('duckCountDisplay').textContent = result.totalDucks;
                addLogLocal(`🦆 測試: ${result.caught ? `抓到 ${result.duckAmount} 隻！` : '沒抓到'}`);
            } else {
                addLogLocal(`❌ 測試失敗: ${result.error}`);
            }
        }, 500);
    } catch (e) {
        console.error('測試失敗:', e);
        addLogLocal('❌ 測試失敗');
    }
}

// 選擇里程碑煙火影片
async function selectMilestoneVideo() {
    try {
        const result = await pywebview.api.select_file('video');
        if (result) {
            document.getElementById('milestoneFireworkVideo').value = result;
            addLogLocal('🎆 已選擇里程碑煙火影片');
        }
    } catch (e) {
        console.error('選擇影片失敗:', e);
    }
}

// 測試里程碑慶祝效果
async function testMilestoneCelebration() {
    const videoPath = document.getElementById('milestoneFireworkVideo').value;
    if (!videoPath) {
        alert('請先選擇煙火影片');
        return;
    }

    await openGreenScreen();
    setTimeout(async () => {
        try {
            await pywebview.api.trigger_green_screen('triggerMilestone', {
                type: 'total',
                nickname: '測試用戶',
                avatar: '',
                amount: 10000,
                videoPath: videoPath
            });
            addLogLocal('🎇 測試里程碑慶祝效果');
        } catch (e) {
            console.error('測試失敗:', e);
            addLogLocal('❌ 測試里程碑失敗');
        }
    }, 500);
}

// 選擇世界冠軍送禮特效影片
async function selectWorldChampionGiftVideo() {
    try {
        const result = await pywebview.api.select_file('video');
        if (result) {
            document.getElementById('worldChampionGiftVideo').value = result;
            addLogLocal('👑 已選擇世界冠軍送禮特效影片');
        }
    } catch (e) {
        console.error('選擇影片失敗:', e);
    }
}

// 測試世界冠軍送禮特效
async function testWorldChampionGiftEffect() {
    const videoPath = document.getElementById('worldChampionGiftVideo').value;
    if (!videoPath) {
        alert('請先選擇世界冠軍送禮特效影片');
        return;
    }

    await openGreenScreen();
    setTimeout(async () => {
        try {
            await pywebview.api.trigger_green_screen('worldChampionEntry', {
                nickname: '世界第一測試',
                totalDucks: 99999,
                videoPath: videoPath
            });
            addLogLocal('👑 測試世界冠軍送禮特效');
        } catch (e) {
            console.error('測試失敗:', e);
            addLogLocal('❌ 測試世界冠軍特效失敗');
        }
    }, 500);
}

// 測試鴨子查詢顯示
function testDuckQuery() {
    pywebview.api.simulate_chat('測試玩家', config.duck_query_keyword || '查看');
    addLogLocal('🔍 已發送測試查詢');
}

// 調整鴨子數量
async function adjustDuckCount(amount) {
    try {
        let newCount;
        if (amount > 0) {
            newCount = await pywebview.api.add_duck(amount);
        } else {
            newCount = await pywebview.api.remove_duck(Math.abs(amount));
            // 減少鴨子時播放嘎嘎音效
            playQuackSound();
        }
        document.getElementById('duckCountDisplay').textContent = newCount;
    } catch (e) {
        console.error('調整鴨子數量失敗:', e);
    }
}

// 重置鴨子數量
async function resetDuckCount() {
    if (confirm('確定要將鴨子數量歸零嗎？')) {
        try {
            await pywebview.api.set_duck_count(0);
            document.getElementById('duckCountDisplay').textContent = 0;
            addLogLocal('🦆 鴨子數量已歸零');
        } catch (e) {
            console.error('重置失敗:', e);
        }
    }
}

// 開啟補鴨子對話框
function openAddDuckDialog() {
    document.getElementById('addDuckUniqueId').value = '';
    document.getElementById('addDuckAmount').value = 1;
    openDialog('addDuckDialog');
}

// 設定補鴨子數量快捷按鈕
function setAddDuckAmount(amount) {
    document.getElementById('addDuckAmount').value = amount;
}

// 確認補鴨子（單純加數量）
async function confirmAddDuck() {
    const uniqueId = document.getElementById('addDuckUniqueId').value.trim();
    const amount = parseInt(document.getElementById('addDuckAmount').value) || 1;

    if (amount <= 0) {
        alert('請輸入有效的數量');
        return;
    }

    try {
        const result = await pywebview.api.add_duck_for_user(uniqueId, amount);
        if (result.success) {
            document.getElementById('duckCountDisplay').textContent = result.totalDucks;
            closeDialog('addDuckDialog');
        } else {
            alert('補鴨子失敗: ' + (result.error || '未知錯誤'));
        }
    } catch (e) {
        console.error('補鴨子失敗:', e);
        alert('補鴨子失敗: ' + e.message);
    }
}

// 開啟模擬抓鴨子對話框
function openSimulateDuckDialog() {
    document.getElementById('simulateDuckUniqueId').value = '';
    document.getElementById('simulateDuckTimes').value = 1;
    openDialog('simulateDuckDialog');
}

// 設定模擬次數快捷按鈕
function setSimulateDuckTimes(times) {
    document.getElementById('simulateDuckTimes').value = times;
}

// 確認模擬抓鴨子
async function confirmSimulateDuck() {
    const uniqueId = document.getElementById('simulateDuckUniqueId').value.trim();
    const times = parseInt(document.getElementById('simulateDuckTimes').value) || 1;

    if (!uniqueId) {
        alert('請輸入用戶 ID');
        return;
    }

    if (times <= 0) {
        alert('請輸入有效的次數');
        return;
    }

    closeDialog('simulateDuckDialog');

    try {
        // 先開啟綠幕
        await openGreenScreen();

        // 延遲一下再觸發，確保綠幕已開啟
        setTimeout(async () => {
            const result = await pywebview.api.simulate_duck_catch(uniqueId, times);
            if (result.success) {
                addLogLocal(`🎲 模擬抓鴨子: ${uniqueId} 已排入 ${result.queued} 次（隊列總數: ${result.totalInQueue}）`);
            } else {
                addLogLocal(`❌ 模擬失敗: ${result.error}`);
            }
        }, 500);
    } catch (e) {
        console.error('模擬抓鴨子失敗:', e);
        alert('模擬抓鴨子失敗: ' + e.message);
    }
}

// 顯示保底進度輸入框
function showPityInput() {
    const display = document.getElementById('pityProgress');
    const input = document.getElementById('pityInput');
    if (display && input) {
        // 從顯示文字解析當前值 "123 / 1000"
        const match = display.textContent.match(/(\d+)/);
        input.value = match ? parseInt(match[1]) : 0;
        display.classList.add('hidden');
        input.classList.remove('hidden');
        input.focus();
        input.select();
    }
}

// 保存保底進度輸入
async function savePityInput() {
    const display = document.getElementById('pityProgress');
    const input = document.getElementById('pityInput');
    if (display && input) {
        const newValue = Math.max(0, parseInt(input.value) || 0);
        try {
            await pywebview.api.set_pity_counter(newValue);
            // 取得閾值來更新顯示
            const pityData = await pywebview.api.get_pity_counter();
            display.textContent = `${newValue} / ${pityData.threshold}`;
            addLogLocal(`🎯 保底進度已設為 ${newValue}`);
        } catch (e) {
            console.error('設定保底進度失敗:', e);
        }
        input.classList.add('hidden');
        display.classList.remove('hidden');
    }
}

// 處理抓到鴨子事件（從後端觸發）
function handleDuckCaught(data) {
    pendingDuckCatch = data;
    document.getElementById('duckCatchUsername').value = data.username;
    document.getElementById('duckCatchVideoPath').value = data.videoPath;
    document.getElementById('duckCatchUser').textContent = data.username;
    // 使用影片設定的預設數量
    document.getElementById('duckAmountInput').value = data.defaultAmount || 1;
    openDialog('duckAmountDialog');
}

// 設定快速數量
function setDuckAmount(amount) {
    document.getElementById('duckAmountInput').value = amount;
}

// 確認抓到鴨子
async function confirmDuckCatch() {
    if (!pendingDuckCatch) return;

    const amount = parseInt(document.getElementById('duckAmountInput').value) || 1;
    try {
        const result = await pywebview.api.confirm_duck_catch(
            pendingDuckCatch.username,
            pendingDuckCatch.videoPath,
            amount,
            pendingDuckCatch.config
        );
        if (result.success) {
            document.getElementById('duckCountDisplay').textContent = result.totalDucks;
        }
    } catch (e) {
        console.error('確認抓鴨子失敗:', e);
    }
    pendingDuckCatch = null;
    closeDialog('duckAmountDialog');
}

// 取消抓鴨子
function cancelDuckCatch() {
    pendingDuckCatch = null;
    closeDialog('duckAmountDialog');
}

// 初始化抓鴨子事件監聯
function initDuckCatchEvents() {
    if (window.electronAPI) {
        window.electronAPI.onDuckCaught(handleDuckCaught);
        window.electronAPI.onDuckCountUpdated((count) => {
            document.getElementById('duckCountDisplay').textContent = count;
        });
        // 監聽快捷鍵減少鴨子的嘎嘎音效
        window.electronAPI.onPlayQuackSound(() => {
            playQuackSound();
        });
        // 監聽保底計數器更新
        window.electronAPI.onPityCounterUpdated((data) => {
            updatePityProgress(data.current, data.threshold, data.thresholdJackpot);
        });
    }

    // 載入初始鴨子數量
    pywebview.api.get_duck_count().then(count => {
        document.getElementById('duckCountDisplay').textContent = count;
    }).catch(e => console.error('載入鴨子數量失敗:', e));

    // 載入初始保底計數
    pywebview.api.get_pity_counter().then(data => {
        if (data) {
            updatePityProgress(data.current, data.threshold, data.thresholdJackpot);
        }
    }).catch(e => console.error('載入保底計數失敗:', e));

    // 載入排行榜
    pywebview.api.get_leaderboard().then(data => {
        if (data) {
            renderLeaderboard(data);
        }
    }).catch(e => console.error('載入排行榜失敗:', e));

    // 監聽排行榜更新
    if (window.electronAPI && window.electronAPI.onLeaderboardUpdated) {
        window.electronAPI.onLeaderboardUpdated((data) => {
            renderLeaderboard(data);
            // 同時更新總體資料庫快取
            if (data.allTimeStats) {
                cachedAlltimeStats = data.allTimeStats;
                // 如果總體資料庫頁籤可見，也更新顯示
                const alltimeTab = document.getElementById('leaderboardAlltime');
                if (alltimeTab && !alltimeTab.classList.contains('hidden')) {
                    filterAlltimeStats();  // 使用 filter 來重新渲染（會套用搜尋條件）
                }
            }
        });
    }

    // 監聽 F8 快捷鍵開啟模擬送禮
    if (window.electronAPI && window.electronAPI.onOpenQuickSimulate) {
        window.electronAPI.onOpenQuickSimulate(() => {
            showSimulateDialog();
        });
    }

    // 監聽 F6 快捷鍵開啟快捷補禮物
    if (window.electronAPI && window.electronAPI.onOpenQuickAdd) {
        window.electronAPI.onOpenQuickAdd(() => {
            showQuickAddDialog();
        });
    }
}

// === 快捷補鴨子 (F6) ===
function showQuickAddDialog() {
    openDialog('quickAddDialog');
    // 聚焦到數量輸入框
    setTimeout(() => {
        document.getElementById('quickAddCount')?.focus();
        document.getElementById('quickAddCount')?.select();
    }, 100);
}

async function doQuickAdd() {
    const userId = document.getElementById('quickAddUserId').value.trim() || '快捷補鴨子';
    const count = parseInt(document.getElementById('quickAddCount').value) || 1;

    try {
        await pywebview.api.quick_add_gift('duck', userId, count);
        addLogLocal(`🦆 [F6] 補鴨子 x${count} (${userId})`);
    } catch (e) {
        console.error('快捷補鴨子失敗:', e);
    }

    closeDialog('quickAddDialog');
}

// 更新保底顯示
function updatePityDisplay() {
    const enabled = document.getElementById('duckPityEnabled')?.checked;
    const display = document.getElementById('pityDisplay');
    if (display) {
        display.style.display = enabled ? 'flex' : 'none';
    }
}

// 更新保底進度
function updatePityProgress(current, threshold, thresholdJackpot) {
    const progress = document.getElementById('pityProgress');
    const stage = document.getElementById('pityStage');
    const t1 = threshold || parseInt(document.getElementById('duckPityThreshold').value) || 1000;
    const t2 = thresholdJackpot || parseInt(document.getElementById('duckPityThresholdJackpot').value) || 2000;

    if (progress) {
        // 決定顯示哪一層
        if (current >= t1) {
            // 已過第一層，顯示終極保底進度
            progress.textContent = `${current} / ${t2}`;
            progress.style.color = '#f59e0b';
            if (stage) stage.textContent = '🔥 衝刺終極保底中！';
        } else {
            progress.textContent = `${current} / ${t1}`;
            // 接近保底時變色
            if (current >= t1 * 0.9) {
                progress.style.color = '#ef4444';
                if (stage) stage.textContent = '即將觸發第一層保底！';
            } else if (current >= t1 * 0.7) {
                progress.style.color = '#f59e0b';
                if (stage) stage.textContent = '';
            } else {
                progress.style.color = '#4ade80';
                if (stage) stage.textContent = '';
            }
        }
    }
}

// 重置保底計數器
async function resetPityCounter() {
    if (confirm('確定要重置保底計數器嗎？')) {
        await pywebview.api.reset_pity_counter();
        updatePityProgress(0);
        addLogLocal('🎯 已重置保底計數器');
    }
}

// 保底開關變更時更新顯示
document.getElementById('duckPityEnabled')?.addEventListener('change', updatePityDisplay);

// ========== 排行榜功能 ==========
let currentLeaderboardTab = 'total';

// 切換排行榜標籤
function switchLeaderboardTab(tab) {
    currentLeaderboardTab = tab;

    // 更新標籤樣式
    document.querySelectorAll('.leaderboard-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    // 切換內容
    document.getElementById('leaderboardTotal').classList.toggle('hidden', tab !== 'total');
    document.getElementById('leaderboardSingle').classList.toggle('hidden', tab !== 'single');
    document.getElementById('leaderboardAlltime')?.classList.toggle('hidden', tab !== 'alltime');
    document.getElementById('leaderboardWorld')?.classList.toggle('hidden', tab !== 'world');

    // 如果切換到總體資料庫，刷新資料
    if (tab === 'alltime') {
        refreshAlltimeStats();
    }
    // 如果切換到世界榜，刷新資料
    if (tab === 'world') {
        refreshWorldLeaderboard();
    }
}

// 刷新排行榜
async function refreshLeaderboard() {
    try {
        const data = await pywebview.api.get_leaderboard();
        renderLeaderboard(data);
    } catch (e) {
        console.error('刷新排行榜失敗:', e);
    }
}

// 清除排行榜
async function clearLeaderboard() {
    if (confirm('確定要清除排行榜嗎？此操作無法復原！')) {
        try {
            await pywebview.api.clear_leaderboard();
            renderLeaderboard({ totalRanking: [], singleHighest: [] });
            addLogLocal('🏆 已清除排行榜');
        } catch (e) {
            console.error('清除排行榜失敗:', e);
        }
    }
}

// 手動備份
async function triggerManualBackup() {
    try {
        await pywebview.api.trigger_backup();
        addLogLocal('💾 手動備份已完成');
    } catch (e) {
        console.error('備份失敗:', e);
    }
}

// 匯出排行榜
async function exportLeaderboard() {
    try {
        const result = await pywebview.api.export_leaderboard();
        if (result.success) {
            addLogLocal(`📤 排行榜已匯出到: ${result.path}`);
        }
    } catch (e) {
        console.error('匯出失敗:', e);
    }
}

// 匯入排行榜
async function importLeaderboard() {
    const mode = confirm('按「確定」覆蓋現有資料，按「取消」合併資料') ? 'overwrite' : 'merge';
    if (mode === 'overwrite' && !confirm('覆蓋將取代所有現有排行榜資料，確定繼續？')) return;

    try {
        const result = await pywebview.api.import_leaderboard(mode);
        if (result.success) {
            await refreshLeaderboard();
            addLogLocal(`📥 排行榜已匯入 (${mode === 'overwrite' ? '覆蓋' : '合併'})`);
        } else if (result.error) {
            alert(`匯入失敗: ${result.error}`);
        }
    } catch (e) {
        console.error('匯入失敗:', e);
    }
}

// 儲存綠幕排行榜顯示設定
async function saveLeaderboardDisplayConfig() {
    await pywebview.api.update_config({
        greenscreen_leaderboard_count: parseInt(document.getElementById('gsLeaderboardCount').value) || 5,
        greenscreen_leaderboard_rotate: document.getElementById('gsLeaderboardRotate').checked,
        greenscreen_leaderboard_rotate_interval: parseInt(document.getElementById('gsLeaderboardRotateInterval').value) || 5
    });
}

// 渲染排行榜
function renderLeaderboard(data) {
    // 渲染累計排行
    const totalList = document.getElementById('totalRankingList');
    if (totalList) {
        if (data.totalRanking && data.totalRanking.length > 0) {
            totalList.innerHTML = data.totalRanking.slice(0, 20).map((item, index) => `
                <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                    <div class="leaderboard-rank">${index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</div>
                    ${item.avatar
                        ? `<img class="leaderboard-avatar" src="${item.avatar}" onerror="this.outerHTML='<div class=\\'leaderboard-avatar placeholder\\'>🦆</div>'">`
                        : '<div class="leaderboard-avatar placeholder">🦆</div>'
                    }
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${escapeHtml(item.nickname || item.uniqueId)}</div>
                    </div>
                    <div class="leaderboard-score">${item.totalDucks.toLocaleString()} <span class="duck-icon">🦆</span></div>
                </div>
            `).join('');
        } else {
            totalList.innerHTML = '<div class="empty-state">暫無資料</div>';
        }
    }

    // 渲染單次最高
    const singleList = document.getElementById('singleHighestList');
    if (singleList) {
        if (data.singleHighest && data.singleHighest.length > 0) {
            singleList.innerHTML = data.singleHighest.slice(0, 20).map((item, index) => `
                <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                    <div class="leaderboard-rank">${index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</div>
                    ${item.avatar
                        ? `<img class="leaderboard-avatar" src="${item.avatar}" onerror="this.outerHTML='<div class=\\'leaderboard-avatar placeholder\\'>🦆</div>'">`
                        : '<div class="leaderboard-avatar placeholder">🦆</div>'
                    }
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${escapeHtml(item.nickname || item.uniqueId)}</div>
                        <div class="leaderboard-date">${item.date || ''}</div>
                    </div>
                    <div class="leaderboard-score">${item.amount.toLocaleString()} <span class="duck-icon">🦆</span></div>
                </div>
            `).join('');
        } else {
            singleList.innerHTML = '<div class="empty-state">暫無資料</div>';
        }
    }
}

// HTML 轉義
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// ============ 世界榜 ============
// 更新 Firebase 連接指示燈
function updateFirebaseIndicator(status) {
    const indicator = document.getElementById('firebaseIndicator');
    if (!indicator) return;

    indicator.classList.remove('offline', 'online', 'connecting');
    if (status === 'online') {
        indicator.classList.add('online');
        indicator.title = 'Firebase 已連接';
    } else if (status === 'connecting') {
        indicator.classList.add('connecting');
        indicator.title = 'Firebase 連接中...';
    } else {
        indicator.classList.add('offline');
        indicator.title = 'Firebase 未連接';
    }
}

// 檢查 Firebase 連接狀態（啟動時呼叫）
async function checkFirebaseConnection() {
    updateFirebaseIndicator('connecting');
    try {
        await pywebview.api.get_world_champion();
        updateFirebaseIndicator('online');
    } catch (error) {
        console.warn('Firebase 連接檢查失敗:', error);
        updateFirebaseIndicator('offline');
    }
}

// 刷新世界榜
async function refreshWorldLeaderboard() {
    updateFirebaseIndicator('connecting');
    try {
        // 先同步世界冠軍（確保刪除後第二名補上）
        await pywebview.api.sync_world_champion();

        const [leaderboard, champion] = await Promise.all([
            pywebview.api.get_world_leaderboard(),
            pywebview.api.get_world_champion()
        ]);
        renderWorldLeaderboard(leaderboard, champion);
        updateFirebaseIndicator('online');

        // 同時更新綠幕的世界榜顯示
        try {
            await pywebview.api.refresh_greenscreen_world();
        } catch (e) {
            console.log('綠幕更新跳過:', e);
        }
    } catch (error) {
        console.error('刷新世界榜失敗:', error);
        updateFirebaseIndicator('offline');
        // 可能是 Firebase 未配置
        const list = document.getElementById('worldLeaderboardList');
        if (list) {
            list.innerHTML = '<div class="empty-state">世界榜未啟用（需配置 Firebase）</div>';
        }
    }
}

// 渲染世界榜
function renderWorldLeaderboard(leaderboard, champion) {
    // 更新冠軍橫幅
    const championName = document.getElementById('worldChampionName');
    const championDucks = document.getElementById('worldChampionDucks');
    if (championName && championDucks) {
        if (champion) {
            championName.textContent = champion.nickname || '未知';
            championDucks.textContent = `${(champion.totalDucks || 0).toLocaleString()} 🦆`;
        } else {
            championName.textContent = '虛位以待';
            championDucks.textContent = '成為第一個世界冠軍！';
        }
    }

    // 渲染排行榜
    const list = document.getElementById('worldLeaderboardList');
    if (list) {
        if (leaderboard && leaderboard.length > 0) {
            list.innerHTML = leaderboard.slice(0, 100).map((user, index) => `
                <div class="leaderboard-item ${index === 0 ? 'top-1' : index < 3 ? 'top-' + (index + 1) : ''}">
                    <div class="leaderboard-rank">${index === 0 ? '👑' : index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</div>
                    ${user.avatar
                        ? `<img class="leaderboard-avatar" src="${user.avatar}" onerror="this.outerHTML='<div class=\\'leaderboard-avatar placeholder\\'>🦆</div>'">`
                        : '<div class="leaderboard-avatar placeholder">🦆</div>'
                    }
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${escapeHtml(user.nickname || user.uniqueId)}</div>
                    </div>
                    <div class="leaderboard-score">${(user.totalDucks || 0).toLocaleString()} <span class="duck-icon">🦆</span></div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div class="empty-state">暫無資料</div>';
        }
    }
}

// ============ 總體資料庫管理 ============
let cachedAlltimeStats = [];

async function refreshAlltimeStats() {
    try {
        cachedAlltimeStats = await pywebview.api.get_alltime_stats() || [];
        renderAlltimeStats(cachedAlltimeStats);
    } catch (e) {
        console.error('刷新總體資料庫失敗:', e);
    }
}

function filterAlltimeStats() {
    const search = document.getElementById('alltimeSearch')?.value?.toLowerCase() || '';
    const filtered = cachedAlltimeStats.filter(item =>
        (item.nickname || '').toLowerCase().includes(search) ||
        (item.uniqueId || '').toLowerCase().includes(search)
    );
    renderAlltimeStats(filtered);
}

function renderAlltimeStats(data) {
    const list = document.getElementById('alltimeStatsList');
    if (!list) return;

    if (data && data.length > 0) {
        list.innerHTML = data.slice(0, 100).map((item, index) => {
            const avatarHtml = item.avatar
                ? '<img class="leaderboard-avatar" src="' + item.avatar + '" onerror="this.outerHTML=\'<div class=leaderboard-avatar>🦆</div>\'">'
                : '<div class="leaderboard-avatar placeholder">🦆</div>';
            return `
            <div class="leaderboard-item clickable" onclick="openEditUserDialog('${escapeHtml(item.uniqueId)}')">
                <div class="leaderboard-rank">${index + 1}</div>
                ${avatarHtml}
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${escapeHtml(item.nickname || item.uniqueId)}</div>
                    <div class="leaderboard-id" style="font-size:11px;color:var(--text-muted)">@${escapeHtml(item.uniqueId)}</div>
                </div>
                <div class="leaderboard-score">${item.totalDucks.toLocaleString()} <span class="duck-icon">🦆</span></div>
            </div>
            `;
        }).join('');
    } else {
        list.innerHTML = '<div class="empty-state">暫無資料</div>';
    }
}

function openAddUserDialog() {
    document.getElementById('userDuckDialogTitle').textContent = '新增用戶';
    document.getElementById('userDuckEditMode').value = 'add';
    document.getElementById('userDuckUniqueId').value = '';
    document.getElementById('userDuckUniqueId').disabled = false;
    document.getElementById('userDuckNickname').value = '';
    document.getElementById('userDuckAmount').value = '0';
    document.getElementById('userDuckAdjustBtns').style.display = 'none';
    document.getElementById('userDuckDeleteBtn').style.display = 'none';
    openDialog('userDuckDialog');
}

function openEditUserDialog(uniqueId) {
    const user = cachedAlltimeStats.find(u => u.uniqueId === uniqueId);
    if (!user) return;

    document.getElementById('userDuckDialogTitle').textContent = '編輯用戶';
    document.getElementById('userDuckEditMode').value = 'edit';
    document.getElementById('userDuckUniqueId').value = user.uniqueId;
    document.getElementById('userDuckUniqueId').disabled = true;
    document.getElementById('userDuckNickname').value = user.nickname || '';
    document.getElementById('userDuckAmount').value = user.totalDucks || 0;
    document.getElementById('userDuckAdjustBtns').style.display = 'flex';
    document.getElementById('userDuckDeleteBtn').style.display = 'block';
    openDialog('userDuckDialog');
}

function adjustUserDuckAmount(direction) {
    const input = document.getElementById('userDuckAmount');
    const stepInput = document.getElementById('userDuckAdjustStep');
    const step = Math.max(1, parseInt(stepInput.value) || 1);
    const current = parseInt(input.value) || 0;
    input.value = Math.max(0, current + direction * step);
}

async function saveUserDuck() {
    const uniqueId = document.getElementById('userDuckUniqueId').value.trim();
    const nickname = document.getElementById('userDuckNickname').value.trim();
    const amount = parseInt(document.getElementById('userDuckAmount').value) || 0;

    if (!uniqueId) {
        alert('請輸入用戶 ID');
        return;
    }

    try {
        const result = await pywebview.api.set_user_ducks(uniqueId, amount, nickname);
        if (result.success) {
            closeDialog('userDuckDialog');
            refreshAlltimeStats();
            addLogLocal('🦆 已更新 ' + (nickname || uniqueId) + ' 的鴨子數量: ' + amount);
        } else {
            alert(result.error || '儲存失敗');
        }
    } catch (e) {
        console.error('儲存用戶鴨子失敗:', e);
        alert('儲存失敗');
    }
}

async function deleteUserFromAlltime() {
    const uniqueId = document.getElementById('userDuckUniqueId').value;
    if (!uniqueId) return;

    if (!confirm('確定要刪除用戶 ' + uniqueId + ' 的所有鴨子記錄嗎？')) return;

    try {
        const result = await pywebview.api.delete_user_from_alltime(uniqueId);
        if (result.success) {
            closeDialog('userDuckDialog');
            refreshAlltimeStats();
            addLogLocal('🦆 已刪除用戶 ' + uniqueId);
        } else {
            alert(result.error || '刪除失敗');
        }
    } catch (e) {
        console.error('刪除用戶失敗:', e);
        alert('刪除失敗');
    }
}

// 啟用/禁用抓鴨子模組
document.getElementById('duckCatchEnabled')?.addEventListener('change', async (e) => {
    config.duck_catch_enabled = e.target.checked;
    await pywebview.api.update_config({ duck_catch_enabled: e.target.checked });
    addLogLocal(`🦆 抓鴨子模組已${e.target.checked ? '啟用' : '禁用'}`);
});

// 啟用/禁用鎖鏈對抗模組
document.getElementById('chainBattleEnabled')?.addEventListener('change', async (e) => {
    config.chain_battle_enabled = e.target.checked;
    // 同時更新設定
    const chainConfig = getChainBattleConfig();
    config.chain_battle_config = chainConfig;
    await pywebview.api.update_config({
        chain_battle_enabled: e.target.checked,
        chain_battle_config: chainConfig
    });
    addLogLocal(`⛓️ 鎖鏈對抗模組已${e.target.checked ? '啟用' : '禁用'}`);
});

// 啟用/禁用窒息挑戰模組
document.getElementById('chokingEnabled')?.addEventListener('change', async (e) => {
    config.choking_enabled = e.target.checked;
    const chokingConfig = getChokingConfig();
    config.choking_config = chokingConfig;
    await pywebview.api.update_config({
        choking_enabled: e.target.checked,
        choking_config: chokingConfig
    });
    addLogLocal(`🫁 窒息挑戰模組已${e.target.checked ? '啟用' : '禁用'}`);
});

// 基礎鎖鏈數變更時自動儲存
document.getElementById('chainBaseCount')?.addEventListener('change', async () => {
    await saveChainBattleConfig();
});

// === 對話框控制 ===
function openDialog(dialogId) {
    document.getElementById('dialogOverlay').classList.add('active');
    document.getElementById(dialogId).classList.add('active');
}

function closeDialog(dialogId) {
    if (dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.classList.remove('active');
        }
        // 如果沒有其他對話框打開，關閉遮罩
        const activeDialogs = document.querySelectorAll('.modal.active');
        if (activeDialogs.length === 0) {
            document.getElementById('dialogOverlay').classList.remove('active');
        }
    } else {
        closeAllDialogs();
    }
}

function closeAllDialogs() {
    document.getElementById('dialogOverlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(d => d.classList.remove('active'));
}

// === 音量滑桿 ===
function initVolumeSlider() {
    const volumeSlider = document.getElementById('videoVolume');
    const volumeValue = document.getElementById('volumeValue');

    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', () => {
            volumeValue.textContent = `${volumeSlider.value}%`;
        });
    }

    // 盲盒選項音量滑桿
    const giftboxVolumeSlider = document.getElementById('giftboxOptionVideoVolume');
    const giftboxVolumeValue = document.getElementById('giftboxVolumeValue');

    if (giftboxVolumeSlider && giftboxVolumeValue) {
        giftboxVolumeSlider.addEventListener('input', () => {
            giftboxVolumeValue.textContent = `${giftboxVolumeSlider.value}%`;
        });
    }
}

// === 日誌 ===
let lastLogHash = '';  // 用於比較日誌是否有變化
const MAX_DISPLAY_LOGS = 500;  // 最多顯示的日誌數量

// 初始載入日誌
async function updateLogs() {
    try {
        const logs = await pywebview.api.get_logs();
        renderLogs(logs);
    } catch (e) {}
}

// 渲染日誌（由 IPC 推送調用）
function renderLogs(logs) {
    if (!logs || !Array.isArray(logs)) return;

    // 用最後一條日誌判斷是否有變化
    const newHash = logs.length > 0 ? logs[logs.length - 1] : '';
    if (newHash === lastLogHash && logs.length > 0) return;
    lastLogHash = newHash;

    const container = document.getElementById('logContent');
    if (!container) return;

    const displayLogs = logs.slice(-MAX_DISPLAY_LOGS);
    container.innerHTML = displayLogs.map(log => {
        const logType = getLogType(log);
        const display = logFilters[logType] ? 'block' : 'none';
        return `<div class="log-item" data-log-type="${logType}" style="display:${display}">${escapeHtml(log)}</div>`;
    }).join('');

    // 使用 requestAnimationFrame 確保滾動流暢
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
}

// 日誌過濾狀態
const logFilters = {
    chat: true,
    gift: true,
    like: true,
    entry: true,
    follow: true,
    other: true
};

// 判斷日誌類型
function getLogType(message) {
    if (message.includes('💬') || message.includes('聊天')) return 'chat';
    if (message.includes('🎁') || message.includes('送出')) return 'gift';
    if (message.includes('❤️') || message.includes('點讚') || message.includes('個讚')) return 'like';
    if (message.includes('👋') || message.includes('進入') || message.includes('進場')) return 'entry';
    if (message.includes('➕') || message.includes('關注') || message.includes('追蹤')) return 'follow';
    return 'other';
}

// 應用過濾器到所有日誌
function applyLogFilters() {
    const items = document.querySelectorAll('#logContent .log-item');
    items.forEach(item => {
        const type = item.dataset.logType || item.getAttribute('data-log-type') || 'other';
        item.style.display = logFilters[type] ? 'block' : 'none';
    });
}

// 初始化日誌過濾器事件
function initLogFilters() {
    const filterMap = {
        filterChat: 'chat',
        filterGift: 'gift',
        filterLike: 'like',
        filterEntry: 'entry',
        filterFollow: 'follow',
        filterOther: 'other'
    };

    Object.entries(filterMap).forEach(([id, type]) => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                logFilters[type] = e.target.checked;
                applyLogFilters();
            });
        }
    });
}

function addLogLocal(message) {
    const container = document.getElementById('logContent');
    const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    const logType = getLogType(message);

    const item = document.createElement('div');
    item.className = 'log-item';
    item.dataset.logType = logType;
    item.textContent = `[${timestamp}] ${message}`;

    // 根據過濾器決定是否顯示
    if (!logFilters[logType]) {
        item.style.display = 'none';
    }

    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
}

// === 進場模組設定 ===
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];

function isAudioFile(path) {
    if (!path) return false;
    const ext = path.toLowerCase().substring(path.lastIndexOf('.')).toLowerCase();
    return AUDIO_EXTENSIONS.includes(ext);
}

function openEntrySettings() {
    renderEntryList();
    updateHighLevelUserCount();
    openDialog('entrySettingsDialog');
}

function renderEntryList() {
    const container = document.getElementById('entryList');
    const entryList = config.entry_list || [];

    if (entryList.length === 0) {
        container.innerHTML = '<div class="empty-state">尚未設定進場用戶，點擊「+ 新增」添加</div>';
        return;
    }

    container.innerHTML = entryList.map((entry, index) => {
        const isEnabled = entry.enabled !== false;
        const mediaType = isAudioFile(entry.media_path) ? '音效' : '影片';
        const fileName = entry.media_path ? entry.media_path.split(/[/\\]/).pop() : '未設定';
        const isFirst = index === 0;
        const isLast = index === entryList.length - 1;

        return `
            <div class="list-item">
                <div class="list-item-content">
                    <span class="priority-badge" title="優先順序 (數字越小越先播放)">${index + 1}</span>
                    <div class="priority-controls">
                        <button class="btn-priority" onclick="moveEntryUp(${index})" ${isFirst ? 'disabled' : ''} title="提高優先順序">▲</button>
                        <button class="btn-priority" onclick="moveEntryDown(${index})" ${isLast ? 'disabled' : ''} title="降低優先順序">▼</button>
                    </div>
                    <label class="trigger-switch-sm" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleEntry(${index}, this.checked)">
                        <span class="trigger-slider-sm"></span>
                    </label>
                    <span class="list-item-text" style="${isEnabled ? '' : 'opacity: 0.5;'}">
                        👤 ${entry.username || '未命名'}
                        <span style="color: var(--text-muted)"> (${mediaType} | 冷卻 ${entry.cooldown || 300}秒)</span>
                    </span>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editEntry(${index})">編輯</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEntry(${index})">刪除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 向上移動進場項目（提高優先順序）
async function moveEntryUp(index) {
    if (index <= 0) return;
    const entryList = config.entry_list || [];
    [entryList[index - 1], entryList[index]] = [entryList[index], entryList[index - 1]];
    config.entry_list = entryList;
    await pywebview.api.update_config({ entry_list: entryList });
    renderEntryList();
    addLogLocal(`🔼 已調整進場優先順序`);
}

// 向下移動進場項目（降低優先順序）
async function moveEntryDown(index) {
    const entryList = config.entry_list || [];
    if (index >= entryList.length - 1) return;
    [entryList[index], entryList[index + 1]] = [entryList[index + 1], entryList[index]];
    config.entry_list = entryList;
    await pywebview.api.update_config({ entry_list: entryList });
    renderEntryList();
    addLogLocal(`🔽 已調整進場優先順序`);
}

function showAddEntryDialog() {
    document.getElementById('entryEditIndex').value = '-1';
    document.getElementById('entryEditDialogTitle').textContent = '新增進場用戶';
    document.getElementById('entryUsername').value = '';
    document.getElementById('entryMediaPath').value = '';
    document.getElementById('entryVolume').value = 100;
    document.getElementById('entryVolumeLabel').textContent = '100%';
    document.getElementById('entryCooldown').value = 300;
    document.getElementById('entryForceInterrupt').checked = true;

    // 進場文字設定
    document.getElementById('entryShowText').checked = false;
    document.getElementById('entryText').value = '歡迎 {name} 進入直播間！';
    document.getElementById('entryTextSize').value = 48;
    document.getElementById('entryTextColor').value = '#ffffff';
    document.getElementById('entryTextDuration').value = 5;
    document.getElementById('entryTextSettings').style.display = 'none';

    updateEntryMediaHint('');
    initEntryVolumeSlider();
    openDialog('entryEditDialog');
}

function toggleEntryTextSettings() {
    const checked = document.getElementById('entryShowText').checked;
    document.getElementById('entryTextSettings').style.display = checked ? 'block' : 'none';
}

function editEntry(index) {
    const entryList = config.entry_list || [];
    const entry = entryList[index];
    if (!entry) return;

    document.getElementById('entryEditIndex').value = index;
    document.getElementById('entryEditDialogTitle').textContent = '編輯進場用戶';
    document.getElementById('entryUsername').value = entry.username || '';
    document.getElementById('entryMediaPath').value = entry.media_path || '';
    document.getElementById('entryVolume').value = entry.volume || 100;
    document.getElementById('entryVolumeLabel').textContent = `${entry.volume || 100}%`;
    document.getElementById('entryCooldown').value = entry.cooldown || 300;
    document.getElementById('entryForceInterrupt').checked = entry.force_interrupt !== false;

    // 進場文字設定
    const showText = entry.show_text || false;
    document.getElementById('entryShowText').checked = showText;
    document.getElementById('entryText').value = entry.text || '歡迎 {name} 進入直播間！';
    document.getElementById('entryTextSize').value = entry.text_size || 48;
    document.getElementById('entryTextColor').value = entry.text_color || '#ffffff';
    document.getElementById('entryTextDuration').value = entry.text_duration || 5;
    document.getElementById('entryTextSettings').style.display = showText ? 'block' : 'none';

    updateEntryMediaHint(entry.media_path || '');
    initEntryVolumeSlider();
    openDialog('entryEditDialog');
}

async function saveEntry() {
    const username = document.getElementById('entryUsername').value.trim();
    const mediaPath = document.getElementById('entryMediaPath').value;

    if (!username) {
        alert('請輸入用戶名稱');
        return;
    }
    if (!mediaPath) {
        alert('請選擇媒體檔案');
        return;
    }

    const entry = {
        username: username,
        media_path: mediaPath,
        volume: parseInt(document.getElementById('entryVolume').value) || 100,
        cooldown: parseInt(document.getElementById('entryCooldown').value) || 300,
        force_interrupt: document.getElementById('entryForceInterrupt').checked,
        enabled: true,
        // 進場文字設定
        show_text: document.getElementById('entryShowText').checked,
        text: document.getElementById('entryText').value || '歡迎 {name} 進入直播間！',
        text_size: parseInt(document.getElementById('entryTextSize').value) || 48,
        text_color: document.getElementById('entryTextColor').value || '#ffffff',
        text_duration: parseInt(document.getElementById('entryTextDuration').value) || 5
    };

    const index = parseInt(document.getElementById('entryEditIndex').value);
    if (!config.entry_list) config.entry_list = [];

    if (index >= 0) {
        // 編輯
        entry.enabled = config.entry_list[index].enabled !== false;
        config.entry_list[index] = entry;
    } else {
        // 新增
        config.entry_list.push(entry);
    }

    await pywebview.api.update_config({ entry_list: config.entry_list });

    closeDialog('entryEditDialog');
    renderEntryList();
    addLogLocal(`進場用戶 "${username}" 已${index >= 0 ? '更新' : '新增'}`);
}

async function deleteEntry(index) {
    const entryList = config.entry_list || [];
    const entry = entryList[index];
    if (!entry) return;

    if (!confirm(`確定要刪除 "${entry.username}" 的進場設定嗎？`)) return;

    config.entry_list.splice(index, 1);
    await pywebview.api.update_config({ entry_list: config.entry_list });

    renderEntryList();
    addLogLocal(`已刪除進場用戶 "${entry.username}"`);
}

async function toggleEntry(index, enabled) {
    const entryList = config.entry_list || [];
    if (!entryList[index]) return;

    entryList[index].enabled = enabled;
    await pywebview.api.update_config({ entry_list: config.entry_list });

    addLogLocal(`進場用戶 "${entryList[index].username}" ${enabled ? '已啟用' : '已停用'}`);
}

function updateEntryMediaHint(path) {
    const hint = document.getElementById('entryMediaTypeHint');
    if (!hint) return;
    if (!path) {
        hint.textContent = '支援 MP4/AVI/MOV（全屏影片）或 MP3/WAV/OGG（音效）';
        hint.style.color = '';
    } else if (isAudioFile(path)) {
        hint.textContent = '✓ 已選擇音效檔案（進場時播放音效）';
        hint.style.color = '#4ecca3';
    } else {
        hint.textContent = '✓ 已選擇影片檔案（進場時全屏播放影片）';
        hint.style.color = '#4ecca3';
    }
}

function initEntryVolumeSlider() {
    const volumeSlider = document.getElementById('entryVolume');
    const volumeLabel = document.getElementById('entryVolumeLabel');

    if (volumeSlider && volumeLabel) {
        volumeSlider.oninput = () => {
            volumeLabel.textContent = `${volumeSlider.value}%`;
        };
    }
}

async function selectEntryMedia() {
    try {
        const path = await pywebview.api.select_file('media');
        if (path) {
            document.getElementById('entryMediaPath').value = path;
            updateEntryMediaHint(path);
        }
    } catch (e) {
        console.error('選擇檔案失敗:', e);
    }
}

async function testEntryEffect() {
    const entryList = config.entry_list || [];
    if (entryList.length === 0) {
        alert('請先新增進場用戶');
        return;
    }

    // 測試第一個啟用的用戶
    const enabledEntry = entryList.find(e => e.enabled !== false);
    if (!enabledEntry) {
        alert('沒有啟用的進場用戶');
        return;
    }

    await openGreenScreen();

    setTimeout(async () => {
        try {
            await pywebview.api.trigger_green_screen('triggerEntry', {
                username: enabledEntry.username,
                path: enabledEntry.media_path,
                volume: enabledEntry.volume || 100,
                force_interrupt: enabledEntry.force_interrupt !== false,
                is_audio: isAudioFile(enabledEntry.media_path),
                // 進場文字設定
                show_text: enabledEntry.show_text || false,
                text: enabledEntry.text || '',
                text_size: enabledEntry.text_size || 48,
                text_color: enabledEntry.text_color || '#ffffff',
                text_duration: enabledEntry.text_duration || 5
            });
            addLogLocal(`測試進場效果: ${enabledEntry.username}`);
        } catch (e) {
            console.error('測試進場效果失敗:', e);
        }
    }, 800);
}

// === 鎖鏈對抗 ===

let chainAddGifts = [];  // 增加禮物列表

// 載入鎖鏈對抗設定
function loadChainBattleSettings() {
    const cfg = config.chain_battle_config || {};

    // 載入啟動禮物
    const triggerGiftInput = document.getElementById('chainTriggerGift');
    const triggerAmountInput = document.getElementById('chainTriggerAmount');
    if (triggerGiftInput) triggerGiftInput.value = cfg.trigger_gift || '';
    if (triggerAmountInput) triggerAmountInput.value = cfg.trigger_amount || 10;

    // 載入增加禮物
    chainAddGifts = cfg.add_gifts || [];
    renderChainAddGiftList();

    // 載入抓鴨子增加鎖鏈設定（預設開啟）
    const duckAddsChainInput = document.getElementById('chainDuckAddsChain');
    if (duckAddsChainInput) duckAddsChainInput.checked = cfg.duck_adds_chain !== false;

    // 載入點擊冷卻時間（預設 100ms）
    const clickCooldownInput = document.getElementById('chainClickCooldown');
    if (clickCooldownInput) clickCooldownInput.value = cfg.click_cooldown ?? 100;
}

// 渲染增加禮物列表
function renderChainAddGiftList() {
    const container = document.getElementById('chainAddGiftList');
    if (!container) return;

    if (chainAddGifts.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">尚未設定增加禮物</p>';
        return;
    }

    container.innerHTML = chainAddGifts.map((gift, index) => `
        <div class="gift-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;">
            <span style="font-size: 20px;">🎁</span>
            <div style="flex: 1;">
                <div style="font-weight: bold; color: #fff;">${gift.name}</div>
                <div style="font-size: 12px; color: ${gift.amount >= 0 ? '#9ca3af' : '#ef4444'};">每次 ${gift.amount >= 0 ? '+' : ''}${gift.amount} 鎖鏈</div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteChainAddGift(${index})">刪除</button>
        </div>
    `).join('');
}

// 新增增加禮物
function addChainAddGift() {
    const nameInput = document.getElementById('chainAddGiftName');
    const amountInput = document.getElementById('chainAddGiftAmount');

    const name = nameInput.value.trim();
    const amount = parseInt(amountInput.value) || 1;

    if (!name) {
        alert('請輸入禮物名稱');
        nameInput.focus();
        return;
    }

    chainAddGifts.push({ name, amount });
    renderChainAddGiftList();
    saveChainBattleConfig();

    // 清空輸入框
    nameInput.value = '';
    amountInput.value = '1';
    nameInput.focus();
}

// 刪除增加禮物
function deleteChainAddGift(index) {
    chainAddGifts.splice(index, 1);
    renderChainAddGiftList();
    saveChainBattleConfig();
}

// 取得鎖鏈對抗設定
function getChainBattleConfig() {
    return {
        trigger_gift: document.getElementById('chainTriggerGift')?.value.trim() || '',
        trigger_amount: parseInt(document.getElementById('chainTriggerAmount')?.value) || 10,
        add_gifts: chainAddGifts,
        duck_adds_chain: document.getElementById('chainDuckAddsChain')?.checked !== false,
        click_cooldown: parseInt(document.getElementById('chainClickCooldown')?.value) || 100
    };
}

// 儲存鎖鏈對抗設定
async function saveChainBattleConfig() {
    const cfg = getChainBattleConfig();
    config.chain_battle_config = cfg;
    await pywebview.api.update_config({ chain_battle_config: cfg });
}

// 儲存鎖鏈對抗設定並顯示通知
async function saveChainBattleConfigAndNotify() {
    try {
        await saveChainBattleConfig();
        showToast('✅ 鎖鏈對抗設定已儲存');
    } catch (e) {
        console.error('儲存失敗:', e);
        showToast('❌ 儲存失敗');
    }
}

// 鎖鏈對抗面板折疊/展開
function toggleChainBattleCollapse() {
    const panel = document.getElementById('panel-chainbattle');
    if (panel) {
        panel.classList.toggle('collapsed');
        // 記住折疊狀態到 localStorage
        const isCollapsed = panel.classList.contains('collapsed');
        localStorage.setItem('chainBattleCollapsed', isCollapsed);
    }
}

// 初始化鎖鏈對抗面板折疊狀態
function initChainBattleCollapseState() {
    const isCollapsed = localStorage.getItem('chainBattleCollapsed') === 'true';
    if (isCollapsed) {
        const panel = document.getElementById('panel-chainbattle');
        if (panel) {
            panel.classList.add('collapsed');
        }
    }

    // 快捷鍵 Ctrl+Shift+O 切換折疊
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            toggleChainBattleCollapse();
        }
    });
}

// 手動啟動鎖鏈對抗
async function startChainBattleManual() {
    try {
        await openGreenScreen();
        setTimeout(async () => {
            const cfg = getChainBattleConfig();
            const baseCount = cfg.trigger_amount || 10;
            await pywebview.api.start_chain_battle({ baseCount });
            addLogLocal('⛓️ 手動啟動鎖鏈對抗');
        }, 500);
    } catch (e) {
        console.error('啟動鎖鏈對抗失敗:', e);
    }
}

// 手動停止鎖鏈對抗
async function stopChainBattleManual() {
    try {
        await pywebview.api.stop_chain_battle();
        addLogLocal('⛓️ 手動停止鎖鏈對抗');
    } catch (e) {
        console.error('停止鎖鏈對抗失敗:', e);
    }
}

// === 高等級用戶查詢 ===
let selectedAccount = '';  // 當前選擇的帳號

async function refreshAccountList() {
    try {
        const result = await pywebview.api.get_all_accounts();
        const selector = document.getElementById('accountSelector');
        if (!selector) return;

        const currentValue = selector.value;

        selector.innerHTML = '<option value="">-- 選擇帳號 --</option>';

        if (result.accounts && result.accounts.length > 0) {
            result.accounts.forEach(acc => {
                const option = document.createElement('option');
                option.value = acc.account;
                option.textContent = `@${acc.account} (${acc.count} 人)`;
                if (acc.account === result.current) {
                    option.textContent += ' 📍';  // 標記當前連接的帳號
                }
                selector.appendChild(option);
            });
        }

        // 優先選擇：之前選的 > 當前連接的 > 第一個有記錄的
        if (currentValue && result.accounts.some(a => a.account === currentValue)) {
            selector.value = currentValue;
            selectedAccount = currentValue;
        } else if (result.current) {
            selector.value = result.current;
            selectedAccount = result.current;
        } else if (result.accounts && result.accounts.length > 0) {
            selector.value = result.accounts[0].account;
            selectedAccount = result.accounts[0].account;
        } else {
            selectedAccount = '';
        }

        // 更新用戶數量
        updateHighLevelUserCount();
    } catch (e) {
        console.error('取得帳號列表失敗:', e);
    }
}

function onAccountChange() {
    const selector = document.getElementById('accountSelector');
    selectedAccount = selector.value;
    updateHighLevelUserCount();
    // 清空搜尋結果
    document.getElementById('userSearchResults').innerHTML = '<div class="search-hint">已切換帳號，點擊「顯示全部」查看用戶</div>';
}

async function searchUsers(query = null) {
    if (query === null) {
        query = document.getElementById('userSearchInput').value.trim();
    }

    const account = selectedAccount || document.getElementById('accountSelector').value;

    if (!account) {
        document.getElementById('userSearchResults').innerHTML = '<div class="search-hint">請先選擇帳號或連接 TikTok</div>';
        return;
    }

    try {
        const result = await pywebview.api.search_high_level_users(query, account);
        renderSearchResults(result.results, result.total, result.account);
    } catch (e) {
        console.error('搜尋用戶失敗:', e);
        document.getElementById('userSearchResults').innerHTML = '<div class="search-hint">搜尋失敗，請重試</div>';
    }
}

function renderSearchResults(results, total, account) {
    const container = document.getElementById('userSearchResults');

    if (!results || results.length === 0) {
        container.innerHTML = `<div class="search-hint">@${account} 沒有找到符合的用戶</div>`;
        return;
    }

    container.innerHTML = results.map(user => {
        const nickname = user.nickname || '未知';
        const uniqueId = user.uniqueId || '';
        const userId = user.userId || '';
        const level = user.level || 0;
        const firstSeen = user.first_seen || '';

        return `
            <div class="search-result-item" onclick="copyUserId('${userId}', '${nickname}')">
                <div class="search-result-info">
                    <div class="search-result-name">
                        ${nickname}
                        ${uniqueId ? `<span style="color: var(--text-muted)">@${uniqueId}</span>` : ''}
                    </div>
                    <div class="search-result-detail">
                        userId: <span class="search-result-id">${userId || '未知'}</span>
                        ${firstSeen ? `| 首次進場: ${firstSeen}` : ''}
                    </div>
                </div>
                <span class="search-result-level">Lv${level}</span>
            </div>
        `;
    }).join('');
}

function copyUserId(userId, nickname) {
    if (!userId) {
        alert(`${nickname} 的 userId 未知`);
        return;
    }

    // 複製到剪貼簿
    if (navigator.clipboard) {
        navigator.clipboard.writeText(userId).then(() => {
            addLogLocal(`已複製 ${nickname} 的 userId: ${userId}`);
            alert(`已複製 userId: ${userId}`);
        }).catch(() => {
            prompt(`${nickname} 的 userId:`, userId);
        });
    } else {
        prompt(`${nickname} 的 userId:`, userId);
    }
}

async function updateHighLevelUserCount() {
    try {
        const account = selectedAccount || document.getElementById('accountSelector')?.value || '';
        const result = await pywebview.api.get_high_level_users_count(account);
        const countEl = document.getElementById('highLevelUserCount');
        if (countEl) {
            if (result.account) {
                countEl.textContent = `${result.count} 人`;
            } else {
                countEl.textContent = `0 人`;
            }
        }
    } catch (e) {
        console.error('取得用戶數量失敗:', e);
    }
}

async function clearHighLevelUsers() {
    const account = selectedAccount || document.getElementById('accountSelector').value;

    if (!account) {
        alert('請先選擇帳號');
        return;
    }

    if (!confirm(`確定要清空 @${account} 的所有高等級用戶記錄嗎？`)) return;

    try {
        await pywebview.api.clear_high_level_users(account);
        document.getElementById('userSearchResults').innerHTML = `<div class="search-hint">已清空 @${account} 的用戶記錄</div>`;
        updateHighLevelUserCount();
        refreshAccountList();  // 重新整理帳號列表
        addLogLocal(`已清空 @${account} 的高等級用戶記錄`);
    } catch (e) {
        console.error('清空失敗:', e);
    }
}

// ============ 窒息挑戰 ============
// chokingAnimationPath 已移除（不再需要動畫影片）
let chokingPunishmentPath = '';
let chokingSilentVideoPath = '';

function loadChokingSettings() {
    const cfg = config.choking_config || {};
    document.getElementById('chokingTriggerGift').value = cfg.trigger_gift || '';
    document.getElementById('chokingAddSeconds').value = cfg.add_seconds || 5;
    document.getElementById('chokingSilentGift').value = cfg.silent_gift || '';
    document.getElementById('chokingSilentAddSeconds').value = cfg.silent_add_seconds || 3;
    document.getElementById('chokingInitialSeconds').value = cfg.initial_seconds || 30;
    document.getElementById('chokingSilentSeconds').value = cfg.silent_seconds || 5;
    document.getElementById('chokingDrainRate').value = cfg.drain_rate || 5;
    document.getElementById('chokingRecoverRate').value = cfg.recover_rate || 8;
    document.getElementById('chokingVolumeThreshold').value = cfg.volume_threshold || 30;
    document.getElementById('chokingThresholdDisplay').textContent = cfg.volume_threshold || 30;
    chokingPunishmentPath = cfg.punishment_video || '';
    document.getElementById('chokingPunishmentPath').value = chokingPunishmentPath ? chokingPunishmentPath.split(/[/\\]/).pop() : '';
    document.getElementById('chokingPunishmentVolume').value = cfg.punishment_volume ?? 100;
    document.getElementById('chokingPunishmentVolumeDisplay').textContent = cfg.punishment_volume ?? 100;
    chokingSilentVideoPath = cfg.silent_video || '';
    document.getElementById('chokingSilentVideoPath').value = chokingSilentVideoPath ? chokingSilentVideoPath.split(/[/\\]/).pop() : '';
    document.getElementById('chokingSilentVolume').value = cfg.silent_volume ?? 100;
    document.getElementById('chokingSilentVolumeDisplay').textContent = cfg.silent_volume ?? 100;
}

function getChokingConfig() {
    return {
        trigger_gift: (document.getElementById('chokingTriggerGift')?.value || '').trim(),
        add_seconds: parseInt(document.getElementById('chokingAddSeconds')?.value) || 5,
        silent_gift: (document.getElementById('chokingSilentGift')?.value || '').trim(),
        silent_add_seconds: parseInt(document.getElementById('chokingSilentAddSeconds')?.value) || 3,
        initial_seconds: parseInt(document.getElementById('chokingInitialSeconds')?.value) || 30,
        silent_seconds: parseInt(document.getElementById('chokingSilentSeconds')?.value) || 5,
        drain_rate: parseInt(document.getElementById('chokingDrainRate')?.value) || 5,
        recover_rate: parseInt(document.getElementById('chokingRecoverRate')?.value) || 8,
        volume_threshold: parseInt(document.getElementById('chokingVolumeThreshold')?.value) || 30,
        punishment_video: chokingPunishmentPath,
        punishment_volume: parseInt(document.getElementById('chokingPunishmentVolume')?.value) ?? 100,
        silent_video: chokingSilentVideoPath,
        silent_volume: parseInt(document.getElementById('chokingSilentVolume')?.value) ?? 100
    };
}

async function saveChokingConfig() {
    const cfg = getChokingConfig();
    config.choking_config = cfg;
    await pywebview.api.update_config({ choking_config: cfg });
    addLogLocal('🫁 窒息挑戰設定已儲存');
}

async function selectChokingPunishment() {
    try {
        const result = await pywebview.api.select_file('video');
        if (result) {
            chokingPunishmentPath = result;
            document.getElementById('chokingPunishmentPath').value = result.split(/[/\\]/).pop();
            await saveChokingConfig();
        }
    } catch (e) {
        console.error('選擇懲罰影片失敗:', e);
    }
}

async function selectChokingSilentVideo() {
    try {
        const result = await pywebview.api.select_file('video');
        if (result) {
            chokingSilentVideoPath = result;
            document.getElementById('chokingSilentVideoPath').value = result.split(/[/\\]/).pop();
            await saveChokingConfig();
        }
    } catch (e) {
        console.error('選擇禁言影片失敗:', e);
    }
}

async function testChoking() {
    const cfg = getChokingConfig();
    try {
        await pywebview.api.trigger_green_screen('startChoking', {
            initialSeconds: cfg.initial_seconds,
            silentSeconds: cfg.silent_seconds,
            drainRate: cfg.drain_rate,
            recoverRate: cfg.recover_rate,
            volumeThreshold: cfg.volume_threshold,
            punishmentVideo: cfg.punishment_video
        });
        addLogLocal('🫁 測試窒息挑戰已觸發');
    } catch (e) {
        console.error('測試窒息挑戰失敗:', e);
    }
}

async function stopChoking() {
    try {
        await pywebview.api.trigger_green_screen('stopChoking', {});
        addLogLocal('🫁 已停止窒息挑戰');
    } catch (e) {
        console.error('停止窒息挑戰失敗:', e);
    }
}

// ============================================================
// 卡密授權系統
// ============================================================

let currentLicenseStatus = null;

/**
 * 初始化授權系統 — 檢查狀態，決定是否顯示啟用畫面
 */
async function initLicenseSystem() {
    try {
        // 取得設備 ID 顯示在啟用畫面
        const deviceId = await pywebview.api.get_device_id();
        const deviceEl = document.getElementById('activationDeviceId');
        if (deviceEl) deviceEl.textContent = deviceId.substring(0, 16) + '...';

        // 驗證 license
        const result = await pywebview.api.validate_license();
        currentLicenseStatus = result.data || { valid: false, status: 'inactive', features: [] };

        if (!result.valid) {
            // 顯示啟用覆蓋畫面
            showActivationOverlay();
        } else {
            // 隱藏啟用畫面，更新 UI
            hideActivationOverlay();
            updateLicenseUI(currentLicenseStatus);
            applyFeatureGating(currentLicenseStatus);
        }

        // 監聽 license 狀態變更
        if (window.electronAPI && window.electronAPI.onLicenseStatusChanged) {
            window.electronAPI.onLicenseStatusChanged((status) => {
                currentLicenseStatus = status;
                updateLicenseUI(status);
                applyFeatureGating(status);
            });
        }

        // 監聽授權被撤銷/過期（後端已自動斷線）
        if (window.electronAPI && window.electronAPI.onLicenseRevoked) {
            window.electronAPI.onLicenseRevoked((message) => {
                console.warn('[License] 授權已失效:', message);
                connected = false;
                updateConnectionStatus(false);
                showActivationOverlay();
                showActivationError(message);
            });
        }
    } catch (e) {
        console.error('[License] 初始化失敗:', e);
        // 出錯也顯示啟用畫面
        showActivationOverlay();
    }
}

function showActivationOverlay() {
    const overlay = document.getElementById('activationOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideActivationOverlay() {
    const overlay = document.getElementById('activationOverlay');
    if (overlay) overlay.style.display = 'none';
}

/**
 * 啟用卡密（啟用畫面的按鈕）
 */
async function activateLicenseKey() {
    const input = document.getElementById('licenseKeyInput');
    const errorEl = document.getElementById('activationError');
    const btn = document.getElementById('activateBtn');
    if (!input) return;

    const key = input.value.trim().toUpperCase();
    if (!key) {
        showActivationError('請輸入授權碼');
        return;
    }

    btn.disabled = true;
    btn.textContent = '驗證中...';
    errorEl.style.display = 'none';

    try {
        const result = await pywebview.api.activate_license(key);
        if (result.success) {
            currentLicenseStatus = result.data;
            hideActivationOverlay();
            updateLicenseUI(result.data);
            applyFeatureGating(result.data);
            showToast('授權啟用成功！');
        } else {
            showActivationError(result.message);
        }
    } catch (e) {
        showActivationError('啟用失敗：' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '🔑 啟用授權';
    }
}

function showActivationError(msg) {
    const errorEl = document.getElementById('activationError');
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }
}

/**
 * 自動格式化卡密輸入框
 */
function setupLicenseKeyInput() {
    const input = document.getElementById('licenseKeyInput');
    if (!input) return;

    input.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        // 前綴 LG 自動處理
        if (val.startsWith('LG')) val = val.substring(2);
        // 每 4 字元加 -
        const parts = val.match(/.{1,4}/g) || [];
        e.target.value = 'LG-' + parts.join('-');
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') activateLicenseKey();
    });
}

/**
 * 更新授權管理面板 UI
 */
function updateLicenseUI(status) {
    if (!status) return;

    // 卡密顯示
    const keyEl = document.getElementById('licenseKeyDisplay');
    if (keyEl) keyEl.textContent = status.key || '未啟用';

    // 等級
    const tierEl = document.getElementById('licenseTierDisplay');
    if (tierEl) {
        const tierMap = { basic: 'Basic', pro: 'Pro' };
        tierEl.textContent = tierMap[status.tier] || '-';
    }

    // 狀態
    const statusEl = document.getElementById('licenseStatusDisplay');
    if (statusEl) {
        const statusMap = {
            active: ['status-active', '有效'],
            expired: ['status-expired', '已過期'],
            revoked: ['status-revoked', '已撤銷'],
            inactive: ['status-inactive', '未啟用']
        };
        const [dotClass, label] = statusMap[status.status] || ['status-inactive', status.status];
        statusEl.innerHTML = `<span class="status-dot ${dotClass}"></span> ${label}`;
    }

    // 到期日
    const expiresEl = document.getElementById('licenseExpiresDisplay');
    if (expiresEl) {
        if (status.expires_at) {
            const d = new Date(status.expires_at);
            expiresEl.textContent = d.toLocaleDateString('zh-TW');
        } else {
            expiresEl.textContent = '-';
        }
    }

    // 設備 ID
    const deviceEl = document.getElementById('licenseDeviceDisplay');
    if (deviceEl) {
        deviceEl.textContent = status.device_id ? status.device_id.substring(0, 16) + '...' : '-';
        deviceEl.title = status.device_id || '';
    }

    // 解除綁定按鈕
    const deactBtn = document.getElementById('deactivateLicenseBtn');
    if (deactBtn) {
        deactBtn.style.display = status.valid ? '' : 'none';
    }

    // 功能權限列表
    const features = status.features || [];
    const allFeatures = ['wheel', 'video', 'duck_catch', 'entry', 'chain_battle', 'choking', 'giftbox'];
    allFeatures.forEach(f => {
        const el = document.getElementById(`feature-${f}`);
        if (el) {
            const unlocked = features.includes(f);
            el.className = `feature-badge ${unlocked ? 'feature-unlocked' : 'feature-locked'}`;
            el.textContent = unlocked ? '✓' : '🔒';
        }
    });
}

/**
 * 功能門禁 — 禁用未授權功能的 switch
 */
function applyFeatureGating(status) {
    if (!status) return;
    const features = status.features || [];

    // 功能對應 checkbox ID 和面板
    const featureMap = {
        duck_catch: { checkboxId: 'duckCatchEnabled', panel: 'duckcatch' },
        entry: { checkboxId: 'entryEnabled', panel: 'entry' },
        chain_battle: { checkboxId: 'chainBattleEnabled', panel: 'chainbattle' },
        choking: { checkboxId: 'chokingEnabled', panel: 'choking' },
        giftbox: { checkboxId: 'giftboxEnabled', panel: null }
    };

    Object.entries(featureMap).forEach(([feature, { checkboxId, panel }]) => {
        const checkbox = document.getElementById(checkboxId);
        if (!checkbox) return;

        const allowed = features.includes(feature);
        if (!allowed) {
            checkbox.checked = false;
            checkbox.disabled = true;
            // 加鎖頭標記到側邊欄
            if (panel) {
                const menuItem = document.querySelector(`.menu-item[data-panel="${panel}"]`);
                if (menuItem && !menuItem.querySelector('.lock-icon')) {
                    const lock = document.createElement('span');
                    lock.className = 'lock-icon';
                    lock.textContent = '🔒';
                    lock.style.cssText = 'margin-left:auto;font-size:12px;opacity:0.5';
                    menuItem.appendChild(lock);
                }
            }
        } else {
            checkbox.disabled = false;
            // 移除鎖頭
            if (panel) {
                const menuItem = document.querySelector(`.menu-item[data-panel="${panel}"]`);
                if (menuItem) {
                    const lock = menuItem.querySelector('.lock-icon');
                    if (lock) lock.remove();
                }
            }
        }
    });
}

/**
 * 解除授權
 */
async function deactivateLicenseKey() {
    if (!confirm('確定要解除授權嗎？解除後需要重新輸入卡密。')) return;

    try {
        const result = await pywebview.api.deactivate_license();
        if (result.success) {
            showToast('已解除授權');
            currentLicenseStatus = { valid: false, status: 'inactive', features: [] };
            updateLicenseUI(currentLicenseStatus);
            applyFeatureGating(currentLicenseStatus);
            showActivationOverlay();
        } else {
            showToast(result.message, 'error');
        }
    } catch (e) {
        showToast('操作失敗：' + e.message, 'error');
    }
}

