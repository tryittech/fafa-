import React, { useState } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Row, 
  Col, 
  Switch, 
  Select, 
  Divider,
  Space,
  message,
  Upload,
  Typography,
  Alert
} from 'antd'
import { 
  SaveOutlined, 
  DownloadOutlined, 
  UploadOutlined, 
  DatabaseOutlined,
  UserOutlined,
  BellOutlined,
  SecurityScanOutlined
} from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [companyForm] = Form.useForm()
  const [systemForm] = Form.useForm()

  const [companyInfo] = useState({
    name: '財務阿姨取代計畫有限公司',
    taxId: '12345678',
    address: '台北市信義區信義路五段7號',
    phone: '02-2345-6789',
    email: 'contact@fafa.com.tw',
    website: 'https://fafa.com.tw',
    industry: 'software',
    establishmentDate: '2024-01-01',
    capital: 1000000,
    employees: 5,
  })

  const [systemSettings] = useState({
    currency: 'TWD',
    dateFormat: 'YYYY-MM-DD',
    timezone: 'Asia/Taipei',
    language: 'zh-TW',
    notifications: {
      email: true,
      browser: true,
      overdue: true,
      monthly: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordPolicy: 'medium',
    },
  })

  const industries = [
    { value: 'software', label: '軟體開發' },
    { value: 'consulting', label: '顧問服務' },
    { value: 'retail', label: '零售業' },
    { value: 'manufacturing', label: '製造業' },
    { value: 'service', label: '服務業' },
    { value: 'other', label: '其他' },
  ]

  const currencies = [
    { value: 'TWD', label: '新台幣 (TWD)' },
    { value: 'USD', label: '美元 (USD)' },
    { value: 'EUR', label: '歐元 (EUR)' },
    { value: 'JPY', label: '日圓 (JPY)' },
  ]

  const dateFormats = [
    { value: 'YYYY-MM-DD', label: '2024-01-15' },
    { value: 'DD/MM/YYYY', label: '15/01/2024' },
    { value: 'MM/DD/YYYY', label: '01/15/2024' },
    { value: 'YYYY/MM/DD', label: '2024/01/15' },
  ]

  const timezones = [
    { value: 'Asia/Taipei', label: '台北 (UTC+8)' },
    { value: 'Asia/Tokyo', label: '東京 (UTC+9)' },
    { value: 'America/New_York', label: '紐約 (UTC-5)' },
    { value: 'Europe/London', label: '倫敦 (UTC+0)' },
  ]

  const languages = [
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'zh-CN', label: '簡體中文' },
    { value: 'en-US', label: 'English' },
    { value: 'ja-JP', label: '日本語' },
  ]

  const passwordPolicies = [
    { value: 'low', label: '低 (至少6位)' },
    { value: 'medium', label: '中 (至少8位，包含字母和數字)' },
    { value: 'high', label: '高 (至少10位，包含大小寫字母、數字和符號)' },
  ]

  const handleSaveCompany = async (values) => {
    try {
      setLoading(true)
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('公司資訊已更新')
    } catch (error) {
      message.error('更新失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSystem = async (values) => {
    try {
      setLoading(true)
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('系統設定已更新')
    } catch (error) {
      message.error('更新失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      message.info('開始匯出資料...')
      
      const { exportToExcel, exportToCSV, generateFileName } = await import('../utils/exportUtils')
      
      // 模擬匯出所有系統數據
      const allData = [
        { '數據類型': '公司資訊', '項目': '公司名稱', '內容': companyInfo.name },
        { '數據類型': '公司資訊', '項目': '統一編號', '內容': companyInfo.taxId },
        { '數據類型': '公司資訊', '項目': '地址', '內容': companyInfo.address },
        { '數據類型': '公司資訊', '項目': '電話', '內容': companyInfo.phone },
        { '數據類型': '公司資訊', '項目': '郵件', '內容': companyInfo.email },
        { '數據類型': '系統設定', '項目': '貨幣', '內容': systemSettings.currency },
        { '數據類型': '系統設定', '項目': '日期格式', '內容': systemSettings.dateFormat },
        { '數據類型': '系統設定', '項目': '時區', '內容': systemSettings.timezone },
        { '數據類型': '系統設定', '項目': '語言', '內容': systemSettings.language },
      ]
      
      const filename = generateFileName('系統設定匯出', 'xlsx')
      await exportToExcel(allData, filename, '系統設定')
      
      message.success('資料匯出完成!')
    } catch (error) {
      console.error('匯出失敗:', error)
      message.error('匯出失敗，請重試')
    }
  }

  const handleImportData = (file) => {
    message.info('開始匯入資料...')
    // 這裡可以實現資料匯入功能
    return false // 阻止自動上傳
  }

  const handleBackup = () => {
    message.success('資料備份已開始，完成後會通知您')
    // 這裡可以實現備份功能
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#262626' }}>系統設定</h1>
        <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          管理您的公司資訊和系統偏好設定
        </p>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <UserOutlined />
                公司資訊
              </Space>
            } 
            className="chart-container"
          >
            <Form
              form={companyForm}
              layout="vertical"
              onFinish={handleSaveCompany}
              initialValues={companyInfo}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="公司名稱"
                    rules={[{ required: true, message: '請輸入公司名稱' }]}
                  >
                    <Input placeholder="請輸入公司名稱" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="taxId"
                    label="統一編號"
                    rules={[{ required: true, message: '請輸入統一編號' }]}
                  >
                    <Input placeholder="請輸入統一編號" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address"
                label="公司地址"
                rules={[{ required: true, message: '請輸入公司地址' }]}
              >
                <Input placeholder="請輸入公司地址" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="聯絡電話"
                    rules={[{ required: true, message: '請輸入聯絡電話' }]}
                  >
                    <Input placeholder="請輸入聯絡電話" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="電子郵件"
                    rules={[
                      { required: true, message: '請輸入電子郵件' },
                      { type: 'email', message: '請輸入有效的電子郵件格式' }
                    ]}
                  >
                    <Input placeholder="請輸入電子郵件" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="website"
                    label="公司網站"
                  >
                    <Input placeholder="請輸入公司網站" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="industry"
                    label="產業別"
                    rules={[{ required: true, message: '請選擇產業別' }]}
                  >
                    <Select placeholder="請選擇產業別">
                      {industries.map(industry => (
                        <Option key={industry.value} value={industry.value}>
                          {industry.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="establishmentDate"
                    label="成立日期"
                    rules={[{ required: true, message: '請選擇成立日期' }]}
                  >
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="capital"
                    label="資本額"
                    rules={[{ required: true, message: '請輸入資本額' }]}
                  >
                    <Input 
                      type="number" 
                      placeholder="請輸入資本額"
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  儲存公司資訊
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BellOutlined />
                系統設定
              </Space>
            } 
            className="chart-container"
          >
            <Form
              form={systemForm}
              layout="vertical"
              onFinish={handleSaveSystem}
              initialValues={systemSettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="currency"
                    label="預設貨幣"
                    rules={[{ required: true, message: '請選擇預設貨幣' }]}
                  >
                    <Select placeholder="請選擇預設貨幣">
                      {currencies.map(currency => (
                        <Option key={currency.value} value={currency.value}>
                          {currency.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="dateFormat"
                    label="日期格式"
                    rules={[{ required: true, message: '請選擇日期格式' }]}
                  >
                    <Select placeholder="請選擇日期格式">
                      {dateFormats.map(format => (
                        <Option key={format.value} value={format.value}>
                          {format.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="timezone"
                    label="時區"
                    rules={[{ required: true, message: '請選擇時區' }]}
                  >
                    <Select placeholder="請選擇時區">
                      {timezones.map(timezone => (
                        <Option key={timezone.value} value={timezone.value}>
                          {timezone.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="language"
                    label="語言"
                    rules={[{ required: true, message: '請選擇語言' }]}
                  >
                    <Select placeholder="請選擇語言">
                      {languages.map(language => (
                        <Option key={language.value} value={language.value}>
                          {language.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">通知設定</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['notifications', 'email']}
                    label="電子郵件通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['notifications', 'browser']}
                    label="瀏覽器通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['notifications', 'overdue']}
                    label="逾期提醒"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['notifications', 'monthly']}
                    label="月報表通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">安全設定</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['security', 'twoFactor']}
                    label="雙重認證"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['security', 'sessionTimeout']}
                    label="登入逾時 (分鐘)"
                  >
                    <Select>
                      <Option value={15}>15分鐘</Option>
                      <Option value={30}>30分鐘</Option>
                      <Option value={60}>1小時</Option>
                      <Option value={120}>2小時</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name={['security', 'passwordPolicy']}
                label="密碼政策"
              >
                <Select placeholder="請選擇密碼政策">
                  {passwordPolicies.map(policy => (
                    <Option key={policy.value} value={policy.value}>
                      {policy.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  儲存系統設定
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <DatabaseOutlined />
                資料管理
              </Space>
            } 
            className="chart-container"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>資料匯出</Text>
                <br />
                <Text type="secondary">將您的財務資料匯出為Excel或CSV格式</Text>
                <br />
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleExportData}
                  style={{ marginTop: 8 }}
                >
                  匯出資料
                </Button>
              </div>

              <Divider />

              <div>
                <Text strong>資料匯入</Text>
                <br />
                <Text type="secondary">從Excel或CSV檔案匯入財務資料</Text>
                <br />
                <Upload
                  accept=".xlsx,.xls,.csv"
                  beforeUpload={handleImportData}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} style={{ marginTop: 8 }}>
                    選擇檔案
                  </Button>
                </Upload>
              </div>

              <Divider />

              <div>
                <Text strong>資料備份</Text>
                <br />
                <Text type="secondary">建立完整的資料備份，包含所有財務記錄</Text>
                <br />
                <Button 
                  icon={<DatabaseOutlined />} 
                  onClick={handleBackup}
                  style={{ marginTop: 8 }}
                >
                  建立備份
                </Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <SecurityScanOutlined />
                系統資訊
              </Space>
            } 
            className="chart-container"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>版本資訊</Text>
                <br />
                <Text type="secondary">財務阿姨取代計畫 v1.0.0</Text>
              </div>

              <Divider />

              <div>
                <Text strong>最後更新</Text>
                <br />
                <Text type="secondary">2024年1月15日</Text>
              </div>

              <Divider />

              <div>
                <Text strong>資料庫狀態</Text>
                <br />
                <Text type="secondary">正常運行中</Text>
              </div>

              <Divider />

              <div>
                <Text strong>儲存空間</Text>
                <br />
                <Text type="secondary">已使用 2.5GB / 總計 10GB</Text>
              </div>

              <Divider />

              <Alert
                message="系統維護"
                description="系統將於每月第一個週日凌晨2:00-4:00進行例行維護，期間可能無法使用部分功能。"
                type="info"
                showIcon
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Settings 