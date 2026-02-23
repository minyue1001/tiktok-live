/**
 * LiveGift Pro - 卡密（License）系統核心模組
 * 處理：卡密生成、驗證、啟用、設備綁定、本地加密快取、功能分級
 */

const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const firebase = require('./firebase');

// ============ 常數 ============
const APP_SECRET = 'LiveGiftPro2026!@#SecretKey';
const OFFLINE_GRACE_HOURS = 72;
const REVALIDATE_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 小時

// 功能分級定義
const FEATURE_TIERS = {
    basic: ['wheel', 'video'],
    pro: ['wheel', 'video', 'duck_catch', 'entry', 'chain_battle', 'choking', 'giftbox']
};

// ============ 狀態 ============
let licenseState = {
    valid: false,
    key: '',
    tier: '',
    status: '',
    expires_at: null,
    device_id: '',
    activated_at: null,
    last_validated: null,
    note: ''
};

let dataDir = '';          // 由 init() 設定
let cachePath = '';        // license.dat 路徑
let revalidateTimer = null;

// ============ 初始化 ============

/**
 * 初始化 license 模組
 * @param {string} userDataDir - app.getPath('userData') 或開發模式路徑
 */
function init(userDataDir) {
    dataDir = userDataDir;
    cachePath = path.join(dataDir, 'license.dat');
}

// ============ 設備指紋 ============

/**
 * 生成設備指紋 — SHA-256(hostname + cpuModel + totalMem + platform)
 * @returns {string} - 64 字元 hex
 */
function getDeviceFingerprint() {
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'unknown';
    const raw = [
        os.hostname(),
        cpuModel,
        String(os.totalmem()),
        os.platform()
    ].join('|');
    return crypto.createHash('sha256').update(raw).digest('hex');
}

// ============ 卡密生成 ============

/**
 * 生成隨機卡密 LG-XXXX-XXXX-XXXX-XXXX
 * @returns {string}
 */
function generateLicenseKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉 I/O/0/1 避免混淆
    const segment = () => {
        let s = '';
        for (let i = 0; i < 4; i++) {
            s += chars[crypto.randomInt(chars.length)];
        }
        return s;
    };
    return `LG-${segment()}-${segment()}-${segment()}-${segment()}`;
}

// ============ 本地加密快取 ============

/**
 * 取得加密金鑰 — SHA-256(deviceFingerprint + appSecret)
 * @returns {Buffer} - 32 bytes
 */
function getCacheKey() {
    const raw = getDeviceFingerprint() + APP_SECRET;
    return crypto.createHash('sha256').update(raw).digest();
}

/**
 * 加密並儲存 license 快取到本地
 * @param {object} data - license 資料
 */
function saveLicenseCache(data) {
    try {
        const key = getCacheKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const json = JSON.stringify(data);
        let encrypted = cipher.update(json, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const tag = cipher.getAuthTag();
        // 格式: iv(12) + tag(16) + encrypted
        const combined = Buffer.concat([iv, tag, encrypted]);
        fs.writeFileSync(cachePath, combined);
    } catch (error) {
        console.error('[License] 儲存快取失敗:', error);
    }
}

/**
 * 讀取並解密本地 license 快取
 * @returns {object|null}
 */
function getCachedLicense() {
    try {
        if (!fs.existsSync(cachePath)) return null;
        const combined = fs.readFileSync(cachePath);
        if (combined.length < 28) return null; // 最小: iv(12) + tag(16)

        const key = getCacheKey();
        const iv = combined.subarray(0, 12);
        const tag = combined.subarray(12, 28);
        const encrypted = combined.subarray(28);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
        console.error('[License] 讀取快取失敗:', error);
        return null;
    }
}

/**
 * 清除本地快取
 */
function clearLicenseCache() {
    try {
        if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
        }
    } catch (error) {
        console.error('[License] 清除快取失敗:', error);
    }
}

// ============ 核心驗證邏輯 ============

/**
 * 啟用卡密
 * @param {string} key - 卡密字串
 * @returns {Promise<{success: boolean, message: string, data?: object}>}
 */
