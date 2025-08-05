import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, theme } from 'antd'
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
} from '@ant-design/icons'

// 頁面組件
import Dashboard from './pages/Dashboard'
import IncomeManagement from './pages/IncomeManagement'
import ExpenseManagement from './pages/ExpenseManagement'
import BudgetManagement from './pages/BudgetManagement'
import FinancialReports from './pages/FinancialReports'
import TaxHelper from './pages/TaxHelper'
import Settings from './pages/Settings'

const { Header, Sider, Content } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

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
      icon: <BarChartOutlined />,
      label: '財務報表',
    },
    {
      key: '/tax',
      icon: <CalculatorOutlined />,
      label: '稅務幫手',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '設定',
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: colorBgContainer,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: borderRadiusLG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: collapsed ? '12px' : '16px',
          fontWeight: 'bold',
          color: '#1890ff'
        }}>
          {collapsed ? 'FAFA' : '財務阿姨'}
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['/']}
          style={{ borderRight: 0 }}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key)
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ marginRight: 24 }}>
            <h2 style={{ margin: 0, color: '#1890ff' }}>
              線上財務系統
            </h2>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income" element={<IncomeManagement />} />
            <Route path="/expense" element={<ExpenseManagement />} />
            <Route path="/budget" element={<BudgetManagement />} />
            <Route path="/reports" element={<FinancialReports />} />
            <Route path="/tax" element={<TaxHelper />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App 