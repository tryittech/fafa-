import React from 'react'
import { Card, Statistic } from 'antd'

const StatCard = ({ 
  title, 
  value, 
  prefix, 
  suffix = '元', 
  icon,
  gradient,
  className = '',
  valueStyle = {},
  titleStyle = {},
  ...props 
}) => {
  const defaultGradients = {
    income: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    expense: 'linear-gradient(135deg, #f5222d 0%, #cf1322 100%)',
    balance: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
    info: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    success: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    warning: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
    danger: 'linear-gradient(135deg, #f5222d 0%, #cf1322 100%)',
    purple: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
  }

  const cardStyle = {
    background: gradient || defaultGradients.info,
    border: 'none',
    borderRadius: '12px',
    boxShadow: `0 4px 12px ${gradient ? 'rgba(0,0,0,0.15)' : 'rgba(24, 144, 255, 0.3)'}`,
    ...props.style
  }

  const defaultTitleStyle = {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    ...titleStyle
  }

  const defaultValueStyle = {
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    ...valueStyle
  }

  return (
    <Card 
      className={`stat-card ${className}`}
      style={cardStyle}
      {...props}
    >
      <Statistic
        title={
          <span style={defaultTitleStyle}>
            {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
            {title}
          </span>
        }
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={defaultValueStyle}
      />
    </Card>
  )
}

export default StatCard