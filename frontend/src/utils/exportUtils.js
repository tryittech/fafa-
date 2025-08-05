import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

// 匯出為PDF
export const exportToPDF = async (elementId, filename = 'report.pdf') => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('找不到要匯出的元素')
    }

    // 使用html2canvas截圖
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 30

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
    pdf.save(filename)
    
    return true
  } catch (error) {
    console.error('PDF匯出失敗:', error)
    throw error
  }
}

// 匯出為Excel
export const exportToExcel = (data, filename = 'data.xlsx', sheetName = 'Sheet1') => {
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // 自動調整欄寬
    const colWidths = []
    const range = XLSX.utils.decode_range(ws['!ref'])
    
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R })
        const cell = ws[cellAddress]
        if (cell && cell.v) {
          const cellLength = cell.v.toString().length
          maxWidth = Math.max(maxWidth, cellLength)
        }
      }
      colWidths[C] = { wch: Math.min(maxWidth, 50) }
    }
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, filename)
    return true
  } catch (error) {
    console.error('Excel匯出失敗:', error)
    throw error
  }
}

// 匯出為CSV
export const exportToCSV = (data, filename = 'data.csv') => {
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, filename)
    return true
  } catch (error) {
    console.error('CSV匯出失敗:', error)
    throw error
  }
}

// 格式化財務報表數據為可匯出格式
export const formatFinancialDataForExport = (data, reportType) => {
  switch (reportType) {
    case '損益表':
      return data.map(item => ({
        '項目': item.item,
        '金額': item.amount,
        '類型': item.type || '一般'
      }))
    
    case '資產負債表':
      return data.map(item => ({
        '項目': item.item,
        '金額': item.amount,
        '分類': item.category || ''
      }))
    
    case '現金流量表':
      return data.map(item => ({
        '項目': item.item,
        '金額': item.amount,
        '活動類別': item.activity || ''
      }))
    
    default:
      return data
  }
}

// 格式化預算數據為可匯出格式
export const formatBudgetDataForExport = (budgets) => {
  return budgets.map(budget => ({
    '預算名稱': budget.name,
    '預算分類': budget.category_name,
    '預算類型': budget.budget_type === 'monthly' ? '月度預算' : '年度預算',
    '預算期間': budget.period,
    '預算金額': budget.amount,
    '實際金額': budget.actual_amount || 0,
    '使用率(%)': (budget.usage_percentage || 0).toFixed(2),
    '狀態': budget.status === 'normal' ? '正常' : 
           budget.status === 'warning' ? '警告' : '超支',
    '說明': budget.description || ''
  }))
}

// 格式化收入數據為可匯出格式
export const formatIncomeDataForExport = (incomes) => {
  return incomes.map(income => ({
    '收入編號': income.id,
    '日期': income.date,
    '客戶': income.customer,
    '描述': income.description,
    '金額': income.amount,
    '稅率(%)': income.taxRate,
    '稅額': income.taxAmount,
    '總金額': income.totalAmount,
    '狀態': income.status === 'received' ? '已收款' : 
           income.status === 'pending' ? '待收款' : '逾期',
    '付款方式': income.paymentMethod,
    '到期日': income.dueDate,
    '備註': income.notes || ''
  }))
}

// 格式化支出數據為可匯出格式
export const formatExpenseDataForExport = (expenses) => {
  return expenses.map(expense => ({
    '支出編號': expense.id,
    '日期': expense.date,
    '供應商': expense.vendor,
    '描述': expense.description,
    '分類': expense.category,
    '金額': expense.amount,
    '稅率(%)': expense.taxRate,
    '稅額': expense.taxAmount,
    '總金額': expense.totalAmount,
    '狀態': expense.status === 'paid' ? '已支付' : 
           expense.status === 'pending' ? '待支付' : '逾期',
    '付款方式': expense.paymentMethod,
    '備註': expense.notes || ''
  }))
}

// 生成匯出檔名
export const generateFileName = (prefix, extension = 'xlsx') => {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-')
  return `${prefix}_${dateStr}_${timeStr}.${extension}`
}