async function activateLicense(key) {
    // 格式化 key（去空白、轉大寫）
    key = key.trim().toUpperCase();

    // 從 Firebase 取得卡密資料
    const licenseData = await firebase.getLicense(key);
    if (!licenseData) {
        return { success: false, message: '卡密不存在' };
    }

    // 檢查狀態
    if (licenseData.status === 'revoked') {
        return { success: false, message: '此卡密已被撤銷' };
    }
    if (licenseData.status === 'expired') {
        return { success: false, message: '此卡密已過期' };
    }

    // 檢查到期時間
    if (licenseData.expires_at && Date.now() > licenseData.expires_at) {
        // 更新 Firebase 狀態為 expired
        await firebase.setLicense(key, { ...licenseData, status: 'expired' });
        return { success: false, message: '此卡密已過期' };
    }

    // 檢查設備綁定
    const deviceId = getDeviceFingerprint();
    if (licenseData.device_id && licenseData.device_id !== deviceId) {
        return { success: false, message: '此卡密已綁定到其他設備' };
    }

    // 綁定設備
    const updatedData = {
        ...licenseData,
        status: 'active',
        device_id: deviceId,
        activated_at: licenseData.activated_at || Date.now()
    };
    const written = await firebase.setLicense(key, updatedData);
    if (!written) {
        return { success: false, message: 'Firebase 寫入失敗，請檢查網路' };
    }

    // 更新本地狀態
    licenseState = {
        valid: true,
        key: key,
        tier: updatedData.tier || 'basic',
        status: 'active',
        expires_at: updatedData.expires_at,
        device_id: deviceId,
        activated_at: updatedData.activated_at,
        last_validated: Date.now(),
        note: updatedData.note || ''
    };

    // 寫入本地快取
    saveLicenseCache(licenseState);

    // 啟動定時重新驗證
    startRevalidateTimer();

    console.log(`[License] 卡密啟用成功: ${key} (${licenseState.tier})`);
    return { success: true, message: '啟用成功', data: getLicenseStatus() };
}

/**
 * 驗證 license（啟動時 / 定時）
 * 優先從 Firebase 驗證，失敗時用本地快取（72 小時寬限）
 * @returns {Promise<{valid: boolean, message: string, data?: object}>}
 */
async function validateLicense() {
    // 先嘗試讀本地快取
    const cached = getCachedLicense();
    if (!cached || !cached.key) {
        licenseState = { valid: false, key: '', tier: '', status: 'inactive' };
        return { valid: false, message: '尚未啟用授權' };
    }

    const deviceId = getDeviceFingerprint();

    // 嘗試從 Firebase 驗證
    try {
        const licenseData = await firebase.getLicense(cached.key);
        if (!licenseData) {
            clearLicenseCache();
            licenseState = { valid: false, key: '', tier: '', status: 'inactive' };
            return { valid: false, message: '卡密已被刪除' };
        }

        // 檢查撤銷
        if (licenseData.status === 'revoked') {
            clearLicenseCache();
            licenseState = { valid: false, key: cached.key, tier: '', status: 'revoked' };
            return { valid: false, message: '授權已被撤銷' };
        }

        // 檢查到期
        if (licenseData.expires_at && Date.now() > licenseData.expires_at) {
            await firebase.setLicense(cached.key, { ...licenseData, status: 'expired' });
            clearLicenseCache();
            licenseState = { valid: false, key: cached.key, tier: '', status: 'expired' };
            return { valid: false, message: '授權已過期' };
        }

        // 檢查設備
        if (licenseData.device_id && licenseData.device_id !== deviceId) {
            clearLicenseCache();
            licenseState = { valid: false, key: cached.key, tier: '', status: 'device_mismatch' };
            return { valid: false, message: '此卡密已綁定到其他設備' };
        }

        // 驗證通過 — 更新本地快取
        licenseState = {
            valid: true,
            key: cached.key,
            tier: licenseData.tier || 'basic',
            status: 'active',
            expires_at: licenseData.expires_at,
            device_id: deviceId,
            activated_at: licenseData.activated_at,
            last_validated: Date.now(),
            note: licenseData.note || ''
        };
        saveLicenseCache(licenseState);
        startRevalidateTimer();

        return { valid: true, message: '授權有效', data: getLicenseStatus() };

    } catch (error) {
        // Firebase 不可用 — 使用離線快取
        console.warn('[License] Firebase 驗證失敗，使用離線快取:', error.message);

        if (!cached.last_validated) {
            licenseState = { valid: false, key: '', tier: '', status: 'offline_expired' };
            return { valid: false, message: '離線驗證失敗，請連接網路' };
        }

        const hoursSinceValidation = (Date.now() - cached.last_validated) / (1000 * 60 * 60);
        if (hoursSinceValidation > OFFLINE_GRACE_HOURS) {
            licenseState = { valid: false, key: cached.key, tier: '', status: 'offline_expired' };
            return { valid: false, message: `離線超過 ${OFFLINE_GRACE_HOURS} 小時，請連接網路重新驗證` };
        }

        // 離線寬限期內
        licenseState = {
            ...cached,
            valid: true
        };
        startRevalidateTimer();

        return { valid: true, message: `離線模式（剩餘 ${Math.floor(OFFLINE_GRACE_HOURS - hoursSinceValidation)} 小時）`, data: getLicenseStatus() };
    }
}

