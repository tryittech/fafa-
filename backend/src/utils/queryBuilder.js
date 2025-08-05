// 查詢建構器工具 - 減少重複代碼並提高安全性

/**
 * 建構分頁查詢
 * @param {string} baseQuery - 基礎查詢語句
 * @param {Array} baseParams - 基礎參數
 * @param {Object} filters - 篩選條件
 * @param {Object} pagination - 分頁參數
 * @returns {Object} 包含查詢語句和參數的物件
 */
export const buildPaginatedQuery = (baseQuery, baseParams = [], filters = {}, pagination = {}) => {
  let query = baseQuery
  let params = [...baseParams]
  
  // 動態添加篩選條件
  const filterMappings = {
    status: 'status = ?',
    category: 'category = ?',
    customer: 'customer LIKE ?',
    vendor: 'vendor LIKE ?',
    startDate: 'date >= ?',
    endDate: 'date <= ?'
  }
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (filterMappings[key]) {
        query += ` AND ${filterMappings[key]}`
        // 對於 LIKE 查詢，添加 % 通配符
        if (key === 'customer' || key === 'vendor') {
          params.push(`%${value}%`)
        } else {
          params.push(value)
        }
      }
    }
  })
  
  // 添加排序
  query += ' ORDER BY date DESC, created_at DESC'
  
  // 添加分頁
  const { page = 1, limit = 10 } = pagination
  const offset = (page - 1) * limit
  query += ' LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)
  
  return { query, params }
}

/**
 * 建構計數查詢
 * @param {string} table - 表名
 * @param {Object} filters - 篩選條件
 * @returns {Object} 包含查詢語句和參數的物件
 */
export const buildCountQuery = (table, filters = {}) => {
  let query = `SELECT COUNT(*) as total FROM ${table} WHERE 1=1`
  let params = []
  
  const filterMappings = {
    status: 'status = ?',
    category: 'category = ?',
    customer: 'customer LIKE ?',
    vendor: 'vendor LIKE ?',
    startDate: 'date >= ?',
    endDate: 'date <= ?'
  }
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (filterMappings[key]) {
        query += ` AND ${filterMappings[key]}`
        if (key === 'customer' || key === 'vendor') {
          params.push(`%${value}%`)
        } else {
          params.push(value)
        }
      }
    }
  })
  
  return { query, params }
}

/**
 * 建構統計查詢
 * @param {string} table - 表名
 * @param {Object} filters - 篩選條件
 * @returns {Object} 包含查詢語句和參數的物件
 */
export const buildStatsQuery = (table, filters = {}) => {
  const isIncomeTable = table === 'income'
  
  let query = `
    SELECT 
      COUNT(*) as total_count,
      SUM(amount) as total_amount,
      SUM(tax_amount) as total_tax,
      SUM(total_amount) as total_with_tax,
      SUM(CASE WHEN status = '${isIncomeTable ? 'received' : 'paid'}' THEN total_amount ELSE 0 END) as ${isIncomeTable ? 'received' : 'paid'}_amount,
      SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_amount,
      SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as overdue_amount
    FROM ${table}
    WHERE 1=1
  `
  
  let params = []
  
  const filterMappings = {
    status: 'status = ?',
    category: 'category = ?',
    customer: 'customer LIKE ?',
    vendor: 'vendor LIKE ?',
    startDate: 'date >= ?',
    endDate: 'date <= ?'
  }
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (filterMappings[key]) {
        query += ` AND ${filterMappings[key]}`
        if (key === 'customer' || key === 'vendor') {
          params.push(`%${value}%`)
        } else {
          params.push(value)
        }
      }
    }
  })
  
  return { query, params }
}

/**
 * 驗證並清理輸入參數
 * @param {Object} params - 輸入參數
 * @param {Array} allowedKeys - 允許的鍵名
 * @returns {Object} 清理後的參數
 */
export const sanitizeParams = (params, allowedKeys) => {
  const cleaned = {}
  
  allowedKeys.forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      cleaned[key] = params[key]
    }
  })
  
  return cleaned
}

/**
 * 格式化金額顯示
 * @param {number} amount - 金額
 * @param {string} currency - 貨幣符號
 * @returns {string} 格式化後的金額字串
 */
export const formatCurrency = (amount, currency = 'TWD') => {
  if (amount === null || amount === undefined) return '0'
  
  const formatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency === 'TWD' ? 'TWD' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  
  return formatter.format(amount)
}

/**
 * 生成唯一 ID
 * @param {string} prefix - 前綴
 * @param {number} length - 數字部分長度
 * @returns {string} 生成的 ID
 */
export const generateId = (prefix, length = 3) => {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * Math.pow(10, length))
  return `${prefix}${timestamp.slice(-4)}${random.toString().padStart(length, '0')}`
}

/**
 * 驗證日期格式
 * @param {string} dateString - 日期字串
 * @returns {boolean} 是否為有效日期
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

/**
 * 安全的 JSON 解析
 * @param {string} jsonString - JSON 字串
 * @param {*} defaultValue - 預設值
 * @returns {*} 解析結果或預設值
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('JSON 解析失敗:', error)
    return defaultValue
  }
}