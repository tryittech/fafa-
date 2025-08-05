# 財務阿姨取代計畫 - 後端 API

## 專案概述

這是「線上財務系統 (財務阿姨取代計畫)」的後端 API 服務，提供完整的財務管理功能，包括收入支出管理、財務報表、稅務計算等。

## 技術架構

- **運行環境**: Node.js 18+
- **框架**: Express.js
- **資料庫**: SQLite3
- **驗證**: express-validator
- **安全**: helmet, cors, express-rate-limit
- **檔案上傳**: multer
- **日誌**: morgan

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
# 開發模式（自動重啟）
npm run dev

# 生產模式
npm start
```

伺服器將在 `http://localhost:5000` 啟動

### 3. 測試 API

```bash
# 運行 API 測試
npm test

# 或
npm run test:api
```

## API 端點

### 健康檢查
- `GET /api/health` - 系統健康狀態

### 收入管理
- `GET /api/income` - 獲取收入列表
- `POST /api/income` - 新增收入記錄
- `PUT /api/income/:id` - 更新收入記錄
- `DELETE /api/income/:id` - 刪除收入記錄
- `GET /api/income/statistics` - 收入統計

### 支出管理
- `GET /api/expense` - 獲取支出列表
- `POST /api/expense` - 新增支出記錄
- `PUT /api/expense/:id` - 更新支出記錄
- `DELETE /api/expense/:id` - 刪除支出記錄
- `GET /api/expense/statistics` - 支出統計

### 儀表板
- `GET /api/dashboard/overview` - 財務概覽
- `GET /api/dashboard/cash-flow` - 現金流量趨勢
- `GET /api/dashboard/recent-transactions` - 最近交易
- `GET /api/dashboard/category-breakdown` - 類別分析
- `GET /api/dashboard/financial-health` - 財務健康指標

### 財務報表
- `GET /api/reports/income-statement` - 損益表
- `GET /api/reports/balance-sheet` - 資產負債表
- `GET /api/reports/cash-flow-statement` - 現金流量表
- `GET /api/reports/expense-breakdown` - 支出分析

### 稅務助手
- `GET /api/tax/rates` - 獲取稅率資訊
- `POST /api/tax/calculate-business-tax` - 計算營業稅
- `POST /api/tax/calculate-income-tax` - 計算營利事業所得稅
- `GET /api/tax/filing-reminders` - 稅務申報提醒
- `GET /api/tax/calculation-history` - 計算歷史記錄
- `GET /api/tax/resources` - 稅務相關資源

### 系統設定
- `GET /api/settings/company-info` - 獲取公司資訊
- `PUT /api/settings/company-info` - 更新公司資訊
- `GET /api/settings/system-settings` - 獲取系統設定
- `PUT /api/settings/system-settings` - 更新系統設定
- `GET /api/settings/export-data` - 匯出資料
- `POST /api/settings/import-data` - 匯入資料
- `POST /api/settings/backup` - 創建備份
- `GET /api/settings/backups` - 獲取備份列表
- `POST /api/settings/restore` - 還原備份
- `DELETE /api/settings/backups/:filename` - 刪除備份
- `GET /api/settings/system-info` - 系統資訊
- `POST /api/settings/reset-settings` - 重置系統設定

## 資料庫結構

### 主要資料表

1. **income** - 收入記錄
2. **expense** - 支出記錄
3. **company_info** - 公司資訊
4. **system_settings** - 系統設定
5. **tax_data** - 稅務資料
6. **tax_calculations** - 稅務計算記錄

### 資料庫檔案位置

```
backend/database/fafa.db
```

## 環境變數

可以在 `.env` 檔案中設定以下環境變數：

```env
NODE_ENV=development
PORT=5000
```

## 開發指南

### 新增路由

1. 在 `src/routes/` 目錄下創建新的路由檔案
2. 在 `src/app.js` 中導入並註冊路由
3. 更新 API 文檔

### 資料庫操作

使用 `src/utils/database.js` 中的工具函數：

```javascript
import { query, run, get } from '../utils/database.js'

// 查詢多筆記錄
const rows = await query('SELECT * FROM table_name')

// 執行 SQL（INSERT, UPDATE, DELETE）
const result = await run('INSERT INTO table_name (column) VALUES (?)', [value])

// 查詢單筆記錄
const row = await get('SELECT * FROM table_name WHERE id = ?', [id])
```

### 資料驗證

使用 express-validator 進行輸入驗證：

```javascript
import { body, validationResult } from 'express-validator'

router.post('/example', [
  body('field').notEmpty().withMessage('欄位不能為空'),
  body('email').isEmail().withMessage('電子郵件格式不正確')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '輸入資料驗證失敗',
      errors: errors.array()
    })
  }
  // 處理請求...
})
```

## 部署

### 生產環境部署

1. 設定環境變數
2. 安裝依賴：`npm install --production`
3. 啟動服務：`npm start`

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 故障排除

### 常見問題

1. **資料庫連接失敗**
   - 檢查資料庫檔案是否存在
   - 確認檔案權限

2. **API 請求失敗**
   - 檢查伺服器是否正在運行
   - 確認端口是否被佔用
   - 檢查 CORS 設定

3. **檔案上傳失敗**
   - 確認 uploads 目錄存在
   - 檢查檔案大小限制

## 貢獻指南

1. Fork 專案
2. 創建功能分支
3. 提交變更
4. 發起 Pull Request

## 授權

MIT License 