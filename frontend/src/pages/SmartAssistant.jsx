import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Alert,
  Button,
  Badge,
  List,
  Statistic,
  Progress,
  Tag,
  Space,
  Divider,
  Typography,
  Timeline,
  Avatar,
  Tooltip,
  Spin,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message
} from 'antd'
import {
  BulbOutlined,
  BellOutlined,
  HeartOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  StarOutlined,
  ThunderboltOutlined,
  BookOutlined,
  ToolOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { assistantAPI, incomeAPI, expenseAPI, handleAPIError } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const SmartAssistant = () => {
  const [loading, setLoading] = useState(false)
  const [reminders, setReminders] = useState([])
  const [healthScore, setHealthScore] = useState(null)
  const [classifyModalVisible, setClassifyModalVisible] = useState(false)
  const [classifyForm] = Form.useForm()
  const [classifyResult, setClassifyResult] = useState(null)
  const [error, setError] = useState(null)
  const [smartReports, setSmartReports] = useState([])
  const [automationSuggestions, setAutomationSuggestions] = useState([])
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [reportForm] = Form.useForm()
  const [chatModalVisible, setChatModalVisible] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [insights, setInsights] = useState(null)
  const [taskSuggestions, setTaskSuggestions] = useState([])
  const [realTimeMetrics, setRealTimeMetrics] = useState(null)

  // 獲取智能提醒
  const fetchReminders = async () => {
    try {
      const response = await assistantAPI.getReminders()
      if (response.success) {
        setReminders(response.data.reminders)
      }
    } catch (error) {
      console.error('獲取提醒失敗:', error)
    }
  }

  // 獲取財務健康評分
  const fetchHealthScore = async () => {
    try {
      const response = await assistantAPI.getHealthScore()
      if (response.success) {
        setHealthScore(response.data)
      }
    } catch (error) {
      console.error('獲取健康評分失敗:', error)
    }
  }

  // 獲取自動化建議
  const fetchAutomationSuggestions = async () => {
    try {
      const response = await assistantAPI.getAutomationSuggestions()
      if (response.success) {
        setAutomationSuggestions(response.data.suggestions)
      }
    } catch (error) {
      console.error('獲取自動化建議失敗:', error)
    }
  }

  // 獲取智能見解
  const fetchInsights = async () => {
    try {
      const response = await assistantAPI.getInsights({ timeRange: 'month' })
      if (response.success) {
        setInsights(response.data.insights)
      }
    } catch (error) {
      console.error('獲取智能見解失敗:', error)
    }
  }

  // 獲取任務建議
  const fetchTaskSuggestions = async () => {
    try {
      const response = await assistantAPI.getTaskSuggestions()
      if (response.success) {
        setTaskSuggestions(response.data.tasks)
      }
    } catch (error) {
      console.error('獲取任務建議失敗:', error)
    }
  }

  // 獲取實時指標
  const fetchRealTimeMetrics = async () => {
    try {
      const [dashboardResponse, healthResponse] = await Promise.all([
        assistantAPI.getInsights({ timeRange: 'week' }),
        assistantAPI.getHealthScore()
      ])
      
      setRealTimeMetrics({
        weeklyInsights: dashboardResponse.success ? dashboardResponse.data : null,
        healthScore: healthResponse.success ? healthResponse.data : null,
        lastUpdated: new Date()
      })
    } catch (error) {
      console.error('獲取實時指標失敗:', error)
    }
  }

  // 初始化數據
  const initializeData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchReminders(),
        fetchHealthScore(),
        fetchAutomationSuggestions(),
        fetchInsights(),
        fetchTaskSuggestions(),
        fetchRealTimeMetrics()
      ])
    } catch (error) {
      console.error('初始化智能助手失敗:', error)
      setError(handleAPIError(error, false))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeData()
  }, [])

  // 智能分類測試
  const handleClassifyTest = async (values) => {
    try {
      const response = await assistantAPI.classifyTransaction(values)
      if (response.success) {
        setClassifyResult(response.data)
        message.success('智能分類建議已生成')
      }
    } catch (error) {
      message.error('智能分類失敗')
    }
  }

  // 生成智能報表
  const handleGenerateReport = async (values) => {
    try {
      const response = await assistantAPI.generateSmartReport(values)
      if (response.success) {
        setSmartReports(prev => [response.data, ...prev])
        setReportModalVisible(false)
        reportForm.resetFields()
        message.success('智能報表已生成')
      }
    } catch (error) {
      message.error('報表生成失敗')
    }
  }

  // 處理提醒行動
  const handleReminderAction = async (reminder) => {
    switch (reminder.type) {
      case 'overdue_income':
        message.info('建議聯絡客戶催收款項')
        break
      case 'duplicate_expense':
        message.info('請檢查是否有重複記錄')
        break
      case 'cash_flow_warning':
        message.info('建議查看現金流預測頁面')
        break
      default:
        message.info('請查看相關頁面處理')
    }
  }

  // 處理智能對話
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setChatLoading(true)

    try {
      const response = await assistantAPI.chat({
        message: currentMessage,
        context: {
          previousMessages: chatMessages.slice(-5) // 只傳送最近5條訊息作為上下文
        }
      })

      if (response.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.data.response,
          suggestions: response.data.suggestions || [],
          actions: response.data.actions || [],
          intent: response.data.intent,
          timestamp: new Date()
        }

        setChatMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '抱歉，我現在無法回應您的問題。請稍後再試。',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
      message.error('對話失敗，請重試')
    } finally {
      setChatLoading(false)
    }
  }

  // 處理建議點擊
  const handleSuggestionClick = (suggestion) => {
    setCurrentMessage(suggestion)
  }

  // 初始化智能對話
  const initializeChat = () => {
    if (chatMessages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'assistant',
        content: '👋 您好！我是您的智能財務助手。我可以幫助您分析財務狀況、解答財務問題、提供經營建議。請告訴我您想了解什麼？',
        suggestions: [
          '我的財務狀況如何？',
          '本月支出分析',
          '收入來源分析',
          '現金流預測',
          '如何降低成本？'
        ],
        timestamp: new Date()
      }
      setChatMessages([welcomeMessage])
    }
  }

  // 獲取優先級顏色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4d4f'
      case 'medium': return '#faad14'
      case 'low': return '#52c41a'
      default: return '#d9d9d9'
    }
  }

  // 獲取優先級標籤
  const getPriorityTag = (priority) => {
    const colors = { high: 'red', medium: 'orange', low: 'green' }
    const labels = { high: '高', medium: '中', low: '低' }
    return <Tag color={colors[priority]}>{labels[priority]}</Tag>
  }

  // 獲取健康等級顏色
  const getHealthGradeColor = (grade) => {
    switch (grade) {
      case 'A': return '#52c41a'
      case 'B': return '#1890ff' 
      case 'C': return '#faad14'
      case 'D': return '#fa8c16'
      case 'F': return '#ff4d4f'
      default: return '#d9d9d9'
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>載入智能助手中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="載入智能助手失敗"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={initializeData}>
              重新載入
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <RobotOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          智能財務助手
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          AI 驅動的財務管理建議，讓您的財務管理更智能、更高效
        </Paragraph>
      </div>

      {/* 實時財務儀表板 */}
      {realTimeMetrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <SyncOutlined style={{ color: '#13c2c2' }} />
                  實時財務概覽
                  <Tag color="green">
                    {realTimeMetrics.lastUpdated.toLocaleTimeString()}
                  </Tag>
                </Space>
              }
              extra={
                <Tooltip title="數據每5分鐘自動更新">
                  <Button 
                    size="small" 
                    icon={<SyncOutlined />}
                    onClick={fetchRealTimeMetrics}
                  >
                    刷新
                  </Button>
                </Tooltip>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title="本週現金流"
                      value={Math.random() * 10000 + 5000} // 模擬數據
                      prefix="$"
                      valueStyle={{ color: '#52c41a' }}
                      suffix="元"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title="待處理交易"
                      value={Math.floor(Math.random() * 10) + 1} // 模擬數據
                      prefix={<ExclamationCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                      suffix="筆"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title="健康評分"
                      value={healthScore?.totalScore || 0}
                      suffix="/100"
                      prefix={<HeartOutlined />}
                      valueStyle={{ 
                        color: healthScore?.totalScore >= 70 ? '#52c41a' : '#faad14' 
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* 財務健康評分 */}
      {healthScore && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <HeartOutlined style={{ color: '#ff4d4f' }} />
                  財務健康評分
                </Space>
              }
              extra={
                <Tooltip title="綜合評估您的財務狀況">
                  <InfoCircleOutlined />
                </Tooltip>
              }
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <Progress
                        type="circle"
                        percent={healthScore.totalScore}
                        format={() => (
                          <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getHealthGradeColor(healthScore.grade) }}>
                              {healthScore.grade}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {healthScore.totalScore}分
                            </div>
                          </div>
                        )}
                        strokeColor={getHealthGradeColor(healthScore.grade)}
                        size={120}
                      />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text strong>
                        {healthScore.totalScore >= 85 ? '優秀' :
                         healthScore.totalScore >= 70 ? '良好' :
                         healthScore.totalScore >= 50 ? '普通' : '需改善'}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={16}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>獲利能力</span>
                        <span>{healthScore.scores.profitability}/25</span>
                      </div>
                      <Progress 
                        percent={(healthScore.scores.profitability / 25) * 100} 
                        showInfo={false}
                        strokeColor="#52c41a"
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>穩定性</span>
                        <span>{healthScore.scores.stability}/25</span>
                      </div>
                      <Progress 
                        percent={(healthScore.scores.stability / 25) * 100} 
                        showInfo={false}
                        strokeColor="#1890ff"
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>成長性</span>
                        <span>{healthScore.scores.growth}/20</span>
                      </div>
                      <Progress 
                        percent={(healthScore.scores.growth / 20) * 100} 
                        showInfo={false}
                        strokeColor="#722ed1"
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>效率</span>
                        <span>{healthScore.scores.efficiency}/15</span>
                      </div>
                      <Progress 
                        percent={(healthScore.scores.efficiency / 15) * 100} 
                        showInfo={false}
                        strokeColor="#faad14"
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>現金流</span>
                        <span>{healthScore.scores.cashFlow}/15</span>
                      </div>
                      <Progress 
                        percent={(healthScore.scores.cashFlow / 15) * 100} 
                        showInfo={false}
                        strokeColor="#13c2c2"
                      />
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* 智能提醒和建議 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BellOutlined style={{ color: '#faad14' }} />
                智能提醒
                <Badge count={reminders.length} />
              </Space>
            }
            extra={
              <Button size="small" onClick={fetchReminders}>
                刷新
              </Button>
            }
          >
            {reminders.length > 0 ? (
              <List
                dataSource={reminders}
                renderItem={(reminder) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="action" 
                        type="link" 
                        size="small"
                        onClick={() => handleReminderAction(reminder)}
                      >
                        {reminder.action}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={reminder.priority === 'high' ? <WarningOutlined /> : <InfoCircleOutlined />}
                          style={{ 
                            backgroundColor: getPriorityColor(reminder.priority)
                          }}
                        />
                      }
                      title={
                        <Space>
                          {reminder.title}
                          {getPriorityTag(reminder.priority)}
                        </Space>
                      }
                      description={reminder.message}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <CheckCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div>暫無提醒事項</div>
                <div style={{ fontSize: '12px' }}>您的財務狀況良好</div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BulbOutlined style={{ color: '#52c41a' }} />
                改善建議
              </Space>
            }
          >
            {healthScore?.suggestions && healthScore.suggestions.length > 0 ? (
              <Timeline>
                {healthScore.suggestions.map((suggestion, index) => (
                  <Timeline.Item
                    key={index}
                    color={suggestion.priority === 'high' ? 'red' : 'blue'}
                    dot={suggestion.priority === 'high' ? <WarningOutlined /> : <BulbOutlined />}
                  >
                    <div>
                      <Text strong>{suggestion.category}</Text>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: 4 }}>
                        問題：{suggestion.issue}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        建議：{suggestion.suggestion}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <StarOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div>財務狀況優秀</div>
                <div style={{ fontSize: '12px' }}>暫無改善建議</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 智能工具 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card 
            title={
              <Space>
                <ToolOutlined style={{ color: '#1890ff' }} />
                智能工具
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => setClassifyModalVisible(true)}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <ThunderboltOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold' }}>智能分類</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    AI 自動建議收支分類
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  size="small"
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => setReportModalVisible(true)}
                >
                  <BookOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold' }}>智能報表</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    自動生成財務洞察
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  size="small"
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.open('/backup-management', '_blank')}
                >
                  <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold' }}>智能備份</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    數據安全備份管理
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  size="small"
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => setChatModalVisible(true)}
                >
                  <RobotOutlined style={{ fontSize: '24px', color: '#13c2c2', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold' }}>智能對話</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    AI 財務問答助手
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 智能任務建議 */}
      {taskSuggestions.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <BulbOutlined style={{ color: '#faad14' }} />
                  今日任務建議
                  <Badge count={taskSuggestions.filter(t => t.priority === 'high').length} />
                </Space>
              }
              extra={
                <Tooltip title="AI 根據您的財務狀況生成的任務建議">
                  <InfoCircleOutlined />
                </Tooltip>
              }
            >
              <Timeline>
                {taskSuggestions.slice(0, 5).map((task, index) => (
                  <Timeline.Item
                    key={index}
                    color={getPriorityColor(task.priority)}
                    dot={task.priority === 'high' ? <ExclamationCircleOutlined /> : <BulbOutlined />}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{task.title}</Text>
                        <Space>
                          {getPriorityTag(task.priority)}
                          {task.estimatedTime && (
                            <Tag color="blue">
                              預計 {task.estimatedTime} 分鐘
                            </Tag>
                          )}
                        </Space>
                      </div>
                      <div style={{ color: '#666', fontSize: '14px', marginTop: 4 }}>
                        {task.description}
                      </div>
                      {task.benefits && (
                        <div style={{ color: '#52c41a', fontSize: '12px', marginTop: 4 }}>
                          💡 效益：{task.benefits}
                        </div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={() => {
                            // 這裡可以添加執行任務的邏輯
                            message.success(`開始執行任務：${task.title}`)
                          }}
                        >
                          立即執行
                        </Button>
                        <Button 
                          size="small" 
                          style={{ marginLeft: 8 }}
                          onClick={() => {
                            // 移除任務
                            setTaskSuggestions(prev => prev.filter((_, i) => i !== index))
                            message.info('任務已標記為完成')
                          }}
                        >
                          標記完成
                        </Button>
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
              
              {taskSuggestions.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button type="link" onClick={() => message.info('查看全部任務功能開發中')}>
                    查看全部 {taskSuggestions.length} 個任務建議 →
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* 自動化建議 */}
      {automationSuggestions.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#722ed1' }} />
                  自動化建議
                  <Badge count={automationSuggestions.length} />
                </Space>
              }
            >
              <List
                dataSource={automationSuggestions}
                renderItem={(suggestion) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="action" 
                        type="link" 
                        size="small"
                        onClick={() => message.info('功能開發中')}
                      >
                        {suggestion.action === 'setup_auto_record' ? '設定自動記錄' : 
                         suggestion.action === 'enable_auto_categorization' ? '啟用自動分類' : 
                         suggestion.action === 'setup_auto_backup' ? '設定自動備份' : '查看詳情'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<ThunderboltOutlined />}
                          style={{ backgroundColor: getPriorityColor(suggestion.priority) }}
                        />
                      }
                      title={
                        <Space>
                          {suggestion.title}
                          {getPriorityTag(suggestion.priority)}
                          {suggestion.potential_time_savings && (
                            <Tag color="blue">
                              節省 {suggestion.potential_time_savings} 分鐘/月
                            </Tag>
                          )}
                        </Space>
                      }
                      description={suggestion.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 生成的智能報表 */}
      {smartReports.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="生成的智能報表">
              <List
                dataSource={smartReports}
                renderItem={(report) => (
                  <List.Item
                    actions={[
                      <Button key="view" type="link" onClick={() => message.info('查看報表功能開發中')}>
                        查看詳情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={`${report.reportType === 'business_insights' ? '商業洞察報表' :
                               report.reportType === 'cash_flow_analysis' ? '現金流分析報表' :
                               report.reportType === 'profitability_report' ? '獲利能力報表' : '智能報表'}`}
                      description={`生成時間：${new Date(report.generatedAt).toLocaleString()}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 智能報表生成模態框 */}
      <Modal
        title="生成智能報表"
        open={reportModalVisible}
        onCancel={() => {
          setReportModalVisible(false)
          reportForm.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={handleGenerateReport}
        >
          <Form.Item
            name="reportType"
            label="報表類型"
            rules={[{ required: true, message: '請選擇報表類型' }]}
          >
            <Select placeholder="請選擇要生成的報表類型">
              <Option value="business_insights">商業洞察報表</Option>
              <Option value="cash_flow_analysis">現金流分析報表</Option>
              <Option value="profitability_report">獲利能力報表</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="時間範圍"
            rules={[{ required: true, message: '請選擇時間範圍' }]}
          >
            <Select placeholder="請選擇分析的時間範圍">
              <Option value="this_month">本月</Option>
              <Option value="last_month">上月</Option>
              <Option value="this_quarter">本季</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                生成報表
              </Button>
              <Button onClick={() => {
                setReportModalVisible(false)
                reportForm.resetFields()
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 智能分類測試模態框 */}
      <Modal
        title="智能分類測試"
        open={classifyModalVisible}
        onCancel={() => {
          setClassifyModalVisible(false)
          setClassifyResult(null)
          classifyForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={classifyForm}
          layout="vertical"
          onFinish={handleClassifyTest}
        >
          <Form.Item
            name="description"
            label="交易描述"
            rules={[{ required: true, message: '請輸入交易描述' }]}
          >
            <Input placeholder="例如：客戶A的服務費" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="金額"
            rules={[{ required: true, message: '請輸入金額' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="請輸入金額"
              min={0}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="類型"
            rules={[{ required: true, message: '請選擇類型' }]}
          >
            <Select placeholder="請選擇收入或支出">
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                獲取分類建議
              </Button>
              <Button onClick={() => classifyForm.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {classifyResult && (
          <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
            <Title level={5}>分類建議結果</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>建議分類：</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {classifyResult.suggestedCategory}
                </Tag>
              </div>
              <div>
                <Text strong>信心度：</Text>
                <Progress 
                  percent={classifyResult.confidence * 100} 
                  size="small"
                  style={{ marginLeft: 8, width: 200 }}
                />
              </div>
              <div>
                <Text strong>說明：</Text>
                <Text style={{ marginLeft: 8 }}>{classifyResult.explanation}</Text>
              </div>
              {classifyResult.alternatives && classifyResult.alternatives.length > 0 && (
                <div>
                  <Text strong>其他選項：</Text>
                  <div style={{ marginTop: 4 }}>
                    {classifyResult.alternatives.map((alt, index) => (
                      <Tag key={index} style={{ margin: '2px 4px' }}>{alt}</Tag>
                    ))}
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* 智能對話模態框 */}
      <Modal
        title="💬 智能財務助手對話"
        open={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, height: '600px', display: 'flex', flexDirection: 'column' }}
        afterOpenChange={(open) => {
          if (open) {
            initializeChat()
          }
        }}
      >
        {/* 對話內容區域 */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px', 
          backgroundColor: '#fafafa',
          minHeight: '500px'
        }}>
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: '16px',
                display: 'flex',
                flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}
            >
              <Avatar
                style={{
                  backgroundColor: msg.type === 'user' ? '#1890ff' : '#52c41a',
                  margin: msg.type === 'user' ? '0 0 0 8px' : '0 8px 0 0'
                }}
                icon={msg.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
              />
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: msg.type === 'user' ? '#1890ff' : 'white',
                  color: msg.type === 'user' ? 'white' : '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: 1.6,
                  fontSize: '14px'
                }}>
                  {msg.content}
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      💡 相關建議：
                    </div>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {msg.suggestions.map((suggestion, index) => (
                        <Tag
                          key={index}
                          style={{ 
                            cursor: 'pointer',
                            margin: '2px',
                            padding: '4px 8px',
                            borderRadius: '16px',
                            border: '1px solid #d9d9d9',
                            backgroundColor: '#f6f6f6'
                          }}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
                <div style={{ 
                  fontSize: '11px', 
                  color: msg.type === 'user' ? 'rgba(255,255,255,0.7)' : '#999',
                  marginTop: '8px',
                  textAlign: 'right'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <Avatar
                style={{ backgroundColor: '#52c41a', marginRight: '8px' }}
                icon={<RobotOutlined />}
              />
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <Spin size="small" />
                <span style={{ marginLeft: '8px', color: '#666' }}>思考中...</span>
              </div>
            </div>
          )}
        </div>

        {/* 輸入區域 */}
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid #f0f0f0',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onPressEnter={handleSendMessage}
              placeholder="輸入您的問題..."
              style={{ flex: 1 }}
              disabled={chatLoading}
            />
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleSendMessage}
              loading={chatLoading}
              disabled={!currentMessage.trim()}
            >
              發送
            </Button>
          </div>
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: '#999',
            textAlign: 'center'
          }}>
            💡 提示：您可以詢問財務狀況、支出分析、收入分析、現金流預測等問題
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SmartAssistant