import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Progress,
  Button,
  Space,
  Alert,
  Statistic,
  Tag,
  Tooltip,
  Timeline,
  Typography,
  Spin,
  message,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker
} from 'antd'
import {
  TrophyOutlined,
  TargetOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  StarOutlined
} from '@ant-design/icons'
import { assistantAPI, handleAPIError } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const FinancialGoals = () => {
  const [loading, setLoading] = useState(false)
  const [goalsData, setGoalsData] = useState(null)
  const [customGoals, setCustomGoals] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [form] = Form.useForm()
  const [error, setError] = useState(null)

  // 獲取財務目標數據
  const fetchGoalsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await assistantAPI.getFinancialGoals()
      if (response.success) {
        setGoalsData(response.data)
      }
    } catch (error) {
      console.error('獲取財務目標失敗:', error)
      setError(handleAPIError(error, false))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoalsData()
  }, [])

  // 獲取目標狀態顏色
  const getGoalStatusColor = (progress) => {
    if (progress >= 100) return '#52c41a'
    if (progress >= 75) return '#1890ff'
    if (progress >= 50) return '#faad14'
    return '#ff4d4f'
  }

  // 獲取目標狀態文字
  const getGoalStatusText = (progress) => {
    if (progress >= 100) return '已達成'
    if (progress >= 75) return '接近達成'
    if (progress >= 50) return '進行中'
    return '需努力'
  }

  // 獲取可實現性標籤
  const getAchievabilityTag = (achievability) => {
    const configs = {
      realistic: { color: 'green', text: '容易達成' },
      challenging: { color: 'orange', text: '具挑戰性' },
      difficult: { color: 'red', text: '困難' }
    }
    const config = configs[achievability] || configs.realistic
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 新增/編輯目標
  const handleGoalSubmit = async (values) => {
    try {
      // 這裡應該調用API保存自定義目標
      const newGoal = {
        id: editingGoal?.id || Date.now(),
        ...values,
        deadline: values.deadline.format('YYYY-MM-DD'),
        created_at: editingGoal?.created_at || new Date().toISOString(),
        progress: editingGoal?.progress || 0
      }

      if (editingGoal) {
        setCustomGoals(goals => goals.map(g => g.id === editingGoal.id ? newGoal : g))
        message.success('目標已更新')
      } else {
        setCustomGoals(goals => [...goals, newGoal])
        message.success('目標已新增')
      }

      setModalVisible(false)
      form.resetFields()
      setEditingGoal(null)
    } catch (error) {
      message.error('操作失敗，請重試')
    }
  }

  // 編輯目標
  const handleEditGoal = (goal) => {
    setEditingGoal(goal)
    form.setFieldsValue({
      ...goal,
      deadline: dayjs(goal.deadline)
    })
    setModalVisible(true)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>載入財務目標中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="載入財務目標失敗"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchGoalsData}>
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
          <TargetOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          財務目標追蹤
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          設定財務目標，追蹤達成進度，實現財務自由夢想
        </Paragraph>
      </div>

      {/* 整體進度概覽 */}
      {goalsData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="整體目標達成率"
                value={Math.round(goalsData.summary.overall_score)}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ 
                  color: getGoalStatusColor(goalsData.summary.overall_score) 
                }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="已達成目標"
                value={goalsData.summary.achieved_goals}
                suffix={`/ ${goalsData.summary.total_goals}`}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="本月淨利潤"
                value={goalsData.goals.monthly_profit.current}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ 
                  color: goalsData.goals.monthly_profit.current >= 0 ? '#52c41a' : '#ff4d4f' 
                }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="現金儲備"
                value={goalsData.goals.cash_reserve.current}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 系統推薦目標 */}
      {goalsData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  AI 推薦目標
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                >
                  新增自定義目標
                </Button>
              }
            >
              <Row gutter={[16, 16]}>
                {Object.entries(goalsData.goals).map(([key, goal]) => (
                  <Col xs={24} lg={8} key={key}>
                    <Card size="small" className="goal-card">
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>{goal.description}</Text>
                          {getAchievabilityTag(goal.achievability)}
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {goal.tips}
                        </Text>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>目前</span>
                          <span>${goal.current.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span>目標</span>
                          <span>${goal.suggested.toLocaleString()}</span>
                        </div>
                        <Progress
                          percent={Math.round(goalsData.progress[key])}
                          strokeColor={getGoalStatusColor(goalsData.progress[key])}
                          format={(percent) => (
                            <span style={{ color: getGoalStatusColor(percent) }}>
                              {getGoalStatusText(percent)}
                            </span>
                          )}
                        />
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        {goalsData.progress[key] >= 100 ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                        ) : goalsData.progress[key] >= 50 ? (
                          <RiseOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                        ) : (
                          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* 自定義目標 */}
      {customGoals.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="我的自定義目標">
              <Row gutter={[16, 16]}>
                {customGoals.map(goal => (
                  <Col xs={24} md={12} lg={8} key={goal.id}>
                    <Card 
                      size="small"
                      actions={[
                        <EditOutlined key="edit" onClick={() => handleEditGoal(goal)} />,
                        <Text key="deadline">
                          <CalendarOutlined /> {goal.deadline}
                        </Text>
                      ]}
                    >
                      <Card.Meta
                        title={goal.title}
                        description={
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              <Progress 
                                percent={goal.progress} 
                                strokeColor={getGoalStatusColor(goal.progress)}
                                size="small"
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>目標金額</span>
                              <span>${goal.targetAmount?.toLocaleString()}</span>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* 達成建議時間軸 */}
      {goalsData && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="達成建議">
              <Timeline>
                {Object.entries(goalsData.goals).map(([key, goal], index) => {
                  const progress = goalsData.progress[key]
                  return (
                    <Timeline.Item
                      key={key}
                      color={getGoalStatusColor(progress)}
                      dot={progress >= 100 ? <CheckCircleOutlined /> : <TargetOutlined />}
                    >
                      <div>
                        <Text strong>{goal.description}</Text>
                        {progress >= 100 ? (
                          <Tag color="green" style={{ marginLeft: 8 }}>已達成</Tag>
                        ) : (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            還需 ${(goal.suggested - goal.current).toLocaleString()}
                          </Tag>
                        )}
                        <div style={{ marginTop: 4, color: '#666', fontSize: '12px' }}>
                          {goal.tips}
                        </div>
                      </div>
                    </Timeline.Item>
                  )
                })}
              </Timeline>
            </Card>
          </Col>
        </Row>
      )}

      {/* 新增/編輯目標模態框 */}
      <Modal
        title={editingGoal ? '編輯目標' : '新增自定義目標'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingGoal(null)
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGoalSubmit}
        >
          <Form.Item
            name="title"
            label="目標名稱"
            rules={[{ required: true, message: '請輸入目標名稱' }]}
          >
            <Input placeholder="例如：年度儲蓄目標" />
          </Form.Item>

          <Form.Item
            name="description"
            label="目標描述"
          >
            <Input.TextArea placeholder="詳細描述您的目標..." rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetAmount"
                label="目標金額"
                rules={[{ required: true, message: '請輸入目標金額' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="請輸入金額"
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deadline"
                label="截止日期"
                rules={[{ required: true, message: '請選擇截止日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="category"
            label="目標類別"
            rules={[{ required: true, message: '請選擇目標類別' }]}
          >
            <Select placeholder="請選擇目標類別">
              <Option value="savings">儲蓄目標</Option>
              <Option value="revenue">收入目標</Option>
              <Option value="expense">支出控制</Option>
              <Option value="investment">投資目標</Option>
              <Option value="debt">債務清償</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingGoal ? '更新目標' : '新增目標'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false)
                form.resetFields()
                setEditingGoal(null)
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .goal-card {
          transition: all 0.3s ease;
          border-radius: 8px;
        }
        .goal-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  )
}

export default FinancialGoals