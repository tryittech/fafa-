import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class BudgetModel {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../fafa.db'))
    this.initTables()
  }

  initTables() {
    // 預算設定表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        budget_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
        amount DECIMAL(10,2) NOT NULL,
        period TEXT NOT NULL, -- 2024-01, 2024 等
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 預算執行記錄表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS budget_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budget_id INTEGER NOT NULL,
        period TEXT NOT NULL,
        actual_amount DECIMAL(10,2) DEFAULT 0,
        usage_percentage DECIMAL(5,2) DEFAULT 0,
        status TEXT DEFAULT 'normal', -- normal, warning, exceeded
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (budget_id) REFERENCES budgets (id)
      )
    `)

    // 預算分類表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS budget_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT DEFAULT '💰',
        color TEXT DEFAULT '#1890ff',
        is_income BOOLEAN DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 插入預設預算分類
    this.insertDefaultCategories()
  }

  insertDefaultCategories() {
    const existingCategories = this.db.prepare('SELECT COUNT(*) as count FROM budget_categories').get()
    
    if (existingCategories.count === 0) {
      const categories = [
        { name: '租金費用', description: '辦公室、店面租金', icon: '🏢', color: '#f5222d', is_income: 0, sort_order: 1 },
        { name: '薪資費用', description: '員工薪資、獎金', icon: '👥', color: '#fa541c', is_income: 0, sort_order: 2 },
        { name: '水電費', description: '水費、電費、瓦斯費', icon: '⚡', color: '#fa8c16', is_income: 0, sort_order: 3 },
        { name: '行銷費用', description: '廣告、推廣費用', icon: '📢', color: '#faad14', is_income: 0, sort_order: 4 },
        { name: '辦公用品', description: '文具、設備採購', icon: '📝', color: '#a0d911', is_income: 0, sort_order: 5 },
        { name: '差旅費', description: '出差、交通費用', icon: '✈️', color: '#52c41a', is_income: 0, sort_order: 6 },
        { name: '保險費', description: '商業保險費用', icon: '🛡️', color: '#13c2c2', is_income: 0, sort_order: 7 },
        { name: '其他支出', description: '其他雜項支出', icon: '📦', color: '#1890ff', is_income: 0, sort_order: 8 },
        { name: '營業收入', description: '主要營業收入', icon: '💰', color: '#722ed1', is_income: 1, sort_order: 1 },
        { name: '其他收入', description: '其他收入來源', icon: '🎁', color: '#eb2f96', is_income: 1, sort_order: 2 }
      ]

      const insertStmt = this.db.prepare(`
        INSERT INTO budget_categories (name, description, icon, color, is_income, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      categories.forEach(cat => {
        insertStmt.run(cat.name, cat.description, cat.icon, cat.color, cat.is_income, cat.sort_order)
      })
    }
  }

  // 獲取所有預算分類
  getCategories() {
    return this.db.prepare(`
      SELECT * FROM budget_categories 
      ORDER BY is_income DESC, sort_order ASC
    `).all()
  }

  // 創建新預算
  createBudget(budgetData) {
    const { name, category, budget_type, amount, period, description } = budgetData
    
    const stmt = this.db.prepare(`
      INSERT INTO budgets (name, category, budget_type, amount, period, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(name, category, budget_type, amount, period, description)
    
    // 同時創建執行記錄
    this.createBudgetExecution(result.lastInsertRowid, period)
    
    return this.getBudget(result.lastInsertRowid)
  }

  // 獲取單個預算
  getBudget(id) {
    return this.db.prepare(`
      SELECT b.*, bc.name as category_name, bc.icon, bc.color,
             be.actual_amount, be.usage_percentage, be.status
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category = bc.name
      LEFT JOIN budget_executions be ON b.id = be.budget_id AND be.period = b.period
      WHERE b.id = ?
    `).get(id)
  }

  // 獲取預算列表
  getBudgets(filters = {}) {
    let query = `
      SELECT b.*, bc.name as category_name, bc.icon, bc.color,
             be.actual_amount, be.usage_percentage, be.status
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category = bc.name
      LEFT JOIN budget_executions be ON b.id = be.budget_id AND be.period = b.period
      WHERE 1=1
    `
    const params = []

    if (filters.period) {
      query += ' AND b.period = ?'
      params.push(filters.period)
    }

    if (filters.budget_type) {
      query += ' AND b.budget_type = ?'
      params.push(filters.budget_type)
    }

    if (filters.category) {
      query += ' AND b.category = ?'
      params.push(filters.category)
    }

    query += ' ORDER BY b.created_at DESC'

    return this.db.prepare(query).all(...params)
  }

  // 更新預算
  updateBudget(id, budgetData) {
    const { name, category, budget_type, amount, period, description } = budgetData
    
    const stmt = this.db.prepare(`
      UPDATE budgets 
      SET name = ?, category = ?, budget_type = ?, amount = ?, 
          period = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    stmt.run(name, category, budget_type, amount, period, description, id)
    return this.getBudget(id)
  }

  // 刪除預算
  deleteBudget(id) {
    // 先刪除執行記錄
    this.db.prepare('DELETE FROM budget_executions WHERE budget_id = ?').run(id)
    // 再刪除預算
    return this.db.prepare('DELETE FROM budgets WHERE id = ?').run(id)
  }

  // 創建預算執行記錄
  createBudgetExecution(budgetId, period) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO budget_executions (budget_id, period, actual_amount, usage_percentage, status)
      VALUES (?, ?, 0, 0, 'normal')
    `)
    
    return stmt.run(budgetId, period)
  }

  // 更新預算執行狀況
  updateBudgetExecution(budgetId, period) {
    const budget = this.getBudget(budgetId)
    if (!budget) return null

    // 根據預算類別計算實際支出
    let actualAmount = 0
    
    if (budget.category_name && budget.category_name !== '營業收入' && budget.category_name !== '其他收入') {
      // 支出預算：從expenses表計算
      const expenseStmt = this.db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses 
        WHERE category = ? 
        AND strftime('%Y-%m', date) = ?
      `)
      
      const categoryMapping = {
        '租金費用': 'rent',
        '薪資費用': 'salary', 
        '水電費': 'utilities',
        '行銷費用': 'marketing',
        '辦公用品': 'office',
        '差旅費': 'travel',
        '保險費': 'insurance',
        '其他支出': 'other'
      }
      
      const expenseCategory = categoryMapping[budget.category_name] || 'other'
      const result = expenseStmt.get(expenseCategory, period)
      actualAmount = result.total || 0
    } else {
      // 收入預算：從incomes表計算
      const incomeStmt = this.db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM incomes 
        WHERE strftime('%Y-%m', date) = ?
      `)
      
      const result = incomeStmt.get(period)
      actualAmount = result.total || 0
    }

    // 計算使用百分比
    const usagePercentage = budget.amount > 0 ? (actualAmount / budget.amount) * 100 : 0
    
    // 判斷狀態
    let status = 'normal'
    if (usagePercentage >= 100) {
      status = 'exceeded'
    } else if (usagePercentage >= 80) {
      status = 'warning'
    }

    // 更新執行記錄
    const updateStmt = this.db.prepare(`
      UPDATE budget_executions 
      SET actual_amount = ?, usage_percentage = ?, status = ?, last_updated = CURRENT_TIMESTAMP
      WHERE budget_id = ? AND period = ?
    `)
    
    updateStmt.run(actualAmount, usagePercentage, status, budgetId, period)
    
    return {
      budgetId,
      period,
      actualAmount,
      usagePercentage,
      status
    }
  }

  // 獲取預算概覽統計
  getBudgetOverview(period) {
    const budgets = this.getBudgets({ period })
    
    let totalBudget = 0
    let totalActual = 0
    let exceededCount = 0
    let warningCount = 0
    
    budgets.forEach(budget => {
      totalBudget += budget.amount || 0
      totalActual += budget.actual_amount || 0
      
      if (budget.status === 'exceeded') exceededCount++
      else if (budget.status === 'warning') warningCount++
    })

    return {
      period,
      totalBudgets: budgets.length,
      totalBudget,
      totalActual,
      overallUsage: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
      exceededCount,
      warningCount,
      normalCount: budgets.length - exceededCount - warningCount
    }
  }

  // 更新所有預算的執行狀況
  updateAllBudgetExecutions(period) {
    const budgets = this.getBudgets({ period })
    const results = []
    
    budgets.forEach(budget => {
      const result = this.updateBudgetExecution(budget.id, period)
      if (result) results.push(result)
    })
    
    return results
  }
}

export default BudgetModel