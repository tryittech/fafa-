import React, { useState } from 'react'
import { 
  Card, 
  Form, 
  Select, 
  Button, 
  Table, 
  Row, 
  Col, 
  Statistic, 
  Alert, 
  Divider,
  Space,
  DatePicker,
  InputNumber,
  Typography,
  Tooltip
} from 'antd'
import { CalculatorOutlined, DownloadOutlined, InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select
const { Title, Text } = Typography

const TaxHelper = () => {
  const [form] = Form.useForm()
  const [calculationResult, setCalculationResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // 模擬稅務數據
  const [taxData] = useState({
    // 銷項稅額數據
    outputTax: {
      '2024-01': {
        totalSales: 950000,
        taxRate: 5,
        taxAmount: 47500,
        exemptSales: 50000,
        zeroRateSales: 0,
      },
      '2024-02': {
        totalSales: 880000,
        taxRate: 5,
        taxAmount: 44000,
        exemptSales: 30000,
        zeroRateSales: 0,
      },
    },
    
    // 進項稅額數據
    inputTax: {
      '2024-01': {
        totalPurchases: 320000,
        taxRate: 5,
        taxAmount: 16000,
        exemptPurchases: 15000,
        nonDeductibleTax: 2000,
      },
      '2024-02': {
        totalPurchases: 280000,
        taxRate: 5,
        taxAmount: 14000,
        exemptPurchases: 12000,
        nonDeductibleTax: 1500,
      },
    },
  })

  const taxPeriods = [
    { value: '2024-01', label: '2024年1-2月' },
    { value: '2024-02', label: '2024年3-4月' },
    { value: '2024-03', label: '2024年5-6月' },
    { value: '2024-04', label: '2024年7-8月' },
    { value: '2024-05', label: '2024年9-10月' },
    { value: '2024-06', label: '2024年11-12月' },
  ]

  const taxRates = [
    { value: 0, label: '0% (零稅率)' },
    { value: 5, label: '5% (一般稅率)' },
    { value: 10, label: '10% (高稅率)' },
  ]

  const calculateTax = (values) => {
    const { period, customSales, customPurchases, customTaxRate = 5 } = values
    
    let outputTaxData, inputTaxData
    
    if (period && !customSales && !customPurchases) {
      // 使用預設數據
      outputTaxData = taxData.outputTax[period]
      inputTaxData = taxData.inputTax[period]
    } else {
      // 使用自訂數據
      outputTaxData = {
        totalSales: customSales || 0,
        taxRate: customTaxRate,
        taxAmount: (customSales || 0) * (customTaxRate / 100),
        exemptSales: 0,
        zeroRateSales: 0,
      }
      
      inputTaxData = {
        totalPurchases: customPurchases || 0,
        taxRate: customTaxRate,
        taxAmount: (customPurchases || 0) * (customTaxRate / 100),
        exemptPurchases: 0,
        nonDeductibleTax: 0,
      }
    }

    const netTaxPayable = outputTaxData.taxAmount - inputTaxData.taxAmount

    return {
      period: period || '自訂期間',
      outputTax: outputTaxData,
      inputTax: inputTaxData,
      netTaxPayable,
      isRefund: netTaxPayable < 0,
    }
  }

  const handleCalculate = async (values) => {
    try {
      setLoading(true)
      
      // 模擬API調用延遲
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const result = calculateTax(values)
      setCalculationResult(result)
    } catch (error) {
      console.error('計算失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    setCalculationResult(null)
  }

  const handleExport = async () => {
    try {
      if (!calculationResult) return
      
      const { exportToExcel, generateFileName } = await import('../utils/exportUtils')
      
      const data = [
        { '項目': '申報期間', '金額/內容': calculationResult.period },
        { '項目': '銷售總額', '金額/內容': `$${calculationResult.outputTax.totalSales.toLocaleString()}` },
        { '項目': '銷項稅額', '金額/內容': `$${calculationResult.outputTax.taxAmount.toLocaleString()}` },
        { '項目': '進貨總額', '金額/內容': `$${calculationResult.inputTax.totalPurchases.toLocaleString()}` },
        { '項目': '進項稅額', '金額/內容': `$${calculationResult.inputTax.taxAmount.toLocaleString()}` },
        { '項目': calculationResult.isRefund ? '應退稅額' : '應繳稅額', '金額/內容': `$${Math.abs(calculationResult.netTaxPayable).toLocaleString()}` },
      ]
      
      const filename = generateFileName('營業稅計算結果', 'xlsx')
      exportToExcel(data, filename, '營業稅計算')
    } catch (error) {
      console.error('匯出失敗:', error)
    }
  }

  const outputTaxColumns = [
    {
      title: '項目',
      dataIndex: 'item',
      key: 'item',
      width: '60%',
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      width: '40%',
      render: (amount) => `$${amount.toLocaleString()}`,
    },
  ]

  const inputTaxColumns = [
    {
      title: '項目',
      dataIndex: 'item',
      key: 'item',
      width: '60%',
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      width: '40%',
      render: (amount) => `$${amount.toLocaleString()}`,
    },
  ]

  const getOutputTaxData = (outputTax) => [
    { key: '1', item: '銷售總額', amount: outputTax.totalSales },
    { key: '2', item: '應稅銷售額', amount: outputTax.totalSales - outputTax.exemptSales - outputTax.zeroRateSales },
    { key: '3', item: '免稅銷售額', amount: outputTax.exemptSales },
    { key: '4', item: '零稅率銷售額', amount: outputTax.zeroRateSales },
    { key: '5', item: '銷項稅額', amount: outputTax.taxAmount },
  ]

  const getInputTaxData = (inputTax) => [
    { key: '1', item: '進貨總額', amount: inputTax.totalPurchases },
    { key: '2', item: '應稅進貨額', amount: inputTax.totalPurchases - inputTax.exemptPurchases },
    { key: '3', item: '免稅進貨額', amount: inputTax.exemptPurchases },
    { key: '4', item: '進項稅額', amount: inputTax.taxAmount },
    { key: '5', item: '不得扣抵稅額', amount: inputTax.nonDeductibleTax },
    { key: '6', item: '可扣抵進項稅額', amount: inputTax.taxAmount - inputTax.nonDeductibleTax },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#262626' }}>稅務申報小幫手</h1>
        <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          協助您計算營業稅，提供申報參考數據
        </p>
      </div>

      <Alert
        message="重要提醒"
        description="本系統提供的稅額計算僅供參考，實際申報時請以國稅局規定為準。建議在正式申報前諮詢專業會計師或稅務顧問。"
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />


      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="稅額計算設定" className="chart-container">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                taxRate: 5,
              }}
            >
              <Form.Item
                name="calculationType"
                label="計算方式"
                rules={[{ required: true, message: '請選擇計算方式' }]}
              >
                <Select placeholder="請選擇計算方式">
                  <Option value="preset">使用預設數據</Option>
                  <Option value="custom">自訂數據</Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.calculationType !== currentValues.calculationType
                }
              >
                {({ getFieldValue }) => {
                  const calculationType = getFieldValue('calculationType')
                  
                  if (calculationType === 'preset') {
                    return (
                      <Form.Item
                        name="period"
                        label="申報期間"
                        rules={[{ required: true, message: '請選擇申報期間' }]}
                      >
                        <Select placeholder="請選擇申報期間">
                          {taxPeriods.map(period => (
                            <Option key={period.value} value={period.value}>
                              {period.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )
                  }
                  
                  if (calculationType === 'custom') {
                    return (
                      <>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              name="customSales"
                              label="銷售總額"
                              rules={[{ required: true, message: '請輸入銷售總額' }]}
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
                              name="customPurchases"
                              label="進貨總額"
                              rules={[{ required: true, message: '請輸入進貨總額' }]}
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
                          name="customTaxRate"
                          label="營業稅率"
                          rules={[{ required: true, message: '請選擇營業稅率' }]}
                        >
                          <Select placeholder="請選擇營業稅率">
                            {taxRates.map(rate => (
                              <Option key={rate.value} value={rate.value}>
                                {rate.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </>
                    )
                  }
                  
                  return null
                }}
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<CalculatorOutlined />}
                  >
                    計算稅額
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {calculationResult && (
            <Card title="計算結果" className="chart-container">
              <div style={{ marginBottom: 16 }}>
                <Text strong>申報期間：{calculationResult.period}</Text>
              </div>
              
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                  <Statistic
                    title={
                      <span>
                        銷項稅額
                        <Tooltip title="銷項稅額是指營業人銷售貨物或勞務時，向買受人收取的營業稅額。計算公式：銷售額 × 稅率">
                          <QuestionCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                        </Tooltip>
                      </span>
                    }
                    value={calculationResult.outputTax.taxAmount}
                    prefix="$"
                    suffix="元"
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={
                      <span>
                        進項稅額
                        <Tooltip title="進項稅額是指營業人購買貨物或勞務時，向賣方支付的營業稅額。符合規定者可用於扣抵銷項稅額。">
                          <QuestionCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                        </Tooltip>
                      </span>
                    }
                    value={calculationResult.inputTax.taxAmount}
                    prefix="$"
                    suffix="元"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>

              <Divider />

              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ 
                  color: calculationResult.isRefund ? '#52c41a' : '#f5222d',
                  margin: 0 
                }}>
                  {calculationResult.isRefund ? '應退稅額' : '應繳稅額'}
                </Title>
                <Statistic
                  value={Math.abs(calculationResult.netTaxPayable)}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ 
                    fontSize: '24px',
                    color: calculationResult.isRefund ? '#52c41a' : '#f5222d'
                  }}
                />
              </div>

              <Space style={{ width: '100%', justifyContent: 'center' }}>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport()}>
                  下載計算結果
                </Button>
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      {calculationResult && (
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="銷項稅額明細" className="chart-container">
              <Table
                columns={outputTaxColumns}
                dataSource={getOutputTaxData(calculationResult.outputTax)}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="進項稅額明細" className="chart-container">
              <Table
                columns={inputTaxColumns}
                dataSource={getInputTaxData(calculationResult.inputTax)}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      )}

    </div>
  )
}

export default TaxHelper 