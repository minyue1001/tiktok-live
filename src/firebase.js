/**
 * Firebase 世界榜服務模組
 * 用於同步多個程式實例的抓鴨子排行榜
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, onValue, query, orderByChild, limitToLast } = require('firebase/database');

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyCCUXzg1SCSkhk6qim6nq75vnpolL2Sv9E",
    authDomain: "dark-bb549.firebaseapp.com",
    databaseURL: "https://dark-bb549-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dark-bb549",
    storageBucket: "dark-bb549.firebasestorage.app",
    messagingSenderId: "110608728848",
    appId: "1:110608728848:web:e4cdcfe6e1be6e9312db95"
};

let app = null;
let db = null;
let initialized = false;

/**
 * 初始化 Firebase
 */
function initFirebase() {
    if (initialized) return true;

    // 檢查配置是否已填寫
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.log('[Firebase] 尚未配置 Firebase，世界榜功能已停用');
        return false;
    }

    try {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        initialized = true;
        console.log('[Firebase] 世界榜服務已啟動');
        return true;
    } catch (error) {
        console.error('[Firebase] 初始化失敗:', error);
        return false;
    }
}

/**
 * 更新用戶鴨子數到世界榜
 * @param {string} uniqueId - 用戶唯一ID
 * @param {string} nickname - 用戶暱稱
 * @param {string} avatar - 用戶頭像URL
 * @param {number} totalDucks - 總鴨子數
 * @returns {Promise<{isNewChampion: boolean, previousChampion?: object}>}
 */
async function updateWorldLeaderboard(uniqueId, nickname, avatar, totalDucks) {
    if (!initFirebase()) {
        return { isNewChampion: false };
    }

    try {
        const userRef = ref(db, `worldLeaderboard/user_${uniqueId}`);
        await set(userRef, {
            uniqueId,
            nickname,
            avatar: avatar || '',
            totalDucks,
            lastUpdated: Date.now()
        });

        // 檢查是否成為第一名
        return await checkAndUpdateChampion(uniqueId, nickname, totalDucks);
    } catch (error) {
        console.error('[Firebase] 更新世界榜失敗:', error);
        return { isNewChampion: false };
    }
}

/**
 * 檢查並更新世界冠軍
 * @param {string} uniqueId - 用戶唯一ID
 * @param {string} nickname - 用戶暱稱
 * @param {number} totalDucks - 總鴨子數
 * @returns {Promise<{isNewChampion: boolean, previousChampion?: object}>}
 */
async function checkAndUpdateChampion(uniqueId, nickname, totalDucks) {
    if (!db) return { isNewChampion: false };

    try {
        const championRef = ref(db, 'worldChampion');
        const snapshot = await get(championRef);
        const currentChampion = snapshot.val();

        // 判斷是否成為新冠軍
        const shouldBecomeChampion = !currentChampion ||
            totalDucks > currentChampion.totalDucks;

        // 如果是新人登頂（不是同一個人）
        if (shouldBecomeChampion && (!currentChampion || uniqueId !== currentChampion.uniqueId)) {
            await set(championRef, { uniqueId, nickname, totalDucks });
            console.log(`[Firebase] 新的世界冠軍: ${nickname} (${totalDucks} 鴨)`);
            return { isNewChampion: true, previousChampion: currentChampion };
        }

        // 如果是同一人，只更新數量
        if (currentChampion && uniqueId === currentChampion.uniqueId && totalDucks > currentChampion.totalDucks) {
            await set(championRef, { uniqueId, nickname, totalDucks });
        }

        return { isNewChampion: false };
    } catch (error) {
        console.error('[Firebase] 檢查冠軍失敗:', error);
        return { isNewChampion: false };
    }
}

/**
 * 獲取世界榜 Top N
 * @param {number} limit - 返回數量，預設 100
 * @returns {Promise<Array>}
 */
async function getWorldLeaderboard(limit = 100) {
    if (!initFirebase()) {
        return [];
    }

    try {
        const leaderboardRef = ref(db, 'worldLeaderboard');
        const topQuery = query(leaderboardRef, orderByChild('totalDucks'), limitToLast(limit));
        const snapshot = await get(topQuery);

        const result = [];
        snapshot.forEach(child => {
            result.push(child.val());
        });

        // 按鴨子數降序排列
        return result.sort((a, b) => b.totalDucks - a.totalDucks);
    } catch (error) {
        console.error('[Firebase] 獲取世界榜失敗:', error);
        return [];
    }
}

/**
 * 獲取當前世界冠軍
 * @returns {Promise<object|null>}
 */
async function getWorldChampion() {
    if (!initFirebase()) {
        return null;
    }

    try {
        const championRef = ref(db, 'worldChampion');
        const snapshot = await get(championRef);
        return snapshot.val();
    } catch (error) {
        console.error('[Firebase] 獲取世界冠軍失敗:', error);
        return null;
    }
}

/**
 * 監聽世界冠軍變化
 * @param {Function} callback - 回調函數
 * @returns {Function|null} - 取消監聽的函數
 */
function onWorldChampionChange(callback) {
    if (!initFirebase()) {
        return null;
    }

    try {
        const championRef = ref(db, 'worldChampion');
        return onValue(championRef, (snapshot) => {
            callback(snapshot.val());
        });
    } catch (error) {
        console.error('[Firebase] 監聽世界冠軍失敗:', error);
        return null;
    }
}

/**
 * 檢查 Firebase 是否已配置
 * @returns {boolean}
 */
function isConfigured() {
    return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
}

/**
 * 檢查 Firebase 是否已初始化
 * @returns {boolean}
 */
function isInitialized() {
    return initialized;
}

module.exports = {
    initFirebase,
    updateWorldLeaderboard,
    getWorldLeaderboard,
    getWorldChampion,
    onWorldChampionChange,
    isConfigured,
    isInitialized
};
