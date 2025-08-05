import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, run, get } from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * 獲取公司資訊
 */
router.get('/company-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const companyInfo = await get(`
      SELECT 
        company_name,
        tax_id,
        address,
        phone,
        email,
        contact_person,
        business_type,
        established_date,
        updated_at
      FROM company_info
      WHERE user_id = ?
      LIMIT 1
    `, [userId]);
    
    res.json({
      success: true,
      data: companyInfo || {},
      message: '公司資訊獲取成功'
    });
  } catch (error) {
    console.error('獲取公司資訊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取公司資訊失敗',
      error: error.message
    });
  }
});

/**
 * 更新公司資訊
 */
router.put('/company-info', authenticateToken, [
  body('companyName').notEmpty().withMessage('公司名稱不能為空'),
  body('taxId').optional().isLength({ min: 8, max: 8 }).withMessage('統一編號必須為 8 位數字'),
  body('address').optional().isString().withMessage('地址格式不正確'),
  body('phone').optional().isString().withMessage('電話格式不正確'),
  body('email').optional().isEmail().withMessage('電子郵件格式不正確'),
  body('contactPerson').optional().isString().withMessage('聯絡人格式不正確'),
  body('businessType').optional().isString().withMessage('營業項目格式不正確'),
  body('establishedDate').optional().isISO8601().withMessage('成立日期格式不正確')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入資料驗證失敗',
        errors: errors.array()
      });
    }

    const {
      companyName,
      taxId,
      address,
      phone,
      email,
      contactPerson,
      businessType,
      establishedDate
    } = req.body;

    const userId = req.user.userId;
    
    // 檢查是否已有公司資訊
    const existing = await get('SELECT id FROM company_info WHERE user_id = ? LIMIT 1', [userId]);
    
    if (existing) {
      // 更新現有記錄
      await run(`
        UPDATE company_info SET
          company_name = ?,
          tax_id = ?,
          address = ?,
          phone = ?,
          email = ?,
          contact_person = ?,
          business_type = ?,
          established_date = ?,
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `, [
        companyName,
        taxId,
        address,
        phone,
        email,
        contactPerson,
        businessType,
        establishedDate,
        new Date().toISOString(),
        existing.id,
        userId
      ]);
    } else {
      // 創建新記錄
      await run(`
        INSERT INTO company_info (
          user_id,
          company_name,
          tax_id,
          address,
          phone,
          email,
          contact_person,
          business_type,
          established_date,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        companyName,
        taxId,
        address,
        phone,
        email,
        contactPerson,
        businessType,
        establishedDate,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    }

    res.json({
      success: true,
      message: '公司資訊更新成功'
    });
  } catch (error) {
    console.error('更新公司資訊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新公司資訊失敗',
      error: error.message
    });
  }
});

/**
 * 獲取系統設定
 */
router.get('/system-settings', authenticateToken, async (req, res) => {
  try {
    const settings = await query(`
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        description,
        updated_at
      FROM system_settings
      ORDER BY setting_key
    `);
    
    // 將設定轉換為物件格式
    const settingsObj = {};
    settings.forEach(setting => {
      let value = setting.setting_value;
      
      // 根據類型轉換值
      switch (setting.setting_type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseFloat(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = value;
          }
          break;
      }
      
      settingsObj[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
        updatedAt: setting.updated_at
      };
    });
    
    res.json({
      success: true,
      data: settingsObj,
      message: '系統設定獲取成功'
    });
  } catch (error) {
    console.error('獲取系統設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統設定失敗',
      error: error.message
    });
  }
});

/**
 * 更新系統設定
 */
router.put('/system-settings', authenticateToken, [
  body('settings').isObject().withMessage('設定必須為物件格式')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入資料驗證失敗',
        errors: errors.array()
      });
    }

    const { settings } = req.body;
    const updatedAt = new Date().toISOString();
    
    // 更新每個設定
    for (const [key, config] of Object.entries(settings)) {
      let value = config.value;
      
      // 根據類型轉換值
      if (config.type === 'json') {
        value = JSON.stringify(value);
      } else if (config.type === 'boolean') {
        value = value.toString();
      } else if (config.type === 'number') {
        value = value.toString();
      }
      
      await run(`
        UPDATE system_settings SET
          setting_value = ?,
          updated_at = ?
        WHERE setting_key = ?
      `, [value, updatedAt, key]);
    }

    res.json({
      success: true,
      message: '系統設定更新成功'
    });
  } catch (error) {
    console.error('更新系統設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新系統設定失敗',
      error: error.message
    });
  }
});

/**
 * 匯出資料
 */
