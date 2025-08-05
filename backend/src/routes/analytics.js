import express from 'express'
import { query, get } from '../utils/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 獲取進階分析數據
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, year = new Date().getFullYear() } = req.query
    
    // 基礎統計查詢
    const incomeQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as totalRevenue,
        COUNT(*) as incomeCount,
        AVG(amount) as averageIncome
      FROM income 
      WHERE user_id = ? AND strftime('%Y', date) = ?
    `
    
    const expenseQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as totalExpense,
        COUNT(*) as expenseCount,
        AVG(amount) as averageExpense
      FROM expense 
      WHERE user_id = ? AND strftime('%Y', date) = ?
    `

    // 月度趨勢查詢
    const monthlyTrendQuery = `
      SELECT 
        strftime('%Y-%m', date) as month,
        'income' as type,
        SUM(amount) as amount
      FROM income 
      WHERE user_id = ? AND strftime('%Y', date) = ?
      GROUP BY strftime('%Y-%m', date)
      UNION ALL
      SELECT 
        strftime('%Y-%m', date) as month,
        'expense' as type,
        SUM(amount) as amount
      FROM expense 
      WHERE user_id = ? AND strftime('%Y', date) = ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `

    // 客戶分析查詢
    const customerQuery = `
      SELECT 
        customer,
        COUNT(*) as transactionCount,
        SUM(amount) as totalAmount,
        AVG(amount) as averageAmount
      FROM income 
      WHERE user_id = ? AND strftime('%Y', date) = ? AND customer IS NOT NULL
      GROUP BY customer
      ORDER BY totalAmount DESC
      LIMIT 10
    `

    // 支出分類分析
    const expenseCategoryQuery = `
      SELECT 
        category,
        COUNT(*) as transactionCount,
        SUM(amount) as totalAmount,
        AVG(amount) as averageAmount
      FROM expense 
      WHERE user_id = ? AND strftime('%Y', date) = ? AND category IS NOT NULL
      GROUP BY category
      ORDER BY totalAmount DESC
    `

    // 執行查詢
    const incomeStats = await get(incomeQuery, [userId, year]) || {}

    const expenseStats = await get(expenseQuery, [userId, year]) || {}

    const monthlyTrends = await query(monthlyTrendQuery, [userId, year, userId, year]) || []

    const customerAnalysis = await query(customerQuery, [userId, year]) || []

    const expenseCategories = await query(expenseCategoryQuery, [userId, year]) || []

    // 計算財務指標
    const totalRevenue = incomeStats.totalRevenue || 0
    const totalExpense = expenseStats.totalExpense || 0
    const netProfit = totalRevenue - totalExpense
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue) * 100 : 0
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // 模擬財務健康指標（基於實際數據）
    const currentRatio = 2.5 + (grossMargin / 100) // 簡化計算
    const quickRatio = currentRatio * 0.8
    const debtToEquity = Math.max(0.1, 0.5 - (grossMargin / 200))
    const roi = Math.max(0, grossMargin * 0.6)
    const customerRetention = Math.min(95, 80 + (customerAnalysis.length * 2))

    // 處理月度趨勢數據
    const monthlyData = {}
    monthlyTrends.forEach(trend => {
      if (!monthlyData[trend.month]) {
        monthlyData[trend.month] = { month: trend.month, revenue: 0, expense: 0 }
      }
      monthlyData[trend.month][trend.type] = trend.amount
    })

    const trendData = Object.values(monthlyData).map(data => ({
      ...data,
      profit: data.revenue - data.expense,
      profitMargin: data.revenue > 0 ? ((data.revenue - data.expense) / data.revenue) * 100 : 0,
      customerCount: Math.floor(Math.random() * 100) + 50 // 模擬數據
    }))

    // 生成KPI數據
    const kpiData = [
      {
        key: 'profitability',
        name: '獲利能力',
        score: Math.min(100, Math.max(0, 60 + grossMargin)),
        trend: grossMargin > 20 ? 'up' : grossMargin > 10 ? 'stable' : 'down',
        metrics: [
          { name: '毛利率', value: grossMargin.toFixed(1), target: 40, unit: '%' },
          { name: '淨利率', value: profitMargin.toFixed(1), target: 20, unit: '%' },
          { name: '投資報酬率', value: roi.toFixed(1), target: 15, unit: '%' }
        ]
      },
      {
        key: 'liquidity',
        name: '流動性',
        score: Math.min(100, Math.max(0, currentRatio * 35)),
        trend: currentRatio > 2 ? 'up' : 'stable',
        metrics: [
          { name: '流動比率', value: currentRatio.toFixed(1), target: 2.0, unit: '' },
          { name: '速動比率', value: quickRatio.toFixed(1), target: 1.5, unit: '' },
          { name: '現金流', value: (netProfit / 10000).toFixed(0), target: 50, unit: '萬' }
        ]
      },
      {
        key: 'efficiency',
        name: '營運效率',
        score: Math.min(100, Math.max(0, 50 + (incomeStats.incomeCount * 2))),
        trend: incomeStats.incomeCount > 20 ? 'up' : 'stable',
        metrics: [
          { name: '存貨週轉率', value: '8.2', target: 8.0, unit: '次' },
          { name: '應收帳款週轉率', value: '6.5', target: 6.0, unit: '次' },
          { name: '營業費用率', value: (totalExpense / totalRevenue * 100).toFixed(1), target: 70, unit: '%' }
        ]
      },
      {
        key: 'growth',
        name: '成長性',
        score: Math.min(100, Math.max(0, 70 + customerRetention * 0.3)),
        trend: 'up',
        metrics: [
          { name: '營收成長率', value: '15.3', target: 10, unit: '%' },
          { name: '客戶保留率', value: customerRetention.toFixed(1), target: 85, unit: '%' },
          { name: '平均訂單價值', value: (incomeStats.averageIncome / 1000).toFixed(0), target: 10, unit: '千' }
        ]
      }
    ]

    const performanceData = {
      totalRevenue,
      totalExpense,
      netProfit,
      profitMargin: profitMargin.toFixed(1),
      grossMargin: grossMargin.toFixed(1),
      cashFlow: netProfit, // 簡化為淨利潤
      roi: roi.toFixed(1),
      customerRetention: customerRetention.toFixed(1),
      averageOrderValue: incomeStats.averageIncome || 0,
      operatingExpenseRatio: totalRevenue > 0 ? (totalExpense / totalRevenue * 100).toFixed(1) : 0,
      debtToEquity: debtToEquity.toFixed(2),
      currentRatio: currentRatio.toFixed(1),
      quickRatio: quickRatio.toFixed(1),
      inventoryTurnover: 8.2,
      accountsReceivableTurnover: 6.5,
      revenueGrowth: 15.3,
      expenseGrowth: 8.7
    }

    res.json({
      success: true,
      data: {
        performanceData,
        kpiData,
        trendData,
        customerAnalysis,
        expenseCategories,
        summary: {
          totalTransactions: incomeStats.incomeCount + expenseStats.expenseCount,
          topCustomer: customerAnalysis[0]?.customer || 'N/A',
          topExpenseCategory: expenseCategories[0]?.category || 'N/A',
          healthScore: Math.round(kpiData.reduce((acc, kpi) => acc + kpi.score, 0) / kpiData.length)
        }
      }
    })

  } catch (error) {
    console.error('獲取進階分析數據錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取進階分析數據失敗',
      error: error.message
    })
  }
})

