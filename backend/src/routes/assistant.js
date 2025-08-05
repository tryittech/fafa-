import express from 'express'
import { query, get } from '../utils/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 智能收支分類建議
router.post('/classify-transaction', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { description, amount, type } = req.body

    // 獲取歷史分類數據進行智能匹配
    const historicalQuery = `
      SELECT category, COUNT(*) as frequency
      FROM ${type} 
      WHERE user_id = ? AND (
        description LIKE ? OR 
        customer LIKE ? OR 
        vendor LIKE ?
      )
      GROUP BY category
      ORDER BY frequency DESC
      LIMIT 5
    `

    const searchTerm = `%${description}%`
    const historicalData = await query(historicalQuery, [userId, searchTerm, searchTerm, searchTerm]) || []

    // 關鍵字分類規則
    const categoryRules = {
      income: {
        '銷售': ['銷售', '售', '收入', '營收', '服務費'],
        '諮詢': ['諮詢', '顧問', '咨詢', '建議'],
        '租金': ['租金', '房租', '租賃'],
        '利息': ['利息', '股息', '投資收益'],
        '其他': []
      },
      expense: {
        '辦公': ['辦公', '文具', '用品', '設備'],
        '租金': ['租金', '房租', '租賃'],
        '薪資': ['薪資', '工資', '薪水', '人事'],
        '水電': ['水電', '電費', '水費', '瓦斯'],
        '交通': ['交通', '油費', '停車', '計程車'],
        '餐飲': ['餐', '飯', '午餐', '晚餐', '咖啡'],
        '行銷': ['廣告', '行銷', '宣傳', '推廣'],
        '其他': []
      }
    }

    // 智能匹配分類
    let suggestedCategory = '其他'
    let confidence = 0

    // 1. 優先使用歷史數據
    if (historicalData.length > 0) {
      suggestedCategory = historicalData[0].category
      confidence = Math.min(0.9, historicalData[0].frequency * 0.1 + 0.3)
    } else {
      // 2. 使用關鍵字匹配
      const rules = categoryRules[type] || {}
      for (const [category, keywords] of Object.entries(rules)) {
        for (const keyword of keywords) {
          if (description.toLowerCase().includes(keyword)) {
            suggestedCategory = category
            confidence = 0.7
            break
          }
        }
        if (confidence > 0) break
      }
    }

    // 3. 金額範圍分析
    const amountInsights = await analyzeAmountRange(userId, type, amount)

    res.json({
      success: true,
      data: {
        suggestedCategory,
        confidence,
        alternatives: historicalData.slice(1, 4).map(h => h.category),
        amountInsights,
        explanation: confidence > 0.5 
          ? `基於歷史數據，建議分類為「${suggestedCategory}」`
          : `根據描述關鍵字，建議分類為「${suggestedCategory}」`
      }
    })

  } catch (error) {
    console.error('分類建議錯誤:', error)
    res.status(500).json({
      success: false,
      message: '智能分類失敗',
      error: error.message
    })
  }
})

// 智能提醒系統
router.get('/reminders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const reminders = []

    // 1. 未收款提醒
    const overdueIncomeQuery = `
      SELECT * FROM income 
      WHERE user_id = ? AND status = 'pending' 
      AND date <= date('now', '-7 days')
      ORDER BY date DESC
      LIMIT 5
    `
    const overdueIncome = await query(overdueIncomeQuery, [userId]) || []

    overdueIncome.forEach(income => {
      const daysPast = Math.floor((new Date() - new Date(income.date)) / (1000 * 60 * 60 * 24))
      reminders.push({
        type: 'overdue_income',
        priority: daysPast > 30 ? 'high' : 'medium',
        title: '應收款項逾期',
        message: `${income.customer} 的款項已逾期 ${daysPast} 天，金額 $${income.amount.toLocaleString()}`,
        action: '聯絡客戶',
        data: income
      })
    })

    // 2. 重複支出檢測
    const duplicateExpenseQuery = `
      SELECT description, vendor, amount, COUNT(*) as count
      FROM expense 
      WHERE user_id = ? AND date >= date('now', '-7 days')
      GROUP BY description, vendor, amount
      HAVING count > 1
    `
    const duplicateExpenses = await query(duplicateExpenseQuery, [userId]) || []

    duplicateExpenses.forEach(expense => {
      reminders.push({
        type: 'duplicate_expense',
        priority: 'medium',
        title: '疑似重複支出',
        message: `檢測到相同的支出記錄：${expense.description}，金額 $${expense.amount.toLocaleString()}，出現 ${expense.count} 次`,
        action: '檢查記錄',
        data: expense
      })
    })

    // 3. 現金流預警
    const currentBalanceQuery = `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = ?) -
        (SELECT COALESCE(SUM(amount), 0) FROM expense WHERE user_id = ?) as balance
    `
    const balanceResult = await get(currentBalanceQuery, [userId, userId])
    const currentBalance = balanceResult?.balance || 0

    if (currentBalance < 50000) {
      reminders.push({
        type: 'cash_flow_warning',
        priority: currentBalance < 0 ? 'high' : 'medium',
        title: '現金流預警',
        message: `目前現金餘額：$${currentBalance.toLocaleString()}，建議關注現金流狀況`,
        action: '查看現金流預測',
        data: { balance: currentBalance }
      })
    }

    // 4. 月度總結提醒
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyStatsQuery = `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = ? AND strftime('%Y-%m', date) = ?) as income,
        (SELECT COALESCE(SUM(amount), 0) FROM expense WHERE user_id = ? AND strftime('%Y-%m', date) = ?) as expense
    `
    const monthlyStats = await get(monthlyStatsQuery, [userId, currentMonth, userId, currentMonth])
    
    if (monthlyStats && new Date().getDate() > 25) {
      const profit = (monthlyStats.income || 0) - (monthlyStats.expense || 0)
      reminders.push({
        type: 'monthly_summary',
        priority: 'low',
        title: '月度財務總結',
        message: `本月收入 $${(monthlyStats.income || 0).toLocaleString()}，支出 $${(monthlyStats.expense || 0).toLocaleString()}，淨收入 $${profit.toLocaleString()}`,
        action: '查看月度報表',
        data: monthlyStats
      })
    }

    // 按優先級排序
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    reminders.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

    res.json({
      success: true,
      data: {
        reminders,
        summary: {
          total: reminders.length,
          high: reminders.filter(r => r.priority === 'high').length,
          medium: reminders.filter(r => r.priority === 'medium').length,
          low: reminders.filter(r => r.priority === 'low').length
        }
      }
    })

  } catch (error) {
    console.error('智能提醒錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取智能提醒失敗',
      error: error.message
    })
  }
})

