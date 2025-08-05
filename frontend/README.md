# 財務阿姨取代計畫 - 前端應用

## 專案概述

這是「線上財務系統 (財務阿姨取代計畫)」的前端應用，提供直觀易用的財務管理介面，讓台灣小型企業、個人創業者和非會計背景的創辦人能夠輕鬆管理財務。

## 技術架構

- **框架**: React 18
- **UI 組件庫**: Ant Design (antd)
- **路由**: React Router v6
- **圖表**: Recharts
- **建構工具**: Vite
- **程式碼品質**: ESLint + Prettier
- **狀態管理**: React Context API

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

應用將在 `http://localhost:3000` 啟動

### 3. 建構生產版本

```bash
npm run build
```

### 4. 預覽生產版本

```bash
npm run preview
```

## 專案結構

```
frontend/
├── public/                 # 靜態資源
├── src/
│   ├── components/         # 共用組件
│   ├── pages/             # 頁面組件
│   │   ├── Dashboard.jsx           # 儀表板
│   │   ├── IncomeManagement.jsx    # 收入管理
│   │   ├── ExpenseManagement.jsx   # 支出管理
│   │   ├── FinancialReports.jsx    # 財務報表
│   │   ├── TaxHelper.jsx           # 稅務幫手
│   │   └── Settings.jsx            # 設定
│   ├── services/          # API 服務
│   │   └── api.js                  # API 通信
│   ├── styles/            # 樣式檔案
│   │   └── global.css              # 全域樣式
│   ├── App.jsx            # 主應用組件
│   ├── main.jsx           # 應用入口
│   └── index.html         # HTML 模板
├── package.json           # 依賴配置
├── vite.config.js         # Vite 配置
└── README.md              # 專案說明
```

## 主要功能

### 1. 儀表板 (Dashboard)
- 財務概覽統計卡片
- 現金流量趨勢圖表
- 最近交易記錄
- 快速新增按鈕

### 2. 收入管理 (Income Management)
- 收入記錄列表
- 新增/編輯收入表單
- 收入統計分析
- 狀態管理（已收/未收）

### 3. 支出管理 (Expense Management)
- 支出記錄列表
- 新增/編輯支出表單
- 收據上傳功能
- 支出類別分析

### 4. 財務報表 (Financial Reports)
- 損益表
- 資產負債表
- 現金流量表
- 圖表視覺化

### 5. 稅務幫手 (Tax Helper)
- 營業稅計算器
- 營利事業所得稅計算器
- 稅務申報提醒
- 稅務相關資源

### 6. 設定 (Settings)
- 公司資訊管理
- 系統設定
- 資料匯入/匯出
- 備份還原

## API 整合

### 環境變數

在 `.env` 檔案中設定 API 端點：

```env
VITE_API_URL=http://localhost:5000/api
```

### API 服務

使用 `src/services/api.js` 中的服務函數：

```javascript
import { incomeAPI, expenseAPI, dashboardAPI } from '../services/api'

// 獲取收入列表
const incomes = await incomeAPI.getList({ page: 1, limit: 10 })

// 新增支出
const newExpense = await expenseAPI.create({
  date: '2024-01-15',
  vendor: '供應商',
  description: '辦公用品',
  amount: 1000
})

// 獲取儀表板概覽
const overview = await dashboardAPI.getOverview()
```

## 開發指南

### 新增頁面

1. 在 `src/pages/` 目錄下創建新的頁面組件
2. 在 `src/App.jsx` 中添加路由
3. 在側邊欄菜單中添加對應項目

### 新增組件

1. 在 `src/components/` 目錄下創建新組件
2. 使用 Ant Design 組件庫
3. 遵循現有的命名規範

### 樣式開發

- 使用 Ant Design 的設計系統
- 在 `src/styles/global.css` 中添加全域樣式
- 組件級樣式使用 CSS Modules 或 styled-components

### 狀態管理

- 使用 React Context API 進行全局狀態管理
- 組件內部狀態使用 useState
- 複雜狀態邏輯使用 useReducer

## 設計原則

### UI/UX 設計

1. **簡潔直觀**: 減少認知負擔，使用簡單明瞭的介面
2. **視覺層次**: 清晰的資訊架構和視覺層次
3. **響應式設計**: 支援不同螢幕尺寸
4. **無障礙設計**: 符合 WCAG 2.1 標準

### 程式碼品質

1. **模組化**: 組件和功能模組化設計
2. **可維護性**: 清晰的程式碼結構和註釋
3. **效能優化**: 使用 React.memo、useMemo、useCallback
4. **錯誤處理**: 完善的錯誤邊界和錯誤處理

## 部署

### 生產環境部署

1. 建構應用：`npm run build`
2. 部署 `dist` 目錄到 Web 伺服器
3. 設定環境變數

### Docker 部署

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 測試

### 單元測試

```bash
npm run test
```

### 端到端測試

```bash
npm run test:e2e
```

## 故障排除

### 常見問題

1. **API 連接失敗**
   - 檢查後端伺服器是否運行
   - 確認 API 端點設定正確
   - 檢查 CORS 設定

2. **組件渲染錯誤**
   - 檢查瀏覽器控制台錯誤
   - 確認依賴版本相容性
   - 檢查 React 版本

3. **建構失敗**
   - 清除 node_modules 重新安裝
   - 檢查 Vite 配置
   - 確認環境變數設定

## 貢獻指南

1. Fork 專案
2. 創建功能分支
3. 提交變更
4. 發起 Pull Request

## 授權

MIT License 