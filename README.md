# 🏦 財務阿姨替代系統 (Financial Auntie Replace)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

一個專為小型企業設計的現代化財務管理系統，提供完整的收支管理、稅務計算和財務分析功能。

## ✨ 核心功能

### 💰 財務管理
- **智能儀表板** - 即時財務狀況總覽
- **收入管理** - 應收帳款追蹤與客戶管理
- **支出管理** - 供應商付款與費用控制
- **預算管理** - 月度/年度預算設定與執行監控

### 📊 財務分析
- **三大財務報表** - 損益表、資產負債表、現金流量表
- **財務健康評估** ⭐ - 100分制智能評分系統
- **雷達圖分析** - 五大財務維度視覺化
- **專業改善建議** - AI驅動的財務優化建議

### 🧮 稅務助手
- **營業稅計算** - 自動計算銷項/進項稅額
- **稅務明細** - 詳細稅額分解與說明
- **計算結果匯出** - 支援多種格式下載

### 📤 資料匯出
- **多格式支援** - PDF、Excel、CSV
- **一鍵匯出** - 所有報表均可快速匯出
- **智能檔名** - 自動時間戳與分類

## 🚀 快速開始

### 前置需求
- Node.js 18+
- npm 或 yarn

### 安裝運行
```bash
# 1. 克隆專案
git clone https://github.com/tryittech/Financial-Auntie-Replace.git
cd Financial-Auntie-Replace

# 2. 安裝依賴
cd backend && npm install
cd ../frontend && npm install

# 3. 啟動服務
# 後端服務 (端口 5001)
cd backend && npm start

# 前端服務 (端口 3000)  
cd frontend && npm run start
```

### 訪問系統
- 🌐 前端界面: http://localhost:3000
- 🔗 API服務: http://localhost:5001

## 🛠️ 技術架構

### 前端技術棧
- **React 18** + **Vite** - 現代化前端框架
- **Ant Design 5** - 企業級UI組件庫
- **Recharts** - 財務圖表視覺化
- **React Router v6** - 單頁應用路由

### 後端技術棧
- **Node.js** + **Express.js** - 高性能API服務
- **SQLite3** - 輕量級嵌入式資料庫
- **Better-SQLite3** - 同步資料庫操作
- **Helmet** - 安全防護中間件

### 匯出功能
- **jsPDF** + **html2canvas** - PDF生成
- **xlsx** - Excel/CSV處理
- **file-saver** - 檔案下載

## 📁 專案結構

```
Financial-Auntie-Replace/
├── 📁 backend/              # Node.js API 服務
│   ├── 📁 src/
│   │   ├── 📁 routes/       # API 路由定義
│   │   ├── 📁 models/       # 資料模型
│   │   ├── 📁 utils/        # 工具函數
│   │   └── 📄 app.js        # 主應用程式
│   └── 📄 package.json
├── 📁 frontend/             # React 前端應用
│   ├── 📁 src/
│   │   ├── 📁 pages/        # 頁面組件
│   │   ├── 📁 components/   # 公用組件
│   │   ├── 📁 services/     # API 服務層
│   │   ├── 📁 utils/        # 工具函數
│   │   └── 📄 App.jsx       # 主應用組件
│   └── 📄 package.json
├── 📄 README.md             # 專案說明 (本文件)
├── 📄 INIT_GUIDE.md         # 詳細安裝指南
└── 📄 Microfinance-prd      # 產品需求文檔
```

## 🎯 核心特色

### 💎 財務健康評估系統
本系統的核心創新功能，提供企業財務體質的全面分析：

- **🏆 健康評分** - 基於五大財務指標的100分制評分
- **📊 雷達圖分析** - 流動性、獲利能力、財務結構、營運效率、資產報酬
- **🎯 智能建議** - 針對性的財務改善策略
- **📈 趨勢追蹤** - 月度健康分數變化追蹤

### 🔄 即時資料同步
- 前後端資料即時同步
- SQLite3 資料庫自動備份
- API 響應時間 < 100ms

### 🛡️ 安全性保障
- CORS 跨域保護
- Helmet 安全標頭
- 輸入驗證與清理
- 資料加密存儲

## 📊 系統截圖

*財務健康評估界面*
![健康評估](https://via.placeholder.com/800x400/4CAF50/FFFFFF?text=財務健康評估系統)

*智能儀表板*
![儀表板](https://via.placeholder.com/800x400/2196F3/FFFFFF?text=財務管理儀表板)

## 📖 文檔

- 📋 [詳細安裝指南](./INIT_GUIDE.md)
- 📄 [產品需求文檔](./Microfinance-prd)
- 🔗 [API 文檔](./backend/README.md)

## 🤝 貢獻指南

歡迎貢獻代碼！請遵循以下步驟：

1. **Fork** 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 **Pull Request**

## 📄 開源協議

本專案採用 [MIT 協議](https://opensource.org/licenses/MIT) - 詳見 LICENSE 文件

## 🌟 核心價值

> **讓小型企業的財務管理變得簡單、智能、專業**

- ✅ **簡單易用** - 直觀的操作界面，零學習成本
- ✅ **功能完整** - 涵蓋財務管理的各個方面
- ✅ **智能分析** - AI驅動的財務健康評估
- ✅ **資料安全** - 本地部署，數據自主掌控

## 📞 支援與反饋

- 🐛 [問題回報](https://github.com/tryittech/Financial-Auntie-Replace/issues)
- 💡 [功能建議](https://github.com/tryittech/Financial-Auntie-Replace/discussions)
- 📧 技術支援: support@tryittech.com

---

⭐ **如果這個專案對您有幫助，請給我們一個星標！**

<div align="center">

**🎯 讓財務管理變得更智能、更高效！**

</div>