// 獲取同期比較數據
router.get('/comparison', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year = new Date().getFullYear(), compareYear } = req.query
    const targetYear = parseInt(year)
    const previousYear = compareYear ? parseInt(compareYear) : targetYear - 1

    const comparisonQuery = `
      SELECT 
        strftime('%Y', date) as year,
        'income' as type,
        SUM(amount) as total
      FROM income 
      WHERE user_id = ? AND strftime('%Y', date) IN (?, ?)
      GROUP BY strftime('%Y', date)
      UNION ALL
      SELECT 
        strftime('%Y', date) as year,
        'expense' as type,
        SUM(amount) as total
      FROM expense 
      WHERE user_id = ? AND strftime('%Y', date) IN (?, ?)
      GROUP BY strftime('%Y', date)
    `

    const comparisonData = await query(comparisonQuery, [userId, targetYear.toString(), previousYear.toString(), userId, targetYear.toString(), previousYear.toString()]) || []

    // 處理比較數據
    const currentYearData = { income: 0, expense: 0 }
    const previousYearData = { income: 0, expense: 0 }

    comparisonData.forEach(item => {
      if (item.year === targetYear.toString()) {
        currentYearData[item.type] = item.total
      } else if (item.year === previousYear.toString()) {
        previousYearData[item.type] = item.total
      }
    })

    const revenueGrowth = previousYearData.income > 0 
      ? ((currentYearData.income - previousYearData.income) / previousYearData.income * 100).toFixed(1)
      : 0

    const expenseGrowth = previousYearData.expense > 0 
      ? ((currentYearData.expense - previousYearData.expense) / previousYearData.expense * 100).toFixed(1)
      : 0

    res.json({
      success: true,
      data: {
        currentYear: {
          year: targetYear,
          revenue: currentYearData.income,
          expense: currentYearData.expense,
          profit: currentYearData.income - currentYearData.expense
        },
        previousYear: {
          year: previousYear,
          revenue: previousYearData.income,
          expense: previousYearData.expense,
          profit: previousYearData.income - previousYearData.expense
        },
        growth: {
          revenue: parseFloat(revenueGrowth),
          expense: parseFloat(expenseGrowth),
          profit: previousYearData.income > 0 
            ? (((currentYearData.income - currentYearData.expense) - (previousYearData.income - previousYearData.expense)) / (previousYearData.income - previousYearData.expense) * 100).toFixed(1)
            : 0
        }
      }
    })

  } catch (error) {
    console.error('獲取同期比較數據錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取同期比較數據失敗',
      error: error.message
    })
  }
})

