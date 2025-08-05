import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Alert,
  Button,
  Space,
  Progress,
  Timeline,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  Upload,
  message,
  Statistic,
  Typography,
  Divider,
  Spin,
  Tooltip,
  Badge
} from 'antd'
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ScheduleOutlined,
  FileProtectOutlined,
  SyncOutlined,
  DownloadOutlined,
  UploadOutlined,
  VerifiedOutlined
} from '@ant-design/icons'
import { assistantAPI, handleAPIError } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input
const { Dragger } = Upload

const BackupManagement = () => {
  const [loading, setLoading] = useState(false)
  const [backupStatus, setBackupStatus] = useState(null)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [verifyModalVisible, setVerifyModalVisible] = useState(false)
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [error, setError] = useState(null)
  const [backupResult, setBackupResult] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)

  // 獲取備份狀態
  const fetchBackupStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await assistantAPI.getBackupStatus()
      if (response.success) {
        setBackupStatus(response.data)
      }
    } catch (error) {
      console.error('獲取備份狀態失敗:', error)
      setError(handleAPIError(error, false))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackupStatus()
  }, [])

  // 創建備份
  const handleCreateBackup = async (values) => {
    try {
      setLoading(true)
      const response = await assistantAPI.createSmartBackup(values)
      if (response.success) {
        setBackupResult(response.data)
        setCreateModalVisible(false)
        createForm.resetFields()
        message.success('備份創建成功！')
        fetchBackupStatus() // 重新載入狀態
      }
    } catch (error) {
      console.error('創建備份失敗:', error)
      message.error('創建備份失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  // 驗證備份
  const handleVerifyBackup = async () => {
    if (!uploadedFile) {
      message.warning('請先選擇備份文件')
      return
    }

    try {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result)
          const response = await assistantAPI.verifyBackup({ backupData })
          if (response.success) {
            setVerificationResult(response.data)
            message.success('備份驗證完成')
          }
        } catch (parseError) {
          message.error('備份文件格式錯誤，請檢查文件')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsText(uploadedFile)
    } catch (error) {
      console.error('驗證備份失敗:', error)
      message.error('驗證備份失敗，請重試')
      setLoading(false)
    }
  }

  // 下載備份文件
  const handleDownloadBackup = (backup) => {
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = backup.filename || 'backup.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success('備份文件已下載')
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

  // 獲取備份狀態顏色
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#52c41a'
      case 'warning': return '#faad14'
      case 'critical': return '#ff4d4f'
      default: return '#d9d9d9'
    }
  }

  if (loading && !backupStatus) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>載入備份管理中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="載入備份管理失敗"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchBackupStatus}>
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
          <SafetyCertificateOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          智能備份管理
        </Title>
        <Paragraph style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          保護您的財務數據安全，提供智能備份建議和完整性驗證
        </Paragraph>
      </div>

      {/* 備份狀態概覽 */}
      {backupStatus && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="數據記錄總數"
                value={backupStatus.totalRecords}
                prefix={<FileProtectOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="最後活動"
                value={backupStatus.daysSinceActivity}
                suffix="天前"
                prefix={<HistoryOutlined />}
                valueStyle={{ 
                  color: backupStatus.daysSinceActivity > 7 ? '#ff4d4f' : '#52c41a' 
                }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="收入記錄"
                value={backupStatus.dataStats.income_count}
                prefix={<CloudUploadOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="支出記錄"
                value={backupStatus.dataStats.expense_count}
                prefix={<CloudDownloadOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 備份建議 */}
      {backupStatus?.recommendation && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Alert
              message="💡 智能備份建議"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={getPriorityColor(backupStatus.recommendation.priority)}>
                      {backupStatus.recommendation.priority === 'high' ? '高優先級' :
                       backupStatus.recommendation.priority === 'medium' ? '中優先級' : '低優先級'}
                    </Tag>
                    {backupStatus.recommendation.message}
                  </div>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<CloudUploadOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                    >
                      立即備份
                    </Button>
                    <Button 
                      icon={<ScheduleOutlined />}
                      onClick={() => setScheduleModalVisible(true)}
                    >
                      設定備份計劃
                    </Button>
                  </Space>
                </div>
              }
              type={backupStatus.recommendation.priority === 'high' ? 'warning' : 'info'}
              showIcon
            />
          </Col>
        </Row>
      )}

      {/* 備份操作 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CloudUploadOutlined style={{ color: '#52c41a' }} />
                創建備份
              </Space>
            }
            actions={[
              <Button 
                key="create" 
                type="primary" 
                icon={<CloudUploadOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                創建新備份
              </Button>
            ]}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CloudUploadOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                智能備份系統
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                自動分析您的數據，提供完整備份或增量備份建議
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <VerifiedOutlined style={{ color: '#1890ff' }} />
                驗證備份
              </Space>
            }
            actions={[
              <Button 
                key="verify" 
                type="primary" 
                icon={<VerifiedOutlined />}
                onClick={() => setVerifyModalVisible(true)}
              >
                驗證備份文件
              </Button>
            ]}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <VerifiedOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                備份完整性檢查
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                驗證備份文件的完整性和可恢復性
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 備份計劃建議 */}
      {backupStatus?.backupSchedule && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="📅 建議備份計劃">
              <Timeline>
                {backupStatus.backupSchedule.map((schedule, index) => (
                  <Timeline.Item
                    key={index}
                    color={getPriorityColor(schedule.priority)}
                    dot={
                      <Badge 
                        count={schedule.priority === 'high' ? '!' : schedule.priority === 'medium' ? '•' : ''}
                        style={{ backgroundColor: getPriorityColor(schedule.priority) }}
                      >
                        <ScheduleOutlined style={{ fontSize: '16px' }} />
                      </Badge>
                    }
                  >
                    <div>
                      <Text strong>{schedule.description}</Text>
                      <Tag color={getPriorityColor(schedule.priority)} style={{ marginLeft: 8 }}>
                        {schedule.priority === 'high' ? '高優先級' :
                         schedule.priority === 'medium' ? '中優先級' : '低優先級'}
                      </Tag>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: 4 }}>
                        {schedule.reason}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Col>
        </Row>
      )}

      {/* 最近備份結果 */}
      {backupResult && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Alert
              message="✅ 備份創建成功"
              description={
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>文件名：</strong>{backupResult.filename}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>備份內容：</strong>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {backupResult.backup.metadata.totalRecords} 條記錄
                    </Tag>
                    <Tag color="green" style={{ marginLeft: 4 }}>
                      {Math.round(backupResult.backup.metadata.fileSize / 1024)} KB
                    </Tag>
                  </div>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadBackup(backupResult.backup)}
                    >
                      下載備份文件
                    </Button>
                    <Button onClick={() => setBackupResult(null)}>
                      關閉
                    </Button>
                  </Space>
                </div>
              }
              type="success"
              showIcon
              closable
              onClose={() => setBackupResult(null)}
            />
          </Col>
        </Row>
      )}

      {/* 驗證結果 */}
      {verificationResult && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Alert
              message={`${verificationResult.isValid ? '✅' : '❌'} 備份驗證${verificationResult.isValid ? '通過' : '失敗'}`}
              description={
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>完整性評分：</strong>
                    <Progress 
                      percent={verificationResult.dataIntegrity} 
                      size="small" 
                      style={{ width: 200, marginLeft: 8 }}
                      strokeColor={verificationResult.dataIntegrity >= 90 ? '#52c41a' : 
                                 verificationResult.dataIntegrity >= 70 ? '#faad14' : '#ff4d4f'}
                    />
                  </div>
                  {verificationResult.issues.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <strong>發現問題：</strong>
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        {verificationResult.issues.map((issue, index) => (
                          <li key={index} style={{ color: '#ff4d4f' }}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div style={{ marginBottom: 12 }}>
                    <strong>建議：</strong>
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      {verificationResult.recommendations.map((rec, index) => (
                        <li key={index} style={{ color: '#1890ff' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                  <Button onClick={() => setVerificationResult(null)}>
                    關閉
                  </Button>
                </div>
              }
              type={verificationResult.isValid ? 'success' : 'error'}
              showIcon
              closable
              onClose={() => setVerificationResult(null)}
            />
          </Col>
        </Row>
      )}

      {/* 創建備份模態框 */}
      <Modal
        title="創建智能備份"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateBackup}
          initialValues={{
            backupType: 'full'
          }}
        >
          <Form.Item
            name="backupType"
            label="備份類型"
            rules={[{ required: true, message: '請選擇備份類型' }]}
          >
            <Select placeholder="請選擇備份類型">
              <Option value="full">完整備份 - 備份所有數據</Option>
              <Option value="incremental">增量備份 - 僅備份最近30天數據</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="備份描述"
          >
            <TextArea 
              rows={3} 
              placeholder="輸入備份描述（可選）"
              maxLength={200}
            />
          </Form.Item>

          <Alert
            message="備份提醒"
            description="建議將備份文件保存在安全的位置，如雲端儲存或外部儲存設備。定期驗證備份文件的完整性。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                創建備份
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 驗證備份模態框 */}
      <Modal
        title="驗證備份文件"
        open={verifyModalVisible}
        onCancel={() => {
          setVerifyModalVisible(false)
          setUploadedFile(null)
          setVerificationResult(null)
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Dragger
            accept=".json"
            beforeUpload={(file) => {
              setUploadedFile(file)
              return false // 阻止自動上傳
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">點擊或拖拽備份文件到此區域</p>
            <p className="ant-upload-hint">
              支援 .json 格式的備份文件
            </p>
          </Dragger>
        </div>

        {uploadedFile && (
          <Alert
            message="文件已選擇"
            description={`文件名：${uploadedFile.name} (${Math.round(uploadedFile.size / 1024)} KB)`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Space>
          <Button 
            type="primary" 
            icon={<VerifiedOutlined />}
            onClick={handleVerifyBackup}
            loading={loading}
            disabled={!uploadedFile}
          >
            開始驗證
          </Button>
          <Button onClick={() => {
            setVerifyModalVisible(false)
            setUploadedFile(null)
            setVerificationResult(null)
          }}>
            取消
          </Button>
        </Space>
      </Modal>

      {/* 備份計劃模態框 */}
      <Modal
        title="設定備份計劃"
        open={scheduleModalVisible}
        onCancel={() => setScheduleModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setScheduleModalVisible(false)}>
            關閉
          </Button>
        ]}
        width={600}
      >
        <Alert
          message="自動備份計劃（開發中）"
          description={
            <div>
              <p>未來版本將提供以下自動備份功能：</p>
              <ul>
                <li>🕐 定時自動備份</li>
                <li>☁️ 雲端同步備份</li>
                <li>📧 備份完成通知</li>
                <li>🔄 增量備份優化</li>
                <li>📊 備份狀態監控</li>
              </ul>
              <p>目前請使用手動備份功能來保護您的數據。</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Modal>
    </div>
  )
}

export default BackupManagement