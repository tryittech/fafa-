import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'

/**
 * 自定義 Hook 用於 API 調用
 * @param {Function} apiFunction - API 函數
 * @param {Object} options - 選項
 * @returns {Object} API 狀態和方法
 */
export const useApi = (apiFunction, options = {}) => {
  const [data, setData] = useState(options.initialData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiFunction(...args)
      
      if (result.success) {
        setData(result.data)
        
        // 如果有成功訊息且選項允許顯示
        if (result.message && options.showSuccessMessage !== false) {
          message.success(result.message)
        }
        
        return result
      } else {
        throw new Error(result.message || 'API 請求失敗')
      }
    } catch (err) {
      setError(err.message)
      
      if (options.showErrorMessage !== false) {
        message.error(err.message || 'API 請求失敗')
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, options.showSuccessMessage, options.showErrorMessage])

  // 如果有 autoExecute 選項，自動執行
  useEffect(() => {
    if (options.autoExecute) {
      execute(...(options.autoExecuteArgs || []))
    }
  }, [execute, options.autoExecute, options.autoExecuteArgs])

  const reset = useCallback(() => {
    setData(options.initialData || null)
    setError(null)
    setLoading(false)
  }, [options.initialData])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

/**
 * 用於列表數據的 Hook
 * @param {Function} apiFunction - 獲取列表的 API 函數
 * @param {Object} options - 選項
 * @returns {Object} 列表狀態和方法
 */
export const useListApi = (apiFunction, options = {}) => {
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(options.initialFilters || {})

  const fetchList = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = {
        ...filters,
        ...params,
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit
      }
      
      const result = await apiFunction(queryParams)
      
      if (result.success) {
        setList(result.data || [])
        setPagination(prev => ({
          ...prev,
          ...result.pagination
        }))
        return result
      } else {
        throw new Error(result.message || '獲取列表失敗')
      }
    } catch (err) {
      setError(err.message)
      
      if (options.showErrorMessage !== false) {
        message.error(err.message || '獲取列表失敗')
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, filters, pagination.page, pagination.limit, options.showErrorMessage])

  // 更新篩選條件
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // 重置篩選條件
  const resetFilters = useCallback(() => {
    setFilters(options.initialFilters || {})
  }, [options.initialFilters])

  // 刷新列表
  const refresh = useCallback(() => {
    fetchList()
  }, [fetchList])

  // 分頁變更
  const changePage = useCallback((page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      page,
      limit: pageSize || prev.limit
    }))
    fetchList({ page, limit: pageSize })
  }, [fetchList])

  // 添加項目到列表
  const addItem = useCallback((item) => {
    setList(prev => [item, ...prev])
    setPagination(prev => ({
      ...prev,
      total: prev.total + 1
    }))
  }, [])

  // 更新列表中的項目
  const updateItem = useCallback((id, updatedItem) => {
    setList(prev => prev.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    ))
  }, [])

  // 從列表中移除項目
  const removeItem = useCallback((id) => {
    setList(prev => prev.filter(item => item.id !== id))
    setPagination(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1)
    }))
  }, [])

  // 自動載入
  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchList()
    }
  }, [filters]) // 當篩選條件變更時重新載入

  return {
    list,
    pagination,
    loading,
    error,
    filters,
    fetchList,
    updateFilters,
    resetFilters,
    refresh,
    changePage,
    addItem,
    updateItem,
    removeItem
  }
}

/**
 * 用於表單提交的 Hook
 * @param {Function} submitFunction - 提交表單的 API 函數
 * @param {Object} options - 選項
 * @returns {Object} 提交狀態和方法
 */
export const useSubmit = (submitFunction, options = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = useCallback(async (data) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await submitFunction(data)
      
      if (result.success) {
        if (result.message && options.showSuccessMessage !== false) {
          message.success(result.message)
        }
        
        // 如果有成功回調，執行它
        if (options.onSuccess) {
          options.onSuccess(result)
        }
        
        return result
      } else {
        throw new Error(result.message || '提交失敗')
      }
    } catch (err) {
      setError(err.message)
      
      if (options.showErrorMessage !== false) {
        message.error(err.message || '提交失敗')
      }
      
      // 如果有錯誤回調，執行它
      if (options.onError) {
        options.onError(err)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [submitFunction, options])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return {
    loading,
    error,
    submit,
    reset
  }
}