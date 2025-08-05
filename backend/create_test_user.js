import { getDatabaseConnection } from './src/utils/database.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

console.log('👤 創建測試用戶...')

try {
  const db = getDatabaseConnection()
  
  // 檢查是否已存在測試用戶
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('test@example.com')
  
  if (existingUser) {
    console.log('⚠️ 測試用戶已存在:')
    console.log(`  - 電子郵件: ${existingUser.email}`)
    console.log(`  - 姓名: ${existingUser.name}`)
    console.log(`  - 公司: ${existingUser.company_name}`)
    process.exit(0)
  }
  
  // 創建測試用戶
  const userId = uuidv4()
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, name, company_name, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `)
  
  insertUser.run(
    userId,
    'test@example.com',
    hashedPassword,
    '測試用戶',
    '財務阿姨測試公司',
    '0912345678'
  )
  
  console.log('✅ 測試用戶創建成功！')
  console.log('📋 用戶資訊:')
  console.log(`  - 電子郵件: test@example.com`)
  console.log(`  - 密碼: 123456`)
  console.log(`  - 姓名: 測試用戶`)
  console.log(`  - 公司: 財務阿姨測試公司`)
  
  console.log('\n🎯 現在您可以:')
  console.log('   1. 使用測試帳號登入系統')
  console.log('   2. 查看已載入的財務資料')
  console.log('   3. 測試所有功能')
  
} catch (error) {
  console.error('❌ 創建測試用戶失敗:', error)
  process.exit(1)
}

process.exit(0) 