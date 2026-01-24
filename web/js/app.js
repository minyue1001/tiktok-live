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
    api_key: '',          // Eulerstream API Key
    auto_open_green_screen: false,
    language: 'zh-TW'
};
let connected = false;
let chatDisplayEnabled = false;  // 彈幕顯示狀態

// === 初始化 ===
document.addEventListener('DOMContentLoaded', async () => {
    await waitForPywebview();
    await loadConfig();
    await loadScenes();  // 載入場景列表
    initVolumeSlider();
    initNavigation();  // 初始化側邊欄導航
    initLogFilters();  // 初始化日誌過濾器
    initConfigUpdateListener();  // 監聽配置更新（即時同步）
    initSceneChangeListener();  // 監聯場景切換
    initLogUpdateListener();  // 監聽日誌更新（IPC 推送）
    initDialogs();  // 初始化對話框事件
    await refreshAccountList();  // 載入帳號列表
    await updateChatDisplayStatus();  // 初始化彈幕顯示狀態
    await updateLogs();  // 初始載入日誌
    setInterval(updateStatus, 2000);

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

// === 配置更新監聽（即時同步不需重開）===
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
            document.getElementById('apiKeyInput').value = config.api_key || '';
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
        document.getElementById('portInput').value = config.port || 10010;

        // 更新子面板狀態顯示
        updateSubtabStatus('wheel', config.wheel_enabled);
        updateSubtabStatus('giftbox', config.giftbox_enabled || false);
        document.getElementById('apiKeyInput').value = config.api_key || '';
        document.getElementById('autoOpenGreenScreen').checked = config.auto_open_green_screen || false;
        document.getElementById('languageSelect').value = config.language || 'zh-TW';

        // 載入抓鴨子設定
        loadDuckCatchConfig();
        initDuckCatchEvents();

        // 載入鎖鏈對抗設定
        loadChainBattleSettings();

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
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const autoOpen = document.getElementById('autoOpenGreenScreen').checked;
    const lang = document.getElementById('languageSelect').value;

    // 檢查 API Key 或 Port 是否有變更
    const needRestart = (config.api_key !== apiKey || config.port !== port);

    config.tiktok_username = tiktokUsername;
    config.port = port;
    config.api_key = apiKey;
    config.auto_open_green_screen = autoOpen;
    config.language = lang;
    currentLang = lang;

    await pywebview.api.update_config({
        tiktok_username: tiktokUsername,
        port: port,
        api_key: apiKey,
        auto_open_green_screen: autoOpen,
        language: lang
    });

    applyLanguage();
    addLogLocal(t('settingsSaved'));

    // 如果 API Key 或 Port 變更，提示需要重啟
    if (needRestart && (apiKey || config.api_key)) {
        addLogLocal('⚠️ API Key 或埠號已變更，請重啟程式以套用新設定');
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
    switchPanel('giftbox');
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
    updatePityDisplay();
    // 里程碑煙火影片
    document.getElementById('milestoneFireworkVideo').value = config.milestone_firework_video || '';
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
        pity_jackpot_amount: parseInt(document.getElementById('duckPityJackpotAmount').value) || 10000
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

    await pywebview.api.update_config({
        duck_catch_config: cfg,
        milestone_firework_video: milestoneVideo
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

    // 如果切換到總體資料庫，刷新資料
    if (tab === 'alltime') {
        refreshAlltimeStats();
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

function adjustUserDuckAmount(delta) {
    const input = document.getElementById('userDuckAmount');
    const current = parseInt(input.value) || 0;
    input.value = Math.max(0, current + delta);
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

        return `
            <div class="list-item">
                <div class="list-item-content">
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
                <div style="font-size: 12px; color: #9ca3af;">每次 +${gift.amount} 鎖鏈</div>
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
        add_gifts: chainAddGifts
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

// ============ 禮物圖生成器 ============
let giftImageItems = [];

function addGiftImageItem() {
    showGiftImageDialog();
}
window.addGiftImageItem = addGiftImageItem;

function showGiftImageDialog(editIndex = -1) {
    const isEdit = editIndex >= 0;
    const item = isEdit ? giftImageItems[editIndex] : { name: '', iconUrl: '', font: 'Microsoft JhengHei' };

    const dialog = document.createElement('div');
    dialog.className = 'gift-dialog-overlay';
    dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';
    dialog.innerHTML = `
        <div class="gift-dialog-box" style="background:var(--bg-card, #1e1e2e);border-radius:12px;padding:0;min-width:400px;max-width:90%;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            <div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1);">
                <h3 style="margin:0;font-size:16px;font-weight:600;">${isEdit ? '編輯禮物' : '新增禮物'}</h3>
                <button class="modal-close" onclick="this.closest('.gift-dialog-overlay').remove()" style="background:none;border:none;color:#999;font-size:24px;cursor:pointer;padding:0;width:32px;height:32px;">×</button>
            </div>
            <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:16px;">
                <div class="preview-icon" id="giftDialogPreview" style="width:80px;height:80px;margin:0 auto;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);border-radius:12px;font-size:40px;">
                    ${item.iconUrl ? `<img src="${item.iconUrl}" style="max-width:100%;max-height:100%;" onerror="this.parentElement.innerHTML='🎁'">` : '🎁'}
                </div>
                <div class="form-group">
                    <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">禮物名稱（顯示名稱）</label>
                    <input type="text" id="giftDialogName" class="input" value="${item.name}" placeholder="例如: 烏薩奇" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;">
                </div>
                <div class="form-group">
                    <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">字體</label>
                    <select id="giftDialogFont" class="input" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;">
                        <option value="Microsoft JhengHei" ${item.font === 'Microsoft JhengHei' ? 'selected' : ''}>微軟正黑體</option>
                        <option value="Noto Sans TC" ${item.font === 'Noto Sans TC' ? 'selected' : ''}>Noto Sans TC</option>
                        <option value="Arial" ${item.font === 'Arial' ? 'selected' : ''}>Arial</option>
                        <option value="Times New Roman" ${item.font === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                        <option value="Comic Sans MS" ${item.font === 'Comic Sans MS' ? 'selected' : ''}>Comic Sans MS</option>
                        <option value="Impact" ${item.font === 'Impact' ? 'selected' : ''}>Impact</option>
                        <option value="Georgia" ${item.font === 'Georgia' ? 'selected' : ''}>Georgia</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="display:block;margin-bottom:6px;font-size:13px;color:#aaa;">禮物圖片</label>
                    <input type="file" id="giftDialogFile" accept="image/*" onchange="previewGiftDialogFile(this)" style="display:none;">
                    <input type="hidden" id="giftDialogUrl" value="${item.iconUrl}">
                    <div style="display:flex;gap:10px;">
                        <button type="button" onclick="document.getElementById('giftDialogFile').click()" style="flex:1;padding:10px 12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;cursor:pointer;">選擇圖片檔案</button>
                        <button type="button" onclick="clearGiftDialogImage()" style="padding:10px 12px;background:rgba(255,100,100,0.2);border:1px solid rgba(255,100,100,0.3);border-radius:8px;color:#ff6b6b;cursor:pointer;">清除</button>
                    </div>
                    <div id="giftDialogFileName" style="margin-top:8px;font-size:12px;color:#888;">${item.iconUrl ? '已選擇圖片' : '未選擇圖片'}</div>
                </div>
            </div>
            <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1);">
                <button class="btn btn-outline" onclick="this.closest('.gift-dialog-overlay').remove()" style="padding:8px 16px;background:transparent;border:1px solid rgba(255,255,255,0.3);border-radius:8px;color:#fff;cursor:pointer;">取消</button>
                <button class="btn btn-primary" onclick="saveGiftImageItem(${editIndex})" style="padding:8px 16px;background:#7c3aed;border:none;border-radius:8px;color:#fff;cursor:pointer;">${isEdit ? '儲存' : '新增'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    document.getElementById('giftDialogName').focus();
}

function previewGiftDialogFile(input) {
    const preview = document.getElementById('giftDialogPreview');
    const fileNameDiv = document.getElementById('giftDialogFileName');
    const urlInput = document.getElementById('giftDialogUrl');

    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            preview.innerHTML = `<img src="${dataUrl}" style="max-width:100%;max-height:100%;">`;
            urlInput.value = dataUrl;
            fileNameDiv.textContent = file.name;
        };
        reader.readAsDataURL(file);
    }
}

function clearGiftDialogImage() {
    const preview = document.getElementById('giftDialogPreview');
    const fileNameDiv = document.getElementById('giftDialogFileName');
    const urlInput = document.getElementById('giftDialogUrl');
    const fileInput = document.getElementById('giftDialogFile');

    preview.innerHTML = '🎁';
    urlInput.value = '';
    fileInput.value = '';
    fileNameDiv.textContent = '未選擇圖片';
}

function saveGiftImageItem(editIndex) {
    const name = document.getElementById('giftDialogName').value.trim();
    const iconUrl = document.getElementById('giftDialogUrl').value.trim();
    const font = document.getElementById('giftDialogFont').value;

    if (!name) {
        alert('請輸入禮物名稱');
        return;
    }

    const item = { name, iconUrl, font };

    if (editIndex >= 0) {
        giftImageItems[editIndex] = item;
    } else {
        giftImageItems.push(item);
    }

    document.querySelector('.gift-dialog-overlay')?.remove();
    renderGiftImageList();
    updateGiftImagePreview();
    saveGiftImageConfig();
}

function deleteGiftImageItem(index) {
    if (!confirm('確定要刪除此禮物嗎？')) return;
    giftImageItems.splice(index, 1);
    renderGiftImageList();
    updateGiftImagePreview();
    saveGiftImageConfig();
}

function moveGiftImageItem(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= giftImageItems.length) return;
    [giftImageItems[index], giftImageItems[newIndex]] = [giftImageItems[newIndex], giftImageItems[index]];
    renderGiftImageList();
    updateGiftImagePreview();
    saveGiftImageConfig();
}

function renderGiftImageList() {
    const container = document.getElementById('giftImageList');
    if (!container) return;

    if (giftImageItems.length === 0) {
        container.innerHTML = '<div class="empty-list">尚未新增禮物，點擊上方「新增」按鈕開始</div>';
        return;
    }

    container.innerHTML = giftImageItems.map((item, i) => `
        <div class="gift-image-item">
            ${item.iconUrl
                ? `<img class="gift-icon" src="${item.iconUrl}" onerror="this.className='gift-icon placeholder'; this.outerHTML='<div class=\\'gift-icon placeholder\\'>🎁</div>'">`
                : '<div class="gift-icon placeholder">🎁</div>'
            }
            <div class="gift-info">
                <div class="gift-name" style="font-family:'${item.font || 'Microsoft JhengHei'}',sans-serif;">${escapeHtml(item.name)}</div>
                <div class="gift-url" style="font-size:11px;color:#888;">${item.font || '微軟正黑體'}</div>
            </div>
            <div class="gift-actions">
                <button onclick="moveGiftImageItem(${i}, -1)" title="上移">⬆️</button>
                <button onclick="moveGiftImageItem(${i}, 1)" title="下移">⬇️</button>
                <button onclick="showGiftImageDialog(${i})" title="編輯">✏️</button>
                <button class="delete" onclick="deleteGiftImageItem(${i})" title="刪除">🗑️</button>
            </div>
        </div>
    `).join('');
}

function getGiftImageSettings() {
    return {
        columns: parseInt(document.getElementById('giftImageColumns')?.value || 3),
        gap: parseInt(document.getElementById('giftImageGap')?.value || 20),
        iconSize: parseInt(document.getElementById('giftImageIconSize')?.value || 64),
        padding: parseInt(document.getElementById('giftImagePadding')?.value || 30),
        iconPosition: document.getElementById('giftImageIconPosition')?.value || 'left',
        bgType: document.getElementById('giftImageBgType')?.value || 'solid',
        bgColor: document.getElementById('giftImageBgColor')?.value || '#1a1a2e',
        bgColor2: document.getElementById('giftImageBgColor2')?.value || '#16213e',
        rounded: document.getElementById('giftImageRounded')?.checked !== false,
        fontSize: parseInt(document.getElementById('giftImageFontSize')?.value || 24),
        fontColor: document.getElementById('giftImageFontColor')?.value || '#ffffff',
        fontBold: document.getElementById('giftImageFontBold')?.checked !== false,
        textShadow: document.getElementById('giftImageTextShadow')?.checked !== false
    };
}

function toggleGiftImageBgOptions() {
    const bgType = document.getElementById('giftImageBgType')?.value;
    const colorGroup = document.getElementById('giftImageBgColorGroup');
    const color2Group = document.getElementById('giftImageBgColor2Group');

    if (bgType === 'transparent') {
        colorGroup.style.display = 'none';
        color2Group.style.display = 'none';
    } else if (bgType === 'gradient') {
        colorGroup.style.display = '';
        color2Group.style.display = '';
    } else {
        colorGroup.style.display = '';
        color2Group.style.display = 'none';
    }
}

function updateGiftImagePreview() {
    const container = document.getElementById('giftImagePreview');
    if (!container) return;

    if (giftImageItems.length === 0) {
        container.innerHTML = '<div class="preview-placeholder">新增禮物後即可預覽</div>';
        return;
    }

    const settings = getGiftImageSettings();

    // 背景樣式
    let bgStyle = '';
    if (settings.bgType === 'transparent') {
        bgStyle = 'background: transparent;';
    } else if (settings.bgType === 'gradient') {
        bgStyle = `background: linear-gradient(135deg, ${settings.bgColor}, ${settings.bgColor2});`;
    } else {
        bgStyle = `background: ${settings.bgColor};`;
    }

    // 文字樣式
    const textStyle = `
        font-size: ${settings.fontSize}px;
        color: ${settings.fontColor};
        font-weight: ${settings.fontBold ? 'bold' : 'normal'};
        ${settings.textShadow ? 'text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);' : ''}
    `;

    // 圖示位置樣式
    const itemFlexDirection = settings.iconPosition === 'right' ? 'row-reverse' : 'row';

    container.innerHTML = `
        <div class="gift-image-grid" style="
            ${bgStyle}
            padding: ${settings.padding}px;
            gap: ${settings.gap}px;
            grid-template-columns: repeat(${settings.columns}, 1fr);
            ${settings.rounded ? 'border-radius: 16px;' : ''}
        ">
            ${giftImageItems.map(item => `
                <div class="gift-image-grid-item" style="flex-direction: ${itemFlexDirection};">
                    ${item.iconUrl
                        ? `<img src="${item.iconUrl}" style="width: ${settings.iconSize}px; height: ${settings.iconSize}px;" onerror="this.style.display='none'">`
                        : `<div style="width: ${settings.iconSize}px; height: ${settings.iconSize}px; display: flex; align-items: center; justify-content: center; font-size: ${settings.iconSize * 0.6}px;">🎁</div>`
                    }
                    <span class="gift-label" style="${textStyle} font-family: '${item.font || 'Microsoft JhengHei'}', sans-serif;">${escapeHtml(item.name)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

async function saveGiftImageConfig() {
    try {
        const settings = getGiftImageSettings();
        const config = {
            items: giftImageItems,
            settings: settings
        };
        await pywebview.api.save_gift_image_config(config);
    } catch (e) {
        console.error('儲存禮物圖設定失敗:', e);
    }
}

async function loadGiftImageConfig() {
    try {
        const config = await pywebview.api.get_gift_image_config();
        if (config) {
            giftImageItems = config.items || [];
            const s = config.settings || {};

            if (s.columns) document.getElementById('giftImageColumns').value = s.columns;
            if (s.gap !== undefined) document.getElementById('giftImageGap').value = s.gap;
            if (s.iconSize) document.getElementById('giftImageIconSize').value = s.iconSize;
            if (s.padding !== undefined) document.getElementById('giftImagePadding').value = s.padding;
            if (s.iconPosition) document.getElementById('giftImageIconPosition').value = s.iconPosition;
            if (s.bgType) document.getElementById('giftImageBgType').value = s.bgType;
            if (s.bgColor) document.getElementById('giftImageBgColor').value = s.bgColor;
            if (s.bgColor2) document.getElementById('giftImageBgColor2').value = s.bgColor2;
            if (s.rounded !== undefined) document.getElementById('giftImageRounded').checked = s.rounded;
            if (s.fontSize) document.getElementById('giftImageFontSize').value = s.fontSize;
            if (s.fontColor) document.getElementById('giftImageFontColor').value = s.fontColor;
            if (s.fontBold !== undefined) document.getElementById('giftImageFontBold').checked = s.fontBold;
            if (s.textShadow !== undefined) document.getElementById('giftImageTextShadow').checked = s.textShadow;

            toggleGiftImageBgOptions();
            renderGiftImageList();
            updateGiftImagePreview();
        }
    } catch (e) {
        console.error('載入禮物圖設定失敗:', e);
    }
}

// 禮物圖是否已發送到綠幕
let giftImageSentToGreenScreen = false;

async function sendGiftImageToGreenScreen() {
    if (giftImageItems.length === 0) {
        alert('請先新增禮物');
        return;
    }

    const settings = getGiftImageSettings();
    try {
        await pywebview.api.send_gift_image_to_greenscreen({
            items: giftImageItems,
            settings: settings
        });
        addLogLocal('已發送禮物圖到綠幕');
    } catch (e) {
        console.error('發送失敗:', e);
        alert('發送失敗: ' + e.message);
    }
}

// 切換禮物圖顯示在綠幕上
async function toggleGiftImageOnGreenScreen() {
    const btn = document.getElementById('btnSendGiftImage');
    const refreshBtn = document.getElementById('btnRefreshGiftImage');

    if (giftImageSentToGreenScreen) {
        // 取消發送 - 隱藏綠幕上的禮物圖
        try {
            await pywebview.api.hide_gift_image_on_greenscreen();
            giftImageSentToGreenScreen = false;
            btn.textContent = '📺 發送到綠幕';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-outline');
            refreshBtn.style.display = 'none';
            addLogLocal('已從綠幕移除禮物圖');
        } catch (e) {
            console.error('取消發送失敗:', e);
        }
    } else {
        // 發送到綠幕
        if (giftImageItems.length === 0) {
            alert('請先新增禮物');
            return;
        }

        const settings = getGiftImageSettings();
        try {
            await pywebview.api.send_gift_image_to_greenscreen({
                items: giftImageItems,
                settings: settings
            });
            giftImageSentToGreenScreen = true;
            btn.textContent = '❌ 取消發送';
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-danger');
            refreshBtn.style.display = 'inline-block';
            addLogLocal('已發送禮物圖到綠幕');
        } catch (e) {
            console.error('發送失敗:', e);
            alert('發送失敗: ' + e.message);
        }
    }
}

// 重新整理綠幕上的禮物圖
async function refreshGiftImageOnGreenScreen() {
    if (!giftImageSentToGreenScreen) return;

    if (giftImageItems.length === 0) {
        alert('請先新增禮物');
        return;
    }

    const settings = getGiftImageSettings();
    try {
        await pywebview.api.send_gift_image_to_greenscreen({
            items: giftImageItems,
            settings: settings
        });
        addLogLocal('已重新整理綠幕禮物圖');
    } catch (e) {
        console.error('重新整理失敗:', e);
        alert('重新整理失敗: ' + e.message);
    }
}

async function exportGiftImage() {
    if (giftImageItems.length === 0) {
        alert('請先新增禮物');
        return;
    }

    const settings = getGiftImageSettings();
    try {
        const result = await pywebview.api.export_gift_image({
            items: giftImageItems,
            settings: settings
        });
        if (result.success) {
            addLogLocal(`禮物圖已匯出: ${result.path}`);
            alert('圖片已匯出！\n' + result.path);
        } else {
            alert('匯出失敗: ' + result.error);
        }
    } catch (e) {
        console.error('匯出失敗:', e);
        alert('匯出失敗: ' + e.message);
    }
}

// 暴露禮物圖函數到全局作用域
window.showGiftImageDialog = showGiftImageDialog;
window.previewGiftDialogFile = previewGiftDialogFile;
window.clearGiftDialogImage = clearGiftDialogImage;
window.saveGiftImageItem = saveGiftImageItem;
window.deleteGiftImageItem = deleteGiftImageItem;
window.moveGiftImageItem = moveGiftImageItem;
window.renderGiftImageList = renderGiftImageList;
window.updateGiftImagePreview = updateGiftImagePreview;
window.getGiftImageSettings = getGiftImageSettings;
window.saveGiftImageConfig = saveGiftImageConfig;
window.loadGiftImageConfig = loadGiftImageConfig;
window.sendGiftImageToGreenScreen = sendGiftImageToGreenScreen;
window.toggleGiftImageOnGreenScreen = toggleGiftImageOnGreenScreen;
window.refreshGiftImageOnGreenScreen = refreshGiftImageOnGreenScreen;
window.exportGiftImage = exportGiftImage;

// 初始化時載入禮物圖設定
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadGiftImageConfig();
    }, 500);
});