router.get('/export-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { format = 'json' } = req.query;
    
    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({
        success: false,
        message: '不支援的匯出格式'
      });
    }
    
    // 獲取當前用戶的數據
    const userTables = ['income', 'expense', 'company_info', 'tax_calculations'];
    const exportData = {};
    
    for (const table of userTables) {
      const data = await query(`SELECT * FROM ${table} WHERE user_id = ?`, [userId]);
      exportData[table] = data;
    }
    
    // 系統設定不需要用戶隔離
    const systemSettings = await query(`SELECT * FROM system_settings`);
    exportData.system_settings = systemSettings;
    
    // 添加匯出資訊
    exportData.exportInfo = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      tables: userTables
    };
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="financial_data_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } else if (format === 'csv') {
      // 簡化的 CSV 匯出（實際應用中可能需要更複雜的 CSV 處理）
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="financial_data_${new Date().toISOString().split('T')[0]}.csv"`);
      
      let csvContent = 'Table,Data\n';
      csvContent += `export_info,${JSON.stringify(exportData.exportInfo)}\n`;
      
      for (const [table, data] of Object.entries(exportData)) {
        if (table !== 'exportInfo') {
          csvContent += `${table},${JSON.stringify(data)}\n`;
        }
      }
      
      res.send(csvContent);
    }
  } catch (error) {
    console.error('匯出資料錯誤:', error);
    res.status(500).json({
      success: false,
      message: '匯出資料失敗',
      error: error.message
    });
  }
});

/**
 * 匯入資料
 */
router.post('/import-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data, overwrite = false } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        message: '匯入資料格式不正確'
      });
    }
    
    // 開始交易
    await run('BEGIN TRANSACTION');
    
    try {
      const userTables = ['income', 'expense', 'company_info', 'tax_calculations'];
      const systemTables = ['system_settings'];
      
      // 處理用戶相關資料
      for (const table of userTables) {
        if (data[table] && Array.isArray(data[table])) {
          if (overwrite) {
            // 清空當前用戶的資料
            await run(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
          }
          
          // 匯入資料（確保綁定當前用戶）
          for (const record of data[table]) {
            const columns = Object.keys(record).filter(key => key !== 'id');
            if (!columns.includes('user_id')) {
              columns.push('user_id');
            }
            
            const values = columns.map(col => {
              if (col === 'user_id') {
                return userId;
              }
              return record[col];
            });
            const placeholders = columns.map(() => '?').join(', ');
            
            await run(`
              INSERT INTO ${table} (${columns.join(', ')}) 
              VALUES (${placeholders})
            `, values);
          }
        }
      }
      
      // 處理系統設定（僅管理員可匯入）
      // 這裡可以加入權限檢查
      
      // 提交交易
      await run('COMMIT');
      
      res.json({
        success: true,
        message: '資料匯入成功'
      });
    } catch (error) {
      // 回滾交易
      await run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('匯入資料錯誤:', error);
    res.status(500).json({
      success: false,
      message: '匯入資料失敗',
      error: error.message
    });
  }
});

/**
 * 創建資料備份
 */
router.post('/backup', authenticateToken, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    
    // 確保備份目錄存在
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup_${timestamp}.db`);
    
    // 複製資料庫檔案
    const dbPath = path.join(__dirname, '../../database/fafa.db');
    await fs.copyFile(dbPath, backupPath);
    
    // 記錄備份資訊
    await run(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_at = excluded.updated_at
    `, [
      'last_backup',
      timestamp,
      'string',
      '最後備份時間',
      new Date().toISOString()
    ]);
    
    res.json({
      success: true,
      data: {
        backupPath,
        timestamp,
        size: (await fs.stat(backupPath)).size
      },
      message: '資料備份成功'
    });
  } catch (error) {
    console.error('創建備份錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建備份失敗',
      error: error.message
    });
  }
});

/**
 * 獲取備份列表
 */
router.get('/backups', authenticateToken, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    
    try {
      await fs.access(backupDir);
    } catch {
      return res.json({
        success: true,
        data: [],
        message: '尚無備份檔案'
      });
    }
    
    const files = await fs.readdir(backupDir);
    const backups = [];
    
    for (const file of files) {
      if (file.endsWith('.db')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        });
      }
    }
    
    // 按修改時間排序（最新的在前）
    backups.sort((a, b) => b.modifiedAt - a.modifiedAt);
    
    res.json({
      success: true,
      data: backups,
      message: '備份列表獲取成功'
    });
  } catch (error) {
    console.error('獲取備份列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取備份列表失敗',
      error: error.message
    });
  }
});

/**
 * 還原備份
 */
router.post('/restore', authenticateToken, [
  body('backupFile').notEmpty().withMessage('備份檔案名稱不能為空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入資料驗證失敗',
        errors: errors.array()
      });
    }

    const { backupFile } = req.body;
    const backupDir = path.join(__dirname, '../../backups');
    const backupPath = path.join(backupDir, backupFile);
    const dbPath = path.join(__dirname, '../../database/fafa.db');
    
    // 檢查備份檔案是否存在
    try {
      await fs.access(backupPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: '備份檔案不存在'
      });
    }
    
    // 創建當前資料庫的備份
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupPath = path.join(backupDir, `pre_restore_${timestamp}.db`);
    await fs.copyFile(dbPath, currentBackupPath);
    
    // 還原備份
    await fs.copyFile(backupPath, dbPath);
    
    res.json({
      success: true,
      data: {
        restoredFile: backupFile,
        currentBackup: `pre_restore_${timestamp}.db`,
        timestamp
      },
      message: '資料還原成功'
    });
  } catch (error) {
    console.error('還原備份錯誤:', error);
    res.status(500).json({
      success: false,
      message: '還原備份失敗',
      error: error.message
    });
  }
});

/**
 * 刪除備份
 */
router.delete('/backups/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../../backups');
    const backupPath = path.join(backupDir, filename);
    
    // 檢查檔案是否存在
    try {
      await fs.access(backupPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: '備份檔案不存在'
      });
    }
    
    // 刪除檔案
    await fs.unlink(backupPath);
    
    res.json({
      success: true,
      message: '備份檔案刪除成功'
    });
  } catch (error) {
    console.error('刪除備份錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除備份失敗',
      error: error.message
    });
  }
});

/**
 * 獲取系統資訊
 */
router.get('/system-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 獲取當前用戶的數據統計
    const incomeCount = await get('SELECT COUNT(*) as count FROM income WHERE user_id = ?', [userId]);
    const expenseCount = await get('SELECT COUNT(*) as count FROM expense WHERE user_id = ?', [userId]);
    const taxCalculationCount = await get('SELECT COUNT(*) as count FROM tax_calculations WHERE user_id = ?', [userId]);
    
    // 獲取資料庫檔案大小
    const dbPath = path.join(__dirname, '../../database/fafa.db');
    let dbSize = 0;
    try {
      const stats = await fs.stat(dbPath);
      dbSize = stats.size;
    } catch (error) {
      console.error('獲取資料庫檔案大小錯誤:', error);
    }
    
    const systemInfo = {
      version: '1.0.0',
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      database: {
        size: dbSize,
        incomeRecords: incomeCount.count,
        expenseRecords: expenseCount.count,
        taxCalculations: taxCalculationCount.count
      },
      lastBackup: null
    };
    
    // 獲取最後備份時間
    const lastBackup = await get(`
      SELECT setting_value FROM system_settings 
      WHERE setting_key = 'last_backup'
    `);
    
    if (lastBackup) {
      systemInfo.lastBackup = lastBackup.setting_value;
    }
    
    res.json({
      success: true,
      data: systemInfo,
      message: '系統資訊獲取成功'
    });
  } catch (error) {
    console.error('獲取系統資訊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取系統資訊失敗',
      error: error.message
    });
  }
});

/**
 * 重置系統設定
 */
router.post('/reset-settings', authenticateToken, async (req, res) => {
  try {
    // 重置系統設定為預設值
    const defaultSettings = [
      ['currency', 'TWD', 'string', '預設貨幣'],
      ['date_format', 'YYYY-MM-DD', 'string', '日期格式'],
      ['decimal_places', '2', 'number', '小數位數'],
      ['auto_backup', 'true', 'boolean', '自動備份'],
      ['backup_interval', '7', 'number', '備份間隔（天）'],
      ['tax_year_start', '1', 'number', '稅務年度開始月份'],
      ['fiscal_year_start', '1', 'number', '會計年度開始月份'],
      ['default_income_categories', JSON.stringify(['銷售收入', '服務收入', '其他收入']), 'json', '預設收入類別'],
      ['default_expense_categories', JSON.stringify(['薪資費用', '租金費用', '水電費', '辦公用品', '交通費', '其他費用']), 'json', '預設支出類別']
    ];
    
    for (const [key, value, type, description] of defaultSettings) {
      await run(`
        INSERT OR REPLACE INTO system_settings (
          setting_key, setting_value, setting_type, description, updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `, [key, value, type, description, new Date().toISOString()]);
    }
    
    res.json({
      success: true,
      message: '系統設定重置成功'
    });
  } catch (error) {
    console.error('重置系統設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '重置系統設定失敗',
      error: error.message
    });
  }
});

export default router; 