import React from 'react'

const Test = () => {
  return (
    <div style={{
      padding: '50px',
      textAlign: 'center',
      backgroundColor: '#f0f2f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1890ff', fontSize: '32px' }}>
        測試頁面
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        如果你看到這個頁面，說明前端正在正常運行！
      </p>
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p>當前時間: {new Date().toLocaleString()}</p>
        <p>React 正在正常運行</p>
      </div>
    </div>
  )
}

export default Test