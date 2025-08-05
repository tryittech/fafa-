# 🏦 財務阿姨替代系統

一個現代化的線上財務管理系統，專為中小企業和個人財務管理設計。

## 🌐 線上演示

**立即體驗**: https://tryittech.github.io/fafa-/

## ✨ 主要功能

### 📊 財務管理
- **儀表板**: 即時財務概覽和現金流圖表
- **收入管理**: 記錄和管理各項收入
- **支出管理**: 追蹤和控制支出
- **預算管理**: 設定和監控預算目標

### 📈 財務報表
- **損益表**: 完整的收入支出分析
- **資產負債表**: 財務狀況總覽
- **現金流量表**: 現金流動分析
- **財務健康評估**: 財務體質分析

### 🎯 績效管理
- **績效儀表板**: KPI 指標追蹤
- **現金流預測**: 基於歷史數據的預測
- **稅務幫手**: 稅務計算和申報提醒

### 🔧 系統功能
- **用戶認證**: 安全的登錄系統
- **數據匯出**: 支援 PDF 和 Excel 格式
- **響應式設計**: 支援桌面和移動設備

## 🚀 快速開始

### 本地開發

1. **克隆專案**
   ```bash
   git clone https://github.com/tryittech/fafa-.git
   cd fafa-
   ```

2. **安裝依賴**
   ```bash
   # 後端依賴
   cd backend
   npm install
   
   # 前端依賴
   cd ../frontend
   npm install
   ```

3. **啟動服務**
   ```bash
   # 啟動後端 (端口 5001)
   cd backend
   npm start
   
   # 啟動前端 (端口 3000)
   cd ../frontend
   npm run dev
   ```

4. **訪問應用**
   - 前端: http://localhost:3000
   - 後端 API: http://localhost:5001

### 測試帳號
- **用戶名**: `admin`
- **密碼**: `admin123`

## 🛠 技術架構

### 前端
- **React 18**: 現代化 UI 框架
- **Vite**: 快速建構工具
- **Ant Design**: 企業級 UI 組件庫
- **Recharts**: 數據視覺化圖表
- **React Router**: 單頁應用路由

### 後端
- **Node.js**: JavaScript 運行環境
- **Express**: Web 應用框架
- **SQLite**: 輕量級資料庫
- **JWT**: 用戶認證
- **CORS**: 跨域資源共享

### 部署
- **GitHub Pages**: 靜態網站託管
- **GitHub Actions**: 自動化部署

## 📁 專案結構

```
fafa-/
├── frontend/                 # 前端應用
│   ├── src/
│   │   ├── components/      # 共用組件
│   │   ├── pages/          # 頁面組件
│   │   ├── services/       # API 服務
│   │   ├── hooks/          # 自定義 Hooks
│   │   └── utils/          # 工具函數
│   └── public/             # 靜態資源
├── backend/                 # 後端 API
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 中間件
│   │   ├── models/         # 數據模型
│   │   └── utils/          # 工具函數
│   └── database/           # 資料庫檔案
└── docs/                   # 文檔
```

## 🔧 開發指南

### 添加新功能
1. 在 `frontend/src/pages/` 創建新頁面
2. 在 `backend/src/routes/` 添加 API 路由
3. 更新 `frontend/src/App.jsx` 添加路由
4. 測試並提交代碼

### 數據庫操作
```bash
# 重置數據庫
rm backend/database/fafa.db

# 插入測試數據
cd backend
node seed-test-data.js
```

## 📊 API 文檔

### 主要端點
- `GET /api/health` - 健康檢查
- `GET /api/dashboard/overview` - 儀表板概覽
- `GET /api/dashboard/cash-flow` - 現金流數據
- `GET /api/income` - 收入列表
- `GET /api/expense` - 支出列表

## 🤝 貢獻指南

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案了解詳情。

## 📞 聯絡資訊

- **專案連結**: https://github.com/tryittech/fafa-
- **線上演示**: https://tryittech.github.io/fafa-/

## 🙏 致謝

感謝所有為這個專案做出貢獻的開發者！

---

⭐ 如果這個專案對您有幫助，請給我們一個星標！