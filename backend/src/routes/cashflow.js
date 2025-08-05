import express from 'express'
import { query, get } from '../utils/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * 現金流預測 API
 * 基於歷史數據和趨勢分析進行現金流預測
 */

// 獲取現金流預測數據
router.get('/forecast/:days', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30
    
    // 獲取歷史現金流數據（最近3個月）
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0]
    
    const userId = req.user.userId;
    
    // 查詢歷史收入數據
    const incomeHistory = await query(`
      SELECT 
        date,
        SUM(amount) as daily_income,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_transaction
      FROM income 
      WHERE user_id = ? AND date >= ? AND status = 'paid'
      GROUP BY date
      ORDER BY date
    `, [userId, threeMonthsAgoStr]) || []
    
    // 查詢歷史支出數據
    const expenseHistory = await query(`
      SELECT 
        date,
        SUM(amount) as daily_expense,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_transaction
      FROM expense 
      WHERE user_id = ? AND date >= ? AND status = 'paid'
      GROUP BY date
      ORDER BY date
    `, [userId, threeMonthsAgoStr]) || []
    
    // 查詢當前現金餘額
    const currentBalance = await getCurrentCashBalance(userId)
    
    // 查詢應收應付款項
    const pendingIncome = await query(`
      SELECT SUM(amount) as amount, date as due_date 
      FROM income 
      WHERE user_id = ? AND status = 'pending' AND date >= date('now')
      GROUP BY date
      ORDER BY date
    `, [userId]) || []
    
    const pendingExpenses = await query(`
      SELECT SUM(amount) as amount, date 
      FROM expense 
      WHERE user_id = ? AND status = 'pending' AND date >= date('now')
      GROUP BY date
      ORDER BY date
    `, [userId]) || []
    
    // 計算預測數據
    const forecast = calculateCashFlowForecast({
      days,
      currentBalance,
      incomeHistory,
      expenseHistory,
      pendingIncome,
      pendingExpenses
    })
    
    res.json({
      success: true,
      data: forecast
    })
    
  } catch (error) {
    console.error('現金流預測錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取現金流預測失敗',
      error: error.message
    })
  }
})

// 獲取現金流分析
router.get('/analysis', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 獲取最近12個月的現金流數據
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0]
    
    // 月度收入趨勢
    const monthlyIncome = await query(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total_income,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_income
      FROM income 
      WHERE user_id = ? AND date >= ? AND status = 'paid'
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `, [userId, oneYearAgoStr]) || []
    
    // 月度支出趨勢
    const monthlyExpenses = await query(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total_expense,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_expense
      FROM expense 
      WHERE user_id = ? AND date >= ? AND status = 'paid'
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `, [userId, oneYearAgoStr]) || []
    
    // 現金流模式分析
    const cashFlowPatterns = analyzeCashFlowPatterns(monthlyIncome, monthlyExpenses)
    
    // 季節性分析
    const seasonalAnalysis = analyzeSeasonality(monthlyIncome, monthlyExpenses)
    
    // 風險評估
    const riskAssessment = assessCashFlowRisk(monthlyIncome, monthlyExpenses)
    
    res.json({
      success: true,
      data: {
        monthlyIncome,
        monthlyExpenses,
        patterns: cashFlowPatterns,
        seasonal: seasonalAnalysis,
        risk: riskAssessment
      }
    })
    
  } catch (error) {
    console.error('現金流分析錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取現金流分析失敗',
      error: error.message
    })
  }
})

// 獲取現金流預警
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 獲取當前現金餘額
    const currentBalance = await getCurrentCashBalance(userId)
    
    // 獲取基礎歷史數據進行預測
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0]
    
    const incomeHistory = await query(`
      SELECT date, SUM(amount) as daily_income FROM income 
      WHERE user_id = ? AND date >= ? AND status = 'paid' 
      GROUP BY date ORDER BY date
    `, [userId, threeMonthsAgoStr]) || []
    
    const expenseHistory = await query(`
      SELECT date, SUM(amount) as daily_expense FROM expense 
      WHERE user_id = ? AND date >= ? AND status = 'paid' 
      GROUP BY date ORDER BY date
    `, [userId, threeMonthsAgoStr]) || []
    
    // 獲取30天現金流預測
    const forecast = calculateCashFlowForecast({
      days: 30,
      currentBalance,
      incomeHistory,
      expenseHistory,
      pendingIncome: [],
      pendingExpenses: []
    })
    
    // 生成預警信息
    const alerts = await generateCashFlowAlerts(forecast, userId)
    
    res.json({
      success: true,
      data: alerts
    })
    
  } catch (error) {
    console.error('現金流預警錯誤:', error)
    res.status(500).json({
      success: false,
      message: '獲取現金流預警失敗',
      error: error.message
    })
  }
})

