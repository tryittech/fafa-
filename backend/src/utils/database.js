import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 資料庫檔案路徑
const dbPath = path.join(__dirname, '../../database/fafa.db')

// 建立資料庫連接
let db = null

export const getDatabaseConnection = () => {
  if (!db) {
    try {
      db = new Database(dbPath)
      db.pragma('foreign_keys = ON')
      console.log('✅ 成功連接到 SQLite 資料庫')
    } catch (error) {
      console.error('資料庫連接失敗:', error.message)
      throw error
    }
  }
  return db
}

// 初始化資料庫
export const initDatabase = () => {
  try {
    const database = getDatabaseConnection()
    
    // 建立用戶表
    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `)
    console.log('✅ 用戶表建立完成')

    // 檢查並添加 user_id 欄位到現有表格
    try {
      database.exec('ALTER TABLE income ADD COLUMN user_id TEXT REFERENCES users(id)')
    } catch (error) {
      // 欄位已存在，忽略錯誤
    }

    try {
      database.exec('ALTER TABLE expense ADD COLUMN user_id TEXT REFERENCES users(id)')
    } catch (error) {
      // 欄位已存在，忽略錯誤
    }

    try {
      database.exec('ALTER TABLE company_info ADD COLUMN user_id TEXT REFERENCES users(id)')
    } catch (error) {
      // 欄位已存在，忽略錯誤
    }

    // 建立收入表 (如果不存在)
    database.exec(`
      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        income_id TEXT UNIQUE NOT NULL,
        user_id TEXT REFERENCES users(id),
        date TEXT NOT NULL,
        customer TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        tax_rate REAL DEFAULT 5,
        tax_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'bank_transfer',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ 收入表建立完成')

    // 建立支出表 (如果不存在)
    database.exec(`
      CREATE TABLE IF NOT EXISTS expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id TEXT UNIQUE NOT NULL,
        user_id TEXT REFERENCES users(id),
        date TEXT NOT NULL,
        vendor TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        tax_rate REAL DEFAULT 5,
        tax_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'bank_transfer',
        receipt_path TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ 支出表建立完成')

    // 建立公司資訊表 (如果不存在)
    database.exec(`
      CREATE TABLE IF NOT EXISTS company_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT REFERENCES users(id),
        name TEXT NOT NULL,
        tax_id TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        industry TEXT,
        establishment_date TEXT,
        capital REAL,
        employees INTEGER,
        company_name TEXT,
        contact_person TEXT,
        business_type TEXT,
        established_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ 公司資訊表建立完成')

    // 建立系統設定表
    database.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type TEXT DEFAULT 'string',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ 系統設定表建立完成')

    // 建立稅務資料表
    database.exec(`
      CREATE TABLE IF NOT EXISTS tax_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT REFERENCES users(id),
        period TEXT NOT NULL,
        output_tax_sales REAL DEFAULT 0,
        output_tax_amount REAL DEFAULT 0,
        input_tax_purchases REAL DEFAULT 0,
        input_tax_amount REAL DEFAULT 0,
        exempt_sales REAL DEFAULT 0,
        exempt_purchases REAL DEFAULT 0,
        zero_rate_sales REAL DEFAULT 0,
        non_deductible_tax REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ 稅務資料表建立完成')

    // 建立稅務計算記錄表
    database.exec(`
      CREATE TABLE IF NOT EXISTS tax_calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT REFERENCES users(id),
        calculation_type TEXT NOT NULL,
        input_data TEXT NOT NULL,
        result_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ 稅務計算記錄表建立完成')

    // 插入預設系統設定
    insertDefaultSettings(database)

    console.log('✅ 資料庫初始化完成')
  } catch (error) {
    console.error('資料庫初始化失敗:', error)
    throw error
  }
}

// 插入預設系統設定
const insertDefaultSettings = (database) => {
  const defaultSettings = [
    { key: 'currency', value: 'TWD', type: 'string', description: '預設貨幣' },
    { key: 'date_format', value: 'YYYY-MM-DD', type: 'string', description: '日期格式' },
    { key: 'timezone', value: 'Asia/Taipei', type: 'string', description: '時區設定' },
    { key: 'language', value: 'zh-TW', type: 'string', description: '語言設定' },
    { key: 'decimal_places', value: '2', type: 'number', description: '小數位數' },
    { key: 'auto_backup', value: 'true', type: 'boolean', description: '自動備份' },
    { key: 'backup_interval', value: '7', type: 'number', description: '備份間隔（天）' }
  ]

  const stmt = database.prepare(`
    INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, description) 
    VALUES (?, ?, ?, ?)
  `)

  defaultSettings.forEach(setting => {
    stmt.run(setting.key, setting.value, setting.type, setting.description)
  })

  console.log('✅ 預設系統設定插入完成')
}

// 通用查詢函數
export const query = (sql, params = []) => {
  const database = getDatabaseConnection()
  return database.prepare(sql).all(...params)
}

// 通用執行函數
export const run = (sql, params = []) => {
  const database = getDatabaseConnection()
  return database.prepare(sql).run(...params)
}

// 獲取單一記錄
export const get = (sql, params = []) => {
  const database = getDatabaseConnection()
  return database.prepare(sql).get(...params)
}

// 關閉資料庫連接
export const closeDatabase = () => {
  if (db) {
    db.close()
    db = null
    console.log('✅ 資料庫連接已關閉')
  }
}

// 備份資料庫
export const backupDatabase = (backupPath) => {
  try {
    const database = getDatabaseConnection()
    const backup = new Database(backupPath)
    database.backup(backup)
    backup.close()
    console.log(`✅ 資料庫備份完成: ${backupPath}`)
  } catch (error) {
    console.error('資料庫備份失敗:', error)
    throw error
  }
}

export { db }