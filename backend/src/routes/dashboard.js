import express from 'express'
import { query, get } from '../utils/database.js'

const router = express.Router()

// 獲取儀表板概覽數據
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // 設定預設日期範圍（當前月份）
    const now = new Date()
    const defaultStartDate = startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultEndDate = endDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    // 獲取收入統計
    const incomeStats = await get(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM(tax_amount) as total_tax,
        SUM(total_amount) as total_with_tax,
        SUM(CASE WHEN status = 'received' THEN total_amount ELSE 0 END) as received_amount,
        SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as overdue_amount
      FROM income 
      WHERE date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate])
    
    // 獲取支出統計
    const expenseStats = await get(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM(tax_amount) as total_tax,
        SUM(total_amount) as total_with_tax,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as overdue_amount
      FROM expense 
      WHERE date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate])
    
    // 計算淨利
    const netIncome = (incomeStats.total_amount || 0) - (expenseStats.total_amount || 0)
    
    // 計算現金餘額（簡化計算）
    const currentBalance = (incomeStats.received_amount || 0) - (expenseStats.paid_amount || 0)
    
    const overview = {
      period: {
        startDate: defaultStartDate,
        endDate: defaultEndDate
      },
      income: {
        count: incomeStats.count || 0,
        totalAmount: incomeStats.total_amount || 0,
        totalTax: incomeStats.total_tax || 0,
        totalWithTax: incomeStats.total_with_tax || 0,
        receivedAmount: incomeStats.received_amount || 0,
        pendingAmount: incomeStats.pending_amount || 0,
        overdueAmount: incomeStats.overdue_amount || 0
      },
      expense: {
        count: expenseStats.count || 0,
        totalAmount: expenseStats.total_amount || 0,
        totalTax: expenseStats.total_tax || 0,
        totalWithTax: expenseStats.total_with_tax || 0,
        paidAmount: expenseStats.paid_amount || 0,
        pendingAmount: expenseStats.pending_amount || 0,
        overdueAmount: expenseStats.overdue_amount || 0
      },
      summary: {
        netIncome,
        currentBalance,
        accountsReceivable: incomeStats.pending_amount || 0,
        accountsPayable: expenseStats.pending_amount || 0
      }
    }
    
    res.json({
      success: true,
      data: overview
    })
  } catch (error) {
    console.error('獲取儀表板概覽失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取儀表板概覽失敗'
    })
  }
})

// 獲取現金流趨勢
router.get('/cash-flow', async (req, res) => {
  try {
    const { months = 6 } = req.query
    
    const cashFlowData = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      const endDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()).padStart(2, '0')}`
      
      // 獲取該月收入
      const incomeResult = await get(`
        SELECT 
          SUM(amount) as income,
          SUM(CASE WHEN status = 'received' THEN total_amount ELSE 0 END) as received_income
        FROM income 
        WHERE date BETWEEN ? AND ?
      `, [startDate, endDate])
      
      // 獲取該月支出
      const expenseResult = await get(`
        SELECT 
          SUM(amount) as expense,
          SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_expense
        FROM expense 
        WHERE date BETWEEN ? AND ?
      `, [startDate, endDate])
      
      const income = incomeResult.income || 0
      const expense = expenseResult.expense || 0
      const balance = income - expense
      
      cashFlowData.push({
        month: `${date.getMonth() + 1}月`,
        year: date.getFullYear(),
        income,
        expense,
        balance,
        receivedIncome: incomeResult.received_income || 0,
        paidExpense: expenseResult.paid_expense || 0
      })
    }
    
    res.json({
      success: true,
      data: cashFlowData
    })
  } catch (error) {
    console.error('獲取現金流趨勢失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取現金流趨勢失敗'
    })
  }
})

// 獲取最近交易記錄
router.get('/recent-transactions', async (req, res) => {
  try {
    const { limit = 10 } = req.query
    
    // 獲取最近收入記錄
    const recentIncome = await query(`
      SELECT 
        id,
        income_id as transaction_id,
        date,
        customer as description,
        amount,
        total_amount,
        status,
        'income' as type,
        created_at
      FROM income 
      ORDER BY date DESC, created_at DESC 
      LIMIT ?
    `, [parseInt(limit)])
    
    // 獲取最近支出記錄
    const recentExpense = await query(`
      SELECT 
        id,
        expense_id as transaction_id,
        date,
        description,
        amount,
        total_amount,
        status,
        'expense' as type,
        created_at
      FROM expense 
      ORDER BY date DESC, created_at DESC 
      LIMIT ?
    `, [parseInt(limit)])
    
    // 合併並排序
    const allTransactions = [...recentIncome, ...recentExpense]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit))
    
    res.json({
      success: true,
      data: allTransactions
    })
  } catch (error) {
    console.error('獲取最近交易記錄失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取最近交易記錄失敗'
    })
  }
})

// 獲取收入支出分類統計
router.get('/category-breakdown', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // 設定預設日期範圍（當前月份）
    const now = new Date()
    const defaultStartDate = startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultEndDate = endDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    // 獲取支出分類統計
    const expenseCategories = await query(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM expense 
      WHERE date BETWEEN ? AND ?
      GROUP BY category 
      ORDER BY total_amount DESC
    `, [defaultStartDate, defaultEndDate])
    
    // 獲取收入客戶統計
    const incomeCustomers = await query(`
      SELECT 
        customer as category,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM income 
      WHERE date BETWEEN ? AND ?
      GROUP BY customer 
      ORDER BY total_amount DESC
      LIMIT 10
    `, [defaultStartDate, defaultEndDate])
    
    res.json({
      success: true,
      data: {
        expenseCategories,
        incomeCustomers,
        period: {
          startDate: defaultStartDate,
          endDate: defaultEndDate
        }
      }
    })
  } catch (error) {
    console.error('獲取分類統計失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取分類統計失敗'
    })
  }
})

