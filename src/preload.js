/**
 * TikTok 直播互動系統 - Preload Script
 * 暴露安全的 API 給渲染進程
 */

const { contextBridge, ipcRenderer } = require('electron');

// 模擬 pywebview API 結構，使前端程式碼變動最小
contextBridge.exposeInMainWorld('pywebview', {
    api: {
        // 配置管理
        get_config: () => ipcRenderer.invoke('get-config'),
        update_config: (updates) => ipcRenderer.invoke('update-config', updates),

        // 連接控制
        connect_tiktok: () => ipcRenderer.invoke('connect-tiktok'),
        disconnect_tiktok: () => ipcRenderer.invoke('disconnect-tiktok'),
        get_status: () => ipcRenderer.invoke('get-status'),

        // 日誌
        get_logs: () => ipcRenderer.invoke('get-logs'),

        // 綠幕視窗
        open_green_screen: (orientation) => ipcRenderer.invoke('open-green-screen', orientation),
        trigger_green_screen: (event, data) => ipcRenderer.invoke('trigger-green-screen', event, data),

        // 檔案選擇
        select_file: (type) => ipcRenderer.invoke('select-file', type),

        // 模擬送禮
        simulate_gift: (username, giftName, count) =>
            ipcRenderer.invoke('simulate-gift', username, giftName, count),

        // 高等級用戶管理
        get_all_accounts: () => ipcRenderer.invoke('get-all-accounts'),
        search_high_level_users: (query, account) =>
            ipcRenderer.invoke('search-high-level-users', query, account),
        get_high_level_users_count: (account) =>
            ipcRenderer.invoke('get-high-level-users-count', account),
        clear_high_level_users: (account) =>
            ipcRenderer.invoke('clear-high-level-users', account),

        // 綠幕位置
        save_greenscreen_positions: (positions) =>
            ipcRenderer.invoke('save-greenscreen-positions', positions),

        // 綠幕相關 - 供 greenscreen.html 使用
        get_greenscreen_positions: () => ipcRenderer.invoke('get-greenscreen-positions'),
        get_wheel_options: () => ipcRenderer.invoke('get-wheel-options'),
        get_giftbox_options: () => ipcRenderer.invoke('get-giftbox-options'),
        get_module_status: () => ipcRenderer.invoke('get-module-status'),

        // 媒體 URL
        get_media_url: (filePath) => ipcRenderer.invoke('get-media-url', filePath),

        // 更新相關
        check_for_update: () => ipcRenderer.invoke('check-for-update'),
        download_update: () => ipcRenderer.invoke('download-update'),
        install_update: () => ipcRenderer.invoke('install-update'),
        get_app_version: () => ipcRenderer.invoke('get-app-version'),

        // 彈幕顯示（保持與 Python 版相容）
        toggle_chat_display: (enabled) => ipcRenderer.invoke('toggle-chat-display', enabled),
        get_chat_display_status: () => ipcRenderer.invoke('get-chat-display-status')
    }
});

// 綠幕視窗事件監聽
contextBridge.exposeInMainWorld('electronAPI', {
    // 視窗控制
    closeGreenScreen: () => ipcRenderer.invoke('close-green-screen'),
    minimizeGreenScreen: () => ipcRenderer.invoke('minimize-green-screen'),
    toggleMaximizeGreenScreen: () => ipcRenderer.invoke('toggle-maximize-green-screen'),

    // 監聯來自主進程的事件
    onGreenScreenEvent: (callback) => {
        ipcRenderer.on('green-screen-event', (_, payload) => {
            callback(payload.event, payload.data);
        });
    },

    // 監聯日誌更新
    onLogUpdate: (callback) => {
        ipcRenderer.on('log-update', (_, logs) => {
            callback(logs);
        });
    },

    // 監聽配置更新
    onConfigUpdate: (callback) => {
        ipcRenderer.on('config-updated', (_, config) => {
            callback(config);
        });
    },

    // 監聽更新事件
    onUpdateAvailable: (callback) => {
        ipcRenderer.on('update-available', (_, info) => callback(info));
    },
    onUpdateProgress: (callback) => {
        ipcRenderer.on('update-progress', (_, percent) => callback(percent));
    },
    onUpdateDownloaded: (callback) => {
        ipcRenderer.on('update-downloaded', (_, info) => callback(info));
    }
});

// 標記已準備好（模擬 pywebviewready 事件）
window.addEventListener('DOMContentLoaded', () => {
    // 發送自定義事件，模擬 pywebview 準備完成
    setTimeout(() => {
        window.dispatchEvent(new Event('pywebviewready'));
    }, 100);
});