// 財務健康評分
router.get('/health-score', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // 獲取最近3個月數據
    const recentDataQuery = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM (
        SELECT date, amount, 'income' as type FROM income WHERE user_id = ?
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expense WHERE user_id = ?
      )
      WHERE date >= date('now', '-3 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `

    const recentData = await query(recentDataQuery, [userId, userId]) || []

    // 計算各項指標
    let scores = {
      profitability: 0,    // 獲利能力
      stability: 0,        // 穩定性
      growth: 0,          // 成長性
      efficiency: 0,       // 效率
      cashFlow: 0         // 現金流
    }

    if (recentData.length >= 2) {
      // 1. 獲利能力評分 (0-25分)
      const avgProfit = recentData.reduce((acc, month) => acc + (month.income - month.expense), 0) / recentData.length
      const avgIncome = recentData.reduce((acc, month) => acc + month.income, 0) / recentData.length
      const profitMargin = avgIncome > 0 ? (avgProfit / avgIncome) * 100 : 0
      scores.profitability = Math.min(25, Math.max(0, profitMargin > 0 ? 15 + profitMargin * 0.5 : 0))

      // 2. 穩定性評分 (0-25分)
      const profitVariance = recentData.reduce((acc, month) => {
        const monthProfit = month.income - month.expense
        return acc + Math.pow(monthProfit - avgProfit, 2)
      }, 0) / recentData.length
      const stabilityScore = Math.max(0, 25 - Math.sqrt(profitVariance) / 10000)
      scores.stability = Math.min(25, stabilityScore)

      // 3. 成長性評分 (0-20分)
      if (recentData.length >= 2) {
        const firstMonth = recentData[0]
        const lastMonth = recentData[recentData.length - 1]
        const growthRate = firstMonth.income > 0 ? 
          ((lastMonth.income - firstMonth.income) / firstMonth.income) * 100 : 0
        scores.growth = Math.min(20, Math.max(0, 10 + growthRate * 0.5))
      }

      // 4. 效率評分 (0-15分)
      const avgExpenseRatio = recentData.reduce((acc, month) => {
        return acc + (month.income > 0 ? (month.expense / month.income) : 1)
      }, 0) / recentData.length
      scores.efficiency = Math.min(15, Math.max(0, 15 - avgExpenseRatio * 10))

      // 5. 現金流評分 (0-15分)
      const currentBalance = await getCurrentBalance(userId)
      scores.cashFlow = Math.min(15, Math.max(0, currentBalance > 0 ? 10 + Math.log10(currentBalance / 10000) : 0))
    }

    const totalScore = Object.values(scores).reduce((acc, score) => acc + score, 0)
    const grade = getHealthGrade(totalScore)

    // 生成建議
    const suggestions = generateHealthSuggestions(scores, totalScore)

    res.json({
      success: true,
      data: {
        totalScore: Math.round(totalScore),
        grade,
        scores: Object.fromEntries(
          Object.entries(scores).map(([key, value]) => [key, Math.round(value)])
        ),
        suggestions,
        interpretation: {
          excellent: totalScore >= 85,
          good: totalScore >= 70 && totalScore < 85,
          fair: totalScore >= 50 && totalScore < 70,
          poor: totalScore < 50
        }
      }
    })

  } catch (error) {
    console.error('健康評分錯誤:', error)
    res.status(500).json({
      success: false,
      message: '計算財務健康評分失敗',
      error: error.message
    })
  }
})

// 輔助函數：分析金額範圍
async function analyzeAmountRange(userId, type, amount) {
  try {
    const rangeQuery = `
      SELECT 
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount,
        COUNT(*) as count
      FROM ${type} 
      WHERE user_id = ? AND date >= date('now', '-3 months')
    `
    
    const rangeData = await get(rangeQuery, [userId])
    
    if (!rangeData || rangeData.count === 0) {
      return { message: '缺乏歷史數據進行比較' }
    }

    const avgAmount = rangeData.avg_amount
    const deviation = Math.abs(amount - avgAmount) / avgAmount

    return {
      isUnusual: deviation > 0.5,
      comparison: amount > avgAmount ? '高於平均' : '低於平均',
      avgAmount: Math.round(avgAmount),
      deviation: Math.round(deviation * 100)
    }
  } catch (error) {
    return { message: '無法分析金額範圍' }
  }
}

// 輔助函數：獲取當前餘額
async function getCurrentBalance(userId) {
  try {
    const balanceQuery = `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = ?) -
        (SELECT COALESCE(SUM(amount), 0) FROM expense WHERE user_id = ?) as balance
    `
    const result = await get(balanceQuery, [userId, userId])
    return result?.balance || 0
  } catch (error) {
    return 0
  }
}

// 輔助函數：獲取健康等級
function getHealthGrade(score) {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 50) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

// 輔助函數：生成健康建議
function generateHealthSuggestions(scores, totalScore) {
  const suggestions = []

  if (scores.profitability < 15) {
    suggestions.push({
      category: '獲利能力',
      issue: '利潤率偏低',
      suggestion: '檢討收入來源，優化成本結構',
      priority: 'high'
    })
  }

  if (scores.stability < 15) {
    suggestions.push({
      category: '穩定性',
      issue: '收支波動較大',
      suggestion: '建立穩定的收入來源，控制支出變動',
      priority: 'medium'
    })
  }

  if (scores.growth < 10) {
    suggestions.push({
      category: '成長性',
      issue: '收入成長停滯',
      suggestion: '開發新客戶，擴展業務範圍',
      priority: 'medium'
    })
  }

  if (scores.efficiency < 10) {
    suggestions.push({
      category: '效率',
      issue: '支出比例過高',
      suggestion: '優化營運流程，減少不必要支出',
      priority: 'high'
    })
  }

  if (scores.cashFlow < 10) {
    suggestions.push({
      category: '現金流',
      issue: '現金餘額不足',
      suggestion: '加強應收帳款管理，準備緊急資金',
      priority: 'high'
    })
  }

  return suggestions
}

// 智能報表生成
router.post('/generate-smart-report', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { reportType, dateRange } = req.body

    let startDate, endDate
    if (dateRange === 'this_month') {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      endDate = new Date().toISOString().split('T')[0]
    } else if (dateRange === 'last_month') {
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      startDate = lastMonth.toISOString().split('T')[0]
      endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    } else if (dateRange === 'this_quarter') {
      const quarter = Math.floor(new Date().getMonth() / 3)
      startDate = new Date(new Date().getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
      endDate = new Date().toISOString().split('T')[0]
    }

    // 獲取基礎數據
    const [incomeData, expenseData] = await Promise.all([
      query(`
        SELECT 
          category,
          customer,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount,
          MAX(amount) as max_amount,
          MIN(amount) as min_amount
        FROM income 
        WHERE user_id = ? AND date BETWEEN ? AND ?
        GROUP BY category, customer
        ORDER BY total_amount DESC
      `, [userId, startDate, endDate]),
      
      query(`
        SELECT 
          category,
          vendor,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount,
          MAX(amount) as max_amount,
          MIN(amount) as min_amount
        FROM expense 
        WHERE user_id = ? AND date BETWEEN ? AND ?
        GROUP BY category, vendor
        ORDER BY total_amount DESC
      `, [userId, startDate, endDate])
    ])

    let report = {}

    switch (reportType) {
      case 'business_insights':
        report = await generateBusinessInsightsReport(userId, incomeData, expenseData, startDate, endDate)
        break
      case 'cash_flow_analysis':
        report = await generateCashFlowAnalysisReport(userId, startDate, endDate)
        break
      case 'profitability_report':
        report = await generateProfitabilityReport(userId, incomeData, expenseData, startDate, endDate)
        break
      default:
        throw new Error('不支援的報表類型')
    }

    res.json({
      success: true,
      data: {
        reportType,
        dateRange: { startDate, endDate },
        generatedAt: new Date().toISOString(),
        report
      }
    })

  } catch (error) {
    console.error('智能報表生成錯誤:', error)
    res.status(500).json({
      success: false,
      message: '智能報表生成失敗',
      error: error.message
    })
  }
})

