import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Upload,
  Button,
  Progress,
  Alert,
  Tag,
  Space,
  Typography,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Modal,
  List,
  Statistic,
  Divider,
  message,
  Spin,
  Tooltip,
  Badge,
  Timeline
} from 'antd'
import {
  CameraOutlined,
  ScanOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  SaveOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  BulbOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  FileSearchOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { assistantAPI, expenseAPI, handleAPIError } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input
const { Dragger } = Upload

const ReceiptScanner = () => {
  const [loading, setLoading] = useState(false)
  const [scanResults, setScanResults] = useState([])
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false)
  const [templates, setTemplates] = useState([])
  const [form] = Form.useForm()
  const [batchFiles, setBatchFiles] = useState([])
  const [processingProgress, setProcessingProgress] = useState(0)
  const [error, setError] = useState(null)

  // 獲取收據模板
  const fetchTemplates = async () => {
    try {
      const response = await assistantAPI.getReceiptTemplates()
      if (response.success) {
        setTemplates(response.data.templates)
      }
    } catch (error) {
      console.error('獲取模板失敗:', error)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // 單個收據掃描
  const handleSingleScan = async (file) => {
    try {
      setLoading(true)
      setError(null)

      // 將文件轉換為 base64
      const base64 = await fileToBase64(file)
      
      const response = await assistantAPI.scanReceipt({
        imageData: base64,
        type: 'auto'
      })

      if (response.success) {
        const newResult = {
          id: Date.now(),
          file,
          ...response.data,
          status: 'scanned',
          createdAt: new Date()
        }
        
        setScanResults(prev => [newResult, ...prev])
        message.success('收據掃描完成！')
        
        // 如果信心度較高，自動填入表單
        if (response.data.confidence > 0.8) {
          setSelectedReceipt(newResult)
          setEditModalVisible(true)
        }
      }
    } catch (error) {
      console.error('掃描失敗:', error)
      setError(handleAPIError(error, false))
      message.error('收據掃描失敗，請重試')
    } finally {
      setLoading(false)
    }

    return false // 阻止 Upload 組件的默認上傳行為
  }

  // 批量掃描
  const handleBatchScan = async () => {
    if (batchFiles.length === 0) {
      message.warning('請先選擇要掃描的收據文件')
      return
    }

    try {
      setLoading(true)
      setProcessingProgress(0)

      const receipts = []
      for (let i = 0; i < batchFiles.length; i++) {
        const base64 = await fileToBase64(batchFiles[i])
        receipts.push({
          id: i,
          imageData: base64,
          type: 'auto'
        })
        setProcessingProgress(Math.round((i / batchFiles.length) * 50))
      }

      const response = await assistantAPI.batchScanReceipts({ receipts })
      
      if (response.success) {
        const newResults = response.data.results.map((result, index) => ({
          id: Date.now() + index,
          file: batchFiles[index],
          ...result.data,
          status: 'scanned',
          createdAt: new Date(),
          batchId: Date.now()
        }))

        setScanResults(prev => [...newResults, ...prev])
        setBatchModalVisible(false)
        setBatchFiles([])
        setProcessingProgress(100)
        
        message.success(
          `批量掃描完成！成功處理 ${response.data.processedCount} 個文件，${response.data.errorCount} 個錯誤`
        )
      }
    } catch (error) {
      console.error('批量掃描失敗:', error)
      message.error('批量掃描失敗，請重試')
    } finally {
      setLoading(false)
      setProcessingProgress(0)
    }
  }

  // 編輯掃描結果
  const handleEditReceipt = (receipt) => {
    setSelectedReceipt(receipt)
    form.setFieldsValue({
      vendor: receipt.vendor,
      amount: receipt.amount,
      date: dayjs(receipt.date),
      description: receipt.description,
      category: receipt.category,
      notes: receipt.rawText
    })
    setEditModalVisible(true)
  }

  // 保存到支出記錄
  const handleSaveExpense = async (values) => {
    try {
      setLoading(true)
      
      const expenseData = {
        date: values.date.format('YYYY-MM-DD'),
        vendor: values.vendor,
        description: values.description,
        category: values.category,
        amount: values.amount,
        payment_method: values.paymentMethod || 'cash',
        notes: values.notes || '',
        receipt_scanned: true
      }

      const response = await expenseAPI.create(expenseData)
      
      if (response.success) {
        // 更新掃描結果狀態
        setScanResults(prev => 
          prev.map(result => 
            result.id === selectedReceipt.id 
              ? { ...result, status: 'saved', expenseId: response.data.id }
              : result
          )
        )
        
        setEditModalVisible(false)
        form.resetFields()
        message.success('支出記錄已保存！')
      }
    } catch (error) {
      console.error('保存失敗:', error)
      message.error('保存支出記錄失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  // 文件轉 base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // 獲取信心度顏色
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#52c41a'
    if (confidence >= 0.6) return '#faad14'
    return '#ff4d4f'
  }

  // 獲取狀態標籤
  const getStatusTag = (status) => {
    switch (status) {
      case 'scanned':
        return <Tag color="blue">已掃描</Tag>
      case 'saved':
        return <Tag color="green">已保存</Tag>
      case 'error':
        return <Tag color="red">錯誤</Tag>
      default:
        return <Tag>未知</Tag>
    }
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <ScanOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          智能收據掃描
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          使用 AI 技術自動識別收據內容，快速建立支出記錄
        </Paragraph>
      </div>

      {/* 功能操作區 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '200px' }}
            bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <Dragger
              accept="image/*"
              beforeUpload={handleSingleScan}
              showUploadList={false}
              style={{ border: 'none', background: 'transparent' }}
            >
              <p className="ant-upload-drag-icon">
                <CameraOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                單張掃描
              </p>
              <p className="ant-upload-hint">
                點擊或拖拽收據圖片
              </p>
            </Dragger>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '200px', cursor: 'pointer' }}
            bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            onClick={() => setBatchModalVisible(true)}
          >
            <CloudUploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              批量掃描
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>
              一次處理多張收據
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '200px', cursor: 'pointer' }}
            bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            onClick={() => setTemplatesModalVisible(true)}
          >
            <FileSearchOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              智能模板
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>
              查看常用供應商模板
            </div>
          </Card>
        </Col>
      </Row>

      {/* 掃描進度 */}
      {processingProgress > 0 && processingProgress < 100 && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text strong>正在處理收據...</Text>
              <Progress 
                percent={processingProgress} 
                style={{ marginTop: 8 }}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* 錯誤提示 */}
      {error && (
        <Alert
          message="掃描過程中發生錯誤"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 掃描結果 */}
      {scanResults.length > 0 && (
        <Card 
          title={
            <Space>
              <HistoryOutlined />
              掃描歷史
              <Badge count={scanResults.length} style={{ backgroundColor: '#52c41a' }} />
            </Space>
          }
        >
          <List
            dataSource={scanResults}
            renderItem={(result) => (
              <List.Item
                actions={[
                  <Button 
                    key="view" 
                    type="link" 
                    icon={<EyeOutlined />}
                    onClick={() => {
                      Modal.info({
                        title: '收據詳情',
                        width: 600,
                        content: (
                          <div>
                            <div style={{ marginBottom: 16 }}>
                              <img 
                                src={URL.createObjectURL(result.file)} 
                                alt="收據"
                                style={{ maxWidth: '100%', maxHeight: '300px' }}
                              />
                            </div>
                            <div>
                              <strong>識別文字：</strong>
                              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: 8 }}>
                                {result.rawText}
                              </pre>
                            </div>
                          </div>
                        )
                      })
                    }}
                  >
                    查看
                  </Button>,
                  <Button 
                    key="edit" 
                    type="link" 
                    icon={<EditOutlined />}
                    onClick={() => handleEditReceipt(result)}
                    disabled={result.status === 'saved'}
                  >
                    編輯
                  </Button>,
                  <Button 
                    key="delete" 
                    type="link" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setScanResults(prev => prev.filter(r => r.id !== result.id))
                      message.success('已刪除')
                    }}
                  >
                    刪除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ position: 'relative' }}>
                      <FileImageOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                      {result.status === 'saved' && (
                        <CheckCircleOutlined 
                          style={{ 
                            position: 'absolute', 
                            top: -5, 
                            right: -5, 
                            color: '#52c41a',
                            backgroundColor: 'white',
                            borderRadius: '50%'
                          }} 
                        />
                      )}
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong>{result.vendor}</Text>
                      {getStatusTag(result.status)}
                      <Tag color={getConfidenceColor(result.confidence)}>
                        信心度 {Math.round(result.confidence * 100)}%
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>金額：</Text>${result.amount?.toLocaleString()}
                        <Divider type="vertical" />
                        <Text strong>類別：</Text>{result.category}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>描述：</Text>{result.description}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        掃描時間：{result.createdAt?.toLocaleString()}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 編輯模態框 */}
      <Modal
        title="編輯收據資訊"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedReceipt && (
          <div>
            {/* 原始圖片 */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <img 
                src={URL.createObjectURL(selectedReceipt.file)} 
                alt="收據"
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
              />
            </div>

            {/* AI 識別結果 */}
            <Alert
              message="AI 識別結果"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>信心度：</Text>
                    <Progress 
                      percent={Math.round(selectedReceipt.confidence * 100)} 
                      size="small" 
                      style={{ width: 200, marginLeft: 8 }}
                      strokeColor={getConfidenceColor(selectedReceipt.confidence)}
                    />
                  </div>
                  {selectedReceipt.recommendations && selectedReceipt.recommendations.length > 0 && (
                    <div>
                      <Text strong>建議：</Text>
                      <ul style={{ marginTop: 4, marginBottom: 0 }}>
                        {selectedReceipt.recommendations.map((rec, index) => (
                          <li key={index}>{rec.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* 編輯表單 */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveExpense}
              initialValues={{
                vendor: selectedReceipt.vendor,
                amount: selectedReceipt.amount,
                date: dayjs(selectedReceipt.date),
                description: selectedReceipt.description,
                category: selectedReceipt.category,
                paymentMethod: 'cash'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="vendor"
                    label="供應商"
                    rules={[{ required: true, message: '請輸入供應商' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="amount"
                    label="金額"
                    rules={[{ required: true, message: '請輸入金額' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
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
                    name="date"
                    label="日期"
                    rules={[{ required: true, message: '請選擇日期' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="類別"
                    rules={[{ required: true, message: '請選擇類別' }]}
                  >
                    <Select>
                      <Option value="餐飲">餐飲</Option>
                      <Option value="交通">交通</Option>
                      <Option value="辦公">辦公用品</Option>
                      <Option value="水電">水電費</Option>
                      <Option value="行銷">行銷費用</Option>
                      <Option value="其他">其他</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: true, message: '請輸入描述' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label="付款方式"
              >
                <Select>
                  <Option value="cash">現金</Option>
                  <Option value="credit_card">信用卡</Option>
                  <Option value="bank_transfer">銀行轉帳</Option>
                  <Option value="check">支票</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="notes"
                label="備註"
              >
                <TextArea rows={3} placeholder="可輸入 OCR 識別的原始文字或其他備註" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    保存為支出記錄
                  </Button>
                  <Button onClick={() => setEditModalVisible(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 批量掃描模態框 */}
      <Modal
        title="批量收據掃描"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBatchModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="scan" 
            type="primary" 
            onClick={handleBatchScan}
            loading={loading}
            disabled={batchFiles.length === 0}
          >
            開始批量掃描
          </Button>
        ]}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Dragger
            multiple
            accept="image/*"
            beforeUpload={(file, fileList) => {
              setBatchFiles(fileList)
              return false
            }}
            fileList={batchFiles}
            onRemove={(file) => {
              setBatchFiles(prev => prev.filter(f => f.uid !== file.uid))
            }}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">點擊或拖拽多個收據圖片到此區域</p>
            <p className="ant-upload-hint">
              支援多個文件同時上傳，系統會自動批量處理
            </p>
          </Dragger>
        </div>

        {batchFiles.length > 0 && (
          <Alert
            message={`已選擇 ${batchFiles.length} 個文件`}
            description="點擊「開始批量掃描」開始處理所有收據"
            type="info"
            showIcon
          />
        )}
      </Modal>

      {/* 智能模板模態框 */}
      <Modal
        title="智能收據模板"
        open={templatesModalVisible}
        onCancel={() => setTemplatesModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTemplatesModalVisible(false)}>
            關閉
          </Button>
        ]}
        width={800}
      >
        {templates.length > 0 ? (
          <List
            dataSource={templates}
            renderItem={(template) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                  title={
                    <Space>
                      <Text strong>{template.vendor}</Text>
                      <Tag color="blue">{template.suggestedCategory}</Tag>
                      <Tag color="green">使用 {template.frequency} 次</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>價格範圍：</Text>
                        ${template.priceRange.min} - ${template.priceRange.max} 
                        （平均 ${template.priceRange.avg}）
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>信心度：</Text>
                        <Progress 
                          percent={Math.round(template.confidence * 100)} 
                          size="small" 
                          style={{ width: 150, marginLeft: 8 }}
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        基於您的歷史記錄自動生成
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <BulbOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <div style={{ color: '#999' }}>
              暫無智能模板
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>
              系統會根據您的使用記錄自動生成常用模板
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReceiptScanner