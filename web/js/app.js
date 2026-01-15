/**
 * TikTok 直播互動系統 - 主程式邏輯
 * pywebview API 版本
 */

// 語言翻譯
const i18n = {
    'zh-TW': {
        // 標題
        appTitle: 'TikTok 直播互動系統',
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
    initVolumeSlider();
    initNavigation();  // 初始化側邊欄導航
    initLogFilters();  // 初始化日誌過濾器
    initConfigUpdateListener();  // 監聽配置更新（即時同步）
    await refreshAccountList();  // 載入帳號列表
    await updateChatDisplayStatus();  // 初始化彈幕顯示狀態
    setInterval(updateLogs, 1000);
    setInterval(updateStatus, 2000);
});

// === 配置更新監聽（即時同步不需重開）===
function initConfigUpdateListener() {
    if (window.electronAPI && window.electronAPI.onConfigUpdate) {
        window.electronAPI.onConfigUpdate(async (newConfig) => {
            console.log('[配置更新] 收到配置變更，即時同步...');
            config = newConfig;
            // 重新渲染所有列表
            renderVideoGiftList();
            renderWheelOptionList();
            renderWheelGiftList();
            renderGiftboxGiftList();
            renderGiftboxOptionList();
            renderEntryList();
            console.log('[配置更新] 同步完成');
        });
    }
}

// === 側邊欄導航 ===
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-panel]');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // 如果點擊的是開關，不切換面板
            if (e.target.closest('.mini-switch')) return;

            const panelId = item.getAttribute('data-panel');
            switchPanel(panelId);
        });
    });

    // 初始載入時渲染列表
    renderWheelGiftList();
    renderWheelOptionList();
}

function switchPanel(panelId) {
    // 更新導航項目狀態
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    const activeNav = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
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
        } else if (panelId === 'video') {
            renderVideoGiftList();
        } else if (panelId === 'entry') {
            renderEntryList();
            updateHighLevelUserCount();
        } else if (panelId === 'giftbox') {
            renderGiftboxGiftList();
            renderGiftboxOptionList();
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

function waitForPywebview() {
    return new Promise((resolve) => {
        // 已經準備好
        if (window.pywebview && window.pywebview.api) {
            resolve();
            return;
        }

        // 監聽事件
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
        document.getElementById('entryEnabled').checked = config.entry_enabled || false;
        document.getElementById('giftboxEnabled').checked = config.giftbox_enabled || false;
        document.getElementById('portInput').value = config.port || 10010;
        document.getElementById('apiKeyInput').value = config.api_key || '';
        document.getElementById('autoOpenGreenScreen').checked = config.auto_open_green_screen || false;
        document.getElementById('languageSelect').value = config.language || 'zh-TW';

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

    // 通知綠幕視窗
    try {
        await pywebview.api.trigger_green_screen('moduleStatusChanged', {
            module: 'giftbox',
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
            const statusText = statusBadge.querySelector('.status-text');
            if (statusText) statusText.textContent = t('connected');
        }
        if (btn) {
            btn.innerHTML = `<span class="btn-icon">🔌</span><span class="btn-text" data-i18n="disconnect">${t('disconnect')}</span>`;
            btn.classList.add('connected');
        }
    } else {
        if (statusBadge) {
            statusBadge.classList.remove('connected');
            const statusText = statusBadge.querySelector('.status-text');
            if (statusText) statusText.textContent = t('disconnected');
        }
        if (btn) {
            btn.innerHTML = `<span class="btn-icon">🔌</span><span class="btn-text" data-i18n="connect">${t('connect')}</span>`;
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
    const gift = config.video_gifts?.find(g => g.video_path);
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

    // 合併轉盤禮物和影片禮物
    const allGifts = new Set();
    (config.wheel_gifts || []).forEach(g => allGifts.add(g.name));
    (config.video_gifts || []).forEach(g => {
        if (g.trigger_type === 'gift') allGifts.add(g.name);
    });

    if (allGifts.size === 0) {
        const option = document.createElement('option');
        option.textContent = '(無禮物設定)';
        select.appendChild(option);
    } else {
        allGifts.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
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
        // simulate_gift 內部已經呼叫 trigger_effects()，會自動觸發轉盤和影片
        // 這裡只需要確保綠幕視窗已開啟
        await openGreenScreen();
        await pywebview.api.simulate_gift(username, giftName, count);
    }

    closeDialog('simulateDialog');
}

// === 轉盤禮物管理 ===
function renderWheelGiftList() {
    const container = document.getElementById('wheelGiftList');
    const gifts = config.wheel_gifts || [];

    if (gifts.length === 0) {
        container.innerHTML = '<div class="list-empty">尚無設定</div>';
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
        container.innerHTML = '<div class="list-empty">尚無設定</div>';
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
        container.innerHTML = '<div class="list-empty">尚無設定</div>';
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
        container.innerHTML = '<div class="list-empty">尚無設定</div>';
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

// === 影片觸發管理 ===
function renderVideoGiftList() {
    const container = document.getElementById('videoGiftList');
    const gifts = config.video_gifts || [];

    if (gifts.length === 0) {
        container.innerHTML = '<div class="list-empty">尚無設定</div>';
        return;
    }

    const typeLabels = { gift: '禮物', chat: '彈幕', like: '點讚' };

    container.innerHTML = gifts.map((gift, index) => {
        const isEnabled = gift.enabled !== false;

        return `
            <div class="list-item">
                <div class="list-item-content">
                    <label class="trigger-switch-sm" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleVideoGiftEnabled(${index})">
                        <span class="trigger-slider-sm"></span>
                    </label>
                    <span class="list-item-text" style="${isEnabled ? '' : 'opacity: 0.5;'}">
                        ${gift.name}
                        <span style="color: var(--text-muted)"> (${typeLabels[gift.trigger_type] || '禮物'})</span>
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
    toggleVideoTriggerOptions();
    openDialog('videoGiftDialog');
}

function showEditVideoGiftDialog(index) {
    const gift = config.video_gifts[index];
    if (!gift) return;

    document.getElementById('videoGiftDialogTitle').textContent = '編輯影片觸發';
    document.getElementById('videoGiftEditIndex').value = index;
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
    toggleVideoTriggerOptions();
    openDialog('videoGiftDialog');
}

function toggleVideoTriggerOptions() {
    const triggerType = document.getElementById('videoTriggerType').value;
    document.getElementById('videoKeywordGroup').style.display = triggerType === 'chat' ? 'block' : 'none';
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

    // 保留原有的 enabled 狀態（編輯時），新增時預設為 true
    const existingEnabled = (editIndex >= 0 && config.video_gifts[editIndex])
        ? config.video_gifts[editIndex].enabled
        : true;

    const gift = {
        name: document.getElementById('videoGiftName').value.trim(),
        trigger_type: document.getElementById('videoTriggerType').value,
        trigger_keyword: document.getElementById('videoTriggerKeyword').value.trim(),
        video_path: document.getElementById('videoPath').value.trim(),
        video_priority: parseInt(document.getElementById('videoPriority').value) || 1,
        video_repeat: parseInt(document.getElementById('videoRepeat').value) || 1,
        video_seconds: parseFloat(document.getElementById('videoSeconds').value) || 0,
        video_speed: parseFloat(document.getElementById('videoSpeed').value) || 1.0,
        video_volume: parseInt(document.getElementById('videoVolume').value) || 100,
        force_interrupt: document.getElementById('forceInterrupt').checked,
        enabled: existingEnabled !== false
    };

    if (!gift.name) {
        alert('請輸入名稱');
        return;
    }

    if (!gift.video_path) {
        alert('請選擇影片檔案');
        return;
    }

    if (!config.video_gifts) config.video_gifts = [];

    if (editIndex >= 0) {
        config.video_gifts[editIndex] = gift;
    } else {
        config.video_gifts.push(gift);
    }

    await pywebview.api.update_config({ video_gifts: config.video_gifts });
    renderVideoGiftList();
    closeDialog('videoGiftDialog');
    addLogLocal(`已儲存影片觸發: ${gift.name}`);
}

async function deleteVideoGift(index) {
    if (confirm('確定要刪除此設定嗎？')) {
        config.video_gifts.splice(index, 1);
        await pywebview.api.update_config({ video_gifts: config.video_gifts });
        renderVideoGiftList();
        addLogLocal('已刪除影片觸發');
    }
}

async function toggleVideoGiftEnabled(index) {
    if (!config.video_gifts[index]) return;

    const gift = config.video_gifts[index];
    gift.enabled = gift.enabled === false ? true : false;

    await pywebview.api.update_config({ video_gifts: config.video_gifts });
    renderVideoGiftList();
    addLogLocal(`${gift.name} 觸發已${gift.enabled ? '啟用' : '禁用'}`);
}

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
        const activeDialogs = document.querySelectorAll('.dialog.active');
        if (activeDialogs.length === 0) {
            document.getElementById('dialogOverlay').classList.remove('active');
        }
    } else {
        closeAllDialogs();
    }
}

function closeAllDialogs() {
    document.getElementById('dialogOverlay').classList.remove('active');
    document.querySelectorAll('.dialog').forEach(d => d.classList.remove('active'));
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
let lastLogCount = 0;

async function updateLogs() {
    try {
        const logs = await pywebview.api.get_logs();
        if (logs.length !== lastLogCount) {
            const container = document.getElementById('logContent');
            container.innerHTML = logs.map(log => {
                const logType = getLogType(log);
                const display = logFilters[logType] ? 'block' : 'none';
                return `<div class="log-item" data-log-type="${logType}" style="display:${display}">${log}</div>`;
            }).join('');
            container.scrollTop = container.scrollHeight;
            lastLogCount = logs.length;
        }
    } catch (e) {}
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
        container.innerHTML = '<div class="list-empty">尚未設定進場用戶，點擊「+ 新增」添加</div>';
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
