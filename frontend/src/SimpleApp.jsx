import React from 'react'

function SimpleApp() {
  return (
    <div style={{
      padding: '50px',
      textAlign: 'center',
      backgroundColor: '#f0f2f5',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#1890ff', fontSize: '32px' }}>
        財務阿姨系統
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        系統正在啟動中...
      </p>
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '30px auto'
      }}>
        <p>✅ React 正在正常運行</p>
        <p>⏰ 當前時間: {new Date().toLocaleString()}</p>
        <p>🔧 如果您看到此頁面，前端服務器正常工作</p>
        <div style={{ marginTop: '20px' }}>
          <a href="/login" style={{ color: '#1890ff', textDecoration: 'none', fontSize: '16px' }}>
            → 前往登入頁面
          </a>
        </div>
      </div>
    </div>
  )
}

export default SimpleApp