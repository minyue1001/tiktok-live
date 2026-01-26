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

        // 場景管理
        get_scenes: () => ipcRenderer.invoke('get-scenes'),
        get_active_scene: () => ipcRenderer.invoke('get-active-scene'),
        switch_scene: (sceneId) => ipcRenderer.invoke('switch-scene', sceneId),
        create_scene: (name) => ipcRenderer.invoke('create-scene', name),
        delete_scene: (sceneId) => ipcRenderer.invoke('delete-scene', sceneId),
        rename_scene: (sceneId, newName) => ipcRenderer.invoke('rename-scene', sceneId, newName),
        update_scene_video_gifts: (sceneId, videoGifts) => ipcRenderer.invoke('update-scene-video-gifts', sceneId, videoGifts),
        get_scene_video_gifts: (sceneId) => ipcRenderer.invoke('get-scene-video-gifts', sceneId),

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
        select_files: (type) => ipcRenderer.invoke('select-files', type),
        select_folder: () => ipcRenderer.invoke('select-folder'),
        get_folder_video_count: (folderPath) => ipcRenderer.invoke('get-folder-video-count', folderPath),
        get_folder_videos: (folderPath) => ipcRenderer.invoke('get-folder-videos', folderPath),

        // 模擬送禮
        simulate_gift: (username, giftName, count) =>
            ipcRenderer.invoke('simulate-gift', username, giftName, count),

        // 測試隨機影片
        test_random_video: (rvConfig) =>
            ipcRenderer.invoke('test-random-video', rvConfig),

        // 抓鴨子模組
        get_duck_count: () => ipcRenderer.invoke('get-duck-count'),
        set_duck_count: (count) => ipcRenderer.invoke('set-duck-count', count),
        add_duck: (amount) => ipcRenderer.invoke('add-duck', amount),
        add_duck_for_user: (uniqueId, amount) => ipcRenderer.invoke('add-duck-for-user', uniqueId, amount),
        remove_duck: (amount) => ipcRenderer.invoke('remove-duck', amount),
        test_duck_catch: (caught, duckAmount) =>
            ipcRenderer.invoke('test-duck-catch', caught, duckAmount),
        simulate_duck_catch: (uniqueId, times) =>
            ipcRenderer.invoke('simulate-duck-catch', uniqueId, times),
        confirm_duck_catch: (username, videoPath, duckAmount, config) =>
            ipcRenderer.invoke('confirm-duck-catch', username, videoPath, duckAmount, config),
        reset_pity_counter: () => ipcRenderer.invoke('reset-pity-counter'),
        set_pity_counter: (value) => ipcRenderer.invoke('set-pity-counter', value),
        get_pity_counter: () => ipcRenderer.invoke('get-pity-counter'),
        notify_pity_update: () => ipcRenderer.invoke('notify-pity-update'),
        notify_duck_video_finished: () => ipcRenderer.invoke('notify-duck-video-finished'),
        notify_entry_effect_finished: () => ipcRenderer.invoke('notify-entry-effect-finished'),

        // 排行榜
        get_leaderboard: () => ipcRenderer.invoke('get-leaderboard'),
        clear_leaderboard: () => ipcRenderer.invoke('clear-leaderboard'),
        get_alltime_stats: () => ipcRenderer.invoke('get-alltime-stats'),
        set_user_ducks: (uniqueId, amount, nickname) => ipcRenderer.invoke('set-user-ducks', uniqueId, amount, nickname),
        delete_user_from_alltime: (uniqueId) => ipcRenderer.invoke('delete-user-from-alltime', uniqueId),

        // 世界榜
        get_world_leaderboard: () => ipcRenderer.invoke('get-world-leaderboard'),
        get_world_champion: () => ipcRenderer.invoke('get-world-champion'),

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
        get_chat_display_status: () => ipcRenderer.invoke('get-chat-display-status'),

        // 禮物圖生成器
        get_gift_image_config: () => ipcRenderer.invoke('get-gift-image-config'),
        save_gift_image_config: (config) => ipcRenderer.invoke('save-gift-image-config', config),
        send_gift_image_to_greenscreen: (data) => ipcRenderer.invoke('send-gift-image-to-greenscreen', data),
        hide_gift_image_on_greenscreen: () => ipcRenderer.invoke('hide-gift-image-on-greenscreen'),
        export_gift_image: (data) => ipcRenderer.invoke('export-gift-image', data),

        // 鎖鏈對抗
        start_chain_battle: (data) => ipcRenderer.invoke('start-chain-battle', data),
        stop_chain_battle: () => ipcRenderer.invoke('stop-chain-battle'),
        add_chain_count: (amount) => ipcRenderer.invoke('add-chain-count', amount),
        remove_chain_count: (amount) => ipcRenderer.invoke('remove-chain-count', amount),
        get_chain_battle_status: () => ipcRenderer.invoke('get-chain-battle-status'),
        chain_battle_ended: (won) => ipcRenderer.invoke('chain-battle-ended', won)
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

    // 監聽場景切換
    onSceneChanged: (callback) => {
        ipcRenderer.on('scene-changed', (_, data) => {
            callback(data);
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
    },

    // 抓鴨子事件
    onDuckCaught: (callback) => {
        ipcRenderer.on('duck-caught', (_, data) => callback(data));
    },
    onDuckCountUpdated: (callback) => {
        ipcRenderer.on('duck-count-updated', (_, count) => callback(count));
    },
    onPlayQuackSound: (callback) => {
        ipcRenderer.on('play-quack-sound', () => callback());
    },
    onPityCounterUpdated: (callback) => {
        ipcRenderer.on('pity-counter-updated', (_, data) => callback(data));
    },
    onLeaderboardUpdated: (callback) => {
        ipcRenderer.on('leaderboard-updated', (_, data) => callback(data));
    },

    // 快捷鍵開啟模擬送禮
    onOpenQuickSimulate: (callback) => {
        ipcRenderer.on('open-quick-simulate', () => callback());
    },

    // 禮物圖生成器
    getGiftImageConfig: () => ipcRenderer.invoke('get-gift-image-config'),
    saveGiftImageConfig: (config) => ipcRenderer.invoke('save-gift-image-config', config),
    sendGiftImageToGreenScreen: (data) => ipcRenderer.invoke('send-gift-image-to-greenscreen', data),
    exportGiftImage: (data) => ipcRenderer.invoke('export-gift-image', data),
    saveExportedImage: (filePath, base64Data) => ipcRenderer.invoke('save-exported-image', filePath, base64Data)
});

// 標記已準備好（模擬 pywebviewready 事件）
window.addEventListener('DOMContentLoaded', () => {
    // 發送自定義事件，模擬 pywebview 準備完成
    setTimeout(() => {
        window.dispatchEvent(new Event('pywebviewready'));
    }, 100);
});