/**
 * 解除授權（解綁設備 + 清除本地）
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deactivateLicense() {
    if (!licenseState.key) {
        return { success: false, message: '尚未啟用授權' };
    }

    try {
        // 清除 Firebase 上的設備綁定
        const licenseData = await firebase.getLicense(licenseState.key);
        if (licenseData) {
            await firebase.setLicense(licenseState.key, {
                ...licenseData,
                device_id: null,
                activated_at: null,
                status: 'active' // 恢復為可用狀態
            });
        }
    } catch (error) {
        console.warn('[License] Firebase 解綁失敗:', error.message);
    }

    // 清除本地
    clearLicenseCache();
    stopRevalidateTimer();
    licenseState = { valid: false, key: '', tier: '', status: 'inactive' };

    console.log('[License] 已解除授權');
    return { success: true, message: '已解除授權' };
}

// ============ 狀態查詢 ============

/**
 * 取得 license 狀態（供前端顯示）
 */
function getLicenseStatus() {
    return {
        valid: licenseState.valid,
        key: licenseState.key,
        tier: licenseState.tier,
        status: licenseState.status,
        expires_at: licenseState.expires_at,
        device_id: licenseState.device_id || getDeviceFingerprint(),
        activated_at: licenseState.activated_at,
        features: licenseState.tier ? (FEATURE_TIERS[licenseState.tier] || []) : []
    };
}

/**
 * 檢查某功能是否允許
 * @param {string} feature - 功能名稱 (wheel, video, duck_catch, entry, chain_battle, choking, giftbox)
 * @returns {boolean}
 */
function isFeatureAllowed(feature) {
    if (!licenseState.valid || !licenseState.tier) return false;
    const allowed = FEATURE_TIERS[licenseState.tier] || [];
    return allowed.includes(feature);
}

// ============ 管理員功能 ============

/**
 * 建立新卡密
 * @param {object} opts - { tier, days, note }
 * @returns {Promise<{success: boolean, key?: string, message: string}>}
 */
async function createLicense(opts) {
    const { tier = 'basic', days = 30, note = '' } = opts;
    const key = generateLicenseKey();
    const now = Date.now();
    const data = {
        status: 'active',
        tier: tier,
        created_at: now,
        expires_at: now + days * 24 * 60 * 60 * 1000,
        device_id: null,
        activated_at: null,
        note: note
    };

    const written = await firebase.setLicense(key, data);
    if (!written) {
        return { success: false, message: 'Firebase 寫入失敗' };
    }

    console.log(`[License] 新卡密已建立: ${key} (${tier}, ${days}天)`);
    return { success: true, key, message: '卡密已建立' };
}

/**
 * 列出所有卡密
 * @returns {Promise<Array>}
 */
async function listAllLicenses() {
    const all = await firebase.getAllLicenses();
    return Object.entries(all).map(([key, data]) => ({
        key,
        ...data
    }));
}

/**
 * 撤銷卡密
 * @param {string} key
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function revokeLicense(key) {
    const data = await firebase.getLicense(key);
    if (!data) {
        return { success: false, message: '卡密不存在' };
    }
    await firebase.setLicense(key, { ...data, status: 'revoked' });
    console.log(`[License] 卡密已撤銷: ${key}`);
    return { success: true, message: '已撤銷' };
}

/**
 * 刪除卡密
 * @param {string} key
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deleteLicenseKey(key) {
    const result = await firebase.deleteLicense(key);
    if (!result) {
        return { success: false, message: '刪除失敗' };
    }
    console.log(`[License] 卡密已刪除: ${key}`);
    return { success: true, message: '已刪除' };
}

/**
 * 更新 EulerStream API Key
 * @param {string} apiKey
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function updateEulerKey(apiKey) {
    const current = await firebase.getAppConfig() || {};
    const result = await firebase.setAppConfig({ ...current, euler_api_key: apiKey });
    if (!result) {
        return { success: false, message: '更新失敗' };
    }
    console.log('[License] EulerStream API Key 已更新');
    return { success: true, message: '已更新' };
}

/**
 * 取得 EulerStream API Key（從 Firebase）
 * @returns {Promise<string>}
 */
async function getEulerApiKey() {
    try {
        const config = await firebase.getAppConfig();
        return (config && config.euler_api_key) || '';
    } catch (error) {
        console.warn('[License] 取得 EulerStream Key 失敗:', error.message);
        return '';
    }
}

// ============ 定時重新驗證 ============

function startRevalidateTimer() {
    stopRevalidateTimer();
    revalidateTimer = setInterval(async () => {
        console.log('[License] 定時重新驗證...');
        const result = await validateLicense();
        if (!result.valid) {
            console.warn('[License] 重新驗證失敗:', result.message);
        }
    }, REVALIDATE_INTERVAL_MS);
}

function stopRevalidateTimer() {
    if (revalidateTimer) {
        clearInterval(revalidateTimer);
        revalidateTimer = null;
    }
}

// ============ 匯出 ============

module.exports = {
    init,
    getDeviceFingerprint,
    generateLicenseKey,
    activateLicense,
    validateLicense,
    deactivateLicense,
    getLicenseStatus,
    isFeatureAllowed,
    // 管理員
    createLicense,
    listAllLicenses,
    revokeLicense,
    deleteLicense: deleteLicenseKey,
    updateEulerKey,
    getEulerApiKey,
    // 常數
    FEATURE_TIERS
};
