import express from 'express'
import { query, run, get } from '../utils/database.js'
import { body, validationResult } from 'express-validator'
import { buildPaginatedQuery, buildCountQuery, buildStatsQuery, sanitizeParams } from '../utils/queryBuilder.js'

const router = express.Router()

// 獲取所有收入記錄
router.get('/', async (req, res) => {
  try {
    const filters = sanitizeParams(req.query, ['status', 'customer', 'startDate', 'endDate'])
    const pagination = { page: req.query.page || 1, limit: req.query.limit || 10 }
    
    // 使用查詢建構器
    const { query: sql, params } = buildPaginatedQuery(
      'SELECT * FROM income WHERE 1=1', 
      [], 
      filters, 
      pagination
    )
    
    const incomeRecords = await query(sql, params)
    
    // 獲取總數
    const { query: countSql, params: countParams } = buildCountQuery('income', filters)
    const totalResult = await get(countSql, countParams)
    const total = totalResult.total
    
    res.json({
      success: true,
      data: incomeRecords,
      pagination: {
        page: parseInt(pagination.page),
        limit: parseInt(pagination.limit),
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    })
  } catch (error) {
    console.error('獲取收入記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取收入記錄失敗'
    })
  }
})

// 獲取單一收入記錄
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const incomeRecord = await get('SELECT * FROM income WHERE id = ?', [id])
    
    if (!incomeRecord) {
      return res.status(404).json({
        success: false,
        error: '找不到該收入記錄'
      })
    }
    
    res.json({
      success: true,
      data: incomeRecord
    })
  } catch (error) {
    console.error('獲取收入記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取收入記錄失敗'
    })
  }
})

// 新增收入記錄
router.post('/', [
  body('date').notEmpty().withMessage('日期為必填'),
  body('customer').notEmpty().withMessage('客戶名稱為必填'),
  body('description').notEmpty().withMessage('描述為必填'),
  body('amount').isFloat({ min: 0 }).withMessage('金額必須為正數'),
  body('taxRate').isFloat({ min: 0, max: 100 }).withMessage('稅率必須在0-100之間'),
  body('status').isIn(['received', 'pending', 'overdue']).withMessage('狀態值無效'),
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
    
    const {
      date,
      customer,
      description,
      amount,
      taxRate = 5,
      status = 'pending',
      paymentMethod = 'bank_transfer',
      notes
    } = req.body
    
    // 計算稅額和總金額
    const taxAmount = amount * (taxRate / 100)
    const totalAmount = amount + taxAmount
    
    // 生成收入編號
    const countResult = await get('SELECT COUNT(*) as count FROM income')
    const incomeId = `INC${String(countResult.count + 1).padStart(3, '0')}`
    
    const result = await run(`
      INSERT INTO income (
        income_id, date, customer, description, amount, tax_rate, 
        tax_amount, total_amount, status, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [incomeId, date, customer, description, amount, taxRate, taxAmount, totalAmount, status, paymentMethod, notes])
    
    // 獲取新增的記錄
    const newRecord = await get('SELECT * FROM income WHERE id = ?', [result.id])
    
    res.status(201).json({
      success: true,
      message: '收入記錄新增成功',
      data: newRecord
    })
  } catch (error) {
    console.error('新增收入記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '新增收入記錄失敗'
    })
  }
})

// 更新收入記錄
router.put('/:id', [
  body('date').notEmpty().withMessage('日期為必填'),
  body('customer').notEmpty().withMessage('客戶名稱為必填'),
  body('description').notEmpty().withMessage('描述為必填'),
  body('amount').isFloat({ min: 0 }).withMessage('金額必須為正數'),
  body('taxRate').isFloat({ min: 0, max: 100 }).withMessage('稅率必須在0-100之間'),
  body('status').isIn(['received', 'pending', 'overdue']).withMessage('狀態值無效'),
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
    const {
      date,
      customer,
      description,
      amount,
      taxRate = 5,
      status = 'pending',
      paymentMethod = 'bank_transfer',
      notes
    } = req.body
    
    // 檢查記錄是否存在
    const existingRecord = await get('SELECT * FROM income WHERE id = ?', [id])
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: '找不到該收入記錄'
      })
    }
    
    // 計算稅額和總金額
    const taxAmount = amount * (taxRate / 100)
    const totalAmount = amount + taxAmount
    
    const result = await run(`
      UPDATE income SET 
        date = ?, customer = ?, description = ?, amount = ?, 
        tax_rate = ?, tax_amount = ?, total_amount = ?, 
        status = ?, payment_method = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [date, customer, description, amount, taxRate, taxAmount, totalAmount, status, paymentMethod, notes, id])
    
    if (result.changes === 0) {
      return res.status(400).json({
        success: false,
        error: '更新失敗'
      })
    }
    
    // 獲取更新後的記錄
    const updatedRecord = await get('SELECT * FROM income WHERE id = ?', [id])
    
    res.json({
      success: true,
      message: '收入記錄更新成功',
      data: updatedRecord
    })
  } catch (error) {
    console.error('更新收入記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '更新收入記錄失敗'
    })
  }
})

// 刪除收入記錄
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 檢查記錄是否存在
    const existingRecord = await get('SELECT * FROM income WHERE id = ?', [id])
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: '找不到該收入記錄'
      })
    }
    
    const result = await run('DELETE FROM income WHERE id = ?', [id])
    
    if (result.changes === 0) {
      return res.status(400).json({
        success: false,
        error: '刪除失敗'
      })
    }
    
    res.json({
      success: true,
      message: '收入記錄刪除成功'
    })
  } catch (error) {
    console.error('刪除收入記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '刪除收入記錄失敗'
    })
  }
})

// 獲取收入統計
router.get('/stats/summary', async (req, res) => {
  try {
    const filters = sanitizeParams(req.query, ['startDate', 'endDate'])
    
    // 使用查詢建構器
    const { query: sql, params } = buildStatsQuery('income', filters)
    const stats = await get(sql, params)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('獲取收入統計失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取收入統計失敗'
    })
  }
})

export default router 