import express from 'express'
import { query, run, get } from '../utils/database.js'
import { body, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 獲取支出記錄 (需要認證)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 10, status, category, vendor, startDate, endDate } = req.query
    
    let sql = 'SELECT * FROM expense WHERE user_id = ?'
    const params = [userId]
    
    // 篩選條件
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    
    if (vendor) {
      sql += ' AND vendor LIKE ?'
      params.push(`%${vendor}%`)
    }
    
    if (startDate) {
      sql += ' AND date >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ' AND date <= ?'
      params.push(endDate)
    }
    
    // 排序
    sql += ' ORDER BY date DESC, created_at DESC'
    
    // 分頁
    const offset = (page - 1) * limit
    sql += ' LIMIT ? OFFSET ?'
    params.push(parseInt(limit), offset)
    
    const expenseRecords = await query(sql, params)
    
    // 獲取總數 (只計算當前用戶的記錄)
    let countSql = 'SELECT COUNT(*) as total FROM expense WHERE user_id = ?'
    const countParams = [userId]
    
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }
    
    if (category) {
      countSql += ' AND category = ?'
      countParams.push(category)
    }
    
    if (vendor) {
      countSql += ' AND vendor LIKE ?'
      countParams.push(`%${vendor}%`)
    }
    
    if (startDate) {
      countSql += ' AND date >= ?'
      countParams.push(startDate)
    }
    
    if (endDate) {
      countSql += ' AND date <= ?'
      countParams.push(endDate)
    }
    
    const totalResult = await get(countSql, countParams)
    const total = totalResult.total
    
    res.json({
      success: true,
      data: expenseRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('獲取支出記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取支出記錄失敗'
    })
  }
})

// 獲取單一支出記錄 (需要認證)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    
    const expenseRecord = await get('SELECT * FROM expense WHERE id = ? AND user_id = ?', [id, userId])
    
    if (!expenseRecord) {
      return res.status(404).json({
        success: false,
        error: '找不到該支出記錄'
      })
    }
    
    res.json({
      success: true,
      data: expenseRecord
    })
  } catch (error) {
    console.error('獲取支出記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取支出記錄失敗'
    })
  }
})

// 新增支出記錄 (需要認證)
router.post('/', authenticateToken, [
  body('date').notEmpty().withMessage('日期為必填'),
  body('vendor').notEmpty().withMessage('供應商為必填'),
  body('description').notEmpty().withMessage('描述為必填'),
  body('category').notEmpty().withMessage('分類為必填'),
  body('amount').isFloat({ min: 0 }).withMessage('金額必須為正數'),
  body('taxRate').isFloat({ min: 0, max: 100 }).withMessage('稅率必須在0-100之間'),
  body('status').isIn(['paid', 'pending', 'overdue']).withMessage('狀態值無效'),
  body('paymentMethod').isIn(['bank_transfer', 'check', 'cash', 'credit_card']).withMessage('付款方式無效')
], async (req, res) => {
  try {
    // 驗證輸入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '資料驗證失敗',
        details: errors.array()
      })
    }
    
    const userId = req.user.userId
    const {
      date,
      vendor,
      description,
      category,
      amount,
      taxRate = 5,
      status = 'pending',
      paymentMethod = 'bank_transfer',
      receiptPath,
      notes
    } = req.body
    
    // 計算稅額和總金額
    const taxAmount = amount * (taxRate / 100)
    const totalAmount = amount + taxAmount
    
    // 生成支出編號 (只計算當前用戶的記錄)
    const countResult = await get('SELECT COUNT(*) as count FROM expense WHERE user_id = ?', [userId])
    const expenseId = `EXP${String(countResult.count + 1).padStart(3, '0')}`
    
    const result = await run(`
      INSERT INTO expense (
        expense_id, user_id, date, vendor, description, category, amount, tax_rate, 
        tax_amount, total_amount, status, payment_method, receipt_path, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [expenseId, userId, date, vendor, description, category, amount, taxRate, taxAmount, totalAmount, status, paymentMethod, receiptPath, notes])
    
    // 獲取新增的記錄
    const newRecord = await get('SELECT * FROM expense WHERE id = ?', [result.id])
    
    res.status(201).json({
      success: true,
      message: '支出記錄新增成功',
      data: newRecord
    })
  } catch (error) {
    console.error('新增支出記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '新增支出記錄失敗'
    })
  }
})

// 更新支出記錄 (需要認證)
router.put('/:id', authenticateToken, [
  body('date').notEmpty().withMessage('日期為必填'),
  body('vendor').notEmpty().withMessage('供應商為必填'),
  body('description').notEmpty().withMessage('描述為必填'),
  body('category').notEmpty().withMessage('分類為必填'),
  body('amount').isFloat({ min: 0 }).withMessage('金額必須為正數'),
  body('taxRate').isFloat({ min: 0, max: 100 }).withMessage('稅率必須在0-100之間'),
  body('status').isIn(['paid', 'pending', 'overdue']).withMessage('狀態值無效'),
  body('paymentMethod').isIn(['bank_transfer', 'check', 'cash', 'credit_card']).withMessage('付款方式無效')
], async (req, res) => {
  try {
    // 驗證輸入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '資料驗證失敗',
        details: errors.array()
      })
    }
    
    const { id } = req.params
    const userId = req.user.userId
    const {
      date,
      vendor,
      description,
      category,
      amount,
      taxRate = 5,
      status = 'pending',
      paymentMethod = 'bank_transfer',
      receiptPath,
      notes
    } = req.body
    
    // 檢查記錄是否存在且屬於當前用戶
    const existingRecord = await get('SELECT * FROM expense WHERE id = ? AND user_id = ?', [id, userId])
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: '找不到該支出記錄或您沒有權限修改'
      })
    }
    
    // 計算稅額和總金額
    const taxAmount = amount * (taxRate / 100)
    const totalAmount = amount + taxAmount
    
    const result = await run(`
      UPDATE expense SET 
        date = ?, vendor = ?, description = ?, category = ?, amount = ?, 
        tax_rate = ?, tax_amount = ?, total_amount = ?, 
        status = ?, payment_method = ?, receipt_path = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [date, vendor, description, category, amount, taxRate, taxAmount, totalAmount, status, paymentMethod, receiptPath, notes, id])
    
    if (result.changes === 0) {
      return res.status(400).json({
        success: false,
        error: '更新失敗'
      })
    }
    
    // 獲取更新後的記錄
    const updatedRecord = await get('SELECT * FROM expense WHERE id = ?', [id])
    
    res.json({
      success: true,
      message: '支出記錄更新成功',
      data: updatedRecord
    })
  } catch (error) {
    console.error('更新支出記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '更新支出記錄失敗'
    })
  }
})

