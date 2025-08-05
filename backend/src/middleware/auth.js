import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fafa-default-secret-key'

// 驗證 JWT token 中間件
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供認證令牌，請先登入'
      })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: '認證令牌已過期，請重新登入'
          })
        }
        return res.status(403).json({
          success: false,
          message: '無效的認證令牌'
        })
      }

      // 將用戶資訊添加到請求對象
      req.user = user
      next()
    })
  } catch (error) {
    console.error('認證中間件錯誤:', error)
    res.status(500).json({
      success: false,
      message: '認證處理失敗'
    })
  }
}

// 可選的認證中間件 (用於某些不強制登入的 API)
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      req.user = null
      return next()
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      req.user = err ? null : user
      next()
    })
  } catch (error) {
    req.user = null
    next()
  }
}