// API 基礎配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// 通用請求函數
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  // 自動添加認證標頭
  const token = localStorage.getItem('token')
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
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

// 預算管理 API
export const budgetAPI = {
  // 獲取預算列表
  getList: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/budget?${searchParams.toString()}`)
  },

  // 獲取單筆預算
  getById: (id) => request(`/budget/${id}`),

  // 新增預算
  create: (data) => request('/budget', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 更新預算
  update: (id, data) => request(`/budget/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // 刪除預算
  delete: (id) => request(`/budget/${id}`, {
    method: 'DELETE',
  }),

  // 獲取預算統計
  getStatistics: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/budget/statistics?${searchParams.toString()}`)
  },

  // 獲取預算概覽
  getOverview: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/budget/overview?${searchParams.toString()}`)
  },

  // 獲取預算類別
  getCategories: () => request('/budget/categories'),
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

// 智能財務助手 API
export const assistantAPI = {
  // 智能分類建議
  classifyTransaction: (data) => request('/assistant/classify-transaction', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 獲取智能提醒
  getReminders: () => request('/assistant/reminders'),

  // 獲取財務健康評分
  getHealthScore: () => request('/assistant/health-score'),

  // 生成智能報表
  generateSmartReport: (data) => request('/assistant/generate-smart-report', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 獲取財務目標
  getFinancialGoals: () => request('/assistant/financial-goals'),

  // 獲取自動化建議
  getAutomationSuggestions: () => request('/assistant/automation-suggestions'),

  // 智能對話
  chat: (data) => request('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 獲取智能見解
  getInsights: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/assistant/insights?${searchParams.toString()}`)
  },

  // 獲取任務建議
  getTaskSuggestions: () => request('/assistant/task-suggestions'),

  // 備份管理
  getBackupStatus: () => request('/assistant/backup-status'),
  
  createSmartBackup: (data) => request('/assistant/create-smart-backup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  verifyBackup: (data) => request('/assistant/verify-backup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 智能收據識別
  scanReceipt: (data) => request('/assistant/scan-receipt', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  batchScanReceipts: (data) => request('/assistant/batch-scan-receipts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getReceiptTemplates: () => request('/assistant/receipt-templates'),
}

// 進階分析 API
export const analyticsAPI = {
  // 獲取績效數據
  getPerformance: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/analytics/performance?${searchParams.toString()}`)
  },

  // 獲取同期比較數據
  getComparison: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/analytics/comparison?${searchParams.toString()}`)
  },

  // 獲取現金流預測
  getCashflowForecast: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/analytics/cashflow-forecast?${searchParams.toString()}`)
  },

  // 獲取異常檢測
  getAnomalyDetection: () => request('/analytics/anomaly-detection'),

  // 獲取盈利能力分析
  getProfitabilityAnalysis: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    return request(`/analytics/profitability-analysis?${searchParams.toString()}`)
  },
}

export default {
  checkHealth,
  incomeAPI,
  expenseAPI,
  dashboardAPI,
  reportsAPI,
  taxAPI,
  budgetAPI,
  settingsAPI,
  analyticsAPI,
  assistantAPI,
  handleAPIError,
} 