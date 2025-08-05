import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 資料庫檔案路徑
const dbPath = path.join(__dirname, '../../database/fafa.db')

// 建立資料庫連接
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('資料庫連接失敗:', err.message)
  } else {
    console.log('✅ 成功連接到 SQLite 資料庫')
  }
})

// 初始化資料庫
export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    // 啟用外鍵約束
    db.run('PRAGMA foreign_keys = ON')
    
    // 建立收入表
    db.run(`
      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        income_id TEXT UNIQUE NOT NULL,
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
    `, (err) => {
      if (err) {
        console.error('建立收入表失敗:', err.message)
        reject(err)
      } else {
        console.log('✅ 收入表建立完成')
      }
    })

    // 建立支出表
    db.run(`
      CREATE TABLE IF NOT EXISTS expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id TEXT UNIQUE NOT NULL,
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
    `, (err) => {
      if (err) {
        console.error('建立支出表失敗:', err.message)
        reject(err)
      } else {
        console.log('✅ 支出表建立完成')
      }
    })

    // 建立公司資訊表
    db.run(`
      CREATE TABLE IF NOT EXISTS company_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        tax_id TEXT UNIQUE NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        website TEXT,
        industry TEXT,
        establishment_date TEXT,
        capital REAL,
        employees INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('建立公司資訊表失敗:', err.message)
        reject(err)
      } else {
        console.log('✅ 公司資訊表建立完成')
      }
    })

    // 建立系統設定表
    db.run(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type TEXT DEFAULT 'string',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('建立系統設定表失敗:', err.message)
        reject(err)
      } else {
        console.log('✅ 系統設定表建立完成')
        insertDefaultSettings()
      }
    })

    // 建立稅務資料表
    db.run(`
      CREATE TABLE IF NOT EXISTS tax_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(period)
      )
    `, (err) => {
      if (err) {
        console.error('建立稅務資料表失敗:', err.message)
        reject(err)
      } else {
        console.log('✅ 稅務資料表建立完成')
      }
    })

    // 建立稅務計算記錄表
    db.run(`
      CREATE TABLE IF NOT EXISTS tax_calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calculation_type TEXT NOT NULL,
        input_data TEXT NOT NULL,
        result_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('建立稅務計算記錄表失敗:', err.message)
        reject(err)
      } else {
        console.log('✅ 稅務計算記錄表建立完成')
      }
    })

    // 更新公司資訊表結構（如果需要）
    db.run(`
      ALTER TABLE company_info ADD COLUMN company_name TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('更新公司資訊表失敗:', err.message)
      }
    })

    db.run(`
      ALTER TABLE company_info ADD COLUMN contact_person TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('更新公司資訊表失敗:', err.message)
      }
    })

    db.run(`
      ALTER TABLE company_info ADD COLUMN business_type TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('更新公司資訊表失敗:', err.message)
      }
    })

    db.run(`
      ALTER TABLE company_info ADD COLUMN established_date TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('更新公司資訊表失敗:', err.message)
      }
      console.log('✅ 公司資訊表更新完成')
      resolve()
    })
  })
}

// 插入預設系統設定
const insertDefaultSettings = () => {
  const defaultSettings = [
    { key: 'currency', value: 'TWD', type: 'string', description: '預設貨幣' },
    { key: 'date_format', value: 'YYYY-MM-DD', type: 'string', description: '日期格式' },
    { key: 'timezone', value: 'Asia/Taipei', type: 'string', description: '時區設定' },
    { key: 'language', value: 'zh-TW', type: 'string', description: '語言設定' },
    { key: 'decimal_places', value: '2', type: 'number', description: '小數位數' },
    { key: 'auto_backup', value: 'true', type: 'boolean', description: '自動備份' },
    { key: 'backup_interval', value: '7', type: 'number', description: '備份間隔（天）' },
    { key: 'tax_year_start', value: '1', type: 'number', description: '稅務年度開始月份' },
    { key: 'fiscal_year_start', value: '1', type: 'number', description: '會計年度開始月份' },
    { key: 'default_income_categories', value: '["銷售收入", "服務收入", "其他收入"]', type: 'json', description: '預設收入類別' },
    { key: 'default_expense_categories', value: '["薪資費用", "租金費用", "水電費", "辦公用品", "交通費", "其他費用"]', type: 'json', description: '預設支出類別' },
    { key: 'notifications_email', value: 'true', type: 'boolean', description: '電子郵件通知' },
    { key: 'notifications_browser', value: 'true', type: 'boolean', description: '瀏覽器通知' },
    { key: 'notifications_overdue', value: 'true', type: 'boolean', description: '逾期提醒' },
    { key: 'notifications_monthly', value: 'true', type: 'boolean', description: '月報提醒' },
    { key: 'security_two_factor', value: 'false', type: 'boolean', description: '雙因素認證' },
    { key: 'security_session_timeout', value: '30', type: 'number', description: '會話超時（分鐘）' },
    { key: 'security_password_policy', value: 'medium', type: 'string', description: '密碼政策' }
  ]

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, description) 
    VALUES (?, ?, ?, ?)
  `)

  defaultSettings.forEach(setting => {
    stmt.run(setting.key, setting.value, setting.type, setting.description)
  })

  stmt.finalize()
  console.log('✅ 預設系統設定插入完成')
}

// 通用查詢函數
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

// 通用執行函數
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve({ id: this.lastID, changes: this.changes })
      }
    })
  })
}

// 獲取單一記錄
export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

// 關閉資料庫連接
export const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err)
      } else {
        console.log('✅ 資料庫連接已關閉')
        resolve()
      }
    })
  })
}

// 備份資料庫
export const backupDatabase = (backupPath) => {
  return new Promise((resolve, reject) => {
    const backup = new sqlite3.Database(backupPath)
    
    db.backup(backup)
      .then(() => {
        backup.close()
        console.log(`✅ 資料庫備份完成: ${backupPath}`)
        resolve()
      })
      .catch((err) => {
        backup.close()
        reject(err)
      })
  })
} 