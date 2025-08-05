import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Select,
  DatePicker,
  Button,
  Typography,
  Space,
  Tooltip,
  Tag,
  Alert,
  Divider,
  Spin
} from 'antd'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts'
import {
  DashboardOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  ThunderboltOutlined,
  ExportOutlined,
  CalendarOutlined,
  DollarOutlined,
  PercentageOutlined,
  LineChartOutlined,
  BarChartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useResponsive } from '../hooks/useResponsive'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { dashboardAPI, reportsAPI, handleAPIError } from '../services/api'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const PerformanceDashboard = () => {
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [kpiData, setKpiData] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState({})
  const [error, setError] = useState(null)
  const { isMobile } = useResponsive()

  // 獲取經營績效數據
  const fetchPerformanceData = async (period = 'thisMonth') => {
    setLoading(true)
    setError(null)
    
    try {
      // 根據選擇的期間計算年份
      const currentYear = new Date().getFullYear()
      const year = period.includes('last') ? currentYear - 1 : currentYear
      
      // 獲取績效分析數據
      const response = await dashboardAPI.getOverview({ year })
      
      if (response.success) {
        const { performanceData, kpiData, trendData, customerAnalysis, expenseCategories } = response.data
        
        // 轉換數據格式以符合 UI 顯示需求
        const formattedData = {
          // KPI 指標
          kpiSummary: {
            revenue: performanceData.totalRevenue,
            revenueGrowth: parseFloat(performanceData.revenueGrowth),
            profit: performanceData.netProfit,
            profitMargin: parseFloat(performanceData.profitMargin),
            customers: customerAnalysis.length,
            customerGrowth: 8.2, // 模擬數據，因為暫時無法從 API 獲取
            averageOrderValue: performanceData.averageOrderValue,
            conversionRate: 3.4 // 模擬數據
          },
          
          // 月度趨勢數據
          monthlyTrends: trendData.map(item => ({
            month: item.month.split('-')[1] + '月',
            revenue: item.revenue,
            profit: item.profit,
            orders: Math.floor(item.revenue / (performanceData.averageOrderValue || 10000)),
            customers: item.customerCount || Math.floor(Math.random() * 50) + 100
          })),
          
          // 產品/服務績效 (基於支出分類數據模擬)
          productPerformance: expenseCategories.slice(0, 4).map((category, index) => {
            const basePercentage = 40 - (index * 10)
            return {
              name: category.category || `服務${index + 1}`,
              revenue: category.totalAmount * 2, // 假設營收是支出的2倍
              percentage: basePercentage,
              growth: (Math.random() * 30) - 10 // -10% 到 +20% 的隨機成長率
            }
          }),
          
          // 客戶分析
          customerAnalysis: {
            newCustomers: Math.floor(customerAnalysis.length * 0.2),
            retainedCustomers: Math.floor(customerAnalysis.length * 0.8),
            churnRate: 4.2,
            lifetimeValue: performanceData.averageOrderValue * 5, // 估算終生價值
            acquisitionCost: Math.floor(performanceData.averageOrderValue * 0.3)
          },
          
          // 財務健康指標
          financialHealth: [
            { 
              metric: '流動比率', 
              value: parseFloat(performanceData.currentRatio), 
              target: 2.0, 
              status: parseFloat(performanceData.currentRatio) >= 2 ? 'good' : 'warning' 
            },
            { 
              metric: '資產報酬率', 
              value: parseFloat(performanceData.roi), 
              target: 15.0, 
              status: parseFloat(performanceData.roi) >= 15 ? 'excellent' : 'good' 
            },
            { 
              metric: '毛利率', 
              value: parseFloat(performanceData.grossMargin), 
              target: 40.0, 
              status: parseFloat(performanceData.grossMargin) >= 40 ? 'excellent' : 'good' 
            },
            { 
              metric: '淨利率', 
              value: parseFloat(performanceData.profitMargin), 
              target: 20.0, 
              status: parseFloat(performanceData.profitMargin) >= 20 ? 'excellent' : 'good' 
            },
            { 
              metric: '負債權益比', 
              value: parseFloat(performanceData.debtToEquity) * 100, 
              target: 50.0, 
              status: parseFloat(performanceData.debtToEquity) <= 0.5 ? 'good' : 'warning' 
            },
            { 
              metric: '營業費用率', 
              value: parseFloat(performanceData.operatingExpenseRatio), 
              target: 70.0, 
              status: parseFloat(performanceData.operatingExpenseRatio) <= 70 ? 'good' : 'warning' 
            }
          ],
          
          // 雷達圖數據 (基於 KPI 數據)
          radarData: kpiData.map(kpi => ({
            subject: kpi.name,
            value: kpi.score,
            fullMark: 100
          }))
        }
        
        setDashboardData(formattedData)
        setPerformanceMetrics(formattedData.kpiSummary)
        
      } else {
        setError('獲取績效數據失敗')
      }
      
    } catch (error) {
      console.error('獲取績效數據失敗:', error)
      const errorMessage = handleAPIError(error, false)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData(selectedPeriod)
  }, [selectedPeriod])

  // 處理期間改變
  const handlePeriodChange = (value) => {
    setSelectedPeriod(value)
    fetchPerformanceData(value)
  }

  // 獲取狀態顏色
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#52c41a'
      case 'good': return '#1890ff'
      case 'warning': return '#faad14'
      case 'danger': return '#f5222d'
      default: return '#d9d9d9'
    }
  }

  // 獲取狀態標籤
  const getStatusTag = (status) => {
    const colors = {
      excellent: 'green',
      good: 'blue',
      warning: 'orange',
      danger: 'red'
    }
    const labels = {
      excellent: '優秀',
      good: '良好',
      warning: '注意',
      danger: '警示'
    }
    return <Tag color={colors[status]}>{labels[status]}</Tag>
  }

  // 匯出功能
  const handleExport = (format) => {
    if (format === 'pdf') {
      exportToPDF('performance-dashboard-content', '經營績效分析報告.pdf')
    } else if (format === 'excel') {
      // 準備匯出數據
      const exportData = dashboardData?.monthlyTrends?.map(item => ({
        月份: item.month,
        營收: item.revenue,
        利潤: item.profit,
        訂單數: item.orders,
        客戶數: item.customers
      })) || []
      exportToExcel(exportData, '經營績效數據.xlsx')
    }
  }

  // 圓餅圖顏色
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#fa8c16']

  // 財務健康指標表格欄位
  const healthColumns = [
    {
      title: '指標名稱',
      dataIndex: 'metric',
      key: 'metric',
      width: isMobile ? 100 : 120
    },
    {
      title: '實際值',
      dataIndex: 'value',
      key: 'value',
      width: isMobile ? 80 : 100,
      render: (value, record) => (
        <Text strong style={{ color: getStatusColor(record.status) }}>
          {value}%
        </Text>
      )
    },
    {
      title: '目標值',
      dataIndex: 'target',
      key: 'target',
      width: isMobile ? 80 : 100,
      render: (value) => `${value}%`,
      className: isMobile ? 'mobile-hidden' : ''
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 70 : 80,
      render: (status) => getStatusTag(status)
    },
    {
      title: '達成率',
      key: 'achievement',
      width: isMobile ? 80 : 100,
      render: (_, record) => {
        const rate = (record.value / record.target * 100).toFixed(1)
        return (
          <Progress
            percent={Math.min(rate, 100)}
            size="small"
            showInfo={!isMobile}
            strokeColor={getStatusColor(record.status)}
          />
        )
      },
      className: isMobile ? 'mobile-hidden' : ''
    }
  ]

  if (loading && !dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>載入經營績效數據中...</div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="載入經營績效數據失敗"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={() => fetchPerformanceData(selectedPeriod)}>
              重新載入
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div id="performance-dashboard-content">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DashboardOutlined /> 經營績效儀表板
        </Title>
        
        <Space>
          <Select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            style={{ width: 120 }}
          >
            <Option value="thisMonth">本月</Option>
            <Option value="lastMonth">上月</Option>
            <Option value="thisQuarter">本季</Option>
            <Option value="thisYear">本年</Option>
          </Select>
          
          <Button.Group>
            <Button 
              icon={<ExportOutlined />}
              onClick={() => handleExport('pdf')}
            >
              PDF
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={() => handleExport('excel')}
            >
              Excel
            </Button>
          </Button.Group>
        </Space>
      </div>

      {/* 核心 KPI 指標卡片 */}
      {performanceMetrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="總營收"
                value={performanceMetrics.revenue}
                prefix="$"
                suffix={
                  <Tag color={performanceMetrics.revenueGrowth > 0 ? 'green' : 'red'}>
                    {performanceMetrics.revenueGrowth > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(performanceMetrics.revenueGrowth)}%
                  </Tag>
                }
                formatter={(value) => value.toLocaleString()}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="淨利潤"
                value={performanceMetrics.profit}
                prefix="$"
                suffix={
                  <Tag color="blue">
                    利潤率 {performanceMetrics.profitMargin}%
                  </Tag>
                }
                formatter={(value) => value.toLocaleString()}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="客戶數量"
                value={performanceMetrics.customers}
                suffix={
                  <Tag color={performanceMetrics.customerGrowth > 0 ? 'green' : 'red'}>
                    {performanceMetrics.customerGrowth > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(performanceMetrics.customerGrowth)}%
                  </Tag>
                }
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="平均訂單價值"
                value={performanceMetrics.averageOrderValue}
                prefix="$"
                suffix={
                  <Tooltip title="轉換率">
                    <Tag color="purple">
                      {performanceMetrics.conversionRate}%
                    </Tag>
                  </Tooltip>
                }
                formatter={(value) => value.toLocaleString()}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 營收與利潤趨勢圖 */}
      {dashboardData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card title={<><LineChartOutlined /> 營收與利潤趨勢</>}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dashboardData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={isMobile ? 10 : 12}
                  />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    fontSize={isMobile ? 10 : 12}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    fontSize={isMobile ? 10 : 12}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name.includes('revenue') || name.includes('profit') 
                        ? `$${value.toLocaleString()}` 
                        : value.toLocaleString(),
                      name === 'revenue' ? '營收' : 
                      name === 'profit' ? '利潤' : 
                      name === 'orders' ? '訂單數' : '客戶數'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#1890ff" name="營收" />
                  <Bar yAxisId="left" dataKey="profit" fill="#52c41a" name="利潤" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#faad14" strokeWidth={2} name="訂單數" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title={<><TrophyOutlined /> 績效雷達圖</>}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={dashboardData.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    fontSize={isMobile ? 10 : 12}
                  />
                  <PolarRadiusAxis 
                    angle={0} 
                    domain={[0, 100]}
                    tickCount={5}
                    fontSize={isMobile ? 8 : 10}
                  />
                  <Radar
                    name="績效評分"
                    dataKey="value"
                    stroke="#1890ff"
                    fill="#1890ff"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <RechartsTooltip formatter={(value) => [`${value}分`, '績效評分']} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* 產品服務績效與客戶分析 */}
      {dashboardData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title={<><BarChartOutlined /> 產品服務績效</>}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.productPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 30 : 40}
                    outerRadius={isMobile ? 60 : 80}
                    paddingAngle={5}
                    dataKey="revenue"
                    label={({name, percentage}) => `${name} ${percentage}%`}
                    labelLine={false}
                  >
                    {dashboardData.productPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`$${value.toLocaleString()}`, '營收']} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title={<><DollarOutlined /> 客戶分析指標</>}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="新客戶"
                    value={dashboardData.customerAnalysis.newCustomers}
                    valueStyle={{ color: '#52c41a', fontSize: isMobile ? 18 : 24 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="留存客戶"
                    value={dashboardData.customerAnalysis.retainedCustomers}
                    valueStyle={{ color: '#1890ff', fontSize: isMobile ? 18 : 24 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="流失率"
                    value={dashboardData.customerAnalysis.churnRate}
                    suffix="%"
                    valueStyle={{ color: '#faad14', fontSize: isMobile ? 18 : 24 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="獲客成本"
                    value={dashboardData.customerAnalysis.acquisitionCost}
                    prefix="$"
                    formatter={(value) => value.toLocaleString()}
                    valueStyle={{ color: '#722ed1', fontSize: isMobile ? 18 : 24 }}
                  />
                </Col>
                <Col span={24}>
                  <Divider style={{ margin: '12px 0' }} />
                  <Statistic
                    title="客戶終生價值"
                    value={dashboardData.customerAnalysis.lifetimeValue}
                    prefix="$"
                    formatter={(value) => value.toLocaleString()}
                    valueStyle={{ color: '#f5222d', fontSize: isMobile ? 20 : 28 }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* 財務健康指標表格 */}
      {dashboardData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <FireOutlined />
                  財務健康指標
                  <Tooltip title="基於財務比率分析的健康評估">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Table
                columns={healthColumns}
                dataSource={dashboardData.financialHealth}
                rowKey="metric"
                pagination={false}
                size={isMobile ? 'small' : 'middle'}
                scroll={{ x: isMobile ? 500 : undefined }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 改善建議區域 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={<><ThunderboltOutlined /> 經營改善建議</>}
            extra={<Tag color="processing">智能分析</Tag>}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="營收增長機會"
                description="客戶轉換率 3.4% 低於行業平均 4.2%，建議優化銷售流程和客戶體驗，預估可提升營收 15-20%。"
                type="info"
                showIcon
                action={
                  <Button size="small" type="primary">
                    查看詳情
                  </Button>
                }
              />
              <Alert
                message="成本優化空間"
                description="營業費用率 42.6% 接近目標值，建議重點關注行銷投資回報率，優化獲客成本控制。"
                type="warning"
                showIcon
                action={
                  <Button size="small" type="primary">
                    制定計劃
                  </Button>
                }
              />
              <Alert
                message="現金流管理"
                description="應收週轉率表現良好，建議維持當前收款政策，並考慮提供早付折扣進一步改善現金流。"
                type="success"
                showIcon
                action={
                  <Button size="small" type="primary">
                    實施方案
                  </Button>
                }
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PerformanceDashboard