// 財務目標追蹤
router.get('/financial-goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // 獲取當前財務狀況
    const currentMonth = new Date().toISOString().slice(0, 7)
    const financialStatsQuery = `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = ? AND strftime('%Y-%m', date) = ?) as current_income,
        (SELECT COALESCE(SUM(amount), 0) FROM expense WHERE user_id = ? AND strftime('%Y-%m', date) = ?) as current_expense,
        (SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = ?) as total_income,
        (SELECT COALESCE(SUM(amount), 0) FROM expense WHERE user_id = ?) as total_expense
    `
    
    const stats = await get(financialStatsQuery, [userId, currentMonth, userId, currentMonth, userId, userId])
    
    const currentProfit = (stats.current_income || 0) - (stats.current_expense || 0)
    const totalBalance = (stats.total_income || 0) - (stats.total_expense || 0)

    // 智能目標建議
    const goals = {
      monthly_profit: {
        current: currentProfit,
        suggested: Math.max(currentProfit * 1.1, 50000),
        description: '月度淨利潤目標',
        achievability: currentProfit > 0 ? 'realistic' : 'challenging',
        tips: currentProfit > 0 ? 
          '建議在現有基礎上增加10%' : 
          '建議先專注於減少支出，再提升收入'
      },
      cash_reserve: {
        current: totalBalance,
        suggested: Math.max(stats.current_expense * 3, 100000),
        description: '現金儲備目標（3個月營運資金）',
        achievability: totalBalance > stats.current_expense * 2 ? 'realistic' : 'challenging',
        tips: '建議維持至少3個月的營運資金作為緊急備用'
      },
      expense_ratio: {
        current: stats.current_income > 0 ? (stats.current_expense / stats.current_income * 100).toFixed(1) : 100,
        suggested: 70,
        description: '支出比率目標（低於70%）',
        achievability: stats.current_income > 0 && (stats.current_expense / stats.current_income) < 0.8 ? 'realistic' : 'challenging',
        tips: '控制支出在收入的70%以下，確保健康的利潤率'
      }
    }

    // 追蹤進度
    const progress = {
      monthly_profit: Math.min(100, Math.max(0, (currentProfit / goals.monthly_profit.suggested) * 100)),
      cash_reserve: Math.min(100, Math.max(0, (totalBalance / goals.cash_reserve.suggested) * 100)),
      expense_ratio: Math.min(100, Math.max(0, 100 - (parseFloat(goals.expense_ratio.current) - 70)))
    }

    res.json({
      success: true,
      data: {
        goals,
        progress,
        summary: {
          overall_score: (progress.monthly_profit + progress.cash_reserve + progress.expense_ratio) / 3,
          achieved_goals: Object.values(progress).filter(p => p >= 100).length,
          total_goals: Object.keys(progress).length
        }
      }
    })

  } catch (error) {
    console.error('財務目標追蹤錯誤:', error)
    res.status(500).json({
      success: false,
      message: '財務目標追蹤失敗',
      error: error.message
    })
  }
})

// 自動化建議
router.get('/automation-suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const suggestions = []

    // 1. 重複交易檢測
    const recurringTransactionsQuery = `
      SELECT 
        description,
        amount,
        COUNT(*) as frequency,
        'income' as type
      FROM income 
      WHERE user_id = ? AND date >= date('now', '-90 days')
      GROUP BY description, amount
      HAVING frequency >= 3
      UNION ALL
      SELECT 
        description,
        amount,
        COUNT(*) as frequency,
        'expense' as type
      FROM expense 
      WHERE user_id = ? AND date >= date('now', '-90 days')
      GROUP BY description, amount
      HAVING frequency >= 3
      ORDER BY frequency DESC
    `

    const recurringTransactions = await query(recurringTransactionsQuery, [userId, userId]) || []

    recurringTransactions.forEach(transaction => {
      suggestions.push({
        type: 'recurring_transaction',
        priority: 'medium',
        title: '重複交易自動化',
        description: `「${transaction.description}」在過去90天出現${transaction.frequency}次，建議設定為自動記錄`,
        action: 'setup_auto_record',
        data: transaction,
        potential_time_savings: transaction.frequency * 2 // 分鐘
      })
    })

    // 2. 分類自動化建議
    const uncategorizedQuery = `
      SELECT COUNT(*) as count, 'income' as type
      FROM income 
      WHERE user_id = ? AND (category IS NULL OR category = '') AND date >= date('now', '-30 days')
      UNION ALL
      SELECT COUNT(*) as count, 'expense' as type
      FROM expense 
      WHERE user_id = ? AND (category IS NULL OR category = '') AND date >= date('now', '-30 days')
    `

    const uncategorized = await query(uncategorizedQuery, [userId, userId]) || []
    const totalUncategorized = uncategorized.reduce((acc, item) => acc + item.count, 0)

    if (totalUncategorized > 5) {
      suggestions.push({
        type: 'auto_categorization',
        priority: 'high',
        title: '啟用自動分類',
        description: `過去30天有${totalUncategorized}筆交易未分類，建議啟用AI自動分類功能`,
        action: 'enable_auto_categorization',
        potential_time_savings: totalUncategorized * 1
      })
    }

    // 3. 備份提醒
    const lastBackupQuery = `
      SELECT date 
      FROM expense 
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT 1
    `
    const lastActivity = await get(lastBackupQuery, [userId])
    
    if (lastActivity) {
      const daysSinceActivity = Math.floor((new Date() - new Date(lastActivity.date)) / (1000 * 60 * 60 * 24))
      if (daysSinceActivity > 30) {
        suggestions.push({
          type: 'backup_reminder',
          priority: 'high',
          title: '數據備份建議',
          description: '建議定期備份財務數據，確保數據安全',
          action: 'setup_auto_backup',
          data: { lastActivity: lastActivity.date }
        })
      }
    }

    res.json({
      success: true,
      data: {
        suggestions,
        summary: {
          total: suggestions.length,
          high_priority: suggestions.filter(s => s.priority === 'high').length,
          potential_time_savings: suggestions.reduce((acc, s) => acc + (s.potential_time_savings || 0), 0)
        }
      }
    })

  } catch (error) {
    console.error('自動化建議錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取自動化建議失敗',
      error: error.message
    })
  }
})

// 輔助函數：生成商業洞察報表
async function generateBusinessInsightsReport(userId, incomeData, expenseData, startDate, endDate) {
  const totalIncome = incomeData.reduce((sum, item) => sum + item.total_amount, 0)
  const totalExpense = expenseData.reduce((sum, item) => sum + item.total_amount, 0)
  const netProfit = totalIncome - totalExpense
  
  // 收入分析
  const topIncomeCategories = incomeData.slice(0, 5)
  const topCustomers = incomeData
    .reduce((acc, item) => {
      const existing = acc.find(a => a.customer === item.customer)
      if (existing) {
        existing.total_amount += item.total_amount
      } else {
        acc.push({ customer: item.customer, total_amount: item.total_amount })
      }
      return acc
    }, [])
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 5)

  // 支出分析
  const topExpenseCategories = expenseData.slice(0, 5)
  const costStructure = expenseData.map(item => ({
    category: item.category,
    percentage: ((item.total_amount / totalExpense) * 100).toFixed(1),
    amount: item.total_amount
  }))

  // 獲利能力分析
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0
  const avgOrderValue = incomeData.length > 0 ? Math.round(totalIncome / incomeData.reduce((sum, item) => sum + item.transaction_count, 0)) : 0

  return {
    summary: {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin: parseFloat(profitMargin),
      avgOrderValue
    },
    income_analysis: {
      topCategories: topIncomeCategories,
      topCustomers,
      insights: [
        topCustomers.length > 0 ? `最大收入來源：${topCustomers[0].customer}（$${topCustomers[0].total_amount.toLocaleString()}）` : '暫無客戶數據',
        topIncomeCategories.length > 0 ? `主要收入類別：${topIncomeCategories[0].category}` : '暫無分類數據'
      ]
    },
    expense_analysis: {
      topCategories: topExpenseCategories,
      costStructure,
      insights: [
        topExpenseCategories.length > 0 ? `最大支出類別：${topExpenseCategories[0].category}（佔${((topExpenseCategories[0].total_amount / totalExpense) * 100).toFixed(1)}%）` : '暫無支出數據',
        costStructure.length > 3 ? '支出類別較為分散，成本控制良好' : '支出過於集中，建議多元化供應商'
      ]
    },
    recommendations: [
      netProfit > 0 ? '財務狀況良好，可考慮投資擴張' : '建議檢討成本結構，提升獲利能力',
      profitMargin < 20 ? '利潤率偏低，建議優化定價策略或降低成本' : '利潤率健康',
      topCustomers.length > 0 && (topCustomers[0].total_amount / totalIncome) > 0.5 ? '客戶過度集中，建議拓展客戶基礎' : '客戶結構良好'
    ]
  }
}

