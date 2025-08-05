# 🔒 安全性設定指南

## 問題分析
您的程式被電腦識別為「未識別的程式」，通常是因為：
1. 缺少數位簽名憑證
2. 安全性設定不足
3. 防毒軟體誤判

## 已完成的安全性優化

### 後端安全性加強
1. **Helmet 安全中間件升級**
   - 添加 Content Security Policy (CSP)
   - 加強 XSS 保護
   - 防止點擊劫持攻擊

2. **ESLint 安全性規則**
   - 新增 `eslint-plugin-security`
   - 檢測潛在安全漏洞
   - 程式碼品質保證

3. **環境變數設定**
   - 創建 `.env.example` 範本
   - 敏感資訊隔離
   - 配置標準化

### 前端安全性修復
1. **API 端點修正**
   - 修正 Vite 代理設定 (5000 → 5001)
   - 確保前後端連接正常

## 解決「未識別程式」問題的步驟

### 1. 立即執行安全性檢查
```bash
# 後端
cd backend
npm install
npm run security-check
npm run lint

# 前端  
cd ../frontend
npm install
npm run lint
```

### 2. 程式碼簽名 (推薦)
對於 macOS：
```bash
# 獲取開發者憑證
# 1. 註冊 Apple Developer Program
# 2. 生成程式碼簽名憑證
# 3. 簽名應用程式
codesign --deep --force --verify --verbose --sign \"Developer ID Application: Your Name\" your-app.app
```

對於 Windows：
```bash
# 獲取程式碼簽名憑證
# 使用 SignTool 簽名
signtool sign /a /t http://timestamp.digicert.com your-app.exe
```

### 3. 建立信任清單
添加應用程式到系統信任清單：

**macOS：**
- 前往「系統偏好設定」>「安全性與隱私權」
- 在「一般」標籤中允許應用程式執行

**Windows：**
- 添加資料夾到 Windows Defender 排除清單
- 或使用 Windows SmartScreen 設定

### 4. 建置優化設定

為了減少誤判，添加建置優化：

```javascript
// frontend/vite.config.js 額外設定
export default defineConfig({
  // 現有設定...
  build: {
    outDir: 'dist',
    sourcemap: false, // 生產環境關閉 sourcemap
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'antd'],
          charts: ['recharts'],
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})
```

## 執行建議

1. **立即執行**：運行安全性檢查腳本
2. **短期解決**：添加到防毒軟體白名單
3. **長期解決**：獲取程式碼簽名憑證
4. **持續監控**：定期執行安全性掃描

## 驗證步驟

執行以下命令驗證修復：
```bash
# 後端安全性驗證
cd backend
npm audit
npm run lint

# 前端建置驗證  
cd ../frontend
npm run build
npm run preview
```

所有檢查通過後，程式應該不再被標記為「未識別」。