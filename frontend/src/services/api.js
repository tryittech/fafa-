// API 基礎配置
const API_BASE_URL = '/api'

// 通用請求函數
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API 請求失敗:', error)
    throw error
  }
}

// 健康檢查
export const checkHealth = () => request('/health')

// 收入管理 API
export const incomeAPI = {
  // 獲取收入列表
  getList: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/income?${searchParams.toString()}`)
  },

  // 獲取單筆收入
  getById: (id) => request(`/income/${id}`),

  // 新增收入
  create: (data) => request('/income', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 更新收入
  update: (id, data) => request(`/income/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // 刪除收入
  delete: (id) => request(`/income/${id}`, {
    method: 'DELETE',
  }),

  // 獲取收入統計
  getStatistics: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/income/statistics?${searchParams.toString()}`)
  },
}

// 支出管理 API
export const expenseAPI = {
  // 獲取支出列表
  getList: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/expense?${searchParams.toString()}`)
  },

  // 獲取單筆支出
  getById: (id) => request(`/expense/${id}`),

  // 新增支出
  create: (data) => request('/expense', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 更新支出
  update: (id, data) => request(`/expense/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // 刪除支出
  delete: (id) => request(`/expense/${id}`, {
    method: 'DELETE',
  }),

  // 獲取支出統計
  getStatistics: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/expense/statistics?${searchParams.toString()}`)
  },

  // 上傳收據
  uploadReceipt: (file) => {
    const formData = new FormData()
    formData.append('receipt', file)
    
    return request('/expense/upload-receipt', {
      method: 'POST',
      headers: {}, // 讓瀏覽器自動設定 Content-Type
      body: formData,
    })
  },

  // 獲取支出趨勢洞察
  getExpenseTrend: () => request('/expense/insights/expense-trend'),
}

// 儀表板 API
export const dashboardAPI = {
  // 獲取財務概覽
  getOverview: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/dashboard/overview?${searchParams.toString()}`)
  },

  // 獲取現金流量趨勢
  getCashFlow: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/dashboard/cash-flow?${searchParams.toString()}`)
  },

  // 獲取最近交易
  getRecentTransactions: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/dashboard/recent-transactions?${searchParams.toString()}`)
  },

  // 獲取類別分析
  getCategoryBreakdown: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/dashboard/category-breakdown?${searchParams.toString()}`)
  },

  // 獲取財務健康指標
  getFinancialHealth: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/dashboard/financial-health?${searchParams.toString()}`)
  },
}

// 財務報表 API
export const reportsAPI = {
  // 獲取損益表
  getIncomeStatement: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/reports/income-statement?${searchParams.toString()}`)
  },

  // 獲取資產負債表
  getBalanceSheet: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/reports/balance-sheet?${searchParams.toString()}`)
  },

  // 獲取現金流量表
  getCashFlowStatement: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/reports/cash-flow-statement?${searchParams.toString()}`)
  },

  // 獲取支出分析
  getExpenseBreakdown: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/reports/expense-breakdown?${searchParams.toString()}`)
  },
}

// 稅務助手 API
export const taxAPI = {
  // 獲取稅率資訊
  getRates: () => request('/tax/rates'),

  // 計算營業稅
  calculateBusinessTax: (data) => request('/tax/calculate-business-tax', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 計算營利事業所得稅
  calculateIncomeTax: (data) => request('/tax/calculate-income-tax', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 獲取稅務申報提醒
  getFilingReminders: () => request('/tax/filing-reminders'),

  // 獲取計算歷史記錄
  getCalculationHistory: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/tax/calculation-history?${searchParams.toString()}`)
  },

  // 獲取稅務相關資源
  getResources: () => request('/tax/resources'),
}

// 系統設定 API
export const settingsAPI = {
  // 獲取公司資訊
  getCompanyInfo: () => request('/settings/company-info'),

  // 更新公司資訊
  updateCompanyInfo: (data) => request('/settings/company-info', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // 獲取系統設定
  getSystemSettings: () => request('/settings/system-settings'),

  // 更新系統設定
  updateSystemSettings: (data) => request('/settings/system-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // 匯出資料
  exportData: (format = 'json') => {
    const searchParams = new URLSearchParams()
    searchParams.append('format', format)
    return request(`/settings/export-data?${searchParams.toString()}`)
  },

  // 匯入資料
  importData: (data, overwrite = false) => request('/settings/import-data', {
    method: 'POST',
    body: JSON.stringify({ data, overwrite }),
  }),

  // 創建備份
  createBackup: () => request('/settings/backup', {
    method: 'POST',
  }),

  // 獲取備份列表
  getBackups: () => request('/settings/backups'),

  // 還原備份
  restoreBackup: (backupFile) => request('/settings/restore', {
    method: 'POST',
    body: JSON.stringify({ backupFile }),
  }),

  // 刪除備份
  deleteBackup: (filename) => request(`/settings/backups/${filename}`, {
    method: 'DELETE',
  }),

  // 獲取系統資訊
  getSystemInfo: () => request('/settings/system-info'),

  // 重置系統設定
  resetSettings: () => request('/settings/reset-settings', {
    method: 'POST',
  }),
}

// 錯誤處理工具
export const handleAPIError = (error, showMessage = true) => {
  console.error('API 錯誤:', error)
  
  let message = '發生未知錯誤'
  
  if (error.message) {
    message = error.message
  } else if (error.response?.data?.message) {
    message = error.response.data.message
  }
  
  if (showMessage) {
    // 這裡可以整合 Ant Design 的 message 組件
    console.error(message)
  }
  
  return message
}

// 響應攔截器（可選）
export const setupResponseInterceptor = () => {
  // 可以在這裡添加全局的響應處理邏輯
  // 例如：統一處理 401 未授權、500 服務器錯誤等
}

export default {
  checkHealth,
  incomeAPI,
  expenseAPI,
  dashboardAPI,
  reportsAPI,
  taxAPI,
  settingsAPI,
  handleAPIError,
} 