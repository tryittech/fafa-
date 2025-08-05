import React, { useState } from 'react'
import { 
  Card, 
  Tabs, 
  Table, 
  Row, 
  Col, 
  Statistic, 
  DatePicker, 
  Button, 
  Space,
  Select,
  Divider,
  Alert,
  Progress,
  Typography,
  Collapse,
  Tooltip as AntTooltip
} from 'antd'
import { DownloadOutlined, PrinterOutlined, BarChartOutlined, HeartOutlined, TrophyOutlined, WarningOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text } = Typography
const { Panel } = Collapse

const FinancialReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01')
  const [reportType, setReportType] = useState('income_statement')

  // 模擬財務數據
  const [financialData] = useState({
    // 損益表數據
    incomeStatement: {
      revenue: 950000,
      costOfGoods: 320000,
      grossProfit: 630000,
      operatingExpenses: {
        salary: 480000,
        rent: 180000,
        utilities: 24000,
        marketing: 60000,
        office: 12000,
        other: 18000,
      },
      operatingIncome: 246000,
      otherIncome: 15000,
      otherExpenses: 8000,
      netIncome: 253000,
    },
    
    // 資產負債表數據
    balanceSheet: {
      assets: {
        current: {
          cash: 125000,
          accountsReceivable: 45000,
          inventory: 80000,
          prepaidExpenses: 12000,
        },
        fixed: {
          equipment: 150000,
          furniture: 80000,
          accumulatedDepreciation: -45000,
        },
      },
      liabilities: {
        current: {
          accountsPayable: 28000,
          shortTermLoan: 100000,
          accruedExpenses: 15000,
        },
        longTerm: {
          longTermLoan: 200000,
        },
      },
      equity: {
        capital: 500000,
        retainedEarnings: 253000,
      },
    },
    
    // 現金流量表數據
    cashFlow: {
      operating: {
        netIncome: 253000,
        depreciation: 45000,
        changeInReceivables: -15000,
        changeInPayables: 8000,
        changeInInventory: -20000,
        netOperatingCash: 271000,
      },
      investing: {
        equipmentPurchase: -50000,
        furniturePurchase: -20000,
        netInvestingCash: -70000,
      },
      financing: {
        loanProceeds: 300000,
        loanRepayment: -50000,
        ownerWithdrawal: -100000,
        netFinancingCash: 150000,
      },
    },
  })

  // 損益表列定義
  const incomeStatementColumns = [
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
      render: (amount, record) => (
        <span style={{ 
          fontWeight: record.type === 'total' ? 'bold' : 'normal',
          color: record.type === 'total' ? '#1890ff' : 'inherit'
        }}>
          ${amount.toLocaleString()}
        </span>
      ),
    },
  ]

  // 資產負債表列定義
  const balanceSheetColumns = [
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
      render: (amount, record) => (
        <span style={{ 
          fontWeight: record.type === 'total' ? 'bold' : 'normal',
          color: record.type === 'total' ? '#1890ff' : 'inherit'
        }}>
          ${amount.toLocaleString()}
        </span>
      ),
    },
  ]

  // 現金流量表列定義
  const cashFlowColumns = [
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
      render: (amount, record) => (
        <span style={{ 
          fontWeight: record.type === 'total' ? 'bold' : 'normal',
          color: amount < 0 ? '#f5222d' : record.type === 'total' ? '#1890ff' : 'inherit'
        }}>
          ${amount.toLocaleString()}
        </span>
      ),
    },
  ]

  // 損益表數據
  const incomeStatementData = [
    { key: '1', item: '營業收入', amount: financialData.incomeStatement.revenue, type: 'normal' },
    { key: '2', item: '營業成本', amount: -financialData.incomeStatement.costOfGoods, type: 'normal' },
    { key: '3', item: '毛利', amount: financialData.incomeStatement.grossProfit, type: 'subtotal' },
    { key: '4', item: '營業費用', amount: 0, type: 'header' },
    { key: '5', item: '  薪資費用', amount: -financialData.incomeStatement.operatingExpenses.salary, type: 'normal' },
    { key: '6', item: '  租金費用', amount: -financialData.incomeStatement.operatingExpenses.rent, type: 'normal' },
    { key: '7', item: '  水電費', amount: -financialData.incomeStatement.operatingExpenses.utilities, type: 'normal' },
    { key: '8', item: '  行銷費用', amount: -financialData.incomeStatement.operatingExpenses.marketing, type: 'normal' },
    { key: '9', item: '  辦公用品', amount: -financialData.incomeStatement.operatingExpenses.office, type: 'normal' },
    { key: '10', item: '  其他費用', amount: -financialData.incomeStatement.operatingExpenses.other, type: 'normal' },
    { key: '11', item: '營業利益', amount: financialData.incomeStatement.operatingIncome, type: 'subtotal' },
    { key: '12', item: '其他收入', amount: financialData.incomeStatement.otherIncome, type: 'normal' },
    { key: '13', item: '其他費用', amount: -financialData.incomeStatement.otherExpenses, type: 'normal' },
    { key: '14', item: '淨利', amount: financialData.incomeStatement.netIncome, type: 'total' },
  ]

  // 資產負債表數據
  const balanceSheetData = [
    { key: '1', item: '資產', amount: 0, type: 'header' },
    { key: '2', item: '流動資產', amount: 0, type: 'subheader' },
    { key: '3', item: '  現金', amount: financialData.balanceSheet.assets.current.cash, type: 'normal' },
    { key: '4', item: '  應收帳款', amount: financialData.balanceSheet.assets.current.accountsReceivable, type: 'normal' },
    { key: '5', item: '  存貨', amount: financialData.balanceSheet.assets.current.inventory, type: 'normal' },
    { key: '6', item: '  預付費用', amount: financialData.balanceSheet.assets.current.prepaidExpenses, type: 'normal' },
    { key: '7', item: '流動資產合計', amount: 
      financialData.balanceSheet.assets.current.cash + 
      financialData.balanceSheet.assets.current.accountsReceivable + 
      financialData.balanceSheet.assets.current.inventory + 
      financialData.balanceSheet.assets.current.prepaidExpenses, 
      type: 'subtotal' 
    },
    { key: '8', item: '固定資產', amount: 0, type: 'subheader' },
    { key: '9', item: '  設備', amount: financialData.balanceSheet.assets.fixed.equipment, type: 'normal' },
    { key: '10', item: '  家具', amount: financialData.balanceSheet.assets.fixed.furniture, type: 'normal' },
    { key: '11', item: '  累計折舊', amount: financialData.balanceSheet.assets.fixed.accumulatedDepreciation, type: 'normal' },
    { key: '12', item: '固定資產合計', amount: 
      financialData.balanceSheet.assets.fixed.equipment + 
      financialData.balanceSheet.assets.fixed.furniture + 
      financialData.balanceSheet.assets.fixed.accumulatedDepreciation, 
      type: 'subtotal' 
    },
    { key: '13', item: '資產總計', amount: 
      (financialData.balanceSheet.assets.current.cash + 
      financialData.balanceSheet.assets.current.accountsReceivable + 
      financialData.balanceSheet.assets.current.inventory + 
      financialData.balanceSheet.assets.current.prepaidExpenses) +
      (financialData.balanceSheet.assets.fixed.equipment + 
      financialData.balanceSheet.assets.fixed.furniture + 
      financialData.balanceSheet.assets.fixed.accumulatedDepreciation), 
      type: 'total' 
    },
    { key: '14', item: '', amount: 0, type: 'spacer' },
    { key: '15', item: '負債及股東權益', amount: 0, type: 'header' },
    { key: '16', item: '流動負債', amount: 0, type: 'subheader' },
    { key: '17', item: '  應付帳款', amount: financialData.balanceSheet.liabilities.current.accountsPayable, type: 'normal' },
    { key: '18', item: '  短期借款', amount: financialData.balanceSheet.liabilities.current.shortTermLoan, type: 'normal' },
    { key: '19', item: '  應計費用', amount: financialData.balanceSheet.liabilities.current.accruedExpenses, type: 'normal' },
    { key: '20', item: '流動負債合計', amount: 
      financialData.balanceSheet.liabilities.current.accountsPayable + 
      financialData.balanceSheet.liabilities.current.shortTermLoan + 
      financialData.balanceSheet.liabilities.current.accruedExpenses, 
      type: 'subtotal' 
    },
    { key: '21', item: '長期負債', amount: 0, type: 'subheader' },
    { key: '22', item: '  長期借款', amount: financialData.balanceSheet.liabilities.longTerm.longTermLoan, type: 'normal' },
    { key: '23', item: '負債總計', amount: 
      (financialData.balanceSheet.liabilities.current.accountsPayable + 
      financialData.balanceSheet.liabilities.current.shortTermLoan + 
      financialData.balanceSheet.liabilities.current.accruedExpenses) +
      financialData.balanceSheet.liabilities.longTerm.longTermLoan, 
      type: 'subtotal' 
    },
    { key: '24', item: '股東權益', amount: 0, type: 'subheader' },
    { key: '25', item: '  股本', amount: financialData.balanceSheet.equity.capital, type: 'normal' },
    { key: '26', item: '  保留盈餘', amount: financialData.balanceSheet.equity.retainedEarnings, type: 'normal' },
    { key: '27', item: '股東權益總計', amount: 
      financialData.balanceSheet.equity.capital + 
      financialData.balanceSheet.equity.retainedEarnings, 
      type: 'subtotal' 
    },
    { key: '28', item: '負債及股東權益總計', amount: 
      ((financialData.balanceSheet.liabilities.current.accountsPayable + 
      financialData.balanceSheet.liabilities.current.shortTermLoan + 
      financialData.balanceSheet.liabilities.current.accruedExpenses) +
      financialData.balanceSheet.liabilities.longTerm.longTermLoan) +
      (financialData.balanceSheet.equity.capital + 
      financialData.balanceSheet.equity.retainedEarnings), 
      type: 'total' 
    },
  ]

  // 現金流量表數據
  const cashFlowData = [
    { key: '1', item: '營業活動現金流量', amount: 0, type: 'header' },
    { key: '2', item: '淨利', amount: financialData.cashFlow.operating.netIncome, type: 'normal' },
    { key: '3', item: '折舊費用', amount: financialData.cashFlow.operating.depreciation, type: 'normal' },
    { key: '4', item: '應收帳款變動', amount: financialData.cashFlow.operating.changeInReceivables, type: 'normal' },
    { key: '5', item: '應付帳款變動', amount: financialData.cashFlow.operating.changeInPayables, type: 'normal' },
    { key: '6', item: '存貨變動', amount: financialData.cashFlow.operating.changeInInventory, type: 'normal' },
    { key: '7', item: '營業活動淨現金流入', amount: financialData.cashFlow.operating.netOperatingCash, type: 'subtotal' },
    { key: '8', item: '', amount: 0, type: 'spacer' },
    { key: '9', item: '投資活動現金流量', amount: 0, type: 'header' },
    { key: '10', item: '設備購置', amount: financialData.cashFlow.investing.equipmentPurchase, type: 'normal' },
    { key: '11', item: '家具購置', amount: financialData.cashFlow.investing.furniturePurchase, type: 'normal' },
    { key: '12', item: '投資活動淨現金流出', amount: financialData.cashFlow.investing.netInvestingCash, type: 'subtotal' },
    { key: '13', item: '', amount: 0, type: 'spacer' },
    { key: '14', item: '融資活動現金流量', amount: 0, type: 'header' },
    { key: '15', item: '借款收入', amount: financialData.cashFlow.financing.loanProceeds, type: 'normal' },
    { key: '16', item: '借款償還', amount: financialData.cashFlow.financing.loanRepayment, type: 'normal' },
    { key: '17', item: '業主提款', amount: financialData.cashFlow.financing.ownerWithdrawal, type: 'normal' },
    { key: '18', item: '融資活動淨現金流入', amount: financialData.cashFlow.financing.netFinancingCash, type: 'subtotal' },
    { key: '19', item: '', amount: 0, type: 'spacer' },
    { key: '20', item: '現金淨變動', amount: 
      financialData.cashFlow.operating.netOperatingCash + 
      financialData.cashFlow.investing.netInvestingCash + 
      financialData.cashFlow.financing.netFinancingCash, 
      type: 'total' 
    },
  ]

  // 圖表數據
  const pieChartData = [
    { name: '薪資', value: financialData.incomeStatement.operatingExpenses.salary, color: '#ff6b6b' },
    { name: '租金', value: financialData.incomeStatement.operatingExpenses.rent, color: '#4ecdc4' },
    { name: '水電費', value: financialData.incomeStatement.operatingExpenses.utilities, color: '#45b7d1' },
    { name: '行銷', value: financialData.incomeStatement.operatingExpenses.marketing, color: '#96ceb4' },
    { name: '辦公用品', value: financialData.incomeStatement.operatingExpenses.office, color: '#ffeaa7' },
    { name: '其他', value: financialData.incomeStatement.operatingExpenses.other, color: '#dda0dd' },
  ]

  const barChartData = [
    { month: '1月', revenue: 150000, expenses: 120000, profit: 30000 },
    { month: '2月', revenue: 180000, expenses: 95000, profit: 85000 },
    { month: '3月', revenue: 200000, expenses: 110000, profit: 90000 },
    { month: '4月', revenue: 160000, expenses: 130000, profit: 30000 },
    { month: '5月', revenue: 220000, expenses: 140000, profit: 80000 },
    { month: '6月', revenue: 190000, expenses: 125000, profit: 65000 },
  ]

  const handleExport = async (type, format = 'pdf') => {
    try {
      const { exportToPDF, exportToExcel, formatFinancialDataForExport, generateFileName } = await import('../utils/exportUtils')
      
      if (format === 'pdf') {
        const elementId = `${type}-container`
        const filename = generateFileName(`財務報表_${type}`, 'pdf')
        await exportToPDF(elementId, filename)
      } else if (format === 'excel') {
        let data = []
        if (type === '損益表') {
          data = formatFinancialDataForExport(incomeStatementData, '損益表')
        } else if (type === '資產負債表') {
          data = formatFinancialDataForExport(balanceSheetData, '資產負債表')
        } else if (type === '現金流量表') {
          data = formatFinancialDataForExport(cashFlowData, '現金流量表')
        }
        const filename = generateFileName(`財務報表_${type}`, 'xlsx')
        exportToExcel(data, filename, type)
      }
    } catch (error) {
      console.error('匯出失敗:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // 財務比率計算
  const calculateFinancialRatios = () => {
    const { incomeStatement, balanceSheet } = financialData
    
    // 流動資產與流動負債
    const currentAssets = balanceSheet.assets.current.cash + 
                         balanceSheet.assets.current.accountsReceivable + 
                         balanceSheet.assets.current.inventory + 
                         balanceSheet.assets.current.prepaidExpenses
    
    const currentLiabilities = balanceSheet.liabilities.current.accountsPayable + 
                              balanceSheet.liabilities.current.shortTermLoan + 
                              balanceSheet.liabilities.current.accruedExpenses
    
    const totalAssets = currentAssets + 
                       balanceSheet.assets.fixed.equipment + 
                       balanceSheet.assets.fixed.furniture + 
                       balanceSheet.assets.fixed.accumulatedDepreciation
    
    const totalLiabilities = currentLiabilities + balanceSheet.liabilities.longTerm.longTermLoan
    const totalEquity = balanceSheet.equity.capital + balanceSheet.equity.retainedEarnings
    
    // 計算各項比率
    return {
      // 流動性比率
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? (currentAssets - balanceSheet.assets.current.inventory) / currentLiabilities : 0,
      
      // 獲利能力比率
      grossProfitMargin: incomeStatement.revenue > 0 ? (incomeStatement.grossProfit / incomeStatement.revenue) * 100 : 0,
      netProfitMargin: incomeStatement.revenue > 0 ? (incomeStatement.netIncome / incomeStatement.revenue) * 100 : 0,
      roa: totalAssets > 0 ? (incomeStatement.netIncome / totalAssets) * 100 : 0,
      roe: totalEquity > 0 ? (incomeStatement.netIncome / totalEquity) * 100 : 0,
      
      // 財務結構比率
      debtToAssetRatio: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0,
      debtToEquityRatio: totalEquity > 0 ? (totalLiabilities / totalEquity) * 100 : 0,
      
      // 營運效率比率
      assetTurnover: totalAssets > 0 ? incomeStatement.revenue / totalAssets : 0,
      
      // 基本數據
      currentAssets,
      currentLiabilities,
      totalAssets,
      totalLiabilities,
      totalEquity
    }
  }

  const ratios = calculateFinancialRatios()

  // 財務健康評分
  const calculateHealthScore = () => {
    let score = 0
    let maxScore = 100
    
    // 流動比率評分 (25分)
    if (ratios.currentRatio >= 2) score += 25
    else if (ratios.currentRatio >= 1.5) score += 20
    else if (ratios.currentRatio >= 1) score += 15
    else if (ratios.currentRatio >= 0.8) score += 10
    else score += 5
    
    // 淨利率評分 (25分)
    if (ratios.netProfitMargin >= 15) score += 25
    else if (ratios.netProfitMargin >= 10) score += 20
    else if (ratios.netProfitMargin >= 5) score += 15
    else if (ratios.netProfitMargin >= 0) score += 10
    else score += 0
    
    // 負債比率評分 (25分)
    if (ratios.debtToAssetRatio <= 30) score += 25
    else if (ratios.debtToAssetRatio <= 50) score += 20
    else if (ratios.debtToAssetRatio <= 70) score += 15
    else if (ratios.debtToAssetRatio <= 85) score += 10
    else score += 5
    
    // 資產報酬率評分 (25分)
    if (ratios.roa >= 15) score += 25
    else if (ratios.roa >= 10) score += 20
    else if (ratios.roa >= 5) score += 15
    else if (ratios.roa >= 0) score += 10
    else score += 0
    
    return { score, maxScore }
  }

  const healthScore = calculateHealthScore()

  // 雷達圖數據
  const radarData = [
    { subject: '流動性', A: Math.min(ratios.currentRatio * 50, 100), fullMark: 100 },
    { subject: '獲利能力', A: Math.min(ratios.netProfitMargin * 4, 100), fullMark: 100 },
    { subject: '財務結構', A: Math.max(100 - ratios.debtToAssetRatio, 0), fullMark: 100 },
    { subject: '營運效率', A: Math.min(ratios.assetTurnover * 50, 100), fullMark: 100 },
    { subject: '資產報酬', A: Math.min(ratios.roa * 5, 100), fullMark: 100 },
  ]

  // 獲取財務建議
  const getFinancialRecommendations = () => {
    const recommendations = []
    
    if (ratios.currentRatio < 1) {
      recommendations.push({
        type: 'warning',
        title: '流動性不足警示',
        content: '流動比率低於1，表示短期償債能力不足。建議加強應收帳款催收，延後非必要支出，或考慮短期融資。',
        priority: 'high'
      })
    } else if (ratios.currentRatio > 3) {
      recommendations.push({
        type: 'info',
        title: '現金過多提醒',
        content: '流動比率過高，可能有過多閒置資金。建議考慮投資或擴展業務以提高資金運用效率。',
        priority: 'medium'
      })
    }
    
    if (ratios.netProfitMargin < 5) {
      recommendations.push({
        type: 'warning',
        title: '獲利能力待提升',
        content: '淨利率偏低，建議檢討成本結構、提升產品定價策略，或優化營運效率。',
        priority: 'high'
      })
    }
    
    if (ratios.debtToAssetRatio > 70) {
      recommendations.push({
        type: 'error',
        title: '債務比例過高',
        content: '負債比率超過70%，財務風險較高。建議優先償還部分債務，改善財務結構。',
        priority: 'high'
      })
    }
    
    if (ratios.roa > 15) {
      recommendations.push({
        type: 'success',
        title: '資產運用效率佳',
        content: '資產報酬率優異，表示資產運用效率良好。建議維持現有營運策略並考慮適度擴張。',
        priority: 'low'
      })
    }
    
    return recommendations
  }

  const items = [
    {
      key: 'income_statement',
      label: '損益表',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>報表期間：</span>
              <Select 
                value={selectedPeriod} 
                onChange={setSelectedPeriod}
                style={{ width: 120 }}
              >
                <Option value="2024-01">2024年1月</Option>
                <Option value="2024-02">2024年2月</Option>
                <Option value="2024-03">2024年3月</Option>
              </Select>
              <Button.Group>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport('損益表', 'pdf')}>
                  匯出PDF
                </Button>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport('損益表', 'excel')}>
                  匯出Excel
                </Button>
              </Button.Group>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                列印
              </Button>
            </Space>
          </div>
          
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="營業收入"
                  value={financialData.incomeStatement.revenue}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="營業成本"
                  value={financialData.incomeStatement.costOfGoods}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="淨利"
                  value={financialData.incomeStatement.netIncome}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Card title="損益表" className="chart-container">
                <div id="損益表-container">
                  <Table
                    columns={incomeStatementColumns}
                    dataSource={incomeStatementData}
                    pagination={false}
                    size="small"
                    rowClassName={(record) => {
                      if (record.type === 'header') return 'table-header'
                      if (record.type === 'subheader') return 'table-subheader'
                      if (record.type === 'subtotal') return 'table-subtotal'
                      if (record.type === 'total') return 'table-total'
                      if (record.type === 'spacer') return 'table-spacer'
                      return ''
                    }}
                  />
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="營業費用分析" className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '金額']} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'balance_sheet',
      label: '資產負債表',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>報表日期：</span>
              <DatePicker 
                value={dayjs(selectedPeriod + '-01')} 
                onChange={(date) => setSelectedPeriod(date.format('YYYY-MM'))}
                picker="month"
              />
              <Button.Group>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport('資產負債表', 'pdf')}>
                  匯出PDF
                </Button>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport('資產負債表', 'excel')}>
                  匯出Excel
                </Button>
              </Button.Group>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                列印
              </Button>
            </Space>
          </div>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="總資產"
                  value={balanceSheetData.find(item => item.key === '13').amount}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="總負債"
                  value={balanceSheetData.find(item => item.key === '23').amount}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="股東權益"
                  value={balanceSheetData.find(item => item.key === '27').amount}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="資產負債表" className="chart-container">
            <div id="資產負債表-container">
              <Table
                columns={balanceSheetColumns}
                dataSource={balanceSheetData}
                pagination={false}
                size="small"
                rowClassName={(record) => {
                  if (record.type === 'header') return 'table-header'
                  if (record.type === 'subheader') return 'table-subheader'
                  if (record.type === 'subtotal') return 'table-subtotal'
                  if (record.type === 'total') return 'table-total'
                  if (record.type === 'spacer') return 'table-spacer'
                  return ''
                }}
              />
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'cash_flow',
      label: '現金流量表',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>報表期間：</span>
              <RangePicker 
                value={[dayjs(selectedPeriod + '-01'), dayjs(selectedPeriod + '-31')]}
                picker="month"
              />
              <Button.Group>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport('現金流量表', 'pdf')}>
                  匯出PDF
                </Button>
                <Button icon={<DownloadOutlined />} onClick={() => handleExport('現金流量表', 'excel')}>
                  匯出Excel
                </Button>
              </Button.Group>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                列印
              </Button>
            </Space>
          </div>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="營業活動現金流入"
                  value={financialData.cashFlow.operating.netOperatingCash}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="投資活動現金流出"
                  value={Math.abs(financialData.cashFlow.investing.netInvestingCash)}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="現金淨變動"
                  value={cashFlowData.find(item => item.key === '20').amount}
                  prefix="$"
                  suffix="元"
                  valueStyle={{ 
                    color: cashFlowData.find(item => item.key === '20').amount >= 0 ? '#52c41a' : '#f5222d'
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Card title="現金流量表" className="chart-container">
                <div id="現金流量表-container">
                  <Table
                    columns={cashFlowColumns}
                    dataSource={cashFlowData}
                    pagination={false}
                    size="small"
                    rowClassName={(record) => {
                      if (record.type === 'header') return 'table-header'
                      if (record.type === 'subtotal') return 'table-subtotal'
                      if (record.type === 'total') return 'table-total'
                      if (record.type === 'spacer') return 'table-spacer'
                      return ''
                    }}
                  />
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="現金流量趨勢" className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '金額']} />
                    <Bar dataKey="revenue" fill="#52c41a" name="收入" />
                    <Bar dataKey="expenses" fill="#f5222d" name="支出" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'financial_health',
      label: '財務健康評估',
      children: (
        <div>
          {/* 健康評分總覽 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <Card style={{ textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <div style={{ padding: '20px 0' }}>
                  <HeartOutlined style={{ fontSize: '48px', marginBottom: 16 }} />
                  <Title level={2} style={{ color: 'white', margin: 0 }}>
                    財務健康分數
                  </Title>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', margin: '16px 0' }}>
                    {healthScore.score}/{healthScore.maxScore}
                  </div>
                  <Progress 
                    percent={healthScore.score} 
                    strokeColor="white" 
                    trailColor="rgba(255,255,255,0.3)"
                    showInfo={false}
                  />
                  <div style={{ marginTop: 12, fontSize: '14px' }}>
                    {healthScore.score >= 80 ? '財務狀況優良' : 
                     healthScore.score >= 60 ? '財務狀況良好' : 
                     healthScore.score >= 40 ? '財務狀況普通' : '需要改善'}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Card title="財務體質雷達圖" style={{ height: '100%' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="財務指標"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* 財務比率詳細分析 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="流動性分析" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={
                        <span>
                          流動比率
                          <AntTooltip title="流動資產 ÷ 流動負債。理想範圍：1.5-2.5">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                          </AntTooltip>
                        </span>
                      }
                      value={ratios.currentRatio.toFixed(2)}
                      suffix="倍"
                      valueStyle={{ 
                        color: ratios.currentRatio >= 1.5 ? '#52c41a' : 
                               ratios.currentRatio >= 1 ? '#faad14' : '#f5222d'
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={
                        <span>
                          速動比率
                          <AntTooltip title="(流動資產-存貨) ÷ 流動負債。理想範圍：1.0-1.5">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                          </AntTooltip>
                        </span>
                      }
                      value={ratios.quickRatio.toFixed(2)}
                      suffix="倍"
                      valueStyle={{ 
                        color: ratios.quickRatio >= 1 ? '#52c41a' : 
                               ratios.quickRatio >= 0.8 ? '#faad14' : '#f5222d'
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="獲利能力分析" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={
                        <span>
                          毛利率
                          <AntTooltip title="毛利 ÷ 營業收入 × 100%">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                          </AntTooltip>
                        </span>
                      }
                      value={ratios.grossProfitMargin.toFixed(1)}
                      suffix="%"
                      valueStyle={{ 
                        color: ratios.grossProfitMargin >= 30 ? '#52c41a' : 
                               ratios.grossProfitMargin >= 20 ? '#faad14' : '#f5222d'
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={
                        <span>
                          淨利率
                          <AntTooltip title="淨利 ÷ 營業收入 × 100%">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                          </AntTooltip>
                        </span>
                      }
                      value={ratios.netProfitMargin.toFixed(1)}
                      suffix="%"
                      valueStyle={{ 
                        color: ratios.netProfitMargin >= 10 ? '#52c41a' : 
                               ratios.netProfitMargin >= 5 ? '#faad14' : '#f5222d'
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="財務結構分析" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={
                        <span>
                          負債比率
                                                     <AntTooltip title="總負債 ÷ 總資產 × 100%。理想範圍：&lt;50%">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                          </AntTooltip>
                        </span>
                      }
                      value={ratios.debtToAssetRatio.toFixed(1)}
                      suffix="%"
                      valueStyle={{ 
                        color: ratios.debtToAssetRatio <= 50 ? '#52c41a' : 
                               ratios.debtToAssetRatio <= 70 ? '#faad14' : '#f5222d'
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={
                        <span>
                          資產報酬率
                          <AntTooltip title="淨利 ÷ 總資產 × 100%">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                          </AntTooltip>
                        </span>
                      }
                      value={ratios.roa.toFixed(1)}
                      suffix="%"
                      valueStyle={{ 
                        color: ratios.roa >= 10 ? '#52c41a' : 
                               ratios.roa >= 5 ? '#faad14' : '#f5222d'
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="營運效率分析" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={
                        <span>
                          資產週轉率
                          <AntTooltip title="營業收入 ÷ 總資產">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                          </AntTooltip>
                        </span>
                      }
                      value={ratios.assetTurnover.toFixed(2)}
                      suffix="倍"
                      valueStyle={{ 
                        color: ratios.assetTurnover >= 1.5 ? '#52c41a' : 
                               ratios.assetTurnover >= 1 ? '#faad14' : '#f5222d'
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={
                        <span>
                          股東權益報酬率
                          <AntTooltip title="淨利 ÷ 股東權益 × 100%">
                            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                          </AntTooltip>
                        </span>
                      }
                      value={ratios.roe.toFixed(1)}
                      suffix="%"
                      valueStyle={{ 
                        color: ratios.roe >= 15 ? '#52c41a' : 
                               ratios.roe >= 10 ? '#faad14' : '#f5222d'
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* 專業建議與改善方案 */}
          <Row gutter={16}>
            <Col span={24}>
              <Card title={<span><TrophyOutlined /> 專業改善建議</span>}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {getFinancialRecommendations().map((rec, index) => (
                    <Alert
                      key={index}
                      message={rec.title}
                      description={rec.content}
                      type={rec.type}
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                  ))}
                </Space>
                
                <Divider />
                
                <Collapse ghost>
                  <Panel header="📈 提升獲利能力策略" key="1">
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li><strong>成本控制：</strong>定期檢視各項費用，找出可優化的成本項目</li>
                      <li><strong>價格策略：</strong>分析市場競爭力，適時調整產品或服務定價</li>
                      <li><strong>產品組合：</strong>重點發展高毛利產品，淘汰低獲利項目</li>
                      <li><strong>營運效率：</strong>導入自動化或數位化工具，提升作業效率</li>
                    </ul>
                  </Panel>
                  <Panel header="💰 改善現金流管理" key="2">
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li><strong>應收帳款管理：</strong>建立有效的信用政策和催收機制</li>
                      <li><strong>存貨周轉：</strong>優化庫存管理，避免資金積壓</li>
                      <li><strong>付款條件：</strong>與供應商協商更有利的付款條件</li>
                      <li><strong>現金預測：</strong>建立現金流量預測模型，提前規劃資金需求</li>
                    </ul>
                  </Panel>
                  <Panel header="⚖️ 優化財務結構" key="3">
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li><strong>債務管理：</strong>評估債務成本，優先償還高利率債務</li>
                      <li><strong>融資規劃：</strong>平衡股權與債權融資，降低財務風險</li>
                      <li><strong>投資決策：</strong>評估投資報酬率，確保資金有效運用</li>
                      <li><strong>風險控制：</strong>建立財務風險預警機制</li>
                    </ul>
                  </Panel>
                </Collapse>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#262626' }}>財務報表</h1>
        <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
          查看您的財務狀況，包含損益表、資產負債表和現金流量表
        </p>
      </div>

      <Card>
        <Tabs 
          activeKey={reportType} 
          onChange={setReportType}
          items={items}
          type="card"
        />
      </Card>
    </div>
  )
}

export default FinancialReports 