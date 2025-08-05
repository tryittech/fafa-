import { db, run, get } from './src/utils/database.js'

// 測試數據
const testData = {
  income: [
    {
      income_id: 'INC001',
      date: '2024-08-01',
      customer: '客戶A',
      description: '網站開發服務',
      amount: 50000,
      tax_rate: 5,
      tax_amount: 2500,
      total_amount: 52500,
      status: 'received',
      payment_method: 'bank_transfer',
      notes: '第一期款項'
    },
    {
      income_id: 'INC002',
      date: '2024-08-05',
      customer: '客戶B',
      description: '系統維護服務',
      amount: 30000,
      tax_rate: 5,
      tax_amount: 1500,
      total_amount: 31500,
      status: 'received',
      payment_method: 'bank_transfer',
      notes: '月費'
    },
    {
      income_id: 'INC003',
      date: '2024-08-10',
      customer: '客戶C',
      description: '諮詢服務',
      amount: 25000,
      tax_rate: 5,
      tax_amount: 1250,
      total_amount: 26250,
      status: 'pending',
      payment_method: 'bank_transfer',
      notes: '技術諮詢'
    }
  ],
  expense: [
    {
      expense_id: 'EXP001',
      date: '2024-08-02',
      vendor: '供應商A',
      description: '辦公用品',
      category: '辦公用品',
      amount: 5000,
      tax_rate: 5,
      tax_amount: 250,
      total_amount: 5250,
      status: 'paid',
      payment_method: 'bank_transfer',
      notes: '文具用品'
    },
    {
      expense_id: 'EXP002',
      date: '2024-08-08',
      vendor: '供應商B',
      description: '網路服務費',
      category: '水電費',
      amount: 3000,
      tax_rate: 5,
      tax_amount: 150,
      total_amount: 3150,
      status: 'paid',
      payment_method: 'bank_transfer',
      notes: '網路月費'
    },
    {
      expense_id: 'EXP003',
      date: '2024-08-15',
      vendor: '供應商C',
      description: '設備租賃',
      category: '租金費用',
      amount: 15000,
      tax_rate: 5,
      tax_amount: 750,
      total_amount: 15750,
      status: 'pending',
      payment_method: 'bank_transfer',
      notes: '伺服器租賃'
    }
  ]
}

// 插入測試數據
const seedTestData = async () => {
  try {
    console.log('開始插入測試數據...')

    // 插入收入數據
    for (const income of testData.income) {
      await run(`
        INSERT OR REPLACE INTO income (
          income_id, date, customer, description, amount, 
          tax_rate, tax_amount, total_amount, status, 
          payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        income.income_id, income.date, income.customer, income.description, income.amount,
        income.tax_rate, income.tax_amount, income.total_amount, income.status,
        income.payment_method, income.notes
      ])
    }

    // 插入支出數據
    for (const expense of testData.expense) {
      await run(`
        INSERT OR REPLACE INTO expense (
          expense_id, date, vendor, description, category, amount,
          tax_rate, tax_amount, total_amount, status,
          payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        expense.expense_id, expense.date, expense.vendor, expense.description, expense.category, expense.amount,
        expense.tax_rate, expense.tax_amount, expense.total_amount, expense.status,
        expense.payment_method, expense.notes
      ])
    }

    console.log('✅ 測試數據插入完成')
  } catch (error) {
    console.error('插入測試數據失敗:', error)
  }
}

// 執行腳本
seedTestData().then(() => {
  console.log('測試數據腳本執行完成')
  process.exit(0)
}).catch(error => {
  console.error('腳本執行失敗:', error)
  process.exit(1)
}) 