// 輔助函數：生成現金流分析報表
async function generateCashFlowAnalysisReport(userId, startDate, endDate) {
  const dailyFlowQuery = `
    SELECT 
      date,
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as daily_flow
    FROM (
      SELECT date, amount, 'income' as type FROM income WHERE user_id = ? AND date BETWEEN ? AND ?
      UNION ALL
      SELECT date, amount, 'expense' as type FROM expense WHERE user_id = ? AND date BETWEEN ? AND ?
    )
    GROUP BY date
    ORDER BY date
  `

  const dailyFlow = await query(dailyFlowQuery, [userId, startDate, endDate, userId, startDate, endDate]) || []
  
  let cumulativeBalance = 0
  const flowAnalysis = dailyFlow.map(day => {
    cumulativeBalance += day.daily_flow
    return {
      date: day.date,
      dailyFlow: day.daily_flow,
      cumulativeBalance
    }
  })

  const avgDailyFlow = dailyFlow.reduce((sum, day) => sum + day.daily_flow, 0) / (dailyFlow.length || 1)
  const maxDailyInflow = Math.max(...dailyFlow.map(d => d.daily_flow).filter(f => f > 0), 0)
  const maxDailyOutflow = Math.min(...dailyFlow.map(d => d.daily_flow).filter(f => f < 0), 0)

  return {
    summary: {
      avgDailyFlow: Math.round(avgDailyFlow),
      maxDailyInflow,
      maxDailyOutflow: Math.abs(maxDailyOutflow),
      finalBalance: cumulativeBalance,
      volatility: Math.round(Math.sqrt(dailyFlow.reduce((sum, day) => sum + Math.pow(day.daily_flow - avgDailyFlow, 2), 0) / dailyFlow.length))
    },
    daily_analysis: flowAnalysis,
    insights: [
      avgDailyFlow > 0 ? '整體現金流為正，財務狀況穩定' : '現金流為負，需要關注資金狀況',
      flowAnalysis.filter(f => f.cumulativeBalance < 0).length > flowAnalysis.length * 0.3 ? '現金流波動較大，建議加強預測管理' : '現金流相對穩定'
    ]
  }
}

// 智能對話助手
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { message, context } = req.body

    // 分析用戶問題的意圖
    const intent = await analyzeUserIntent(message)
    
    // 根據意圖生成回應
    let response = await generateSmartResponse(userId, message, intent, context)

    // 記錄對話歷史（可選）
    // await saveConversationHistory(userId, message, response.text)

    res.json({
      success: true,
      data: {
        response: response.text,
        suggestions: response.suggestions || [],
        actions: response.actions || [],
        intent: intent.type,
        confidence: intent.confidence
      }
    })

  } catch (error) {
    console.error('智能對話錯誤:', error)
    res.status(500).json({
      success: false,
      message: '智能對話處理失敗',
      error: error.message
    })
  }
})

// 獲取智能見解
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { timeRange = 'month' } = req.query

    // 獲取財務數據
    const financialData = await getFinancialDataForInsights(userId, timeRange)
    
    // 生成智能見解
    const insights = await generateFinancialInsights(financialData)

    res.json({
      success: true,
      data: {
        insights,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('獲取智能見解錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取智能見解失敗',
      error: error.message
    })
  }
})

// 智能任務建議
router.get('/task-suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // 分析用戶財務狀況
    const financialStatus = await analyzeFinancialStatus(userId)
    
    // 生成任務建議
    const tasks = await generateTaskSuggestions(financialStatus)

    res.json({
      success: true,
      data: {
        tasks,
        priority_tasks: tasks.filter(t => t.priority === 'high'),
        total_potential_savings: tasks.reduce((sum, t) => sum + (t.potential_savings || 0), 0)
      }
    })

  } catch (error) {
    console.error('獲取任務建議錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取任務建議失敗',
      error: error.message
    })
  }
})

// 輔助函數：分析用戶意圖
async function analyzeUserIntent(message) {
  const intents = {
    financial_status: {
      keywords: ['狀況', '財務狀況', '收支', '盈虧', '現金', '餘額', '健康'],
      confidence: 0
    },
    expense_analysis: {
      keywords: ['支出', '花費', '成本', '開銷', '費用', '分析'],
      confidence: 0
    },
    income_analysis: {
      keywords: ['收入', '營收', '獲利', '賺錢', '客戶', '業績'],
      confidence: 0
    },
    cash_flow: {
      keywords: ['現金流', '資金流', '週轉', '流動性'],
      confidence: 0
    },
    forecasting: {
      keywords: ['預測', '未來', '趨勢', '預估', '預計', '展望'],
      confidence: 0
    },
    optimization: {
      keywords: ['優化', '改善', '提升', '節省', '效率', '建議'],
      confidence: 0
    },
    general: {
      keywords: ['幫助', '如何', '什麼', '怎麼', '問題'],
      confidence: 0
    }
  }

  const lowerMessage = message.toLowerCase()
  
  // 計算每個意圖的信心度
  for (const [intentType, intent] of Object.entries(intents)) {
    let matchCount = 0
    for (const keyword of intent.keywords) {
      if (lowerMessage.includes(keyword)) {
        matchCount++
      }
    }
    intent.confidence = matchCount / intent.keywords.length
  }

  // 找出最高信心度的意圖
  const bestIntent = Object.entries(intents)
    .sort(([,a], [,b]) => b.confidence - a.confidence)[0]

  return {
    type: bestIntent[0],
    confidence: bestIntent[1].confidence,
    originalMessage: message
  }
}

