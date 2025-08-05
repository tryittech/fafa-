import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  InputNumber, 
  Tag, 
  Space, 
  message,
  Row,
  Col,
  Statistic,
  Upload,
  Alert
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UploadOutlined, MinusOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { expenseAPI } from '../services/api'


const { Option } = Select
const { TextArea } = Input

const ExpenseManagement = () => {
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()
  const [expenseTrend, setExpenseTrend] = useState(null)
  const [trendLoading, setTrendLoading] = useState(false)

  // 獲取支出趨勢洞察
  const fetchExpenseTrend = async () => {
    try {
      setTrendLoading(true)
      const response = await expenseAPI.getExpenseTrend()
      setExpenseTrend(response.data)
    } catch (error) {
      console.error('獲取支出趨勢失敗:', error)
      message.error('獲取支出趨勢分析失敗')
    } finally {
      setTrendLoading(false)
    }
  }

  // 頁面載入時獲取趨勢數據
  useEffect(() => {
    fetchExpenseTrend()
  }, [])

  const [expenseData, setExpenseData] = useState([
    {
      key: '1',
      id: 'EXP001',
      date: '2024-01-15',
      vendor: '房東',
      description: '辦公室租金',
      category: 'rent',
      amount: 15000,
      taxRate: 5,
      taxAmount: 750,
      totalAmount: 15750,
      status: 'paid',
      paymentMethod: 'bank_transfer',
      notes: '1月份租金',
    },
    {
      key: '2',
      id: 'EXP002',
      date: '2024-01-14',
      vendor: '員工A',
      description: '員工薪資',
      category: 'salary',
      amount: 80000,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 80000,
      status: 'paid',
      paymentMethod: 'bank_transfer',
      notes: '1月份薪資',
    },
    {
      key: '3',
      id: 'EXP003',
      date: '2024-01-10',
      vendor: '網路公司',
      description: '網路費用',
      category: 'utilities',
      amount: 2000,
      taxRate: 5,
      taxAmount: 100,
      totalAmount: 2100,
      status: 'pending',
      paymentMethod: 'credit_card',
      notes: '網路月費',
    },
  ])

  const expenseCategories = [
    { value: 'rent', label: '租金', color: 'blue' },
    { value: 'salary', label: '薪資', color: 'green' },
    { value: 'utilities', label: '水電費', color: 'orange' },
    { value: 'marketing', label: '行銷費用', color: 'purple' },
    { value: 'office', label: '辦公用品', color: 'cyan' },
    { value: 'travel', label: '差旅費', color: 'magenta' },
    { value: 'insurance', label: '保險費', color: 'red' },
    { value: 'other', label: '其他', color: 'default' },
  ]

  const statusOptions = [
    { value: 'paid', label: '已支付', color: 'green' },
    { value: 'pending', label: '待支付', color: 'orange' },
    { value: 'overdue', label: '逾期', color: 'red' },
  ]

  const paymentMethodOptions = [
    { value: 'bank_transfer', label: '銀行轉帳' },
    { value: 'check', label: '支票' },
    { value: 'cash', label: '現金' },
    { value: 'credit_card', label: '信用卡' },
  ]

  const columns = [
    {
      title: '支出編號',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: '供應商',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => {
        const cat = expenseCategories.find(c => c.value === category)
        return <Tag color={cat?.color}>{cat?.label}</Tag>
      },
      filters: expenseCategories.map(cat => ({ text: cat.label, value: cat.value })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => `$${amount.toLocaleString()}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '稅額',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      width: 100,
      render: (taxAmount) => `$${taxAmount.toLocaleString()}`,
    },
    {
      title: '總金額',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (totalAmount) => (
        <span style={{ fontWeight: 'bold', color: '#f5222d' }}>
          ${totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const option = statusOptions.find(opt => opt.value === status)
        return <Tag color={option?.color}>{option?.label}</Tag>
      },
      filters: statusOptions.map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (paymentMethod) => {
        const option = paymentMethodOptions.find(opt => opt.value === paymentMethod)
        return option?.label || paymentMethod
      },
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

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
    })
    setModalVisible(true)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '確認刪除',
      content: `確定要刪除支出記錄 "${record.description}" 嗎？`,
      onOk: () => {
        setExpenseData(prev => prev.filter(item => item.key !== record.key))
        message.success('支出記錄已刪除')
      },
    })
  }

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      
      const formData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        taxAmount: values.amount * (values.taxRate / 100),
        totalAmount: values.amount * (1 + values.taxRate / 100),
      }

      if (editingRecord) {
        // 更新現有記錄
        setExpenseData(prev => 
          prev.map(item => 
            item.key === editingRecord.key 
              ? { ...item, ...formData, key: item.key }
              : item
          )
        )
        message.success('支出記錄已更新')
      } else {
        // 新增記錄
        const newRecord = {
          ...formData,
          key: Date.now().toString(),
          id: `EXP${String(expenseData.length + 1).padStart(3, '0')}`,
        }
        setExpenseData(prev => [newRecord, ...prev])
        message.success('支出記錄已新增')
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  // 計算統計數據
  const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0)
  const totalTax = expenseData.reduce((sum, item) => sum + item.taxAmount, 0)
  const paidAmount = expenseData
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.totalAmount, 0)
  const pendingAmount = expenseData
    .filter(item => item.status === 'pending')
    .reduce((sum, item) => sum + item.totalAmount, 0)

  // 按分類統計
  const categoryStats = expenseCategories.map(category => {
    const categoryExpenses = expenseData.filter(item => item.category === category.value)
    const total = categoryExpenses.reduce((sum, item) => sum + item.amount, 0)
    return {
      ...category,
      total,
      count: categoryExpenses.length
    }
  }).filter(stat => stat.total > 0)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#262626' }}>支出管理</h1>
        <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          管理您的所有支出記錄，追蹤付款狀況
        </p>
      </div>

      {/* 支出趨勢洞察分析 */}
      {expenseTrend && (
        <Card 
          title={
            <Space>
              <span>📊 本月支出洞察</span>
              <Button 
                size="small" 
                icon={<SearchOutlined />} 
                onClick={fetchExpenseTrend}
                loading={trendLoading}
              >
                重新整理
              </Button>
            </Space>
          }
          style={{ marginBottom: 24 }}
          loading={trendLoading}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={8}>
              <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Statistic
                  title="本月總支出"
                  value={expenseTrend.currentMonth.total}
                  prefix="$"
                  valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                  suffix="元"
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  {expenseTrend.currentMonth.year}年{expenseTrend.currentMonth.month}月
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                <Statistic
                  title="上月總支出"
                  value={expenseTrend.lastMonth.total}
                  prefix="$"
                  valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                  suffix="元"
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  {expenseTrend.lastMonth.year}年{expenseTrend.lastMonth.month}月
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <Card size="small" style={{ 
                background: expenseTrend.trend === 'increase' ? '#fff2f0' : 
                           expenseTrend.trend === 'decrease' ? '#f6ffed' : '#f0f0f0',
                border: expenseTrend.trend === 'increase' ? '1px solid #ffccc7' :
                       expenseTrend.trend === 'decrease' ? '1px solid #b7eb8f' : '1px solid #d9d9d9'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: 8 }}>
                    {expenseTrend.trend === 'increase' && <span style={{ color: '#ff4d4f', marginRight: 4 }}>📈</span>}
                    {expenseTrend.trend === 'decrease' && <span style={{ color: '#52c41a', marginRight: 4 }}>📉</span>}
                    {expenseTrend.trend === 'stable' && <MinusOutlined style={{ color: '#666', marginRight: 4 }} />}
                    變化趨勢
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold',
                    color: expenseTrend.trend === 'increase' ? '#ff4d4f' : 
                           expenseTrend.trend === 'decrease' ? '#52c41a' : '#666'
                  }}>
                    {expenseTrend.trend === 'increase' ? '+' : ''}{expenseTrend.difference.toLocaleString()} 元
                  </div>
                  <div style={{ 
                    fontSize: '14px',
                    color: expenseTrend.trend === 'increase' ? '#ff4d4f' : 
                           expenseTrend.trend === 'decrease' ? '#52c41a' : '#666'
                  }}>
                    ({expenseTrend.trend === 'increase' ? '+' : ''}{expenseTrend.percentageChange}%)
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* 統計卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card expense">
            <Statistic
              title="總支出"
              value={totalExpense}
              prefix="$"
              valueStyle={{ color: 'white' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="總稅額"
              value={totalTax}
              prefix="$"
              valueStyle={{ color: 'white' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card balance">
            <Statistic
              title="已支付"
              value={paidAmount}
              prefix="$"
              valueStyle={{ color: 'white' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card income">
            <Statistic
              title="待支付"
              value={pendingAmount}
              prefix="$"
              valueStyle={{ color: 'white' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 支出分類統計 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {categoryStats.map(stat => (
          <Col xs={24} sm={12} lg={6} key={stat.value}>
            <Card>
              <Statistic
                title={stat.label}
                value={stat.total}
                prefix="$"
                suffix={`元 (${stat.count}筆)`}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>


      {/* 操作按鈕 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            新增支出
          </Button>
          <Button icon={<SearchOutlined />}>
            進階搜尋
          </Button>
        </Space>
      </Card>

      {/* 支出列表 */}
      <Card title="支出記錄" className="chart-container">
        <Table
          columns={columns}
          dataSource={expenseData}
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/編輯模態框 */}
      <Modal
        title={editingRecord ? '編輯支出記錄' : '新增支出記錄'}
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
            taxRate: 5,
            status: 'pending',
            paymentMethod: 'bank_transfer',
            category: 'other',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="支出日期"
                rules={[{ required: true, message: '請選擇支出日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vendor"
                label="供應商"
                rules={[{ required: true, message: '請輸入供應商' }]}
              >
                <Input placeholder="請輸入供應商" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="支出描述"
            rules={[{ required: true, message: '請輸入支出描述' }]}
          >
            <Input placeholder="請輸入支出描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="支出分類"
                rules={[{ required: true, message: '請選擇支出分類' }]}
              >
                <Select placeholder="請選擇支出分類">
                  {expenseCategories.map(category => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="支出金額"
                rules={[{ required: true, message: '請輸入支出金額' }]}
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
            <Col span={12}>
              <Form.Item
                name="taxRate"
                label="稅率 (%)"
                rules={[{ required: true, message: '請輸入稅率' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="請輸入稅率"
                  min={0}
                  max={100}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="付款狀態"
                rules={[{ required: true, message: '請選擇付款狀態' }]}
              >
                <Select placeholder="請選擇付款狀態">
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="付款方式"
                rules={[{ required: true, message: '請選擇付款方式' }]}
              >
                <Select placeholder="請選擇付款方式">
                  {paymentMethodOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="receipt"
                label="上傳憑證"
              >
                <Upload
                  name="receipt"
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>上傳憑證</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="備註"
          >
            <TextArea rows={3} placeholder="請輸入備註（選填）" />
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

export default ExpenseManagement 