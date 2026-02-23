/**
 * LiveGift Pro 卡密管理工具
 * 完全獨立的管理伺服器，不依賴 Electron
 *
 * 使用方式：
 *   cd tools/license-admin
 *   npm install
 *   npm start
 *
 * 會在 http://localhost:3456 開啟管理介面
 */

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, remove } = require('firebase/database');

// ============ Firebase 設定（與主 app 共用同一個 Firebase 專案）============
const firebaseConfig = {
    apiKey: "AIzaSyCCUXzg1SCSkhk6qim6nq75vnpolL2Sv9E",
    authDomain: "dark-bb549.firebaseapp.com",
    databaseURL: "https://dark-bb549-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dark-bb549",
    storageBucket: "dark-bb549.firebasestorage.app",
    messagingSenderId: "110608728848",
    appId: "1:110608728848:web:e4cdcfe6e1be6e9312db95"
};

const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);

// ============ 卡密格式 ============
function generateLicenseKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = () => {
        let s = '';
        for (let i = 0; i < 4; i++) {
            s += chars[crypto.randomInt(chars.length)];
        }
        return s;
    };
    return `LG-${segment()}-${segment()}-${segment()}-${segment()}`;
}

// ============ Express 伺服器 ============
const app = express();
app.use(express.json());

// 靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// API: 取得 EulerStream Key
app.get('/api/euler-key', async (req, res) => {
    try {
        const snapshot = await get(ref(db, 'app_config'));
        const config = snapshot.val();
        res.json({ key: (config && config.euler_api_key) || '' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: 更新 EulerStream Key
app.post('/api/euler-key', async (req, res) => {
    try {
        const current = (await get(ref(db, 'app_config'))).val() || {};
        await set(ref(db, 'app_config'), { ...current, euler_api_key: req.body.key });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: 建立卡密
app.post('/api/licenses', async (req, res) => {
    try {
        const { tier = 'basic', days = 30, note = '' } = req.body;
        const key = generateLicenseKey();
        const now = Date.now();
        const data = {
            status: 'active',
            tier,
            created_at: now,
            expires_at: now + days * 24 * 60 * 60 * 1000,
            device_id: null,
            activated_at: null,
            note
        };
        await set(ref(db, `licenses/${key}`), data);
        console.log(`[建立] ${key} (${tier}, ${days}天)`);
        res.json({ success: true, key });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: 列出所有卡密
app.get('/api/licenses', async (req, res) => {
    try {
        const snapshot = await get(ref(db, 'licenses'));
        const all = snapshot.val() || {};
        const list = Object.entries(all).map(([key, data]) => ({ key, ...data }));
        res.json(list);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: 撤銷卡密
app.post('/api/licenses/:key/revoke', async (req, res) => {
    try {
        const licKey = req.params.key;
        const snapshot = await get(ref(db, `licenses/${licKey}`));
        const data = snapshot.val();
        if (!data) return res.status(404).json({ error: '卡密不存在' });
        await set(ref(db, `licenses/${licKey}`), { ...data, status: 'revoked' });
        console.log(`[撤銷] ${licKey}`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API: 刪除卡密
app.delete('/api/licenses/:key', async (req, res) => {
    try {
        await remove(ref(db, `licenses/${req.params.key}`));
        console.log(`[刪除] ${req.params.key}`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 啟動
const PORT = 3456;
app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║  LiveGift Pro 卡密管理工具            ║');
    console.log(`  ║  http://localhost:${PORT}               ║`);
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');

    // 嘗試自動開啟瀏覽器
    const { exec } = require('child_process');
    const url = `http://localhost:${PORT}`;
    if (process.platform === 'win32') {
        exec(`start ${url}`);
    } else if (process.platform === 'darwin') {
        exec(`open ${url}`);
    } else {
        exec(`xdg-open ${url}`);
    }
});