// 工具函數：獲取當前現金餘額
async function getCurrentCashBalance(userId) {
  try {
    // 計算總收入
    const totalIncomeResult = await get(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM income 
      WHERE user_id = ? AND status = 'paid'
    `, [userId])
    const totalIncome = totalIncomeResult?.total || 0
    
    // 計算總支出
    const totalExpenseResult = await get(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expense 
      WHERE user_id = ? AND status = 'paid'
    `, [userId])
    const totalExpense = totalExpenseResult?.total || 0
    
    return totalIncome - totalExpense
  } catch (error) {
    console.error('獲取現金餘額錯誤:', error)
    return 0
  }
}

// 工具函數：計算現金流預測
function calculateCashFlowForecast({
  days,
  currentBalance,
  incomeHistory,
  expenseHistory,
  pendingIncome,
  pendingExpenses
}) {
  const forecast = []
  const dailyIncome = calculateAverageDaily(incomeHistory, 'daily_income')
  const dailyExpense = calculateAverageDaily(expenseHistory, 'daily_expense')
  
  let runningBalance = currentBalance
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const forecastDate = new Date(today)
    forecastDate.setDate(today.getDate() + i)
    
    const dateStr = forecastDate.toISOString().split('T')[0]
    
    // 計算當日預測收入
    let predictedIncome = dailyIncome
    
    // 檢查是否有確定的應收款項
    const confirmedIncome = pendingIncome.find(item => item.due_date === dateStr)
    if (confirmedIncome) {
      predictedIncome += confirmedIncome.amount
    }
    
    // 計算當日預測支出
    let predictedExpense = dailyExpense
    
    // 檢查是否有確定的應付款項
    const confirmedExpense = pendingExpenses.find(item => item.date === dateStr)
    if (confirmedExpense) {
      predictedExpense += confirmedExpense.amount
    }
    
    // 應用季節性調整
    const seasonalMultiplier = getSeasonalMultiplier(forecastDate)
    predictedIncome *= seasonalMultiplier.income
    predictedExpense *= seasonalMultiplier.expense
    
    // 計算淨現金流
    const netCashFlow = predictedIncome - predictedExpense
    runningBalance += netCashFlow
    
    // 風險等級評估
    const riskLevel = assessDailyRisk(runningBalance, currentBalance)
    
    forecast.push({
      date: dateStr,
      predictedIncome: Math.round(predictedIncome),
      predictedExpense: Math.round(predictedExpense),
      netCashFlow: Math.round(netCashFlow),
      cumulativeBalance: Math.round(runningBalance),
      riskLevel,
      confidence: calculateConfidence(i, incomeHistory.length, expenseHistory.length)
    })
  }
  
  return {
    currentBalance: Math.round(currentBalance),
    forecastPeriod: days,
    dailyForecast: forecast,
    summary: {
      totalPredictedIncome: Math.round(forecast.reduce((sum, day) => sum + day.predictedIncome, 0)),
      totalPredictedExpense: Math.round(forecast.reduce((sum, day) => sum + day.predictedExpense, 0)),
      finalBalance: Math.round(forecast[forecast.length - 1]?.cumulativeBalance || currentBalance),
      worstCaseBalance: Math.round(Math.min(...forecast.map(day => day.cumulativeBalance))),
      riskDays: forecast.filter(day => day.riskLevel === 'high').length
    }
  }
}

// 工具函數：計算日均值
function calculateAverageDaily(data, field) {
  if (!data || data.length === 0) return 0
  
  const total = data.reduce((sum, item) => sum + (item[field] || 0), 0)
  return total / data.length
}

