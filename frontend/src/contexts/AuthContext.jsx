import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // 初始化：檢查本地存儲的 token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        
        console.log('AuthContext 初始化中...', { savedToken: !!savedToken, savedUser: !!savedUser })
        
        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser)
            setToken(savedToken)
            setUser(parsedUser)
            console.log('已從本地存儲恢復用戶信息:', parsedUser.email)
            
            // 可選：驗證 token 是否仍然有效
            // await verifyToken(savedToken)
          } catch (error) {
            console.error('解析用戶資料失敗:', error)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } else {
          console.log('沒有找到本地存儲的認證信息')
        }
      } catch (error) {
        console.error('AuthContext 初始化失敗:', error)
      } finally {
        setLoading(false)
        console.log('AuthContext 初始化完成')
      }
    }
    
    initAuth()
  }, [])

  // 驗證 token
  const verifyToken = async (tokenToVerify = token) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Token 驗證失敗')
      }
      
      return true
    } catch (error) {
      console.error('Token 驗證失敗:', error)
      logout()
      return false
    }
  }

  // 登入
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        setToken(data.data.token)
        setUser(data.data.user)
        
        // 保存到本地存儲
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        message.success('登入成功！')
        return { success: true }
      } else {
        message.error(data.message || '登入失敗')
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('登入錯誤:', error)
      message.error('網路錯誤，請稍後再試')
      return { success: false, message: '網路錯誤' }
    }
  }

  // 註冊
  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (data.success) {
        setToken(data.data.token)
        setUser(data.data.user)
        
        // 保存到本地存儲
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        message.success('註冊成功！')
        return { success: true }
      } else {
        message.error(data.message || '註冊失敗')
        return { success: false, message: data.message, errors: data.errors }
      }
    } catch (error) {
      console.error('註冊錯誤:', error)
      message.error('網路錯誤，請稍後再試')
      return { success: false, message: '網路錯誤' }
    }
  }

  // 登出
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    message.success('已登出')
  }

  // 獲取帶有認證標頭的 API 選項
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  // 帶認證的 fetch 函數
  const authFetch = async (url, options = {}) => {
    const authOptions = {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, authOptions)
      
      // 如果是 401 錯誤，可能是 token 過期
      if (response.status === 401) {
        logout()
        throw new Error('認證失效，請重新登入')
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    verifyToken,
    getAuthHeaders,
    authFetch,
    isAuthenticated: !!user && !!token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}