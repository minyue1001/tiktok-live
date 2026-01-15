# TikTok Live 互動系統 - Electron 版本

純 JavaScript 實現的 TikTok 直播互動系統。

## 功能

- 轉盤抽獎模組
- 影片觸發模組
- 盲盒抽獎模組
- 進場特效模組
- 自動更新

## 開發

```bash
# 安裝依賴
npm install

# 開發模式運行
npm run dev

# 正式運行
npm start
```

## 打包

### Windows

```bash
# 雙擊執行
build.bat

# 或命令列
npm run build
```

輸出：`dist/TikTok Live Setup x.x.x.exe`

## 發布更新

1. 修改 `package.json` 中的 `version`
2. 打包新版本
3. 在 GitHub 建立新 Release，上傳安裝檔
4. 用戶的應用程式會自動檢測並提示更新

## 專案結構

```
electron-app/
├── src/
│   ├── main.js       # 主進程
│   └── preload.js    # 預載腳本
├── web/
│   ├── index.html    # 主介面
│   ├── greenscreen.html
│   ├── css/
│   └── js/
├── assets/
│   └── icon.ico
├── package.json
└── build.bat
```

## 設定 GitHub 自動更新

1. 修改 `package.json` 中的 publish 設定：
   ```json
   "publish": {
     "provider": "github",
     "owner": "你的GitHub帳號",
     "repo": "你的倉庫名"
   }
   ```

2. 設定 GitHub Token（打包時需要）：
   ```bash
   set GH_TOKEN=你的GitHub Token
   npm run build
   ```
