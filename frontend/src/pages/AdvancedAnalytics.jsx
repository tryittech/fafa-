import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Divider,
  Space,
  Alert,
  Tooltip,
  Empty,
  Spin,
  Tabs,
  Badge,
  List,
  Timeline
} from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  DashboardOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  DollarOutlined,
  PercentageOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { exportToPDF } from '../utils/exportUtils'
import { dashboardAPI, reportsAPI, analyticsAPI, handleAPIError } from '../services/api'

const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs

const AdvancedAnalytics = () => {
  const [loading, setLoading] = useState(false)
  const [performanceData, setPerformanceData] = useState(null)
  const [kpiData, setKpiData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [comparisonData, setComparisonData] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [error, setError] = useState(null)
  const [cashflowForecast, setCashflowForecast] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [profitabilityData, setProfitabilityData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // 獲取績效數據
  const fetchPerformanceData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [performanceRes, forecastRes, anomalyRes, profitabilityRes] = await Promise.all([
        analyticsAPI.getPerformance({ year: selectedYear }),
        analyticsAPI.getCashflowForecast({ months: 6 }),
        analyticsAPI.getAnomalyDetection(),
        analyticsAPI.getProfitabilityAnalysis({ period: selectedPeriod })
      ])
      
      if (performanceRes.success) {
        setPerformanceData(performanceRes.data.performanceData)
        setKpiData(performanceRes.data.kpiData)
        setTrendData(performanceRes.data.trendData)
      }

      if (forecastRes.success) {
        setCashflowForecast(forecastRes.data)
      }

      if (anomalyRes.success) {
        setAnomalies(anomalyRes.data.anomalies)
      }

      if (profitabilityRes.success) {
        setProfitabilityData(profitabilityRes.data)
      }

    } catch (error) {
      console.error('獲取分析數據錯誤:', error)
      const errorMessage = handleAPIError(error, false)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()
  }, [selectedPeriod, selectedYear])

  // 獲取趨勢顏色
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#52c41a'
      case 'down': return '#ff4d4f'
      case 'stable': return '#faad14'
      default: return '#d9d9d9'
    }
  }

  // 獲取趨勢圖標
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <RiseOutlined style={{ color: '#52c41a' }} />
      case 'down': return <FallOutlined style={{ color: '#ff4d4f' }} />
      default: return <TrendingUpOutlined style={{ color: '#faad14' }} />
    }
  }

  // 績效評分顏色
  const getScoreColor = (score) => {
    if (score >= 85) return '#52c41a'
    if (score >= 70) return '#faad14'
    if (score >= 60) return '#1890ff'
    return '#ff4d4f'
  }

  // 匯出報告
  const handleExportPDF = () => {
    exportToPDF('advanced-analytics-content', '經營績效分析報告.pdf')
  }

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2']

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>載入績效分析數據中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="載入數據失敗"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchPerformanceData}>
              重新載入
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div id="advanced-analytics-content">
      {/* 頁面標題與控制項 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col span={18}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <DashboardOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            進階分析報表 - 經營績效儀表板
          </h2>
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          <Space>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 100 }}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Option key={2024 - i} value={2024 - i}>
                  {2024 - i}年
                </Option>
              ))}
            </Select>
            <Button type="primary" onClick={handleExportPDF}>
              匯出報告
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 核心績效指標卡片 */}
      {performanceData && (
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="總營收"
                value={performanceData.totalRevenue}
                precision={0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<DollarOutlined />}
                suffix="元"
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color="green">+{performanceData.revenueGrowth}%</Tag>
                <span style={{ fontSize: '12px', color: '#666' }}>較去年同期</span>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="淨利潤"
                value={performanceData.netProfit}
                precision={0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<TrendingUpOutlined />}
                suffix="元"
              />
              <div style={{ marginTop: '8px' }}>
                <Progress 
                  percent={performanceData.profitMargin} 
                  size="small" 
                  showInfo={false}
                  strokeColor="#1890ff"
                />
                <span style={{ fontSize: '12px', color: '#666' }}>利潤率 {performanceData.profitMargin}%</span>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="投資報酬率"
                value={performanceData.roi}
                precision={1}
                valueStyle={{ color: '#722ed1' }}
                prefix={<PercentageOutlined />}
                suffix="%"
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color="purple">優秀</Tag>
                <span style={{ fontSize: '12px', color: '#666' }}>行業平均 15%</span>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="現金流"
                value={performanceData.cashFlow}
                precision={0}
                valueStyle={{ color: performanceData.cashFlow >= 0 ? '#52c41a' : '#ff4d4f' }}
                prefix={performanceData.cashFlow >= 0 ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                suffix="元"
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color={performanceData.cashFlow >= 0 ? 'green' : 'red'}>
                  {performanceData.cashFlow >= 0 ? '健康' : '警示'}
                </Tag>
                <span style={{ fontSize: '12px', color: '#666' }}>營運現金流</span>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* KPI雷達圖與評分卡 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} lg={12}>
          <Card title="績效雷達圖" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={kpiData.map(kpi => ({
                name: kpi.name,
                score: kpi.score,
                fullMark: 100
              }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="績效評分"
                  dataKey="score"
                  stroke="#1890ff"
                  fill="#1890ff"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="關鍵績效指標" style={{ height: '400px' }}>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {kpiData.map(kpi => (
                <div key={kpi.key} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{kpi.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {getTrendIcon(kpi.trend)}
                      <span style={{ marginLeft: '8px', color: getScoreColor(kpi.score), fontWeight: 'bold' }}>
                        {kpi.score}分
                      </span>
                    </div>
                  </div>
                  <Progress 
                    percent={kpi.score} 
                    strokeColor={getScoreColor(kpi.score)}
                    size="small"
                    showInfo={false}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {kpi.metrics.map((metric, idx) => (
                      <span key={idx} style={{ marginRight: '12px' }}>
                        {metric.name}: {metric.value}{metric.unit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 營收與利潤趨勢圖 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Card title="營收與利潤趨勢分析" style={{ minHeight: '400px' }}>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="#1890ff" name="營收" />
                <Bar yAxisId="left" dataKey="expense" fill="#ff4d4f" name="支出" />
                <Line yAxisId="right" type="monotone" dataKey="profitMargin" stroke="#52c41a" name="利潤率%" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 財務健康度與風險分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} lg={12}>
          <Card title="財務健康度評估">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>流動比率</div>
                  <Progress
                    type="circle"
                    percent={Math.min(performanceData?.currentRatio * 50, 100)}
                    format={() => `${performanceData?.currentRatio}`}
                    strokeColor={performanceData?.currentRatio >= 2 ? '#52c41a' : '#faad14'}
                    width={80}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>負債權益比</div>
                  <Progress
                    type="circle"
                    percent={Math.max(100 - performanceData?.debtToEquity * 100, 0)}
                    format={() => `${performanceData?.debtToEquity}`}
                    strokeColor={performanceData?.debtToEquity <= 0.5 ? '#52c41a' : '#ff4d4f'}
                    width={80}
                  />
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[8, 8]}>
              <Col span={24}>
                <Alert
                  message="財務狀況良好"
                  description="流動性充足，負債比例合理，建議繼續維持目前的財務策略。"
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="營運效率分析">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>存貨週轉率</span>
                <span>{performanceData?.inventoryTurnover} 次/年</span>
              </div>
              <Progress 
                percent={Math.min((performanceData?.inventoryTurnover / 12) * 100, 100)} 
                strokeColor="#1890ff"
                size="small"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>應收帳款週轉率</span>
                <span>{performanceData?.accountsReceivableTurnover} 次/年</span>
              </div>
              <Progress 
                percent={Math.min((performanceData?.accountsReceivableTurnover / 10) * 100, 100)} 
                strokeColor="#52c41a"
                size="small"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>客戶保留率</span>
                <span>{performanceData?.customerRetention}%</span>
              </div>
              <Progress 
                percent={performanceData?.customerRetention} 
                strokeColor="#722ed1"
                size="small"
              />
            </div>
            <Divider />
            <Alert
              message="營運效率提升空間"
              description="應收帳款週轉率良好，建議進一步優化存貨管理以提升整體營運效率。"
              type="info"
              showIcon
            />
          </Card>
        </Col>
      </Row>

      {/* 同期比較分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Card title="同期比較分析">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic
                  title="營收成長率"
                  value={performanceData?.revenueGrowth}
                  precision={1}
                  valueStyle={{ color: performanceData?.revenueGrowth >= 0 ? '#52c41a' : '#ff4d4f' }}
                  prefix={performanceData?.revenueGrowth >= 0 ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                  suffix="%"
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  較去年同期
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="費用控制率"
                  value={100 - performanceData?.expenseGrowth}
                  precision={1}
                  valueStyle={{ color: performanceData?.expenseGrowth < 10 ? '#52c41a' : '#faad14' }}
                  prefix={<PercentageOutlined />}
                  suffix="%"
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  支出成長 {performanceData?.expenseGrowth}%
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="整體績效評級"
                  value="A"
                  valueStyle={{ color: '#1890ff', fontSize: '48px' }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  綜合評分 82/100
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 新增：進階分析功能 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="智能分析中心">
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              
              {/* 現金流預測 */}
              <TabPane tab="現金流預測" key="forecast">
                {cashflowForecast && (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                      <Card title="未來6個月現金流預測" size="small">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={cashflowForecast.forecast}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <RechartsTooltip />
                            <Line 
                              type="monotone" 
                              dataKey="optimistic" 
                              stroke="#52c41a" 
                              name="樂觀情境"
                              strokeDasharray="5 5"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="realistic" 
                              stroke="#1890ff" 
                              name="現實情境"
                              strokeWidth={3}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="pessimistic" 
                              stroke="#ff4d4f" 
                              name="悲觀情境"
                              strokeDasharray="3 3"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                      <Card title="預測洞察" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Statistic
                            title="平均月現金流"
                            value={cashflowForecast.insights?.avgMonthlyFlow}
                            prefix={<DollarOutlined />}
                            suffix="元"
                          />
                          <Statistic
                            title="現金流趨勢"
                            value={
                              cashflowForecast.insights?.trend === 'positive' ? '上升' :
                              cashflowForecast.insights?.trend === 'negative' ? '下降' : '穩定'
                            }
                            valueStyle={{ 
                              color: cashflowForecast.insights?.trend === 'positive' ? '#52c41a' : 
                                     cashflowForecast.insights?.trend === 'negative' ? '#ff4d4f' : '#faad14'
                            }}
                          />
                          <Alert
                            message="預測建議"
                            description={
                              cashflowForecast.insights?.trend === 'positive' 
                                ? "現金流趨勢良好，建議適度投資擴張"
                                : "建議加強應收帳款管理，控制支出"
                            }
                            type={cashflowForecast.insights?.trend === 'positive' ? 'success' : 'warning'}
                            showIcon
                          />
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                )}
              </TabPane>

              {/* 異常檢測 */}
              <TabPane tab={
                <Badge count={anomalies.length} size="small">
                  異常檢測
                </Badge>
              } key="anomaly">
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Alert
                      message={`檢測到 ${anomalies.length} 筆異常交易`}
                      description="基於歷史數據的統計分析，標記異常金額的交易"
                      type={anomalies.length > 5 ? 'warning' : 'info'}
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  </Col>
                  <Col span={24}>
                    <Table
                      dataSource={anomalies}
                      columns={[
                        {
                          title: '日期',
                          dataIndex: 'date',
                          key: 'date',
                          render: (date) => new Date(date).toLocaleDateString()
                        },
                        {
                          title: '類型',
                          dataIndex: 'type',
                          key: 'type',
                          render: (type) => (
                            <Tag color={type === 'income' ? 'green' : 'red'}>
                              {type === 'income' ? '收入' : '支出'}
                            </Tag>
                          )
                        },
                        {
                          title: '金額',
                          dataIndex: 'amount',
                          key: 'amount',
                          render: (amount) => `$${amount.toLocaleString()}`
                        },
                        {
                          title: '異常程度',
                          dataIndex: 'severity',
                          key: 'severity',
                          render: (severity) => (
                            <Tag color={severity === 'high' ? 'red' : 'orange'}>
                              {severity === 'high' ? '高' : '中'}
                            </Tag>
                          )
                        },
                        {
                          title: 'Z-Score',
                          dataIndex: 'z_score',
                          key: 'z_score',
                          render: (score) => score.toFixed(2)
                        },
                        {
                          title: '描述',
                          dataIndex: 'description',
                          key: 'description'
                        }
                      ]}
                      pagination={false}
                      size="small"
                    />
                  </Col>
                </Row>
              </TabPane>

              {/* 盈利能力分析 */}
              <TabPane tab="盈利能力分析" key="profitability">
                {profitabilityData && (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="客戶盈利排行" size="small">
                        <List
                          dataSource={profitabilityData.customerProfitability?.slice(0, 10)}
                          renderItem={(customer, index) => (
                            <List.Item>
                              <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>#{index + 1} {customer.customer}</span>
                                  <span style={{ fontWeight: 'bold' }}>
                                    ${customer.total_revenue.toLocaleString()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                                  <span>{customer.transaction_count} 筆交易</span>
                                  <Tag 
                                    color={
                                      customer.churn_risk === 'high' ? 'red' :
                                      customer.churn_risk === 'medium' ? 'orange' : 'green'
                                    }
                                    size="small"
                                  >
                                    {customer.churn_risk === 'high' ? '高風險' :
                                     customer.churn_risk === 'medium' ? '中風險' : '低風險'}
                                  </Tag>
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="客戶價值分佈" size="small">
                        <Row gutter={16}>
                          <Col span={8}>
                            <Statistic
                              title="VIP客戶"
                              value={profitabilityData.insights?.customerSegments?.vip || 0}
                              suffix="位"
                              valueStyle={{ color: '#722ed1' }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="一般客戶"
                              value={profitabilityData.insights?.customerSegments?.regular || 0}
                              suffix="位"
                              valueStyle={{ color: '#1890ff' }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="零散客戶"
                              value={profitabilityData.insights?.customerSegments?.occasional || 0}
                              suffix="位"
                              valueStyle={{ color: '#52c41a' }}
                            />
                          </Col>
                        </Row>
                        <Divider />
                        <Alert
                          message="分析建議"
                          description={`高風險客戶：${profitabilityData.insights?.highRiskCustomers || 0} 位，平均客戶價值：$${profitabilityData.insights?.avgCustomerValue?.toLocaleString() || 0}`}
                          type="info"
                          showIcon
                        />
                      </Card>
                    </Col>
                  </Row>
                )}
              </TabPane>

            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdvancedAnalytics