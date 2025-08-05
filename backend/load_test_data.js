import { getDatabaseConnection } from './src/utils/database.js'
import { readFileSync } from 'fs'

console.log('📊 開始載入測試資料...')

try {
  const db = getDatabaseConnection()
  
  // 讀取 SQL 文件
  const sql = readFileSync('./generate_test_data.sql', 'utf8')
  
  // 執行 SQL
  db.exec(sql)
  
  console.log('✅ 測試資料已成功載入！')
  
  // 檢查載入的資料
  const income = db.prepare('SELECT COUNT(*) as count FROM income').get()
  const expense = db.prepare('SELECT COUNT(*) as count FROM expense').get()
  
  console.log('📈 載入的資料統計:')
  console.log(`  - 收入記錄: ${income.count} 筆`)
  console.log(`  - 支出記錄: ${expense.count} 筆`)
  
  // 顯示一些範例資料
  console.log('\n📋 收入範例:')
  const sampleIncome = db.prepare('SELECT * FROM income LIMIT 3').all()
  sampleIncome.forEach(inc => {
    console.log(`  - ${inc.date}: ${inc.customer} - ${inc.description} (NT$ ${inc.amount})`)
  })
  
  console.log('\n📋 支出範例:')
  const sampleExpense = db.prepare('SELECT * FROM expense LIMIT 3').all()
  sampleExpense.forEach(exp => {
    console.log(`  - ${exp.date}: ${exp.vendor} - ${exp.description} (NT$ ${exp.amount})`)
  })
  
  console.log('\n🎯 測試資料載入完成！')
  console.log('💡 現在您可以:')
  console.log('   1. 使用測試帳號登入系統')
  console.log('   2. 查看財務儀表板')
  console.log('   3. 瀏覽收入/支出記錄')
  console.log('   4. 測試各種財務功能')
  
} catch (error) {
  console.error('❌ 載入測試資料失敗:', error)
  process.exit(1)
}

process.exit(0) 