import { getDatabaseConnection } from './src/utils/database.js'

console.log('🗑️ 開始清空測試數據...')

try {
  const db = getDatabaseConnection()
  
  // 清空所有財務相關表格的數據
  const tables = [
    'income',
    'expense', 
    'tax_data',
    'tax_calculations',
    'company_info'
  ]
  
  console.log('📋 即將清空以下表格:')
  tables.forEach(table => console.log(`  - ${table}`))
  
  // 開始清理
  for (const table of tables) {
    try {
      const countBefore = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get()
      
      db.prepare(`DELETE FROM ${table}`).run()
      
      // 重置自增 ID (SQLite)
      db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table)
      
      console.log(`✅ ${table}: 已清空 ${countBefore.count} 筆記錄`)
    } catch (error) {
      console.log(`⚠️ ${table}: ${error.message} (表格可能不存在，跳過)`)
    }
  }
  
  // 保留用戶資料和系統設定
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get()
  
  console.log('\n✅ 清理完成!')
  console.log('📊 保留的數據:')
  console.log(`  - users: ${usersCount.count} 筆用戶記錄`)
  console.log(`  - system_settings: ${settingsCount.count} 筆系統設定`)
  
  console.log('\n🎯 現在系統已準備好進行多用戶測試!')
  console.log('   - 所有用戶可以開始建立專屬的財務資料')
  console.log('   - 數據完全隔離，互不干擾')
  
} catch (error) {
  console.error('❌ 清理過程發生錯誤:', error)
  process.exit(1)
}

process.exit(0)