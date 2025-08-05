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
  Tooltip,
  Alert,
  Divider
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, MailOutlined, WarningOutlined, DollarOutlined, UserOutlined, InfoCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { incomeAPI, assistantAPI } from '../services/api'


const { Option } = Select
const { TextArea } = Input

const IncomeManagement = () => {
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()

  const [incomeData, setIncomeData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [batchOperation, setBatchOperation] = useState('')
  const [smartSuggestion, setSmartSuggestion] = useState(null)
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false)

  const statusOptions = [
    { value: 'paid', label: '已收款', color: 'green' },
    { value: 'pending', label: '待收款', color: 'orange' },
    { value: 'overdue', label: '逾期', color: 'red' },
  ]

  const paymentMethodOptions = [
    { value: 'bank_transfer', label: '銀行轉帳' },
    { value: 'check', label: '支票' },
    { value: 'cash', label: '現金' },
    { value: 'credit_card', label: '信用卡' },
  ]

  // 載入收入數據
  const loadIncomeData = async () => {
    try {
      setLoading(true)
      const response = await incomeAPI.getList()
      if (response.success) {
        // 格式化數據以匹配表格需要的格式
        const formattedData = (response.data || []).map((item, index) => ({
          key: item.income_id || index,
          id: item.income_id,
          date: item.date,
          customer: item.customer,
          description: item.description,
          amount: item.amount,
          taxRate: item.tax_rate,
          taxAmount: item.tax_amount,
          totalAmount: item.total_amount,
          status: item.status,
          paymentMethod: item.payment_method,
          notes: item.notes,
          dueDate: item.date, // 使用收入日期作為到期日
        }))
        setIncomeData(formattedData)
      }
    } catch (error) {
      console.error('載入收入數據失敗:', error)
      message.error('載入收入數據失敗，請稍後重試')
    } finally {
      setLoading(false)
    }
  }

  // 組件載入時獲取數據
  useEffect(() => {
    loadIncomeData()
  }, [])

  // 計算收入洞察數據
  const calculateIncomeInsights = () => {
    const currentMonth = dayjs().format('YYYY-MM')
    const currentMonthData = incomeData.filter(item => 
      dayjs(item.date).format('YYYY-MM') === currentMonth
    )
    
    const totalIncome = currentMonthData.reduce((sum, item) => sum + item.amount, 0)
    const pendingAmount = incomeData
      .filter(item => item.status === 'pending' || item.status === 'overdue')
      .reduce((sum, item) => sum + item.totalAmount, 0)
    
    // 計算平均客單價
    const uniqueCustomers = [...new Set(incomeData.map(item => item.customer))]
    const averageOrderValue = uniqueCustomers.length > 0 ? totalIncome / uniqueCustomers.length : 0
    
    // 找出最大客戶來源
    const customerTotals = {}
    incomeData.forEach(item => {
      customerTotals[item.customer] = (customerTotals[item.customer] || 0) + item.amount
    })
    const topCustomer = Object.entries(customerTotals)
      .sort(([,a], [,b]) => b - a)[0]
    
    return {
      totalIncome,
      averageOrderValue,
      pendingAmount,
      topCustomer: topCustomer ? topCustomer[0] : '無',
      topCustomerAmount: topCustomer ? topCustomer[1] : 0
    }
  }

  // 計算逾期天數
  const calculateOverdueDays = (dueDate) => {
    if (!dueDate) return 0
    const today = dayjs()
    const due = dayjs(dueDate)
    return Math.max(0, today.diff(due, 'day'))
  }

  // 一鍵收款提醒
  const handlePaymentReminder = (record) => {
    const overdueDays = calculateOverdueDays(record.dueDate)
    const subject = overdueDays > 0 
      ? `【緊急】款項逾期${overdueDays}天提醒 - ${record.description}`
      : `【款項提醒】關於${record.description}的款項`
    
    const body = overdueDays > 0 
      ? `親愛的${record.customer}：

關於發票 ${record.id}（${record.description}）的款項 ${record.totalAmount.toLocaleString()} 元，
原定付款日期為 ${record.dueDate}，目前已逾期 ${overdueDays} 天。

請盡快安排付款，如有任何問題請隨時聯繫我們。

謝謝您的配合！

此郵件由財務管理系統自動生成`
      : `親愛的${record.customer}：

關於發票 ${record.id}（${record.description}）的款項 ${record.totalAmount.toLocaleString()} 元，
付款日期為 ${record.dueDate}。

請在期限內完成付款，如有任何問題請隨時聯繫我們。

謝謝您的配合！

此郵件由財務管理系統自動生成`
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink)
    
    message.success('已開啟郵件軟體，請檢查您的預設郵件應用程式')
  }

  // 客戶集中度分析
  const getCustomerConcentrationAnalysis = () => {
    const customerTotals = {}
    const totalRevenue = incomeData.reduce((sum, item) => sum + item.amount, 0)
    
    incomeData.forEach(item => {
      customerTotals[item.customer] = (customerTotals[item.customer] || 0) + item.amount
    })
    
    const topCustomer = Object.entries(customerTotals)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (topCustomer && totalRevenue > 0) {
      const concentration = (topCustomer[1] / totalRevenue) * 100
      return {
        concentration,
        topCustomer: topCustomer[0],
        risk: concentration > 70 ? 'high' : concentration > 50 ? 'medium' : 'low'
      }
    }
    
    return null
  }

  const insights = calculateIncomeInsights()
  const concentrationAnalysis = getCustomerConcentrationAnalysis()

  const columns = [
    {
      title: '收入編號',
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
      title: '客戶',
      dataIndex: 'customer',
      key: 'customer',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          ${totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        const option = statusOptions.find(opt => opt.value === status)
        const overdueDays = calculateOverdueDays(record.dueDate)
        
        if (status === 'overdue' || (status === 'pending' && overdueDays > 0)) {
          return (
            <Tooltip title={`逾期 ${overdueDays} 天`}>
              <Tag color="red" icon={<WarningOutlined />}>
                逾期 {overdueDays} 天
              </Tag>
            </Tooltip>
          )
        }
        
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
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {(record.status === 'pending' || record.status === 'overdue') && (
            <Tooltip title="發送收款提醒">
              <Button 
                type="link" 
                icon={<MailOutlined />} 
                onClick={() => handlePaymentReminder(record)}
                style={{ color: '#faad14' }}
              >
                提醒
              </Button>
            </Tooltip>
          )}
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
      taxRate: record.taxRate,
      paymentMethod: record.paymentMethod,
    })
    setModalVisible(true)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '確認刪除',
      content: `確定要刪除收入記錄 "${record.description}" 嗎？`,
      onOk: async () => {
        try {
          const response = await incomeAPI.delete(record.id)
          if (response.success) {
            message.success('收入記錄已刪除')
            loadIncomeData() // 重新載入數據
          }
        } catch (error) {
          console.error('刪除失敗:', error)
          message.error('刪除失敗，請重試')
        }
      },
    })
  }

  // 批量操作處理函數
  const handleBatchOperation = (operation) => {
    if (selectedRowKeys.length === 0) {
      message.warning('請選擇要操作的項目')
      return
    }
    setBatchOperation(operation)
    setBatchModalVisible(true)
  }

  const confirmBatchOperation = async (values) => {
    setLoading(true)
    try {
      const promises = selectedRowKeys.map(async (id) => {
        switch (batchOperation) {
          case 'updateStatus':
            return incomeAPI.update(id, { status: values.status })
          case 'delete':
            return incomeAPI.delete(id)
          default:
            return Promise.resolve()
        }
      })

      await Promise.all(promises)
      
      message.success(`批量${batchOperation === 'delete' ? '刪除' : '更新'}成功！`)
      setSelectedRowKeys([])
      setBatchModalVisible(false)
      loadIncomeData()
    } catch (error) {
      console.error('批量操作失敗:', error)
      message.error('批量操作失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: false,
    }),
  }

  // 智能分類建議
  const getSmartSuggestion = async (description, amount) => {
    if (!description || !amount) return
    
    setIsGettingSuggestion(true)
    try {
      const response = await assistantAPI.classifyTransaction({
        description,
        amount,
        type: 'income'
      })
      if (response.success) {
        setSmartSuggestion(response.data)
      }
    } catch (error) {
      console.error('獲取智能建議失敗:', error)
    } finally {
      setIsGettingSuggestion(false)
    }
  }

  // 當描述或金額改變時觸發智能建議
  const handleFormChange = (changedFields, allFields) => {
    const description = allFields.find(f => f.name[0] === 'description')?.value
    const amount = allFields.find(f => f.name[0] === 'amount')?.value
    
    if (description && amount && description.length > 2) {
      // 延遲執行，避免過於頻繁的API調用
      setTimeout(() => {
        getSmartSuggestion(description, amount)
      }, 1000)
    }
  }

  // 應用智能建議
  const applySuggestion = (category) => {
    form.setFieldsValue({ category })
    setSmartSuggestion(null)
  }

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      
      const formData = {
        date: values.date.format('YYYY-MM-DD'),
        customer: values.customer,
        description: values.description,
        category: values.category,
        amount: values.amount,
        tax_rate: values.taxRate,
        tax_amount: values.amount * (values.taxRate / 100),
        total_amount: values.amount * (1 + values.taxRate / 100),
        status: values.status,
        payment_method: values.paymentMethod,
        notes: values.notes || '',
      }

      if (editingRecord) {
        // 更新現有記錄
        const response = await incomeAPI.update(editingRecord.id, formData)
        if (response.success) {
          message.success('收入記錄已更新')
          loadIncomeData() // 重新載入數據
        }
      } else {
        // 新增記錄
        const response = await incomeAPI.create(formData)
        if (response.success) {
          message.success('收入記錄已新增')
          loadIncomeData() // 重新載入數據
        }
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('操作失敗:', error)
      message.error('操作失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#262626' }}>收入管理</h1>
        <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          管理您的所有收入記錄，追蹤收款狀況，掌握商業洞察
        </p>
      </div>

      {/* 收入總覽卡 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="stat-card income"
            style={{ 
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
            }}
          >
            <Statistic
              title={
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  本月總收入
                </span>
              }
              value={insights.totalIncome}
              prefix="$"
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="stat-card"
            style={{ 
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
            }}
          >
            <Statistic
              title={
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  平均客單價
                </span>
              }
              value={Math.round(insights.averageOrderValue)}
              prefix="$"
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="stat-card balance"
            style={{ 
              background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(250, 173, 20, 0.3)'
            }}
          >
            <Statistic
              title={
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                  <WarningOutlined style={{ marginRight: 4 }} />
                  待收款總額
                </span>
              }
              value={insights.pendingAmount}
              prefix="$"
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="stat-card expense"
            style={{ 
              background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(114, 46, 209, 0.3)'
            }}
          >
            <Statistic
              title={
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  最大客戶來源
                </span>
              }
              value={insights.topCustomer}
              valueStyle={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}
              suffix={
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                  ${insights.topCustomerAmount.toLocaleString()}
                </span>
              }
            />
          </Card>
        </Col>
      </Row>


      {/* 商業洞察分析 */}
      {concentrationAnalysis && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Alert
              message={
                <div>
                  <strong>💡 客戶結構分析</strong>
                  <br />
                  您有 {concentrationAnalysis.concentration.toFixed(1)}% 的收入來自「{concentrationAnalysis.topCustomer}」。
                  {concentrationAnalysis.risk === 'high' && (
                    <span style={{ color: '#ff4d4f' }}>
                      <br />⚠️ 建議：這位是您的超級貴人！但在業務規劃上，可以考慮開發更多元的客戶來源，以分散經營風險。
                    </span>
                  )}
                  {concentrationAnalysis.risk === 'medium' && (
                    <span style={{ color: '#faad14' }}>
                      <br />💡 建議：客戶集中度適中，可以考慮進一步拓展客戶基礎。
                    </span>
                  )}
                  {concentrationAnalysis.risk === 'low' && (
                    <span style={{ color: '#52c41a' }}>
                      <br />✅ 很好！您的客戶結構相當多元化，這有助於降低經營風險。
                    </span>
                  )}
                </div>
              }
              type={concentrationAnalysis.risk === 'high' ? 'warning' : concentrationAnalysis.risk === 'medium' ? 'info' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>
      )}

      {/* 操作按鈕 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            新增收入
          </Button>
          <Button icon={<SearchOutlined />}>
            進階搜尋
          </Button>
        </Space>
        
        {/* 批量操作工具欄 */}
        {selectedRowKeys.length > 0 && (
          <div style={{ 
            marginTop: 16, 
            padding: '12px 16px', 
            background: '#f0f2f5', 
            borderRadius: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>已選擇 {selectedRowKeys.length} 項</span>
            <Space>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={() => handleBatchOperation('updateStatus')}
              >
                批量更新狀態
              </Button>
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleBatchOperation('delete')}
              >
                批量刪除
              </Button>
              <Button onClick={() => setSelectedRowKeys([])}>
                取消選擇
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {/* 收入列表 */}
      <Card title="收入記錄" className="chart-container">
        <Table
          columns={columns}
          dataSource={incomeData}
          loading={loading}
          rowSelection={rowSelection}
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
        title={editingRecord ? '編輯收入記錄' : '新增收入記錄'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFieldsChange={handleFormChange}
          initialValues={{
            taxRate: 5,
            status: 'pending',
            paymentMethod: 'bank_transfer',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="收入日期"
                rules={[{ required: true, message: '請選擇收入日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customer"
                label="客戶名稱"
                rules={[{ required: true, message: '請輸入客戶名稱' }]}
              >
                <Input placeholder="請輸入客戶名稱" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="收入描述"
            rules={[{ required: true, message: '請輸入收入描述' }]}
          >
            <Input placeholder="請輸入收入描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="收入金額"
                rules={[{ required: true, message: '請輸入收入金額' }]}
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
          </Row>

          {/* 智能分類建議 */}
          {smartSuggestion && (
            <Alert
              message="💡 AI 智能分類建議"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    建議分類：
                    <Tag 
                      color="blue" 
                      style={{ marginLeft: 8, cursor: 'pointer' }}
                      onClick={() => applySuggestion(smartSuggestion.suggestedCategory)}
                    >
                      {smartSuggestion.suggestedCategory}
                    </Tag>
                    <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                      信心度: {Math.round(smartSuggestion.confidence * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {smartSuggestion.explanation}
                  </div>
                  {smartSuggestion.alternatives && smartSuggestion.alternatives.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      其他選項：
                      {smartSuggestion.alternatives.map((alt, index) => (
                        <Tag 
                          key={index} 
                          style={{ margin: '2px', cursor: 'pointer' }}
                          onClick={() => applySuggestion(alt)}
                        >
                          {alt}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              }
              type="info"
              showIcon
              closable
              onClose={() => setSmartSuggestion(null)}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* 分類欄位 */}
          <Form.Item
            name="category"
            label={
              <span>
                收入分類
                {isGettingSuggestion && (
                  <span style={{ marginLeft: 8, color: '#1890ff' }}>
                    <span className="ant-spin-dot ant-spin-dot-small ant-spin-dot-spin">
                      <i className="ant-spin-dot-item"></i>
                      <i className="ant-spin-dot-item"></i>
                      <i className="ant-spin-dot-item"></i>
                      <i className="ant-spin-dot-item"></i>
                    </span>
                    AI 分析中...
                  </span>
                )}
              </span>
            }
            rules={[{ required: true, message: '請選擇或輸入收入分類' }]}
          >
            <Select 
              placeholder="請選擇收入分類" 
              showSearch
              allowClear
              optionFilterProp="children"
            >
              <Option value="銷售">銷售收入</Option>
              <Option value="服務">服務收入</Option>
              <Option value="諮詢">諮詢收入</Option>
              <Option value="租金">租金收入</Option>
              <Option value="利息">利息收入</Option>
              <Option value="其他">其他收入</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="收款狀態"
                rules={[{ required: true, message: '請選擇收款狀態' }]}
              >
                <Select placeholder="請選擇收款狀態">
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
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

      {/* 批量操作模態框 */}
      <Modal
        title={`批量操作 (${selectedRowKeys.length} 項)`}
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={400}
      >
        {batchOperation === 'updateStatus' && (
          <Form
            layout="vertical"
            onFinish={confirmBatchOperation}
          >
            <Form.Item
              name="status"
              label="更新狀態"
              rules={[{ required: true, message: '請選擇狀態' }]}
            >
              <Select placeholder="請選擇新狀態">
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={option.color}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  確認更新
                </Button>
                <Button onClick={() => setBatchModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {batchOperation === 'delete' && (
          <div>
            <Alert
              message="警告"
              description={`確定要刪除選中的 ${selectedRowKeys.length} 項收入記錄嗎？此操作無法復原。`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Space>
              <Button 
                danger 
                onClick={() => confirmBatchOperation({})}
                loading={loading}
              >
                確認刪除
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>
                取消
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default IncomeManagement 