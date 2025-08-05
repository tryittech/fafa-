import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Select,
  DatePicker,
  Table,
  Alert,
  Spin,
  Tag,
  Progress,
  Typography,
  Space,
  Divider,
  Tooltip
} from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts'
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  AlertOutlined,
  CalendarOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  ExportOutlined
} from '@ant-design/icons'
import { useResponsive } from '../hooks/useResponsive'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { analyticsAPI, handleAPIError } from '../services/api'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const CashFlowPrediction = () => {
  const [loading, setLoading] = useState(false)
  const [forecastData, setForecastData] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [forecastDays, setForecastDays] = useState(30)
  const [error, setError] = useState(null)
  const { isMobile } = useResponsive()

  // 獲取現金流預測數據
  const fetchForecastData = async (days = 30) => {
    setLoading(true)
    setError(null)
    try {
      const months = Math.ceil(days / 30)
      const result = await analyticsAPI.getCashflowForecast({ months })
      
      if (result.success) {
        // 轉換新API格式到舊格式，保持UI兼容
        const adaptedData = {
          currentBalance: result.data.historical[result.data.historical.length - 1]?.net_flow || 0,
          summary: {
            finalBalance: result.data.forecast[result.data.forecast.length - 1]?.realistic || 0,
            worstCaseBalance: Math.min(...result.data.forecast.map(f => f.pessimistic)),
            riskDays: result.data.forecast.filter(f => f.realistic < 0).length
          },
          dailyForecast: result.data.forecast.map((item, index) => ({
            date: item.month + '-15', // 使用月中日期
            predictedIncome: item.optimistic - item.realistic + (item.realistic > 0 ? item.realistic : 0),
            predictedExpense: item.realistic < 0 ? Math.abs(item.realistic) : 0,
            netCashFlow: item.realistic,
            cumulativeBalance: item.realistic,
            riskLevel: item.realistic < -100000 ? 'critical' : 
                      item.realistic < -50000 ? 'high' :
                      item.realistic < 0 ? 'medium' : 'low',
            confidence: parseFloat(item.confidence) * 100
          }))
        }
        setForecastData(adaptedData)
      } else {
        setError('獲取預測數據失敗')
      }
    } catch (error) {
      console.error('API 請求失敗:', error)
      const errorMessage = handleAPIError(error, false)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 獲取現金流分析數據
  const fetchAnalysisData = async () => {
    try {
      const result = await analyticsAPI.getAnomalyDetection()
      
      if (result.success) {
        setAnalysisData(result.data)
      }
    } catch (error) {
      console.error('獲取分析數據失敗:', error)
    }
  }

  // 獲取現金流預警
  const fetchAlerts = async () => {
    try {
      const result = await analyticsAPI.getAnomalyDetection()
      
      if (result.success && result.data.anomalies.length > 0) {
        // 轉換異常檢測為預警格式
        const alertsData = result.data.anomalies.filter(a => a.severity === 'high').map(anomaly => ({
          title: '現金流異常檢測',
          message: `檢測到異常${anomaly.type === 'income' ? '收入' : '支出'}：${anomaly.description}，金額 $${anomaly.amount.toLocaleString()}`,
          type: 'warning',
          recommendations: result.data.summary.recommendedActions || ['密切監控現金流變化', '檢查交易合理性']
        }))
        setAlerts(alertsData)
      }
    } catch (error) {
      console.error('獲取預警數據失敗:', error)
    }
  }

  useEffect(() => {
    fetchForecastData(forecastDays)
    fetchAnalysisData()
    fetchAlerts()
  }, [forecastDays])

  // 處理預測期間改變
  const handleForecastDaysChange = (value) => {
    setForecastDays(value)
    fetchForecastData(value)
  }

  // 風險等級顏色映射
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return '#f5222d'
      case 'high': return '#fa8c16'
      case 'medium': return '#faad14'
      case 'low': return '#52c41a'
      default: return '#d9d9d9'
    }
  }

  // 風險等級標籤
  const getRiskTag = (riskLevel) => {
    const colors = {
      critical: 'red',
      high: 'orange', 
      medium: 'gold',
      low: 'green'
    }
    const labels = {
      critical: '嚴重',
      high: '高風險',
      medium: '中風險',
      low: '低風險'
    }
    
    return <Tag color={colors[riskLevel]}>{labels[riskLevel]}</Tag>
  }

  // 匯出功能
  const handleExport = (format) => {
    if (!forecastData) return
    
    if (format === 'pdf') {
      exportToPDF('cashflow-prediction-content', '現金流預測報告.pdf')
    } else if (format === 'excel') {
      const exportData = forecastData.dailyForecast.map(day => ({
        日期: day.date,
        預測收入: day.predictedIncome,
        預測支出: day.predictedExpense,
        淨現金流: day.netCashFlow,
        累計餘額: day.cumulativeBalance,
        風險等級: day.riskLevel,
        信心度: `${day.confidence}%`
      }))
      exportToExcel(exportData, '現金流預測數據.xlsx')
    }
  }

  // 表格欄位定義
  const forecastColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: isMobile ? 80 : 100,
      render: (date) => new Date(date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
    },
    {
      title: '預測收入',
      dataIndex: 'predictedIncome',
      key: 'predictedIncome',
      width: isMobile ? 80 : 100,
      render: (value) => `$${value.toLocaleString()}`,
      className: isMobile ? 'mobile-hidden' : ''
    },
    {
      title: '預測支出',
      dataIndex: 'predictedExpense', 
      key: 'predictedExpense',
      width: isMobile ? 80 : 100,
      render: (value) => `$${value.toLocaleString()}`,
      className: isMobile ? 'mobile-hidden' : ''
    },
    {
      title: '淨現金流',
      dataIndex: 'netCashFlow',
      key: 'netCashFlow',
      width: isMobile ? 90 : 110,
      render: (value) => (
        <Text type={value >= 0 ? 'success' : 'danger'}>
          ${value.toLocaleString()}
        </Text>
      )
    },
    {
      title: '累計餘額',
      dataIndex: 'cumulativeBalance',
      key: 'cumulativeBalance',
      width: isMobile ? 90 : 110,
      render: (value) => (
        <Text strong type={value >= 0 ? 'success' : 'danger'}>
          ${value.toLocaleString()}
        </Text>
      )
    },
    {
      title: '風險等級',
      dataIndex: 'riskLevel',
      key: 'riskLevel', 
      width: isMobile ? 70 : 90,
      render: (riskLevel) => getRiskTag(riskLevel)
    },
    {
      title: '信心度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: isMobile ? 60 : 80,
      render: (confidence) => (
        <Progress 
          percent={confidence} 
          size="small" 
          showInfo={!isMobile}
          strokeColor={confidence > 80 ? '#52c41a' : confidence > 60 ? '#faad14' : '#f5222d'}
        />
      ),
      className: isMobile ? 'mobile-hidden' : ''
    }
  ]

  if (loading && !forecastData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>載入現金流預測數據中...</div>
      </div>
    )
  }

  if (error && !forecastData) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="載入現金流預測失敗"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={() => fetchForecastData(forecastDays)}>
              重新載入
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div id="cashflow-prediction-content">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <BarChartOutlined /> 現金流預測
        </Title>
        
        <Space>
          <Select
            value={forecastDays}
            onChange={handleForecastDaysChange}
            style={{ width: 120 }}
          >
            <Option value={7}>7 天</Option>
            <Option value={15}>15 天</Option>
            <Option value={30}>30 天</Option>
            <Option value={60}>60 天</Option>
            <Option value={90}>90 天</Option>
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

      {/* 預警區域 */}
      {alerts && alerts.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title={<><AlertOutlined /> 現金流預警</>} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                {alerts.map((alert, index) => (
                  <Alert
                    key={index}
                    message={alert.title}
                    description={
                      <div>
                        <div>{alert.message}</div>
                        {alert.recommendations && alert.recommendations.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <Text strong>建議措施：</Text>
                            <ul style={{ margin: '4px 0 0 16px' }}>
                              {alert.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    }
                    type={alert.type === 'critical' ? 'error' : 'warning'}
                    showIcon
                    closable
                  />
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* 總覽統計卡片 */}
      {forecastData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="當前現金餘額"
                value={forecastData.currentBalance}
                prefix="$"
                valueStyle={{ color: forecastData.currentBalance >= 0 ? '#3f8600' : '#cf1322' }}
                formatter={(value) => value.toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={`預測期末餘額 (${forecastDays}天)`}
                value={forecastData.summary.finalBalance}
                prefix="$"
                valueStyle={{ color: forecastData.summary.finalBalance >= 0 ? '#3f8600' : '#cf1322' }}
                formatter={(value) => value.toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="最低點餘額"
                value={forecastData.summary.worstCaseBalance}
                prefix="$"
                valueStyle={{ color: forecastData.summary.worstCaseBalance >= 0 ? '#3f8600' : '#cf1322' }}
                formatter={(value) => value.toLocaleString()}
                suffix={
                  <Tooltip title="預測期間內的最低現金餘額">
                    <InfoCircleOutlined style={{ fontSize: 14, color: '#999' }} />
                  </Tooltip>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="高風險天數"
                value={forecastData.summary.riskDays}
                suffix={`/ ${forecastDays} 天`}
                valueStyle={{ color: forecastData.summary.riskDays > 0 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 現金流預測圖表 */}
      {forecastData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="現金流預測圖表" extra={<CalendarOutlined />}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecastData.dailyForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                    fontSize={isMobile ? 10 : 12}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    fontSize={isMobile ? 10 : 12}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [`$${value.toLocaleString()}`, name === 'cumulativeBalance' ? '累計餘額' : name]}
                    labelFormatter={(value) => `日期: ${new Date(value).toLocaleDateString('zh-TW')}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cumulativeBalance"
                    stroke="#1890ff"
                    fill="#1890ff"
                    fillOpacity={0.3}
                    name="累計現金餘額"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* 收支預測對比圖 */}
      {forecastData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="每日收支預測對比">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={forecastData.dailyForecast.slice(0, 14)}> {/* 只顯示前14天 */}
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                    fontSize={isMobile ? 10 : 12}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    fontSize={isMobile ? 10 : 12}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      `$${value.toLocaleString()}`, 
                      name === 'predictedIncome' ? '預測收入' : '預測支出'
                    ]}
                    labelFormatter={(value) => `日期: ${new Date(value).toLocaleDateString('zh-TW')}`}
                  />
                  <Legend />
                  <Bar dataKey="predictedIncome" fill="#52c41a" name="預測收入" />
                  <Bar dataKey="predictedExpense" fill="#f5222d" name="預測支出" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* 詳細預測數據表格 */}
      {forecastData && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card 
              title="詳細預測數據" 
              extra={
                <Space>
                  <Text type="secondary">預測 {forecastDays} 天</Text>
                  <Tooltip title="數據基於歷史趨勢和季節性調整">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Table
                columns={forecastColumns}
                dataSource={forecastData.dailyForecast}
                rowKey="date"
                pagination={{
                  pageSize: isMobile ? 10 : 15,
                  showSizeChanger: !isMobile,
                  showQuickJumper: !isMobile,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`
                }}
                scroll={{ x: isMobile ? 600 : undefined }}
                size={isMobile ? 'small' : 'middle'}
                rowClassName={(record) => {
                  if (record.riskLevel === 'critical') return 'risk-critical-row'
                  if (record.riskLevel === 'high') return 'risk-high-row'
                  return ''
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <style jsx>{`
        .risk-critical-row {
          background-color: #fff2f0 !important;
        }
        .risk-high-row {
          background-color: #fff7e6 !important;
        }
      `}</style>
    </div>
  )
}

export default CashFlowPrediction