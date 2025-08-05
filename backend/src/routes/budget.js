import express from 'express'
import BudgetModel from '../models/budget.js'

const router = express.Router()
const budgetModel = new BudgetModel()

// 獲取預算分類
router.get('/categories', (req, res) => {
  try {
    const categories = budgetModel.getCategories()
    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('獲取預算分類失敗:', error)
    res.status(500).json({
      success: false,
      message: '獲取預算分類失敗',
      error: error.message
    })
  }
})

// 獲取預算列表
router.get('/', (req, res) => {
  try {
    const { period, budget_type, category } = req.query
    const filters = {}
    
    if (period) filters.period = period
    if (budget_type) filters.budget_type = budget_type
    if (category) filters.category = category

    const budgets = budgetModel.getBudgets(filters)
    
    res.json({
      success: true,
      data: budgets
    })
  } catch (error) {
    console.error('獲取預算列表失敗:', error)
    res.status(500).json({
      success: false,
      message: '獲取預算列表失敗',
      error: error.message
    })
  }
})

// 獲取預算概覽
router.get('/overview/:period', (req, res) => {
  try {
    const { period } = req.params
    
    // 更新所有預算執行狀況
    budgetModel.updateAllBudgetExecutions(period)
    
    // 獲取概覽數據
    const overview = budgetModel.getBudgetOverview(period)
    
    res.json({
      success: true,
      data: overview
    })
  } catch (error) {
    console.error('獲取預算概覽失敗:', error)
    res.status(500).json({
      success: false,
      message: '獲取預算概覽失敗',
      error: error.message
    })
  }
})

// 獲取單個預算
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const budget = budgetModel.getBudget(id)
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: '預算不存在'
      })
    }

    // 更新執行狀況
    budgetModel.updateBudgetExecution(id, budget.period)
    
    // 重新獲取更新後的數據
    const updatedBudget = budgetModel.getBudget(id)
    
    res.json({
      success: true,
      data: updatedBudget
    })
  } catch (error) {
    console.error('獲取預算失敗:', error)
    res.status(500).json({
      success: false,
      message: '獲取預算失敗',
      error: error.message
    })
  }
})

// 創建新預算
router.post('/', (req, res) => {
  try {
    const { name, category, budget_type, amount, period, description } = req.body
    
    // 驗證必填欄位
    if (!name || !category || !budget_type || !amount || !period) {
      return res.status(400).json({
        success: false,
        message: '請填寫所有必填欄位'
      })
    }

    // 驗證金額
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '預算金額必須大於0'
      })
    }

    const budgetData = {
      name,
      category,
      budget_type,
      amount: parseFloat(amount),
      period,
      description: description || ''
    }
    
    const budget = budgetModel.createBudget(budgetData)
    
    res.status(201).json({
      success: true,
      message: '預算創建成功',
      data: budget
    })
  } catch (error) {
    console.error('創建預算失敗:', error)
    res.status(500).json({
      success: false,
      message: '創建預算失敗',
      error: error.message
    })
  }
})

// 更新預算
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const { name, category, budget_type, amount, period, description } = req.body
    
    // 檢查預算是否存在
    const existingBudget = budgetModel.getBudget(id)
    if (!existingBudget) {
      return res.status(404).json({
        success: false,
        message: '預算不存在'
      })
    }

    // 驗證必填欄位
    if (!name || !category || !budget_type || !amount || !period) {
      return res.status(400).json({
        success: false,
        message: '請填寫所有必填欄位'
      })
    }

    // 驗證金額
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '預算金額必須大於0'
      })
    }

    const budgetData = {
      name,
      category,
      budget_type,
      amount: parseFloat(amount),
      period,
      description: description || ''
    }
    
    const budget = budgetModel.updateBudget(id, budgetData)
    
    // 更新執行狀況
    budgetModel.updateBudgetExecution(id, period)
    
    res.json({
      success: true,
      message: '預算更新成功',
      data: budget
    })
  } catch (error) {
    console.error('更新預算失敗:', error)
    res.status(500).json({
      success: false,
      message: '更新預算失敗',
      error: error.message
    })
  }
})

// 刪除預算
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    
    // 檢查預算是否存在
    const existingBudget = budgetModel.getBudget(id)
    if (!existingBudget) {
      return res.status(404).json({
        success: false,
        message: '預算不存在'
      })
    }

    budgetModel.deleteBudget(id)
    
    res.json({
      success: true,
      message: '預算刪除成功'
    })
  } catch (error) {
    console.error('刪除預算失敗:', error)
    res.status(500).json({
      success: false,
      message: '刪除預算失敗',
      error: error.message
    })
  }
})

// 手動更新預算執行狀況
router.post('/:id/update-execution', (req, res) => {
  try {
    const { id } = req.params
    const { period } = req.body
    
    const budget = budgetModel.getBudget(id)
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: '預算不存在'
      })
    }

    const result = budgetModel.updateBudgetExecution(id, period || budget.period)
    
    res.json({
      success: true,
      message: '預算執行狀況更新成功',
      data: result
    })
  } catch (error) {
    console.error('更新預算執行狀況失敗:', error)
    res.status(500).json({
      success: false,
      message: '更新預算執行狀況失敗',
      error: error.message
    })
  }
})

export default router