// 工具函數：獲取季節性乘數
function getSeasonalMultiplier(date) {
  const month = date.getMonth() + 1
  
  // 基於一般商業季節性模式
  const seasonalFactors = {
    1: { income: 0.85, expense: 0.9 },   // 一月
    2: { income: 0.9, expense: 0.95 },   // 二月
    3: { income: 1.05, expense: 1.0 },   // 三月
    4: { income: 1.0, expense: 1.0 },    // 四月
    5: { income: 1.1, expense: 1.05 },   // 五月
    6: { income: 1.15, expense: 1.1 },   // 六月
    7: { income: 1.1, expense: 1.05 },   // 七月
    8: { income: 1.05, expense: 1.0 },   // 八月
    9: { income: 1.1, expense: 1.05 },   // 九月
    10: { income: 1.15, expense: 1.1 },  // 十月
    11: { income: 1.2, expense: 1.15 },  // 十一月
    12: { income: 1.25, expense: 1.2 }   // 十二月
  }
  
  return seasonalFactors[month] || { income: 1.0, expense: 1.0 }
}

// 工具函數：評估每日風險
function assessDailyRisk(balance, initialBalance) {
  const balanceRatio = balance / initialBalance
  
  if (balance < 0) return 'critical'
  if (balanceRatio < 0.2) return 'high'
  if (balanceRatio < 0.5) return 'medium'
  return 'low'
}

// 工具函數：計算預測信心度
function calculateConfidence(dayIndex, incomeDataPoints, expenseDataPoints) {
  const dataQuality = Math.min(incomeDataPoints, expenseDataPoints) / 90 // 90天為滿分
  const timeDecay = Math.max(0, 1 - (dayIndex / 30)) // 30天後信心度開始下降
  
  return Math.round(Math.min(1, dataQuality * timeDecay) * 100)
}

// 工具函數：分析現金流模式
function analyzeCashFlowPatterns(incomeData, expenseData) {
  // 計算收入趨勢
  const incomeTrend = calculateTrend(incomeData.map(item => item.total_income))
  const expenseTrend = calculateTrend(expenseData.map(item => item.total_expense))
  
  // 計算波動性
  const incomeVolatility = calculateVolatility(incomeData.map(item => item.total_income))
  const expenseVolatility = calculateVolatility(expenseData.map(item => item.total_expense))
  
  return {
    income: {
      trend: incomeTrend > 0 ? 'increasing' : incomeTrend < 0 ? 'decreasing' : 'stable',
      trendValue: incomeTrend,
      volatility: incomeVolatility,
      averageMonthly: incomeData.reduce((sum, item) => sum + item.total_income, 0) / incomeData.length
    },
    expense: {
      trend: expenseTrend > 0 ? 'increasing' : expenseTrend < 0 ? 'decreasing' : 'stable',
      trendValue: expenseTrend,
      volatility: expenseVolatility,
      averageMonthly: expenseData.reduce((sum, item) => sum + item.total_expense, 0) / expenseData.length
    }
  }
}

// 工具函數：計算趨勢
function calculateTrend(data) {
  if (data.length < 2) return 0
  
  const n = data.length
  const sumX = (n * (n + 1)) / 2
  const sumY = data.reduce((sum, val) => sum + val, 0)
  const sumXY = data.reduce((sum, val, index) => sum + (index + 1) * val, 0)
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6
  
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
}

// 工具函數：計算波動性
function calculateVolatility(data) {
  if (data.length < 2) return 0
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  
  return Math.sqrt(variance) / mean // 變異係數
}

// 工具函數：季節性分析
function analyzeSeasonality(incomeData, expenseData) {
  const monthlyAverage = {}
  
  // 按月份計算平均值
  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, '0')
    const monthlyIncome = incomeData.filter(item => item.month.endsWith(`-${monthStr}`))
    const monthlyExpense = expenseData.filter(item => item.month.endsWith(`-${monthStr}`))
    
    monthlyAverage[month] = {
      income: monthlyIncome.reduce((sum, item) => sum + item.total_income, 0) / Math.max(monthlyIncome.length, 1),
      expense: monthlyExpense.reduce((sum, item) => sum + item.total_expense, 0) / Math.max(monthlyExpense.length, 1)
    }
  }
  
  return monthlyAverage
}

