/**
 * 初始化 Firebase 資料庫
 * 只需執行一次：node init-db.js
 *
 * 功能：
 * 1. 建立 app_config 路徑（放 EulerStream API Key）
 * 2. 測試寫入/讀取/刪除一組卡密確認權限正常
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, remove } = require('firebase/database');

const firebaseConfig = {
    apiKey: "AIzaSyCCUXzg1SCSkhk6qim6nq75vnpolL2Sv9E",
    authDomain: "dark-bb549.firebaseapp.com",
    databaseURL: "https://dark-bb549-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dark-bb549",
    storageBucket: "dark-bb549.firebasestorage.app",
    messagingSenderId: "110608728848",
    appId: "1:110608728848:web:e4cdcfe6e1be6e9312db95"
};

async function main() {
    console.log('初始化 Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    // 1. 建立 app_config
    console.log('\n[1] 建立 app_config...');
    try {
        const existing = (await get(ref(db, 'app_config'))).val();
        if (existing) {
            console.log('  app_config 已存在:', JSON.stringify(existing));
        } else {
            await set(ref(db, 'app_config'), {
                euler_api_key: ''  // 之後在管理頁面填入
            });
            console.log('  app_config 已建立 (euler_api_key 為空，請稍後在管理頁面設定)');
        }
    } catch (e) {
        console.error('  失敗:', e.message);
        console.log('');
        console.log('  ⚠️  如果是 PERMISSION_DENIED，請到 Firebase Console 設定 RTDB 規則：');
        console.log('  https://console.firebase.google.com/project/dark-bb549/database/dark-bb549-default-rtdb/rules');
        console.log('');
        console.log('  將規則改為：');
        console.log('  {');
        console.log('    "rules": {');
        console.log('      ".read": true,');
        console.log('      ".write": true');
        console.log('    }');
        console.log('  }');
        console.log('');
        process.exit(1);
    }

    // 2. 測試卡密讀寫
    console.log('\n[2] 測試卡密讀寫...');
    const testKey = 'LG-TEST-0000-0000-0000';
    try {
        await set(ref(db, `licenses/${testKey}`), {
            status: 'active',
            tier: 'pro',
            created_at: Date.now(),
            expires_at: Date.now() + 86400000,
            device_id: null,
            activated_at: null,
            note: '測試卡密（可刪除）'
        });
        console.log('  寫入測試卡密 OK');

        const snap = await get(ref(db, `licenses/${testKey}`));
        const data = snap.val();
        console.log('  讀取測試卡密 OK:', data.tier, data.note);

        await remove(ref(db, `licenses/${testKey}`));
        console.log('  刪除測試卡密 OK');
    } catch (e) {
        console.error('  失敗:', e.message);
        process.exit(1);
    }

    console.log('\n✅ 資料庫初始化完成！');
    console.log('   現在可以執行 npm start 開啟管理介面。');
    process.exit(0);
}

main();