// 輔助函數：生成智能回應
async function generateSmartResponse(userId, message, intent, context) {
  const responses = {
    financial_status: async () => {
      const healthScore = await getHealthScoreData(userId)
      const currentBalance = await getCurrentBalance(userId)
      
      return {
        text: `根據您的財務數據分析：\n\n💰 目前現金餘額：$${currentBalance.toLocaleString()}\n📊 財務健康評分：${healthScore?.totalScore || 0}分（${healthScore?.grade || 'N/A'}級）\n\n${generateHealthAdvice(healthScore)}`,
        suggestions: [
          '查看詳細健康評分',
          '獲取改善建議',
          '查看現金流預測'
        ],
        actions: [
          { type: 'view_health_score', label: '查看健康評分' },
          { type: 'view_cash_flow', label: '查看現金流' }
        ]
      }
    },

    expense_analysis: async () => {
      const expenseData = await getExpenseAnalysis(userId)
      
      return {
        text: `📈 支出分析結果：\n\n本月總支出：$${expenseData.total.toLocaleString()}\n最大支出類別：${expenseData.topCategory}（$${expenseData.topAmount.toLocaleString()}）\n\n💡 建議：${expenseData.advice}`,
        suggestions: [
          '查看支出趨勢',
          '成本優化建議',
          '設定預算限制'
        ]
      }
    },

    income_analysis: async () => {
      const incomeData = await getIncomeAnalysis(userId)
      
      return {
        text: `💼 收入分析結果：\n\n本月總收入：$${incomeData.total.toLocaleString()}\n主要客戶：${incomeData.topCustomer}\n平均客單價：$${incomeData.avgOrderValue.toLocaleString()}\n\n📊 ${incomeData.insight}`,
        suggestions: [
          '客戶集中度分析',
          '收入多元化建議',
          '客戶價值分析'
        ]
      }
    },

    forecasting: async () => {
      const forecast = await generateFinancialForecast(userId)
      
      return {
        text: `🔮 財務預測：\n\n下個月預計收入：$${forecast.income.toLocaleString()}\n下個月預計支出：$${forecast.expense.toLocaleString()}\n預計淨收入：$${forecast.profit.toLocaleString()}\n\n${forecast.advice}`,
        suggestions: [
          '查看詳細預測',
          '調整經營策略',
          '設定目標'
        ]
      }
    },

    optimization: async () => {
      const optimizations = await getOptimizationSuggestions(userId)
      
      return {
        text: `⚡ 優化建議：\n\n${optimizations.map((opt, index) => 
          `${index + 1}. ${opt.title}\n   💰 潛在節省：$${opt.savings.toLocaleString()}/月`
        ).join('\n\n')}`,
        suggestions: optimizations.map(opt => opt.title)
      }
    },

    general: () => {
      return {
        text: `👋 我是您的智能財務助手！我可以幫助您：\n\n📊 分析財務狀況\n💰 追蹤收支情況\n📈 提供經營建議\n🔮 預測財務趨勢\n⚡ 優化成本結構\n\n請告訴我您想了解什麼？`,
        suggestions: [
          '我的財務狀況如何？',
          '本月支出分析',
          '收入來源分析',
          '現金流預測',
          '如何降低成本？'
        ]
      }
    }
  }

  const responseGenerator = responses[intent.type] || responses.general
  return await responseGenerator()
}

// 輔助函數：獲取健康評分數據
async function getHealthScoreData(userId) {
  try {
    // 重用現有的健康評分邏輯
    const recentDataQuery = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM (
        SELECT date, amount, 'income' as type FROM income WHERE user_id = ?
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expense WHERE user_id = ?
      )
      WHERE date >= date('now', '-3 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `

    const recentData = await query(recentDataQuery, [userId, userId]) || []
    
    if (recentData.length < 2) return null

    let scores = { profitability: 0, stability: 0, growth: 0, efficiency: 0, cashFlow: 0 }
    
    const avgProfit = recentData.reduce((acc, month) => acc + (month.income - month.expense), 0) / recentData.length
    const avgIncome = recentData.reduce((acc, month) => acc + month.income, 0) / recentData.length
    const profitMargin = avgIncome > 0 ? (avgProfit / avgIncome) * 100 : 0
    scores.profitability = Math.min(25, Math.max(0, profitMargin > 0 ? 15 + profitMargin * 0.5 : 0))

    const totalScore = Object.values(scores).reduce((acc, score) => acc + score, 0)
    
    return {
      totalScore: Math.round(totalScore),
      grade: getHealthGrade(totalScore),
      scores
    }
  } catch (error) {
    return null
  }
}

// 輔助函數：生成健康建議
function generateHealthAdvice(healthScore) {
  if (!healthScore) return '建議記錄更多財務數據以獲得準確分析。'
  
  if (healthScore.totalScore >= 85) {
    return '🎉 財務狀況優秀！繼續保持良好的財務管理習慣。'
  } else if (healthScore.totalScore >= 70) {
    return '👍 財務狀況良好，有進一步優化的空間。'
  } else if (healthScore.totalScore >= 50) {
    return '⚠️ 財務狀況普通，建議關注成本控制和收入提升。'
  } else {
    return '🚨 財務狀況需要改善，建議立即檢討經營策略。'
  }
}

// 輔助函數：獲取支出分析
async function getExpenseAnalysis(userId) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7)
    
    const expenseQuery = `
      SELECT 
        category,
        SUM(amount) as total_amount
      FROM expense 
      WHERE user_id = ? AND strftime('%Y-%m', date) = ?
      GROUP BY category
      ORDER BY total_amount DESC
    `
    
    const expenses = await query(expenseQuery, [userId, currentMonth]) || []
    const total = expenses.reduce((sum, item) => sum + item.total_amount, 0)
    const topExpense = expenses[0] || { category: '無', total_amount: 0 }
    
    return {
      total,
      topCategory: topExpense.category,
      topAmount: topExpense.total_amount,
      advice: total > 0 ? 
        `${topExpense.category}是最大支出項目，佔總支出的${((topExpense.total_amount / total) * 100).toFixed(1)}%` :
        '本月暫無支出記錄'
    }
  } catch (error) {
    return { total: 0, topCategory: '無', topAmount: 0, advice: '無法獲取支出數據' }
  }
}

// 輔助函數：獲取收入分析
async function getIncomeAnalysis(userId) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7)
    
    const incomeQuery = `
      SELECT 
        customer,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM income 
      WHERE user_id = ? AND strftime('%Y-%m', date) = ?
      GROUP BY customer
      ORDER BY total_amount DESC
    `
    
    const incomes = await query(incomeQuery, [userId, currentMonth]) || []
    const total = incomes.reduce((sum, item) => sum + item.total_amount, 0)
    const totalTransactions = incomes.reduce((sum, item) => sum + item.transaction_count, 0)
    const topCustomer = incomes[0]?.customer || '無'
    const avgOrderValue = totalTransactions > 0 ? total / totalTransactions : 0
    
    return {
      total,
      topCustomer,
      avgOrderValue,
      insight: incomes.length > 1 ? 
        `客戶分佈良好，共有${incomes.length}個活躍客戶` :
        incomes.length === 1 ? '建議拓展更多客戶來源' : '本月暫無收入記錄'
    }
  } catch (error) {
    return { total: 0, topCustomer: '無', avgOrderValue: 0, insight: '無法獲取收入數據' }
  }
}

