import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { getDatabaseConnection } from '../utils/database.js'

const router = express.Router()

// JWT 密鑰 (稍後會移到環境變數)
const JWT_SECRET = process.env.JWT_SECRET || 'fafa-default-secret-key'

// 註冊
router.post('/register', [
  body('email').isEmail().withMessage('請輸入有效的電子郵件'),
  body('password').isLength({ min: 6 }).withMessage('密碼至少需要6個字元'),
  body('companyName').notEmpty().withMessage('公司名稱不能為空'),
  body('name').notEmpty().withMessage('姓名不能為空')
], async (req, res) => {
  try {
    // 驗證輸入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入驗證失敗',
        errors: errors.array()
      })
    }

    const { email, password, companyName, name, phone } = req.body
    const db = getDatabaseConnection()

    // 檢查用戶是否已存在
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '此電子郵件已被註冊'
      })
    }

    // 加密密碼
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 創建用戶
    const userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const result = db.prepare(`
      INSERT INTO users (id, email, password, name, company_name, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, email, hashedPassword, name, companyName, phone || null)

    // 生成 JWT token
    const token = jwt.sign(
      { userId, email, name, companyName },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      success: true,
      message: '註冊成功',
      data: {
        token,
        user: {
          id: userId,
          email,
          name,
          companyName,
          phone
        }
      }
    })

  } catch (error) {
    console.error('註冊錯誤:', error)
    res.status(500).json({
      success: false,
      message: '註冊失敗，請稍後再試'
    })
  }
})

// 登入
router.post('/login', [
  body('email').isEmail().withMessage('請輸入有效的電子郵件'),
  body('password').notEmpty().withMessage('密碼不能為空')
], async (req, res) => {
  try {
    // 驗證輸入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入驗證失敗',
        errors: errors.array()
      })
    }

    const { email, password } = req.body
    const db = getDatabaseConnection()

    // 查找用戶
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '電子郵件或密碼錯誤'
      })
    }

    // 驗證密碼
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '電子郵件或密碼錯誤'
      })
    }

    // 更新最後登入時間
    const updateStmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
    updateStmt.run(user.id)

    // 生成 JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        name: user.name, 
        companyName: user.company_name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      message: '登入成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyName: user.company_name,
          phone: user.phone
        }
      }
    })

  } catch (error) {
    console.error('登入錯誤:', error)
    res.status(500).json({
      success: false,
      message: '登入失敗，請稍後再試'
    })
  }
})

// 驗證 token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供認證令牌'
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    
    res.json({
      success: true,
      data: {
        user: decoded
      }
    })

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '認證令牌已過期'
      })
    }
    
    res.status(401).json({
      success: false,
      message: '無效的認證令牌'
    })
  }
})

// 登出 (客戶端處理，清除 token)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  })
})

export default router