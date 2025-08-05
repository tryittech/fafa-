import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, Space, Divider, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const { Title, Text } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  
  console.log('Login 組件已載入')

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const result = await login(values.email, values.password)
      if (result.success) {
        navigate('/')
      }
    } catch (error) {
      console.error('登入失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async () => {
    form.setFieldsValue({
      email: 'test@example.com',
      password: '123456'
    })
    await onFinish({
      email: 'test@example.com',
      password: '123456'
    })
  }

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
          maxWidth: '400px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          borderRadius: '12px'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
            財務阿姨系統
          </Title>
          <Text type="secondary">登入您的帳戶</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
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
            rules={[{ required: true, message: '請輸入密碼！' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              placeholder="密碼"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: '45px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontSize: '16px'
              }}
            >
              登入
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            還沒有帳戶？{' '}
            <Link to="/register" style={{ color: '#1890ff' }}>
              立即註冊
            </Link>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', padding: '16px', background: '#f6f8fa', borderRadius: '8px' }}>
          <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            🎯 測試帳號
          </Text>
          <Text code style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            電子郵件: test@example.com
          </Text>
          <Text code style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
            密碼: 123456
          </Text>
          <Button 
            size="small" 
            type="dashed" 
            onClick={quickLogin}
            loading={loading}
            style={{ fontSize: '12px' }}
          >
            一鍵登入測試帳號
          </Button>
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

export default Login