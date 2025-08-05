import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Space, 
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Tag,
  DatePicker,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { budgetAPI } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const BudgetManagement = () => {
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [overview, setOverview] = useState(null)
  const [currentPeriod, setCurrentPeriod] = useState(dayjs().format('YYYY-MM'))
  const [budgetType, setBudgetType] = useState('monthly')

  // 載入數據
  useEffect(() => {
    loadData()
  }, [currentPeriod, budgetType])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 並行載入所有數據
      const [budgetsRes, categoriesRes, overviewRes] = await Promise.all([
        budgetAPI.getList({ period: currentPeriod, budget_type: budgetType }),
        budgetAPI.getCategories(),
        budgetAPI.getOverview({ period: currentPeriod })
      ])

      if (budgetsRes.success) setBudgets(budgetsRes.data)
      if (categoriesRes.success) setCategories(categoriesRes.data)
      if (overviewRes.success) setOverview(overviewRes.data)

    } catch (error) {
      console.error('載入預算數據失敗:', error)
      message.error('載入數據失敗，請稍後重試')
    } finally {
      setLoading(false)
    }
  }

  // 處理新增
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      budget_type: budgetType,
      period: currentPeriod
    })
    setModalVisible(true)
  }

  // 處理編輯
  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      period: record.period
    })
    setModalVisible(true)
  }

  // 處理刪除
  const handleDelete = (record) => {
    Modal.confirm({
      title: '確認刪除',
      content: `確定要刪除預算「${record.name}」嗎？`,
      onOk: async () => {
        try {
          const response = await budgetAPI.delete(record.id)
          if (response.success) {
            message.success('預算刪除成功')
            loadData()
          }
        } catch (error) {
          message.error('刪除失敗，請稍後重試')
        }
      },
    })
  }

  // 處理表單提交
  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      
      const budgetData = {
        ...values,
        amount: parseFloat(values.amount)
      }

      let response
      if (editingRecord) {
        response = await budgetAPI.update(editingRecord.id, budgetData)
      } else {
        response = await budgetAPI.create(budgetData)
      }

      if (response.success) {
        message.success(editingRecord ? '預算更新成功' : '預算創建成功')
        setModalVisible(false)
        form.resetFields()
        loadData()
      }
    } catch (error) {
      message.error('操作失敗，請稍後重試')
    } finally {
      setLoading(false)
    }
  }

  // 獲取狀態顏色和圖標
  const getStatusDisplay = (status, usagePercentage) => {
    switch (status) {
      case 'exceeded':
        return {
          color: 'red',
          icon: <ExclamationCircleOutlined />,
          text: '已超支',
          progressColor: '#ff4d4f'
        }
      case 'warning':
        return {
          color: 'orange', 
          icon: <WarningOutlined />,
          text: '接近上限',
          progressColor: '#faad14'
        }
      default:
        return {
          color: 'green',
          icon: <CheckCircleOutlined />,
          text: '正常',
          progressColor: '#52c41a'
        }
    }
  }

  // 表格欄位定義
  const columns = [
    {
      title: '預算名稱',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.icon} {record.category_name}
          </div>
        </div>
      )
    },
    {
      title: '預算金額',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => `$${amount.toLocaleString()}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '實際支出',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      width: 120,
      render: (actual) => `$${(actual || 0).toLocaleString()}`,
    },
    {
      title: '執行狀況',
      key: 'execution',
      width: 200,
      render: (_, record) => {
        const usagePercentage = record.usage_percentage || 0
        const statusDisplay = getStatusDisplay(record.status, usagePercentage)
        
        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Tag color={statusDisplay.color} icon={statusDisplay.icon}>
                {statusDisplay.text}
              </Tag>
              <span style={{ marginLeft: 8, fontSize: '12px' }}>
                {usagePercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              percent={Math.min(usagePercentage, 100)}
              size="small"
              strokeColor={statusDisplay.progressColor}
              showInfo={false}
            />
          </div>
        )
      }
    },
    {
      title: '期間',
      dataIndex: 'period',
      key: 'period',
      width: 100,
      render: (period, record) => (
        <Tag color="blue">
          {record.budget_type === 'monthly' ? `${period}月` : `${period}年`}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
          >
            刪除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#262626' }}>預算管理</h1>
        <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          設定和監控您的收支預算，掌握財務計劃執行狀況
        </p>
      </div>

      {/* 預算概覽 */}
      {overview && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="預算總數"
                value={overview.totalBudgets}
                prefix={<CalendarOutlined />}
                suffix="個"
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="預算總額"
                value={overview.totalBudget}
                prefix={<DollarOutlined />}
                suffix="元"
                formatter={(value) => `$${value.toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="實際支出"
                value={overview.totalActual}
                prefix={<DollarOutlined />}
                suffix="元"
                formatter={(value) => `$${value.toLocaleString()}`}
                valueStyle={{ color: overview.totalActual > overview.totalBudget ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="整體執行率"
                value={overview.overallUsage}
                suffix="%"
                formatter={(value) => `${value.toFixed(1)}%`}
                valueStyle={{ color: overview.overallUsage > 100 ? '#ff4d4f' : '#52c41a' }}
              />
              <Progress 
                percent={Math.min(overview.overallUsage, 100)}
                size="small"
                strokeColor={overview.overallUsage > 100 ? '#ff4d4f' : '#52c41a'}
                showInfo={false}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 狀態警示 */}
      {overview && (overview.exceededCount > 0 || overview.warningCount > 0) && (
        <Alert
          message="預算執行警示"
          description={
            <div>
              {overview.exceededCount > 0 && (
                <div style={{ color: '#ff4d4f' }}>
                  🚨 {overview.exceededCount} 個預算已超支，請注意控制支出
                </div>
              )}
              {overview.warningCount > 0 && (
                <div style={{ color: '#faad14' }}>
                  ⚠️ {overview.warningCount} 個預算接近上限，建議謹慎控制
                </div>
              )}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 篩選控制 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <span>預算類型：</span>
              <Select 
                value={budgetType} 
                onChange={setBudgetType}
                style={{ width: 120 }}
              >
                <Option value="monthly">月度預算</Option>
                <Option value="yearly">年度預算</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <span>期間：</span>
              {budgetType === 'monthly' ? (
                <DatePicker 
                  picker="month"
                  value={dayjs(currentPeriod)}
                  onChange={(date) => setCurrentPeriod(date.format('YYYY-MM'))}
                />
              ) : (
                <DatePicker 
                  picker="year"
                  value={dayjs(currentPeriod)}
                  onChange={(date) => setCurrentPeriod(date.format('YYYY'))}
                />
              )}
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              新增預算
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 預算列表 */}
      <Card title="預算列表" className="chart-container">
        <Table
          columns={columns}
          dataSource={budgets}
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
        />
      </Card>

      {/* 新增/編輯模態框 */}
      <Modal
        title={editingRecord ? '編輯預算' : '新增預算'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            budget_type: 'monthly',
            period: currentPeriod
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="預算名稱"
                rules={[{ required: true, message: '請輸入預算名稱' }]}
              >
                <Input placeholder="請輸入預算名稱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="預算分類"
                rules={[{ required: true, message: '請選擇預算分類' }]}
              >
                <Select placeholder="請選擇預算分類">
                  {categories.map(category => (
                    <Option key={category.id} value={category.name}>
                      <span style={{ marginRight: 8 }}>{category.icon}</span>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="budget_type"
                label="預算類型"
                rules={[{ required: true, message: '請選擇預算類型' }]}
              >
                <Select placeholder="請選擇預算類型">
                  <Option value="monthly">月度預算</Option>
                  <Option value="yearly">年度預算</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="period"
                label="預算期間"
                rules={[{ required: true, message: '請輸入預算期間' }]}
              >
                <Input placeholder="如: 2024-01 或 2024" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="amount"
                label="預算金額"
                rules={[
                  { required: true, message: '請輸入預算金額' },
                  { type: 'number', min: 0.01, message: '金額必須大於0' }
                ]}
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

          <Form.Item
            name="description"
            label="預算說明"
          >
            <TextArea rows={3} placeholder="請輸入預算說明（選填）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRecord ? '更新' : '新增'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BudgetManagement