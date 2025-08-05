import express from 'express'
import { query, get } from '../utils/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 獲取損益表
router.get('/income-statement', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { startDate, endDate } = req.query
    
    // 設定預設日期範圍（當前月份）
    const now = new Date()
    const defaultStartDate = startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultEndDate = endDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    // 獲取收入數據
    const incomeResult = await get(`
      SELECT 
        SUM(amount) as revenue,
        SUM(tax_amount) as revenue_tax
      FROM income 
      WHERE user_id = ? AND date BETWEEN ? AND ?
    `, [userId, defaultStartDate, defaultEndDate])
    
    // 獲取支出數據
    const expenseResult = await get(`
      SELECT 
        SUM(amount) as total_expenses,
        SUM(tax_amount) as expense_tax
      FROM expense 
      WHERE user_id = ? AND date BETWEEN ? AND ?
    `, [userId, defaultStartDate, defaultEndDate])
    
    const revenue = incomeResult.revenue || 0
    const totalExpenses = expenseResult.total_expenses || 0
    const grossProfit = revenue - totalExpenses
    const netIncome = grossProfit
    
    const incomeStatement = {
      period: {
        startDate: defaultStartDate,
        endDate: defaultEndDate
      },
      revenue: {
        amount: revenue,
        tax: incomeResult.revenue_tax || 0
      },
      expenses: {
        amount: totalExpenses,
        tax: expenseResult.expense_tax || 0
      },
      grossProfit,
      netIncome
    }
    
    res.json({
      success: true,
      data: incomeStatement
    })
  } catch (error) {
    console.error('獲取損益表失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取損益表失敗'
    })
  }
})

// 獲取支出分類明細
router.get('/expense-breakdown', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { startDate, endDate } = req.query
    
    // 設定預設日期範圍（當前月份）
    const now = new Date()
    const defaultStartDate = startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultEndDate = endDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    const expenseBreakdown = await query(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as amount,
        SUM(tax_amount) as tax_amount,
        SUM(total_amount) as total_amount
      FROM expense 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY category 
      ORDER BY amount DESC
    `, [userId, defaultStartDate, defaultEndDate])
    
    res.json({
      success: true,
      data: {
        period: {
          startDate: defaultStartDate,
          endDate: defaultEndDate
        },
        breakdown: expenseBreakdown
      }
    })
  } catch (error) {
    console.error('獲取支出分類明細失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取支出分類明細失敗'
    })
  }
})

export default router 