// 輔助函數：生成財務預測
async function generateFinancialForecast(userId) {
  try {
    // 獲取過去3個月的數據用於預測
    const forecastQuery = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM (
        SELECT date, amount, 'income' as type FROM income WHERE user_id = ?
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expense WHERE user_id = ?
      )
      WHERE date >= date('now', '-3 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `
    
    const data = await query(forecastQuery, [userId, userId]) || []
    
    if (data.length < 2) {
      return {
        income: 0,
        expense: 0,
        profit: 0,
        advice: '數據不足，建議記錄更多財務數據以獲得準確預測。'
      }
    }
    
    // 簡單線性趨勢預測
    const avgIncome = data.reduce((sum, item) => sum + item.income, 0) / data.length
    const avgExpense = data.reduce((sum, item) => sum + item.expense, 0) / data.length
    
    // 考慮趨勢
    const incomeGrowth = data.length > 1 ? 
      (data[data.length - 1].income - data[0].income) / data.length : 0
    const expenseGrowth = data.length > 1 ? 
      (data[data.length - 1].expense - data[0].expense) / data.length : 0
    
    const forecastIncome = Math.max(0, avgIncome + incomeGrowth)
    const forecastExpense = Math.max(0, avgExpense + expenseGrowth)
    const forecastProfit = forecastIncome - forecastExpense
    
    return {
      income: Math.round(forecastIncome),
      expense: Math.round(forecastExpense),
      profit: Math.round(forecastProfit),
      advice: forecastProfit > 0 ? 
        '預測顯示下月將有正向現金流，財務狀況良好。' :
        '⚠️ 預測顯示下月可能出現負現金流，建議提前準備資金或調整策略。'
    }
  } catch (error) {
    return {
      income: 0,
      expense: 0,
      profit: 0,
      advice: '預測生成失敗，請檢查數據完整性。'
    }
  }
}

// 輔助函數：獲取優化建議
async function getOptimizationSuggestions(userId) {
  const suggestions = []
  
  try {
    // 檢查重複支出
    const duplicateQuery = `
      SELECT description, vendor, amount, COUNT(*) as frequency
      FROM expense 
      WHERE user_id = ? AND date >= date('now', '-90 days')
      GROUP BY description, vendor, amount
      HAVING frequency > 3
      ORDER BY amount DESC
      LIMIT 3
    `
    
    const duplicates = await query(duplicateQuery, [userId]) || []
    
    duplicates.forEach(dup => {
      suggestions.push({
        title: `自動化「${dup.description}」記錄`,
        savings: dup.frequency * 50, // 假設每次節省50元時間成本
        type: 'automation'
      })
    })
    
    // 檢查高支出類別
    const highExpenseQuery = `
      SELECT category, SUM(amount) as total
      FROM expense 
      WHERE user_id = ? AND date >= date('now', '-30 days')
      GROUP BY category
      ORDER BY total DESC
      LIMIT 3
    `
    
    const highExpenses = await query(highExpenseQuery, [userId]) || []
    
    highExpenses.forEach((exp, index) => {
      if (index === 0 && exp.total > 10000) {
        suggestions.push({
          title: `優化「${exp.category}」支出`,
          savings: exp.total * 0.1, // 假設可節省10%
          type: 'cost_reduction'
        })
      }
    })
    
    // 添加通用建議
    if (suggestions.length === 0) {
      suggestions.push(
        {
          title: '設定月度預算限制',
          savings: 1000,
          type: 'budget_control'
        },
        {
          title: '啟用自動分類功能',
          savings: 500,
          type: 'automation'
        }
      )
    }
    
    return suggestions
  } catch (error) {
    return [
      {
        title: '檢查數據完整性',
        savings: 0,
        type: 'data_quality'
      }
    ]
  }
}

// 輔助函數：生成獲利能力報表
async function generateProfitabilityReport(userId, incomeData, expenseData, startDate, endDate) {
  const totalIncome = incomeData.reduce((sum, item) => sum + item.total_amount, 0)
  const totalExpense = expenseData.reduce((sum, item) => sum + item.total_amount, 0)

  // 客戶獲利能力
  const customerProfitability = incomeData
    .reduce((acc, item) => {
      const existing = acc.find(a => a.customer === item.customer)
      if (existing) {
        existing.revenue += item.total_amount
        existing.transactions += item.transaction_count
      } else {
        acc.push({
          customer: item.customer,
          revenue: item.total_amount,
          transactions: item.transaction_count,
          avgOrderValue: item.avg_amount
        })
      }
      return acc
    }, [])
    .sort((a, b) => b.revenue - a.revenue)

  // 產品/服務獲利能力
  const serviceProfitability = incomeData.map(item => ({
    category: item.category,
    revenue: item.total_amount,
    margin: totalIncome > 0 ? ((item.total_amount / totalIncome) * 100).toFixed(1) : 0
  }))

  return {
    customer_profitability: customerProfitability.slice(0, 10),
    service_profitability: serviceProfitability,
    profitability_metrics: {
      grossMargin: totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0,
      avgCustomerValue: customerProfitability.length > 0 ? Math.round(totalIncome / customerProfitability.length) : 0,
      customerConcentration: customerProfitability.length > 0 ? ((customerProfitability[0].revenue / totalIncome) * 100).toFixed(1) : 0
    },
    recommendations: [
      customerProfitability.length > 0 && (customerProfitability[0].revenue / totalIncome) > 0.5 ? 
        '建議拓展客戶基礎，降低客戶集中風險' : '客戶分佈良好',
      serviceProfitability.length > 1 ? '可專注發展高獲利的服務類別' : '建議拓展服務範圍'
    ]
  }
}

// 自動備份提醒和管理
router.get('/backup-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // 檢查最近的數據活動
    const lastActivityQuery = `
      SELECT MAX(date) as last_date, 'income' as type FROM income WHERE user_id = ?
      UNION ALL
      SELECT MAX(date) as last_date, 'expense' as type FROM expense WHERE user_id = ?
      ORDER BY last_date DESC
      LIMIT 1
    `
    
    const lastActivity = await get(lastActivityQuery, [userId, userId])
    
    // 計算數據統計
    const dataStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM income WHERE user_id = ?) as income_count,
        (SELECT COUNT(*) FROM expense WHERE user_id = ?) as expense_count,
        (SELECT COUNT(*) FROM tax_calculations WHERE user_id = ?) as tax_count
    `
    
    const dataStats = await get(dataStatsQuery, [userId, userId, userId])
    
    // 計算備份建議
    const totalRecords = (dataStats.income_count || 0) + (dataStats.expense_count || 0) + (dataStats.tax_count || 0)
    const daysSinceActivity = lastActivity?.last_date ? 
      Math.floor((new Date() - new Date(lastActivity.last_date)) / (1000 * 60 * 60 * 24)) : 0
    
    const backupRecommendation = getBackupRecommendation(totalRecords, daysSinceActivity)
    
    res.json({
      success: true,
      data: {
        lastActivity: lastActivity?.last_date || null,
        daysSinceActivity,
        totalRecords,
        dataStats,
        recommendation: backupRecommendation,
        backupSchedule: generateBackupSchedule(totalRecords, daysSinceActivity)
      }
    })

  } catch (error) {
    console.error('獲取備份狀態錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取備份狀態失敗',
      error: error.message
    })
  }
})

// 創建智能備份
router.post('/create-smart-backup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { backupType = 'full', description } = req.body

    // 獲取用戶數據
    const userData = await getUserDataForBackup(userId, backupType)
    
    // 生成備份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup_${userId}_${backupType}_${timestamp}.json`
    
    // 創建備份數據
    const backupData = {
      version: '1.0',
      type: backupType,
      userId,
      createdAt: new Date().toISOString(),
      description: description || `自動${backupType === 'full' ? '完整' : '增量'}備份`,
      metadata: {
        totalRecords: Object.values(userData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
        dataTypes: Object.keys(userData),
        fileSize: JSON.stringify(userData).length
      },
      data: userData
    }

    // 這裡可以將備份保存到文件系統或雲端儲存
    // 暫時返回備份數據供前端下載
    
    res.json({
      success: true,
      data: {
        filename,
        backup: backupData,
        downloadUrl: `/api/assistant/download-backup/${filename}`, // 假設的下載URL
        message: '備份創建成功！建議將備份文件安全保存。'
      }
    })

  } catch (error) {
    console.error('創建備份錯誤:', error)
    res.status(500).json({
      success: false,
      message: '創建備份失敗',
      error: error.message
    })
  }
})