// 工具函數：風險評估
function assessCashFlowRisk(incomeData, expenseData) {
  const totalIncome = incomeData.reduce((sum, item) => sum + item.total_income, 0)
  const totalExpense = expenseData.reduce((sum, item) => sum + item.total_expense, 0)
  const netCashFlow = totalIncome - totalExpense
  
  const incomeVolatility = calculateVolatility(incomeData.map(item => item.total_income))
  const expenseVolatility = calculateVolatility(expenseData.map(item => item.total_expense))
  
  let riskScore = 0
  let riskFactors = []
  
  // 現金流為負
  if (netCashFlow < 0) {
    riskScore += 30
    riskFactors.push('負現金流')
  }
  
  // 收入波動性過高
  if (incomeVolatility > 0.3) {
    riskScore += 25
    riskFactors.push('收入不穩定')
  }
  
  // 支出波動性過高
  if (expenseVolatility > 0.2) {
    riskScore += 20
    riskFactors.push('支出不可控')
  }
  
  // 現金流比例過低
  const cashFlowRatio = Math.abs(netCashFlow) / totalIncome
  if (cashFlowRatio < 0.1) {
    riskScore += 15
    riskFactors.push('現金流比例偏低')
  }
  
  return {
    score: Math.min(riskScore, 100),
    level: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
    factors: riskFactors,
    recommendations: generateRiskRecommendations(riskFactors)
  }
}

// 工具函數：生成風險建議
function generateRiskRecommendations(riskFactors) {
  const recommendations = []
  
  if (riskFactors.includes('負現金流')) {
    recommendations.push('加強應收帳款催收，延後非必要支出')
  }
  
  if (riskFactors.includes('收入不穩定')) {
    recommendations.push('多元化收入來源，建立穩定客戶群')
  }
  
  if (riskFactors.includes('支出不可控')) {
    recommendations.push('建立詳細預算計劃，控制變動成本')
  }
  
  if (riskFactors.includes('現金流比例偏低')) {
    recommendations.push('提高毛利率，優化成本結構')
  }
  
  return recommendations
}

// 工具函數：生成現金流預警
async function generateCashFlowAlerts(forecast, userId) {
  const alerts = []
  
  // 檢查是否有資金短缺風險
  const criticalDays = forecast.dailyForecast.filter(day => day.riskLevel === 'critical')
  if (criticalDays.length > 0) {
    alerts.push({
      type: 'critical',
      title: '資金短缺警告',
      message: `預計在 ${criticalDays[0].date} 出現資金短缺，請立即採取行動`,
      urgency: 'immediate',
      recommendations: ['立即催收應收帳款', '暫停非必要支出', '考慮短期融資']
    })
  }
  
  // 檢查高風險期間
  const highRiskDays = forecast.dailyForecast.filter(day => day.riskLevel === 'high')
  if (highRiskDays.length > 5) {
    alerts.push({
      type: 'warning',
      title: '現金流風險警示',
      message: `未來 ${forecast.forecastPeriod} 天內有 ${highRiskDays.length} 天處於高風險狀態`,
      urgency: 'high',
      recommendations: ['檢視預算執行', '加強現金流管理', '準備應急資金']
    })
  }
  
  // 檢查應收帳款逾期
  try {
    const overdueIncome = await get(`
      SELECT COUNT(*) as count, SUM(amount) as amount 
      FROM income 
      WHERE user_id = ? AND status = 'pending' AND date < date('now')
    `, [userId]) || { count: 0, amount: 0 }
    
    if (overdueIncome.count > 0) {
      alerts.push({
        type: 'warning',
        title: '應收帳款逾期',
        message: `有 ${overdueIncome.count} 筆應收帳款逾期，金額 $${(overdueIncome.amount || 0).toLocaleString()}`,
        urgency: 'medium',
        recommendations: ['聯繫逾期客戶', '檢討信用政策', '考慮應收帳款保險']
      })
    }
  } catch (error) {
    console.error('檢查逾期帳款錯誤:', error)
  }
  
  return alerts
}

export default router