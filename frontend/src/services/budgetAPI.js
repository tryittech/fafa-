import axios from 'axios'

const API_BASE_URL = 'http://localhost:5001/api'

const budgetAPI = {
  // 獲取預算分類
  getCategories: async () => {
    const response = await axios.get(`${API_BASE_URL}/budget/categories`)
    return response.data
  },

  // 獲取預算列表
  getBudgets: async (filters = {}) => {
    const params = new URLSearchParams()
    
    if (filters.period) params.append('period', filters.period)
    if (filters.budget_type) params.append('budget_type', filters.budget_type)
    if (filters.category) params.append('category', filters.category)
    
    const response = await axios.get(`${API_BASE_URL}/budget?${params.toString()}`)
    return response.data
  },

  // 獲取預算概覽
  getOverview: async (period) => {
    const response = await axios.get(`${API_BASE_URL}/budget/overview/${period}`)
    return response.data
  },

  // 獲取單個預算
  getBudget: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/budget/${id}`)
    return response.data
  },

  // 創建新預算
  createBudget: async (budgetData) => {
    const response = await axios.post(`${API_BASE_URL}/budget`, budgetData)
    return response.data
  },

  // 更新預算
  updateBudget: async (id, budgetData) => {
    const response = await axios.put(`${API_BASE_URL}/budget/${id}`, budgetData)
    return response.data
  },

  // 刪除預算
  deleteBudget: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/budget/${id}`)
    return response.data
  },

  // 更新預算執行狀況
  updateBudgetExecution: async (id, period) => {
    const response = await axios.post(`${API_BASE_URL}/budget/${id}/update-execution`, { period })
    return response.data
  }
}

export default budgetAPI