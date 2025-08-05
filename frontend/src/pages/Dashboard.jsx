import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Button, Table, Tag, Space, message, Progress, Alert } from 'antd'
import { PlusOutlined, MinusOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined, RiseOutlined, FallOutlined, WarningOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { dashboardAPI, incomeAPI, expenseAPI } from '../services/api'
import QuickActionPanel from '../components/QuickActionPanel'
import { useAuth } from '../contexts/AuthContext'
import ChartWrapper from '../components/ChartWrapper'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // 添加認證檢查
  const { user, isAuthenticated, token } = useAuth()
  
  console.log('Dashboard 組件狀態:', { 
    user: user?.email, 
    isAuthenticated, 
    hasToken: !!token 
  })
  const [financialData, setFinancialData] = useState({
    currentBalance: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
  })

  const [recentTransactions, setRecentTransactions] = useState([])
  const [cashFlowData, setCashFlowData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [performanceData, setPerformanceData] = useState(null)

  const transactionColumns = useMemo(() => [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount, record) => (
        <span style={{ 
          color: record.type === 'income' ? '#52c41a' : '#f5222d',
          fontWeight: 'bold'
        }}>
          {record.type === 'income' ? '+' : '-'} ${amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'income' ? 'green' : 'red'}>
          {type === 'income' ? '收入' : '支出'}
        </Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'received' || status === 'paid' ? 'green' : 'orange'}>
          {status === 'received' ? '已收款' : status === 'paid' ? '已支付' : '待處理'}
        </Tag>
      ),
    },
  ], [])

  // 載入儀表板數據 - 使用 useCallback 避免不必要的重新創建
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // 並行載入所有數據
      const [overviewRes, cashFlowRes, transactionsRes] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getCashFlow({ months: 6 }),
        dashboardAPI.getRecentTransactions({ limit: 10 })
      ])

      if (overviewRes.success) {
        const { summary } = overviewRes.data
        setFinancialData({
          currentBalance: summary.currentBalance || 0,
          accountsReceivable: summary.accountsReceivable || 0,
          accountsPayable: summary.accountsPayable || 0,
          monthlyIncome: overviewRes.data.income.totalAmount || 0,
          monthlyExpense: overviewRes.data.expense.totalAmount || 0,
        })
      }

      if (cashFlowRes.success) {
        setCashFlowData(cashFlowRes.data || [])
      }

      if (transactionsRes.success) {
        // 格式化交易數據以匹配表格需要的格式
        const formattedTransactions = (transactionsRes.data || []).map((item, index) => ({
          key: item.id || index,
          date: item.date,
          description: item.description || item.customer || item.vendor,
          amount: item.amount,
          type: item.type,
          status: item.status
        }))
        setRecentTransactions(formattedTransactions)
      }
    } catch (error) {
      console.error('載入儀表板數據失敗:', error)
      message.error('載入數據失敗，請稍後重試')
    } finally {
      setLoading(false)
    }
  }, [])

  // 組件載入時獲取數據
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleQuickAdd = useCallback(async (type, data) => {
    try {
      if (type === 'income') {
        const result = await incomeAPI.create(data)
        if (result.success) {
          loadDashboardData() // 重新載入數據
        }
      } else if (type === 'expense') {
        const result = await expenseAPI.create(data)
        if (result.success) {
          loadDashboardData() // 重新載入數據
        }
      }
    } catch (error) {
      console.error('快速新增失敗:', error)
      throw error
    }
  }, [loadDashboardData])

  // 如果未認證，顯示提示信息
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column'
      }}>
        <h2>需要登入</h2>
        <p>請先登入以查看財務儀表板</p>
        <Button type="primary" onClick={() => navigate('/login')}>
          前往登入
        </Button>
      </div>
    )
  }

  return (
    <div style={{ 
      backgroundColor: 'transparent', 
      minHeight: '100vh',
      padding: '0'
    }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#262626' }}>財務儀表板</h1>
        <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          歡迎回來，{user?.name}！以下是您公司的財務概況
        </p>
      </div>

      {/* 快捷操作面板 */}
      <QuickActionPanel
        onQuickAdd={handleQuickAdd}
        recentData={recentTransactions.filter(t => 
          new Date(t.date).toDateString() === new Date().toDateString()
        )}
        showStats={true}
      />

      {/* 核心財務數據 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card balance">
            <Statistic
              title="目前現金餘額"
              value={financialData.currentBalance}
              prefix={<DollarOutlined />}
              valueStyle={{ 
                color: financialData.currentBalance >= 0 ? 'white' : '#ff4d4f' 
              }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card income">
            <Statistic
              title="應收款項"
              value={financialData.accountsReceivable}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: 'white' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card expense">
            <Statistic
              title="應付款項"
              value={financialData.accountsPayable}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: 'white' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本月淨利"
              value={financialData.monthlyIncome - financialData.monthlyExpense}
              prefix={<DollarOutlined />}
              valueStyle={{ 
                color: (financialData.monthlyIncome - financialData.monthlyExpense) >= 0 ? 'white' : '#ff4d4f',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 現金流趨勢圖 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="現金流趨勢" className="chart-container">
            <ChartWrapper>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlowData} style={{ backgroundColor: 'white' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip 
                    formatter={(value, name) => [
                      `${value.toLocaleString()} 元`, 
                      name === 'income' ? '收入' : name === 'expense' ? '支出' : '餘額'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#52c41a" 
                    strokeWidth={3}
                    name="收入"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#f5222d" 
                    strokeWidth={3}
                    name="支出"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#1890ff" 
                    strokeWidth={3}
                    name="餘額"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Card>
        </Col>
      </Row>

      {/* 最近交易記錄 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="最近交易記錄" className="chart-container">
            <Table
              columns={transactionColumns}
              dataSource={recentTransactions}
              pagination={false}
              size="middle"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 新增：財務健康指標 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="財務健康指標" className="chart-container">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>現金流健康度</span>
                  <span>{Math.max(0, Math.min(100, ((financialData.currentBalance + financialData.accountsReceivable) / (financialData.accountsPayable + 1)) * 25))}%</span>
                </div>
                <Progress 
                  percent={Math.max(0, Math.min(100, ((financialData.currentBalance + financialData.accountsReceivable) / (financialData.accountsPayable + 1)) * 25))} 
                  strokeColor={{
                    '0%': '#ff4d4f',
                    '50%': '#faad14',
                    '100%': '#52c41a',
                  }}
                />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>收支平衡度</span>
                  <span>{financialData.monthlyIncome > 0 ? Math.round((financialData.monthlyIncome - financialData.monthlyExpense) / financialData.monthlyIncome * 100) : 0}%</span>
                </div>
                <Progress 
                  percent={Math.max(0, Math.min(100, financialData.monthlyIncome > 0 ? ((financialData.monthlyIncome - financialData.monthlyExpense) / financialData.monthlyIncome * 100) : 0))}
                  strokeColor={{
                    '0%': '#ff4d4f',
                    '50%': '#faad14', 
                    '100%': '#52c41a',
                  }}
                />
              </div>

              {financialData.currentBalance < 0 && (
                <Alert
                  message="現金流警告"
                  description="目前現金餘額為負，建議立即檢查財務狀況"
                  type="error"
                  icon={<WarningOutlined />}
                  showIcon
                />
              )}
              
              {(financialData.accountsReceivable > financialData.currentBalance * 2) && (
                <Alert
                  message="收款提醒"
                  description="應收款項較高，建議加強收款管理"
                  type="warning"
                  showIcon
                />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="本月收支對比" className="chart-container">
            <ChartWrapper>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  data={[ 
                    { name: '收入', amount: financialData.monthlyIncome, fill: '#52c41a' },
                    { name: '支出', amount: financialData.monthlyExpense, fill: '#ff4d4f' },
                    { name: '淨收入', amount: financialData.monthlyIncome - financialData.monthlyExpense, fill: financialData.monthlyIncome - financialData.monthlyExpense >= 0 ? '#1890ff' : '#faad14' }
                  ]}
                  style={{ backgroundColor: 'white' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, '金額']}
                  />
                  <Bar dataKey="amount" />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Card>
        </Col>
      </Row>

      {/* 新增：趨勢分析 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="現金流趨勢分析" className="chart-container">
            <ChartWrapper>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlowData} style={{ backgroundColor: 'white' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip 
                    formatter={(value, name) => [
                      `$${value.toLocaleString()}`,
                      name === 'income' ? '收入' : name === 'expense' ? '支出' : '餘額'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => 
                      value === 'income' ? '收入' : value === 'expense' ? '支出' : '餘額'
                    }
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#52c41a" 
                    strokeWidth={3}
                    dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ff4d4f" 
                    strokeWidth={3}
                    dot={{ fill: '#ff4d4f', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#1890ff" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#1890ff', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard 