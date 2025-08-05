import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

// 路由
import authRoutes from './routes/auth.js'
import incomeRoutes from './routes/income.js'
import expenseRoutes from './routes/expense.js'
import dashboardRoutes from './routes/dashboard.js'
import reportsRoutes from './routes/reports.js'
import taxRoutes from './routes/tax.js'
import settingsRoutes from './routes/settings.js'
import budgetRoutes from './routes/budget.js'
import cashflowRoutes from './routes/cashflow.js'
import analyticsRoutes from './routes/analytics.js'
import assistantRoutes from './routes/assistant.js'

// 資料庫初始化
import { initDatabase } from './utils/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5001

// 安全中間件 - 加強安全性設定
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS 設定
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://fafa.com.tw'] 
    : ['http://localhost:3000'],
  credentials: true
}))

// 請求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100, // 限制每個IP 15分鐘內最多100個請求
  message: {
    error: '請求過於頻繁，請稍後再試'
  }
})
app.use('/api/', limiter)

// 日誌中間件
app.use(morgan('combined'))

// 解析JSON和URL編碼
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 靜態檔案服務
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/income', incomeRoutes)
app.use('/api/expense', expenseRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/tax', taxRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/budget', budgetRoutes)
app.use('/api/cashflow', cashflowRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/assistant', assistantRoutes)

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// 根路徑
app.get('/', (req, res) => {
  res.json({
    message: '財務阿姨取代計畫 API 服務',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      income: '/api/income',
      expense: '/api/expense',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      tax: '/api/tax',
      settings: '/api/settings',
      budget: '/api/budget',
      cashflow: '/api/cashflow',
      analytics: '/api/analytics',
      assistant: '/api/assistant'
    }
  })
})

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '找不到請求的資源',
    path: req.originalUrl
  })
})

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('錯誤:', err)
  
  // 資料庫錯誤
  if (err.code === 'SQLITE_ERROR') {
    return res.status(500).json({
      error: '資料庫錯誤',
      message: '請稍後再試'
    })
  }
  
  // 驗證錯誤
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '資料驗證失敗',
      details: err.message
    })
  }
  
  // 檔案上傳錯誤
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: '檔案過大',
      message: '檔案大小不能超過 5MB'
    })
  }
  
  // 預設錯誤回應
  res.status(err.status || 500).json({
    error: '伺服器內部錯誤',
    message: process.env.NODE_ENV === 'development' ? err.message : '請稍後再試'
  })
})

// 啟動伺服器
const startServer = async () => {
  try {
    // 初始化資料庫
    await initDatabase()
    console.log('✅ 資料庫初始化完成')
    
    // 啟動伺服器
    app.listen(PORT, () => {
      console.log(`🚀 伺服器已啟動`)
      console.log(`📍 監聽端口: ${PORT}`)
      console.log(`🌐 環境: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📊 API 文檔: http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ 伺服器啟動失敗:', error)
    process.exit(1)
  }
}

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在關閉伺服器...')
  process.exit(0)
})

startServer() 