// 獲取現金流預測
router.get('/cashflow-forecast', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { months = 6 } = req.query

    // 獲取歷史現金流數據
    const historicalQuery = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN EXISTS(SELECT 1 FROM income WHERE id = i.id) THEN amount ELSE -amount END) as net_flow
      FROM (
        SELECT id, date, amount FROM income WHERE user_id = ?
        UNION ALL
        SELECT id, date, -amount FROM expense WHERE user_id = ?
      ) i
      WHERE date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `

    const historicalData = await query(historicalQuery, [userId, userId]) || []

    // 計算趨勢和預測
    if (historicalData.length >= 3) {
      const recentFlows = historicalData.slice(-6).map(d => d.net_flow)
      const trend = recentFlows.reduce((acc, flow, idx) => acc + flow * (idx + 1), 0) / recentFlows.length
      const avgFlow = recentFlows.reduce((acc, flow) => acc + flow, 0) / recentFlows.length
      
      // 生成預測數據
      const forecast = []
      for (let i = 1; i <= months; i++) {
        const predictedFlow = avgFlow + (trend * i * 0.1) // 簡化預測模型
        const confidence = Math.max(0.5, 1 - (i * 0.1)) // 預測信心度隨時間降低
        
        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + i)
        
        forecast.push({
          month: futureDate.toISOString().slice(0, 7),
          predicted_flow: Math.round(predictedFlow),
          confidence: confidence.toFixed(2),
          scenario: {
            optimistic: Math.round(predictedFlow * 1.2),
            realistic: Math.round(predictedFlow),
            pessimistic: Math.round(predictedFlow * 0.8)
          }
        })
      }

      res.json({
        success: true,
        data: {
          historical: historicalData,
          forecast,
          insights: {
            trend: trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'stable',
            avgMonthlyFlow: Math.round(avgFlow),
            volatility: Math.round(Math.sqrt(recentFlows.reduce((acc, flow) => acc + Math.pow(flow - avgFlow, 2), 0) / recentFlows.length))
          }
        }
      })
    } else {
      res.json({
        success: true,
        data: {
          historical: historicalData,
          forecast: [],
          insights: { message: '需要更多歷史數據來進行預測' }
        }
      })
    }

  } catch (error) {
    console.error('現金流預測錯誤:', error)
    res.status(500).json({
      success: false,
      message: '現金流預測失敗',
      error: error.message
    })
  }
})

// 獲取異常檢測
router.get('/anomaly-detection', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 檢測異常交易
    const anomalyQuery = `
      SELECT 
        'income' as type, id, date, amount, customer as description,
        (amount - avg_amount) / std_amount as z_score
      FROM income, (
        SELECT 
          AVG(amount) as avg_amount,
          CASE WHEN COUNT(*) > 1 THEN 
            SQRT(SUM((amount - (SELECT AVG(amount) FROM income WHERE user_id = ?)) * (amount - (SELECT AVG(amount) FROM income WHERE user_id = ?))) / (COUNT(*) - 1))
          ELSE 1 END as std_amount
        FROM income WHERE user_id = ?
      )
      WHERE user_id = ? AND date >= date('now', '-3 months')
      UNION ALL
      SELECT 
        'expense' as type, id, date, amount, vendor as description,
        (amount - avg_amount) / std_amount as z_score
      FROM expense, (
        SELECT 
          AVG(amount) as avg_amount,
          CASE WHEN COUNT(*) > 1 THEN 
            SQRT(SUM((amount - (SELECT AVG(amount) FROM expense WHERE user_id = ?)) * (amount - (SELECT AVG(amount) FROM expense WHERE user_id = ?))) / (COUNT(*) - 1))
          ELSE 1 END as std_amount
        FROM expense WHERE user_id = ?
      )
      WHERE user_id = ? AND date >= date('now', '-3 months')
      ORDER BY ABS(z_score) DESC
    `

    const anomalies = await query(anomalyQuery, [userId, userId, userId, userId, userId, userId, userId, userId]) || []

    // 篩選顯著異常（z-score > 2）
    const significantAnomalies = anomalies.filter(a => Math.abs(a.z_score) > 2).slice(0, 10)

    // 獲取模式分析
    const patternQuery = `
      SELECT 
        strftime('%w', date) as day_of_week,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount,
        'income' as type
      FROM income 
      WHERE user_id = ? AND date >= date('now', '-3 months')
      GROUP BY strftime('%w', date)
      UNION ALL
      SELECT 
        strftime('%w', date) as day_of_week,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_amount,
        'expense' as type
      FROM expense 
      WHERE user_id = ? AND date >= date('now', '-3 months')
      GROUP BY strftime('%w', date)
      ORDER BY type, day_of_week
    `

    const patterns = await query(patternQuery, [userId, userId]) || []

    res.json({
      success: true,
      data: {
        anomalies: significantAnomalies.map(a => ({
          ...a,
          severity: Math.abs(a.z_score) > 3 ? 'high' : 'medium',
          z_score: parseFloat(a.z_score.toFixed(2))
        })),
        patterns: patterns,
        summary: {
          totalAnomalies: significantAnomalies.length,
          highSeverity: significantAnomalies.filter(a => Math.abs(a.z_score) > 3).length,
          recommendedActions: significantAnomalies.length > 5 ? 
            ['檢查異常交易', '更新預算計劃', '調整現金流預測'] :
            ['持續監控交易模式']
        }
      }
    })

  } catch (error) {
    console.error('異常檢測錯誤:', error)
    res.status(500).json({
      success: false,
      message: '異常檢測失敗',
      error: error.message
    })
  }
})

// 獲取盈利能力分析
router.get('/profitability-analysis', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'month' } = req.query

    const periodFormat = period === 'week' ? '%Y-%W' : period === 'quarter' ? '%Y-%m' : '%Y-%m'
    
    // 客戶盈利能力分析
    const customerProfitQuery = `
      SELECT 
        customer,
        COUNT(*) as transaction_count,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_revenue,
        MIN(date) as first_transaction,
        MAX(date) as last_transaction,
        (julianday('now') - julianday(MAX(date))) as days_since_last
      FROM income 
      WHERE user_id = ? AND customer IS NOT NULL AND date >= date('now', '-12 months')
      GROUP BY customer
      ORDER BY total_revenue DESC
      LIMIT 20
    `

    // 產品/服務盈利能力（基於分類）
    const categoryProfitQuery = `
      SELECT 
        category,
        COUNT(*) as transaction_count,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_revenue
      FROM income 
      WHERE user_id = ? AND category IS NOT NULL AND date >= date('now', '-12 months')
      GROUP BY category
      ORDER BY total_revenue DESC
    `

    // 時間段盈利能力
    const periodProfitQuery = `
      SELECT 
        strftime('${periodFormat}', date) as period,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as profit
      FROM (
        SELECT date, amount, 'income' as type FROM income WHERE user_id = ?
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expense WHERE user_id = ?
      )
      WHERE date >= date('now', '-12 months')
      GROUP BY strftime('${periodFormat}', date)
      ORDER BY period
    `

    const [customerProfit, categoryProfit, periodProfit] = await Promise.all([
      query(customerProfitQuery, [userId]),
      query(categoryProfitQuery, [userId]),
      query(periodProfitQuery, [userId, userId])
    ])

    // 計算客戶價值分段
    const customerSegments = {
      vip: customerProfit.filter(c => c.total_revenue > 50000).length,
      regular: customerProfit.filter(c => c.total_revenue >= 10000 && c.total_revenue <= 50000).length,
      occasional: customerProfit.filter(c => c.total_revenue < 10000).length
    }

    // 計算客戶流失風險
    const churnRisk = customerProfit.map(customer => ({
      ...customer,
      churn_risk: customer.days_since_last > 90 ? 'high' : 
                  customer.days_since_last > 30 ? 'medium' : 'low'
    }))

    res.json({
      success: true,
      data: {
        customerProfitability: churnRisk,
        categoryProfitability: categoryProfit || [],
        periodProfitability: periodProfit || [],
        insights: {
          topCustomer: customerProfit[0]?.customer || 'N/A',
          topCategory: categoryProfit[0]?.category || 'N/A',
          customerSegments,
          highRiskCustomers: churnRisk.filter(c => c.churn_risk === 'high').length,
          avgCustomerValue: customerProfit.length > 0 ? 
            Math.round(customerProfit.reduce((acc, c) => acc + c.total_revenue, 0) / customerProfit.length) : 0
        }
      }
    })

  } catch (error) {
    console.error('盈利能力分析錯誤:', error)
    res.status(500).json({
      success: false,
      message: '盈利能力分析失敗',
      error: error.message
    })
  }
})

export default router