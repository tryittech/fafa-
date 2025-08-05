import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, Space, Divider, Steps } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, BankOutlined, PhoneOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const { Title, Text } = Typography
const { Step } = Steps

const Register = () => {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const result = await register(values)
      if (result.success) {
        navigate('/')
      }
    } catch (error) {
      console.error('註冊失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(1)
    }).catch((errorInfo) => {
      console.log('驗證失敗:', errorInfo)
    })
  }

  const prevStep = () => {
    setCurrentStep(0)
  }

  const steps = [
    {
      title: '帳戶資訊',
      content: (
        <>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '請輸入電子郵件！' },
              { type: 'email', message: '請輸入有效的電子郵件格式！' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#1890ff' }} />}
              placeholder="電子郵件"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '請輸入密碼！' },
              { min: 6, message: '密碼至少需要6個字元！' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              placeholder="密碼"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '請確認密碼！' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('兩次輸入的密碼不一致！'))
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              placeholder="確認密碼"
            />
          </Form.Item>
        </>
      )
    },
    {
      title: '公司資訊',
      content: (
        <>
          <Form.Item
            name="name"
            rules={[{ required: true, message: '請輸入姓名！' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              placeholder="聯絡人姓名"
            />
          </Form.Item>

          <Form.Item
            name="companyName"
            rules={[{ required: true, message: '請輸入公司名稱！' }]}
          >
            <Input
              prefix={<BankOutlined style={{ color: '#1890ff' }} />}
              placeholder="公司名稱"
            />
          </Form.Item>

          <Form.Item
            name="phone"
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#1890ff' }} />}
              placeholder="聯絡電話 (可選)"
            />
          </Form.Item>
        </>
      )
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            財務阿姨系統
          </Title>
          <Text type="secondary">建立您的帳戶</Text>
        </div>

        <Steps current={currentStep} style={{ marginBottom: '30px' }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          {steps[currentStep].content}

          <Form.Item style={{ marginTop: '30px' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              {currentStep === 0 ? (
                <Link to="/login">
                  <Button>返回登入</Button>
                </Link>
              ) : (
                <Button onClick={prevStep}>
                  上一步
                </Button>
              )}

              {currentStep === 0 ? (
                <Button
                  type="primary"
                  onClick={nextStep}
                  style={{
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  完成註冊
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Text type="secondary">
            已有帳戶？{' '}
            <Link to="/login" style={{ color: '#1890ff' }}>
              立即登入
            </Link>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            © 2024 財務阿姨替代系統. 版權所有.
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default Register