// 驗證備份完整性
router.post('/verify-backup', authenticateToken, async (req, res) => {
  try {
    const { backupData } = req.body
    
    const verification = verifyBackupIntegrity(backupData)
    
    res.json({
      success: true,
      data: {
        isValid: verification.isValid,
        issues: verification.issues,
        recommendations: verification.recommendations,
        dataIntegrity: verification.dataIntegrity
      }
    })

  } catch (error) {
    console.error('驗證備份錯誤:', error)
    res.status(500).json({
      success: false,
      message: '驗證備份失敗',
      error: error.message
    })
  }
})

// 輔助函數：獲取備份建議
function getBackupRecommendation(totalRecords, daysSinceActivity) {
  if (totalRecords === 0) {
    return {
      priority: 'low',
      message: '目前沒有數據需要備份',
      reason: 'no_data'
    }
  }
  
  if (totalRecords > 100 && daysSinceActivity > 30) {
    return {
      priority: 'high',
      message: '建議立即備份！您已有超過30天未進行數據備份',
      reason: 'critical_delay'
    }
  }
  
  if (totalRecords > 50 && daysSinceActivity > 14) {
    return {
      priority: 'medium',
      message: '建議盡快備份，您的數據已累積一定規模',
      reason: 'moderate_delay'
    }
  }
  
  if (totalRecords > 20 && daysSinceActivity > 7) {
    return {
      priority: 'medium',
      message: '建議定期備份以保護您的財務數據',
      reason: 'regular_maintenance'
    }
  }
  
  return {
    priority: 'low',
    message: '數據狀況良好，可考慮建立定期備份計劃',
    reason: 'good_status'
  }
}

// 輔助函數：生成備份計劃
function generateBackupSchedule(totalRecords, daysSinceActivity) {
  const schedules = []
  
  if (totalRecords > 100) {
    schedules.push({
      type: 'weekly',
      description: '每週完整備份',
      priority: 'high',
      reason: '數據量較大，建議頻繁備份'
    })
    schedules.push({
      type: 'daily_incremental',
      description: '每日增量備份',
      priority: 'medium',
      reason: '保護每日新增數據'
    })
  } else if (totalRecords > 50) {
    schedules.push({
      type: 'biweekly',
      description: '每兩週完整備份',
      priority: 'medium',
      reason: '數據量適中，定期備份即可'
    })
  } else {
    schedules.push({
      type: 'monthly',
      description: '每月備份',
      priority: 'low',
      reason: '數據量較小，月度備份足夠'
    })
  }
  
  // 雲端備份建議
  schedules.push({
    type: 'cloud_sync',
    description: '雲端同步備份',
    priority: 'high',
    reason: '提供額外安全保障'
  })
  
  return schedules
}

// 輔助函數：獲取用戶備份數據
async function getUserDataForBackup(userId, backupType) {
  try {
    const userData = {}
    
    if (backupType === 'full' || backupType === 'incremental') {
      // 收入數據
      userData.income = await query(`
        SELECT * FROM income WHERE user_id = ?
        ${backupType === 'incremental' ? "AND date >= date('now', '-30 days')" : ''}
        ORDER BY date DESC
      `, [userId])
      
      // 支出數據
      userData.expense = await query(`
        SELECT * FROM expense WHERE user_id = ?
        ${backupType === 'incremental' ? "AND date >= date('now', '-30 days')" : ''}
        ORDER BY date DESC
      `, [userId])
      
      // 預算數據
      userData.budget = await query(`
        SELECT * FROM budget WHERE user_id = ?
        ORDER BY created_at DESC
      `, [userId])
      
      // 稅務計算
      userData.tax_calculations = await query(`
        SELECT * FROM tax_calculations WHERE user_id = ?
        ${backupType === 'incremental' ? "AND created_at >= date('now', '-30 days')" : ''}
        ORDER BY created_at DESC
      `, [userId])
    }
    
    return userData
  } catch (error) {
    throw new Error(`獲取備份數據失敗: ${error.message}`)
  }
}

// 輔助函數：驗證備份完整性
function verifyBackupIntegrity(backupData) {
  const issues = []
  const recommendations = []
  let dataIntegrity = 100
  
  try {
    // 檢查備份格式
    if (!backupData.version || !backupData.data || !backupData.createdAt) {
      issues.push('備份文件格式不正確')
      dataIntegrity -= 30
    }
    
    // 檢查數據完整性
    const data = backupData.data || {}
    const expectedTables = ['income', 'expense', 'budget', 'tax_calculations']
    
    expectedTables.forEach(table => {
      if (!data[table]) {
        issues.push(`缺少 ${table} 數據表`)
        dataIntegrity -= 10
      } else if (!Array.isArray(data[table])) {
        issues.push(`${table} 數據格式錯誤`)
        dataIntegrity -= 5
      }
    })
    
    // 檢查數據時效性
    const backupAge = new Date() - new Date(backupData.createdAt)
    const daysOld = Math.floor(backupAge / (1000 * 60 * 60 * 24))
    
    if (daysOld > 30) {
      recommendations.push('備份文件較舊，建議創建新的備份')
      dataIntegrity -= 10
    }
    
    // 檢查記錄數量
    const totalRecords = Object.values(data).reduce((sum, table) => {
      return sum + (Array.isArray(table) ? table.length : 0)
    }, 0)
    
    if (totalRecords === 0) {
      issues.push('備份文件中沒有數據記錄')
      dataIntegrity -= 50
    }
    
    if (dataIntegrity >= 90) {
      recommendations.push('備份文件完整且可靠')
    } else if (dataIntegrity >= 70) {
      recommendations.push('備份文件基本完整，但建議檢查缺失項目')
    } else {
      recommendations.push('備份文件存在問題，建議重新創建備份')
    }
    
    return {
      isValid: dataIntegrity >= 70,
      issues,
      recommendations,
      dataIntegrity: Math.max(0, dataIntegrity)
    }
    
  } catch (error) {
    return {
      isValid: false,
      issues: ['備份文件損壞或無法讀取'],
      recommendations: ['請檢查文件完整性或重新創建備份'],
      dataIntegrity: 0
    }
  }
}

// 智能收據/發票識別
router.post('/scan-receipt', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { imageData, type = 'auto' } = req.body

    // 模擬 OCR 和 AI 識別功能（實際應用中會使用真正的 OCR 服務）
    const extractedData = await simulateReceiptOCR(imageData, type)
    
    // 智能分類建議
    const classificationSuggestion = await getSmartClassification(extractedData.description, extractedData.amount, extractedData.vendor)
    
    // 生成建議的記錄
    const suggestedRecord = {
      ...extractedData,
      category: classificationSuggestion.category,
      confidence: classificationSuggestion.confidence,
      alternatives: classificationSuggestion.alternatives
    }

    res.json({
      success: true,
      data: {
        extractedData,
        suggestedRecord,
        confidence: extractedData.confidence,
        processingTime: new Date().toISOString(),
        recommendations: generateReceiptRecommendations(extractedData)
      }
    })

  } catch (error) {
    console.error('收據識別錯誤:', error)
    res.status(500).json({
      success: false,
      message: '收據識別失敗',
      error: error.message
    })
  }
})

