import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Layout, Menu, Button, theme, Drawer, Avatar, Dropdown, Spin } from 'antd'
import {
  DashboardOutlined,
  PlusOutlined,
  MinusOutlined,
  BarChartOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FundOutlined,
  LineChartOutlined,
  DashboardOutlined as AdvancedDashboardOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

// 頁面組件
import Dashboard from './pages/Dashboard'
import IncomeManagement from './pages/IncomeManagement'
import ExpenseManagement from './pages/ExpenseManagement'
import BudgetManagement from './pages/BudgetManagement'
import FinancialReports from './pages/FinancialReports'
import TaxHelper from './pages/TaxHelper'
import Settings from './pages/Settings'
import PerformanceDashboard from './pages/PerformanceDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Test from './pages/Test'

// 認證相關
import { AuthProvider, useAuth } from './contexts/AuthContext'

const { Header, Sider, Content } = Layout

// 受保護路由組件
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()
  
  console.log('ProtectedRoute 狀態:', { isAuthenticated, loading, user: user?.email })
  
  if (loading) {
    console.log('顯示載入中畫面')
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f0f2f5'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#666' }}>載入中...</div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    console.log('用戶未認證，重定向到登入頁面')
    return <Navigate to="/login" replace />
  }
  
  console.log('用戶已認證，顯示應用內容')
  return children
}

// 主要 Layout 組件
const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  // 檢測屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      
      if (!mobile && mobileDrawerVisible) {
        setMobileDrawerVisible(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [mobileDrawerVisible])

  // 路由變化時關閉移動端抽屜
  useEffect(() => {
    if (isMobile && mobileDrawerVisible) {
      setMobileDrawerVisible(false)
    }
  }, [location.pathname, isMobile])

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '儀表板',
    },
    {
      key: '/income',
      icon: <PlusOutlined />,
      label: '收入管理',
    },
    {
      key: '/expense',
      icon: <MinusOutlined />,
      label: '支出管理',
    },
    {
      key: '/budget',
      icon: <FundOutlined />,
      label: '預算管理',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '財務報表',
    },
    {
      key: '/tax',
      icon: <CalculatorOutlined />,
      label: '稅務助手',
    },
    {
      key: '/performance',
      icon: <AdvancedDashboardOutlined />,
      label: '績效儀表板',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系統設定',
    },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  // 用戶下拉菜單
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '個人資料',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: logout,
    },
  ]

  const siderContent = (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ 
        height: 'calc(100vh - 64px)', 
        borderRight: 0,
        backgroundColor: 'white'
      }}
    />
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端側邊欄 */}
      {!isMobile && (
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          style={{ 
            background: 'white',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{
            height: '64px',
            margin: '16px',
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: collapsed ? '14px' : '16px'
          }}>
            {collapsed ? 'FA' : '財務阿姨'}
          </div>
          {siderContent}
        </Sider>
      )}

      {/* 移動端抽屜 */}
      <Drawer
        title="財務阿姨系統"
        placement="left"
        closable={false}
        onClose={() => setMobileDrawerVisible(false)}
        open={mobileDrawerVisible}
        bodyStyle={{ 
          padding: 0,
          backgroundColor: 'white'
        }}
        width={250}
        headerStyle={{
          backgroundColor: '#1890ff',
          color: 'white'
        }}
      >
        {siderContent}
      </Drawer>

      <Layout>
        <Header style={{
          padding: '0 16px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <Button
            type="text"
            icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => {
              if (isMobile) {
                setMobileDrawerVisible(!mobileDrawerVisible)
              } else {
                setCollapsed(!collapsed)
              }
            }}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#666' }}>歡迎，{user?.name}</span>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
            >
              <Avatar
                style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </div>
        </Header>

        <Content style={{
          margin: '16px',
          padding: 24,
          minHeight: 280,
          background: '#f0f2f5',
          borderRadius: borderRadiusLG,
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income" element={<IncomeManagement />} />
            <Route path="/expense" element={<ExpenseManagement />} />
            <Route path="/budget" element={<BudgetManagement />} />
            <Route path="/reports" element={<FinancialReports />} />
            <Route path="/tax" element={<TaxHelper />} />
            <Route path="/performance" element={<PerformanceDashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

// 主 App 組件
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/test" element={<Test />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

export default App