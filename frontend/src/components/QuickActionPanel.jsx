import React, { useState, useMemo, useCallback } from 'react'
import { 
  Card, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  InputNumber, 
  Select, 
  message,
  Divider,
  Row,
  Col,
  Statistic,
  Badge
} from 'antd'
import { 
  PlusOutlined, 
  MinusOutlined, 
  FileTextOutlined, 
  BarChartOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  RocketOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Option } = Select

const QuickActionPanel = ({ 
  onQuickAdd, 
  recentData = [], 
  showStats = true 
}) => {
  const navigate = useNavigate()
  const [quickModalVisible, setQuickModalVisible] = useState(false)
  const [quickForm] = Form.useForm()
  const [actionType, setActionType] = useState('')

  // 快速操作項目 - 使用 useMemo 避免重新創建
  const quickActions = useMemo(() => [
    {
      key: 'income',
      title: '快速收入',
      icon: <PlusOutlined />,
      color: '#52c41a',
      description: '記錄新收入'
    },
    {
      key: 'expense', 
      title: '快速支出',
      icon: <MinusOutlined />,
      color: '#ff4d4f',
      description: '記錄新支出'
    },
    {
      key: 'reports',
      title: '查看報表',
      icon: <BarChartOutlined />,
      color: '#1890ff',
      description: '財務分析'
    },
    {
      key: 'budget',
      title: '預算管理',
      icon: <FileTextOutlined />,
      color: '#722ed1',
      description: '預算規劃'
    }
  ], [])

  // 常用數據模板 - 使用 useMemo 避免重新創建
  const quickTemplates = useMemo(() => ({
    income: [
      { description: '銷售收入', amount: 10000, category: '銷售' },
      { description: '服務收入', amount: 5000, category: '服務' },
      { description: '諮詢收入', amount: 3000, category: '諮詢' }
    ],
    expense: [
      { description: '辦公室租金', amount: 15000, category: '租金' },
      { description: '員工薪資', amount: 50000, category: '薪資' },
      { description: '水電費', amount: 2000, category: '水電' }
    ]
  }), [])

  const handleQuickAction = useCallback((action) => {
    if (action === 'reports') {
      navigate('/reports')
    } else if (action === 'budget') {
      navigate('/budget')
    } else {
      setActionType(action)
      setQuickModalVisible(true)
    }
  }, [navigate])

  const handleQuickSubmit = async (values) => {
    try {
      const data = {
        ...values,
        date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        status: 'pending'
      }

      if (onQuickAdd) {
        await onQuickAdd(actionType, data)
      }

      message.success(`${actionType === 'income' ? '收入' : '支出'}記錄已新增`)
      setQuickModalVisible(false)
      quickForm.resetFields()
    } catch (error) {
      message.error('操作失敗，請重試')
    }
  }

  const handleTemplateSelect = (template) => {
    quickForm.setFieldsValue({
      description: template.description,
      amount: template.amount,
      category: template.category
    })
  }

  return (
    <Card 
      title={
        <Space>
          <RocketOutlined />
          快捷操作
        </Space>
      }
      className="chart-container"
      style={{ marginBottom: 24 }}
    >
      {/* 快捷按鈕組 */}
      <Row gutter={[16, 16]} style={{ marginBottom: showStats ? 24 : 0 }}>
        {quickActions.map(action => (
          <Col xs={12} sm={6} key={action.key}>
            <Button
              size="large"
              style={{
                width: '100%',
                height: 80,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: action.color,
                color: action.color
              }}
              onClick={() => handleQuickAction(action.key)}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>
                {action.icon}
              </div>
              <div style={{ fontSize: 12 }}>
                {action.title}
              </div>
            </Button>
          </Col>
        ))}
      </Row>

      {/* 快速統計 */}
      {showStats && recentData.length > 0 && (
        <>
          <Divider orientation="left">今日概況</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Statistic
                title="今日收入"
                value={recentData.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="今日支出"
                value={recentData.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)}
                prefix={<DollarOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="待處理"
                value={recentData.filter(item => item.status === 'pending').length}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
                suffix="筆"
              />
            </Col>
          </Row>
        </>
      )}

      {/* 快速輸入模態框 */}
      <Modal
        title={`快速新增${actionType === 'income' ? '收入' : '支出'}`}
        open={quickModalVisible}
        onCancel={() => setQuickModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={quickForm}
          layout="vertical"
          onFinish={handleQuickSubmit}
          initialValues={{
            date: dayjs()
          }}
        >
          {/* 常用模板 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>常用模板：</div>
            <Space wrap>
              {quickTemplates[actionType]?.map((template, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={() => handleTemplateSelect(template)}
                >
                  {template.description} ({template.amount.toLocaleString()})
                </Button>
              ))}
            </Space>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: true, message: '請輸入描述' }]}
              >
                <Input placeholder="請輸入項目描述" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
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
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '請選擇日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="分類"
                rules={[{ required: true, message: '請選擇分類' }]}
              >
                <Select placeholder="請選擇分類">
                  {actionType === 'income' ? (
                    <>
                      <Option value="銷售">銷售收入</Option>
                      <Option value="服務">服務收入</Option>
                      <Option value="諮詢">諮詢收入</Option>
                      <Option value="其他">其他收入</Option>
                    </>
                  ) : (
                    <>
                      <Option value="租金">租金費用</Option>
                      <Option value="薪資">薪資費用</Option>
                      <Option value="水電">水電費</Option>
                      <Option value="辦公">辦公用品</Option>
                      <Option value="交通">交通費</Option>
                      <Option value="其他">其他費用</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                確認新增
              </Button>
              <Button onClick={() => setQuickModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default QuickActionPanel