// 批量收據處理
router.post('/batch-scan-receipts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { receipts } = req.body // Array of image data

    const results = []
    const errors = []

    for (let i = 0; i < receipts.length; i++) {
      try {
        const extractedData = await simulateReceiptOCR(receipts[i].imageData, receipts[i].type)
        const classificationSuggestion = await getSmartClassification(
          extractedData.description, 
          extractedData.amount, 
          extractedData.vendor
        )
        
        results.push({
          id: receipts[i].id || i,
          success: true,
          data: {
            ...extractedData,
            category: classificationSuggestion.category,
            confidence: classificationSuggestion.confidence
          }
        })
      } catch (error) {
        errors.push({
          id: receipts[i].id || i,
          error: error.message
        })
      }
    }

    res.json({
      success: true,
      data: {
        processedCount: results.length,
        errorCount: errors.length,
        results,
        errors,
        batchSummary: generateBatchSummary(results)
      }
    })

  } catch (error) {
    console.error('批量收據處理錯誤:', error)
    res.status(500).json({
      success: false,
      message: '批量收據處理失敗',
      error: error.message
    })
  }
})

// 收據模板管理
router.get('/receipt-templates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // 獲取用戶常用的供應商和模式
    const vendorPatternsQuery = `
      SELECT 
        vendor,
        category,
        COUNT(*) as frequency,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM expense 
      WHERE user_id = ? AND vendor IS NOT NULL AND vendor != ''
      GROUP BY vendor, category
      HAVING frequency >= 3
      ORDER BY frequency DESC
      LIMIT 20
    `
    
    const vendorPatterns = await query(vendorPatternsQuery, [userId]) || []
    
    // 生成智能模板
    const templates = vendorPatterns.map(pattern => ({
      vendor: pattern.vendor,
      suggestedCategory: pattern.category,
      frequency: pattern.frequency,
      priceRange: {
        min: pattern.min_amount,
        max: pattern.max_amount,
        avg: Math.round(pattern.avg_amount)
      },
      confidence: Math.min(0.95, 0.5 + (pattern.frequency * 0.1)),
      template: {
        vendor: pattern.vendor,
        category: pattern.category,
        amount: Math.round(pattern.avg_amount),
        description: `${pattern.vendor} - ${pattern.category}`
      }
    }))

    res.json({
      success: true,
      data: {
        templates,
        summary: {
          totalTemplates: templates.length,
          topVendors: templates.slice(0, 5),
          mostFrequentCategory: getMostFrequentCategory(templates)
        }
      }
    })

  } catch (error) {
    console.error('獲取收據模板錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取收據模板失敗',
      error: error.message
    })
  }
})

// 輔助函數：模擬 OCR 識別
async function simulateReceiptOCR(imageData, type) {
  // 這裡模擬 OCR 識別過程
  // 實際應用中會集成 Google Vision API, AWS Textract, 或其他 OCR 服務
  
  // 模擬不同類型的收據識別結果
  const mockResults = {
    restaurant: {
      vendor: '美味餐廳',
      amount: Math.floor(Math.random() * 500) + 100,
      date: new Date().toISOString().split('T')[0],
      description: '餐飲消費',
      items: ['主餐', '飲料', '服務費'],
      tax: 0.05,
      confidence: 0.85
    },
    gas_station: {
      vendor: '中油加油站',
      amount: Math.floor(Math.random() * 1000) + 300,
      date: new Date().toISOString().split('T')[0],
      description: '汽油費用',
      items: ['95無鉛汽油'],
      tax: 0.05,
      confidence: 0.92
    },
    office_supplies: {
      vendor: '辦公用品店',
      amount: Math.floor(Math.random() * 200) + 50,
      date: new Date().toISOString().split('T')[0],
      description: '辦公用品採購',
      items: ['文具', '紙張'],
      tax: 0.05,
      confidence: 0.78
    },
    general: {
      vendor: '一般商店',
      amount: Math.floor(Math.random() * 300) + 50,
      date: new Date().toISOString().split('T')[0],
      description: '一般消費',
      items: ['商品'],
      tax: 0.05,
      confidence: 0.70
    }
  }

  // 根據 type 返回對應的模擬結果，如果是 auto 則隨機選擇
  const resultType = type === 'auto' ? 
    Object.keys(mockResults)[Math.floor(Math.random() * Object.keys(mockResults).length)] : 
    type

  const result = mockResults[resultType] || mockResults.general
  
  // 添加一些隨機變化來模擬真實的 OCR 結果
  return {
    ...result,
    rawText: `模擬OCR識別文字:\n${result.vendor}\n${result.description}\n金額: $${result.amount}\n日期: ${result.date}`,
    processingTime: Math.floor(Math.random() * 2000) + 500, // 模擬處理時間
    ocrEngine: 'MockOCR v1.0'
  }
}

// 輔助函數：智能分類
async function getSmartClassification(description, amount, vendor) {
  // 重用現有的智能分類邏輯
  const categoryRules = {
    '餐飲': ['餐廳', '咖啡', '午餐', '晚餐', '食物', '飲料'],
    '交通': ['加油站', '汽油', '停車', '計程車', '公車', '捷運'],
    '辦公': ['辦公用品', '文具', '紙張', '筆', '印表機'],
    '水電': ['水費', '電費', '瓦斯', '電信'],
    '行銷': ['廣告', '宣傳', '推廣', '設計'],
    '其他': []
  }

  let bestCategory = '其他'
  let confidence = 0.5

  // 根據描述和供應商名稱進行分類
  const searchText = `${description} ${vendor}`.toLowerCase()
  
  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        bestCategory = category
        confidence = 0.8
        break
      }
    }
    if (confidence > 0.5) break
  }

  // 根據金額調整信心度
  if (amount > 1000 && bestCategory === '交通') {
    confidence = Math.min(confidence + 0.1, 0.95)
  }

  return {
    category: bestCategory,
    confidence,
    alternatives: Object.keys(categoryRules).filter(cat => cat !== bestCategory).slice(0, 3)
  }
}

// 輔助函數：生成收據建議
function generateReceiptRecommendations(extractedData) {
  const recommendations = []

  if (extractedData.confidence < 0.8) {
    recommendations.push({
      type: 'accuracy',
      message: '建議手動確認識別結果的準確性',
      priority: 'medium'
    })
  }

  if (extractedData.amount > 1000) {
    recommendations.push({
      type: 'approval',
      message: '金額較大，建議設定審核流程',
      priority: 'high'
    })
  }

  if (extractedData.tax && extractedData.tax > 0) {
    recommendations.push({
      type: 'tax',
      message: '檢測到稅額資訊，可用於稅務申報',
      priority: 'low'
    })
  }

  recommendations.push({
    type: 'storage',
    message: '建議保存原始收據影像作為憑證',
    priority: 'medium'
  })

  return recommendations
}

// 輔助函數：生成批量處理摘要
function generateBatchSummary(results) {
  const totalAmount = results.reduce((sum, result) => sum + (result.data.amount || 0), 0)
  const categories = {}
  const vendors = {}

  results.forEach(result => {
    if (result.data.category) {
      categories[result.data.category] = (categories[result.data.category] || 0) + 1
    }
    if (result.data.vendor) {
      vendors[result.data.vendor] = (vendors[result.data.vendor] || 0) + 1
    }
  })

  return {
    totalAmount,
    totalItems: results.length,
    topCategory: Object.entries(categories).sort(([,a], [,b]) => b - a)[0]?.[0] || '無',
    topVendor: Object.entries(vendors).sort(([,a], [,b]) => b - a)[0]?.[0] || '無',
    categoryDistribution: categories,
    averageAmount: results.length > 0 ? Math.round(totalAmount / results.length) : 0
  }
}

// 輔助函數：獲取最常見類別
function getMostFrequentCategory(templates) {
  const categories = {}
  templates.forEach(template => {
    categories[template.suggestedCategory] = (categories[template.suggestedCategory] || 0) + template.frequency
  })
  
  return Object.entries(categories).sort(([,a], [,b]) => b - a)[0]?.[0] || '無'
}

export default router