// 獲取財務健康指標
router.get('/financial-health', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // 設定預設日期範圍（當前月份）
    const now = new Date()
    const defaultStartDate = startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultEndDate = endDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    // 獲取收入支出數據
    const incomeResult = await get(`
      SELECT 
        SUM(amount) as total_income,
        SUM(CASE WHEN status = 'received' THEN total_amount ELSE 0 END) as received_income,
        COUNT(*) as income_count
      FROM income 
      WHERE date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate])
    
    const expenseResult = await get(`
      SELECT 
        SUM(amount) as total_expense,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_expense,
        COUNT(*) as expense_count
      FROM expense 
      WHERE date BETWEEN ? AND ?
    `, [defaultStartDate, defaultEndDate])
    
    const totalIncome = incomeResult.total_income || 0
    const totalExpense = expenseResult.total_expense || 0
    const netIncome = totalIncome - totalExpense
    
    // 計算財務健康指標
    const profitMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0
    const cashFlowRatio = (incomeResult.received_income || 0) > 0 ? 
      ((incomeResult.received_income || 0) / (expenseResult.paid_expense || 1)) : 0
    
    // 評估財務健康狀況
    let healthScore = 0
    let healthStatus = 'poor'
    let healthMessage = '財務狀況需要改善'
    
    if (profitMargin >= 20) {
      healthScore += 30
      healthStatus = 'excellent'
      healthMessage = '財務狀況優秀'
    } else if (profitMargin >= 10) {
      healthScore += 20
      healthStatus = 'good'
      healthMessage = '財務狀況良好'
    } else if (profitMargin >= 0) {
      healthScore += 10
      healthStatus = 'fair'
      healthMessage = '財務狀況一般'
    }
    
    if (cashFlowRatio >= 1.5) {
      healthScore += 40
    } else if (cashFlowRatio >= 1.0) {
      healthScore += 30
    } else if (cashFlowRatio >= 0.5) {
      healthScore += 20
    }
    
    if (expenseRatio <= 70) {
      healthScore += 30
    } else if (expenseRatio <= 85) {
      healthScore += 20
    } else if (expenseRatio <= 95) {
      healthScore += 10
    }
    
    const financialHealth = {
      period: {
        startDate: defaultStartDate,
        endDate: defaultEndDate
      },
      metrics: {
        totalIncome,
        totalExpense,
        netIncome,
        profitMargin: Math.round(profitMargin * 100) / 100,
        expenseRatio: Math.round(expenseRatio * 100) / 100,
        cashFlowRatio: Math.round(cashFlowRatio * 100) / 100
      },
      health: {
        score: healthScore,
        status: healthStatus,
        message: healthMessage
      },
      summary: {
        incomeCount: incomeResult.income_count || 0,
        expenseCount: expenseResult.expense_count || 0,
        receivedIncome: incomeResult.received_income || 0,
        paidExpense: expenseResult.paid_expense || 0
      }
    }
    
    res.json({
      success: true,
      data: financialHealth
    })
  } catch (error) {
    console.error('獲取財務健康指標失敗:', error)
    res.status(500).json({
      success: false,
      error: '獲取財務健康指標失敗'
    })
  }
})

export default router 