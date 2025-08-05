import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Button, Table, Tag, Space, message } from 'antd'
import { PlusOutlined, MinusOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts'
import { dashboardAPI } from '../services/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [financialData, setFinancialData] = useState({
    currentBalance: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
  })

  const [recentTransactions, setRecentTransactions] = useState([])
  const [cashFlowData, setCashFlowData] = useState([])

  const transactionColumns = [
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
  ]

  // 載入儀表板數據
  const loadDashboardData = async () => {
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
  }

  // 組件載入時獲取數據
  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleQuickAdd = (type) => {
    if (type === 'income') {
      navigate('/income')
    } else if (type === 'expense') {
      navigate('/expense')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#262626' }}>財務儀表板</h1>
        <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          歡迎回來！以下是您公司的財務概況
        </p>
      </div>

      {/* 快速操作按鈕 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="large"
              onClick={() => handleQuickAdd('income')}
            >
              快速新增收入
            </Button>
            <Button 
              danger 
              icon={<MinusOutlined />} 
              size="large"
              onClick={() => handleQuickAdd('expense')}
            >
              快速新增支出
            </Button>
          </Space>
        </Col>
      </Row>

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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
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
    </div>
  )
}

export default Dashboard 