// 刪除支出記錄 (需要認證)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    
    // 檢查記錄是否存在且屬於當前用戶
    const existingRecord = await get('SELECT * FROM expense WHERE id = ? AND user_id = ?', [id, userId])
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: '找不到該支出記錄或您沒有權限刪除'
      })
    }
    
    const result = await run('DELETE FROM expense WHERE id = ? AND user_id = ?', [id, userId])
    
    if (result.changes === 0) {
      return res.status(400).json({
        success: false,
        error: '刪除失敗'
      })
    }
    
    res.json({
      success: true,
      message: '支出記錄刪除成功'
    })
  } catch (error) {
    console.error('刪除支出記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '刪除支出記錄失敗'
    })
  }
})

// 獲取支出統計
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { startDate, endDate } = req.query
    
    let sql = `
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        SUM(tax_amount) as total_tax,
        SUM(total_amount) as total_with_tax,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as overdue_amount
      FROM expense
      WHERE user_id = ?
    `
    const params = [userId]
    
    if (startDate) {
      sql += ' AND date >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ' AND date <= ?'
      params.push(endDate)
    }
    
    const stats = await get(sql, params)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('獲取支出統計失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取支出統計失敗'
    })
  }
})

// 獲取支出分類統計
router.get('/stats/by-category', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { startDate, endDate } = req.query
    
    let sql = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM(tax_amount) as total_tax,
        SUM(total_amount) as total_with_tax
      FROM expense
      WHERE user_id = ?
    `
    const params = [userId]
    
    if (startDate) {
      sql += ' AND date >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ' AND date <= ?'
      params.push(endDate)
    }
    
    sql += ' GROUP BY category ORDER BY total_amount DESC'
    
    const categoryStats = await query(sql, params)
    
    res.json({
      success: true,
      data: categoryStats
    })
  } catch (error) {
    console.error('獲取支出分類統計失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取支出分類統計失敗'
    })
  }
})

// 支出趨勢洞察分析
router.get('/insights/expense-trend', authenticateToken, async (req, res) => {
  try {
    // 獲取當前日期
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() 返回 0-11
    
    // 計算上個月的年份和月份
    let lastMonth = currentMonth - 1
    let lastYear = currentYear
    if (lastMonth === 0) {
      lastMonth = 12
      lastYear = currentYear - 1
    }
    
    // 格式化月份為兩位數
    const currentMonthStr = String(currentMonth).padStart(2, '0')
    const lastMonthStr = String(lastMonth).padStart(2, '0')
    
    const userId = req.user.userId
    
    // 查詢本月支出總和
    const currentMonthSql = `
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM expense 
      WHERE user_id = ? AND strftime('%Y-%m', date) = ?
    `
    const currentMonthResult = await get(currentMonthSql, [userId, `${currentYear}-${currentMonthStr}`])
    const currentMonthTotal = currentMonthResult.total
    
    // 查詢上個月支出總和
    const lastMonthSql = `
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM expense 
      WHERE user_id = ? AND strftime('%Y-%m', date) = ?
    `
    const lastMonthResult = await get(lastMonthSql, [userId, `${lastYear}-${lastMonthStr}`])
    const lastMonthTotal = lastMonthResult.total
    
    // 計算差額和百分比變化
    const difference = currentMonthTotal - lastMonthTotal
    const percentageChange = lastMonthTotal > 0 
      ? ((difference / lastMonthTotal) * 100).toFixed(2)
      : 0
    
    // 判斷趨勢
    const trend = difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'stable'
    
    res.json({
      success: true,
      data: {
        currentMonth: {
          year: currentYear,
          month: currentMonth,
          total: currentMonthTotal
        },
        lastMonth: {
          year: lastYear,
          month: lastMonth,
          total: lastMonthTotal
        },
        difference: difference,
        percentageChange: parseFloat(percentageChange),
        trend: trend
      }
    })
  } catch (error) {
    console.error('獲取支出趨勢分析失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取支出趨勢分析失敗'
    })
  }
})

export default router 